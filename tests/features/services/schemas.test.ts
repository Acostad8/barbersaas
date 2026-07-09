import { describe, expect, it } from "vitest";
import {
  categoryFormSchema,
  serviceFormSchema,
} from "@/features/services/schemas";

const base = {
  name: "Corte clásico",
  description: "",
  categoryId: "",
  durationMinutes: "30",
  price: "25000",
  commissionRate: "",
  taxRate: "",
};

describe("serviceFormSchema", () => {
  it("accepts valid service", () => {
    expect(serviceFormSchema.safeParse(base).success).toBe(true);
  });

  it("accepts rates and price with decimals", () => {
    expect(
      serviceFormSchema.safeParse({
        ...base,
        commissionRate: "12.5",
        taxRate: "19",
        price: "25000.50",
      }).success,
    ).toBe(true);
  });

  it("rejects duration out of range", () => {
    expect(
      serviceFormSchema.safeParse({ ...base, durationMinutes: "3" }).success,
    ).toBe(false);
    expect(
      serviceFormSchema.safeParse({ ...base, durationMinutes: "500" }).success,
    ).toBe(false);
  });

  it("rejects non-integer duration", () => {
    expect(
      serviceFormSchema.safeParse({ ...base, durationMinutes: "30.5" })
        .success,
    ).toBe(false);
  });

  it("rejects negative price", () => {
    expect(serviceFormSchema.safeParse({ ...base, price: "-1" }).success).toBe(
      false,
    );
  });

  it("rejects commission above 100", () => {
    expect(
      serviceFormSchema.safeParse({ ...base, commissionRate: "101" }).success,
    ).toBe(false);
  });
});

describe("categoryFormSchema", () => {
  it("accepts valid category", () => {
    expect(categoryFormSchema.safeParse({ name: "Cortes" }).success).toBe(true);
  });

  it("rejects too-short name", () => {
    expect(categoryFormSchema.safeParse({ name: "C" }).success).toBe(false);
  });
});
