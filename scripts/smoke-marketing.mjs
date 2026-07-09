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
    p_name: "Smoke Marketing",
    p_slug: `smoke-mkt-${stamp}`,
  });
  if (tErr) throw tErr;
  tenantId = tenant.id;

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
  const { data: cl } = await owner
    .from("clients")
    .insert({ tenant_id: tenantId, full_name: "Cliente Fiel" })
    .select()
    .single();

  // loyalty: 1 point per 1000
  const { error: loyErr } = await owner.from("loyalty_settings").insert({
    tenant_id: tenantId,
    enabled: true,
    earn_rate: 0.001,
  });
  if (loyErr) throw loyErr;

  // coupons
  // NOTE: mixed-shape bulk inserts send null for missing keys (not the
  // column default), so every row carries the full shape.
  const couponBase = {
    tenant_id: tenantId,
    min_purchase: 0,
    max_uses: null,
    valid_from: null,
    valid_until: null,
  };
  const { error: coupErr } = await owner.from("coupons").insert([
    { ...couponBase, code: "DESC10", discount_type: "percent", discount_value: 10 },
    { ...couponBase, code: "FIJO5000", discount_type: "fixed", discount_value: 5000, max_uses: 1 },
    { ...couponBase, code: "VENCIDO", discount_type: "percent", discount_value: 50, valid_until: "2020-01-01" },
    { ...couponBase, code: "MINIMO", discount_type: "fixed", discount_value: 1000, min_purchase: 100000 },
  ]);
  if (coupErr) throw coupErr;

  const { data: sessionId } = await owner.rpc("open_cash_session", {
    p_tenant_id: tenantId,
    p_branch_id: null,
    p_opening_amount: 0,
  });

  // percent coupon: 20000 - 10% = 18000; client earns floor(18) = 18 points
  const { data: sale1, error: s1Err } = await owner.rpc("create_sale", {
    p_tenant_id: tenantId,
    p_session_id: sessionId,
    p_payload: {
      items: [{ type: "service", id: svc.id, quantity: 1, discount: 0 }],
      payments: [{ method: "cash", amount: 18000 }],
      coupon_code: "desc10",
      client_id: cl.id,
    },
  });
  if (s1Err) throw s1Err;
  if (Number(sale1.total) !== 18000 || Number(sale1.coupon_discount) !== 2000) {
    throw new Error(`percent coupon math wrong: ${JSON.stringify(sale1)}`);
  }
  console.log("percent coupon OK (lowercase code normalized, -2000)");

  const { data: pts } = await owner
    .from("loyalty_points")
    .select("points")
    .eq("client_id", cl.id);
  const balance = pts.reduce((s, p) => s + p.points, 0);
  if (balance !== 18) throw new Error(`points ${balance} != 18`);
  console.log("loyalty points awarded OK (18)");

  // fixed coupon with max_uses 1: first use ok
  const { data: sale2, error: s2Err } = await owner.rpc("create_sale", {
    p_tenant_id: tenantId,
    p_session_id: sessionId,
    p_payload: {
      items: [{ type: "service", id: svc.id, quantity: 1, discount: 0 }],
      payments: [{ method: "cash", amount: 15000 }],
      coupon_code: "FIJO5000",
    },
  });
  if (s2Err) throw s2Err;
  if (Number(sale2.total) !== 15000) throw new Error("fixed coupon math wrong");
  console.log("fixed coupon OK (-5000)");

  // second use exhausted
  const { error: exhaustedErr } = await owner.rpc("create_sale", {
    p_tenant_id: tenantId,
    p_session_id: sessionId,
    p_payload: {
      items: [{ type: "service", id: svc.id, quantity: 1, discount: 0 }],
      payments: [{ method: "cash", amount: 15000 }],
      coupon_code: "FIJO5000",
    },
  });
  if (!exhaustedErr || !exhaustedErr.message.includes("coupon_exhausted")) {
    throw new Error("exhausted coupon not blocked");
  }
  console.log("exhausted coupon rejected OK");

  // expired
  const { error: expiredErr } = await owner.rpc("create_sale", {
    p_tenant_id: tenantId,
    p_session_id: sessionId,
    p_payload: {
      items: [{ type: "service", id: svc.id, quantity: 1, discount: 0 }],
      payments: [{ method: "cash", amount: 10000 }],
      coupon_code: "VENCIDO",
    },
  });
  if (!expiredErr || !expiredErr.message.includes("coupon_expired")) {
    throw new Error("expired coupon not blocked");
  }
  console.log("expired coupon rejected OK");

  // min purchase
  const { error: minErr } = await owner.rpc("create_sale", {
    p_tenant_id: tenantId,
    p_session_id: sessionId,
    p_payload: {
      items: [{ type: "service", id: svc.id, quantity: 1, discount: 0 }],
      payments: [{ method: "cash", amount: 19000 }],
      coupon_code: "MINIMO",
    },
  });
  if (!minErr || !minErr.message.includes("coupon_min_purchase")) {
    throw new Error("min purchase not enforced");
  }
  console.log("min purchase enforced OK");

  // segments
  const { data: segments, error: segErr } = await owner.rpc(
    "client_segments",
    { p_tenant_id: tenantId },
  );
  if (segErr) throw segErr;
  const row = segments.find((s) => s.client_id === cl.id);
  if (!row) throw new Error("client missing from segments");
  if (row.segment !== "nuevo") {
    throw new Error(`expected segment nuevo, got ${row.segment}`);
  }
  if (Number(row.total_spent) !== 18000) {
    throw new Error(`total_spent ${row.total_spent} != 18000`);
  }
  if (row.points !== 18) throw new Error("segment points wrong");
  console.log("segments OK (nuevo, 18000 spent, 18 pts)");

  console.log("smoke-marketing passed");
} finally {
  if (tenantId) await admin.from("tenants").delete().eq("id", tenantId);
  for (const uid of cleanupUsers) {
    await admin.auth.admin.deleteUser(uid);
  }
}
