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

const email = `smoke+${Date.now()}@example.com`;

const { data: created, error: createErr } = await admin.auth.admin.createUser({
  email,
  password: "Smoke-Test-1234",
  email_confirm: true,
  user_metadata: { full_name: "Smoke Test" },
});
if (createErr) throw createErr;
const uid = created.user.id;
console.log("user created:", uid);

const { data: profile, error: profileErr } = await admin
  .from("profiles")
  .select("id, full_name")
  .eq("id", uid)
  .single();
if (profileErr) throw profileErr;
console.log("profile created by trigger:", JSON.stringify(profile));

if (profile.full_name !== "Smoke Test") throw new Error("full_name mismatch");

const { error: delErr } = await admin.auth.admin.deleteUser(uid);
if (delErr) throw delErr;

const { data: gone } = await admin
  .from("profiles")
  .select("id")
  .eq("id", uid)
  .maybeSingle();
if (gone) throw new Error("profile not cascaded on user delete");
console.log("cascade delete OK — smoke test passed");
