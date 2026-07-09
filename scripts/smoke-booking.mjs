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
const slug = `smoke-bk-${stamp}`;

// tomorrow, skipping sunday (default schedule closes sundays)
function nextBookableDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  if (d.getDay() === 0) d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

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
    p_name: "Smoke Booking",
    p_slug: slug,
  });
  if (tErr) throw tErr;
  tenantId = tenant.id;

  const { data: b } = await admin.auth.admin.createUser({
    email: `smoke-barber+${stamp}@example.com`,
    password,
    email_confirm: true,
  });
  cleanupUsers.push(b.user.id);
  const { data: mem } = await owner
    .from("memberships")
    .insert({ tenant_id: tenantId, user_id: b.user.id, role: "barber" })
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

  // ---- anonymous client from here on ----
  const anon = anonClient();

  // public info
  const { data: info, error: infoErr } = await anon.rpc("get_booking_info", {
    p_slug: slug,
  });
  if (infoErr) throw infoErr;
  if (info.tenant.slug !== slug) throw new Error("booking info wrong tenant");
  if (info.services.length !== 1 || info.barbers.length !== 1) {
    throw new Error("booking info incomplete");
  }
  console.log("get_booking_info OK");

  const date = nextBookableDate();
  const { data: slots, error: slotsErr } = await anon.rpc("available_slots", {
    p_tenant_id: tenantId,
    p_service_id: svc.id,
    p_membership_id: mem.id,
    p_date: date,
  });
  if (slotsErr) throw slotsErr;
  if (!slots || slots.length === 0) throw new Error("no slots returned");
  console.log(`available_slots OK (${slots.length} slots on ${date})`);

  const first = slots[0].slot_start;

  // anonymous booking
  const { data: apptId, error: bookErr } = await anon.rpc("book_appointment", {
    p_slug: slug,
    p_service_id: svc.id,
    p_membership_id: mem.id,
    p_starts_at: first,
    p_client_name: "Cliente Web",
    p_client_email: `web+${stamp}@example.com`,
    p_client_phone: "3000000000",
  });
  if (bookErr) throw bookErr;
  console.log("anonymous booking OK:", apptId);

  // slot disappears
  const { data: slots2 } = await anon.rpc("available_slots", {
    p_tenant_id: tenantId,
    p_service_id: svc.id,
    p_membership_id: mem.id,
    p_date: date,
  });
  if (slots2.some((s) => s.slot_start === first)) {
    throw new Error("booked slot still available");
  }
  console.log("booked slot removed from availability OK");

  // double booking same slot rejected
  const { error: dupErr } = await anon.rpc("book_appointment", {
    p_slug: slug,
    p_service_id: svc.id,
    p_membership_id: mem.id,
    p_starts_at: first,
    p_client_name: "Otro Cliente",
    p_client_email: `otro+${stamp}@example.com`,
    p_client_phone: null,
  });
  if (!dupErr) throw new Error("double booking allowed");
  console.log("double booking rejected OK:", dupErr.message);

  // repeat client by email reused, not duplicated
  const second = slots2.find((s) => s.slot_start !== first).slot_start;
  const { error: book2Err } = await anon.rpc("book_appointment", {
    p_slug: slug,
    p_service_id: svc.id,
    p_membership_id: mem.id,
    p_starts_at: second,
    p_client_name: "Cliente Web",
    p_client_email: `WEB+${stamp}@example.com`,
    p_client_phone: null,
  });
  if (book2Err) throw book2Err;
  const { data: clientRows } = await admin
    .from("clients")
    .select("id")
    .eq("tenant_id", tenantId)
    .ilike("email", `web+${stamp}@example.com`);
  if (clientRows.length !== 1) throw new Error("client duplicated");
  console.log("repeat client reused OK");

  // invalid slot (arbitrary time) rejected
  const { error: badSlotErr } = await anon.rpc("book_appointment", {
    p_slug: slug,
    p_service_id: svc.id,
    p_membership_id: mem.id,
    p_starts_at: `${date}T03:07:00-05:00`,
    p_client_name: "Madrugador",
    p_client_email: `madruga+${stamp}@example.com`,
    p_client_phone: null,
  });
  if (!badSlotErr) throw new Error("off-hours booking allowed");
  console.log("off-hours booking rejected OK");

  // anon still cannot read tables directly
  const { data: leak } = await anon
    .from("appointments")
    .select("id")
    .eq("tenant_id", tenantId);
  if (leak && leak.length > 0) throw new Error("RLS LEAK: anon reads appointments");
  console.log("anon direct table access blocked OK");

  console.log("smoke-booking passed");
} finally {
  if (tenantId) await admin.from("tenants").delete().eq("id", tenantId);
  for (const uid of cleanupUsers) {
    await admin.auth.admin.deleteUser(uid);
  }
}
