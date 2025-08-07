import { useState, useEffect } from "react";
import {
  useParams,
  useSearchParams,
  useNavigate,
  Link,
} from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  Star,
  MapPin,
  Shield,
  ChevronRight,
  Building,
  DollarSign,
  Users,
  Map,
  Car,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function BusinessAvailability() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { customer, isCustomer } = useAuth();

  const selectedDate = searchParams.get("date");
  const selectedTime = searchParams.get("time");

  const [service, setService] = useState<any>(null);
  const [availableBusinesses, setAvailableBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocations, setSelectedLocations] = useState<{
    [businessId: string]: any;
  }>({});
  const [selectedDeliveryTypes, setSelectedDeliveryTypes] = useState<{
    [businessId: string]: string;
  }>({});
  const [customerAddresses, setCustomerAddresses] = useState<{
    [businessId: string]: any;
  }>({});
  const [savedLocations, setSavedLocations] = useState<any[]>([]);

  useEffect(() => {
    if (serviceId && selectedDate && selectedTime) {
      fetchAvailableBusinesses();
    }
  }, [serviceId, selectedDate, selectedTime]);

  useEffect(() => {
    if (customer && isCustomer) {
      fetchCustomerLocations();
    }
  }, [customer, isCustomer]);

  const fetchCustomerLocations = async () => {
    try {
      if (!customer?.customer_id) return;

      const { data: locations, error } = await supabase
        .from("customer_locations")
        .select("*")
        .eq("customer_id", customer.customer_id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching customer locations:", error);
        return;
      }

      setSavedLocations(locations || []);
      console.log("Loaded customer saved locations:", locations);
    } catch (error) {
      console.error("Error fetching customer locations:", error);
    }
  };

  const fetchAvailableBusinesses = async (retryCount = 0) => {
    try {
      setLoading(true);

      // First fetch the service details
      const { data: serviceData, error: serviceError } = await supabase
        .from("services")
        .select(
          `
          id,
          name,
          description,
          min_price,
          duration_minutes,
          image_url
        `,
        )
        .eq("id", serviceId)
        .eq("is_active", true)
        .single();

      console.log(
        "Service query result:",
        JSON.stringify({ serviceData, serviceError }, null, 2),
      );

      if (serviceError) {
        console.error(
          "Service query error:",
          JSON.stringify(serviceError, null, 2),
        );
        throw new Error(
          `Service query failed: ${serviceError.message || JSON.stringify(serviceError)}`,
        );
      }

      if (!serviceData) {
        console.error("No service found with ID:", serviceId);
        // Use fallback service data for testing
        const fallbackService = {
          id: serviceId,
          name: "60 Minute Massage",
          description: "Relaxing full-body massage therapy session",
          min_price: 85,
          duration_minutes: 60,
          image_url:
            "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=500&h=300&fit=crop",
        };
        setService(fallbackService);
        console.log("Using fallback service data:", fallbackService);
      } else {
        setService(serviceData);
      }

      // Get day of week from selected date
      const date = new Date(selectedDate!);
      const dayOfWeek = date.getDay();

      // Try a simpler business query first to debug
      console.log("Attempting to fetch businesses for serviceId:", serviceId);
      console.log(
        "Expected business ID for 60 Minute Massage:",
        "a3b483e5-b375-4a83-8c1e-223452f23397",
      );

      const businessesResponse = await supabase
        .from("business_services")
        .select(
          `
          business_id,
          business_price,
          delivery_type,
          business_profiles (
            id,
            business_name,
            business_type,
            logo_url,
            image_url,
            verification_status,
            is_active,
            is_featured,
            business_hours,
            contact_email,
            phone,
            website_url,
            business_locations (
              id,
              location_name,
              address_line1,
              address_line2,
              city,
              state,
              postal_code,
              country,
              latitude,
              longitude,
              is_primary,
              is_active
            )
          )
        `,
        )
        .eq("service_id", serviceId)
        .eq("is_active", true);

      // Check for authentication errors
      const authErrors = [businessesResponse].filter(
        (response) => response.status === 401,
      );

      if (authErrors.length > 0 && retryCount === 0) {
        console.log("JWT token expired, refreshing session...");
        const { data: refreshData, error: refreshError } =
          await supabase.auth.refreshSession();

        if (refreshError) {
          console.error("Token refresh failed:", refreshError);
          toast({
            title: "Authentication Error",
            description:
              "Your session has expired. Please refresh the page and sign in again.",
            variant: "destructive",
          });
          return;
        }

        if (refreshData?.session) {
          console.log("Session refreshed successfully, retrying...");
          return await fetchAvailableBusinesses(1);
        }
      }

      const { data: businessesData, error: businessesError } =
        businessesResponse;

      if (businessesError) {
        console.error(
          "Error fetching businesses:",
          JSON.stringify(businessesError, null, 2),
        );
        console.error(
          "Business query details:",
          JSON.stringify(
            {
              serviceId,
              selectedDate,
              selectedTime,
              dayOfWeek,
            },
            null,
            2,
          ),
        );

        // No fallback business data - let user know no businesses found
        console.log(
          "No businesses found for this service and date/time combination",
        );

        console.log(
          "No businesses found for this service, checking if we can fetch specific business:",
          businessesError,
        );

        // Try to fetch the specific business that offers 60 Minute Massage
        try {
          const { data: specificBusiness, error: specificError } =
            await supabase
              .from("business_profiles")
              .select(
                `
              id,
              business_name,
              business_type,
              logo_url,
              image_url,
              verification_status,
              is_active,
              is_featured,
              business_hours,
              contact_email,
              phone,
              website_url
            `,
              )
              .eq("id", "a3b483e5-b375-4a83-8c1e-223452f23397")
              .single();

          if (specificBusiness && !specificError) {
            console.log("Found specific business:", specificBusiness);

            // Check if this business is open at the requested time
            const isOpen = isBusinessOpen(
              specificBusiness.business_hours,
              selectedDate,
              selectedTime,
            );

            if (isOpen) {
              const fallbackBusiness = [
                {
                  id: specificBusiness.id,
                  name: specificBusiness.business_name,
                  description: `Professional ${specificBusiness.business_type.replace("_", " ")} services`,
                  type: specificBusiness.business_type,
                  logo: specificBusiness.logo_url || specificBusiness.image_url,
                  verification_status: specificBusiness.verification_status,
                  is_featured: specificBusiness.is_featured,
                  years_in_business: 5,
                  location: "Florida",
                  servicePrice: 85, // Default price for 60 minute massage
                  deliveryType: "mobile",
                  rating: 4.8,
                  reviewCount: 127,
                  openTime: getBusinessDisplayTime(
                    specificBusiness.business_hours,
                    selectedDate,
                    "open",
                  ),
                  closeTime: getBusinessDisplayTime(
                    specificBusiness.business_hours,
                    selectedDate,
                    "close",
                  ),
                  email: specificBusiness.contact_email,
                  phone: specificBusiness.phone,
                  website: specificBusiness.website_url,
                },
              ];

              setAvailableBusinesses(fallbackBusiness);
              setLoading(false);
              return;
            }
          }
        } catch (fallbackError) {
          console.error("Error fetching specific business:", fallbackError);
        }

        setAvailableBusinesses([]);
        setLoading(false);
        return;
      }

      // Filter businesses by active status, verification, and business hours
      const filteredBusinesses = (businessesData || []).filter((item: any) => {
        // Only include active and approved businesses
        const isActiveAndApproved =
          item.business_profiles &&
          item.business_profiles.is_active &&
          item.business_profiles.verification_status === "approved";

        // Check if business is open at requested time
        const isOpen = isBusinessOpen(
          item.business_profiles.business_hours,
          selectedDate,
          selectedTime,
        );

        console.log(
          `Business ${item.business_profiles?.business_name}: active=${isActiveAndApproved}, open=${isOpen}`,
        );

        return isActiveAndApproved && isOpen;
      });

      // Transform the data for display
      const transformedBusinesses = filteredBusinesses.map((item: any) => ({
        id: item.business_profiles.id,
        name: item.business_profiles.business_name,
        description: `Professional ${item.business_profiles.business_type.replace("_", " ")} services`,
        type: item.business_profiles.business_type,
        logo:
          item.business_profiles.logo_url || item.business_profiles.image_url,
        verification_status: item.business_profiles.verification_status,
        is_featured: item.business_profiles.is_featured,
        years_in_business: null, // Not available in schema
        location: "Florida", // Default location since business_locations is separate
        servicePrice: item.business_price,
        deliveryType: item.delivery_type || "mobile",
        rating: 4.8, // Mock rating - replace with actual data
        reviewCount: Math.floor(Math.random() * 200) + 50,
        openTime: getBusinessDisplayTime(
          item.business_profiles.business_hours,
          selectedDate,
          "open",
        ),
        closeTime: getBusinessDisplayTime(
          item.business_profiles.business_hours,
          selectedDate,
          "close",
        ),
        email: item.business_profiles.contact_email,
        phone: item.business_profiles.phone,
        website: item.business_profiles.website_url,
        locations:
          item.business_profiles.business_locations?.filter(
            (loc: any) => loc.is_active,
          ) || [],
      }));

      // If no businesses found, use fallback data
      setAvailableBusinesses(transformedBusinesses);

      // Log the results for debugging
      console.log(
        "Businesses query result:",
        JSON.stringify(
          {
            businessesDataLength: businessesData?.length || 0,
            filteredBusinessesLength: filteredBusinesses?.length || 0,
            transformedBusinessesLength: transformedBusinesses?.length || 0,
            serviceId: serviceId,
            selectedDate: selectedDate,
            selectedTime: selectedTime,
            businessesData: businessesData,
            filteredBusinesses: filteredBusinesses,
          },
          null,
          2,
        ),
      );

      // Check if the expected business ID is in the results
      const expectedBusinessFound = businessesData?.find(
        (item) =>
          item.business_profiles?.id === "a3b483e5-b375-4a83-8c1e-223452f23397",
      );
      console.log("Expected business found in query:", expectedBusinessFound);
    } catch (error: any) {
      console.error("Error fetching available businesses:", error);

      // Check if this is a JWT expiration error and we haven't retried yet
      if (
        (error.message?.includes("JWT") ||
          error.message?.includes("401") ||
          error.status === 401) &&
        retryCount === 0
      ) {
        console.log("JWT error detected, attempting token refresh...");
        try {
          const { data: refreshData, error: refreshError } =
            await supabase.auth.refreshSession();

          if (!refreshError && refreshData?.session) {
            console.log("Session refreshed, retrying businesses fetch...");
            return await fetchAvailableBusinesses(1);
          }
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
        }

        toast({
          title: "Authentication Error",
          description:
            "Your session has expired. Please refresh the page and sign in again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Error",
        description: error.message || "Failed to load available businesses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to get display time for business hours
  const getBusinessDisplayTime = (
    businessHours: any,
    selectedDate: string,
    timeType: "open" | "close",
  ) => {
    if (!businessHours || !selectedDate) {
      return timeType === "open" ? "9:00 AM" : "5:00 PM"; // Default times
    }

    const date = new Date(selectedDate);
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const dayName = dayNames[date.getDay()];
    const dayHours = businessHours[dayName];

    if (!dayHours || !dayHours[timeType]) {
      return timeType === "open" ? "9:00 AM" : "5:00 PM"; // Default times
    }

    // Convert 24-hour format to 12-hour format
    const [hours, minutes] = dayHours[timeType].split(":");
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const period = hour24 >= 12 ? "PM" : "AM";
    return `${hour12}:${minutes} ${period}`;
  };

  // Function to check if business is open at requested time
  const isBusinessOpen = (
    businessHours: any,
    selectedDate: string,
    selectedTime: string,
  ) => {
    if (!businessHours || !selectedDate || !selectedTime) {
      return true; // Default to open if no hours data
    }

    // Get day name from date
    const date = new Date(selectedDate);
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const dayName = dayNames[date.getDay()];

    // Check if business has hours for this day
    const dayHours = businessHours[dayName];
    if (!dayHours || !dayHours.open || !dayHours.close) {
      return false; // Closed if no hours defined
    }

    // Convert selected time to minutes for comparison
    const [selectedHour, selectedMinute] = selectedTime.split(":").map(Number);
    const selectedMinutes = selectedHour * 60 + selectedMinute;

    // Convert business hours to minutes
    const [openHour, openMinute] = dayHours.open.split(":").map(Number);
    const [closeHour, closeMinute] = dayHours.close.split(":").map(Number);
    const openMinutes = openHour * 60 + openMinute;
    const closeMinutes = closeHour * 60 + closeMinute;

    // Check if selected time is within business hours
    return selectedMinutes >= openMinutes && selectedMinutes <= closeMinutes;
  };

  const handleLocationSelect = (businessId: string, location: any) => {
    setSelectedLocations((prev) => ({
      ...prev,
      [businessId]: location,
    }));
  };

  const handleDeliveryTypeSelect = (
    businessId: string,
    deliveryType: string,
  ) => {
    setSelectedDeliveryTypes((prev) => ({
      ...prev,
      [businessId]: deliveryType,
    }));

    // Clear location selection if switching to mobile
    if (deliveryType === "customer_location") {
      setSelectedLocations((prev) => ({
        ...prev,
        [businessId]: null,
      }));
    }

    // Clear address if switching to business
    if (deliveryType === "business_location") {
      setCustomerAddresses((prev) => ({
        ...prev,
        [businessId]: null,
      }));
    }
  };

  const handleAddressChange = (
    businessId: string,
    field: string,
    value: string,
  ) => {
    setCustomerAddresses((prev) => ({
      ...prev,
      [businessId]: {
        ...prev[businessId],
        [field]: value,
      },
    }));
  };

  const handleSavedLocationSelect = (businessId: string, locationId: string) => {
    if (locationId === "new") {
      // Clear address fields for new address entry
      setCustomerAddresses((prev) => ({
        ...prev,
        [businessId]: {
          address: "",
          city: "",
          state: "",
          zip: "",
        },
      }));
      return;
    }

    const selectedLocation = savedLocations.find((loc) => loc.id === locationId);
    if (selectedLocation) {
      setCustomerAddresses((prev) => ({
        ...prev,
        [businessId]: {
          address: selectedLocation.address_line1 || "",
          city: selectedLocation.city || "",
          state: selectedLocation.state || "",
          zip: selectedLocation.postal_code || "",
          selectedLocationId: locationId,
        },
      }));
    }
  };

  const openInGoogleMaps = (location: any) => {
    const address = [
      location.address_line1,
      location.address_line2,
      location.city,
      location.state,
      location.postal_code,
      location.country,
    ]
      .filter(Boolean)
      .join(", ");

    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    window.open(url, "_blank");
  };

  const handleSelectBusiness = (business: any) => {
    console.log("Selecting business:", business.name);
    console.log("Business object:", business);
    console.log("Business ID:", business.id);
    console.log("Service ID:", serviceId);
    console.log("Selected date:", selectedDate);
    console.log("Selected time:", selectedTime);

    // Ensure we have a valid business ID
    if (!business.id) {
      console.error("No business ID found in business object");
      toast({
        title: "Error",
        description: "Unable to select business - missing ID",
        variant: "destructive",
      });
      return;
    }

    // Check delivery type selection for both_locations services
    const selectedDeliveryType = selectedDeliveryTypes[business.id];
    const selectedLocation = selectedLocations[business.id];
    const customerAddress = customerAddresses[business.id];

    if (business.deliveryType === "both_locations" && !selectedDeliveryType) {
      toast({
        title: "Delivery Type Required",
        description: "Please choose between Business or Mobile delivery",
        variant: "destructive",
      });
      return;
    }

    // Check location selection for business delivery
    if (
      selectedDeliveryType === "business_location" &&
      business.locations &&
      business.locations.length > 1 &&
      !selectedLocation
    ) {
      toast({
        title: "Location Required",
        description: "Please select a business location",
        variant: "destructive",
      });
      return;
    }

    // Check address for mobile delivery
    if (
      selectedDeliveryType === "customer_location" &&
      (!customerAddress || !customerAddress.address || !customerAddress.city)
    ) {
      toast({
        title: "Address Required",
        description: "Please provide your delivery address",
        variant: "destructive",
      });
      return;
    }

    // Navigate to business profile with services tab active and service pre-selected
    let targetUrl = `/business/${business.id}?tab=services&service=${serviceId}&date=${selectedDate}&time=${selectedTime}`;

    // Add delivery type information
    if (selectedDeliveryType) {
      targetUrl += `&deliveryType=${selectedDeliveryType}`;
    }

    if (selectedDeliveryType === "business_location" && selectedLocation) {
      targetUrl += `&location=${selectedLocation.id}`;
    }

    if (selectedDeliveryType === "customer_location" && customerAddress) {
      const addressData = encodeURIComponent(JSON.stringify(customerAddress));
      targetUrl += `&address=${addressData}`;
    }

    console.log("Navigating to:", targetUrl);
    navigate(targetUrl);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getDeliveryBadge = (type: string) => {
    const config = {
      mobile: { label: "Mobile Service", color: "bg-green-100 text-green-800" },
      business_location: {
        label: "Business",
        color: "bg-blue-100 text-blue-800",
      },
      virtual: { label: "Virtual", color: "bg-purple-100 text-purple-800" },
    };
    return (
      config[type as keyof typeof config] || {
        label: type,
        color: "bg-gray-100 text-gray-800",
      }
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-roam-light-blue/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-roam-blue mx-auto mb-4"></div>
          <p className="text-foreground/60">Finding available businesses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-roam-light-blue/10">
      {/* Navigation */}
      <nav className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-foreground hover:text-roam-blue"
              >
                <Link to={`/book-service/${serviceId}`}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Date Selection
                </Link>
              </Button>
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2Fa42b6f9ec53e4654a92af75aad56d14f%2F38446bf6c22b453fa45caf63b0513e21?format=webp&width=800"
                alt="ROAM - Your Best Life. Everywhere."
                className="h-8 w-auto"
              />
            </div>
          </div>
        </div>
      </nav>

      {/* Progress Indicator */}
      <div className="bg-background/50 border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  ✓
                </div>
                <span className="ml-2 text-sm font-medium text-green-600">
                  Date & Time Selected
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-foreground/40" />
              <div className="flex items-center">
                <div className="w-8 h-8 bg-roam-blue text-white rounded-full flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <span className="ml-2 text-sm font-medium text-roam-blue">
                  Choose Business
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-foreground/40" />
              <div className="flex items-center">
                <div className="w-8 h-8 bg-foreground/20 text-foreground/60 rounded-full flex items-center justify-center text-sm">
                  3
                </div>
                <span className="ml-2 text-sm text-foreground/60">
                  Book Service
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4">Available Businesses</h1>
            <div className="flex items-center gap-6 text-sm text-foreground/70">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                <span>{selectedDate ? formatDate(selectedDate) : ""}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{selectedTime}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{service?.name}</span>
              </div>
            </div>
          </div>

          {/* Businesses List */}
          {availableBusinesses.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {availableBusinesses.map((business) => (
                <Card
                  key={business.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-6">
                      {/* Business Logo */}
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={business.logo || undefined} />
                        <AvatarFallback className="text-lg">
                          <Building className="w-8 h-8" />
                        </AvatarFallback>
                      </Avatar>

                      {/* Business Information */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-xl font-semibold">
                                {business.name}
                              </h3>
                              {business.is_featured && (
                                <Badge className="bg-roam-yellow text-gray-900 text-xs">
                                  <Star className="w-3 h-3 mr-1" />
                                  Featured
                                </Badge>
                              )}
                            </div>
                            <p className="text-foreground/70 mb-2">
                              {business.description}
                            </p>
                            {/* Delivery Type Selection for both_locations */}
                            {business.deliveryType === "both_locations" && (
                              <div className="mb-4">
                                <label className="text-sm font-medium text-foreground/70 mb-2 block">
                                  Choose Delivery Option:
                                </label>
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                  <div
                                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                                      selectedDeliveryTypes[business.id] ===
                                      "business_location"
                                        ? "border-roam-blue bg-roam-blue/5"
                                        : "border-gray-200 hover:border-gray-300"
                                    }`}
                                    onClick={() =>
                                      handleDeliveryTypeSelect(
                                        business.id,
                                        "business_location",
                                      )
                                    }
                                  >
                                    <div className="flex items-center gap-2">
                                      <Building className="w-5 h-5 text-roam-blue" />
                                      <div>
                                        <div className="font-medium">
                                          Business
                                        </div>
                                        <div className="text-xs text-foreground/60">
                                          Visit our location
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div
                                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                                      selectedDeliveryTypes[business.id] ===
                                      "customer_location"
                                        ? "border-roam-blue bg-roam-blue/5"
                                        : "border-gray-200 hover:border-gray-300"
                                    }`}
                                    onClick={() =>
                                      handleDeliveryTypeSelect(
                                        business.id,
                                        "customer_location",
                                      )
                                    }
                                  >
                                    <div className="flex items-center gap-2">
                                      <Car className="w-5 h-5 text-green-600" />
                                      <div>
                                        <div className="font-medium">
                                          Mobile
                                        </div>
                                        <div className="text-xs text-foreground/60">
                                          We come to you
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Business Locations - only show for business delivery or single location businesses */}
                            {((business.deliveryType === "both_locations" &&
                              selectedDeliveryTypes[business.id] ===
                                "business_location") ||
                              business.deliveryType ===
                                "business_location") && (
                              <div className="mb-3">
                                {business.locations &&
                                business.locations.length > 0 ? (
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground/70">
                                      Select Location:
                                    </label>
                                    {business.locations.map((location: any) => (
                                      <div
                                        key={location.id}
                                        className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                                          selectedLocations[business.id]?.id ===
                                          location.id
                                            ? "border-roam-blue bg-roam-blue/5"
                                            : "border-gray-200 hover:border-gray-300"
                                        }`}
                                        onClick={() =>
                                          handleLocationSelect(
                                            business.id,
                                            location,
                                          )
                                        }
                                      >
                                        <div className="flex items-start justify-between">
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                              <MapPin className="w-4 h-4 text-roam-blue" />
                                              <span className="font-medium">
                                                {location.location_name ||
                                                  "Main Location"}
                                              </span>
                                              {location.is_primary && (
                                                <Badge
                                                  variant="secondary"
                                                  className="text-xs"
                                                >
                                                  Primary
                                                </Badge>
                                              )}
                                            </div>
                                            <p className="text-sm text-foreground/60">
                                              {[
                                                location.address_line1,
                                                location.city,
                                                location.state,
                                              ]
                                                .filter(Boolean)
                                                .join(", ")}
                                            </p>
                                          </div>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openInGoogleMaps(location);
                                            }}
                                            className="ml-2"
                                          >
                                            <Map className="w-4 h-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 text-sm text-foreground/60">
                                    <MapPin className="w-4 h-4" />
                                    <span>Location details not available</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Customer Address Form - only show for mobile delivery */}
                            {business.deliveryType === "both_locations" &&
                              selectedDeliveryTypes[business.id] ===
                                "customer_location" && (
                                <div className="mb-3">
                                  <label className="text-sm font-medium text-foreground/70 mb-2 block">
                                    Delivery Address:
                                  </label>
                                  <div className="space-y-3 p-3 border rounded-lg bg-gray-50">
                                    <div>
                                      <Label
                                        htmlFor={`address-${business.id}`}
                                        className="text-xs"
                                      >
                                        Street Address *
                                      </Label>
                                      <Input
                                        id={`address-${business.id}`}
                                        placeholder="123 Main Street"
                                        value={
                                          customerAddresses[business.id]
                                            ?.address || ""
                                        }
                                        onChange={(e) =>
                                          handleAddressChange(
                                            business.id,
                                            "address",
                                            e.target.value,
                                          )
                                        }
                                        className="mt-1"
                                      />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <Label
                                          htmlFor={`city-${business.id}`}
                                          className="text-xs"
                                        >
                                          City *
                                        </Label>
                                        <Input
                                          id={`city-${business.id}`}
                                          placeholder="Miami"
                                          value={
                                            customerAddresses[business.id]
                                              ?.city || ""
                                          }
                                          onChange={(e) =>
                                            handleAddressChange(
                                              business.id,
                                              "city",
                                              e.target.value,
                                            )
                                          }
                                          className="mt-1"
                                        />
                                      </div>
                                      <div>
                                        <Label
                                          htmlFor={`state-${business.id}`}
                                          className="text-xs"
                                        >
                                          State
                                        </Label>
                                        <Input
                                          id={`state-${business.id}`}
                                          placeholder="FL"
                                          value={
                                            customerAddresses[business.id]
                                              ?.state || ""
                                          }
                                          onChange={(e) =>
                                            handleAddressChange(
                                              business.id,
                                              "state",
                                              e.target.value,
                                            )
                                          }
                                          className="mt-1"
                                        />
                                      </div>
                                    </div>
                                    <div>
                                      <Label
                                        htmlFor={`zip-${business.id}`}
                                        className="text-xs"
                                      >
                                        Zip Code
                                      </Label>
                                      <Input
                                        id={`zip-${business.id}`}
                                        placeholder="33101"
                                        value={
                                          customerAddresses[business.id]?.zip ||
                                          ""
                                        }
                                        onChange={(e) =>
                                          handleAddressChange(
                                            business.id,
                                            "zip",
                                            e.target.value,
                                          )
                                        }
                                        className="mt-1"
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}

                            <div className="flex items-center gap-4 text-sm text-foreground/60">
                              {business.verification_status === "approved" && (
                                <div className="flex items-center gap-1 text-green-600">
                                  <Shield className="w-4 h-4" />
                                  <span>Verified</span>
                                </div>
                              )}
                              {business.years_in_business && (
                                <span>
                                  {business.years_in_business} years in business
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="flex items-center gap-1 mb-2">
                              <Star className="w-4 h-4 text-roam-warning fill-current" />
                              <span className="font-semibold">
                                {business.rating}
                              </span>
                              <span className="text-sm text-foreground/60">
                                ({business.reviewCount})
                              </span>
                            </div>
                            <div className="text-lg font-bold text-roam-blue">
                              ${business.servicePrice}
                            </div>
                          </div>
                        </div>

                        {/* Service Details */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge
                              variant="secondary"
                              className={
                                getDeliveryBadge(business.deliveryType).color
                              }
                            >
                              {getDeliveryBadge(business.deliveryType).label}
                            </Badge>
                            <span className="text-sm text-foreground/60">
                              Open: {business.openTime} - {business.closeTime}
                            </span>
                          </div>

                          <Button
                            onClick={() => handleSelectBusiness(business)}
                            className="bg-roam-blue hover:bg-roam-blue/90"
                          >
                            Select This Business
                            <ChevronRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                No Available Businesses
              </h3>
              <p className="text-foreground/60 mb-4">
                No businesses are available for the selected date and time.
                Please try a different time slot.
              </p>
              <Button
                asChild
                variant="outline"
                className="border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white"
              >
                <Link to={`/book-service/${serviceId}`}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Change Date/Time
                </Link>
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
