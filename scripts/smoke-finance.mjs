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
    p_name: "Smoke Finance",
    p_slug: `smoke-fin-${stamp}`,
  });
  if (tErr) throw tErr;
  tenantId = tenant.id;

  // income: one 30000 sale
  const { data: svc } = await owner
    .from("services")
    .insert({
      tenant_id: tenantId,
      name: "Corte",
      duration_minutes: 30,
      price: 30000,
    })
    .select()
    .single();
  const { data: sessionId } = await owner.rpc("open_cash_session", {
    p_tenant_id: tenantId,
    p_branch_id: null,
    p_opening_amount: 0,
  });
  const { error: saleErr } = await owner.rpc("create_sale", {
    p_tenant_id: tenantId,
    p_session_id: sessionId,
    p_payload: {
      items: [{ type: "service", id: svc.id, quantity: 1, discount: 0 }],
      payments: [{ method: "cash", amount: 30000 }],
    },
  });
  if (saleErr) throw saleErr;

  // expenses: category + 2 expenses
  const { data: cat, error: catErr } = await owner
    .from("expense_categories")
    .insert({ tenant_id: tenantId, name: "Arriendo" })
    .select()
    .single();
  if (catErr) throw catErr;

  const { error: e1Err } = await owner.from("expenses").insert({
    tenant_id: tenantId,
    description: "Arriendo local",
    amount: 10000,
    category_id: cat.id,
    spent_on: today,
  });
  if (e1Err) throw e1Err;
  const { error: e2Err } = await owner.from("expenses").insert({
    tenant_id: tenantId,
    description: "Café",
    amount: 2000,
    spent_on: today,
  });
  if (e2Err) throw e2Err;

  const { data: summary, error: sumErr } = await owner.rpc(
    "finance_summary",
    { p_tenant_id: tenantId, p_from: today, p_to: today },
  );
  if (sumErr) throw sumErr;

  if (Number(summary.income) !== 30000) {
    throw new Error(`income ${summary.income} != 30000`);
  }
  if (Number(summary.expenses) !== 12000) {
    throw new Error(`expenses ${summary.expenses} != 12000`);
  }
  console.log("summary OK: income 30000, expenses 12000, balance 18000");

  const day = summary.by_day.find((d) => d.day === today);
  if (!day || Number(day.income) !== 30000 || Number(day.expense) !== 12000) {
    throw new Error(`by_day wrong: ${JSON.stringify(summary.by_day)}`);
  }
  console.log("daily cash flow OK");

  const arr = summary.expenses_by_category.find(
    (c) => c.category === "Arriendo",
  );
  const sin = summary.expenses_by_category.find(
    (c) => c.category === "Sin categoría",
  );
  if (Number(arr?.amount) !== 10000 || Number(sin?.amount) !== 2000) {
    throw new Error("expenses_by_category wrong");
  }
  console.log("expenses by category OK");

  // barber blocked
  const { data: b } = await admin.auth.admin.createUser({
    email: `smoke-barber+${stamp}@example.com`,
    password,
    email_confirm: true,
  });
  cleanupUsers.push(b.user.id);
  await owner.from("memberships").insert({
    tenant_id: tenantId,
    user_id: b.user.id,
    role: "barber",
  });
  const barber = anonClient();
  await barber.auth.signInWithPassword({ email: b.user.email, password });
  const { error: barberErr } = await barber.rpc("finance_summary", {
    p_tenant_id: tenantId,
    p_from: today,
    p_to: today,
  });
  if (!barberErr || !barberErr.message.includes("forbidden")) {
    throw new Error("barber accessed finance");
  }
  const { error: barberExpErr } = await barber.from("expenses").insert({
    tenant_id: tenantId,
    description: "Gasto pirata",
    amount: 1,
  });
  if (!barberExpErr) throw new Error("barber created expense");
  console.log("barber blocked from finance OK");

  console.log("smoke-finance passed");
} finally {
  if (tenantId) await admin.from("tenants").delete().eq("id", tenantId);
  for (const uid of cleanupUsers) {
    await admin.auth.admin.deleteUser(uid);
  }
}
