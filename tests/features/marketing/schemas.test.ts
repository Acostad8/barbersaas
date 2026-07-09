import { describe, expect, it } from "vitest";
import {
  couponFormSchema,
  loyaltyFormSchema,
} from "@/features/marketing/schemas";

const base = {
  code: "DESC10",
  description: "",
  discountType: "percent",
  discountValue: "10",
  minPurchase: "",
  maxUses: "",
  validFrom: "",
  validUntil: "",
};

describe("couponFormSchema", () => {
  it("accepts valid percent coupon", () => {
    expect(couponFormSchema.safeParse(base).success).toBe(true);
  });

  it("accepts fixed coupon over 100", () => {
    expect(
      couponFormSchema.safeParse({
        ...base,
        discountType: "fixed",
        discountValue: "5000",
      }).success,
    ).toBe(true);
  });

  it("rejects percent over 100", () => {
    expect(
      couponFormSchema.safeParse({ ...base, discountValue: "150" }).success,
    ).toBe(false);
  });

  it("rejects bad code chars", () => {
    expect(
      couponFormSchema.safeParse({ ...base, code: "DES C10!" }).success,
    ).toBe(false);
  });

  it("rejects until before from", () => {
    expect(
      couponFormSchema.safeParse({
        ...base,
        validFrom: "2026-08-10",
        validUntil: "2026-08-01",
      }).success,
    ).toBe(false);
  });

  it("rejects non-integer maxUses", () => {
    expect(
      couponFormSchema.safeParse({ ...base, maxUses: "2.5" }).success,
    ).toBe(false);
  });
});

describe("loyaltyFormSchema", () => {
  it("accepts valid settings", () => {
    expect(
      loyaltyFormSchema.safeParse({ enabled: true, pointsPer1000: "1" })
        .success,
    ).toBe(true);
  });

  it("rejects negative rate", () => {
    expect(
      loyaltyFormSchema.safeParse({ enabled: true, pointsPer1000: "-1" })
        .success,
    ).toBe(false);
  });
});
