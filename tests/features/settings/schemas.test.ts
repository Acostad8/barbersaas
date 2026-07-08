import { describe, expect, it } from "vitest";
import { updateTenantSchema } from "@/features/settings/schemas";

const base = {
  name: "Barbería Central",
  description: "",
  phone: "",
  email: "",
  website: "",
  instagram: "",
  facebook: "",
  tiktok: "",
  whatsapp: "",
  timezone: "America/Bogota",
  currency: "COP",
};

describe("updateTenantSchema", () => {
  it("accepts valid minimal input with empty optionals", () => {
    expect(updateTenantSchema.safeParse(base).success).toBe(true);
  });

  it("rejects invalid website URL", () => {
    expect(
      updateTenantSchema.safeParse({ ...base, website: "no-es-url" }).success,
    ).toBe(false);
  });

  it("accepts valid website URL", () => {
    const result = updateTenantSchema.parse({
      ...base,
      website: "https://mibarberia.co",
    });
    expect(result.website).toBe("https://mibarberia.co");
  });

  it("rejects invalid email", () => {
    expect(
      updateTenantSchema.safeParse({ ...base, email: "no-email" }).success,
    ).toBe(false);
  });

  it("rejects lowercase currency", () => {
    expect(
      updateTenantSchema.safeParse({ ...base, currency: "cop" }).success,
    ).toBe(false);
  });

  it("rejects too-long description", () => {
    expect(
      updateTenantSchema.safeParse({ ...base, description: "x".repeat(501) })
        .success,
    ).toBe(false);
  });
});
