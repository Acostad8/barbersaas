import { describe, expect, it, vi } from "vitest";

describe("env validation", () => {
  it("parses valid public env", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "sb_publishable_test");
    vi.resetModules();

    const { publicEnv } = await import("@/lib/env");
    expect(publicEnv.NEXT_PUBLIC_SUPABASE_URL).toBe(
      "https://example.supabase.co",
    );
    vi.unstubAllEnvs();
  });

  it("throws on missing service role key", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "sb_publishable_test");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.resetModules();

    const { getServerEnv } = await import("@/lib/env");
    expect(() => getServerEnv()).toThrow();
    vi.unstubAllEnvs();
  });
});
