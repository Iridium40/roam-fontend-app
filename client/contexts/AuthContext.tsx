import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
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
    // Get initial session
    const initAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        await fetchUserProfile(session.user.id);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: provider, error } = await supabase
        .from("providers")
        .select(
          `
          id,
          business_id,
          location_id,
          first_name,
          last_name,
          provider_role,
          is_active,
          email
        `,
        )
        .eq("user_id", userId)
        .eq("is_active", true)
        .single();

      if (error || !provider) {
        console.error("Provider not found or inactive:", error);
        await supabase.auth.signOut();
        return;
      }

      setUser({
        id: userId,
        email: provider.email,
        provider_id: provider.id,
        business_id: provider.business_id,
        location_id: provider.location_id,
        provider_role: provider.provider_role,
        first_name: provider.first_name,
        last_name: provider.last_name,
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setUser(null);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    if (data.user) {
      await fetchUserProfile(data.user.id);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    setUser(null);
  };

  const refreshUser = async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (authUser) {
      await fetchUserProfile(authUser.id);
    }
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
