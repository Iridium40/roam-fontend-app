import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Phone,
  MessageCircle,
  Star,
  MoreHorizontal,
  Video,
  Building,
  Smartphone,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

// Helper functions for delivery types
const getDeliveryIcon = (type: string) => {
  const icons = {
    mobile: Smartphone,
    business_location: Building,
    virtual: Video,
  };
  return icons[type as keyof typeof icons] || Smartphone;
};

const getDeliveryLabel = (type: string) => {
  const labels = {
    mobile: "Mobile Service",
    business_location: "In-Studio",
    virtual: "Virtual",
  };
  return labels[type as keyof typeof labels] || type;
};

export default function MyBookings() {
  const { user, customer, userType, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentUser = user || customer;
  // Fetch bookings data on component mount
  useEffect(() => {
    const fetchBookings = async (retryCount = 0) => {
      if (!currentUser) return;

      try {
        setLoading(true);
        setError(null);

        console.log("Fetching bookings for user:", currentUser.email);

        // Get bookings for this customer by guest email (simpler approach)
        const bookingsResponse = await supabase
          .from("bookings")
          .select(
            `
            *,
            services (
              id,
              name,
              min_price
            ),
            customer_profiles (
              id,
              first_name,
              last_name,
              email,
              image_url
            ),
            providers (
              id,
              first_name,
              last_name,
              location_id
            )
          `,
          )
          .eq("guest_email", currentUser.email)
          .order("booking_date", { ascending: false })
          .limit(50);

        // Check for authentication error
        if (bookingsResponse.status === 401 && retryCount === 0) {
          console.log("JWT token expired, refreshing session...");
          const { data: refreshData, error: refreshError } =
            await supabase.auth.refreshSession();

          if (refreshError) {
            console.error("Token refresh failed:", refreshError);
            setError("Your session has expired. Please refresh the page and sign in again.");
            return;
          }

          if (refreshData?.session) {
            console.log("Session refreshed successfully, retrying...");
            return await fetchBookings(1);
          }
        }

        const { data: bookingsData, error: bookingsError } = bookingsResponse;

        if (bookingsError) {
          console.error("Bookings query error:", bookingsError);
          throw new Error("Failed to fetch bookings from database");
        }

        console.log("Found bookings:", bookingsData?.length || 0);

        // Transform the database data to match the expected format
        const transformedBookings = (bookingsData || []).map((booking: any) => {
          const provider = booking.providers;
          const service = booking.services;
          const customer = booking.customer_profiles;

          // Determine location string based on delivery type
          let location = "Location TBD";
          if (booking.delivery_type === "business_location") {
            location = "Provider Location";
          } else if (
            booking.delivery_type === "customer_location" ||
            booking.delivery_type === "mobile"
          ) {
            location = "Your Location";
          } else if (booking.delivery_type === "virtual") {
            location = "Video Call";
          }

          return {
            id: booking.id,
            status: booking.booking_status || "pending",
            service: service?.name || "Unknown Service",
            provider: {
              name: provider
                ? `${provider.first_name} ${provider.last_name}`
                : "Unknown Provider",
              rating: 4.9, // Default rating - would need to implement rating system
              phone: null, // Don't expose provider phone to customer
              image: "/api/placeholder/60/60",
            },
            date: booking.booking_date,
            time: booking.start_time
              ? new Date(`1970-01-01T${booking.start_time}`).toLocaleTimeString(
                  [],
                  { hour: "numeric", minute: "2-digit" },
                )
              : "Time TBD",
            duration: "60 minutes", // Default duration
            deliveryType: booking.delivery_type || "business_location",
            location: location,
            price: `$${booking.total_amount || 0}`,
            notes: booking.admin_notes || "",
            bookingDate: booking.created_at,
            guestName: booking.guest_name,
            guestEmail: booking.guest_email,
            paymentStatus: booking.payment_status,
          };
        });

        setBookings(transformedBookings);

        if (transformedBookings.length === 0) {
          console.log("No bookings found for email:", currentUser.email);
        }
      } catch (err: any) {
        console.error("Error fetching bookings:", err);
        setError(err.message || "Failed to load bookings. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [currentUser]);

  const getStatusConfig = (status: string) => {
    const configs = {
      confirmed: {
        label: "Confirmed",
        color: "bg-green-100 text-green-800",
        icon: CheckCircle,
        description: "Your booking is confirmed",
      },
      pending: {
        label: "Pending",
        color: "bg-yellow-100 text-yellow-800",
        icon: Clock,
        description: "Waiting for provider confirmation",
      },
      in_progress: {
        label: "In Progress",
        color: "bg-blue-100 text-blue-800",
        icon: RefreshCw,
        description: "Service is currently active",
      },
      completed: {
        label: "Completed",
        color: "bg-gray-100 text-gray-800",
        icon: CheckCircle,
        description: "Service completed successfully",
      },
      cancelled: {
        label: "Cancelled",
        color: "bg-red-100 text-red-800",
        icon: XCircle,
        description: "Booking was cancelled",
      },
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  const upcomingBookings = bookings.filter(
    (b) => b.status === "confirmed" || b.status === "pending",
  );
  const pastBookings = bookings.filter(
    (b) => b.status === "completed" || b.status === "cancelled",
  );
  const activeBookings = bookings.filter((b) => b.status === "in_progress");

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Show loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-roam-light-blue/10 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-roam-blue mx-auto mb-4" />
          <p className="text-lg font-semibold">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-roam-light-blue/10 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Bookings</h2>
          <p className="text-foreground/70 mb-6">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-roam-blue hover:bg-roam-blue/90"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-roam-light-blue/10">
      {/* Navigation */}
      <nav className="border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button asChild variant="ghost" size="sm">
                <Link to="/">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Services
                </Link>
              </Button>
              <div className="w-24 h-24 rounded-lg overflow-hidden flex items-center justify-center">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2Fa42b6f9ec53e4654a92af75aad56d14f%2F38446bf6c22b453fa45caf63b0513e21?format=webp&width=800"
                  alt="ROAM Logo"
                  className="w-24 h-24 object-contain"
                />
              </div>
            </div>
            <Button asChild className="bg-roam-blue hover:bg-roam-blue/90">
              <Link to="/">
                <Calendar className="w-4 h-4 mr-2" />
                Book New Service
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="py-8 lg:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">
              My <span className="text-roam-blue">Bookings</span>
            </h1>
            <p className="text-lg text-foreground/70 mb-8">
              {userType === "customer"
                ? "Manage your service appointments and view your booking history."
                : "Manage your appointments and view your booking history."}
            </p>

            {/* Active Service Alert */}
            {activeBookings.length > 0 && (
              <Card className="mb-8 border-blue-200 bg-blue-50">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                      <RefreshCw className="w-6 h-6 text-white animate-spin" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-blue-900 mb-2">
                        Service in Progress
                      </h3>
                      <p className="text-blue-800 mb-3">
                        {activeBookings[0].service} with{" "}
                        {activeBookings[0].provider.name} is currently active.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-blue-500 text-blue-700 hover:bg-blue-500 hover:text-white"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Contact Provider
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Booking Tabs */}
            <Tabs defaultValue="upcoming" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger
                  value="upcoming"
                  className="data-[state=active]:bg-roam-blue data-[state=active]:text-white"
                >
                  Upcoming ({upcomingBookings.length})
                </TabsTrigger>
                <TabsTrigger
                  value="active"
                  className="data-[state=active]:bg-roam-blue data-[state=active]:text-white"
                >
                  Active ({activeBookings.length})
                </TabsTrigger>
                <TabsTrigger
                  value="past"
                  className="data-[state=active]:bg-roam-blue data-[state=active]:text-white"
                >
                  Past ({pastBookings.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming" className="space-y-4">
                {upcomingBookings.length === 0 ? (
                  <Card className="p-12 text-center">
                    <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No upcoming bookings
                    </h3>
                    <p className="text-foreground/60 mb-4">
                      Book your next service to see it here.
                    </p>
                    <Button
                      asChild
                      className="bg-roam-blue hover:bg-roam-blue/90"
                    >
                      <Link to="/">Browse Services</Link>
                    </Button>
                  </Card>
                ) : (
                  upcomingBookings.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))
                )}
              </TabsContent>

              <TabsContent value="active" className="space-y-4">
                {activeBookings.length === 0 ? (
                  <Card className="p-12 text-center">
                    <RefreshCw className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No active services
                    </h3>
                    <p className="text-foreground/60">
                      When a service is in progress, it will appear here.
                    </p>
                  </Card>
                ) : (
                  activeBookings.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))
                )}
              </TabsContent>

              <TabsContent value="past" className="space-y-4">
                {pastBookings.length === 0 ? (
                  <Card className="p-12 text-center">
                    <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No past bookings
                    </h3>
                    <p className="text-foreground/60">
                      Your completed services will appear here.
                    </p>
                  </Card>
                ) : (
                  pastBookings.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>
    </div>
  );
}

function BookingCard({ booking }: { booking: any }) {
  const statusConfig = {
    confirmed: {
      label: "Confirmed",
      color: "bg-green-100 text-green-800",
      icon: CheckCircle,
      description: "Your booking is confirmed",
    },
    pending: {
      label: "Pending",
      color: "bg-yellow-100 text-yellow-800",
      icon: Clock,
      description: "Waiting for provider confirmation",
    },
    in_progress: {
      label: "In Progress",
      color: "bg-blue-100 text-blue-800",
      icon: RefreshCw,
      description: "Service is currently active",
    },
    completed: {
      label: "Completed",
      color: "bg-gray-100 text-gray-800",
      icon: CheckCircle,
      description: "Service completed successfully",
    },
    cancelled: {
      label: "Cancelled",
      color: "bg-red-100 text-red-800",
      icon: XCircle,
      description: "Booking was cancelled",
    },
  }[booking.status];

  const DeliveryIcon = getDeliveryIcon(booking.deliveryType);
  const deliveryLabel = getDeliveryLabel(booking.deliveryType);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-roam-blue to-roam-light-blue rounded-full flex items-center justify-center">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">{booking.service}</h3>
              <p className="text-foreground/60 mb-2">
                with {booking.provider.name}
              </p>
              <div className="flex items-center gap-4 text-sm text-foreground/60">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(booking.date).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {booking.time} ({booking.duration})
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={statusConfig.color}>
              <statusConfig.icon className="w-3 h-3 mr-1" />
              {statusConfig.label}
            </Badge>
            {booking.status === "completed" &&
            new Date(booking.date) < new Date() ? (
              <Button
                size="sm"
                variant="outline"
                className="border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white"
                onClick={() => {
                  // Navigate to book the same service again
                  window.location.href = `/book-service/${booking.serviceId}`;
                }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Book Again
              </Button>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="flex items-start gap-2">
            <DeliveryIcon className="w-4 h-4 text-roam-blue mt-0.5" />
            <div>
              <p className="text-sm font-medium">{deliveryLabel}</p>
              <p className="text-sm text-foreground/60">{booking.location}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-roam-warning fill-current" />
            <span className="text-sm font-medium">
              {booking.provider.rating}
            </span>
            <span className="text-sm text-foreground/60">•</span>
            <span className="text-sm font-semibold text-roam-blue">
              {booking.price}
            </span>
          </div>
        </div>

        {booking.notes && (
          <div className="bg-accent/20 rounded-lg p-3 mb-4">
            <p className="text-sm text-foreground/80">
              <strong>Notes:</strong> {booking.notes}
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {booking.status === "confirmed" && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Message
              </Button>
            </>
          )}
          {booking.status === "completed" &&
            new Date(booking.date) >= new Date() && (
              <Button size="sm" className="bg-roam-blue hover:bg-roam-blue/90">
                <Star className="w-4 h-4 mr-2" />
                Leave Review
              </Button>
            )}
          {booking.status === "cancelled" && (
            <Button size="sm" className="bg-roam-blue hover:bg-roam-blue/90">
              <RefreshCw className="w-4 h-4 mr-2" />
              Book Again
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
