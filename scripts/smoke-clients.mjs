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
const cleanupTenants = [];

try {
  // tenant A with owner + barber
  const { data: a } = await admin.auth.admin.createUser({
    email: `smoke-owner-a+${stamp}@example.com`,
    password,
    email_confirm: true,
  });
  cleanupUsers.push(a.user.id);
  const ownerA = anonClient();
  await ownerA.auth.signInWithPassword({ email: a.user.email, password });
  const { data: tenantA, error: tAErr } = await ownerA.rpc("create_tenant", {
    p_name: "Smoke Clients A",
    p_slug: `smoke-cl-a-${stamp}`,
  });
  if (tAErr) throw tAErr;
  cleanupTenants.push(tenantA.id);

  // create client with consents + tags
  const { data: cl, error: clErr } = await ownerA
    .from("clients")
    .insert({
      tenant_id: tenantA.id,
      full_name: "Cliente Prueba",
      email: `cliente+${stamp}@example.com`,
      tags: ["vip", "nuevo"],
      marketing_consent: false,
    })
    .select()
    .single();
  if (clErr) throw clErr;
  console.log("client created:", cl.id);
  if (cl.consent_updated_at !== null) {
    throw new Error("consent_updated_at should be null on insert");
  }

  // consent change stamps consent_updated_at via trigger
  const { data: updated, error: upErr } = await ownerA
    .from("clients")
    .update({ marketing_consent: true })
    .eq("id", cl.id)
    .select()
    .single();
  if (upErr) throw upErr;
  if (!updated.consent_updated_at) {
    throw new Error("consent trigger did not stamp consent_updated_at");
  }
  console.log("consent trigger OK:", updated.consent_updated_at);

  // duplicate email in same tenant rejected (case-insensitive)
  const { error: dupErr } = await ownerA.from("clients").insert({
    tenant_id: tenantA.id,
    full_name: "Duplicado",
    email: `CLIENTE+${stamp}@example.com`,
  });
  if (!dupErr) throw new Error("duplicate email allowed in same tenant");
  console.log("duplicate email rejected OK");

  // barber in tenant A: can view, cannot insert
  const { data: bb } = await admin.auth.admin.createUser({
    email: `smoke-barber+${stamp}@example.com`,
    password,
    email_confirm: true,
  });
  cleanupUsers.push(bb.user.id);
  await ownerA.from("memberships").insert({
    tenant_id: tenantA.id,
    user_id: bb.user.id,
    role: "barber",
  });
  const barber = anonClient();
  await barber.auth.signInWithPassword({ email: bb.user.email, password });

  const { data: seenByBarber, error: sbErr } = await barber
    .from("clients")
    .select("id")
    .eq("tenant_id", tenantA.id);
  if (sbErr) throw sbErr;
  if (seenByBarber.length !== 1) throw new Error("barber cannot view clients");
  console.log("barber can view clients OK");

  const { error: barberInsErr } = await barber.from("clients").insert({
    tenant_id: tenantA.id,
    full_name: "No Debe Existir",
  });
  if (!barberInsErr) throw new Error("RLS FAIL: barber inserted client");
  console.log("barber blocked from inserting clients OK");

  // tenant B owner must NOT see tenant A clients
  const { data: b } = await admin.auth.admin.createUser({
    email: `smoke-owner-b+${stamp}@example.com`,
    password,
    email_confirm: true,
  });
  cleanupUsers.push(b.user.id);
  const ownerB = anonClient();
  await ownerB.auth.signInWithPassword({ email: b.user.email, password });
  const { data: tenantB, error: tBErr } = await ownerB.rpc("create_tenant", {
    p_name: "Smoke Clients B",
    p_slug: `smoke-cl-b-${stamp}`,
  });
  if (tBErr) throw tBErr;
  cleanupTenants.push(tenantB.id);

  const { data: leaked } = await ownerB
    .from("clients")
    .select("id")
    .eq("tenant_id", tenantA.id);
  if (leaked && leaked.length > 0) {
    throw new Error("RLS LEAK: tenant B sees tenant A clients");
  }
  console.log("tenant isolation OK");

  console.log("smoke-clients passed");
} finally {
  for (const tid of cleanupTenants) {
    await admin.from("tenants").delete().eq("id", tid);
  }
  for (const uid of cleanupUsers) {
    await admin.auth.admin.deleteUser(uid);
  }
}
