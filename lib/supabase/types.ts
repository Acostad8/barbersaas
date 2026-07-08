export type MemberRole =
  | "admin"
  | "manager"
  | "receptionist"
  | "barber"
  | "accountant"
  | "client";

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export type Membership = {
  id: string;
  tenant_id: string;
  user_id: string;
  role: MemberRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type Database = {
  public: {
    Tables: {
      tenants: {
        Row: Tenant;
        Insert: Pick<Tenant, "name" | "slug"> & Partial<Tenant>;
        Update: Partial<Tenant>;
        Relationships: [];
      };
      profiles: {
        Row: Profile;
        Insert: Pick<Profile, "id"> & Partial<Profile>;
        Update: Partial<Profile>;
        Relationships: [];
      };
      memberships: {
        Row: Membership;
        Insert: Pick<Membership, "tenant_id" | "user_id" | "role"> &
          Partial<Membership>;
        Update: Partial<Membership>;
        Relationships: [
          {
            foreignKeyName: "memberships_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "memberships_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_tenant: {
        Args: { p_name: string; p_slug: string };
        Returns: Tenant;
      };
      is_member_of: {
        Args: { p_tenant_id: string };
        Returns: boolean;
      };
      has_role: {
        Args: { p_tenant_id: string; p_roles: MemberRole[] };
        Returns: boolean;
      };
      shares_tenant_with: {
        Args: { p_user_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      member_role: MemberRole;
    };
    CompositeTypes: Record<string, never>;
  };
}

