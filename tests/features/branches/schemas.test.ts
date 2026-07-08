import { describe, expect, it } from "vitest";
import {
  branchFormSchema,
  daysToSchedule,
  scheduleToDays,
} from "@/features/branches/schemas";

const closedWeek = {
  mon: { enabled: false, open: "09:00", close: "19:00" },
  tue: { enabled: false, open: "09:00", close: "19:00" },
  wed: { enabled: false, open: "09:00", close: "19:00" },
  thu: { enabled: false, open: "09:00", close: "19:00" },
  fri: { enabled: false, open: "09:00", close: "19:00" },
  sat: { enabled: false, open: "09:00", close: "19:00" },
  sun: { enabled: false, open: "09:00", close: "19:00" },
};

describe("branchFormSchema", () => {
  it("accepts valid branch", () => {
    const result = branchFormSchema.safeParse({
      name: "Sede Centro",
      address: "Calle 10 #5-23",
      city: "Ocaña",
      phone: "3000000000",
      days: {
        ...closedWeek,
        mon: { enabled: true, open: "09:00", close: "19:00" },
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects open >= close on enabled day", () => {
    const result = branchFormSchema.safeParse({
      name: "Sede Centro",
      address: "",
      city: "",
      phone: "",
      days: {
        ...closedWeek,
        mon: { enabled: true, open: "19:00", close: "09:00" },
      },
    });
    expect(result.success).toBe(false);
  });

  it("ignores open >= close on disabled day", () => {
    const result = branchFormSchema.safeParse({
      name: "Sede Centro",
      address: "",
      city: "",
      phone: "",
      days: {
        ...closedWeek,
        mon: { enabled: false, open: "19:00", close: "09:00" },
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects malformed time", () => {
    const result = branchFormSchema.safeParse({
      name: "Sede Centro",
      address: "",
      city: "",
      phone: "",
      days: {
        ...closedWeek,
        mon: { enabled: true, open: "9am", close: "19:00" },
      },
    });
    expect(result.success).toBe(false);
  });

  it("accepts empty optional fields", () => {
    const result = branchFormSchema.safeParse({
      name: "Sede Centro",
      address: "  ",
      city: "",
      phone: "",
      days: closedWeek,
    });
    expect(result.success).toBe(true);
  });
});

describe("schedule conversion", () => {
  it("daysToSchedule only includes enabled days", () => {
    const schedule = daysToSchedule({
      ...closedWeek,
      tue: { enabled: true, open: "10:00", close: "18:00" },
    });
    expect(schedule).toEqual({ tue: [{ open: "10:00", close: "18:00" }] });
  });

  it("roundtrips through scheduleToDays", () => {
    const days = scheduleToDays({ fri: [{ open: "08:00", close: "20:00" }] });
    expect(days.fri).toEqual({ enabled: true, open: "08:00", close: "20:00" });
    expect(days.mon.enabled).toBe(false);
    expect(daysToSchedule(branchFormSchema.parse({
      name: "Test",
      address: "",
      city: "",
      phone: "",
      days,
    }).days)).toEqual({ fri: [{ open: "08:00", close: "20:00" }] });
  });
});
