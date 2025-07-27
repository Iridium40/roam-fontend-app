export interface Database {
  public: {
    Tables: {
      admin_users: {
        Row: {
          id: string;
          user_id: string;
          email: string;
          permissions: any[] | null;
          is_active: boolean | null;
          created_at: string | null;
          image_url: string | null;
          first_name: string | null;
          last_name: string | null;
          role: UserRole;
        };
        Insert: {
          id?: string;
          user_id: string;
          email: string;
          permissions?: any[] | null;
          is_active?: boolean | null;
          created_at?: string | null;
          image_url?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          role: UserRole;
        };
        Update: {
          id?: string;
          user_id?: string;
          email?: string;
          permissions?: any[] | null;
          is_active?: boolean | null;
          created_at?: string | null;
          image_url?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          role?: UserRole;
        };
      };
      providers: {
        Row: {
          id: string;
          user_id: string;
          business_name: string;
          email: string;
          phone: string;
          first_name: string;
          last_name: string;
          business_type: BusinessType;
          roles: ProviderRole[];
          is_active: boolean;
          verification_status: VerificationStatus;
          created_at: string;
          updated_at: string;
          verified_at: string | null;
          verified_by: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          business_name: string;
          email: string;
          phone: string;
          first_name: string;
          last_name: string;
          business_type: BusinessType;
          roles?: ProviderRole[];
          is_active?: boolean;
          verification_status?: VerificationStatus;
          created_at?: string;
          updated_at?: string;
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          business_name?: string;
          email?: string;
          phone?: string;
          first_name?: string;
          last_name?: string;
          business_type?: BusinessType;
          roles?: ProviderRole[];
          is_active?: boolean;
          verification_status?: VerificationStatus;
          created_at?: string;
          updated_at?: string;
          verified_at?: string | null;
          verified_by?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: UserRole;
    };
  };
}

export type UserRole = "super_admin" | "admin" | "moderator" | "support";

export type AdminUser = Database["public"]["Tables"]["admin_users"]["Row"];
export type Provider = Database["public"]["Tables"]["providers"]["Row"];
