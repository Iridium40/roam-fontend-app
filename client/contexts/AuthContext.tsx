import React, { createContext, useContext, useEffect, useState } from "react";
import type { AuthUser, ProviderRole } from "@/lib/database.types";

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasRole: (roles: ProviderRole[]) => boolean;
  hasPermission: (permission: string) => boolean;
  isOwner: boolean;
  isDispatcher: boolean;
  isProvider: boolean;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to restore session from localStorage first
    const initializeAuth = async () => {
      try {
        console.log("AuthContext: Initializing with session restoration...");

        // Check if we have stored session data
        const storedUser = localStorage.getItem('roam_user');
        if (storedUser) {
          console.log("AuthContext: Found stored user session");
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setLoading(false);
          return;
        }

        // If no stored session, try to get current session from Supabase
        const { directSupabaseAPI } = await import("@/lib/directSupabase");

        try {
          const session = await directSupabaseAPI.getSession();
          if (session?.user) {
            console.log("AuthContext: Found active Supabase session, fetching provider...");

            const provider = await directSupabaseAPI.getProviderByUserId(session.user.id);
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
              localStorage.setItem('roam_user', JSON.stringify(userData));
              console.log("AuthContext: Session restored successfully");
            }
          }
        } catch (sessionError) {
          console.log("AuthContext: No active session or error fetching session:", sessionError);
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
      localStorage.setItem('roam_user', JSON.stringify(userData));

      console.log("AuthContext signIn: User state updated and persisted successfully");
    } catch (error) {
      console.error("AuthContext signIn: Error:", error);
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
      localStorage.removeItem('roam_user');
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

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signOut,
    refreshUser,
    hasRole,
    hasPermission,
    isOwner,
    isDispatcher,
    isProvider,
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
        "view_business_profile",
        "view_services_pricing",
        "view_all_bookings",
        "manage_all_bookings",
        "reassign_bookings",
        "view_all_provider_data",
        "view_all_revenue",
        "send_all_messages",
        "manage_all_calendars",
        "send_all_notifications",
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
