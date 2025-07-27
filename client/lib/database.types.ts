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
          business_id: string;
          location_id: string;
          first_name: string;
          last_name: string;
          email: string;
          phone: string;
          bio: string | null;
          image_url: string | null;
          is_active: boolean;
          created_at: string;
          date_of_birth: string | null;
          experience_years: number | null;
          verification_status: ProviderVerificationStatus;
          background_check_status: BackgroundCheckStatus;
          total_bookings: number;
          completed_bookings: number;
          average_rating: number;
          total_reviews: number;
          provider_role: ProviderRole | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          business_id: string;
          location_id: string;
          first_name: string;
          last_name: string;
          email: string;
          phone: string;
          bio?: string | null;
          image_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          date_of_birth?: string | null;
          experience_years?: number | null;
          verification_status?: ProviderVerificationStatus;
          background_check_status?: BackgroundCheckStatus;
          total_bookings?: number;
          completed_bookings?: number;
          average_rating?: number;
          total_reviews?: number;
          provider_role?: ProviderRole | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          business_id?: string;
          location_id?: string;
          first_name?: string;
          last_name?: string;
          email?: string;
          phone?: string;
          bio?: string | null;
          image_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          date_of_birth?: string | null;
          experience_years?: number | null;
          verification_status?: ProviderVerificationStatus;
          background_check_status?: BackgroundCheckStatus;
          total_bookings?: number;
          completed_bookings?: number;
          average_rating?: number;
          total_reviews?: number;
          provider_role?: ProviderRole | null;
        };
      };
      business_profiles: {
        Row: {
          id: string;
          business_name: string;
          contact_email: string | null;
          phone: string | null;
          verification_status: VerificationStatus;
          stripe_connect_account_id: string | null;
          is_active: boolean;
          created_at: string;
          image_url: string | null;
          website_url: string | null;
          logo_url: string | null;
          cover_image_url: string | null;
          business_hours: any;
          social_media: any;
          verification_notes: string | null;
        };
        Insert: {
          id?: string;
          business_name: string;
          contact_email?: string | null;
          phone?: string | null;
          verification_status?: VerificationStatus;
          stripe_connect_account_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          image_url?: string | null;
          website_url?: string | null;
          logo_url?: string | null;
          cover_image_url?: string | null;
          business_hours?: any;
          social_media?: any;
          verification_notes?: string | null;
        };
        Update: {
          id?: string;
          business_name?: string;
          contact_email?: string | null;
          phone?: string | null;
          verification_status?: VerificationStatus;
          stripe_connect_account_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          image_url?: string | null;
          website_url?: string | null;
          logo_url?: string | null;
          cover_image_url?: string | null;
          business_hours?: any;
          social_media?: any;
          verification_notes?: string | null;
        };
      };
      business_locations: {
        Row: {
          id: string;
          business_id: string;
          location_name: string | null;
          address_line1: string | null;
          address_line2: string | null;
          city: string | null;
          state: string | null;
          postal_code: string | null;
          country: string | null;
          latitude: number | null;
          longitude: number | null;
          is_active: boolean;
          created_at: string;
          is_primary: boolean | null;
          offers_mobile_services: boolean | null;
          mobile_service_radius: number | null;
        };
        Insert: {
          id?: string;
          business_id: string;
          location_name?: string | null;
          address_line1?: string | null;
          address_line2?: string | null;
          city?: string | null;
          state?: string | null;
          postal_code?: string | null;
          country?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          is_active?: boolean;
          created_at?: string;
          is_primary?: boolean | null;
          offers_mobile_services?: boolean | null;
          mobile_service_radius?: number | null;
        };
        Update: {
          id?: string;
          business_id?: string;
          location_name?: string | null;
          address_line1?: string | null;
          address_line2?: string | null;
          city?: string | null;
          state?: string | null;
          postal_code?: string | null;
          country?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          is_active?: boolean;
          created_at?: string;
          is_primary?: boolean | null;
          offers_mobile_services?: boolean | null;
          mobile_service_radius?: number | null;
        };
      };
      business_services: {
        Row: {
          id: string;
          business_id: string;
          service_id: string;
          business_price: number;
          is_active: boolean;
          created_at: string;
          delivery_type: DeliveryType | null;
        };
        Insert: {
          id?: string;
          business_id: string;
          service_id: string;
          business_price: number;
          is_active?: boolean;
          created_at?: string;
          delivery_type?: DeliveryType | null;
        };
        Update: {
          id?: string;
          business_id?: string;
          service_id?: string;
          business_price?: number;
          is_active?: boolean;
          created_at?: string;
          delivery_type?: DeliveryType | null;
        };
      };
      business_addons: {
        Row: {
          id: string;
          business_id: string;
          addon_id: string;
          custom_price: number | null;
          is_available: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          addon_id: string;
          custom_price?: number | null;
          is_available?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          addon_id?: string;
          custom_price?: number | null;
          is_available?: boolean;
          created_at?: string;
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
      business_type: BusinessType;
      provider_role: ProviderRole;
      verification_status: VerificationStatus;
      provider_verification_status: ProviderVerificationStatus;
      background_check_status: BackgroundCheckStatus;
      delivery_type: DeliveryType;
    };
  };
}

export type UserRole = "super_admin" | "admin" | "moderator" | "support";

export type BusinessType = "independent" | "small_business" | "franchise" | "other";

export type ProviderRole = "owner" | "dispatcher" | "provider";

export type VerificationStatus = "pending" | "under_review" | "approved" | "rejected" | "suspended";

export type AdminUser = Database["public"]["Tables"]["admin_users"]["Row"];
export type Provider = Database["public"]["Tables"]["providers"]["Row"];
