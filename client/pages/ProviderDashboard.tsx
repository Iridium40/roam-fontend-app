import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import type { Provider, Booking, BusinessProfile } from "@/lib/database.types";

export default function ProviderDashboard() {
  const { user, signOut, isOwner, isDispatcher, isProvider } = useAuth();
  const [isAvailable, setIsAvailable] = useState(true);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // Fetch provider details
      const { data: providerData, error: providerError } = await supabase
        .from("providers")
        .select("*")
        .eq("id", user.provider_id)
        .single();

      if (providerError || !providerData) {
        setError("Provider account not found. Please contact support.");
        return;
      }

      setProvider(providerData);

      // Fetch business details
      const { data: businessData, error: businessError } = await supabase
        .from("business_profiles")
        .select("*")
        .eq("id", user.business_id)
        .single();

      if (businessData) {
        setBusiness(businessData);
      }

      // Fetch bookings based on role
      let bookingsQuery = supabase
        .from("bookings")
        .select(`
          *,
          providers!inner(first_name, last_name),
          services(name, description)
        `);

      if (isProvider && !isOwner && !isDispatcher) {
        // Provider can only see their own bookings
        bookingsQuery = bookingsQuery.eq("provider_id", user.provider_id);
      } else {
        // Owner/Dispatcher can see all business bookings
        bookingsQuery = bookingsQuery.in(
          "provider_id",
          supabase
            .from("providers")
            .select("id")
            .eq("business_id", user.business_id)
        );
      }

      const { data: bookingsData, error: bookingsError } = await bookingsQuery
        .order("created_at", { ascending: false })
        .limit(10);

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

  // Return null if no provider data
  if (!provider) {
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

  const services = [
    {
      id: 1,
      name: "Deep Tissue Massage",
      duration: "90 minutes",
      price: 120,
      category: "Massage Therapy",
      active: true,
      bookings: 23,
    },
    {
      id: 2,
      name: "Swedish Massage",
      duration: "60 minutes",
      price: 90,
      category: "Massage Therapy",
      active: true,
      bookings: 18,
    },
    {
      id: 3,
      name: "Sports Recovery Massage",
      duration: "75 minutes",
      price: 110,
      category: "Massage Therapy",
      active: false,
      bookings: 6,
    },
  ];

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
          <Tabs defaultValue="bookings" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
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
                {recentBookings.map((booking) => {
                  const statusConfig = getStatusBadge(booking.status);
                  const DeliveryIcon = getDeliveryIcon(booking.deliveryType);

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
                                {booking.service}
                              </h3>
                              <p className="text-sm text-foreground/60 mb-2">
                                with {booking.customer}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-foreground/60">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {new Date(booking.date).toLocaleDateString()}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {booking.time}
                                </div>
                                <div className="flex items-center gap-1">
                                  <DeliveryIcon className="w-4 h-4" />
                                  {booking.location}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className={statusConfig.color}>
                              {statusConfig.label}
                            </Badge>
                            <p className="text-lg font-semibold text-roam-blue mt-2">
                              ${booking.price}
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
                })}
              </div>
            </TabsContent>

            {/* Services Tab */}
            <TabsContent value="services" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Your Services</h2>
                <Button className="bg-roam-blue hover:bg-roam-blue/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Service
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {services.map((service) => (
                  <Card
                    key={service.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold">{service.name}</h3>
                          <p className="text-sm text-foreground/60">
                            {service.category}
                          </p>
                        </div>
                        <Switch
                          checked={service.active}
                          className="data-[state=checked]:bg-roam-blue"
                        />
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span>Duration:</span>
                          <span className="font-medium">
                            {service.duration}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Price:</span>
                          <span className="font-medium text-roam-blue">
                            ${service.price}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Bookings:</span>
                          <span className="font-medium">
                            {service.bookings} this month
                          </span>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Service
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Business Tab */}
            {isOwner && (
              <TabsContent value="business" className="space-y-6">
                <h2 className="text-2xl font-bold">Business Management</h2>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-6 text-center">
                      <Building className="w-12 h-12 text-roam-blue mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">Business Details</h3>
                      <p className="text-sm text-foreground/60 mb-4">
                        Manage business information, hours, and contact details
                      </p>
                      <Button
                        asChild
                        className="w-full bg-roam-blue hover:bg-roam-blue/90"
                      >
                        <Link to="/business-management">
                          <Edit className="w-4 h-4 mr-2" />
                          Manage
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-6 text-center">
                      <MapPin className="w-12 h-12 text-roam-blue mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">Locations</h3>
                      <p className="text-sm text-foreground/60 mb-4">
                        Add and manage business locations
                      </p>
                      <Button
                        asChild
                        className="w-full bg-roam-blue hover:bg-roam-blue/90"
                      >
                        <Link to="/business-management">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Location
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-6 text-center">
                      <Star className="w-12 h-12 text-roam-blue mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">Services & Pricing</h3>
                      <p className="text-sm text-foreground/60 mb-4">
                        Configure services and set business pricing
                      </p>
                      <Button
                        asChild
                        className="w-full bg-roam-blue hover:bg-roam-blue/90"
                      >
                        <Link to="/business-management">
                          <DollarSign className="w-4 h-4 mr-2" />
                          Set Prices
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-6 text-center">
                      <Users className="w-12 h-12 text-roam-blue mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">Team Members</h3>
                      <p className="text-sm text-foreground/60 mb-4">
                        Manage providers and assign locations
                      </p>
                      <Button
                        asChild
                        className="w-full bg-roam-blue hover:bg-roam-blue/90"
                      >
                        <Link to="/business-management">
                          <Users className="w-4 h-4 mr-2" />
                          Manage Team
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </div>

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
                            ROAM Wellness Services
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-foreground/60">
                            Verification Status
                          </span>
                          <Badge className="bg-green-100 text-green-800">
                            Verified
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-foreground/60">
                            Active Locations
                          </span>
                          <span className="font-medium">3</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-foreground/60">
                            Team Members
                          </span>
                          <span className="font-medium">5</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-foreground/60">
                            Services Offered
                          </span>
                          <span className="font-medium">12</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Business Hours</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[
                          { day: "Monday", hours: "9:00 AM - 7:00 PM" },
                          { day: "Tuesday", hours: "9:00 AM - 7:00 PM" },
                          { day: "Wednesday", hours: "9:00 AM - 7:00 PM" },
                          { day: "Thursday", hours: "9:00 AM - 7:00 PM" },
                          { day: "Friday", hours: "9:00 AM - 6:00 PM" },
                          { day: "Saturday", hours: "10:00 AM - 5:00 PM" },
                          { day: "Sunday", hours: "Closed" },
                        ].map((schedule) => (
                          <div
                            key={schedule.day}
                            className="flex justify-between items-center"
                          >
                            <span className="text-sm font-medium">
                              {schedule.day}
                            </span>
                            <span className="text-sm text-foreground/60">
                              {schedule.hours}
                            </span>
                          </div>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        className="w-full mt-4 border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white"
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        Edit Hours
                      </Button>
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
                      {[
                        {
                          action: "New location added",
                          details: "Downtown Miami location",
                          time: "2 hours ago",
                          icon: MapPin,
                        },
                        {
                          action: "Service pricing updated",
                          details: "Deep Tissue Massage - $120",
                          time: "1 day ago",
                          icon: DollarSign,
                        },
                        {
                          action: "Team member added",
                          details: "Jessica Park joined as Provider",
                          time: "3 days ago",
                          icon: Users,
                        },
                        {
                          action: "Business hours updated",
                          details: "Saturday hours extended",
                          time: "1 week ago",
                          icon: Clock,
                        },
                      ].map((activity, index) => (
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
                      ))}
                    </div>
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
                    <div className="w-32 h-32 bg-gradient-to-br from-roam-blue to-roam-light-blue rounded-full flex items-center justify-center mx-auto">
                      <Users className="w-16 h-16 text-white" />
                    </div>
                    <Button
                      variant="outline"
                      className="border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Change Photo
                    </Button>
                  </CardContent>
                </Card>

                {/* Contact Information */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input id="firstName" defaultValue="Sarah" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" defaultValue="Johnson" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        defaultValue="sarah.johnson@example.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        defaultValue="(305) 555-0123"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Professional Bio</Label>
                      <Textarea
                        id="bio"
                        defaultValue="Licensed massage therapist with 8+ years of experience specializing in deep tissue and therapeutic massage."
                        rows={4}
                      />
                    </div>

                    <Button className="bg-roam-blue hover:bg-roam-blue/90">
                      Save Changes
                    </Button>
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
    </div>
  );
}
