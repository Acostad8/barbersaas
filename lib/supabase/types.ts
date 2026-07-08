export type MemberRole =
  | "admin"
  | "manager"
  | "receptionist"
  | "barber"
  | "accountant"
  | "client";

export type SocialLinks = {
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  whatsapp?: string;
};

export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type TimeRange = {
  open: string;
  close: string;
};

export type WeeklySchedule = Partial<Record<DayKey, TimeRange[]>>;

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  socials: SocialLinks;
  timezone: string;
  currency: string;
  logo_url: string | null;
  banner_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
};

export type Membership = {
  id: string;
  tenant_id: string;
  user_id: string;
  role: MemberRole;
  is_active: boolean;
  branch_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Client = {
  id: string;
  tenant_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  birthdate: string | null;
  notes: string | null;
  tags: string[];
  preferences: Record<string, unknown>;
  referred_by: string | null;
  rating: number | null;
  marketing_consent: boolean;
  whatsapp_consent: boolean;
  consent_updated_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Branch = {
  id: string;
  tenant_id: string;
  name: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  schedule: WeeklySchedule;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

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
          {
            foreignKeyName: "memberships_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
        ];
      };
      clients: {
        Row: Client;
        Insert: Pick<Client, "tenant_id" | "full_name"> & Partial<Client>;
        Update: Partial<Client>;
        Relationships: [
          {
            foreignKeyName: "clients_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "clients_referred_by_fkey";
            columns: ["referred_by"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      branches: {
        Row: Branch;
        Insert: Pick<Branch, "tenant_id" | "name"> & Partial<Branch>;
        Update: Partial<Branch>;
        Relationships: [
          {
            foreignKeyName: "branches_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
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
};
