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
  // owner creates tenant + branch
  const { data: a, error: eA } = await admin.auth.admin.createUser({
    email: `smoke-owner+${stamp}@example.com`,
    password,
    email_confirm: true,
  });
  if (eA) throw eA;
  cleanupUsers.push(a.user.id);

  const owner = anonClient();
  await owner.auth.signInWithPassword({ email: a.user.email, password });

  const { data: tenant, error: tErr } = await owner.rpc("create_tenant", {
    p_name: "Smoke Branches",
    p_slug: `smoke-br-${stamp}`,
  });
  if (tErr) throw tErr;
  tenantId = tenant.id;

  const schedule = { mon: [{ open: "09:00", close: "19:00" }] };
  const { data: branch, error: bErr } = await owner
    .from("branches")
    .insert({
      tenant_id: tenantId,
      name: "Sede Centro",
      city: "Ocaña",
      schedule,
    })
    .select()
    .single();
  if (bErr) throw bErr;
  console.log("branch created:", branch.id, branch.name);

  if (JSON.stringify(branch.schedule) !== JSON.stringify(schedule)) {
    throw new Error("schedule mismatch");
  }

  // barber (added by owner) can view but NOT create branches
  const { data: b, error: eB } = await admin.auth.admin.createUser({
    email: `smoke-barber+${stamp}@example.com`,
    password,
    email_confirm: true,
  });
  if (eB) throw eB;
  cleanupUsers.push(b.user.id);

  const { error: memErr } = await owner.from("memberships").insert({
    tenant_id: tenantId,
    user_id: b.user.id,
    role: "barber",
    branch_id: branch.id,
  });
  if (memErr) throw memErr;
  console.log("barber membership created with branch assignment");

  const barber = anonClient();
  await barber.auth.signInWithPassword({ email: b.user.email, password });

  const { data: seen, error: seenErr } = await barber
    .from("branches")
    .select("id")
    .eq("tenant_id", tenantId);
  if (seenErr) throw seenErr;
  if (seen.length !== 1) throw new Error("barber cannot view branches");
  console.log("barber can view branches OK");

  const { error: insertDenied } = await barber.from("branches").insert({
    tenant_id: tenantId,
    name: "Sede Pirata",
  });
  if (!insertDenied) throw new Error("RLS FAIL: barber created a branch");
  console.log("barber blocked from creating branches OK");

  // tenant profile update: barber denied, owner allowed
  const { data: updByBarber } = await barber
    .from("tenants")
    .update({ description: "hack" })
    .eq("id", tenantId)
    .select();
  if (updByBarber && updByBarber.length > 0) {
    throw new Error("RLS FAIL: barber updated tenant");
  }
  console.log("barber blocked from updating tenant OK");

  const { error: updErr } = await owner
    .from("tenants")
    .update({ description: "Barbería de prueba", currency: "COP" })
    .eq("id", tenantId);
  if (updErr) throw updErr;
  console.log("owner updated tenant profile OK");

  console.log("smoke-branches passed");
} finally {
  if (tenantId) {
    await admin.from("tenants").delete().eq("id", tenantId);
  }
  for (const uid of cleanupUsers) {
    await admin.auth.admin.deleteUser(uid);
  }
}
