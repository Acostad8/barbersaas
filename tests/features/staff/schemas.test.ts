import { describe, expect, it } from "vitest";
import {
  addMemberSchema,
  barberProfileSchema,
  timeOffSchema,
} from "@/features/staff/schemas";

describe("addMemberSchema", () => {
  it("accepts valid member", () => {
    expect(
      addMemberSchema.safeParse({
        email: "barbero@example.com",
        role: "barber",
        branchId: "",
      }).success,
    ).toBe(true);
  });

  it("rejects client role", () => {
    expect(
      addMemberSchema.safeParse({
        email: "x@example.com",
        role: "client",
        branchId: "",
      }).success,
    ).toBe(false);
  });

  it("rejects invalid email", () => {
    expect(
      addMemberSchema.safeParse({
        email: "no-email",
        role: "barber",
        branchId: "",
      }).success,
    ).toBe(false);
  });
});

describe("barberProfileSchema", () => {
  it("accepts empty optional profile", () => {
    expect(
      barberProfileSchema.safeParse({
        bio: "",
        specialties: "",
        commissionRate: "",
        hiredAt: "",
      }).success,
    ).toBe(true);
  });

  it("rejects commission out of range", () => {
    expect(
      barberProfileSchema.safeParse({
        bio: "",
        specialties: "",
        commissionRate: "150",
        hiredAt: "",
      }).success,
    ).toBe(false);
  });
});

describe("timeOffSchema", () => {
  it("accepts valid range", () => {
    expect(
      timeOffSchema.safeParse({
        startsOn: "2026-08-01",
        endsOn: "2026-08-05",
        reason: "Vacaciones",
      }).success,
    ).toBe(true);
  });

  it("accepts single-day request", () => {
    expect(
      timeOffSchema.safeParse({
        startsOn: "2026-08-01",
        endsOn: "2026-08-01",
        reason: "",
      }).success,
    ).toBe(true);
  });

  it("rejects end before start", () => {
    expect(
      timeOffSchema.safeParse({
        startsOn: "2026-08-05",
        endsOn: "2026-08-01",
        reason: "",
      }).success,
    ).toBe(false);
  });
});
