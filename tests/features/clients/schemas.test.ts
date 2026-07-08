import { describe, expect, it } from "vitest";
import { clientFormSchema, parseTags } from "@/features/clients/schemas";

const base = {
  fullName: "Carlos Pérez",
  email: "",
  phone: "",
  birthdate: "",
  notes: "",
  tags: "",
  rating: "",
  marketingConsent: false,
  whatsappConsent: false,
};

describe("clientFormSchema", () => {
  it("accepts minimal valid client", () => {
    expect(clientFormSchema.safeParse(base).success).toBe(true);
  });

  it("accepts full valid client", () => {
    const result = clientFormSchema.safeParse({
      ...base,
      email: "carlos@example.com",
      phone: "3001234567",
      birthdate: "1990-05-12",
      tags: "vip, corte-clasico",
      rating: "5",
      marketingConsent: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    expect(
      clientFormSchema.safeParse({ ...base, email: "no-email" }).success,
    ).toBe(false);
  });

  it("rejects future birthdate", () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    const iso = future.toISOString().slice(0, 10);
    expect(
      clientFormSchema.safeParse({ ...base, birthdate: iso }).success,
    ).toBe(false);
  });

  it("rejects birthdate before 1900", () => {
    expect(
      clientFormSchema.safeParse({ ...base, birthdate: "1899-12-31" }).success,
    ).toBe(false);
  });

  it("rejects rating out of range", () => {
    expect(clientFormSchema.safeParse({ ...base, rating: "6" }).success).toBe(
      false,
    );
  });

  it("rejects too-short name", () => {
    expect(clientFormSchema.safeParse({ ...base, fullName: "C" }).success).toBe(
      false,
    );
  });
});

describe("parseTags", () => {
  it("splits, trims, lowercases and dedupes", () => {
    expect(parseTags(" VIP, corte-clasico , vip ,, Nuevo ")).toEqual([
      "vip",
      "corte-clasico",
      "nuevo",
    ]);
  });

  it("returns empty array for empty input", () => {
    expect(parseTags("")).toEqual([]);
    expect(parseTags("  ,  , ")).toEqual([]);
  });

  it("caps at 20 tags", () => {
    const raw = Array.from({ length: 30 }, (_, i) => `tag${i}`).join(",");
    expect(parseTags(raw)).toHaveLength(20);
  });
});
