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

  useEffect(() => {
    if (serviceId && selectedDate && selectedTime) {
      fetchAvailableBusinesses();
    }
  }, [serviceId, selectedDate, selectedTime]);

  const fetchAvailableBusinesses = async () => {
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
        JSON.stringify({ serviceData, serviceError, serviceId }, null, 2),
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

      const { data: businessesData, error: businessesError } = await supabase
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
            verification_status,
            is_active,
            is_featured
          )
        `,
        )
        .eq("service_id", serviceId)
        .eq("is_active", true);

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

        // Use fallback business data for testing
        const fallbackBusinesses = [
          {
            business_id: "11111111-1111-1111-1111-111111111111", // Placeholder - replace with actual Smith Health & Wellness ID
            business_price: 85,
            delivery_type: "mobile",
            business_profiles: {
              id: "11111111-1111-1111-1111-111111111111", // Placeholder - replace with actual Smith Health & Wellness ID
              business_name: "Smith Health & Wellness",
              business_type: "small_business",
              logo_url:
                "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=200&h=200&fit=crop",
              image_url: null,
              verification_status: "approved",
              is_active: true,
              business_hours: {},
              contact_email: "info@smithhealthwellness.com",
              phone: "(555) 123-4567",
              website_url: null,
            },
          },
        ];

        console.log(
          "Using fallback business data due to error:",
          businessesError,
        );
        setAvailableBusinesses(
          fallbackBusinesses.map((item: any) => ({
            id: item.business_profiles.id,
            name: item.business_profiles.business_name,
            description:
              "Professional health and wellness services with experienced therapists",
            type: item.business_profiles.business_type,
            logo:
              item.business_profiles.logo_url ||
              item.business_profiles.image_url,
            verification_status: item.business_profiles.verification_status,
            years_in_business: null,
            location: "Orlando, FL",
            servicePrice: item.business_price,
            deliveryType: item.delivery_type || "mobile",
            rating: 4.8,
            reviewCount: 127,
            openTime: "9:00 AM",
            closeTime: "5:00 PM",
            email: item.business_profiles.contact_email,
            phone: item.business_profiles.phone,
            website: item.business_profiles.website_url,
          })),
        );

        setLoading(false);
        return; // Exit early with fallback data
      }

      // Filter businesses by active status and verification
      const filteredBusinesses = (businessesData || []).filter((item: any) => {
        // Only include active and approved businesses
        return (
          item.business_profiles &&
          item.business_profiles.is_active &&
          item.business_profiles.verification_status === "approved"
        );
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
        openTime: "9:00 AM", // Parse from business_hours JSON if needed
        closeTime: "5:00 PM",
        email: item.business_profiles.contact_email,
        phone: item.business_profiles.phone,
        website: item.business_profiles.website_url,
      }));

      // If no businesses found, use fallback data
      if (transformedBusinesses.length === 0) {
        console.log("No businesses found in database, using fallback data");
        const fallbackBusinesses = [
          {
            id: "c03666a3-6f9f-4cea-8645-419be0bbfbdb",
            name: "Smith Health & Wellness",
            description:
              "Professional health and wellness services with experienced therapists and practitioners.",
            type: "small_business",
            logo: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=200&h=200&fit=crop",
            verification_status: "approved",
            years_in_business: 5,
            location: "Orlando, FL",
            servicePrice: 85,
            deliveryType: "mobile",
            rating: 4.8,
            reviewCount: 127,
            openTime: "9:00 AM",
            closeTime: "5:00 PM",
          },
        ];
        setAvailableBusinesses(fallbackBusinesses);
      } else {
        setAvailableBusinesses(transformedBusinesses);
      }

      // Log the results for debugging
      console.log(
        "Businesses query result:",
        JSON.stringify(
          {
            businessesDataLength: businessesData?.length || 0,
            filteredBusinessesLength: filteredBusinesses?.length || 0,
            transformedBusinessesLength: transformedBusinesses?.length || 0,
            businessesData: businessesData,
          },
          null,
          2,
        ),
      );
    } catch (error: any) {
      console.error("Error fetching available businesses:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load available businesses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBusiness = (business: any) => {
    console.log('Selecting business:', business.name);
    console.log('Business object:', business);
    console.log('Business ID:', business.id);
    console.log('Service ID:', serviceId);
    console.log('Selected date:', selectedDate);
    console.log('Selected time:', selectedTime);

    // Ensure we have a valid business ID
    if (!business.id) {
      console.error('No business ID found in business object');
      toast({
        title: "Error",
        description: "Unable to select business - missing ID",
        variant: "destructive",
      });
      return;
    }

    // Navigate to business profile with services tab active and service pre-selected
    const targetUrl = `/business/${business.id}?tab=services&service=${serviceId}&date=${selectedDate}&time=${selectedTime}`;
    console.log('Navigating to:', targetUrl);

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
        label: "In-Studio",
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
                            <div className="flex items-center gap-4 text-sm text-foreground/60">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                <span>{business.location}</span>
                              </div>
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
