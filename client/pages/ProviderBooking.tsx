import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FavoriteButton } from "@/components/FavoriteButton";
import {
  Star,
  MapPin,
  Phone,
  Mail,
  Clock,
  Plus,
  Minus,
  Calendar,
  DollarSign,
  Globe,
  Check,
  Building,
  UserCheck,
  ArrowLeft,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import {
  BusinessProfile,
  BusinessService,
  BusinessAddon,
  BusinessLocation,
} from "@/lib/database.types";

interface ProviderData {
  business: BusinessProfile;
  services: BusinessService[];
  addons: BusinessAddon[];
  location: BusinessLocation;
  providers: any[];
}

interface BookingItem {
  type: "service" | "addon";
  id: string;
  name: string;
  price: number;
  duration?: number;
  quantity: number;
}

interface BookingForm {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  customerCity: string;
  customerState: string;
  customerZip: string;
  preferredDate: string;
  preferredTime: string;
  notes: string;
  items: BookingItem[];
}

const ProviderBooking = () => {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isCustomer, customer } = useAuth();

  // Get URL parameters for provider preference, service selection, date and time
  const urlParams = new URLSearchParams(window.location.search);
  const preferredProviderId = urlParams.get("provider");
  const selectedServiceId = urlParams.get("service");
  const preSelectedDate = urlParams.get("date");
  const preSelectedTime = urlParams.get("time");
  const promotionId = urlParams.get("promotion");
  const promoCode = urlParams.get("promo_code");
  const deliveryType = urlParams.get("deliveryType");
  const locationId = urlParams.get("location");
  const customerAddress = urlParams.get("address");
  const customerCity = urlParams.get("city");
  const customerState = urlParams.get("state");
  const customerZip = urlParams.get("zip");

  const [providerData, setProviderData] = useState<ProviderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<BookingItem[]>([]);
  const [preferredProvider, setPreferredProvider] = useState<any>(null);
  const [promotionData, setPromotionData] = useState<any>(null);
  const [customerProfile, setCustomerProfile] = useState<any>(null);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState<{
    [key: string]: boolean;
  }>({});
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerAddress: "",
    customerCity: "",
    customerState: "",
    customerZip: "",
    preferredDate: preSelectedDate || "",
    preferredTime: preSelectedTime || "",
    notes: "",
    items: [],
  });

  useEffect(() => {
    if (businessId) {
      fetchProviderData();
    }
  }, [businessId]);

  useEffect(() => {
    if (promotionId) {
      fetchPromotionData();
    }
  }, [promotionId]);

  useEffect(() => {
    // Load location based on delivery type
    if (locationId) {
      if (deliveryType === "business_location") {
        fetchBusinessLocation(locationId);
      } else if (deliveryType === "customer_location") {
        fetchCustomerLocation(locationId);
      }
    } else {
      // Check for JSON-encoded address data (from BusinessAvailability)
      const addressParam = urlParams.get("address");
      if (addressParam) {
        try {
          const addressData = JSON.parse(decodeURIComponent(addressParam));
          setSelectedLocation(addressData);
        } catch (error) {
          console.error("Error parsing address data:", error);
        }
      } else if (
        customerAddress &&
        customerCity &&
        customerState &&
        customerZip
      ) {
        // Use individual location parameters (for backward compatibility)
        setSelectedLocation({
          address_line1: customerAddress,
          city: customerCity,
          state: customerState,
          postal_code: customerZip,
        });
      }
    }
  }, [
    locationId,
    deliveryType,
    customerAddress,
    customerCity,
    customerState,
    customerZip,
  ]);

  useEffect(() => {
    if (user && isCustomer) {
      fetchCustomerProfile();
    } else if (user && !isCustomer) {
      // If user is authenticated but not a customer, still try to populate basic info
      console.log("User authenticated but not in customer role, using basic auth data");
      setBookingForm((prev) => ({
        ...prev,
        customerEmail: user.email || "",
        customerName: user.user_metadata?.full_name || "",
      }));
    }
  }, [user, isCustomer]);

  // Ensure email is populated if user is authenticated but form is empty
  useEffect(() => {
    if (user?.email && !bookingForm.customerEmail) {
      console.log("Populating form with user email:", user.email);
      setBookingForm((prev) => ({
        ...prev,
        customerEmail: user.email,
      }));
    }
  }, [user?.email, bookingForm.customerEmail]);

  // Force customer profile data population when booking modal opens
  useEffect(() => {
    if (isBookingModalOpen && user && isCustomer && !bookingForm.customerName) {
      console.log("Booking modal opened, ensuring customer data is populated");
      fetchCustomerProfile();
    }
  }, [isBookingModalOpen, user, isCustomer, bookingForm.customerName]);

  // Update form when selected location changes
  useEffect(() => {
    if (selectedLocation && !bookingForm.customerAddress) {
      console.log("Populating form with selected location:", selectedLocation);
      setBookingForm((prev) => ({
        ...prev,
        customerAddress: selectedLocation.address_line1 || "",
        customerCity: selectedLocation.city || "",
        customerState: selectedLocation.state || "",
        customerZip: selectedLocation.postal_code || "",
      }));
    }
  }, [selectedLocation, bookingForm.customerAddress]);

  const fetchProviderData = async () => {
    try {
      setLoading(true);

      // Fetch business profile
      const { data: business, error: businessError } = await supabase
        .from("business_profiles")
        .select("*")
        .eq("id", businessId)
        .eq("is_active", true)
        .eq("verification_status", "approved")
        .single();

      if (businessError || !business) {
        throw new Error("Business not found or not available for booking");
      }

      // Fetch business services
      const { data: services, error: servicesError } = await supabase
        .from("business_services")
        .select(
          `
          *,
          services:service_id (
            name,
            description,
            image_url,
            duration_minutes
          )
        `,
        )
        .eq("business_id", businessId)
        .eq("is_active", true);

      if (servicesError) {
        console.error(
          "Error fetching services:",
          servicesError.message || servicesError,
        );
      }

      // Fetch business addons filtered by selected service
      let addonsQuery = supabase
        .from("business_addons")
        .select(
          `
          *,
          addons:addon_id (
            id,
            name,
            description,
            image_url,
            service_addon_eligibility (
              service_id,
              is_recommended
            )
          )
        `,
        )
        .eq("business_id", businessId)
        .eq("is_available", true);

      const { data: allAddons, error: addonsError } = await addonsQuery;

      let addons = allAddons || [];

      // Filter by selected service if one is specified
      if (selectedServiceId && allAddons) {
        addons = allAddons.filter((addon) =>
          (addon as any).addons?.service_addon_eligibility?.some(
            (eligibility: any) => eligibility.service_id === selectedServiceId,
          ),
        );
      }

      if (addonsError) {
        console.error(
          "Error fetching addons:",
          addonsError.message || addonsError,
        );
      }

      // Fetch business location (take the first one if multiple exist)
      const { data: locations, error: locationError } = await supabase
        .from("business_locations")
        .select("*")
        .eq("business_id", businessId)
        .limit(1);

      const location = locations && locations.length > 0 ? locations[0] : null;

      if (locationError) {
        console.error(
          "Error fetching location:",
          locationError.message || locationError,
        );
      }

      // Fetch business providers
      const { data: providers, error: providersError } = await supabase
        .from("providers")
        .select(
          `
          id,
          first_name,
          last_name,
          bio,
          experience_years,
          image_url,
          average_rating,
          total_reviews
        `,
        )
        .eq("business_id", businessId)
        .eq("is_active", true);

      if (providersError) {
        console.error(
          "Error fetching providers:",
          providersError.message || providersError,
        );
      }

      // Set preferred provider if specified in URL
      if (preferredProviderId && providers) {
        const preferred = providers.find((p) => p.id === preferredProviderId);
        setPreferredProvider(preferred);
      }

      // Auto-select service if specified in URL
      if (selectedServiceId && services) {
        console.log("Looking for service with ID:", selectedServiceId);
        console.log(
          "Available services:",
          services.map((s) => ({
            id: s.id,
            service_id: s.service_id,
            name: s.services?.name,
          })),
        );

        const serviceToAdd = services.find(
          (s) =>
            s.id === selectedServiceId || s.service_id === selectedServiceId,
        );
        console.log("Found service to add:", serviceToAdd);

        if (serviceToAdd) {
          addItemToBooking(serviceToAdd, "service");
        } else {
          console.warn("Service not found with ID:", selectedServiceId);
        }
      }

      setProviderData({
        business,
        services: services || [],
        addons: addons || [],
        location: location || null,
        providers: providers || [],
      });
    } catch (error: any) {
      console.error("Error fetching provider data:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load provider information",
        variant: "destructive",
      });
      navigate("/providers");
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerProfile = async () => {
    try {
      // Use auth.users.id for the customer profile lookup
      const authUserId = user?.id;
      if (!authUserId) {
        console.log("No authenticated user ID available for profile fetch");
        return;
      }

      console.log("Fetching customer profile for auth user ID:", authUserId);

      const { data: profile, error } = await supabase
        .from("customer_profiles")
        .select("*")
        .eq("user_id", authUserId) // customer_profiles.user_id = auth.users.id
        .single();

      if (error) {
        console.error("Error fetching customer profile:", error);
        console.error(
          "Error details:",
          error.message || error.details || error,
        );

        // If no profile exists but user is authenticated, populate with basic user data
        if (error.code === "PGRST116" && user?.email) {
          console.log("No customer profile found, using auth user data");
          setBookingForm((prev) => ({
            ...prev,
            customerEmail: user.email || "",
            customerName: user.user_metadata?.full_name || user.user_metadata?.name || "",
            customerPhone: user.user_metadata?.phone || "",
          }));
        }
        return;
      }

      if (profile) {
        setCustomerProfile(profile);
        // Pre-populate the form with customer data
        const fullName = [profile.first_name, profile.last_name]
          .filter(Boolean)
          .join(" ");

        // Fetch the customer's most recent location
        const { data: customerLocations } = await supabase
          .from("customer_locations")
          .select("*")
          .eq("customer_id", authUserId)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(1);

        const mostRecentLocation = customerLocations?.[0];

        // Use selected location from previous step, then fall back to most recent location
        const locationToUse = selectedLocation || mostRecentLocation;

        setBookingForm((prev) => ({
          ...prev,
          customerName: fullName || "",
          customerEmail: profile.email || user?.email || "",
          customerPhone: profile.phone || "",
          customerAddress: locationToUse?.address_line1 || "",
          customerCity: locationToUse?.city || "",
          customerState: locationToUse?.state || "",
          customerZip: locationToUse?.postal_code || "",
        }));

        console.log("Pre-populated booking form with customer data:", {
          customerName: fullName,
          customerEmail: profile.email || user?.email,
          customerPhone: profile.phone,
          customerAddress: mostRecentLocation?.address_line1,
          customerCity: mostRecentLocation?.city,
          customerState: mostRecentLocation?.state,
          customerZip: mostRecentLocation?.postal_code,
        });
      }
    } catch (error: any) {
      console.error("Error fetching customer profile:", error);
      console.error("Error details:", {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
        fullError: error,
      });
    }
  };

  const fetchCustomerLocation = async (locationId: string) => {
    try {
      const { data: location, error } = await supabase
        .from("customer_locations")
        .select("*")
        .eq("id", locationId)
        .single();

      if (error) {
        console.error("Error fetching customer location:", error);
        return;
      }

      if (location) {
        setSelectedLocation(location);
        console.log("Loaded selected customer location:", location);
      }
    } catch (error) {
      console.error("Error fetching customer location:", error);
    }
  };

  const fetchBusinessLocation = async (locationId: string) => {
    try {
      const { data: location, error } = await supabase
        .from("business_locations")
        .select("*")
        .eq("id", locationId)
        .single();

      if (error) {
        console.error("Error fetching business location:", error);
        return;
      }

      if (location) {
        setSelectedLocation(location);
        console.log("Loaded selected business location:", location);
      }
    } catch (error) {
      console.error("Error fetching business location:", error);
    }
  };

  const fetchPromotionData = async () => {
    try {
      const { data: promotion, error } = await supabase
        .from("promotions")
        .select(
          `
          id,
          title,
          description,
          start_date,
          end_date,
          is_active,
          promo_code,
          savings_type,
          savings_amount,
          savings_max_amount,
          service_id,
          business_id
        `,
        )
        .eq("id", promotionId)
        .eq("is_active", true)
        .single();

      if (error) {
        console.error("Error fetching promotion:", error);
        return;
      }

      // Check if promotion is still valid (not expired)
      if (promotion.end_date) {
        const endDate = new Date(promotion.end_date);
        endDate.setHours(23, 59, 59, 999);
        const currentDate = new Date();
        if (endDate < currentDate) {
          console.warn("Promotion has expired");
          return;
        }
      }

      // Verify promo code matches if provided
      if (promoCode && promotion.promo_code !== promoCode) {
        console.warn("Promo code mismatch");
        return;
      }

      setPromotionData(promotion);
      console.log("Promotion data loaded:", promotion);
    } catch (error) {
      console.error("Error fetching promotion data:", error);
    }
  };

  const addItemToBooking = (
    item: BusinessService | BusinessAddon,
    type: "service" | "addon",
  ) => {
    console.log("Adding item to booking:", { item, type });

    const bookingItem: BookingItem = {
      type,
      id: item.id,
      name:
        type === "service"
          ? (item as any).services.name
          : (item as any).addons.name,
      price: (item as any).custom_price || (item as any).business_price || 0,
      duration:
        type === "service"
          ? (item as any).services.duration_minutes
          : undefined,
      quantity: 1,
    };

    console.log("Created booking item:", bookingItem);

    const existingIndex = selectedItems.findIndex(
      (i) => i.id === item.id && i.type === type,
    );
    if (existingIndex >= 0) {
      // Item already exists, don't add again
      console.log("Item already in selection");
      return;
    } else {
      setSelectedItems([...selectedItems, bookingItem]);
      console.log("Added new item to selection");
    }

    toast({
      title: "Added to booking",
      description: `${bookingItem.name} has been added to your booking`,
    });
  };

  const removeItemFromBooking = (itemId: string, type: "service" | "addon") => {
    const existingIndex = selectedItems.findIndex(
      (i) => i.id === itemId && i.type === type,
    );
    if (existingIndex >= 0) {
      const updated = [...selectedItems];
      updated.splice(existingIndex, 1);
      setSelectedItems(updated);

      toast({
        title: "Removed from booking",
        description: `Item has been removed from your booking`,
      });
    }
  };

  const getItemQuantity = (itemId: string, type: "service" | "addon") => {
    const item = selectedItems.find((i) => i.id === itemId && i.type === type);
    return item ? item.quantity : 0;
  };

  const getTotalAmount = () => {
    const subtotal = selectedItems.reduce(
      (total, item) => total + item.price,
      0,
    );
    return subtotal - getDiscountAmount();
  };

  const getSubtotal = () => {
    return selectedItems.reduce((total, item) => total + item.price, 0);
  };

  const getDiscountAmount = () => {
    if (
      !promotionData ||
      !promotionData.savings_type ||
      !promotionData.savings_amount
    ) {
      return 0;
    }

    const subtotal = getSubtotal();

    if (promotionData.savings_type === "percentage") {
      const percentageDiscount =
        (subtotal * promotionData.savings_amount) / 100;

      // Apply maximum discount cap if specified
      if (promotionData.savings_max_amount) {
        return Math.min(percentageDiscount, promotionData.savings_max_amount);
      }

      return percentageDiscount;
    } else if (promotionData.savings_type === "fixed_amount") {
      // Fixed amount discount, but don't let it exceed the subtotal
      return Math.min(promotionData.savings_amount, subtotal);
    }

    return 0;
  };

  const openBookingModal = () => {
    if (selectedItems.length === 0) {
      toast({
        title: "No items selected",
        description: "Please select at least one service or add-on to proceed",
        variant: "destructive",
      });
      return;
    }

    // Refresh customer profile data when opening booking modal
    if (user && isCustomer) {
      fetchCustomerProfile();
    }

    setBookingForm((prev) => ({ ...prev, items: selectedItems }));
    setIsBookingModalOpen(true);
  };

  const submitBooking = async () => {
    try {
      if (
        !bookingForm.customerName ||
        !bookingForm.customerEmail ||
        !bookingForm.customerAddress ||
        !bookingForm.customerCity ||
        !bookingForm.customerState ||
        !bookingForm.customerZip ||
        !bookingForm.preferredDate
      ) {
        toast({
          title: "Missing information",
          description:
            "Please fill in all required fields including your complete address",
          variant: "destructive",
        });
        return;
      }

      // Debug customer authentication
      console.log("Booking submission debug:", {
        user,
        customer,
        isCustomer,
        authUserId: user?.id, // This is auth.users.id from the session
        customerData: customer,
        isAuthenticated: !!user,
      });

      // Use auth.users.id as the customer_id for the booking
      const customerId = user?.id; // This should be the auth.users.id from the authenticated session

      if (!customerId) {
        toast({
          title: "Authentication required",
          description: "Please sign in to complete your booking.",
          variant: "destructive",
        });
        return;
      }

      console.log("Submitting booking with customer_id:", customerId);

      // First, create the customer location
      let customerLocationId = null;
      try {
        const { data: customerLocation, error: locationError } = await supabase
          .from("customer_locations")
          .insert({
            customer_id: customerId,
            address_line1: bookingForm.customerAddress,
            city: bookingForm.customerCity,
            state: bookingForm.customerState,
            postal_code: bookingForm.customerZip,
            is_active: true,
          })
          .select()
          .single();

        if (locationError) {
          console.error("Error creating customer location:", locationError);
          throw new Error(
            "Failed to save customer location. Please try again.",
          );
        }

        customerLocationId = customerLocation.id;
        console.log("Customer location created:", customerLocationId);
      } catch (locationError: any) {
        console.error("Customer location creation failed:", locationError);
        toast({
          title: "Location Error",
          description:
            locationError.message ||
            "Failed to save your address. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Create booking record
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          provider_id: preferredProviderId || null, // Use the selected provider ID
          service_id:
            selectedItems.find((item) => item.type === "service")?.id ||
            selectedItems[0]?.id,
          customer_id: customerId || null, // Use proper customer ID
          customer_location_id: deliveryType === "customer_location" ? (locationId || location?.id) : null,
          business_location_id: deliveryType === "business_location" ? location?.id : null,
          delivery_type: deliveryType || "customer_location",
          guest_name: !customerId ? bookingForm.customerName : null, // Only use guest fields if not authenticated
          guest_email: !customerId ? bookingForm.customerEmail : null,
          guest_phone: !customerId ? bookingForm.customerPhone : null,
          booking_date: bookingForm.preferredDate,
          start_time: bookingForm.preferredTime || "09:00",
          admin_notes: bookingForm.notes,
          total_amount: getTotalAmount(),
          booking_status: "pending",
          payment_status: "pending",
        })
        .select()
        .single();

      if (bookingError) {
        throw bookingError;
      }

      toast({
        title: "Booking submitted!",
        description:
          "Your booking request has been submitted. The provider will contact you shortly.",
      });

      setIsBookingModalOpen(false);
      setSelectedItems([]);
      setBookingForm({
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        customerAddress: "",
        customerCity: "",
        customerState: "",
        customerZip: "",
        preferredDate: "",
        preferredTime: "",
        notes: "",
        items: [],
      });
    } catch (error: any) {
      console.error("Error submitting booking:", error);

      // Improved error message extraction for Supabase errors
      let errorMessage = "Failed to submit booking. Please try again.";

      if (typeof error === "string") {
        errorMessage = error;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.details) {
        errorMessage = error.details;
      } else if (error?.error?.message) {
        errorMessage = error.error.message;
      } else if (error?.hint) {
        errorMessage = error.hint;
      } else if (error?.code) {
        errorMessage = `Database error (${error.code}): Please try again.`;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const toggleDescription = (serviceId: string) => {
    setExpandedDescriptions((prev) => ({
      ...prev,
      [serviceId]: !prev[serviceId],
    }));
  };

  const truncateDescription = (description: string, isExpanded: boolean) => {
    if (!description) return "";
    if (description.length <= 100 || isExpanded) return description;
    return description.substring(0, 100) + "...";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading provider information...</p>
        </div>
      </div>
    );
  }

  if (!providerData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Provider Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            The provider you're looking for is not available for booking.
          </p>
          <Button onClick={() => navigate("/providers")}>
            Browse Other Providers
          </Button>
        </div>
      </div>
    );
  }

  const { business, services, addons, location, providers } = providerData;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button asChild variant="ghost" size="sm">
                <Link to="/home">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
              <div className="flex items-center">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2Fa42b6f9ec53e4654a92af75aad56d14f%2F38446bf6c22b453fa45caf63b0513e21?format=webp&width=800"
                  alt="ROAM - Your Best Life. Everywhere."
                  className="h-8 w-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage
                src={business.logo_url || business.image_url || undefined}
              />
              <AvatarFallback>
                {business.business_name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {business.business_name}
                  </h1>
                  <p className="text-gray-600">
                    {business.business_description}
                  </p>
                  <div className="flex items-center space-x-4 mt-2">
                    {business.verification_status === "approved" && (
                      <Badge
                        variant="default"
                        className="bg-green-100 text-green-800"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white w-full sm:w-auto"
                  >
                    <Link to={`/business/${business.id}`}>
                      <Building className="w-5 h-5 mr-2" />
                      <span className="hidden sm:inline">
                        View Business Profile
                      </span>
                      <span className="sm:hidden">View Profile</span>
                    </Link>
                  </Button>
                  <FavoriteButton
                    type="business"
                    itemId={business.id}
                    size="lg"
                    variant="outline"
                    showText={true}
                    className="border-gray-300 hover:border-red-300 w-full sm:w-auto"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Business Info */}
            <Card>
              <CardHeader>
                <CardTitle>About This Business</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {business.business_description && (
                  <p className="text-gray-700">
                    {business.business_description}
                  </p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {business.contact_email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{business.contact_email}</span>
                    </div>
                  )}
                  {business.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{business.phone}</span>
                    </div>
                  )}
                  {business.website_url && (
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4 text-gray-500" />
                      <a
                        href={business.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Visit Website
                      </a>
                    </div>
                  )}
                  {location && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        {location.address_line1}, {location.city},{" "}
                        {location.state} {location.postal_code}
                      </span>
                    </div>
                  )}
                </div>

                {business.years_in_business && (
                  <div className="pt-2">
                    <Badge variant="outline">
                      {business.years_in_business} years in business
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Provider Preference */}
            {preferredProvider && (
              <Card className="bg-green-50 border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <UserCheck className="w-5 h-5" />
                    Preferred Provider Selected
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={preferredProvider.image_url || undefined}
                      />
                      <AvatarFallback>
                        {preferredProvider.first_name[0]}
                        {preferredProvider.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-semibold text-green-800">
                        {preferredProvider.first_name}{" "}
                        {preferredProvider.last_name}
                      </div>
                      {preferredProvider.bio && (
                        <p className="text-sm text-green-600 line-clamp-1">
                          {preferredProvider.bio}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2">
                        {preferredProvider.experience_years && (
                          <span className="text-xs text-green-600">
                            {preferredProvider.experience_years} years
                            experience
                          </span>
                        )}
                        {preferredProvider.average_rating && (
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-green-600 fill-current" />
                            <span className="text-xs text-green-600">
                              {preferredProvider.average_rating} (
                              {preferredProvider.total_reviews || 0} reviews)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 p-3 bg-green-100 rounded-md">
                    <p className="text-sm text-green-700">
                      <strong>Note:</strong> This is your preferred provider for
                      this booking. The business will try to assign this
                      provider, but final assignment depends on availability and
                      business approval.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Services */}
            {services.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {selectedServiceId ? "Selected Service" : "Services"}
                  </CardTitle>
                  {selectedServiceId && (
                    <p className="text-sm text-gray-600 mt-1">
                      Ready to book •{" "}
                      {preSelectedDate &&
                        new Date(preSelectedDate).toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        })}{" "}
                      {preSelectedTime && `at ${preSelectedTime}`}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4">
                    {(() => {
                      console.log("Selected Service ID:", selectedServiceId);
                      console.log(
                        "All services:",
                        services.map((s) => ({
                          id: s.id,
                          service_id: s.service_id,
                          name: s.services?.name,
                        })),
                      );
                      const filteredServices = services.filter(
                        (service) =>
                          !selectedServiceId ||
                          service.service_id === selectedServiceId ||
                          service.id === selectedServiceId,
                      );
                      console.log("Filtered services:", filteredServices);
                      return filteredServices;
                    })().map((service) => (
                      <div
                        key={service.id}
                        className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                          selectedServiceId &&
                          (service.service_id === selectedServiceId ||
                            service.id === selectedServiceId)
                            ? "border-roam-blue bg-roam-blue/5 border-2"
                            : ""
                        }`}
                      >
                        <div className="flex items-center gap-4 mb-4">
                          {(service as any).services.image_url && (
                            <img
                              src={(service as any).services.image_url}
                              alt={(service as any).services.name}
                              className="w-12 h-12 object-cover rounded flex-shrink-0"
                            />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">
                                {(service as any).services.name}
                              </h3>
                              {selectedServiceId &&
                                (service.service_id === selectedServiceId ||
                                  service.id === selectedServiceId) && (
                                  <Badge className="bg-roam-yellow text-gray-900 text-xs">
                                    Selected
                                  </Badge>
                                )}
                            </div>
                            {(service as any).services.description && (
                              <div className="mb-2">
                                <p className="text-sm text-gray-600">
                                  {truncateDescription(
                                    (service as any).services.description,
                                    expandedDescriptions[service.id] || false,
                                  )}
                                  {(service as any).services.description
                                    .length > 100 && (
                                    <button
                                      onClick={() =>
                                        toggleDescription(service.id)
                                      }
                                      className="ml-2 text-roam-blue hover:text-roam-blue/80 text-sm font-medium"
                                    >
                                      {expandedDescriptions[service.id]
                                        ? "Read Less"
                                        : "Read More"}
                                    </button>
                                  )}
                                </p>
                              </div>
                            )}
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center">
                                <DollarSign className="h-4 w-4 mr-1" />
                                <span className="font-semibold">
                                  $
                                  {(service as any).custom_price ||
                                    (service as any).business_price ||
                                    0}
                                </span>
                              </div>
                              {(service as any).services.estimated_duration && (
                                <div className="flex items-center">
                                  <Clock className="h-4 w-4 mr-1" />
                                  <span>
                                    {
                                      (service as any).services
                                        .estimated_duration
                                    }{" "}
                                    min
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <FavoriteButton
                            type="service"
                            itemId={service.service_id}
                            size="sm"
                            variant="ghost"
                          />
                        </div>

                        <div className="flex justify-end">
                          <div className="flex items-center space-x-2">
                            {getItemQuantity(service.id, "service") > 0 ? (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  removeItemFromBooking(service.id, "service")
                                }
                              >
                                Remove
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() =>
                                  addItemToBooking(service, "service")
                                }
                              >
                                Add
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Add-ons */}
            {addons.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {selectedServiceId
                      ? "Available Add-ons for Selected Service"
                      : "Available Add-ons"}
                  </CardTitle>
                  {selectedServiceId && (
                    <p className="text-sm text-gray-600 mt-1">
                      These add-ons are compatible with your selected service
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addons.map((addon) => (
                      <div
                        key={addon.id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">
                                {(addon as any).addons.name}
                              </h3>
                              {selectedServiceId &&
                                (
                                  addon as any
                                ).addons?.service_addon_eligibility?.some(
                                  (eligibility: any) =>
                                    eligibility.service_id ===
                                      selectedServiceId &&
                                    eligibility.is_recommended,
                                ) && (
                                  <Badge className="bg-green-100 text-green-800 text-xs">
                                    Recommended
                                  </Badge>
                                )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {(addon as any).addons.description}
                            </p>
                          </div>
                          {(addon as any).addons.image_url && (
                            <img
                              src={(addon as any).addons.image_url}
                              alt={(addon as any).addons.name}
                              className="w-16 h-16 object-cover rounded ml-4"
                            />
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-1 text-gray-500" />
                            <span className="font-semibold">
                              ${addon.custom_price}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            {getItemQuantity(addon.id, "addon") > 0 ? (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  removeItemFromBooking(addon.id, "addon")
                                }
                              >
                                Remove
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => addItemToBooking(addon, "addon")}
                              >
                                Add
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Service Location */}
            {selectedLocation && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-roam-blue" />
                    Service Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="font-medium text-gray-900">
                      {selectedLocation.address_line1}
                    </div>
                    {selectedLocation.address_line2 && (
                      <div className="text-gray-600">
                        {selectedLocation.address_line2}
                      </div>
                    )}
                    <div className="text-gray-600">
                      {selectedLocation.city}, {selectedLocation.state}{" "}
                      {selectedLocation.postal_code}
                    </div>
                    {selectedLocation.country &&
                      selectedLocation.country !== "US" && (
                        <div className="text-gray-600">
                          {selectedLocation.country}
                        </div>
                      )}
                  </div>
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-gray-500">
                      Service will be provided at this location
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Booking Summary */}
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedItems.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No items selected
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedItems.map((item, index) => (
                      <div
                        key={`${item.type}-${item.id}-${index}`}
                        className="flex justify-between items-center"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.name}</p>
                        </div>
                        <div className="text-sm font-medium">
                          ${item.price.toFixed(2)}
                        </div>
                      </div>
                    ))}

                    <Separator />

                    {promotionData && getDiscountAmount() > 0 && (
                      <>
                        <div className="flex justify-between items-center">
                          <span>Subtotal</span>
                          <span>${getSubtotal().toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-green-600">
                          <span className="flex items-center">
                            <Badge variant="secondary" className="mr-2 text-xs">
                              {promotionData.promo_code}
                            </Badge>
                            Discount
                          </span>
                          <span>-${getDiscountAmount().toFixed(2)}</span>
                        </div>
                        <Separator />
                      </>
                    )}

                    <div className="flex justify-between items-center font-semibold">
                      <span>Total</span>
                      <span>${getTotalAmount().toFixed(2)}</span>
                    </div>

                    <Button className="w-full mt-4" onClick={openBookingModal}>
                      <Calendar className="h-4 w-4 mr-2" />
                      Book Now
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <Dialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Complete Your Booking</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Customer Information */}
            <div className="space-y-4">
              <h3 className="font-semibold">Your Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName">Full Name *</Label>
                  <Input
                    id="customerName"
                    name="customerName"
                    autoComplete="name"
                    required
                    value={bookingForm.customerName}
                    onChange={(e) =>
                      setBookingForm((prev) => ({
                        ...prev,
                        customerName: e.target.value,
                      }))
                    }
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <Label htmlFor="customerEmail">Email *</Label>
                  <Input
                    id="customerEmail"
                    name="customerEmail"
                    type="email"
                    autoComplete="email"
                    required
                    value={bookingForm.customerEmail}
                    onChange={(e) =>
                      setBookingForm((prev) => ({
                        ...prev,
                        customerEmail: e.target.value,
                      }))
                    }
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <Label htmlFor="customerPhone">Phone Number</Label>
                  <Input
                    id="customerPhone"
                    name="customerPhone"
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    pattern="^[0-9\-\s\(\)]+$"
                    value={bookingForm.customerPhone}
                    onChange={(e) =>
                      setBookingForm((prev) => ({
                        ...prev,
                        customerPhone: e.target.value,
                      }))
                    }
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>

              {/* Service Location - Read Only */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Service Location</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(-1)}
                    className="text-roam-blue border-roam-blue hover:bg-roam-blue hover:text-white"
                  >
                    Change Location
                  </Button>
                </div>
                <Card className="bg-gray-50 border border-gray-200">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="font-medium text-gray-900">
                        {bookingForm.customerAddress}
                      </div>
                      <div className="text-gray-600">
                        {bookingForm.customerCity}, {bookingForm.customerState} {bookingForm.customerZip}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Booking Details */}
            <div className="space-y-4">
              <h3 className="font-semibold">Booking Details</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="preferredDate">Preferred Date *</Label>
                  <Input
                    id="preferredDate"
                    name="preferredDate"
                    type="date"
                    autoComplete="bday"
                    required
                    value={bookingForm.preferredDate}
                    onChange={(e) =>
                      setBookingForm((prev) => ({
                        ...prev,
                        preferredDate: e.target.value,
                      }))
                    }
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>

                <div>
                  <Label htmlFor="preferredTime">Preferred Time</Label>
                  <Input
                    id="preferredTime"
                    name="preferredTime"
                    type="time"
                    value={bookingForm.preferredTime}
                    onChange={(e) =>
                      setBookingForm((prev) => ({
                        ...prev,
                        preferredTime: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={bookingForm.notes}
                  onChange={(e) =>
                    setBookingForm((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  placeholder="Any special requests or additional information..."
                  rows={3}
                />
              </div>
            </div>

            {/* Order Summary */}
            <div className="space-y-4">
              <h3 className="font-semibold">Order Summary</h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                {selectedItems.map((item, index) => (
                  <div
                    key={`${item.type}-${item.id}-${index}`}
                    className="flex justify-between"
                  >
                    <span>{item.name}</span>
                    <span>${item.price.toFixed(2)}</span>
                  </div>
                ))}
                <Separator />

                {promotionData && getDiscountAmount() > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>${getSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span className="flex items-center">
                        <Badge variant="secondary" className="mr-2 text-xs">
                          {promotionData.promo_code}
                        </Badge>
                        Discount
                      </span>
                      <span>-${getDiscountAmount().toFixed(2)}</span>
                    </div>
                    <Separator />
                  </>
                )}

                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>${getTotalAmount().toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsBookingModalOpen(false)}
              >
                Cancel
              </Button>
              <Button className="flex-1" onClick={submitBooking}>
                Submit Booking Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProviderBooking;
