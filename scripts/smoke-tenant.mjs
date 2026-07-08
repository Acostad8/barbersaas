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
const cleanup = [];

try {
  // user A creates a tenant
  const { data: a, error: eA } = await admin.auth.admin.createUser({
    email: `smoke-a+${stamp}@example.com`,
    password,
    email_confirm: true,
  });
  if (eA) throw eA;
  cleanup.push(a.user.id);

  const clientA = anonClient();
  const { error: loginA } = await clientA.auth.signInWithPassword({
    email: a.user.email,
    password,
  });
  if (loginA) throw loginA;

  const slug = `smoke-${stamp}`;
  const { data: tenant, error: rpcErr } = await clientA.rpc("create_tenant", {
    p_name: "Smoke Barber",
    p_slug: slug,
  });
  if (rpcErr) throw rpcErr;
  console.log("tenant created:", tenant.id, tenant.slug);

  const { data: myMemberships, error: memErr } = await clientA
    .from("memberships")
    .select("role, tenant_id")
    .eq("tenant_id", tenant.id);
  if (memErr) throw memErr;
  if (myMemberships[0]?.role !== "admin") {
    throw new Error("creator is not admin");
  }
  console.log("creator membership: admin OK");

  // user B must NOT see tenant A (RLS isolation)
  const { data: b, error: eB } = await admin.auth.admin.createUser({
    email: `smoke-b+${stamp}@example.com`,
    password,
    email_confirm: true,
  });
  if (eB) throw eB;
  cleanup.push(b.user.id);

  const clientB = anonClient();
  const { error: loginB } = await clientB.auth.signInWithPassword({
    email: b.user.email,
    password,
  });
  if (loginB) throw loginB;

  const { data: leaked } = await clientB
    .from("tenants")
    .select("id")
    .eq("id", tenant.id);
  if (leaked && leaked.length > 0) {
    throw new Error("RLS LEAK: user B can see tenant A");
  }
  console.log("RLS isolation OK — user B sees nothing");

  // duplicate slug must fail
  const { error: dupErr } = await clientA.rpc("create_tenant", {
    p_name: "Smoke Barber 2",
    p_slug: slug,
  });
  if (!dupErr) throw new Error("duplicate slug was allowed");
  console.log("duplicate slug rejected OK");

  // cleanup tenant (service role bypasses RLS)
  const { error: delTenant } = await admin
    .from("tenants")
    .delete()
    .eq("id", tenant.id);
  if (delTenant) throw delTenant;

  console.log("smoke-tenant passed");
} finally {
  for (const uid of cleanup) {
    await admin.auth.admin.deleteUser(uid);
  }
}
