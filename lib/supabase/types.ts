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

export type ServiceCategory = {
  id: string;
  tenant_id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Service = {
  id: string;
  tenant_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  commission_rate: number;
  tax_rate: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type BarberProfile = {
  membership_id: string;
  tenant_id: string;
  bio: string | null;
  specialties: string[];
  schedule: WeeklySchedule;
  commission_rate: number | null;
  hired_at: string | null;
  created_at: string;
  updated_at: string;
};

export type BarberService = {
  membership_id: string;
  service_id: string;
  tenant_id: string;
  created_at: string;
};

export type TimeOffStatus = "pending" | "approved" | "rejected";

export type TimeOff = {
  id: string;
  tenant_id: string;
  membership_id: string;
  starts_on: string;
  ends_on: string;
  reason: string | null;
  status: TimeOffStatus;
  created_at: string;
  updated_at: string;
};

export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";

export type Appointment = {
  id: string;
  tenant_id: string;
  branch_id: string | null;
  client_id: string;
  membership_id: string;
  service_id: string;
  starts_at: string;
  ends_at: string;
  status: AppointmentStatus;
  price: number;
  notes: string | null;
  cancel_reason: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ScheduleBlock = {
  id: string;
  tenant_id: string;
  branch_id: string | null;
  membership_id: string | null;
  starts_at: string;
  ends_at: string;
  reason: string | null;
  created_at: string;
  updated_at: string;
};

export type Supplier = {
  id: string;
  tenant_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ProductCategory = {
  id: string;
  tenant_id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export type Product = {
  id: string;
  tenant_id: string;
  category_id: string | null;
  supplier_id: string | null;
  sku: string | null;
  name: string;
  description: string | null;
  brand: string | null;
  unit: string;
  cost: number;
  price: number;
  min_stock: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type StockMovementType =
  | "purchase"
  | "transfer_in"
  | "adjustment_in"
  | "sale"
  | "transfer_out"
  | "adjustment_out"
  | "loss";

export type StockMovement = {
  id: string;
  tenant_id: string;
  product_id: string;
  branch_id: string | null;
  movement_type: StockMovementType;
  quantity: number;
  unit_cost: number | null;
  note: string | null;
  created_by: string | null;
  created_at: string;
};

export type StockLevel = {
  tenant_id: string;
  product_id: string;
  branch_id: string | null;
  quantity: number;
  updated_at: string;
};

export type BookingInfo = {
  tenant: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    logo_url: string | null;
    banner_url: string | null;
    timezone: string;
    currency: string;
    phone: string | null;
    socials: SocialLinks;
  } | null;
  services: {
    id: string;
    name: string;
    description: string | null;
    duration_minutes: number;
    price: number;
    category: string | null;
  }[];
  barbers: {
    membership_id: string;
    name: string;
    specialties: string[];
    bio: string | null;
  }[];
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
      service_categories: {
        Row: ServiceCategory;
        Insert: Pick<ServiceCategory, "tenant_id" | "name"> &
          Partial<ServiceCategory>;
        Update: Partial<ServiceCategory>;
        Relationships: [
          {
            foreignKeyName: "service_categories_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      services: {
        Row: Service;
        Insert: Pick<
          Service,
          "tenant_id" | "name" | "duration_minutes" | "price"
        > &
          Partial<Service>;
        Update: Partial<Service>;
        Relationships: [
          {
            foreignKeyName: "services_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "services_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "service_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      barber_profiles: {
        Row: BarberProfile;
        Insert: Pick<BarberProfile, "membership_id" | "tenant_id"> &
          Partial<BarberProfile>;
        Update: Partial<BarberProfile>;
        Relationships: [
          {
            foreignKeyName: "barber_profiles_membership_id_fkey";
            columns: ["membership_id"];
            isOneToOne: true;
            referencedRelation: "memberships";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "barber_profiles_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      barber_services: {
        Row: BarberService;
        Insert: Pick<
          BarberService,
          "membership_id" | "service_id" | "tenant_id"
        > &
          Partial<BarberService>;
        Update: Partial<BarberService>;
        Relationships: [
          {
            foreignKeyName: "barber_services_membership_id_fkey";
            columns: ["membership_id"];
            isOneToOne: false;
            referencedRelation: "memberships";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "barber_services_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "barber_services_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      time_off: {
        Row: TimeOff;
        Insert: Pick<
          TimeOff,
          "tenant_id" | "membership_id" | "starts_on" | "ends_on"
        > &
          Partial<TimeOff>;
        Update: Partial<TimeOff>;
        Relationships: [
          {
            foreignKeyName: "time_off_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "time_off_membership_id_fkey";
            columns: ["membership_id"];
            isOneToOne: false;
            referencedRelation: "memberships";
            referencedColumns: ["id"];
          },
        ];
      };
      appointments: {
        Row: Appointment;
        Insert: Pick<
          Appointment,
          | "tenant_id"
          | "client_id"
          | "membership_id"
          | "service_id"
          | "starts_at"
          | "ends_at"
          | "price"
        > &
          Partial<Appointment>;
        Update: Partial<Appointment>;
        Relationships: [
          {
            foreignKeyName: "appointments_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_membership_id_fkey";
            columns: ["membership_id"];
            isOneToOne: false;
            referencedRelation: "memberships";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
        ];
      };
      schedule_blocks: {
        Row: ScheduleBlock;
        Insert: Pick<ScheduleBlock, "tenant_id" | "starts_at" | "ends_at"> &
          Partial<ScheduleBlock>;
        Update: Partial<ScheduleBlock>;
        Relationships: [
          {
            foreignKeyName: "schedule_blocks_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "schedule_blocks_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "schedule_blocks_membership_id_fkey";
            columns: ["membership_id"];
            isOneToOne: false;
            referencedRelation: "memberships";
            referencedColumns: ["id"];
          },
        ];
      };
      suppliers: {
        Row: Supplier;
        Insert: Pick<Supplier, "tenant_id" | "name"> & Partial<Supplier>;
        Update: Partial<Supplier>;
        Relationships: [
          {
            foreignKeyName: "suppliers_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      product_categories: {
        Row: ProductCategory;
        Insert: Pick<ProductCategory, "tenant_id" | "name"> &
          Partial<ProductCategory>;
        Update: Partial<ProductCategory>;
        Relationships: [
          {
            foreignKeyName: "product_categories_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: Product;
        Insert: Pick<Product, "tenant_id" | "name"> & Partial<Product>;
        Update: Partial<Product>;
        Relationships: [
          {
            foreignKeyName: "products_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "product_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "suppliers";
            referencedColumns: ["id"];
          },
        ];
      };
      stock_movements: {
        Row: StockMovement;
        Insert: Pick<
          StockMovement,
          "tenant_id" | "product_id" | "movement_type" | "quantity"
        > &
          Partial<StockMovement>;
        Update: Partial<StockMovement>;
        Relationships: [
          {
            foreignKeyName: "stock_movements_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stock_movements_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
        ];
      };
      stock_levels: {
        Row: StockLevel;
        Insert: StockLevel;
        Update: Partial<StockLevel>;
        Relationships: [
          {
            foreignKeyName: "stock_levels_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stock_levels_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
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
      owns_membership: {
        Args: { p_membership_id: string };
        Returns: boolean;
      };
      get_user_id_by_email: {
        Args: { p_email: string };
        Returns: string | null;
      };
      get_booking_info: {
        Args: { p_slug: string };
        Returns: BookingInfo;
      };
      available_slots: {
        Args: {
          p_tenant_id: string;
          p_service_id: string;
          p_membership_id: string;
          p_date: string;
        };
        Returns: { slot_start: string; slot_end: string }[];
      };
      book_appointment: {
        Args: {
          p_slug: string;
          p_service_id: string;
          p_membership_id: string;
          p_starts_at: string;
          p_client_name: string;
          p_client_email: string | null;
          p_client_phone: string | null;
        };
        Returns: string;
      };
    };
    Enums: {
      member_role: MemberRole;
      time_off_status: TimeOffStatus;
      appointment_status: AppointmentStatus;
      stock_movement_type: StockMovementType;
    };
    CompositeTypes: Record<string, never>;
  };
};
