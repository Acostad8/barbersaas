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
    p_name: "Smoke Inventory",
    p_slug: `smoke-inv-${stamp}`,
  });
  if (tErr) throw tErr;
  tenantId = tenant.id;

  const { data: product, error: pErr } = await owner
    .from("products")
    .insert({
      tenant_id: tenantId,
      name: "Cera para cabello",
      sku: "CERA-01",
      cost: 8000,
      price: 15000,
      min_stock: 5,
    })
    .select()
    .single();
  if (pErr) throw pErr;
  console.log("product created:", product.name);

  // purchase 10 units
  const { error: buyErr } = await owner.from("stock_movements").insert({
    tenant_id: tenantId,
    product_id: product.id,
    movement_type: "purchase",
    quantity: 10,
    unit_cost: 8000,
  });
  if (buyErr) throw buyErr;

  const { data: level1 } = await owner
    .from("stock_levels")
    .select("quantity")
    .eq("product_id", product.id)
    .single();
  if (Number(level1.quantity) !== 10) {
    throw new Error(`stock should be 10, got ${level1.quantity}`);
  }
  console.log("purchase updated stock to 10 OK");

  // sale 4
  const { error: saleErr } = await owner.from("stock_movements").insert({
    tenant_id: tenantId,
    product_id: product.id,
    movement_type: "sale",
    quantity: 4,
  });
  if (saleErr) throw saleErr;

  const { data: level2 } = await owner
    .from("stock_levels")
    .select("quantity")
    .eq("product_id", product.id)
    .single();
  if (Number(level2.quantity) !== 6) {
    throw new Error(`stock should be 6, got ${level2.quantity}`);
  }
  console.log("sale reduced stock to 6 OK");

  // oversell blocked (only 6 in stock)
  const { error: oversellErr } = await owner.from("stock_movements").insert({
    tenant_id: tenantId,
    product_id: product.id,
    movement_type: "sale",
    quantity: 7,
  });
  if (!oversellErr || !oversellErr.message.includes("insufficient_stock")) {
    throw new Error(`oversell not blocked: ${oversellErr?.message}`);
  }
  const { data: level3 } = await owner
    .from("stock_levels")
    .select("quantity")
    .eq("product_id", product.id)
    .single();
  if (Number(level3.quantity) !== 6) throw new Error("stock changed on failed movement");
  console.log("oversell blocked, stock intact OK");

  // kardex immutable: update/delete blocked
  const { data: movs } = await owner
    .from("stock_movements")
    .select("id")
    .eq("tenant_id", tenantId)
    .limit(1);
  const { data: updRes } = await owner
    .from("stock_movements")
    .update({ quantity: 999 })
    .eq("id", movs[0].id)
    .select();
  if (updRes && updRes.length > 0) throw new Error("kardex row was updated");
  const { data: delRes } = await owner
    .from("stock_movements")
    .delete()
    .eq("id", movs[0].id)
    .select();
  if (delRes && delRes.length > 0) throw new Error("kardex row was deleted");
  console.log("kardex immutable OK");

  // stock_levels not writable directly
  const { data: directWrite } = await owner
    .from("stock_levels")
    .update({ quantity: 1000 })
    .eq("product_id", product.id)
    .select();
  if (directWrite && directWrite.length > 0) {
    throw new Error("RLS FAIL: stock_levels directly writable");
  }
  console.log("stock_levels write-protected OK");

  // barber cannot see inventory
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
  const { data: seen } = await barber
    .from("products")
    .select("id")
    .eq("tenant_id", tenantId);
  if (seen && seen.length > 0) throw new Error("RLS FAIL: barber sees products");
  console.log("barber blocked from inventory OK");

  console.log("smoke-inventory passed");
} finally {
  if (tenantId) await admin.from("tenants").delete().eq("id", tenantId);
  for (const uid of cleanupUsers) {
    await admin.auth.admin.deleteUser(uid);
  }
}
