import React, { createContext, useContext, useEffect, useState } from "react";
import type { AuthUser, AuthCustomer, ProviderRole } from "@/lib/database.types";

type UserType = "provider" | "customer";

interface AuthContextType {
  user: AuthUser | null;
  customer: AuthCustomer | null;
  userType: UserType | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInCustomer: (email: string, password: string) => Promise<void>;
  signUpCustomer: (customerData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) => Promise<void>;
  updateCustomerProfile: (profileData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth?: string;
    bio?: string;
    imageUrl?: string;
  }) => Promise<void>;
  uploadCustomerAvatar: (file: File) => Promise<string>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasRole: (roles: ProviderRole[]) => boolean;
  hasPermission: (permission: string) => boolean;
  isOwner: boolean;
  isDispatcher: boolean;
  isProvider: boolean;
  isCustomer: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [customer, setCustomer] = useState<AuthCustomer | null>(null);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  const clearStoredData = () => {
    localStorage.removeItem("roam_user");
    localStorage.removeItem("roam_customer");
    localStorage.removeItem("roam_access_token");
    localStorage.removeItem("roam_user_type");
  };

  useEffect(() => {
    // Try to restore session from localStorage first
    const initializeAuth = async () => {
      try {
        console.log("AuthContext: Initializing with session restoration...");

        // Check if we have stored session data
        const storedUser = localStorage.getItem("roam_user");
        const storedCustomer = localStorage.getItem("roam_customer");
        const storedToken = localStorage.getItem("roam_access_token");
        const storedUserType = localStorage.getItem("roam_user_type") as UserType | null;

        if ((storedUser || storedCustomer) && storedToken && storedUserType) {
          console.log("AuthContext: Found stored session and token", {
            hasUser: !!storedUser,
            hasCustomer: !!storedCustomer,
            userType: storedUserType
          });

          // Restore the access token to the directSupabaseAPI
          const { directSupabaseAPI } = await import("@/lib/directSupabase");
          directSupabaseAPI.currentAccessToken = storedToken;

          if (storedUserType === "provider" && storedUser) {
            const userData = JSON.parse(storedUser);
            setUser(userData);
            setUserType("provider");
            console.log("AuthContext: Provider session restored", userData);
          } else if (storedUserType === "customer" && storedCustomer) {
            const customerData = JSON.parse(storedCustomer);
            setCustomer(customerData);
            setUserType("customer");
            console.log("AuthContext: Customer session restored", customerData);
          }

          setLoading(false);
          return;
        } else if ((storedUser || storedCustomer) && (!storedToken || !storedUserType)) {
          console.log("AuthContext: Found incomplete stored session, clearing data");
          clearStoredData();
        }

        // If no stored session, try to get current session from Supabase
        const { directSupabaseAPI } = await import("@/lib/directSupabase");

        try {
          const session = await directSupabaseAPI.getSession();
          if (session?.user) {
            console.log(
              "AuthContext: Found active Supabase session, fetching provider...",
            );

            const provider = await directSupabaseAPI.getProviderByUserId(
              session.user.id,
            );
            if (provider) {
              const userData = {
                id: session.user.id,
                email: provider.email,
                provider_id: provider.id,
                business_id: provider.business_id,
                location_id: provider.location_id,
                provider_role: provider.provider_role,
                first_name: provider.first_name,
                last_name: provider.last_name,
              };

              setUser(userData);
              setUserType("provider");
              localStorage.setItem("roam_user", JSON.stringify(userData));
              localStorage.setItem("roam_user_type", "provider");
              console.log("AuthContext: Provider session restored successfully");
            } else {
              console.log("AuthContext: Provider not found, clearing stored session");
              clearStoredData();
            }
          } else {
            console.log("AuthContext: No active session, clearing stored data if any");
            clearStoredData();
          }
        } catch (sessionError) {
          console.log(
            "AuthContext: Error during session restoration:",
            sessionError,
          );
          // Clear potentially corrupted stored data
          clearStoredData();
        }
      } catch (error) {
        console.error("AuthContext: Error during initialization:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      console.log("AuthContext signIn: Starting authentication...");

      // Use direct API to bypass hanging Supabase client
      const { directSupabaseAPI } = await import("@/lib/directSupabase");

      const authData = await directSupabaseAPI.signInWithPassword(
        email,
        password,
      );

      if (!authData.user) {
        console.error("AuthContext signIn: No user returned");
        throw new Error("Authentication failed - no user returned");
      }

      console.log("AuthContext signIn: Auth successful, fetching profile...");

      // Use direct API for provider lookup too
      const provider = await directSupabaseAPI.getProviderByUserId(
        authData.user.id,
      );

      if (!provider) {
        console.error("AuthContext signIn: No provider found");
        await directSupabaseAPI.signOut();
        throw new Error("Provider account not found or inactive");
      }

      console.log("AuthContext signIn: Provider found:", provider);

      const userData = {
        id: authData.user.id,
        email: provider.email,
        provider_id: provider.id,
        business_id: provider.business_id,
        location_id: provider.location_id,
        provider_role: provider.provider_role,
        first_name: provider.first_name,
        last_name: provider.last_name,
      };

      setUser(userData);
      setUserType("provider");
      localStorage.setItem("roam_user", JSON.stringify(userData));
      localStorage.setItem("roam_access_token", authData.access_token);
      localStorage.setItem("roam_user_type", "provider");

      console.log(
        "AuthContext signIn: Provider state updated and persisted successfully",
      );
    } catch (error) {
      console.error("AuthContext signIn: Error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInCustomer = async (email: string, password: string) => {
    setLoading(true);
    try {
      console.log("AuthContext signInCustomer: Starting authentication...");

      const { directSupabaseAPI } = await import("@/lib/directSupabase");

      const authData = await directSupabaseAPI.signInWithPassword(
        email,
        password,
      );

      if (!authData.user) {
        console.error("AuthContext signInCustomer: No user returned");
        throw new Error("Authentication failed - no user returned");
      }

      console.log("AuthContext signInCustomer: Auth successful, using auth user data...");

      // For now, use the auth user data directly since customers table may not exist
      // Extract name from email or use placeholder values
      const emailParts = authData.user.email?.split('@')[0] || '';
      const nameParts = emailParts.split('.');

      const customerData = {
        id: authData.user.id,
        email: authData.user.email || email,
        customer_id: authData.user.id, // Use user ID as customer ID for now
        first_name: nameParts[0] || "Customer",
        last_name: nameParts[1] || "",
        phone: null,
      };

      setCustomer(customerData);
      setUserType("customer");
      localStorage.setItem("roam_customer", JSON.stringify(customerData));
      localStorage.setItem("roam_access_token", authData.access_token);
      localStorage.setItem("roam_user_type", "customer");

      console.log(
        "AuthContext signInCustomer: Customer state updated and persisted successfully",
      );
    } catch (error) {
      console.error("AuthContext signInCustomer: Error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUpCustomer = async (customerData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) => {
    setLoading(true);
    try {
      console.log("AuthContext signUpCustomer: Starting registration...");

      const { directSupabaseAPI } = await import("@/lib/directSupabase");

      // Create auth user first
      const authData = await directSupabaseAPI.signUpWithPassword(
        customerData.email,
        customerData.password,
      );

      console.log("AuthContext signUpCustomer: Sign up response:", authData);

      // Supabase sign up may not return user immediately if email confirmation is required
      if (!authData.user && !authData.session) {
        console.log("AuthContext signUpCustomer: Email confirmation required");
        // This is normal for Supabase with email confirmation enabled
        return; // Exit gracefully - user needs to confirm email
      }

      console.log("AuthContext signUpCustomer: Auth user created successfully");

      // For now, we'll just use the auth user without creating a separate customer profile
      // since the customers table may not exist yet. The user metadata can be updated later
      // when the customers table is available.

      console.log("AuthContext signUpCustomer: Customer registration completed successfully");
    } catch (error) {
      console.error("AuthContext signUpCustomer: Error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateCustomerProfile = async (profileData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth?: string;
    bio?: string;
  }) => {
    if (!customer) {
      throw new Error("No customer logged in");
    }

    setLoading(true);
    try {
      console.log("AuthContext updateCustomerProfile: Starting update...");

      const { directSupabaseAPI } = await import("@/lib/directSupabase");

      // For now, since we don't have the customers table, we'll simulate the update
      // and update the local customer state
      console.log("AuthContext updateCustomerProfile: Updating customer data...");

      // Update local customer state
      const updatedCustomer = {
        ...customer,
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        email: profileData.email,
        phone: profileData.phone || null,
        image_url: profileData.imageUrl || customer.image_url,
      };

      setCustomer(updatedCustomer);
      localStorage.setItem("roam_customer", JSON.stringify(updatedCustomer));

      console.log("AuthContext updateCustomerProfile: Profile updated successfully");
    } catch (error) {
      console.error("AuthContext updateCustomerProfile: Error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      const { directSupabaseAPI } = await import("@/lib/directSupabase");
      await directSupabaseAPI.signOut();
    } catch (error) {
      console.warn("SignOut error:", error);
    } finally {
      setUser(null);
      setCustomer(null);
      setUserType(null);
      clearStoredData();
    }
  };

  const refreshUser = async () => {
    // Since we're managing auth state directly, refreshUser is not needed
    // User state is updated directly in signIn method
    console.log("refreshUser: Not implemented - using direct auth management");
  };

  const hasRole = (roles: ProviderRole[]): boolean => {
    return user ? roles.includes(user.provider_role) : false;
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;

    const permissions = getPermissions(user.provider_role);
    return permissions.includes(permission);
  };

  const isOwner = user?.provider_role === "owner";
  const isDispatcher = user?.provider_role === "dispatcher";
  const isProvider = user?.provider_role === "provider";
  const isCustomer = userType === "customer";
  const isAuthenticated = !!(user || customer);

  const value: AuthContextType = {
    user,
    customer,
    userType,
    loading,
    signIn,
    signInCustomer,
    signUpCustomer,
    updateCustomerProfile,
    signOut,
    refreshUser,
    hasRole,
    hasPermission,
    isOwner,
    isDispatcher,
    isProvider,
    isCustomer,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Permission definitions based on role matrix from spec
const getPermissions = (role: ProviderRole): string[] => {
  const basePermissions = ["view_own_profile", "edit_own_profile"];

  switch (role) {
    case "owner":
      return [
        ...basePermissions,
        "manage_business_profile",
        "manage_services_pricing",
        "manage_staff",
        "view_all_bookings",
        "manage_all_bookings",
        "reassign_bookings",
        "view_all_provider_data",
        "view_all_revenue",
        "send_all_messages",
        "manage_all_calendars",
        "send_all_notifications",
        "manage_integrations",
        "view_analytics",
        "manage_subscription",
        "manage_locations",
      ];

    case "dispatcher":
      return [
        ...basePermissions,
        "manage_business_profile",
        "manage_services_pricing",
        "manage_staff",
        "view_all_bookings",
        "manage_all_bookings",
        "reassign_bookings",
        "view_all_provider_data",
        "view_all_revenue",
        "send_all_messages",
        "manage_all_calendars",
        "send_all_notifications",
        "manage_integrations",
        "view_analytics",
        "manage_subscription",
        "manage_locations",
      ];

    case "provider":
      return [
        ...basePermissions,
        "view_business_profile",
        "view_services_pricing",
        "view_own_bookings",
        "manage_own_bookings",
        "view_own_revenue",
        "send_own_messages",
        "manage_own_calendar",
        "receive_notifications",
      ];

    default:
      return basePermissions;
  }
};
