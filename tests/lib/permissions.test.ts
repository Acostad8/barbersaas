import { describe, expect, it } from "vitest";
import {
  PERMISSIONS,
  hasPermission,
  permissionsFor,
} from "@/lib/auth/permissions";

describe("permissions", () => {
  it("admin has every permission", () => {
    for (const p of PERMISSIONS) {
      expect(hasPermission("admin", p)).toBe(true);
    }
  });

  it("client has no permissions", () => {
    expect(permissionsFor("client")).toHaveLength(0);
  });

  it("barber cannot manage schedule, only view own", () => {
    expect(hasPermission("barber", "schedule:manage")).toBe(false);
    expect(hasPermission("barber", "schedule:view-own")).toBe(true);
  });

  it("accountant manages finance but not staff", () => {
    expect(hasPermission("accountant", "finance:manage")).toBe(true);
    expect(hasPermission("accountant", "staff:manage")).toBe(false);
  });

  it("manager cannot manage tenant-level settings", () => {
    expect(hasPermission("manager", "tenant:manage")).toBe(false);
    expect(hasPermission("manager", "settings:manage")).toBe(false);
  });

  it("receptionist operates POS and schedule", () => {
    expect(hasPermission("receptionist", "pos:operate")).toBe(true);
    expect(hasPermission("receptionist", "schedule:manage")).toBe(true);
    expect(hasPermission("receptionist", "finance:view")).toBe(false);
  });
});
