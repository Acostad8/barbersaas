import { describe, expect, it } from "vitest";
import {
  appointmentFormSchema,
  canTransition,
} from "@/features/agenda/schemas";

const base = {
  clientId: "c1",
  membershipId: "m1",
  serviceId: "s1",
  date: "2026-08-01",
  startTime: "10:30",
  notes: "",
};

describe("appointmentFormSchema", () => {
  it("accepts valid appointment", () => {
    expect(appointmentFormSchema.safeParse(base).success).toBe(true);
  });

  it("rejects missing client", () => {
    expect(
      appointmentFormSchema.safeParse({ ...base, clientId: "" }).success,
    ).toBe(false);
  });

  it("rejects malformed time", () => {
    expect(
      appointmentFormSchema.safeParse({ ...base, startTime: "25:00" }).success,
    ).toBe(false);
    expect(
      appointmentFormSchema.safeParse({ ...base, startTime: "9:00" }).success,
    ).toBe(false);
  });

  it("rejects malformed date", () => {
    expect(
      appointmentFormSchema.safeParse({ ...base, date: "01/08/2026" }).success,
    ).toBe(false);
  });
});

describe("canTransition", () => {
  it("allows scheduled → confirmed → in_progress → completed", () => {
    expect(canTransition("scheduled", "confirmed")).toBe(true);
    expect(canTransition("confirmed", "in_progress")).toBe(true);
    expect(canTransition("in_progress", "completed")).toBe(true);
  });

  it("blocks transitions from terminal states", () => {
    expect(canTransition("completed", "cancelled")).toBe(false);
    expect(canTransition("cancelled", "scheduled")).toBe(false);
    expect(canTransition("no_show", "confirmed")).toBe(false);
  });

  it("blocks no_show after in_progress", () => {
    expect(canTransition("in_progress", "no_show")).toBe(false);
  });
});
