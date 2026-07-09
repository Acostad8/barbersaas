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
// tenant timezone is America/Bogota; UTC date can be tomorrow there
const today = new Date().toLocaleDateString("en-CA", {
  timeZone: "America/Bogota",
});

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
    p_name: "Smoke Reports",
    p_slug: `smoke-rep-${stamp}`,
  });
  if (tErr) throw tErr;
  tenantId = tenant.id;

  // catalog + session + two sales
  const { data: svc } = await owner
    .from("services")
    .insert({
      tenant_id: tenantId,
      name: "Corte",
      duration_minutes: 30,
      price: 20000,
      commission_rate: 50,
    })
    .select()
    .single();

  const { data: sessionId } = await owner.rpc("open_cash_session", {
    p_tenant_id: tenantId,
    p_branch_id: null,
    p_opening_amount: 0,
  });

  await owner.rpc("create_sale", {
    p_tenant_id: tenantId,
    p_session_id: sessionId,
    p_payload: {
      items: [{ type: "service", id: svc.id, quantity: 1, discount: 0 }],
      payments: [{ method: "cash", amount: 20000 }],
    },
  });
  const { error: sale2Err } = await owner.rpc("create_sale", {
    p_tenant_id: tenantId,
    p_session_id: sessionId,
    p_payload: {
      items: [{ type: "service", id: svc.id, quantity: 2, discount: 0 }],
      payments: [{ method: "card", amount: 45000 }],
      tip: 5000,
    },
  });
  if (sale2Err) throw sale2Err;

  // completed appointment for commissions (50% of 20000 = 10000)
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
    .insert({ tenant_id: tenantId, full_name: "Cliente Rep" })
    .select()
    .single();
  const { data: appt } = await owner
    .from("appointments")
    .insert({
      tenant_id: tenantId,
      client_id: cl.id,
      membership_id: mem.id,
      service_id: svc.id,
      starts_at: `${today}T10:00:00-05:00`,
      ends_at: `${today}T10:30:00-05:00`,
      price: 20000,
      status: "confirmed",
    })
    .select()
    .single();
  await owner
    .from("appointments")
    .update({ status: "in_progress" })
    .eq("id", appt.id);
  await owner
    .from("appointments")
    .update({ status: "completed" })
    .eq("id", appt.id);

  // report
  const { data: report, error: repErr } = await owner.rpc("report_dashboard", {
    p_tenant_id: tenantId,
    p_from: today,
    p_to: today,
  });
  if (repErr) throw repErr;

  if (report.summary.sales_count !== 2) {
    throw new Error(`sales_count ${report.summary.sales_count} != 2`);
  }
  if (Number(report.summary.gross_total) !== 65000) {
    throw new Error(`gross_total ${report.summary.gross_total} != 65000`);
  }
  if (Number(report.summary.tips) !== 5000) {
    throw new Error(`tips ${report.summary.tips} != 5000`);
  }
  console.log("summary OK: 2 sales, 65000 gross, 5000 tips");

  const cash = report.by_method.find((m) => m.method === "cash");
  const card = report.by_method.find((m) => m.method === "card");
  if (Number(cash.amount) !== 20000 || Number(card.amount) !== 45000) {
    throw new Error("by_method amounts wrong");
  }
  console.log("by_method OK");

  if (
    report.top_services.length !== 1 ||
    Number(report.top_services[0].quantity) !== 3
  ) {
    throw new Error("top_services wrong");
  }
  console.log("top_services OK (3 cortes)");

  const comm = report.commissions[0];
  if (!comm || Number(comm.commission) !== 10000) {
    throw new Error(`commission ${comm?.commission} != 10000`);
  }
  console.log("commissions OK (50% de 20000 = 10000)");

  if (report.appointments.completed !== 1) {
    throw new Error("appointments.completed != 1");
  }
  console.log("appointments block OK");

  // barber (no reports:view) blocked
  const barber = anonClient();
  await barber.auth.signInWithPassword({ email: b.user.email, password });
  const { error: barberErr } = await barber.rpc("report_dashboard", {
    p_tenant_id: tenantId,
    p_from: today,
    p_to: today,
  });
  if (!barberErr || !barberErr.message.includes("forbidden")) {
    throw new Error("barber accessed reports");
  }
  console.log("barber blocked from reports OK");

  console.log("smoke-reports passed");
} finally {
  if (tenantId) await admin.from("tenants").delete().eq("id", tenantId);
  for (const uid of cleanupUsers) {
    await admin.auth.admin.deleteUser(uid);
  }
}
