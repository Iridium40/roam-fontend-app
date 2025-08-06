import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import ShareModal from "@/components/ShareModal";
import { FavoriteButton } from "@/components/FavoriteButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Clock,
  Shield,
  Star,
  Search,
  Calendar,
  Heart,
  Scissors,
  Dumbbell,
  Home,
  Stethoscope,
  Hand,
  Filter,
  Users,
  BookOpen,
  ChevronRight,
  Smartphone,
  Building,
  Video,
  QrCode,
  Share2,
  ChevronLeft,
  TrendingUp,
  Tag,
  Percent,
  X,
  Car,
  Menu,
} from "lucide-react";
import { Link } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { CustomerAuthModal } from "@/components/CustomerAuthModal";
import { CustomerAvatarDropdown } from "@/components/CustomerAvatarDropdown";
import { supabase } from "@/lib/supabase";

export default function Index() {
  const { customer, isCustomer, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDelivery, setSelectedDelivery] = useState("all");
  const [currentServiceSlide, setCurrentServiceSlide] = useState(0);
  const [currentPopularSlide, setCurrentPopularSlide] = useState(0);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"signin" | "signup">(
    "signin",
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(
    new Set(),
  );

  // Database-driven state
  const [featuredServices, setFeaturedServices] = useState<any[]>([]);
  const [popularServices, setPopularServices] = useState<any[]>([]);
  const [featuredBusinesses, setFeaturedBusinesses] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const handleBusinessShare = (business: any) => {
    setSelectedProvider(business);
    setShareModalOpen(true);
  };

  const handleSignIn = () => {
    setAuthModalTab("signin");
    setAuthModalOpen(true);
  };

  const handleSignUp = () => {
    setAuthModalTab("signup");
    setAuthModalOpen(true);
  };

  const handleMyBookings = () => {
    if (isCustomer) {
      // Navigate to my bookings
      window.location.href = "/my-bookings";
    } else {
      // Show sign in modal
      handleSignIn();
    }
  };

  const toggleDescription = (serviceId: string) => {
    setExpandedDescriptions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(serviceId)) {
        newSet.delete(serviceId);
      } else {
        newSet.add(serviceId);
      }
      return newSet;
    });
  };

  const getDisplayDescription = (description: string, serviceId: string) => {
    const isExpanded = expandedDescriptions.has(serviceId);
    if (description.length <= 200 || isExpanded) {
      return description;
    }
    return description.substring(0, 200) + "...";
  };

  const formatSavings = (promotion: any) => {
    if (!promotion.savingsType || !promotion.savingsAmount) return null;

    if (promotion.savingsType === "percentage") {
      const maxAmount = promotion.savingsMaxAmount
        ? ` (max $${promotion.savingsMaxAmount})`
        : "";
      return `${promotion.savingsAmount}% OFF${maxAmount}`;
    } else if (promotion.savingsType === "fixed_amount") {
      return `$${promotion.savingsAmount} OFF`;
    }

    return null;
  };

  // Fetch real data from Supabase
  useEffect(() => {
    const fetchData = async (retryCount = 0) => {
      try {
        setLoading(true);

        // Fetch featured services using is_featured flag
        const featuredServicesResponse = await supabase
          .from("services")
          .select(
            `
            id,
            name,
            description,
            min_price,
            duration_minutes,
            image_url,
            is_active,
            is_featured,
            service_subcategories!inner (
              id,
              service_subcategory_type,
              description,
              service_categories!inner (
                id,
                service_category_type
              )
            )
          `,
          )
          .eq("is_active", true)
          .eq("is_featured", true)
          .limit(6);

        const { data: featuredServicesData, error: featuredError } =
          featuredServicesResponse;

        console.log("Featured services query result:", {
          featuredServicesData,
          featuredError,
        });

        if (!featuredError && featuredServicesData) {
          const transformedFeatured = featuredServicesData.map(
            (service: any) => ({
              id: service.id,
              title: service.name,
              category:
                service.service_subcategories?.service_categories
                  ?.service_category_type || "General",
              image:
                service.image_url ||
                "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=500&h=300&fit=crop",
              description:
                service.description || "Professional featured service",
              price: `$${service.min_price || 50}`,
              rating: 4.8, // Default rating
              duration: `${service.duration_minutes || 60} min`,
            }),
          );
          console.log("Transformed featured services:", transformedFeatured);
          setFeaturedServices(transformedFeatured);
        }

        // Fetch popular services using is_popular flag
        const popularServicesResponse = await supabase
          .from("services")
          .select(
            `
            id,
            name,
            description,
            min_price,
            duration_minutes,
            image_url,
            is_active,
            is_popular,
            service_subcategories!inner (
              id,
              service_subcategory_type,
              description,
              service_categories!inner (
                id,
                service_category_type
              )
            )
          `,
          )
          .eq("is_active", true)
          .eq("is_popular", true)
          .limit(6);

        const { data: popularServicesData, error: popularError } =
          popularServicesResponse;

        console.log("Popular services query result:", {
          popularServicesData,
          popularError,
        });

        if (!popularError && popularServicesData) {
          const transformedPopular = popularServicesData.map(
            (service: any) => ({
              id: service.id,
              title: service.name,
              category:
                service.service_subcategories?.service_categories
                  ?.service_category_type || "General",
              image:
                service.image_url ||
                "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&h=300&fit=crop",
              description:
                service.description || "Popular professional service",
              price: `$${service.min_price || 50}`,
              rating: 4.9, // Default rating
              duration: `${service.duration_minutes || 60} min`,
              bookings: "Popular choice", // Placeholder for booking count
              availability: "Available Today", // Placeholder
            }),
          );
          console.log("Transformed popular services:", transformedPopular);
          setPopularServices(transformedPopular);
        }

        // Fetch featured businesses
        const businessesResponse = await supabase
          .from("business_profiles")
          .select(
            `
            id,
            business_name,
            business_type,
            logo_url,
            image_url,
            cover_image_url,
            verification_status,
            service_categories,
            is_active,
            is_featured,
            business_locations (
              location_name,
              city,
              state
            )
          `,
          )
          .eq("is_featured", true)
          .limit(12);

        const { data: businessesData, error: businessesError } =
          businessesResponse;

        // Check for authentication errors
        const authErrors = [
          featuredServicesResponse,
          popularServicesResponse,
          businessesResponse,
        ].filter((response) => response.status === 401);

        if (authErrors.length > 0 && retryCount === 0) {
          console.log("JWT token expired, refreshing session...");
          const { data: refreshData, error: refreshError } =
            await supabase.auth.refreshSession();

          if (refreshError) {
            console.error("Token refresh failed:", refreshError);
            // For the index page, we can continue without authentication
            console.log("Continuing without authentication for public content");
          } else if (refreshData?.session) {
            console.log("Session refreshed successfully, retrying...");
            return await fetchData(1);
          }
        }

        console.log("Featured businesses query result:", {
          businessesData,
          businessesError,
        });

        if (!businessesError && businessesData) {
          const transformedBusinesses = businessesData.map((business: any) => ({
            id: business.id,
            name: business.business_name,
            description: `Professional ${business.business_type.replace("_", " ")} services`,
            type: business.business_type,
            rating: 4.8, // Default rating
            reviews: Math.floor(Math.random() * 200) + 50, // Random review count
            deliveryTypes: ["mobile", "business_location", "virtual"],
            price: "Starting at $50",
            image:
              business.logo_url ||
              business.image_url ||
              "/api/placeholder/80/80",
            cover_image_url: business.cover_image_url,
            specialties: business.service_categories || [
              "Professional Service",
              "Quality Care",
              "Experienced",
            ],
            location: business.business_locations?.city
              ? `${business.business_locations.city}, ${business.business_locations.state}`
              : "Florida",
            verification_status: business.verification_status,
            is_featured: business.is_featured,
            years_in_business: 5, // Default years
          }));
          console.log(
            "Transformed featured businesses:",
            transformedBusinesses,
          );
          setFeaturedBusinesses(transformedBusinesses);
        }

        // Fetch active promotions with business and service information
        const promotionsResponse = await supabase
          .from("promotions")
          .select(
            `
            id,
            title,
            description,
            start_date,
            end_date,
            is_active,
            created_at,
            business_id,
            image_url,
            promo_code,
            savings_type,
            savings_amount,
            savings_max_amount,
            service_id,
            business_profiles (
              id,
              business_name,
              logo_url,
              business_type
            ),
            services (
              id,
              name,
              min_price
            )
          `,
          )
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(6);

        const { data: promotionsData, error: promotionsError } =
          promotionsResponse;

        if (!promotionsError && promotionsData) {
          const currentDate = new Date();
          currentDate.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison

          const transformedPromotions = promotionsData
            .filter((promotion: any) => {
              // Filter out promotions with expired end dates
              if (promotion.end_date) {
                const endDate = new Date(promotion.end_date);
                endDate.setHours(23, 59, 59, 999); // Set to end of day
                return endDate >= currentDate;
              }
              // Keep promotions without end dates (ongoing promotions)
              return true;
            })
            .map((promotion: any) => ({
              id: promotion.id,
              title: promotion.title,
              description: promotion.description || "Limited time offer",
              startDate: promotion.start_date,
              endDate: promotion.end_date,
              isActive: promotion.is_active,
              createdAt: promotion.created_at,
              businessId: promotion.business_id,
              imageUrl: promotion.image_url,
              promoCode: promotion.promo_code,
              savingsType: promotion.savings_type,
              savingsAmount: promotion.savings_amount,
              savingsMaxAmount: promotion.savings_max_amount,
              serviceId: promotion.service_id,
              business: promotion.business_profiles
                ? {
                    id: promotion.business_profiles.id,
                    name: promotion.business_profiles.business_name,
                    logo: promotion.business_profiles.logo_url,
                    type: promotion.business_profiles.business_type,
                  }
                : null,
              service: promotion.services
                ? {
                    id: promotion.services.id,
                    name: promotion.services.name,
                    minPrice: promotion.services.min_price,
                  }
                : null,
            }));
          console.log(
            "Transformed promotions (expired filtered):",
            transformedPromotions,
          );
          setPromotions(transformedPromotions);
        }
      } catch (error: any) {
        console.error("Error fetching data:", error);

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
              console.log("Session refreshed, retrying data fetch...");
              return await fetchData(1);
            }
          } catch (refreshError) {
            console.error("Token refresh failed:", refreshError);
          }

          // For index page, continue even if refresh fails since it has public content
          console.log("Continuing with public content after auth error");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const serviceCategories = [
    {
      id: "beauty",
      icon: Scissors,
      name: "Beauty & Wellness",
      count: "150+ providers",
      color: "from-pink-500 to-rose-500",
      description: "Hair, nails, skincare, and beauty treatments",
    },
    {
      id: "fitness",
      icon: Dumbbell,
      name: "Fitness",
      count: "80+ trainers",
      color: "from-orange-500 to-red-500",
      description: "Personal trainers, yoga, and fitness coaching",
    },
    {
      id: "therapy",
      icon: Hand,
      name: "Therapy",
      count: "120+ therapists",
      color: "from-green-500 to-emerald-500",
      description: "Therapeutic massage and bodywork",
    },
    {
      id: "healthcare",
      icon: Stethoscope,
      name: "Healthcare",
      count: "90+ specialists",
      color: "from-blue-500 to-cyan-500",
      description: "Medical services and health consultations",
    },
  ];

  // Use real promotions data from database
  const promotionalDeals = promotions;

  const deliveryIcons = {
    mobile: Car,
    business: Building,
    virtual: Video,
  };

  const getDeliveryBadge = (type: string) => {
    const config = {
      mobile: { label: "Mobile", color: "bg-green-100 text-green-800" },
      business: { label: "Business", color: "bg-blue-100 text-blue-800" },
      virtual: { label: "Virtual", color: "bg-purple-100 text-purple-800" },
    };
    return (
      config[type as keyof typeof config] || {
        label: type,
        color: "bg-gray-100 text-gray-800",
      }
    );
  };

  // Category mapping for filtering services - maps UI category IDs to database service_category_type enum values
  const categoryMapping = {
    beauty: ["beauty"],
    fitness: ["fitness"],
    therapy: ["therapy"],
    healthcare: ["healthcare"],
  };

  // Filter services based on selected category, search query, and delivery type
  const getFilteredServices = (services: any[]) => {
    return services.filter((service: any) => {
      // Category filter
      let categoryMatch = true;
      if (selectedCategory !== "all") {
        const categoryKeywords =
          categoryMapping[selectedCategory as keyof typeof categoryMapping] ||
          [];
        const serviceCategory = service.category?.toLowerCase() || "";
        const serviceTitle = service.title?.toLowerCase() || "";

        categoryMatch = categoryKeywords.some(
          (keyword) =>
            serviceCategory.includes(keyword.toLowerCase()) ||
            serviceTitle.includes(keyword.toLowerCase()),
        );
      }

      // Search query filter
      let searchMatch = true;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const serviceTitle = service.title?.toLowerCase() || "";
        const serviceCategory = service.category?.toLowerCase() || "";
        const serviceDescription = service.description?.toLowerCase() || "";

        searchMatch =
          serviceTitle.includes(query) ||
          serviceCategory.includes(query) ||
          serviceDescription.includes(query);
      }

      // Delivery type filter (services don't have delivery type data in current structure)
      // This would need to be added to service data structure to work properly
      let deliveryMatch = true;
      if (selectedDelivery !== "all") {
        // For now, we'll assume all services support all delivery types
        // In a real implementation, this would check service.deliveryTypes array
        deliveryMatch = true;
      }

      return categoryMatch && searchMatch && deliveryMatch;
    });
  };

  // Get filtered services
  const filteredFeaturedServices = getFilteredServices(featuredServices);
  const filteredPopularServices = getFilteredServices(popularServices);

  // Handle category selection
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setCurrentServiceSlide(0); // Reset carousel to first slide when category changes
  };

  // Reset carousel when filters change
  useEffect(() => {
    setCurrentServiceSlide(0);
  }, [selectedCategory, searchQuery, selectedDelivery]);

  const nextServiceSlide = () => {
    setCurrentServiceSlide((prev) => (prev + 1) % featuredServices.length);
  };

  const prevServiceSlide = () => {
    setCurrentServiceSlide(
      (prev) => (prev - 1 + featuredServices.length) % featuredServices.length,
    );
  };

  const nextPopularSlide = () => {
    setCurrentPopularSlide((prev) => (prev + 1) % popularServices.length);
  };

  const prevPopularSlide = () => {
    setCurrentPopularSlide(
      (prev) => (prev - 1 + popularServices.length) % popularServices.length,
    );
  };

  const filteredBusinesses = featuredBusinesses.filter((business) => {
    const matchesSearch =
      searchQuery === "" ||
      business.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      business.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      business.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      business.specialties.some((s) =>
        s.toLowerCase().includes(searchQuery.toLowerCase()),
      );

    const matchesCategory =
      selectedCategory === "all" ||
      business.type.toLowerCase().includes(selectedCategory) ||
      business.specialties.some((s) =>
        s.toLowerCase().includes(selectedCategory),
      );
    const matchesDelivery =
      selectedDelivery === "all" ||
      business.deliveryTypes.includes(selectedDelivery);

    return matchesSearch && matchesCategory && matchesDelivery;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-roam-light-blue/10">
      {/* Navigation */}
      <nav className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2Fa42b6f9ec53e4654a92af75aad56d14f%2F38446bf6c22b453fa45caf63b0513e21?format=webp&width=800"
                  alt="ROAM - Your Best Life. Everywhere."
                  className="h-8 w-auto hover:opacity-80 transition-opacity"
                />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              {isCustomer ? (
                <>
                  <CustomerAvatarDropdown />
                  <Button
                    asChild
                    variant="outline"
                    className="border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white"
                  >
                    <Link to="/provider-portal">
                      <Users className="w-4 h-4 mr-2" />
                      Provider Portal
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={handleMyBookings}
                    className="border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    My Bookings
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleSignIn}
                    className="text-foreground hover:text-roam-blue"
                  >
                    Sign In
                  </Button>
                  <Button
                    onClick={handleSignUp}
                    className="bg-roam-blue hover:bg-roam-blue/90"
                  >
                    Sign Up
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white"
                  >
                    <Link to="/provider-portal">
                      <Users className="w-4 h-4 mr-2" />
                      Provider Portal
                    </Link>
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-foreground hover:text-roam-blue"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-border">
              <div className="px-2 pt-2 pb-3 space-y-2 bg-background">
                {isCustomer ? (
                  <>
                    <div className="px-3 py-2">
                      <CustomerAvatarDropdown />
                    </div>
                    <Button
                      asChild
                      variant="outline"
                      className="w-full justify-start border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Link to="/provider-portal">
                        <Users className="w-4 h-4 mr-2" />
                        Provider Portal
                      </Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        handleMyBookings();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full justify-start border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      My Bookings
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        handleSignIn();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full justify-start text-foreground hover:text-roam-blue"
                    >
                      Sign In
                    </Button>
                    <Button
                      onClick={() => {
                        handleSignUp();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full justify-start bg-roam-blue hover:bg-roam-blue/90"
                    >
                      Sign Up
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="w-full justify-start border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Link to="/provider-portal">
                        <Users className="w-4 h-4 mr-2" />
                        Provider Portal
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section with Search */}
      <section className="py-12 lg:py-20 relative overflow-hidden">
        {/* Background Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source
            src="https://videos.pexels.com/video-files/11490725/11490725-sd_960_540_24fps.mp4"
            type="video/mp4"
          />
        </video>

        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <div className="mb-6">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2Fa42b6f9ec53e4654a92af75aad56d14f%2F98c77fcac42745ca81f9db3fb7f4e366?format=webp&width=800"
                alt="ROAM Logo"
                className="mx-auto h-24 sm:h-32 lg:h-40 w-auto drop-shadow-lg"
              />
            </div>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed drop-shadow-md">
              Florida's premier on-demand services marketplace. Connecting
              customers with verified professionals for premium services
              delivered anywhere.
            </p>
          </div>
        </div>
      </section>

      {/* Service Categories */}
      <section className="py-12 bg-background/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            Browse by <span className="text-roam-blue">Category</span>
          </h2>

          {/* Mobile Category Dropdown */}
          <div className="md:hidden mb-8">
            <Select
              value={selectedCategory}
              onValueChange={handleCategorySelect}
            >
              <SelectTrigger className="w-full h-12 bg-white border-2 border-roam-light-blue/30 focus:border-roam-blue">
                <div className="flex items-center gap-3">
                  {selectedCategory === "all" ? (
                    <Filter className="w-5 h-5 text-roam-blue" />
                  ) : (
                    serviceCategories.find((cat) => cat.id === selectedCategory)
                      ?.icon && (
                      <div className="w-5 h-5 flex items-center justify-center">
                        {React.createElement(
                          serviceCategories.find(
                            (cat) => cat.id === selectedCategory,
                          )!.icon,
                          { className: "w-5 h-5 text-roam-blue" },
                        )}
                      </div>
                    )
                  )}
                  <SelectValue placeholder="Select a category">
                    {selectedCategory === "all"
                      ? "All Categories"
                      : serviceCategories.find(
                          (cat) => cat.id === selectedCategory,
                        )?.name ||
                        (selectedCategory === "therapy"
                          ? "Therapy"
                          : selectedCategory === "fitness"
                            ? "Fitness"
                            : selectedCategory === "beauty"
                              ? "Beauty"
                              : selectedCategory)}
                  </SelectValue>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-3">
                    <Filter className="w-4 h-4 text-roam-blue" />
                    <span>All Categories</span>
                  </div>
                </SelectItem>
                {serviceCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-3">
                      <category.icon className="w-4 h-4 text-roam-blue" />
                      <span>
                        {category.id === "therapy"
                          ? "Therapy"
                          : category.id === "fitness"
                            ? "Fitness"
                            : category.id === "beauty"
                              ? "Beauty"
                              : category.name}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Desktop Category Cards */}
          <div className="hidden md:grid grid-cols-2 lg:grid-cols-5 gap-6">
            {/* All Categories Option */}
            <Card
              className={`group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer border-border/50 hover:border-roam-light-blue/50 ${
                selectedCategory === "all"
                  ? "ring-2 ring-roam-blue border-roam-blue bg-roam-light-blue/5"
                  : ""
              }`}
              onClick={() => handleCategorySelect("all")}
            >
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Filter className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2 group-hover:text-roam-blue transition-colors">
                  All Categories
                </h3>
                <p className="text-sm text-foreground/60 mb-3">
                  Browse all available services
                </p>
              </CardContent>
            </Card>

            {serviceCategories.map((category) => (
              <Card
                key={category.id}
                className={`group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer border-border/50 hover:border-roam-light-blue/50 ${
                  selectedCategory === category.id
                    ? "ring-2 ring-roam-blue border-roam-blue bg-roam-light-blue/5"
                    : ""
                }`}
                onClick={() => handleCategorySelect(category.id)}
              >
                <CardContent className="p-6 text-center">
                  <div
                    className={`w-16 h-16 bg-gradient-to-br ${category.color} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <category.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-roam-blue transition-colors">
                    {category.id === "therapy" ? (
                      <p>Therapy</p>
                    ) : category.id === "fitness" ? (
                      <p>Fitness</p>
                    ) : category.id === "beauty" ? (
                      <p>Beauty</p>
                    ) : (
                      category.name
                    )}
                  </h3>
                  <p className="text-sm text-foreground/60 mb-3">
                    {category.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Simple Search and Delivery Filter */}
          <div className="mt-8 max-w-2xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search Input */}
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="search"
                    placeholder="Search services..."
                    className="pl-10 h-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Delivery Type Filter */}
              <Select
                value={selectedDelivery}
                onValueChange={setSelectedDelivery}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Delivery Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Delivery Types</SelectItem>
                  <SelectItem value="mobile">
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4" />
                      Mobile
                    </div>
                  </SelectItem>
                  <SelectItem value="business">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      Business
                    </div>
                  </SelectItem>
                  <SelectItem value="virtual">
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4" />
                      Virtual
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Active Filters Display */}
            {(selectedCategory !== "all" ||
              selectedDelivery !== "all" ||
              searchQuery) && (
              <div className="flex flex-wrap items-center gap-2 mt-4">
                <span className="text-sm text-foreground/60">
                  Active filters:
                </span>
                {selectedCategory !== "all" && (
                  <Badge
                    variant="secondary"
                    className="bg-roam-blue/10 text-roam-blue cursor-pointer hover:bg-roam-blue/20"
                    onClick={() => handleCategorySelect("all")}
                  >
                    {serviceCategories.find(
                      (cat) => cat.id === selectedCategory,
                    )?.name || selectedCategory}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                )}
                {selectedDelivery !== "all" && (
                  <Badge
                    variant="secondary"
                    className="bg-roam-blue/10 text-roam-blue cursor-pointer hover:bg-roam-blue/20"
                    onClick={() => setSelectedDelivery("all")}
                  >
                    {selectedDelivery === "mobile"
                      ? "Mobile"
                      : selectedDelivery === "business"
                        ? "Business"
                        : selectedDelivery === "virtual"
                          ? "Virtual"
                          : selectedDelivery}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                )}
                {searchQuery && (
                  <Badge
                    variant="secondary"
                    className="bg-roam-blue/10 text-roam-blue cursor-pointer hover:bg-roam-blue/20"
                    onClick={() => setSearchQuery("")}
                  >
                    "{searchQuery}"
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-roam-blue hover:text-roam-blue/80"
                  onClick={() => {
                    setSelectedCategory("all");
                    setSelectedDelivery("all");
                    setSearchQuery("");
                  }}
                >
                  Clear all
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Featured Services Carousel */}
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">
              Featured <span className="text-roam-blue">Services</span>
            </h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={prevServiceSlide}
                className="border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={nextServiceSlide}
                className="border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {filteredFeaturedServices.length > 0 ? (
            <div className="relative overflow-hidden">
              <div
                className="flex transition-transform duration-300 ease-in-out"
                style={{
                  transform: `translateX(-${currentServiceSlide * 100}%)`,
                }}
              >
                {filteredFeaturedServices.map((service) => (
                  <div key={service.id} className="w-full flex-shrink-0">
                    <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer border-border/50 hover:border-roam-light-blue/50 mx-2">
                      <div className="relative">
                        <img
                          src={service.image}
                          alt={service.title}
                          className="w-full h-64 object-cover rounded-t-lg"
                        />
                        <div className="absolute top-4 left-4">
                          <Badge className="bg-roam-blue text-white">
                            {service.category}
                          </Badge>
                        </div>
                        <div className="absolute top-4 right-4 flex gap-2">
                          <FavoriteButton
                            type="service"
                            itemId={service.id}
                            size="sm"
                            variant="ghost"
                            className="bg-white/90 hover:bg-white"
                          />
                          <Badge
                            variant="secondary"
                            className="bg-white/90 text-gray-800"
                          >
                            <Star className="w-3 h-3 mr-1 text-roam-warning fill-current" />
                            {service.rating}
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-6">
                        <h3 className="text-xl font-semibold mb-2">
                          {service.title}
                        </h3>
                        <div className="mb-4">
                          <p className="text-foreground/70">
                            {getDisplayDescription(
                              service.description,
                              service.id,
                            )}
                          </p>
                          {service.description.length > 200 && (
                            <button
                              onClick={() => toggleDescription(service.id)}
                              className="md:hidden text-roam-blue text-sm font-medium hover:underline mt-1"
                            >
                              {expandedDescriptions.has(service.id)
                                ? "Show less"
                                : "Read more"}
                            </button>
                          )}
                        </div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-roam-blue">
                              {service.price}
                            </span>
                          </div>
                          <Badge
                            variant="outline"
                            className="border-roam-blue text-roam-blue"
                          >
                            {service.duration}
                          </Badge>
                        </div>
                        <Button
                          asChild
                          className="w-full bg-roam-blue hover:bg-roam-blue/90"
                        >
                          <Link to={`/book-service/${service.id}`}>
                            <Calendar className="w-4 h-4 mr-2" />
                            Book This Service
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                No Featured Services Found
              </h3>
              <p className="text-foreground/60 mb-4">
                No featured services match the selected category. Try selecting
                a different category.
              </p>
              <Button
                onClick={() => handleCategorySelect("all")}
                variant="outline"
                className="border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white"
              >
                View All Services
              </Button>
            </div>
          )}

          {/* Carousel indicators - only show when there are services */}
          {filteredFeaturedServices.length > 0 && (
            <div className="flex justify-center mt-6 gap-2">
              {filteredFeaturedServices.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentServiceSlide(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentServiceSlide
                      ? "bg-roam-blue"
                      : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Promotional Deals */}
      <section className="py-12 bg-background/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              <span className="text-roam-blue">Special</span>&nbsp;Promotions
            </h2>
            <p className="text-lg text-foreground/70">
              Limited-time offers on your favorite services
            </p>
          </div>

          {promotionalDeals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {promotionalDeals.map((promotion) => (
                <Card
                  key={promotion.id}
                  className="hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-border/50 hover:border-roam-light-blue/50"
                >
                  <div className="relative">
                    {promotion.imageUrl ? (
                      <div className="relative">
                        <img
                          src={promotion.imageUrl}
                          alt={promotion.title}
                          className="w-full h-48 object-cover rounded-t-lg"
                        />
                        <div className="absolute inset-0 bg-black/20 rounded-t-lg"></div>
                        <div className="absolute top-4 left-4">
                          <Badge className="bg-roam-yellow text-gray-900">
                            <Percent className="w-3 h-3 mr-1" />
                            {promotion.business
                              ? "Business Exclusive"
                              : "Special Offer"}
                          </Badge>
                        </div>
                        <div className="absolute top-4 right-4 flex flex-col gap-2">
                          {formatSavings(promotion) && (
                            <Badge className="bg-red-500 text-white font-bold">
                              {formatSavings(promotion)}
                            </Badge>
                          )}
                          {promotion.endDate && (
                            <Badge variant="destructive">
                              Ends{" "}
                              {new Date(promotion.endDate).toLocaleDateString()}
                            </Badge>
                          )}
                        </div>
                        {promotion.business && promotion.business.logo && (
                          <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                            <img
                              src={promotion.business.logo}
                              alt={promotion.business.name}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                            <span className="text-xs font-bold text-gray-900">
                              {promotion.business.name}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="relative bg-gradient-to-br from-roam-light-blue/10 to-roam-blue/20 p-8 text-center">
                        <div className="absolute top-4 left-4">
                          <Badge className="bg-roam-yellow text-gray-900">
                            <Percent className="w-3 h-3 mr-1" />
                            {promotion.business
                              ? "Business Exclusive"
                              : "Special Offer"}
                          </Badge>
                        </div>
                        <div className="absolute top-4 right-4 flex flex-col gap-2">
                          {formatSavings(promotion) && (
                            <Badge className="bg-red-500 text-white font-bold">
                              {formatSavings(promotion)}
                            </Badge>
                          )}
                          {promotion.endDate && (
                            <Badge variant="destructive">
                              Ends{" "}
                              {new Date(promotion.endDate).toLocaleDateString()}
                            </Badge>
                          )}
                        </div>
                        <div className="mt-4">
                          {promotion.business && promotion.business.logo ? (
                            <div className="flex flex-col items-center">
                              <img
                                src={promotion.business.logo}
                                alt={promotion.business.name}
                                className="w-12 h-12 rounded-full object-cover border-2 border-roam-blue mb-2"
                              />
                              <h3 className="text-sm font-bold text-roam-blue">
                                {promotion.business.name}
                              </h3>
                            </div>
                          ) : (
                            <div>
                              <Tag className="w-12 h-12 text-roam-blue mx-auto mb-4" />
                              <h3 className="text-xl font-bold text-roam-blue">
                                PROMO
                              </h3>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-2">
                      {promotion.title}
                    </h3>

                    {(promotion.business || promotion.service) && (
                      <div className="mb-3 p-2 bg-roam-light-blue/10 rounded-lg space-y-1">
                        {promotion.business && (
                          <p className="text-xs text-roam-blue font-medium flex items-center">
                            <Building className="w-3 h-3 mr-1" />
                            Exclusive to {promotion.business.name}
                          </p>
                        )}
                        {promotion.service && (
                          <p className="text-xs text-green-600 font-medium flex items-center">
                            <Tag className="w-3 h-3 mr-1" />
                            Service: {promotion.service.name}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="mb-4">
                      <p className="text-sm text-foreground/70">
                        {getDisplayDescription(
                          promotion.description,
                          promotion.id,
                        )}
                      </p>
                      {promotion.description &&
                        promotion.description.length > 200 && (
                          <button
                            onClick={() => toggleDescription(promotion.id)}
                            className="text-roam-blue text-xs font-medium hover:underline mt-1"
                          >
                            {expandedDescriptions.has(promotion.id)
                              ? "Show less"
                              : "Read more"}
                          </button>
                        )}
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-foreground/60">
                          Valid:
                        </span>
                        <span className="text-sm font-medium text-roam-blue">
                          {promotion.startDate && promotion.endDate
                            ? `${new Date(promotion.startDate).toLocaleDateString()} - ${new Date(promotion.endDate).toLocaleDateString()}`
                            : promotion.endDate
                              ? `Until ${new Date(promotion.endDate).toLocaleDateString()}`
                              : "Ongoing"}
                        </span>
                      </div>
                    </div>

                    <Button
                      asChild
                      className="w-full bg-roam-blue hover:bg-roam-blue/90"
                    >
                      <Link
                        to={(() => {
                          const baseParams = `promotion=${promotion.id}&promo_code=${promotion.promoCode}`;
                          const serviceParam = promotion.service
                            ? `&service_id=${promotion.service.id}`
                            : "";

                          if (promotion.business) {
                            return `/business/${promotion.business.id}?${baseParams}${serviceParam}`;
                          } else if (promotion.service) {
                            return `/book-service/${promotion.service.id}?${baseParams}`;
                          } else {
                            return `/services?${baseParams}`;
                          }
                        })()}
                      >
                        <Tag className="w-4 h-4 mr-2" />
                        {promotion.business && promotion.service
                          ? "Book Service Now"
                          : promotion.business
                            ? "Book with Business"
                            : promotion.service
                              ? "Book This Service"
                              : "Choose Business"}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Tag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground/60 mb-2">
                No Active Promotions
              </h3>
              <p className="text-foreground/50">
                Check back soon for exciting deals and offers!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Popular Services */}
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="flex justify-between items-center mb-4 md:justify-center">
              <div className="md:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevPopularSlide}
                  className="border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
              <div className="text-center">
                <h2 className="text-3xl font-bold">
                  Most <span className="text-roam-blue">Popular Services</span>
                </h2>
              </div>
              <div className="md:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextPopularSlide}
                  className="border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <p className="text-lg text-foreground/70">
              Trending services in your area this month
            </p>
          </div>

          {/* Mobile Carousel View */}
          <div className="md:hidden relative overflow-hidden">
            <div
              className="flex transition-transform duration-300 ease-in-out"
              style={{
                transform: `translateX(-${currentPopularSlide * 100}%)`,
              }}
            >
              {filteredPopularServices.map((service) => (
                <div key={service.id} className="w-full flex-shrink-0 px-2">
                  <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border/50 hover:border-roam-light-blue/50">
                    <div className="relative">
                      <img
                        src={service.image}
                        alt={service.title}
                        className="w-full h-40 object-cover rounded-t-lg"
                      />
                      <div className="absolute top-3 left-3">
                        <Badge
                          variant="secondary"
                          className="bg-white/90 text-gray-800"
                        >
                          <TrendingUp className="w-3 h-3 mr-1 text-roam-blue" />
                          Popular
                        </Badge>
                      </div>
                      <div className="absolute top-3 right-3 flex gap-2">
                        <FavoriteButton
                          type="service"
                          itemId={service.id}
                          size="sm"
                          variant="ghost"
                          className="bg-white/90 hover:bg-white"
                        />
                        <Badge
                          variant="secondary"
                          className="bg-white/90 text-gray-800"
                        >
                          <Star className="w-3 h-3 mr-1 text-roam-warning fill-current" />
                          {service.rating}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2">{service.title}</h3>
                      <div className="mb-3">
                        <p className="text-sm text-foreground/70">
                          {getDisplayDescription(
                            service.description,
                            service.id,
                          )}
                        </p>
                        {service.description &&
                          service.description.length > 200 && (
                            <button
                              onClick={() => toggleDescription(service.id)}
                              className="text-roam-blue text-xs font-medium hover:underline mt-1"
                            >
                              {expandedDescriptions.has(service.id)
                                ? "Show less"
                                : "Read more"}
                            </button>
                          )}
                      </div>
                      <p className="text-xs text-foreground/60 mb-3">
                        {service.category}
                      </p>

                      <div className="flex items-center justify-between mb-3">
                        <span className="text-lg font-bold text-roam-blue">
                          {service.price}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-xs border-roam-blue text-roam-blue"
                        >
                          {service.duration}
                        </Badge>
                      </div>

                      <div className="space-y-2 mb-4">
                        <p className="text-xs text-foreground/70 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-roam-blue" />
                          {service.bookings}
                        </p>
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {service.availability}
                        </p>
                      </div>

                      <Button
                        asChild
                        size="sm"
                        className="w-full bg-roam-blue hover:bg-roam-blue/90"
                      >
                        <Link to={`/book-service/${service.id}`}>
                          <Calendar className="w-3 h-3 mr-2" />
                          Book Now
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>

            {/* Dots Indicator */}
            <div className="flex justify-center mt-4 space-x-2">
              {filteredPopularServices.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPopularSlide(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    currentPopularSlide === index
                      ? "bg-roam-blue"
                      : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Desktop Grid View */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredPopularServices.map((service) => (
              <Card
                key={service.id}
                className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border/50 hover:border-roam-light-blue/50"
              >
                <div className="relative">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-40 object-cover rounded-t-lg"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge
                      variant="secondary"
                      className="bg-white/90 text-gray-800"
                    >
                      <TrendingUp className="w-3 h-3 mr-1 text-roam-blue" />
                      Popular
                    </Badge>
                  </div>
                  <div className="absolute top-3 right-3 flex gap-2">
                    <FavoriteButton
                      type="service"
                      itemId={service.id}
                      size="sm"
                      variant="ghost"
                      className="bg-white/90 hover:bg-white"
                    />
                    <Badge
                      variant="secondary"
                      className="bg-white/90 text-gray-800"
                    >
                      <Star className="w-3 h-3 mr-1 text-roam-warning fill-current" />
                      {service.rating}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">{service.title}</h3>
                  <div className="mb-3">
                    <p className="text-sm text-foreground/70">
                      {getDisplayDescription(service.description, service.id)}
                    </p>
                    {service.description &&
                      service.description.length > 200 && (
                        <button
                          onClick={() => toggleDescription(service.id)}
                          className="text-roam-blue text-xs font-medium hover:underline mt-1"
                        >
                          {expandedDescriptions.has(service.id)
                            ? "Show less"
                            : "Read more"}
                        </button>
                      )}
                  </div>
                  <p className="text-xs text-foreground/60 mb-3">
                    {service.category}
                  </p>

                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-roam-blue">
                      {service.price}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-xs border-roam-blue text-roam-blue"
                    >
                      {service.duration}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-4">
                    <p className="text-xs text-foreground/70 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-roam-blue" />
                      {service.bookings}
                    </p>
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {service.availability}
                    </p>
                  </div>

                  <Button
                    asChild
                    size="sm"
                    className="w-full bg-roam-blue hover:bg-roam-blue/90"
                  >
                    <Link to={`/book-service/${service.id}`}>
                      <Calendar className="w-3 h-3 mr-2" />
                      Book Now
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Businesses */}
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold">
                Featured <span className="text-roam-blue">Businesses</span>
              </h2>
              <Badge className="bg-roam-yellow text-gray-900">
                <Star className="w-4 h-4 mr-1" />
                Premium Partners
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredBusinesses.map((business) => (
              <Card
                key={business.id}
                className="group hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border-0 shadow-lg bg-white overflow-hidden"
              >
                <CardContent className="p-0">
                  {/* Header with Logo and Actions */}
                  <div
                    className="relative bg-gradient-to-br from-white via-roam-light-blue/5 to-roam-blue/10 p-6 border-b border-gray-100"
                    style={{
                      backgroundImage: business.cover_image_url ? `url(${business.cover_image_url})` : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat'
                    }}
                  >
                    {business.cover_image_url && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm"></div>
                    )}
                    <div className="relative flex items-start justify-between mb-4 z-10">
                      {/* Business Logo */}
                      <div className="w-20 h-20 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-200 ring-2 ring-white">
                        {business.image &&
                        business.image !== "/api/placeholder/80/80" ? (
                          <img
                            src={business.image}
                            alt={business.name}
                            className="w-full h-full object-cover rounded-xl"
                          />
                        ) : (
                          <Building className="w-10 h-10 text-roam-blue" />
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <FavoriteButton
                          type="business"
                          itemId={business.id}
                          size="sm"
                          variant="ghost"
                          className="w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-md border border-gray-200 text-gray-600 hover:text-red-500 hover:scale-110 transition-all"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-md border border-gray-200 text-gray-600 hover:text-roam-blue hover:scale-110 transition-all"
                          onClick={() => handleBusinessShare(business)}
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Business Name */}
                    <div className="mb-3">
                      <h3 className="font-bold text-2xl text-gray-900 group-hover:text-roam-blue transition-colors leading-tight">
                        {business.name}
                      </h3>
                    </div>

                    {/* Verification */}
                    <div>
                      {business.verification_status === "approved" && (
                        <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-full w-fit">
                          <Shield className="w-3 h-3 text-green-600" />
                          <span className="text-xs text-green-700 font-semibold">
                            Verified
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-6 space-y-5">
                    {/* Star Rating */}
                    <div className="flex items-center justify-center">
                      <div className="flex items-center gap-2 bg-gradient-to-r from-roam-warning/10 to-roam-warning/5 px-4 py-2 rounded-2xl border border-roam-warning/20">
                        <Star className="w-5 h-5 text-roam-warning fill-current" />
                        <span className="font-bold text-lg text-gray-900">
                          {business.rating}
                        </span>
                        <span className="text-sm text-gray-600 font-medium">
                          ({business.reviews} reviews)
                        </span>
                      </div>
                    </div>

                    {/* Delivery Types */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                        Delivery Options
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {business.deliveryTypes.map((type) => {
                          let badge, Icon;
                          // Map business_location to business for display
                          if (type === "business_location") {
                            badge = {
                              label: "Business",
                              color: "bg-blue-50 text-blue-700 border-blue-200",
                            };
                            Icon = Building;
                          } else {
                            badge = getDeliveryBadge(type);
                            Icon =
                              deliveryIcons[
                                type as keyof typeof deliveryIcons
                              ] || Building;
                          }

                          return (
                            <div
                              key={type}
                              className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${badge.color} font-medium text-xs`}
                            >
                              <Icon className="w-4 h-4" />
                              {badge.label}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Specialties */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                        Specialties
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {business.specialties
                          .slice(0, 4)
                          .map((specialty, index) => {
                            // Convert to camel case
                            const camelCaseSpecialty = specialty
                              .split(" ")
                              .map(
                                (word) =>
                                  word.charAt(0).toUpperCase() +
                                  word.slice(1).toLowerCase(),
                              )
                              .join(" ");

                            return (
                              <span
                                key={specialty}
                                className="px-3 py-1 text-xs font-semibold bg-gradient-to-r from-roam-blue/10 to-roam-light-blue/10 text-roam-blue rounded-full border border-roam-blue/20"
                              >
                                {camelCaseSpecialty}
                              </span>
                            );
                          })}
                        {business.specialties.length > 4 && (
                          <span className="px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-600 rounded-full border border-gray-200">
                            +{business.specialties.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3 pt-4">
                      <Button
                        asChild
                        className="w-full bg-gradient-to-r from-roam-blue to-roam-light-blue hover:from-roam-blue/90 hover:to-roam-light-blue/90 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                      >
                        <Link to={`/business/${business.id}?tab=services`}>
                          <Calendar className="w-5 h-5 mr-2" />
                          Book Services
                        </Link>
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        className="w-full border-2 border-roam-blue/20 text-roam-blue hover:bg-roam-blue hover:text-white font-semibold py-3 rounded-xl transition-all duration-300"
                      >
                        <Link to={`/business/${business.id}`}>
                          <BookOpen className="w-5 h-5 mr-2" />
                          View Business Profile
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredBusinesses.length === 0 && (
            <Card className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                No featured businesses found
              </h3>
              <p className="text-foreground/60 mb-4">
                No featured businesses match your search criteria. Try adjusting
                your search or browse all businesses.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                  setSelectedDelivery("all");
                }}
                className="border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white"
              >
                Clear Filters
              </Button>
            </Card>
          )}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-12 bg-gradient-to-r from-roam-blue to-roam-light-blue">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Book Your Service?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Discover verified businesses and book premium services with trusted
            professionals across Florida.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              className="bg-white text-roam-blue hover:bg-white/90 text-lg px-8 py-6"
              onClick={handleMyBookings}
            >
              <Calendar className="w-5 h-5 mr-2" />
              {isCustomer ? "View My Bookings" : "Sign In to Book"}
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white text-lg px-8 py-6"
            >
              <Link to="/provider-portal">
                <Building className="w-5 h-5 mr-2" />
                List Your Business
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Trust & Safety */}
      <section className="py-12 bg-background/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Your Safety is Our{" "}
              <span className="text-roam-blue">Priority</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  Background Verified
                </h3>
                <p className="text-foreground/70">
                  All providers undergo comprehensive background checks and
                  identity verification.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">5-Star Quality</h3>
                <p className="text-foreground/70">
                  Only the highest-rated professionals with proven track records
                  join our platform.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  Satisfaction Guaranteed
                </h3>
                <p className="text-foreground/70">
                  Your satisfaction is guaranteed or we'll make it right, every
                  time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Share Modal */}
      {selectedProvider && (
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          providerName={selectedProvider.name}
          providerTitle={selectedProvider.type || selectedProvider.description}
          pageUrl={`${window.location.origin}/business/${selectedProvider.id}`}
        />
      )}

      {/* Customer Authentication Modal */}
      <CustomerAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultTab={authModalTab}
      />
    </div>
  );
}
