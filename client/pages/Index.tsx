import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import ShareModal from "@/components/ShareModal";
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
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
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
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"signin" | "signup">(
    "signin",
  );

  // Database-driven state
  const [featuredServices, setFeaturedServices] = useState<any[]>([]);
  const [popularServices, setPopularServices] = useState<any[]>([]);
  const [allProviders, setAllProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const handleProviderShare = (provider: any) => {
    setSelectedProvider(provider);
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

  // Fetch real data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch featured services using is_featured flag
        const { data: featuredServicesData, error: featuredError } = await supabase
          .from('services')
          .select(`
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
          `)
          .eq('is_active', true)
          .eq('is_featured', true)
          .limit(6);

        if (!featuredError && featuredServicesData) {
          const transformedFeatured = featuredServicesData.map((service: any) => ({
            id: service.id,
            title: service.name,
            category: service.service_subcategories?.service_categories?.service_category_type || 'General',
            image: service.image_url || 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=500&h=300&fit=crop',
            description: service.description || 'Professional featured service',
            price: `$${service.min_price || 50}`,
            rating: 4.8, // Default rating
            duration: `${service.duration_minutes || 60} min`,
          }));
          setFeaturedServices(transformedFeatured);
        }

        // Fetch popular services using is_popular flag
        const { data: popularServicesData, error: popularError } = await supabase
          .from('services')
          .select(`
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
          `)
          .eq('is_active', true)
          .eq('is_popular', true)
          .limit(6);

        if (!popularError && popularServicesData) {
          const transformedPopular = popularServicesData.map((service: any) => ({
            id: service.id,
            title: service.name,
            category: service.service_subcategories?.service_categories?.service_category_type || 'General',
            image: service.image_url || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&h=300&fit=crop',
            description: service.description || 'Popular professional service',
            price: `$${service.min_price || 50}`,
            rating: 4.9, // Default rating
            duration: `${service.duration_minutes || 60} min`,
            bookings: "Popular choice", // Placeholder for booking count
            availability: "Available Today", // Placeholder
          }));
          setPopularServices(transformedPopular);
        }

        // Fetch all providers
        const { data: providersData, error: providersError } = await supabase
          .from('providers')
          .select(`
            id,
            first_name,
            last_name,
            phone,
            profile_image_url,
            is_active,
            business_locations (
              location_name,
              city,
              state
            )
          `)
          .eq('is_active', true)
          .limit(12);

        if (!providersError && providersData) {
          const transformedProviders = providersData.map((provider: any) => ({
            id: provider.id,
            name: `${provider.first_name} ${provider.last_name}`,
            service: "Professional Service Provider",
            rating: 4.8, // Default rating
            reviews: Math.floor(Math.random() * 200) + 50, // Random review count
            deliveryTypes: ["mobile", "business"],
            price: "$50-150/hour",
            image: provider.profile_image_url || "/api/placeholder/80/80",
            specialties: ["Professional Service", "Quality Care", "Experienced"],
            location: provider.business_locations?.city ?
              `${provider.business_locations.city}, ${provider.business_locations.state}` :
              "Florida",
          }));
          setAllProviders(transformedProviders);
        }

      } catch (error) {
        console.error('Error fetching data:', error);
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
      name: "Personal Training",
      count: "80+ trainers",
      color: "from-orange-500 to-red-500",
      description: "Personal trainers, yoga, and fitness coaching",
    },
    {
      id: "therapy",
      icon: Hand,
      name: "Massage Therapy",
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







  const deliveryIcons = {
    mobile: Smartphone,
    business: Building,
    virtual: Video,
  };

  const getDeliveryBadge = (type: string) => {
    const config = {
      mobile: { label: "Mobile", color: "bg-green-100 text-green-800" },
      business: { label: "In-Studio", color: "bg-blue-100 text-blue-800" },
      virtual: { label: "Virtual", color: "bg-purple-100 text-purple-800" },
    };
    return (
      config[type as keyof typeof config] || {
        label: type,
        color: "bg-gray-100 text-gray-800",
      }
    );
  };

  const nextServiceSlide = () => {
    setCurrentServiceSlide((prev) => (prev + 1) % featuredServices.length);
  };

  const prevServiceSlide = () => {
    setCurrentServiceSlide(
      (prev) => (prev - 1 + featuredServices.length) % featuredServices.length,
    );
  };

  const filteredProviders = allProviders.filter((provider) => {
    const matchesSearch =
      searchQuery === "" ||
      provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.specialties.some((s) =>
        s.toLowerCase().includes(searchQuery.toLowerCase()),
      );

    const matchesCategory =
      selectedCategory === "all" ||
      provider.service.toLowerCase().includes(selectedCategory);
    const matchesDelivery =
      selectedDelivery === "all" ||
      provider.deliveryTypes.includes(selectedDelivery);

    return matchesSearch && matchesCategory && matchesDelivery;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-roam-light-blue/10">
      {/* Navigation */}
      <nav className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2Fa42b6f9ec53e4654a92af75aad56d14f%2F38446bf6c22b453fa45caf63b0513e21?format=webp&width=800"
                alt="ROAM - Your Best Life. Everywhere."
                className="h-8 w-auto"
              />
            </div>
            <div className="flex items-center space-x-4">
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
          </div>
        </div>
      </nav>

      {/* Hero Section with Search */}
      <section
        className="py-12 lg:py-20 relative bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.3)), url('https://images.pexels.com/photos/1835718/pexels-photo-1835718.jpeg')`,
        }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-white leading-tight drop-shadow-lg">
              Book Premium Services
              <br />
              <span className="text-roam-yellow">Anywhere in Florida</span>
            </h1>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed drop-shadow-md">
              Connect with verified professionals in Beauty, Fitness, Therapy,
              and Healthcare. Available mobile, in-studio, or virtual.
            </p>

            {/* Search and Filters */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <Input
                      type="search"
                      placeholder="Search services, providers, or specialties..."
                      className="pl-10 h-12 text-lg"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="beauty">Beauty & Wellness</SelectItem>
                    <SelectItem value="fitness">Personal Training</SelectItem>
                    <SelectItem value="massage">Massage Therapy</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={selectedDelivery}
                  onValueChange={setSelectedDelivery}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Delivery Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="mobile">
                      Mobile (Your Location)
                    </SelectItem>
                    <SelectItem value="business">In-Studio</SelectItem>
                    <SelectItem value="virtual">Virtual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Categories */}
      <section className="py-12 bg-background/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            Browse by <span className="text-roam-blue">Category</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {serviceCategories.map((category) => (
              <Card
                key={category.id}
                className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer border-border/50 hover:border-roam-light-blue/50"
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
                  <Badge
                    variant="secondary"
                    className="bg-roam-light-blue/20 text-roam-blue"
                  >
                    {category.count}
                  </Badge>
                </CardContent>
              </Card>
            ))}
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

          <div className="relative overflow-hidden">
            <div
              className="flex transition-transform duration-300 ease-in-out"
              style={{
                transform: `translateX(-${currentServiceSlide * 100}%)`,
              }}
            >
              {featuredServices.map((service) => (
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
                      <div className="absolute top-4 right-4">
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
                      <p className="text-foreground/70 mb-4">
                        {service.description}
                      </p>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-roam-blue">
                            {service.price}
                          </span>
                          <span className="text-sm text-foreground/60 line-through">
                            {service.originalPrice}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className="border-roam-blue text-roam-blue"
                        >
                          {service.duration}
                        </Badge>
                      </div>
                      <Button className="w-full bg-roam-blue hover:bg-roam-blue/90">
                        <Calendar className="w-4 h-4 mr-2" />
                        Book This Service
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>

          {/* Carousel indicators */}
          <div className="flex justify-center mt-6 gap-2">
            {featuredServices.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentServiceSlide(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentServiceSlide ? "bg-roam-blue" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Promotional Deals */}
      <section className="py-12 bg-background/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              <span className="text-roam-blue">Special Deals</span> & Promotions
            </h2>
            <p className="text-lg text-foreground/70">
              Limited-time offers on your favorite services
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {promotionalDeals.map((deal) => (
              <Card
                key={deal.id}
                className="hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-border/50 hover:border-roam-light-blue/50"
              >
                <div className="relative">
                  <img
                    src={deal.image}
                    alt={deal.title}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-roam-yellow text-gray-900">
                      <Percent className="w-3 h-3 mr-1" />
                      {deal.badge}
                    </Badge>
                  </div>
                  <div className="absolute top-4 right-4">
                    <Badge variant="destructive">{deal.discount}</Badge>
                  </div>
                </div>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-2">{deal.title}</h3>
                  <p className="text-sm text-foreground/70 mb-4">
                    {deal.description}
                  </p>

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-roam-blue">
                          {deal.discountPrice}
                        </span>
                        <span className="text-sm text-foreground/60 line-through">
                          {deal.originalPrice}
                        </span>
                      </div>
                      <p className="text-xs text-foreground/60">
                        Valid until {deal.validUntil}
                      </p>
                    </div>
                  </div>

                  <Button className="w-full bg-roam-blue hover:bg-roam-blue/90">
                    <Tag className="w-4 h-4 mr-2" />
                    Book Deal Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Services */}
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Most <span className="text-roam-blue">Popular Services</span>
            </h2>
            <p className="text-lg text-foreground/70">
              Trending services in your area this month
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularServices.map((service) => (
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
                  <div className="absolute top-3 right-3">
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
                    size="sm"
                    className="w-full bg-roam-blue hover:bg-roam-blue/90"
                  >
                    <Calendar className="w-3 h-3 mr-2" />
                    Book Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Providers */}
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">
              Featured <span className="text-roam-blue">Providers</span>
            </h2>
            <Badge
              variant="outline"
              className="border-roam-blue text-roam-blue"
            >
              {filteredProviders.length} providers available
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
            {filteredProviders.map((provider) => (
              <Card
                key={provider.id}
                className="hover:shadow-lg transition-shadow border-border/50 hover:border-roam-light-blue/50"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-roam-blue to-roam-light-blue rounded-full flex items-center justify-center flex-shrink-0">
                      <Users className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {provider.name}
                          </h3>
                          <p className="text-sm text-foreground/60">
                            {provider.service}
                          </p>
                          <p className="text-xs text-foreground/50">
                            {provider.location}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="flex items-center gap-1 mb-1">
                            <Star className="w-4 h-4 text-roam-warning fill-current" />
                            <span className="font-semibold">
                              {provider.rating}
                            </span>
                            <span className="text-sm text-foreground/60">
                              ({provider.reviews})
                            </span>
                          </div>
                          <div className="text-sm font-semibold text-roam-blue">
                            {provider.price}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-3">
                        {provider.deliveryTypes.map((type) => {
                          const badge = getDeliveryBadge(type);
                          return (
                            <Badge
                              key={type}
                              variant="secondary"
                              className={`text-xs ${badge.color}`}
                            >
                              {badge.label}
                            </Badge>
                          );
                        })}
                      </div>

                      <div className="flex flex-wrap gap-1 mb-4">
                        {provider.specialties.slice(0, 3).map((specialty) => (
                          <Badge
                            key={specialty}
                            variant="outline"
                            className="text-xs border-roam-light-blue text-roam-blue"
                          >
                            {specialty}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          asChild
                          size="sm"
                          className="flex-1 bg-roam-blue hover:bg-roam-blue/90"
                        >
                          <Link to={`/provider/${provider.id}?booking=true`}>
                            <Calendar className="w-4 h-4 mr-2" />
                            Book Now
                          </Link>
                        </Button>
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white"
                        >
                          <Link to={`/provider/${provider.id}`}>
                            <BookOpen className="w-4 h-4 mr-2" />
                            View Profile
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-gray-300 text-gray-600 hover:bg-gray-50"
                          onClick={() => handleProviderShare(provider)}
                        >
                          <QrCode className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredProviders.length === 0 && (
            <Card className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No providers found</h3>
              <p className="text-foreground/60 mb-4">
                Try adjusting your search criteria or browse all categories.
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
            Join thousands of satisfied customers who trust ROAM for their
            premium service needs.
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
              className="border-white text-white hover:bg-white hover:text-roam-blue text-lg px-8 py-6"
            >
              <Link to="/provider-portal">
                <Users className="w-5 h-5 mr-2" />
                Become a Provider
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
          providerTitle={selectedProvider.specialty}
          pageUrl={`${window.location.origin}/provider/${selectedProvider.id}`}
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
