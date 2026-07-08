import type { MemberRole } from "@/lib/supabase/types";

export const PERMISSIONS = [
  "tenant:manage",
  "branches:manage",
  "staff:manage",
  "staff:view",
  "clients:manage",
  "clients:view",
  "services:manage",
  "services:view",
  "schedule:manage",
  "schedule:view-own",
  "inventory:manage",
  "inventory:view",
  "pos:operate",
  "reports:view",
  "finance:manage",
  "finance:view",
  "marketing:manage",
  "settings:manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ROLE_PERMISSIONS: Record<MemberRole, readonly Permission[]> = {
  admin: PERMISSIONS,
  manager: [
    "branches:manage",
    "staff:manage",
    "staff:view",
    "clients:manage",
    "clients:view",
    "services:manage",
    "services:view",
    "schedule:manage",
    "inventory:manage",
    "inventory:view",
    "pos:operate",
    "reports:view",
    "finance:view",
    "marketing:manage",
  ],
  receptionist: [
    "clients:manage",
    "clients:view",
    "services:view",
    "schedule:manage",
    "pos:operate",
  ],
  barber: ["clients:view", "services:view", "schedule:view-own"],
  accountant: ["reports:view", "finance:manage", "finance:view"],
  client: [],
};

export function hasPermission(
  role: MemberRole,
  permission: Permission,
): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function permissionsFor(role: MemberRole): readonly Permission[] {
  return ROLE_PERMISSIONS[role];
}
