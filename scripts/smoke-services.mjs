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
    p_name: "Smoke Services",
    p_slug: `smoke-sv-${stamp}`,
  });
  if (tErr) throw tErr;
  tenantId = tenant.id;

  // category + service
  const { data: cat, error: catErr } = await owner
    .from("service_categories")
    .insert({ tenant_id: tenantId, name: "Cortes" })
    .select()
    .single();
  if (catErr) throw catErr;

  const { data: svc, error: svcErr } = await owner
    .from("services")
    .insert({
      tenant_id: tenantId,
      category_id: cat.id,
      name: "Corte clásico",
      duration_minutes: 30,
      price: 25000,
      commission_rate: 40,
      tax_rate: 19,
    })
    .select()
    .single();
  if (svcErr) throw svcErr;
  console.log("service created:", svc.name, svc.price);

  // negative price rejected by check constraint
  const { error: negErr } = await owner.from("services").insert({
    tenant_id: tenantId,
    name: "Precio negativo",
    duration_minutes: 30,
    price: -5,
  });
  if (!negErr) throw new Error("negative price allowed");
  console.log("negative price rejected OK");

  // barber user with profile + own time off
  const { data: b } = await admin.auth.admin.createUser({
    email: `smoke-barber+${stamp}@example.com`,
    password,
    email_confirm: true,
  });
  cleanupUsers.push(b.user.id);
  const { data: mem, error: memErr } = await owner
    .from("memberships")
    .insert({ tenant_id: tenantId, user_id: b.user.id, role: "barber" })
    .select()
    .single();
  if (memErr) throw memErr;

  const { error: bpErr } = await owner.from("barber_profiles").insert({
    membership_id: mem.id,
    tenant_id: tenantId,
    specialties: ["fade", "barba"],
    commission_rate: 45,
  });
  if (bpErr) throw bpErr;
  console.log("barber profile created OK");

  // barber links own allowed service? (manager-only) — barber blocked
  const barber = anonClient();
  await barber.auth.signInWithPassword({ email: b.user.email, password });

  const { error: bsErr } = await barber.from("barber_services").insert({
    membership_id: mem.id,
    service_id: svc.id,
    tenant_id: tenantId,
  });
  if (!bsErr) throw new Error("RLS FAIL: barber self-assigned service");
  console.log("barber blocked from barber_services OK");

  // barber cannot create services
  const { error: svcDenied } = await barber.from("services").insert({
    tenant_id: tenantId,
    name: "Servicio pirata",
    duration_minutes: 30,
    price: 1,
  });
  if (!svcDenied) throw new Error("RLS FAIL: barber created service");
  console.log("barber blocked from services OK");

  // barber requests own time off (status forced pending by policy)
  const { data: to, error: toErr } = await barber
    .from("time_off")
    .insert({
      tenant_id: tenantId,
      membership_id: mem.id,
      starts_on: "2026-08-01",
      ends_on: "2026-08-03",
      reason: "Vacaciones",
    })
    .select()
    .single();
  if (toErr) throw toErr;
  if (to.status !== "pending") throw new Error("time off not pending");
  console.log("barber requested time off OK");

  // barber cannot self-approve
  const { data: selfApproved } = await barber
    .from("time_off")
    .update({ status: "approved" })
    .eq("id", to.id)
    .select();
  if (selfApproved && selfApproved.length > 0) {
    throw new Error("RLS FAIL: barber self-approved time off");
  }
  console.log("barber blocked from self-approval OK");

  // owner approves
  const { data: approved, error: apErr } = await owner
    .from("time_off")
    .update({ status: "approved" })
    .eq("id", to.id)
    .select()
    .single();
  if (apErr) throw apErr;
  if (approved.status !== "approved") throw new Error("approval failed");
  console.log("owner approved time off OK");

  // barber updates own profile bio (allowed by policy)
  const { error: ownBioErr } = await barber
    .from("barber_profiles")
    .update({ bio: "10 años de experiencia" })
    .eq("membership_id", mem.id);
  if (ownBioErr) throw ownBioErr;
  console.log("barber updated own profile OK");

  console.log("smoke-services passed");
} finally {
  if (tenantId) await admin.from("tenants").delete().eq("id", tenantId);
  for (const uid of cleanupUsers) {
    await admin.auth.admin.deleteUser(uid);
  }
}
