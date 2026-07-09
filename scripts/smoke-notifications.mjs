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
    p_name: "Smoke Notif",
    p_slug: `smoke-ntf-${stamp}`,
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
  const { data: cl } = await owner
    .from("clients")
    .insert({ tenant_id: tenantId, full_name: "Cliente Notif" })
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

  // create appointment → trigger should emit notifications
  const { data: appt, error: apErr } = await owner
    .from("appointments")
    .insert({
      tenant_id: tenantId,
      client_id: cl.id,
      membership_id: mem.id,
      service_id: svc.id,
      starts_at: "2026-08-10T10:00:00-05:00",
      ends_at: "2026-08-10T10:30:00-05:00",
      price: 20000,
    })
    .select()
    .single();
  if (apErr) throw apErr;

  // owner (front desk) sees the tenant-wide notification
  const { data: ownerNotifs, error: onErr } = await owner
    .from("notifications")
    .select("*")
    .eq("tenant_id", tenantId);
  if (onErr) throw onErr;
  if (!ownerNotifs.some((n) => n.kind === "appointment_created" && n.user_id === null)) {
    throw new Error("tenant-wide creation notification missing");
  }
  console.log("owner sees tenant-wide notification OK");

  // barber sees his personal one but NOT tenant-wide (not front desk)
  const barber = anonClient();
  await barber.auth.signInWithPassword({ email: b.user.email, password });
  const { data: barberNotifs } = await barber
    .from("notifications")
    .select("*")
    .eq("tenant_id", tenantId);
  if (!barberNotifs.some((n) => n.user_id === b.user.id && n.kind === "appointment_created")) {
    throw new Error("barber personal notification missing");
  }
  if (barberNotifs.some((n) => n.user_id === null)) {
    throw new Error("RLS FAIL: barber sees tenant-wide notifications");
  }
  console.log("barber sees only personal notification OK");

  // cancel → cancellation notification for barber
  await owner
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", appt.id);
  const { data: afterCancel } = await barber
    .from("notifications")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("kind", "appointment_cancelled");
  if (afterCancel.length !== 1) {
    throw new Error("cancellation notification missing");
  }
  console.log("cancellation notification OK");

  // barber marks all read
  const { error: readErr } = await barber.rpc("mark_notifications_read", {
    p_tenant_id: tenantId,
  });
  if (readErr) throw readErr;
  const { data: unread } = await barber
    .from("notifications")
    .select("id")
    .eq("tenant_id", tenantId)
    .is("read_at", null);
  if (unread.length !== 0) throw new Error("mark read failed");
  console.log("mark all read OK");

  console.log("smoke-notifications passed");
} finally {
  if (tenantId) await admin.from("tenants").delete().eq("id", tenantId);
  for (const uid of cleanupUsers) {
    await admin.auth.admin.deleteUser(uid);
  }
}
