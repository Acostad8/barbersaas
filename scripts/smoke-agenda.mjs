import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env", "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => l.split(/=(.*)/s).slice(0, 2)),
);

const admin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

function anonClient() {
  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

const stamp = Date.now();
const password = "Smoke-Test-1234";
const cleanupUsers = [];
let tenantId = null;

try {
  const { data: a } = await admin.auth.admin.createUser({
    email: `smoke-owner+${stamp}@example.com`,
    password,
    email_confirm: true,
  });
  cleanupUsers.push(a.user.id);
  const owner = anonClient();
  await owner.auth.signInWithPassword({ email: a.user.email, password });
  const { data: tenant, error: tErr } = await owner.rpc("create_tenant", {
    p_name: "Smoke Agenda",
    p_slug: `smoke-ag-${stamp}`,
  });
  if (tErr) throw tErr;
  tenantId = tenant.id;

  // setup: barber + second barber + client + service
  const { data: b1 } = await admin.auth.admin.createUser({
    email: `smoke-b1+${stamp}@example.com`,
    password,
    email_confirm: true,
  });
  cleanupUsers.push(b1.user.id);
  const { data: b2 } = await admin.auth.admin.createUser({
    email: `smoke-b2+${stamp}@example.com`,
    password,
    email_confirm: true,
  });
  cleanupUsers.push(b2.user.id);

  const { data: mem1 } = await owner
    .from("memberships")
    .insert({ tenant_id: tenantId, user_id: b1.user.id, role: "barber" })
    .select()
    .single();
  const { data: mem2 } = await owner
    .from("memberships")
    .insert({ tenant_id: tenantId, user_id: b2.user.id, role: "barber" })
    .select()
    .single();

  const { data: client } = await owner
    .from("clients")
    .insert({ tenant_id: tenantId, full_name: "Cliente Agenda" })
    .select()
    .single();

  const { data: svc } = await owner
    .from("services")
    .insert({
      tenant_id: tenantId,
      name: "Corte",
      duration_minutes: 30,
      price: 20000,
    })
    .select()
    .single();

  const base = {
    tenant_id: tenantId,
    client_id: client.id,
    service_id: svc.id,
    price: svc.price,
  };

  // appointment 10:00-10:30 barber1
  const { data: appt1, error: a1Err } = await owner
    .from("appointments")
    .insert({
      ...base,
      membership_id: mem1.id,
      starts_at: "2026-08-03T10:00:00-05:00",
      ends_at: "2026-08-03T10:30:00-05:00",
    })
    .select()
    .single();
  if (a1Err) throw a1Err;
  console.log("appointment created:", appt1.id);

  // overlap same barber 10:15 → must fail (exclusion constraint)
  const { error: overlapErr } = await owner.from("appointments").insert({
    ...base,
    membership_id: mem1.id,
    starts_at: "2026-08-03T10:15:00-05:00",
    ends_at: "2026-08-03T10:45:00-05:00",
  });
  if (!overlapErr || overlapErr.code !== "23P01") {
    throw new Error(`overlap not blocked: ${overlapErr?.code}`);
  }
  console.log("double-booking blocked by exclusion constraint OK");

  // same slot other barber → allowed
  const { error: otherBarberErr } = await owner.from("appointments").insert({
    ...base,
    membership_id: mem2.id,
    starts_at: "2026-08-03T10:15:00-05:00",
    ends_at: "2026-08-03T10:45:00-05:00",
  });
  if (otherBarberErr) throw otherBarberErr;
  console.log("parallel appointment with another barber OK");

  // cancel appt1, then same slot barber1 → allowed (constraint ignores cancelled)
  await owner
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", appt1.id);
  const { error: afterCancelErr } = await owner.from("appointments").insert({
    ...base,
    membership_id: mem1.id,
    starts_at: "2026-08-03T10:00:00-05:00",
    ends_at: "2026-08-03T10:30:00-05:00",
  });
  if (afterCancelErr) throw afterCancelErr;
  console.log("slot reusable after cancellation OK");

  // barber1 sees only own appointments
  const barber1 = anonClient();
  await barber1.auth.signInWithPassword({ email: b1.user.email, password });
  const { data: seen } = await barber1
    .from("appointments")
    .select("id, membership_id")
    .eq("tenant_id", tenantId);
  if (!seen || seen.length === 0) throw new Error("barber sees nothing");
  if (seen.some((r) => r.membership_id !== mem1.id)) {
    throw new Error("RLS FAIL: barber sees other barbers appointments");
  }
  console.log("barber sees only own appointments OK");

  // barber cannot create appointments
  const { error: barberCreateErr } = await barber1
    .from("appointments")
    .insert({
      ...base,
      membership_id: mem1.id,
      starts_at: "2026-08-03T15:00:00-05:00",
      ends_at: "2026-08-03T15:30:00-05:00",
    });
  if (!barberCreateErr) throw new Error("RLS FAIL: barber created appointment");
  console.log("barber blocked from creating appointments OK");

  console.log("smoke-agenda passed");
} finally {
  if (tenantId) await admin.from("tenants").delete().eq("id", tenantId);
  for (const uid of cleanupUsers) {
    await admin.auth.admin.deleteUser(uid);
  }
}
