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
    p_name: "Smoke POS",
    p_slug: `smoke-pos-${stamp}`,
  });
  if (tErr) throw tErr;
  tenantId = tenant.id;

  // catalog: service 25000 (tax 19%), product 15000 with stock 10
  const { data: svc } = await owner
    .from("services")
    .insert({
      tenant_id: tenantId,
      name: "Corte",
      duration_minutes: 30,
      price: 25000,
      tax_rate: 19,
    })
    .select()
    .single();
  const { data: prod } = await owner
    .from("products")
    .insert({ tenant_id: tenantId, name: "Cera", cost: 8000, price: 15000 })
    .select()
    .single();
  await owner.from("stock_movements").insert({
    tenant_id: tenantId,
    product_id: prod.id,
    movement_type: "purchase",
    quantity: 10,
  });

  // sale without session must fail
  const { error: noSessionErr } = await owner.rpc("create_sale", {
    p_tenant_id: tenantId,
    p_session_id: "00000000-0000-0000-0000-000000000000",
    p_payload: {
      items: [{ type: "service", id: svc.id, quantity: 1, discount: 0 }],
      payments: [{ method: "cash", amount: 29750 }],
    },
  });
  if (!noSessionErr) throw new Error("sale without session allowed");
  console.log("sale without open session rejected OK");

  // open session
  const { data: sessionId, error: openErr } = await owner.rpc(
    "open_cash_session",
    { p_tenant_id: tenantId, p_branch_id: null, p_opening_amount: 50000 },
  );
  if (openErr) throw openErr;
  console.log("cash session opened OK");

  // duplicate open session blocked
  const { error: dupSessionErr } = await owner.rpc("open_cash_session", {
    p_tenant_id: tenantId,
    p_branch_id: null,
    p_opening_amount: 0,
  });
  if (!dupSessionErr || !dupSessionErr.message.includes("session_already_open")) {
    throw new Error("duplicate session not blocked");
  }
  console.log("second open session blocked OK");

  // sale: 1 corte (25000 +19% = 29750) + 2 ceras (30000) - 5000 disc + tip 3000
  // expected: subtotal 55000, discount 5000, tax 4750, tip 3000, total 57750
  const expectedTotal = 25000 * 1.19 + (30000 - 5000) + 3000;

  // wrong payment sum rejected
  const { error: mismatchErr } = await owner.rpc("create_sale", {
    p_tenant_id: tenantId,
    p_session_id: sessionId,
    p_payload: {
      items: [
        { type: "service", id: svc.id, quantity: 1, discount: 0 },
        { type: "product", id: prod.id, quantity: 2, discount: 5000 },
      ],
      payments: [{ method: "cash", amount: 10000 }],
      tip: 3000,
    },
  });
  if (!mismatchErr || !mismatchErr.message.includes("payments_mismatch")) {
    throw new Error(`payment mismatch not blocked: ${mismatchErr?.message}`);
  }
  console.log("payment mismatch rejected OK");

  // stock unchanged after failed sale (atomicity)
  const { data: lvl0 } = await admin
    .from("stock_levels")
    .select("quantity")
    .eq("product_id", prod.id)
    .single();
  if (Number(lvl0.quantity) !== 10) {
    throw new Error(`atomicity broken: stock ${lvl0.quantity} after failed sale`);
  }
  console.log("failed sale left no side effects OK");

  // correct multi-method sale
  const { data: sale, error: saleErr } = await owner.rpc("create_sale", {
    p_tenant_id: tenantId,
    p_session_id: sessionId,
    p_payload: {
      items: [
        { type: "service", id: svc.id, quantity: 1, discount: 0 },
        { type: "product", id: prod.id, quantity: 2, discount: 5000 },
      ],
      payments: [
        { method: "cash", amount: 30000 },
        { method: "card", amount: expectedTotal - 30000 },
      ],
      tip: 3000,
    },
  });
  if (saleErr) throw saleErr;
  if (Number(sale.total) !== expectedTotal) {
    throw new Error(`total mismatch: ${sale.total} vs ${expectedTotal}`);
  }
  if (sale.sale_number !== 1) throw new Error("sale number should be 1");
  console.log(`sale #${sale.sale_number} created, total ${sale.total} OK`);

  // stock deducted to 8
  const { data: lvl1 } = await admin
    .from("stock_levels")
    .select("quantity")
    .eq("product_id", prod.id)
    .single();
  if (Number(lvl1.quantity) !== 8) {
    throw new Error(`stock should be 8, got ${lvl1.quantity}`);
  }
  console.log("stock deducted by sale OK");

  // second sale increments number
  const { data: sale2 } = await owner.rpc("create_sale", {
    p_tenant_id: tenantId,
    p_session_id: sessionId,
    p_payload: {
      items: [{ type: "product", id: prod.id, quantity: 1, discount: 0 }],
      payments: [{ method: "cash", amount: 15000 }],
    },
  });
  if (sale2.sale_number !== 2) throw new Error("sale numbering broken");
  console.log("sale numbering sequential OK");

  // close session: cash = 30000 + 15000; expected = 50000 + 45000 = 95000
  const { data: closed, error: closeErr } = await owner.rpc(
    "close_cash_session",
    { p_session_id: sessionId, p_closing_amount: 94000, p_notes: "faltan 1000" },
  );
  if (closeErr) throw closeErr;
  if (Number(closed.expected_amount) !== 95000) {
    throw new Error(`expected_amount wrong: ${closed.expected_amount}`);
  }
  console.log("session closed, arqueo expected 95000 OK");

  // barber cannot sell
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
  const { error: barberSellErr } = await barber.rpc("open_cash_session", {
    p_tenant_id: tenantId,
    p_branch_id: null,
    p_opening_amount: 0,
  });
  if (!barberSellErr || !barberSellErr.message.includes("forbidden")) {
    throw new Error("barber opened cash session");
  }
  console.log("barber blocked from POS OK");

  console.log("smoke-pos passed");
} finally {
  if (tenantId) await admin.from("tenants").delete().eq("id", tenantId);
  for (const uid of cleanupUsers) {
    await admin.auth.admin.deleteUser(uid);
  }
}
