import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LogOut,
  Calendar,
  DollarSign,
  Star,
  Users,
  TrendingUp,
  Clock,
  MapPin,
  Phone,
  Mail,
  Edit,
  Plus,
  Settings,
  Bell,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  BarChart3,
  MessageCircle,
  Camera,
  Smartphone,
  Building,
  Video,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Provider, Booking, BusinessProfile } from "@/lib/database.types";

export default function ProviderDashboard() {
  const { user, signOut, isOwner, isDispatcher, isProvider } = useAuth();
  const { toast } = useToast();
  const [isAvailable, setIsAvailable] = useState(true);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [businessMetrics, setBusinessMetrics] = useState({
    activeLocations: 0,
    teamMembers: 0,
    servicesOffered: 0,
  });
  const [businessHours, setBusinessHours] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [businessHoursSaving, setBusinessHoursSaving] = useState(false);
  const [businessHoursError, setBusinessHoursError] = useState("");
  const [businessHoursSuccess, setBusinessHoursSuccess] = useState("");
  const [editingBusinessHours, setEditingBusinessHours] = useState(false);
  const [managingLocations, setManagingLocations] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [locationsSaving, setLocationsSaving] = useState(false);
  const [locationsError, setLocationsError] = useState("");
  const [locationsSuccess, setLocationsSuccess] = useState("");
  const [editingLocation, setEditingLocation] = useState<any>(null);
  const [addingLocation, setAddingLocation] = useState(false);
  const [managingBusinessDetails, setManagingBusinessDetails] = useState(false);
  const [businessDetailsSaving, setBusinessDetailsSaving] = useState(false);
  const [businessDetailsError, setBusinessDetailsError] = useState("");
  const [businessDetailsSuccess, setBusinessDetailsSuccess] = useState("");
  const [businessServices, setBusinessServices] = useState<any[]>([]);
  const [businessAddons, setBusinessAddons] = useState<any[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [servicesError, setServicesError] = useState("");
  const [activeTab, setActiveTab] = useState("bookings");
  const [editingService, setEditingService] = useState<any>(null);
  const [serviceForm, setServiceForm] = useState({
    delivery_type: "business_location",
    custom_price: "",
    is_active: true,
  });
  const [serviceSaving, setServiceSaving] = useState(false);
  const [serviceError, setServiceError] = useState("");
  const [serviceSuccess, setServiceSuccess] = useState("");
  const [addingService, setAddingService] = useState(false);
  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const [availableServicesLoading, setAvailableServicesLoading] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [addServiceForm, setAddServiceForm] = useState({
    delivery_type: "business_location",
    custom_price: "",
    is_active: true,
  });

  // Form state for contact information
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    bio: "",
    dateOfBirth: "",
    experienceYears: "",
  });

  // Business hours editing state
  const [businessHoursForm, setBusinessHoursForm] = useState({
    Monday: { isOpen: false, open: "09:00", close: "17:00" },
    Tuesday: { isOpen: false, open: "09:00", close: "17:00" },
    Wednesday: { isOpen: false, open: "09:00", close: "17:00" },
    Thursday: { isOpen: false, open: "09:00", close: "17:00" },
    Friday: { isOpen: false, open: "09:00", close: "17:00" },
    Saturday: { isOpen: false, open: "09:00", close: "17:00" },
    Sunday: { isOpen: false, open: "09:00", close: "17:00" },
  });

  // Location form state
  const [locationForm, setLocationForm] = useState({
    location_name: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "FL",
    postal_code: "",
    country: "US",
    is_primary: false,
    offers_mobile_services: false,
    mobile_service_radius: 10,
    is_active: true,
  });

  // Business details form state - matches database schema
  const [businessDetailsForm, setBusinessDetailsForm] = useState({
    business_name: "",
    business_type: "",
    business_description: "",
    contact_email: "",
    phone: "",
    website_url: "",
    years_in_business: "",
    logo_url: "",
    verification_status: "",
    is_active: true,
    setup_completed: false,
  });
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState("");
  const navigate = useNavigate();

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60),
    );

    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} day${days > 1 ? "s" : ""} ago`;
    }
  };

  const formatTimeTo12Hour = (time24: string) => {
    if (!time24) return "";

    const [hours, minutes] = time24.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12; // Convert 0 to 12 for midnight

    return `${hour12}:${minutes} ${ampm}`;
  };

  const formatBusinessType = (businessType: string) => {
    if (!businessType) return "";

    // Convert underscore to space and capitalize each word
    return businessType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const formatVerificationStatus = (status: string) => {
    const statusMap = {
      pending: "Pending",
      verified: "Verified",
      rejected: "Rejected",
      suspended: "Suspended"
    };
    return statusMap[status] || status;
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !business) return;

    setLogoUploading(true);
    setLogoError("");

    try {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        throw new Error("Please select an image file");
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("File size must be less than 5MB");
      }

      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `business-logo-${business.id}-${Date.now()}.${fileExt}`;
      const filePath = `business-logos/${fileName}`;

      // Use direct API for authenticated operations
      const { directSupabaseAPI } = await import("@/lib/directSupabase");

      // Remove old logo if exists
      if (business.logo_url) {
        try {
          const urlParts = business.logo_url.split("/");
          const oldFileName = urlParts[urlParts.length - 1];
          const oldFilePath = `business-logos/${oldFileName}`;
          await directSupabaseAPI.deleteFile("roam-file-storage", oldFilePath);
        } catch (deleteError) {
          console.warn("Failed to delete old logo:", deleteError);
          // Continue with upload even if delete fails
        }
      }

      // Upload new logo using direct API
      const { publicUrl } = await directSupabaseAPI.uploadFile(
        "roam-file-storage",
        filePath,
        file,
      );

      // Update business form state
      setBusinessDetailsForm(prev => ({ ...prev, logo_url: publicUrl }));

      // Also update the business state for immediate UI reflection
      setBusiness(prev => prev ? { ...prev, logo_url: publicUrl } : prev);

      toast({
        title: "Logo Uploaded",
        description: "Business logo has been uploaded successfully!",
        variant: "default",
      });
    } catch (error: any) {
      console.error("Logo upload error:", error);
      let errorMessage = "Failed to upload logo";

      if (error?.error && typeof error.error === "string") {
        errorMessage = error.error;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      setLogoError(errorMessage);
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLogoUploading(false);
      // Reset file input
      event.target.value = "";
    }
  };

  const handleLogoRemove = async () => {
    if (!business?.logo_url) return;

    setLogoUploading(true);
    setLogoError("");

    try {
      const { directSupabaseAPI } = await import("@/lib/directSupabase");

      // Extract filename from URL
      const urlParts = business.logo_url.split("/");
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `business-logos/${fileName}`;

      // Remove from storage using direct API
      await directSupabaseAPI.deleteFile("roam-file-storage", filePath);

      // Update business form state
      setBusinessDetailsForm(prev => ({ ...prev, logo_url: "" }));

      // Also update the business state for immediate UI reflection
      setBusiness(prev => prev ? { ...prev, logo_url: null } : prev);

      toast({
        title: "Logo Removed",
        description: "Business logo has been removed successfully!",
        variant: "default",
      });
    } catch (error: any) {
      console.error("Logo remove error:", error);
      let errorMessage = "Failed to remove logo";

      if (error?.error && typeof error.error === "string") {
        errorMessage = error.error;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      setLogoError(errorMessage);
      toast({
        title: "Remove Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLogoUploading(false);
    }
  };

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !provider) return;

    setAvatarUploading(true);
    setAvatarError("");

    try {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        throw new Error("Please select an image file");
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("File size must be less than 5MB");
      }

      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${provider.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatar-provider-user/${fileName}`;

      // Use direct API for authenticated operations
      const { directSupabaseAPI } = await import("@/lib/directSupabase");

      // Remove old avatar if exists
      if (provider.image_url) {
        try {
          const urlParts = provider.image_url.split("/");
          const oldFileName = urlParts[urlParts.length - 1];
          const oldFilePath = `avatar-provider-user/${oldFileName}`;
          await directSupabaseAPI.deleteFile("roam-file-storage", oldFilePath);
        } catch (deleteError) {
          console.warn("Failed to delete old avatar:", deleteError);
          // Continue with upload even if delete fails
        }
      }

      // Upload new avatar using direct API
      const { publicUrl } = await directSupabaseAPI.uploadFile(
        "roam-file-storage",
        filePath,
        file,
      );

      // Update provider record using direct API
      await directSupabaseAPI.updateProviderImage(provider.id, publicUrl);

      // Update local state
      setProvider({ ...provider, image_url: publicUrl });
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      console.error("Error type:", typeof error);
      console.error("Error keys:", Object.keys(error || {}));

      let errorMessage = "Failed to upload avatar";

      // Handle Supabase storage error structure
      if (error?.error && typeof error.error === "string") {
        errorMessage = error.error;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else if (error?.statusCode && error?.error) {
        errorMessage = `Error ${error.statusCode}: ${error.error}`;
      } else if (error?.details) {
        errorMessage = error.details;
      } else if (error?.hint) {
        errorMessage = error.hint;
      }

      setAvatarError(errorMessage);
    } finally {
      setAvatarUploading(false);
      // Reset file input
      event.target.value = "";
    }
  };

  const handleAvatarRemove = async () => {
    if (!provider?.image_url) return;

    setAvatarUploading(true);
    setAvatarError("");

    try {
      // Use direct API for authenticated operations
      const { directSupabaseAPI } = await import("@/lib/directSupabase");

      // Extract filename from URL
      const urlParts = provider.image_url.split("/");
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `avatar-provider-user/${fileName}`;

      // Remove from storage using direct API
      await directSupabaseAPI.deleteFile("roam-file-storage", filePath);

      // Update provider record using direct API
      await directSupabaseAPI.updateProviderImage(provider.id, null);

      // Update local state
      setProvider({ ...provider, image_url: null });
    } catch (error: any) {
      console.error("Avatar remove error:", error);
      let errorMessage = "Failed to remove avatar";

      // Handle Supabase storage error structure
      if (error?.error && typeof error.error === "string") {
        errorMessage = error.error;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else if (error?.statusCode && error?.error) {
        errorMessage = `Error ${error.statusCode}: ${error.error}`;
      } else if (error?.details) {
        errorMessage = error.details;
      } else if (error?.hint) {
        errorMessage = error.hint;
      }

      setAvatarError(errorMessage);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear success/error messages when user starts typing
    if (profileSuccess) setProfileSuccess("");
    if (profileError) setProfileError("");
  };

  const handleSaveProfile = async () => {
    if (!provider) return;

    setProfileSaving(true);
    setProfileError("");
    setProfileSuccess("");

    try {
      const { directSupabaseAPI } = await import("@/lib/directSupabase");

      // Prepare update data
      const updateData = {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        bio: formData.bio.trim(),
        date_of_birth: formData.dateOfBirth || null,
        experience_years: formData.experienceYears
          ? parseInt(formData.experienceYears)
          : null,
      };

      // Validate required fields
      if (
        !updateData.first_name ||
        !updateData.last_name ||
        !updateData.email
      ) {
        throw new Error("First name, last name, and email are required");
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updateData.email)) {
        throw new Error("Please enter a valid email address");
      }

      // Update provider using direct API
      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/rest/v1/providers?id=eq.${provider.id}`,
        {
          method: "PATCH",
          headers: {
            apikey: import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${directSupabaseAPI.currentAccessToken || import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify(updateData),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update profile: ${errorText}`);
      }

      // Update local provider state
      setProvider({
        ...provider,
        ...updateData,
      });

      setProfileSuccess("Profile updated successfully!");
    } catch (error: any) {
      console.error("Profile save error:", error);
      let errorMessage = "Failed to update profile";

      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      setProfileError(errorMessage);
    } finally {
      setProfileSaving(false);
    }
  };

  const handleBusinessHoursChange = (
    day: string,
    field: string,
    value: string | boolean,
  ) => {
    setBusinessHoursForm((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));

    // Clear messages when user makes changes
    if (businessHoursSuccess) setBusinessHoursSuccess("");
    if (businessHoursError) setBusinessHoursError("");
  };

  const handleSaveBusinessHours = async () => {
    if (!business) return;

    setBusinessHoursSaving(true);
    setBusinessHoursError("");
    setBusinessHoursSuccess("");

    try {
      const { directSupabaseAPI } = await import("@/lib/directSupabase");

      // Convert form data to the required JSON format
      const businessHoursJson = {};
      Object.keys(businessHoursForm).forEach((day) => {
        if (businessHoursForm[day].isOpen) {
          businessHoursJson[day] = {
            open: businessHoursForm[day].open,
            close: businessHoursForm[day].close,
          };
        }
      });

      // Update business_profiles using direct API
      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/rest/v1/business_profiles?id=eq.${business.id}`,
        {
          method: "PATCH",
          headers: {
            apikey: import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${directSupabaseAPI.currentAccessToken || import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify({ business_hours: businessHoursJson }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update business hours: ${errorText}`);
      }

      // Update local state
      setBusinessHours(businessHoursJson);
      setBusiness({
        ...business,
        business_hours: businessHoursJson,
      });

      setBusinessHoursSuccess("Business hours updated successfully!");
      setEditingBusinessHours(false);
    } catch (error: any) {
      console.error("Business hours save error:", error);
      let errorMessage = "Failed to update business hours";

      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      setBusinessHoursError(errorMessage);
    } finally {
      setBusinessHoursSaving(false);
    }
  };

  const handleCancelBusinessHours = () => {
    // Reset form to current data
    if (businessHours) {
      const resetForm = {
        Monday: { isOpen: false, open: "09:00", close: "17:00" },
        Tuesday: { isOpen: false, open: "09:00", close: "17:00" },
        Wednesday: { isOpen: false, open: "09:00", close: "17:00" },
        Thursday: { isOpen: false, open: "09:00", close: "17:00" },
        Friday: { isOpen: false, open: "09:00", close: "17:00" },
        Saturday: { isOpen: false, open: "09:00", close: "17:00" },
        Sunday: { isOpen: false, open: "09:00", close: "17:00" },
      };

      Object.keys(resetForm).forEach((day) => {
        if (businessHours[day]) {
          resetForm[day] = {
            isOpen: true,
            open: businessHours[day].open || "09:00",
            close: businessHours[day].close || "17:00",
          };
        }
      });

      setBusinessHoursForm(resetForm);
    }

    setEditingBusinessHours(false);
    setBusinessHoursError("");
    setBusinessHoursSuccess("");
  };

  const fetchLocations = async () => {
    if (!provider) {
      console.log("fetchLocations: No provider available");
      return;
    }

    console.log("fetchLocations: Starting fetch for business_id:", provider.business_id);
    setLocationsLoading(true);
    try {
      const { data, error } = await supabase
        .from("business_locations")
        .select("*")
        .eq("business_id", provider.business_id)
        .order("created_at", { ascending: false });

      console.log("fetchLocations: Query result:", { data, error });

      if (error) throw error;
      setLocations(data || []);
      console.log("fetchLocations: Set locations to:", data || []);
    } catch (error: any) {
      console.error("Error fetching locations:", error);
      toast({
        title: "Error",
        description: "Failed to load locations",
        variant: "destructive",
      });
      setLocationsError("Failed to load locations");
    } finally {
      setLocationsLoading(false);
    }
  };

  const handleLocationFormChange = (field: string, value: any) => {
    // Special handling for primary location changes
    if (field === "is_primary" && value === true) {
      const currentPrimary = locations.find(loc => loc.is_primary && loc.id !== editingLocation?.id);
      if (currentPrimary) {
        const confirmed = confirm(
          `Setting this location as primary will remove the primary status from "${currentPrimary.location_name}". Continue?`
        );
        if (!confirmed) {
          return; // Don't update if user cancels
        }

        toast({
          title: "Primary Location Changed",
          description: `"${currentPrimary.location_name}" is no longer the primary location.`,
          variant: "default",
        });
      }
    }

    setLocationForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetLocationForm = () => {
    setLocationForm({
      location_name: "",
      address_line1: "",
      address_line2: "",
      city: "",
      state: "FL",
      postal_code: "",
      country: "US",
      is_primary: false,
      offers_mobile_services: false,
      mobile_service_radius: 10,
      is_active: true,
    });
  };

  const handleSaveLocation = async () => {
    if (!provider) return;

    setLocationsSaving(true);
    setLocationsError("");
    setLocationsSuccess("");

    try {
      const { directSupabaseAPI } = await import("@/lib/directSupabase");

      const locationData = {
        ...locationForm,
        business_id: provider.business_id,
      };

      // Validate required fields
      if (
        !locationData.location_name ||
        !locationData.address_line1 ||
        !locationData.city
      ) {
        throw new Error("Location name, address, and city are required");
      }

      // If this location is being set as primary, unset any other primary locations
      if (locationData.is_primary) {
        await fetch(
          `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/rest/v1/business_locations?business_id=eq.${provider.business_id}&is_primary=eq.true`,
          {
            method: "PATCH",
            headers: {
              apikey: import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
              Authorization: `Bearer ${directSupabaseAPI.currentAccessToken || import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY}`,
              "Content-Type": "application/json",
              Prefer: "return=minimal",
            },
            body: JSON.stringify({ is_primary: false }),
          },
        );
      }

      let response;
      if (editingLocation) {
        // Update existing location
        response = await fetch(
          `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/rest/v1/business_locations?id=eq.${editingLocation.id}`,
          {
            method: "PATCH",
            headers: {
              apikey: import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
              Authorization: `Bearer ${directSupabaseAPI.currentAccessToken || import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY}`,
              "Content-Type": "application/json",
              Prefer: "return=minimal",
            },
            body: JSON.stringify(locationData),
          },
        );
      } else {
        // Create new location
        response = await fetch(
          `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/rest/v1/business_locations`,
          {
            method: "POST",
            headers: {
              apikey: import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
              Authorization: `Bearer ${directSupabaseAPI.currentAccessToken || import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY}`,
              "Content-Type": "application/json",
              Prefer: "return=minimal",
            },
            body: JSON.stringify(locationData),
          },
        );
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save location: ${errorText}`);
      }

      const locationName = locationData.location_name;
      toast({
        title: editingLocation ? "Location Updated" : "Location Added",
        description: editingLocation
          ? `\"${locationName}\" has been updated successfully!`
          : `\"${locationName}\" has been added to your business!`,
        variant: "default",
      });

      setEditingLocation(null);
      setAddingLocation(false);
      resetLocationForm();
      await fetchLocations();
    } catch (error: any) {
      console.error("Location save error:", error);
      let errorMessage = "Failed to save location";

      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      setLocationsError(errorMessage);
    } finally {
      setLocationsSaving(false);
    }
  };

  const handleEditLocation = (location: any) => {
    setLocationForm({
      location_name: location.location_name || "",
      address_line1: location.address_line1 || "",
      address_line2: location.address_line2 || "",
      city: location.city || "",
      state: location.state || "FL",
      postal_code: location.postal_code || "",
      country: location.country || "US",
      is_primary: location.is_primary || false,
      offers_mobile_services: location.offers_mobile_services || false,
      mobile_service_radius: location.mobile_service_radius || 10,
      is_active: location.is_active !== false,
    });
    setEditingLocation(location);
    setAddingLocation(true);
    setManagingLocations(true);

    toast({
      title: "Edit Location",
      description: `Editing \"${location.location_name}\" - make your changes and save.`,
      variant: "default",
    });
  };

  const handleDeleteLocation = async (locationId: string) => {
    // Find the location being deleted for better messaging
    const locationToDelete = locations.find(loc => loc.id === locationId);
    const locationName = locationToDelete?.location_name || "this location";

    // Enhanced confirmation with location name
    const confirmed = confirm(
      `Are you sure you want to delete \"${locationName}\"?\n\nThis action cannot be undone. Any bookings or assignments to this location may be affected.`
    );

    if (!confirmed) return;

    // Check if trying to delete primary location
    if (locationToDelete?.is_primary) {
      const confirmPrimary = confirm(
        `Warning: \"${locationName}\" is your primary location.\n\nDeleting it will leave your business without a primary location. Are you sure you want to continue?`
      );
      if (!confirmPrimary) return;
    }

    setLocationsSaving(true);

    // Show deleting toast
    toast({
      title: "Deleting Location",
      description: `Removing \"${locationName}\" from your business...`,
      variant: "default",
    });

    try {
      const { directSupabaseAPI } = await import("@/lib/directSupabase");

      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/rest/v1/business_locations?id=eq.${locationId}`,
        {
          method: "DELETE",
          headers: {
            apikey: import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${directSupabaseAPI.currentAccessToken || import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY}`,
          },
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete location: ${errorText}`);
      }

      toast({
        title: "Location Deleted",
        description: `\"${locationName}\" has been successfully removed from your business.`,
        variant: "default",
      });
      await fetchLocations();
    } catch (error: any) {
      console.error("Location delete error:", error);
      const errorMessage = error.message || "Failed to delete location";
      toast({
        title: "Delete Failed",
        description: `Failed to delete \"${locationName}\": ${errorMessage}`,
        variant: "destructive",
      });
      setLocationsError(errorMessage);
    } finally {
      setLocationsSaving(false);
    }
  };

  const handleCancelLocationEdit = () => {
    setEditingLocation(null);
    setAddingLocation(false);
    resetLocationForm();
  };

  const handleBusinessDetailsFormChange = (field: string, value: string) => {
    setBusinessDetailsForm(prev => ({ ...prev, [field]: value }));
    if (businessDetailsSuccess) setBusinessDetailsSuccess("");
    if (businessDetailsError) setBusinessDetailsError("");
  };

  const handleServiceFormChange = (field: string, value: any) => {
    setServiceForm(prev => ({ ...prev, [field]: value }));
    if (serviceSuccess) setServiceSuccess("");
    if (serviceError) setServiceError("");
  };

  const handleEditService = (businessService: any) => {
    setServiceForm({
      delivery_type: businessService.delivery_type || "business_location",
      custom_price: businessService.custom_price?.toString() || "",
      is_active: businessService.is_active !== false,
    });
    setEditingService(businessService);
    setServiceError("");
    setServiceSuccess("");
  };

  const handleSaveService = async () => {
    if (!editingService || !provider) return;

    setServiceSaving(true);
    setServiceError("");
    setServiceSuccess("");

    try {
      const { directSupabaseAPI } = await import("@/lib/directSupabase");

      const updateData = {
        delivery_type: serviceForm.delivery_type,
        custom_price: serviceForm.custom_price ? parseFloat(serviceForm.custom_price) : null,
        is_active: serviceForm.is_active,
      };

      // Validate price if provided
      if (serviceForm.custom_price && (isNaN(parseFloat(serviceForm.custom_price)) || parseFloat(serviceForm.custom_price) < 0)) {
        throw new Error("Please enter a valid price (0 or greater)");
      }

      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/rest/v1/business_services?id=eq.${editingService.id}`,
        {
          method: "PATCH",
          headers: {
            apikey: import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${directSupabaseAPI.currentAccessToken || import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify(updateData),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update service: ${errorText}`);
      }

      // Update local state
      setBusinessServices(prev =>
        prev.map(service =>
          service.id === editingService.id
            ? { ...service, ...updateData }
            : service
        )
      );

      setServiceSuccess("Service updated successfully!");
      setEditingService(null);
    } catch (error: any) {
      console.error("Service save error:", error);
      let errorMessage = "Failed to update service";

      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      setServiceError(errorMessage);
    } finally {
      setServiceSaving(false);
    }
  };

  const handleCancelServiceEdit = () => {
    setEditingService(null);
    setServiceForm({
      delivery_type: "business_location",
      custom_price: "",
      is_active: true,
    });
    setServiceError("");
    setServiceSuccess("");
  };

  const getDeliveryTypeLabel = (type: string) => {
    const labels = {
      business_location: "In-Studio/Business",
      customer_location: "Mobile",
      virtual: "Virtual",
      both_locations: "In-Studio or Mobile",
    };
    return labels[type] || type;
  };

  const fetchAvailableServices = async () => {
    if (!provider) return;

    setAvailableServicesLoading(true);
    try {
      // Get all services
      const { data: allServices, error: servicesError } = await supabase
        .from("services")
        .select(`
          *,
          service_subcategories (
            id,
            name,
            service_categories (
              id,
              name
            )
          )
        `)
        .order("name");

      if (servicesError) throw servicesError;

      // Get currently added business services
      const { data: businessServices, error: businessError } = await supabase
        .from("business_services")
        .select("service_id")
        .eq("business_id", provider.business_id);

      if (businessError) throw businessError;

      // Filter out already added services
      const addedServiceIds = new Set(businessServices?.map(bs => bs.service_id) || []);
      const available = allServices?.filter(service => !addedServiceIds.has(service.id)) || [];

      setAvailableServices(available);
    } catch (error: any) {
      console.error("Error fetching available services:", error);
      setServiceError(`Failed to load available services: ${error.message}`);
    } finally {
      setAvailableServicesLoading(false);
    }
  };

  const handleAddServiceFormChange = (field: string, value: any) => {
    setAddServiceForm(prev => ({ ...prev, [field]: value }));
  };

  const handleStartAddService = () => {
    setAddingService(true);
    setSelectedServiceId("");
    setAddServiceForm({
      delivery_type: "business_location",
      custom_price: "",
      is_active: true,
    });
    setServiceError("");
    setServiceSuccess("");
    fetchAvailableServices();
  };

  const handleAddService = async () => {
    if (!selectedServiceId || !provider) {
      setServiceError("Please select a service to add");
      return;
    }

    setServiceSaving(true);
    setServiceError("");
    setServiceSuccess("");

    try {
      const { directSupabaseAPI } = await import("@/lib/directSupabase");

      const addData = {
        business_id: provider.business_id,
        service_id: selectedServiceId,
        delivery_type: addServiceForm.delivery_type,
        custom_price: addServiceForm.custom_price ? parseFloat(addServiceForm.custom_price) : null,
        is_active: addServiceForm.is_active,
      };

      // Validate price if provided
      if (addServiceForm.custom_price && (isNaN(parseFloat(addServiceForm.custom_price)) || parseFloat(addServiceForm.custom_price) < 0)) {
        throw new Error("Please enter a valid price (0 or greater)");
      }

      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/rest/v1/business_services`,
        {
          method: "POST",
          headers: {
            apikey: import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${directSupabaseAPI.currentAccessToken || import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify(addData),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to add service: ${errorText}`);
      }

      setServiceSuccess("Service added successfully!");
      setAddingService(false);

      // Refresh business services
      await fetchBusinessServices();
    } catch (error: any) {
      console.error("Service add error:", error);
      let errorMessage = "Failed to add service";

      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      setServiceError(errorMessage);
    } finally {
      setServiceSaving(false);
    }
  };

  const handleCancelAddService = () => {
    setAddingService(false);
    setSelectedServiceId("");
    setAddServiceForm({
      delivery_type: "business_location",
      custom_price: "",
      is_active: true,
    });
    setServiceError("");
    setServiceSuccess("");
  };

  const fetchBusinessServices = async () => {
    if (!provider) {
      console.log("fetchBusinessServices: No provider available");
      return;
    }

    console.log("fetchBusinessServices: Provider data:", provider);
    console.log("fetchBusinessServices: User data:", user);
    console.log("fetchBusinessServices: Starting fetch for business_id:", provider.business_id);

    if (!provider.business_id) {
      console.error("fetchBusinessServices: No business_id found in provider data");
      setServicesError("No business ID found for this provider");
      return;
    }

    setServicesLoading(true);
    setServicesError("");

    try {
      // Fetch business services with service details and booking counts
      const { data: servicesData, error: servicesError } = await supabase
        .from("business_services")
        .select(`
          *,
          services (
            id,
            name,
            description,
            min_price,
            duration_minutes,
            subcategory_id,
            service_subcategories (
              id,
              name,
              category_id,
              service_categories (
                id,
                name
              )
            )
          )
        `)
        .eq("business_id", provider.business_id)
        .order("created_at", { ascending: false });

      console.log("fetchBusinessServices: business_services query result:", { servicesData, servicesError });

      if (servicesError) {
        console.error("fetchBusinessServices: Error fetching business services:", servicesError);
        throw servicesError;
      }

      // Get service IDs for addon eligibility check
      const serviceIds = servicesData?.map(bs => bs.service_id) || [];
      console.log("fetchBusinessServices: Found service IDs:", serviceIds);

      // Fetch business addons with addon details, filtered by service eligibility
      // For now, let's simplify this query to avoid complex subqueries
      const { data: addonsData, error: addonsError } = await supabase
        .from("business_addons")
        .select(`
          *,
          service_addons (
            id,
            name,
            description,
            addon_type,
            default_price
          )
        `)
        .eq("business_id", provider.business_id)
        .eq("is_available", true);

      console.log("fetchBusinessServices: business_addons query result:", { addonsData, addonsError });

      if (addonsError) {
        console.error("fetchBusinessServices: Error fetching business addons:", addonsError);
        // Don't throw error for addons, just log it
      }

      // For now, simplify by setting booking count to 0 to avoid complex async operations
      // We can enhance this later once basic services are loading
      const servicesWithBookings = (servicesData || []).map((businessService) => ({
        ...businessService,
        booking_count: 0 // Placeholder for now
      }));

      console.log("fetchBusinessServices: Final services with bookings:", servicesWithBookings);
      setBusinessServices(servicesWithBookings);
      setBusinessAddons(addonsData || []);

    } catch (error: any) {
      console.error("fetchBusinessServices: Caught error:", error);
      setServicesError(`Failed to load services: ${error.message}`);
      // Set empty arrays so we show the empty state instead of loading forever
      setBusinessServices([]);
      setBusinessAddons([]);
    } finally {
      setServicesLoading(false);
    }
  };

  const handleSaveBusinessDetails = async () => {
    if (!business) return;

    setBusinessDetailsSaving(true);
    setBusinessDetailsError("");
    setBusinessDetailsSuccess("");

    try {
      const { directSupabaseAPI } = await import("@/lib/directSupabase");

      const updateData = {
        business_name: businessDetailsForm.business_name.trim(),
        business_description: businessDetailsForm.business_description.trim(),
        contact_email: businessDetailsForm.contact_email.trim(),
        phone: businessDetailsForm.phone.trim(),
        website_url: businessDetailsForm.website_url.trim(),
        years_in_business: businessDetailsForm.years_in_business ? parseInt(businessDetailsForm.years_in_business) : null,
        image_url: businessDetailsForm.image_url.trim() || null,
        logo_url: businessDetailsForm.logo_url.trim() || null,
        is_active: businessDetailsForm.is_active,
      };

      // Validate required fields
      if (!updateData.business_name) {
        throw new Error("Business name is required");
      }

      // Email validation
      if (updateData.contact_email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(updateData.contact_email)) {
          throw new Error("Please enter a valid contact email address");
        }
      }

      // Update business using direct API
      await directSupabaseAPI.updateBusinessProfile(business.id, updateData);

      // Update local business state
      setBusiness({
        ...business,
        ...updateData,
      });

      setBusinessDetailsSuccess("Business details updated successfully!");

    } catch (error: any) {
      console.error("Business details save error:", error);
      let errorMessage = "Failed to update business details";

      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      setBusinessDetailsError(errorMessage);
    } finally {
      setBusinessDetailsSaving(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  // Fetch locations when provider is available and locations tab is active
  useEffect(() => {
    if (provider && activeTab === "locations" && locations.length === 0 && !locationsLoading) {
      console.log("Auto-fetching locations for active tab");
      fetchLocations();
    }
  }, [provider, activeTab]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // First fetch provider details using auth.user.id -> providers.user_id relationship
      const { data: providerData, error: providerError } = await supabase
        .from("providers")
        .select("*, business_id")
        .eq("user_id", user.id)
        .single();

      if (providerError || !providerData) {
        setError("Provider account not found. Please contact support.");
        return;
      }

      setProvider(providerData);

      // Initialize form data
      setFormData({
        firstName: providerData.first_name || "",
        lastName: providerData.last_name || "",
        email: providerData.email || "",
        phone: providerData.phone || "",
        bio: providerData.bio || "",
        dateOfBirth: providerData.date_of_birth || "",
        experienceYears: providerData.experience_years?.toString() || "",
      });

      // Fetch business details using providers.business_id -> businesses.id
      const { data: businessData, error: businessError } = await supabase
        .from("business_profiles")
        .select("*")
        .eq("id", providerData.business_id)
        .single();

      if (businessData) {
        setBusiness(businessData);

        // Initialize business details form
        setBusinessDetailsForm({
          business_name: businessData.business_name || "",
          business_type: businessData.business_type || "",
          business_description: businessData.business_description || "",
          contact_email: businessData.contact_email || "",
          phone: businessData.phone || "",
          website_url: businessData.website_url || "",
          years_in_business: businessData.years_in_business?.toString() || "",
          logo_url: businessData.logo_url || "",
          verification_status: businessData.verification_status || "",
          is_active: businessData.is_active !== false,
          setup_completed: businessData.setup_completed || false,
        });

        // Parse and set business hours if available
        if (businessData.business_hours) {
          setBusinessHours(businessData.business_hours);

          // Initialize business hours form
          const initialHoursForm = {
            Monday: { isOpen: false, open: "09:00", close: "17:00" },
            Tuesday: { isOpen: false, open: "09:00", close: "17:00" },
            Wednesday: { isOpen: false, open: "09:00", close: "17:00" },
            Thursday: { isOpen: false, open: "09:00", close: "17:00" },
            Friday: { isOpen: false, open: "09:00", close: "17:00" },
            Saturday: { isOpen: false, open: "09:00", close: "17:00" },
            Sunday: { isOpen: false, open: "09:00", close: "17:00" },
          };

          // Populate with existing data
          Object.keys(initialHoursForm).forEach((day) => {
            if (businessData.business_hours[day]) {
              initialHoursForm[day] = {
                isOpen: true,
                open: businessData.business_hours[day].open || "09:00",
                close: businessData.business_hours[day].close || "17:00",
              };
            }
          });

          setBusinessHoursForm(initialHoursForm);
        }

        // Fetch recent business activity
        try {
          const activityPromises = [
            // Recent locations
            supabase
              .from("business_locations")
              .select("location_name, created_at")
              .eq("business_id", providerData.business_id)
              .order("created_at", { ascending: false })
              .limit(2),

            // Recent team members
            supabase
              .from("providers")
              .select("first_name, last_name, created_at")
              .eq("business_id", providerData.business_id)
              .order("created_at", { ascending: false })
              .limit(2),
          ];

          const [locationsActivity, teamActivity] =
            await Promise.all(activityPromises);

          const activities = [];

          // Add location activities
          if (locationsActivity.data) {
            locationsActivity.data.forEach((location) => {
              activities.push({
                action: "New location added",
                details: location.location_name || "Business location",
                time: formatTimeAgo(location.created_at),
                icon: MapPin,
              });
            });
          }

          // Add team member activities
          if (teamActivity.data) {
            teamActivity.data.forEach((member) => {
              activities.push({
                action: "Team member added",
                details: `${member.first_name} ${member.last_name} joined as Provider`,
                time: formatTimeAgo(member.created_at),
                icon: Users,
              });
            });
          }

          // Sort by most recent and limit to 4
          setRecentActivity(activities.slice(0, 4));
        } catch (activityError) {
          console.error("Error fetching recent activity:", activityError);
        }

        // Fetch business services using providerData directly (since setProvider is async)
        if (providerData && providerData.business_id) {
          console.log("fetchDashboardData: Fetching business services for business_id:", providerData.business_id);

          try {
            setServicesLoading(true);
            setServicesError("");

            const { data: servicesData, error: servicesError } = await supabase
              .from("business_services")
              .select(`
                *,
                services (
                  id,
                  name,
                  description,
                  min_price,
                  duration_minutes,
                  subcategory_id,
                  service_subcategories (
                    id,
                    name,
                    category_id,
                    service_categories (
                      id,
                      name
                    )
                  )
                )
              `)
              .eq("business_id", providerData.business_id)
              .order("created_at", { ascending: false });

            console.log("fetchDashboardData: business_services query result:", { servicesData, servicesError });

            if (servicesError) {
              console.error("fetchDashboardData: Error fetching business services:", servicesError);
              setServicesError(`Failed to load services: ${servicesError.message}`);
              setBusinessServices([]);
            } else {
              const servicesWithBookings = (servicesData || []).map((businessService) => ({
                ...businessService,
                booking_count: 0 // Placeholder for now
              }));
              console.log("fetchDashboardData: Setting business services:", servicesWithBookings);
              setBusinessServices(servicesWithBookings);
            }

            // Also fetch addons
            const { data: addonsData, error: addonsError } = await supabase
              .from("business_addons")
              .select(`
                *,
                service_addons (
                  id,
                  name,
                  description,
                  addon_type,
                  default_price
                )
              `)
              .eq("business_id", providerData.business_id)
              .eq("is_available", true);

            console.log("fetchDashboardData: business_addons query result:", { addonsData, addonsError });
            setBusinessAddons(addonsData || []);

          } catch (error: any) {
            console.error("fetchDashboardData: Error in services fetch:", error);
            setServicesError(`Failed to load services: ${error.message}`);
            setBusinessServices([]);
            setBusinessAddons([]);
          } finally {
            setServicesLoading(false);
          }
        } else {
          console.warn("fetchDashboardData: No business_id found in provider data");
          setServicesError("No business ID found for this provider");
        }

        // Fetch business metrics using correct business_id from provider
        const [locationsResult, teamResult, servicesResult] = await Promise.all(
          [
            // Count active business locations
            supabase
              .from("business_locations")
              .select("id", { count: "exact" })
              .eq("business_id", providerData.business_id)
              .eq("is_active", true),

            // Count team members (providers) for this business
            supabase
              .from("providers")
              .select("id", { count: "exact" })
              .eq("business_id", providerData.business_id)
              .eq("is_active", true),

            // Count services offered by providers in this business
            supabase
              .from("provider_services")
              .select("service_id", { count: "exact" })
              .in(
                "provider_id",
                (
                  await supabase
                    .from("providers")
                    .select("id")
                    .eq("business_id", providerData.business_id)
                    .eq("is_active", true)
                ).data?.map((p) => p.id) || [],
              )
              .eq("is_active", true),
          ],
        );

        setBusinessMetrics({
          activeLocations: locationsResult.count || 0,
          teamMembers: teamResult.count || 0,
          servicesOffered: servicesResult.count || 0,
        });
      }

      // Fetch bookings based on role
      let bookingsData = [];
      let bookingsError = null;

      if (isProvider && !isOwner && !isDispatcher) {
        // Provider can only see their own bookings
        const result = await supabase
          .from("bookings")
          .select(
            `
          *,
          providers!inner(first_name, last_name),
          services(name, description)
        `,
          )
          .eq("provider_id", providerData.id)
          .order("created_at", { ascending: false })
          .limit(10);

        bookingsData = result.data;
        bookingsError = result.error;
      } else {
        // Owner/Dispatcher can see all business bookings
        // First fetch all provider IDs for this business
        const { data: businessProviders, error: providersError } =
          await supabase
            .from("providers")
            .select("id")
            .eq("business_id", providerData.business_id);

        if (providersError) {
          setError("Failed to fetch business providers.");
          return;
        }

        if (businessProviders && businessProviders.length > 0) {
          const providerIds = businessProviders.map((p) => p.id);

          const result = await supabase
            .from("bookings")
            .select(
              `
            *,
            providers!inner(first_name, last_name),
            services(name, description)
          `,
            )
            .in("provider_id", providerIds)
            .order("created_at", { ascending: false })
            .limit(10);

          bookingsData = result.data;
          bookingsError = result.error;
        }
      }

      if (bookingsData) {
        setBookings(bookingsData);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError("An error occurred while loading dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/provider-portal");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-roam-light-blue/10 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-roam-blue to-roam-light-blue rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Users className="w-8 h-8 text-white" />
          </div>
          <p className="text-lg font-semibold">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-roam-light-blue/10 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-foreground/70 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <Button asChild variant="outline">
              <Link to="/provider-portal">Back to Login</Link>
            </Button>
            <Button asChild>
              <Link to="/support">Contact Support</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Return null if no user or provider data
  if (!user || !provider) {
    return null;
  }

  const stats = {
    monthlyEarnings: 3250,
    completedBookings: 47,
    avgRating: 4.9,
    responseRate: 98,
  };

  const recentBookings = [
    {
      id: "B001",
      service: "Deep Tissue Massage",
      customer: "Sarah M.",
      date: "2024-01-15",
      time: "2:00 PM",
      status: "confirmed",
      price: 120,
      deliveryType: "mobile",
      location: "Miami, FL",
    },
    {
      id: "B002",
      service: "Couples Massage",
      customer: "John & Lisa D.",
      date: "2024-01-16",
      time: "6:00 PM",
      status: "pending",
      price: 240,
      deliveryType: "mobile",
      location: "Coral Gables, FL",
    },
    {
      id: "B003",
      service: "Sports Massage",
      customer: "Mike R.",
      date: "2024-01-17",
      time: "10:00 AM",
      status: "completed",
      price: 100,
      deliveryType: "business",
      location: "Your Studio",
    },
  ];

  // Remove hardcoded services - now using businessServices from state

  const getStatusBadge = (status: string) => {
    const configs = {
      confirmed: { label: "Confirmed", color: "bg-green-100 text-green-800" },
      pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
      completed: { label: "Completed", color: "bg-gray-100 text-gray-800" },
      cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800" },
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  const getDeliveryIcon = (type: string) => {
    const icons = {
      mobile: Smartphone,
      business: Building,
      virtual: Video,
    };
    return icons[type as keyof typeof icons] || Smartphone;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-roam-light-blue/10">
      {/* Navigation */}
      <nav className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center">
                  <img
                    src="https://cdn.builder.io/api/v1/image/assets%2Fa42b6f9ec53e4654a92af75aad56d14f%2F38446bf6c22b453fa45caf63b0513e21?format=webp&width=800"
                    alt="ROAM Logo"
                    className="w-8 h-8 object-contain"
                  />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-roam-blue to-roam-light-blue bg-clip-text text-transparent">
                  ROAM
                </span>
              </div>
              <Badge
                variant="secondary"
                className="bg-roam-light-blue/20 text-roam-blue"
              >
                Provider Dashboard
              </Badge>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Label htmlFor="availability" className="text-sm">
                  Available
                </Label>
                <Switch
                  id="availability"
                  checked={isAvailable}
                  onCheckedChange={setIsAvailable}
                  className="data-[state=checked]:bg-roam-blue"
                />
              </div>
              <Button variant="ghost" size="sm">
                <Bell className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">
                Welcome back,{" "}
                <span className="text-roam-blue">
                  {user.first_name || "Provider"}
                </span>
              </h1>
              <p className="text-foreground/70">
                Here's what's happening with your business today.
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-foreground/60">Status</div>
              <Badge
                className={
                  isAvailable
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }
              >
                {isAvailable ? "Available for Bookings" : "Unavailable"}
              </Badge>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground/60">
                      Monthly Earnings
                    </p>
                    <p className="text-2xl font-bold text-roam-blue">
                      ${stats.monthlyEarnings.toLocaleString()}
                    </p>
                    <p className="text-xs text-green-600">
                      +12% from last month
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-roam-blue" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground/60">
                      Completed Bookings
                    </p>
                    <p className="text-2xl font-bold text-roam-blue">
                      {stats.completedBookings}
                    </p>
                    <p className="text-xs text-green-600">+8 this month</p>
                  </div>
                  <Calendar className="w-8 h-8 text-roam-blue" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground/60">Average Rating</p>
                    <p className="text-2xl font-bold text-roam-blue">
                      {stats.avgRating}
                    </p>
                    <p className="text-xs text-gray-600">From 127 reviews</p>
                  </div>
                  <Star className="w-8 h-8 text-roam-yellow fill-current" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground/60">Response Rate</p>
                    <p className="text-2xl font-bold text-roam-blue">
                      {stats.responseRate}%
                    </p>
                    <p className="text-xs text-green-600">
                      Excellent performance
                    </p>
                  </div>
                  <MessageCircle className="w-8 h-8 text-roam-blue" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-8 lg:w-auto lg:inline-grid">
              <TabsTrigger
                value="bookings"
                className="data-[state=active]:bg-roam-blue data-[state=active]:text-white"
              >
                Bookings
              </TabsTrigger>
              <TabsTrigger
                value="services"
                className="data-[state=active]:bg-roam-blue data-[state=active]:text-white"
              >
                Services
              </TabsTrigger>
              {isOwner && (
                <TabsTrigger
                  value="business"
                  className="data-[state=active]:bg-roam-blue data-[state=active]:text-white"
                >
                  Business
                </TabsTrigger>
              )}
              {(isOwner || isDispatcher) && (
                <TabsTrigger
                  value="providers"
                  className="data-[state=active]:bg-roam-blue data-[state=active]:text-white"
                >
                  Providers
                </TabsTrigger>
              )}
              {(isOwner || isDispatcher) && (
                <TabsTrigger
                  value="locations"
                  className="data-[state=active]:bg-roam-blue data-[state=active]:text-white"
                >
                  Locations
                </TabsTrigger>
              )}
              <TabsTrigger
                value="profile"
                className="data-[state=active]:bg-roam-blue data-[state=active]:text-white"
              >
                Profile
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="data-[state=active]:bg-roam-blue data-[state=active]:text-white"
              >
                Analytics
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="data-[state=active]:bg-roam-blue data-[state=active]:text-white"
              >
                Settings
              </TabsTrigger>
            </TabsList>

            {/* Bookings Tab */}
            <TabsContent value="bookings" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Recent Bookings</h2>
                <Button className="bg-roam-blue hover:bg-roam-blue/90">
                  <Calendar className="w-4 h-4 mr-2" />
                  View Calendar
                </Button>
              </div>

              <div className="space-y-4">
                {bookings.length > 0 ? (
                  bookings.map((booking) => {
                    const statusConfig = getStatusBadge(booking.status);
                    const DeliveryIcon = getDeliveryIcon(
                      booking.delivery_type || "mobile",
                    );

                    return (
                      <Card
                        key={booking.id}
                        className="hover:shadow-md transition-shadow"
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-roam-blue to-roam-light-blue rounded-full flex items-center justify-center">
                                <Calendar className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <h3 className="font-semibold">
                                  {booking.services?.name || "Service"}
                                </h3>
                                <p className="text-sm text-foreground/60 mb-2">
                                  with {booking.customer_name || "Customer"}
                                </p>
                                <div className="flex items-center gap-4 text-sm text-foreground/60">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {new Date(
                                      booking.service_date,
                                    ).toLocaleDateString()}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {booking.service_time}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <DeliveryIcon className="w-4 h-4" />
                                    {booking.service_location || "TBD"}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge className={statusConfig.color}>
                                {statusConfig.label}
                              </Badge>
                              <p className="text-lg font-semibold text-roam-blue mt-2">
                                ${booking.total_price || "0"}
                              </p>
                            </div>
                          </div>

                          {booking.status === "pending" && (
                            <div className="mt-4 flex gap-2">
                              <Button
                                size="sm"
                                className="bg-roam-blue hover:bg-roam-blue/90"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-300 text-red-600 hover:bg-red-50"
                              >
                                Decline
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-foreground/60">
                    <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No bookings to display</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Services Tab */}
            <TabsContent value="services" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Your Services</h2>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={fetchBusinessServices}
                    disabled={servicesLoading}
                  >
                    🔄 Refresh
                  </Button>
                  <Button
                    className="bg-roam-blue hover:bg-roam-blue/90"
                    onClick={handleStartAddService}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Service
                  </Button>
                </div>
              </div>

              {servicesError && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                  {servicesError}
                </div>
              )}

              {serviceSuccess && (
                <div className="text-sm text-green-600 bg-green-50 p-3 rounded">
                  {serviceSuccess}
                </div>
              )}

              {servicesLoading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-roam-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p>Loading services...</p>
                </div>
              ) : businessServices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {businessServices.map((businessService) => (
                    <Card
                      key={businessService.id}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-semibold">{businessService.services?.name}</h3>
                            <p className="text-sm text-foreground/60">
                              {businessService.services?.service_subcategories?.service_categories?.name} ��� {businessService.services?.service_subcategories?.name}
                            </p>
                            {businessService.services?.description && (
                              <p className="text-xs text-foreground/50 mt-1">
                                {businessService.services.description}
                              </p>
                            )}
                          </div>
                          <Switch
                            checked={businessService.is_active !== false}
                            className="data-[state=checked]:bg-roam-blue"
                            disabled
                          />
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span>Duration:</span>
                            <span className="font-medium">
                              {businessService.duration || (businessService.services?.duration_minutes ? `${businessService.services.duration_minutes} mins` : 'N/A')}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Price:</span>
                            <span className="font-medium text-roam-blue">
                              ${businessService.custom_price || businessService.services?.min_price || '0'}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Delivery:</span>
                            <span className="font-medium">
                              {getDeliveryTypeLabel(businessService.delivery_type || "business_location")}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Bookings:</span>
                            <span className="font-medium">
                              {businessService.booking_count || 0} this month
                            </span>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white"
                          onClick={() => handleEditService(businessService)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Service
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-foreground/60">
                  <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">No services added yet</p>
                  <p className="text-sm">Add your first service to start accepting bookings</p>
                </div>
              )}

              {/* Available Add-ons Section */}
              {businessAddons.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Available Add-ons</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {businessAddons.map((businessAddon) => (
                      <Card key={businessAddon.id} className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium">{businessAddon.service_addons?.name}</h4>
                            <p className="text-sm text-foreground/60">
                              {businessAddon.service_addons?.addon_type}
                            </p>
                          </div>
                          <Switch
                            checked={businessAddon.is_available}
                            className="data-[state=checked]:bg-roam-blue"
                          />
                        </div>
                        <p className="text-xs text-foreground/50 mb-2">
                          {businessAddon.service_addons?.description}
                        </p>
                        <div className="flex justify-between items-center text-sm">
                          <span>Price:</span>
                          <span className="font-medium text-roam-blue">
                            ${businessAddon.custom_price || businessAddon.service_addons?.default_price || '0'}
                          </span>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Business Tab */}
            {isOwner && (
              <TabsContent value="business" className="space-y-6">
                <h2 className="text-2xl font-bold">Business Management</h2>



                {/* Business Details Management */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="w-5 h-5 text-roam-blue" />
                      Business Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {businessDetailsError && (
                      <div className="text-sm text-red-600 bg-red-50 p-3 rounded mb-4">
                        {businessDetailsError}
                      </div>
                    )}

                    {businessDetailsSuccess && (
                      <div className="text-sm text-green-600 bg-green-50 p-3 rounded mb-4">
                        {businessDetailsSuccess}
                      </div>
                    )}

                    <div className="space-y-8">
                      {/* Basic Information */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="business_name">Business Name *</Label>
                            <Input
                              id="business_name"
                              value={businessDetailsForm.business_name}
                              onChange={(e) => handleBusinessDetailsFormChange("business_name", e.target.value)}
                              disabled={businessDetailsSaving}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="business_type">Business Type</Label>
                            <Input
                              id="business_type"
                              value={formatBusinessType(businessDetailsForm.business_type)}
                              readOnly
                              className="bg-muted cursor-not-allowed"
                              title="Business type cannot be changed"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="years_in_business">Years in Business</Label>
                            <Input
                              id="years_in_business"
                              type="number"
                              min="0"
                              max="100"
                              value={businessDetailsForm.years_in_business}
                              onChange={(e) => handleBusinessDetailsFormChange("years_in_business", e.target.value)}
                              disabled={businessDetailsSaving}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="verification_status">Verification Status</Label>
                            <Input
                              id="verification_status"
                              value={businessDetailsForm.verification_status}
                              readOnly
                              className="bg-muted cursor-not-allowed"
                              title="Verification status is managed by system"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="business_description">Business Description</Label>
                          <Textarea
                            id="business_description"
                            value={businessDetailsForm.business_description}
                            onChange={(e) => handleBusinessDetailsFormChange("business_description", e.target.value)}
                            rows={3}
                            placeholder="Describe your business, services, and what makes you unique..."
                            disabled={businessDetailsSaving}
                          />
                        </div>
                      </div>

                      {/* Contact Information */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2">Contact Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="contact_email">Contact Email *</Label>
                            <Input
                              id="contact_email"
                              type="email"
                              value={businessDetailsForm.contact_email}
                              onChange={(e) => handleBusinessDetailsFormChange("contact_email", e.target.value)}
                              disabled={businessDetailsSaving}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="phone">Business Phone</Label>
                            <Input
                              id="phone"
                              type="tel"
                              value={businessDetailsForm.phone}
                              onChange={(e) => handleBusinessDetailsFormChange("phone", e.target.value)}
                              disabled={businessDetailsSaving}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="website_url">Website URL</Label>
                            <Input
                              id="website_url"
                              type="url"
                              value={businessDetailsForm.website_url}
                              onChange={(e) => handleBusinessDetailsFormChange("website_url", e.target.value)}
                              placeholder="https://"
                              disabled={businessDetailsSaving}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Business Images */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2">Business Images</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="image_url">Profile Image URL</Label>
                            <Input
                              id="image_url"
                              type="url"
                              value={businessDetailsForm.image_url}
                              onChange={(e) => handleBusinessDetailsFormChange("image_url", e.target.value)}
                              placeholder="https://..."
                              disabled={businessDetailsSaving}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="logo_url">Logo URL</Label>
                            <Input
                              id="logo_url"
                              type="url"
                              value={businessDetailsForm.logo_url}
                              onChange={(e) => handleBusinessDetailsFormChange("logo_url", e.target.value)}
                              placeholder="https://..."
                              disabled={businessDetailsSaving}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Business Status */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2">Business Status</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <Label>Business Active</Label>
                              <p className="text-sm text-foreground/60">Enable or disable your business listing</p>
                            </div>
                            <Switch
                              checked={businessDetailsForm.is_active}
                              onCheckedChange={(checked) => handleBusinessDetailsFormChange("is_active", checked)}
                              disabled={businessDetailsSaving}
                              className="data-[state=checked]:bg-roam-blue"
                            />
                          </div>

                          {/* Stripe Status Display */}
                          <div className="p-4 bg-accent/20 rounded-lg">
                            <div className="flex items-center justify-between">
                              <Label>Stripe Payouts</Label>
                              <span className={`font-medium ${
                                business?.stripe_connect_account_id
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}>
                                {business?.stripe_connect_account_id ? "Enabled" : "Disabled"}
                              </span>
                            </div>
                            <p className="text-sm text-foreground/60 mt-1">
                              {business?.stripe_connect_account_id
                                ? "Your Stripe account is connected and ready to receive payments"
                                : "Connect your Stripe account to enable automatic payouts"
                              }
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Save Button */}
                      <div className="pt-4 border-t">
                        <Button
                          onClick={handleSaveBusinessDetails}
                          disabled={businessDetailsSaving}
                          className="bg-roam-blue hover:bg-roam-blue/90"
                        >
                          {businessDetailsSaving ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                              Saving...
                            </>
                          ) : (
                            <>
                              <Building className="w-4 h-4 mr-2" />
                              Save Business Details
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Business Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Business Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-foreground/60">
                            Business Name
                          </span>
                          <span className="font-medium">
                            {business?.business_name || "Loading..."}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-foreground/60">
                            Business Type
                          </span>
                          <span className="font-medium">
                            {business?.business_type ? formatBusinessType(business.business_type) : "Loading..."}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-foreground/60">
                            Verification Status
                          </span>
                          <Badge
                            className={
                              business?.verification_status === "verified"
                                ? "bg-green-100 text-green-800"
                                : business?.verification_status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                            }
                          >
                            {business?.verification_status || "Unknown"}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-foreground/60">
                            Active Locations
                          </span>
                          <span className="font-medium">
                            {businessMetrics.activeLocations}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-foreground/60">
                            Team Members
                          </span>
                          <span className="font-medium">
                            {businessMetrics.teamMembers}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-foreground/60">
                            Services Offered
                          </span>
                          <span className="font-medium">
                            {businessMetrics.servicesOffered}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-foreground/60">
                            Stripe Payouts
                          </span>
                          <span className={`font-medium ${
                            business?.stripe_connected_account_id
                              ? "text-green-600"
                              : "text-red-600"
                          }`}>
                            {business?.stripe_connected_account_id ? "Enabled" : "Disabled"}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Business Hours</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {businessHoursError && (
                        <div className="text-sm text-red-600 bg-red-50 p-3 rounded mb-4">
                          {businessHoursError}
                        </div>
                      )}

                      {businessHoursSuccess && (
                        <div className="text-sm text-green-600 bg-green-50 p-3 rounded mb-4">
                          {businessHoursSuccess}
                        </div>
                      )}

                      <div className="space-y-3">
                        {editingBusinessHours
                          ? // Editing mode
                            [
                              "Monday",
                              "Tuesday",
                              "Wednesday",
                              "Thursday",
                              "Friday",
                              "Saturday",
                              "Sunday",
                            ].map((day) => (
                              <div
                                key={day}
                                className="flex items-center justify-between p-3 border rounded-lg"
                              >
                                <div className="flex items-center space-x-3">
                                  <Switch
                                    checked={businessHoursForm[day].isOpen}
                                    onCheckedChange={(checked) =>
                                      handleBusinessHoursChange(
                                        day,
                                        "isOpen",
                                        checked,
                                      )
                                    }
                                    disabled={businessHoursSaving}
                                    className="data-[state=checked]:bg-roam-blue"
                                  />
                                  <span className="text-sm font-medium w-20">
                                    {day}
                                  </span>
                                </div>

                                {businessHoursForm[day].isOpen ? (
                                  <div className="flex items-center space-x-2">
                                    <Input
                                      type="time"
                                      value={businessHoursForm[day].open}
                                      onChange={(e) =>
                                        handleBusinessHoursChange(
                                          day,
                                          "open",
                                          e.target.value,
                                        )
                                      }
                                      disabled={businessHoursSaving}
                                      className="w-24"
                                    />
                                    <span className="text-sm text-foreground/60">
                                      to
                                    </span>
                                    <Input
                                      type="time"
                                      value={businessHoursForm[day].close}
                                      onChange={(e) =>
                                        handleBusinessHoursChange(
                                          day,
                                          "close",
                                          e.target.value,
                                        )
                                      }
                                      disabled={businessHoursSaving}
                                      className="w-24"
                                    />
                                  </div>
                                ) : (
                                  <span className="text-sm text-foreground/60">
                                    Closed
                                  </span>
                                )}
                              </div>
                            ))
                          : // Display mode
                            businessHours
                            ? [
                                "Monday",
                                "Tuesday",
                                "Wednesday",
                                "Thursday",
                                "Friday",
                                "Saturday",
                                "Sunday",
                              ].map((day) => {
                                const dayHours = businessHours[day];
                                const isOpen =
                                  dayHours &&
                                  typeof dayHours === "object" &&
                                  dayHours.open &&
                                  dayHours.close;

                                return (
                                  <div
                                    key={day}
                                    className="flex justify-between items-center"
                                  >
                                    <span className="text-sm font-medium">
                                      {day}
                                    </span>
                                    <span className="text-sm text-foreground/60">
                                      {isOpen
                                        ? `${formatTimeTo12Hour(dayHours.open)} - ${formatTimeTo12Hour(dayHours.close)}`
                                        : "Closed"}
                                    </span>
                                  </div>
                                );
                              })
                            : [
                                "Monday",
                                "Tuesday",
                                "Wednesday",
                                "Thursday",
                                "Friday",
                                "Saturday",
                                "Sunday",
                              ].map((day) => (
                                <div
                                  key={day}
                                  className="flex justify-between items-center"
                                >
                                  <span className="text-sm font-medium">
                                    {day}
                                  </span>
                                  <span className="text-sm text-foreground/60">
                                    Loading...
                                  </span>
                                </div>
                              ))}
                      </div>

                      {editingBusinessHours ? (
                        <div className="flex gap-2 mt-4">
                          <Button
                            className="flex-1 bg-roam-blue hover:bg-roam-blue/90"
                            onClick={handleSaveBusinessHours}
                            disabled={businessHoursSaving}
                          >
                            {businessHoursSaving ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                Saving...
                              </>
                            ) : (
                              <>
                                <Clock className="w-4 h-4 mr-2" />
                                Save Hours
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={handleCancelBusinessHours}
                            disabled={businessHoursSaving}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          className="w-full mt-4 border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white"
                          onClick={() => setEditingBusinessHours(true)}
                        >
                          <Clock className="w-4 h-4 mr-2" />
                          Edit Hours
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Business Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivity.length > 0 ? (
                        recentActivity.map((activity, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-3 p-3 rounded-lg bg-accent/20"
                          >
                            <div className="w-8 h-8 bg-roam-blue rounded-full flex items-center justify-center">
                              <activity.icon className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm">
                                {activity.action}
                              </p>
                              <p className="text-xs text-foreground/60">
                                {activity.details}
                              </p>
                            </div>
                            <span className="text-xs text-foreground/50">
                              {activity.time}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-foreground/60">
                          <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">
                            No recent activity to display
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Providers Tab */}
            {(isOwner || isDispatcher) && (
              <TabsContent value="providers" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Team Management</h2>
                  <Button className="bg-roam-blue hover:bg-roam-blue/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Provider
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Provider Management Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-roam-blue" />
                        Team Overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-foreground/60">
                            Active Providers
                          </span>
                          <span className="font-medium">
                            {businessMetrics.teamMembers}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-foreground/60">
                            Total Locations
                          </span>
                          <span className="font-medium">
                            {businessMetrics.activeLocations}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-foreground/60">
                            Services Offered
                          </span>
                          <span className="font-medium">
                            {businessMetrics.servicesOffered}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Actions Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button
                        variant="outline"
                        className="w-full justify-start border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white"
                        asChild
                      >
                        <Link to="/business-management">
                          <Plus className="w-4 h-4 mr-2" />
                          Add New Provider
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white"
                        asChild
                      >
                        <Link to="/business-management">
                          <Edit className="w-4 h-4 mr-2" />
                          Manage Roles & Permissions
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white"
                        onClick={() => setActiveTab("business")}
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        Assign Locations
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Provider List */}
                <Card>
                  <CardHeader>
                    <CardTitle>Current Team Members</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-foreground/60">
                      <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg mb-2">Provider management coming soon</p>
                      <p className="text-sm">
                        Full provider management interface will be implemented here
                      </p>
                      <Button
                        className="mt-4 bg-roam-blue hover:bg-roam-blue/90"
                        asChild
                      >
                        <Link to="/business-management">
                          <Users className="w-4 h-4 mr-2" />
                          Manage Team (Legacy)
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Locations Tab */}
            {(isOwner || isDispatcher) && (
              <TabsContent value="locations" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Business Locations</h2>
                  <Button
                    onClick={() => {
                      setAddingLocation(true);
                      setManagingLocations(true);
                      if (!locations.length && !locationsLoading) {
                        fetchLocations();
                      }
                    }}
                    className="bg-roam-blue hover:bg-roam-blue/90"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Location
                  </Button>
                </div>



                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Locations Overview Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-roam-blue" />
                        Locations Overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-foreground/60">
                            Total Locations
                          </span>
                          <span className="font-medium">
                            {locations.length}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-foreground/60">
                            Active Locations
                          </span>
                          <span className="font-medium">
                            {locations.filter(loc => loc.is_active).length}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-foreground/60">
                            Mobile Service Areas
                          </span>
                          <span className="font-medium">
                            {locations.filter(loc => loc.offers_mobile_services).length}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-foreground/60">
                            Primary Location
                          </span>
                          <span className="font-medium">
                            {locations.find(loc => loc.is_primary)?.location_name || "None set"}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Actions Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button
                        variant="outline"
                        className="w-full justify-start border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white"
                        onClick={() => {
                          setAddingLocation(true);
                          setManagingLocations(true);
                          resetLocationForm();
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Location
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white"
                        onClick={() => {
                          fetchLocations();
                        }}
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        Refresh Locations
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white"
                        onClick={() => setActiveTab("providers")}
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Assign to Providers
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Locations List */}
                <Card>
                  <CardHeader>
                    <CardTitle>All Locations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {locationsLoading ? (
                      <div className="text-center py-8">
                        <div className="w-8 h-8 border-2 border-roam-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p>Loading locations...</p>
                      </div>
                    ) : locations.length > 0 ? (
                      <div className="space-y-4">
                        {locations.map((location) => (
                          <Card key={location.id} className="border">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h4 className="font-semibold">
                                      {location.location_name}
                                    </h4>
                                    {location.is_primary && (
                                      <Badge className="bg-roam-blue/20 text-roam-blue">
                                        Primary
                                      </Badge>
                                    )}
                                    {!location.is_active && (
                                      <Badge
                                        variant="outline"
                                        className="text-red-600 border-red-300"
                                      >
                                        Inactive
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-sm text-foreground/70 space-y-1">
                                    <p>{location.address_line1}</p>
                                    {location.address_line2 && (
                                      <p>{location.address_line2}</p>
                                    )}
                                    <p>
                                      {location.city}, {location.state}{" "}
                                      {location.postal_code}
                                    </p>
                                    <p>{location.country}</p>
                                    {location.offers_mobile_services && (
                                      <p className="text-roam-blue">
                                        <Smartphone className="w-4 h-4 inline mr-1" />
                                        Mobile services within{" "}
                                        {location.mobile_service_radius} miles
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-2 ml-4">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditLocation(location)}
                                    disabled={locationsSaving}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleDeleteLocation(location.id)
                                    }
                                    disabled={locationsSaving}
                                    className="border-red-300 text-red-600 hover:bg-red-50"
                                  >
                                    <AlertCircle className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-foreground/60">
                        <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg mb-2">No locations added yet</p>
                        <p className="text-sm mb-4">
                          Add your first business location to get started
                        </p>
                        <Button
                          onClick={() => {
                            setAddingLocation(true);
                            setManagingLocations(true);
                            resetLocationForm();
                          }}
                          className="bg-roam-blue hover:bg-roam-blue/90"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Your First Location
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <h2 className="text-2xl font-bold">Provider Profile</h2>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Photo & Basic Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Photo</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center space-y-4">
                    <div className="relative">
                      <div className="w-32 h-32 bg-gradient-to-br from-roam-blue to-roam-light-blue rounded-full flex items-center justify-center mx-auto overflow-hidden">
                        {provider?.image_url ? (
                          <img
                            src={provider.image_url}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Users className="w-16 h-16 text-white" />
                        )}
                      </div>
                      {avatarUploading && (
                        <div className="absolute inset-0 w-32 h-32 bg-black/50 rounded-full flex items-center justify-center mx-auto">
                          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>

                    {avatarError && (
                      <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                        {avatarError}
                      </div>
                    )}

                    <div className="flex gap-2 justify-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                        id="avatar-upload"
                        disabled={avatarUploading}
                      />
                      <Button
                        variant="outline"
                        className="border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white"
                        onClick={() =>
                          document.getElementById("avatar-upload")?.click()
                        }
                        disabled={avatarUploading}
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        {provider?.image_url ? "Change Photo" : "Upload Photo"}
                      </Button>

                      {provider?.image_url && (
                        <Button
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50"
                          onClick={handleAvatarRemove}
                          disabled={avatarUploading}
                        >
                          Remove
                        </Button>
                      )}
                    </div>

                    <p className="text-xs text-foreground/60">
                      Upload a professional photo (max 5MB)
                    </p>
                  </CardContent>
                </Card>

                {/* Contact Information */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {profileError && (
                      <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                        {profileError}
                      </div>
                    )}

                    {profileSuccess && (
                      <div className="text-sm text-green-600 bg-green-50 p-3 rounded">
                        {profileSuccess}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) =>
                            handleFormChange("firstName", e.target.value)
                          }
                          disabled={profileSaving}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) =>
                            handleFormChange("lastName", e.target.value)
                          }
                          disabled={profileSaving}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        readOnly
                        className="bg-muted cursor-not-allowed"
                        title="Email address cannot be changed"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          handleFormChange("phone", e.target.value)
                        }
                        disabled={profileSaving}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Professional Bio</Label>
                      <Textarea
                        id="bio"
                        value={formData.bio}
                        onChange={(e) =>
                          handleFormChange("bio", e.target.value)
                        }
                        rows={4}
                        placeholder="Tell customers about your professional background and expertise..."
                        disabled={profileSaving}
                      />
                    </div>

                    <Button
                      className="bg-roam-blue hover:bg-roam-blue/90"
                      onClick={handleSaveProfile}
                      disabled={profileSaving}
                    >
                      {profileSaving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Provider Statistics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Professional Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dateOfBirth">Date of Birth</Label>
                        <Input
                          id="dateOfBirth"
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(e) =>
                            handleFormChange("dateOfBirth", e.target.value)
                          }
                          disabled={profileSaving}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="experienceYears">
                          Years of Experience
                        </Label>
                        <Input
                          id="experienceYears"
                          type="number"
                          min="0"
                          max="50"
                          value={formData.experienceYears}
                          onChange={(e) =>
                            handleFormChange("experienceYears", e.target.value)
                          }
                          disabled={profileSaving}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-foreground/60">
                          Verification Status
                        </span>
                        <Badge
                          className={
                            provider?.verification_status === "verified"
                              ? "bg-green-100 text-green-800"
                              : provider?.verification_status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }
                        >
                          {provider?.verification_status || "Unknown"}
                        </Badge>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-foreground/60">
                          Background Check
                        </span>
                        <Badge
                          className={
                            provider?.background_check_status === "approved"
                              ? "bg-green-100 text-green-800"
                              : provider?.background_check_status ===
                                  "under_review"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }
                        >
                          {provider?.background_check_status || "Unknown"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Performance Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-accent/20 rounded-lg">
                        <div className="text-2xl font-bold text-roam-blue">
                          {provider?.total_bookings || 0}
                        </div>
                        <div className="text-sm text-foreground/60">
                          Total Bookings
                        </div>
                      </div>

                      <div className="text-center p-4 bg-accent/20 rounded-lg">
                        <div className="text-2xl font-bold text-roam-blue">
                          {provider?.completed_bookings || 0}
                        </div>
                        <div className="text-sm text-foreground/60">
                          Completed
                        </div>
                      </div>

                      <div className="text-center p-4 bg-accent/20 rounded-lg">
                        <div className="text-2xl font-bold text-roam-blue">
                          {provider?.average_rating || "0.0"}
                        </div>
                        <div className="text-sm text-foreground/60">
                          Average Rating
                        </div>
                      </div>

                      <div className="text-center p-4 bg-accent/20 rounded-lg">
                        <div className="text-2xl font-bold text-roam-blue">
                          {provider?.total_reviews || 0}
                        </div>
                        <div className="text-sm text-foreground/60">
                          Total Reviews
                        </div>
                      </div>
                    </div>

                    {provider?.provider_role && (
                      <div className="mt-4 p-4 bg-roam-light-blue/10 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-foreground/60">
                            Provider Role
                          </span>
                          <Badge className="bg-roam-blue/20 text-roam-blue capitalize">
                            {provider.provider_role}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <h2 className="text-2xl font-bold">Business Analytics</h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-roam-blue" />
                      Revenue Trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48 bg-gradient-to-r from-roam-light-blue/20 to-roam-blue/20 rounded-lg flex items-center justify-center">
                      <p className="text-foreground/60">
                        Chart visualization would go here
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-roam-blue" />
                      Service Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Deep Tissue Massage</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-200 rounded-full">
                            <div className="w-3/4 h-2 bg-roam-blue rounded-full"></div>
                          </div>
                          <span className="text-sm text-roam-blue">75%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Swedish Massage</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-200 rounded-full">
                            <div className="w-1/2 h-2 bg-roam-light-blue rounded-full"></div>
                          </div>
                          <span className="text-sm text-roam-blue">50%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Sports Recovery</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-200 rounded-full">
                            <div className="w-1/4 h-2 bg-roam-yellow rounded-full"></div>
                          </div>
                          <span className="text-sm text-roam-blue">25%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <h2 className="text-2xl font-bold">Account Settings</h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>New Booking Alerts</Label>
                        <p className="text-sm text-foreground/60">
                          Get notified when customers book your services
                        </p>
                      </div>
                      <Switch
                        defaultChecked
                        className="data-[state=checked]:bg-roam-blue"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Payment Notifications</Label>
                        <p className="text-sm text-foreground/60">
                          Receive alerts for payments and payouts
                        </p>
                      </div>
                      <Switch
                        defaultChecked
                        className="data-[state=checked]:bg-roam-blue"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Marketing Updates</Label>
                        <p className="text-sm text-foreground/60">
                          Tips and updates to grow your business
                        </p>
                      </div>
                      <Switch className="data-[state=checked]:bg-roam-blue" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Account Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        className="w-full justify-start border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Change Password
                      </Button>

                      <Button
                        variant="outline"
                        className="w-full justify-start border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white"
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Update Email
                      </Button>

                      <Button
                        variant="outline"
                        className="w-full justify-start border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white"
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        Payment Settings
                      </Button>

                      <div className="pt-4 border-t">
                        <Button
                          variant="outline"
                          className="w-full justify-start border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <AlertCircle className="w-4 h-4 mr-2" />
                          Deactivate Account
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Location Management Modal */}
      {managingLocations && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-2xl font-bold">Manage Locations</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setManagingLocations(false);
                  setAddingLocation(false);
                  setEditingLocation(null);
                  resetLocationForm();
                }}
              >
                ×
              </Button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {locationsError && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded mb-4">
                  {locationsError}
                </div>
              )}

              {locationsSuccess && (
                <div className="text-sm text-green-600 bg-green-50 p-3 rounded mb-4">
                  {locationsSuccess}
                </div>
              )}

              {!addingLocation ? (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold">
                      Business Locations
                    </h3>
                    <Button
                      onClick={() => {
                        setAddingLocation(true);
                        if (!locations.length && !locationsLoading) {
                          fetchLocations();
                        }
                      }}
                      className="bg-roam-blue hover:bg-roam-blue/90"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Location
                    </Button>
                  </div>

                  {locationsLoading ? (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-2 border-roam-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p>Loading locations...</p>
                    </div>
                  ) : locations.length > 0 ? (
                    <div className="space-y-4">
                      {locations.map((location) => (
                        <Card key={location.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-semibold">
                                    {location.location_name}
                                  </h4>
                                  {location.is_primary && (
                                    <Badge className="bg-roam-blue/20 text-roam-blue">
                                      Primary
                                    </Badge>
                                  )}
                                  {!location.is_active && (
                                    <Badge
                                      variant="outline"
                                      className="text-red-600 border-red-300"
                                    >
                                      Inactive
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm text-foreground/70 space-y-1">
                                  <p>{location.address_line1}</p>
                                  {location.address_line2 && (
                                    <p>{location.address_line2}</p>
                                  )}
                                  <p>
                                    {location.city}, {location.state}{" "}
                                    {location.postal_code}
                                  </p>
                                  <p>{location.country}</p>
                                  {location.offers_mobile_services && (
                                    <p className="text-roam-blue">
                                      <Smartphone className="w-4 h-4 inline mr-1" />
                                      Mobile services within{" "}
                                      {location.mobile_service_radius} miles
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2 ml-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditLocation(location)}
                                  disabled={locationsSaving}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleDeleteLocation(location.id)
                                  }
                                  disabled={locationsSaving}
                                  className="border-red-300 text-red-600 hover:bg-red-50"
                                >
                                  <AlertCircle className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-foreground/60">
                      <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg mb-2">No locations added yet</p>
                      <p className="text-sm">
                        Add your first business location to get started
                      </p>
                    </div>
                  )}
                </>
              ) : (
                /* Location Form */
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">
                    {editingLocation ? "Edit Location" : "Add New Location"}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location_name">Location Name *</Label>
                      <Input
                        id="location_name"
                        value={locationForm.location_name}
                        onChange={(e) =>
                          handleLocationFormChange(
                            "location_name",
                            e.target.value,
                          )
                        }
                        placeholder="e.g., Downtown Office, Main Store"
                        disabled={locationsSaving}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address_line1">Address Line 1 *</Label>
                      <Input
                        id="address_line1"
                        value={locationForm.address_line1}
                        onChange={(e) =>
                          handleLocationFormChange(
                            "address_line1",
                            e.target.value,
                          )
                        }
                        placeholder="Street address"
                        disabled={locationsSaving}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address_line2">Address Line 2</Label>
                      <Input
                        id="address_line2"
                        value={locationForm.address_line2}
                        onChange={(e) =>
                          handleLocationFormChange(
                            "address_line2",
                            e.target.value,
                          )
                        }
                        placeholder="Apt, suite, unit, etc."
                        disabled={locationsSaving}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={locationForm.city}
                        onChange={(e) =>
                          handleLocationFormChange("city", e.target.value)
                        }
                        placeholder="City"
                        disabled={locationsSaving}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={locationForm.state}
                        onChange={(e) =>
                          handleLocationFormChange("state", e.target.value)
                        }
                        placeholder="State"
                        disabled={locationsSaving}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="postal_code">Postal Code</Label>
                      <Input
                        id="postal_code"
                        value={locationForm.postal_code}
                        onChange={(e) =>
                          handleLocationFormChange(
                            "postal_code",
                            e.target.value,
                          )
                        }
                        placeholder="ZIP/Postal code"
                        disabled={locationsSaving}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={locationForm.country}
                        readOnly
                        className="bg-muted cursor-not-allowed"
                        title="Country cannot be changed"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mobile_radius">
                        Mobile Service Radius (miles)
                      </Label>
                      <Input
                        id="mobile_radius"
                        type="number"
                        min="0"
                        max="100"
                        value={locationForm.mobile_service_radius}
                        onChange={(e) =>
                          handleLocationFormChange(
                            "mobile_service_radius",
                            parseInt(e.target.value) || 0,
                          )
                        }
                        disabled={
                          locationsSaving ||
                          !locationForm.offers_mobile_services
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Primary Location</Label>
                        <p className="text-sm text-foreground/60">
                          Make this the main business location (only one primary allowed)
                        </p>
                      </div>
                      <Switch
                        checked={locationForm.is_primary}
                        onCheckedChange={(checked) =>
                          handleLocationFormChange("is_primary", checked)
                        }
                        disabled={locationsSaving}
                        className="data-[state=checked]:bg-roam-blue"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Offers Mobile Services</Label>
                        <p className="text-sm text-foreground/60">
                          Services can be provided at customer locations
                        </p>
                      </div>
                      <Switch
                        checked={locationForm.offers_mobile_services}
                        onCheckedChange={(checked) =>
                          handleLocationFormChange(
                            "offers_mobile_services",
                            checked,
                          )
                        }
                        disabled={locationsSaving}
                        className="data-[state=checked]:bg-roam-blue"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Active Location</Label>
                        <p className="text-sm text-foreground/60">
                          Location is currently operational
                        </p>
                      </div>
                      <Switch
                        checked={locationForm.is_active}
                        onCheckedChange={(checked) =>
                          handleLocationFormChange("is_active", checked)
                        }
                        disabled={locationsSaving}
                        className="data-[state=checked]:bg-roam-blue"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t">
                    <Button
                      onClick={handleSaveLocation}
                      disabled={locationsSaving}
                      className="flex-1 bg-roam-blue hover:bg-roam-blue/90"
                    >
                      {locationsSaving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <MapPin className="w-4 h-4 mr-2" />
                          {editingLocation ? "Update Location" : "Add Location"}
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCancelLocationEdit}
                      disabled={locationsSaving}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}



      {/* Edit Service Modal */}
      {editingService && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Edit Service</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelServiceEdit}
              >
                ×
              </Button>
            </div>

            <div className="p-6 space-y-6">
              {serviceError && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                  {serviceError}
                </div>
              )}

              {serviceSuccess && (
                <div className="text-sm text-green-600 bg-green-50 p-3 rounded">
                  {serviceSuccess}
                </div>
              )}

              {/* Service Info */}
              <div className="space-y-2">
                <h3 className="font-semibold">{editingService.services?.name}</h3>
                <p className="text-sm text-foreground/60">
                  {editingService.services?.service_subcategories?.service_categories?.name} → {editingService.services?.service_subcategories?.name}
                </p>
              </div>

              {/* Delivery Type */}
              <div className="space-y-2">
                <Label htmlFor="delivery_type">Delivery Type</Label>
                <Select
                  value={serviceForm.delivery_type}
                  onValueChange={(value) => handleServiceFormChange("delivery_type", value)}
                  disabled={serviceSaving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select delivery type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="business_location">In-Studio/Business</SelectItem>
                    <SelectItem value="customer_location">Mobile</SelectItem>
                    <SelectItem value="virtual">Virtual</SelectItem>
                    <SelectItem value="both_locations">In-Studio or Mobile</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Price */}
              <div className="space-y-2">
                <Label htmlFor="custom_price">Business Price ($)</Label>
                <Input
                  id="custom_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={serviceForm.custom_price}
                  onChange={(e) => handleServiceFormChange("custom_price", e.target.value)}
                  placeholder={`Default: $${editingService.services?.min_price || '0'}`}
                  disabled={serviceSaving}
                />
                <p className="text-xs text-foreground/60">
                  Leave empty to use default service price
                </p>
              </div>

              {/* Is Active */}
              <div className="flex items-center justify-between">
                <div>
                  <Label>Service Active</Label>
                  <p className="text-sm text-foreground/60">
                    Allow bookings for this service
                  </p>
                </div>
                <Switch
                  checked={serviceForm.is_active}
                  onCheckedChange={(checked) => handleServiceFormChange("is_active", checked)}
                  disabled={serviceSaving}
                  className="data-[state=checked]:bg-roam-blue"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={handleSaveService}
                  disabled={serviceSaving}
                  className="flex-1 bg-roam-blue hover:bg-roam-blue/90"
                >
                  {serviceSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Edit className="w-4 h-4 mr-2" />
                      Update Service
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancelServiceEdit}
                  disabled={serviceSaving}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Service Modal */}
      {addingService && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Add New Service</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelAddService}
              >
                ×
              </Button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {serviceError && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                  {serviceError}
                </div>
              )}

              {serviceSuccess && (
                <div className="text-sm text-green-600 bg-green-50 p-3 rounded">
                  {serviceSuccess}
                </div>
              )}

              {/* Service Selection */}
              <div className="space-y-2">
                <Label htmlFor="service_selection">Select Service</Label>
                {availableServicesLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <div className="w-6 h-6 border-2 border-roam-blue border-t-transparent rounded-full animate-spin mr-2"></div>
                    Loading services...
                  </div>
                ) : availableServices.length > 0 ? (
                  <Select
                    value={selectedServiceId}
                    onValueChange={setSelectedServiceId}
                    disabled={serviceSaving}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a service to add" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableServices.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{service.name}</span>
                            <span className="text-xs text-foreground/60">
                              {service.service_subcategories?.service_categories?.name} → {service.service_subcategories?.name}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-center py-4 text-foreground/60">
                    <p className="text-sm">All available services have been added to your business</p>
                  </div>
                )}
              </div>

              {/* Service Details */}
              {selectedServiceId && (() => {
                const selectedService = availableServices.find(s => s.id === selectedServiceId);
                return selectedService ? (
                  <div className="p-4 bg-accent/20 rounded-lg">
                    <h4 className="font-medium mb-2">{selectedService.name}</h4>
                    {selectedService.description && (
                      <p className="text-sm text-foreground/60 mb-2">{selectedService.description}</p>
                    )}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-foreground/60">Default Price:</span>
                        <span className="font-medium ml-2">${selectedService.min_price || '0'}</span>
                      </div>
                      <div>
                        <span className="text-foreground/60">Duration:</span>
                        <span className="font-medium ml-2">{selectedService.duration_minutes || 'N/A'} mins</span>
                      </div>
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Delivery Type */}
              <div className="space-y-2">
                <Label htmlFor="add_delivery_type">Delivery Type</Label>
                <Select
                  value={addServiceForm.delivery_type}
                  onValueChange={(value) => handleAddServiceFormChange("delivery_type", value)}
                  disabled={serviceSaving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select delivery type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="business_location">In-Studio/Business</SelectItem>
                    <SelectItem value="customer_location">Mobile</SelectItem>
                    <SelectItem value="virtual">Virtual</SelectItem>
                    <SelectItem value="both_locations">In-Studio or Mobile</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Price */}
              <div className="space-y-2">
                <Label htmlFor="add_custom_price">Business Price ($)</Label>
                <Input
                  id="add_custom_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={addServiceForm.custom_price}
                  onChange={(e) => handleAddServiceFormChange("custom_price", e.target.value)}
                  placeholder={selectedServiceId ? `Default: $${availableServices.find(s => s.id === selectedServiceId)?.min_price || '0'}` : "Enter custom price"}
                  disabled={serviceSaving}
                />
                <p className="text-xs text-foreground/60">
                  Leave empty to use default service price
                </p>
              </div>

              {/* Is Active */}
              <div className="flex items-center justify-between">
                <div>
                  <Label>Service Active</Label>
                  <p className="text-sm text-foreground/60">
                    Allow bookings for this service immediately
                  </p>
                </div>
                <Switch
                  checked={addServiceForm.is_active}
                  onCheckedChange={(checked) => handleAddServiceFormChange("is_active", checked)}
                  disabled={serviceSaving}
                  className="data-[state=checked]:bg-roam-blue"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={handleAddService}
                  disabled={serviceSaving || !selectedServiceId || availableServices.length === 0}
                  className="flex-1 bg-roam-blue hover:bg-roam-blue/90"
                >
                  {serviceSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Service
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancelAddService}
                  disabled={serviceSaving}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
