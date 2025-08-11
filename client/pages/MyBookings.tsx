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
  ChevronLeft,
  ChevronRight,
  X,
  Edit,
  Hash,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
    business_location: "Business",
    virtual: "Virtual",
  };
  return labels[type as keyof typeof labels] || type;
};

export default function MyBookings() {
  const { user, customer, userType, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState({
    upcoming: 1,
    active: 1,
    past: 1,
  });
  const ITEMS_PER_PAGE = 10;

  const currentUser = user || customer;
  // Fetch bookings data on component mount
  useEffect(() => {
    const fetchBookings = async (retryCount = 0) => {
      if (!currentUser) return;

      try {
        setLoading(true);
        setError(null);

        console.log("Fetching bookings for user:", currentUser.email);
        console.log("Current user object:", currentUser);
        console.log("Customer object:", customer);

        let bookingsResponse;

        // For authenticated users, query by customer_id, not guest_email
        if (customer && customer.id) {
          console.log("Authenticated user - querying by customer_id:", customer.id);

          bookingsResponse = await supabase
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
                location_id,
                image_url
              ),
              business_profiles (
                id,
                business_name
              )
            `,
            )
            .eq("customer_id", customer.id)
            .order("booking_date", { ascending: true })
            .limit(50);
        } else {
          console.log("No customer profile found - querying by guest_email:", currentUser.email);

          bookingsResponse = await supabase
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
                location_id,
                image_url
              ),
              business_profiles (
                id,
                business_name
              )
            `,
            )
            .eq("guest_email", currentUser.email)
            .order("booking_date", { ascending: true })
            .limit(50);
        }

        console.log("Bookings query response:", bookingsResponse);

        // Check for authentication error
        if (bookingsResponse.status === 401 && retryCount === 0) {
          console.log("JWT token expired, refreshing session...");
          const { data: refreshData, error: refreshError } =
            await supabase.auth.refreshSession();

          if (refreshError) {
            console.error("Token refresh failed:", refreshError);
            setError(
              "Your session has expired. Please refresh the page and sign in again.",
            );
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
        console.log("Bookings data detail:", bookingsData);

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
              image: provider?.image_url || null,
              firstName: provider?.first_name || "",
              lastName: provider?.last_name || "",
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
            bookingReference: booking.booking_reference || "",
          };
        });

        setBookings(transformedBookings);

        if (transformedBookings.length === 0) {
          console.log("No bookings found for email:", currentUser.email);
        }
      } catch (err: any) {
        console.error("Error fetching bookings:", err);

        // Check if this is a JWT expiration error and we haven't retried yet
        if (
          (err.message?.includes("JWT") ||
            err.message?.includes("401") ||
            err.status === 401) &&
          retryCount === 0
        ) {
          console.log("JWT error detected, attempting token refresh...");
          try {
            const { data: refreshData, error: refreshError } =
              await supabase.auth.refreshSession();

            if (!refreshError && refreshData?.session) {
              console.log("Session refreshed, retrying bookings fetch...");
              return await fetchBookings(1);
            }
          } catch (refreshError) {
            console.error("Token refresh failed:", refreshError);
          }

          setError(
            "Your session has expired. Please refresh the page and sign in again.",
          );
          return;
        }

        // Improved error message extraction
        let errorMessage = "Failed to load bookings. Please try again.";
        if (typeof err === "string") {
          errorMessage = err;
        } else if (err?.message) {
          errorMessage = err.message;
        } else if (err?.details) {
          errorMessage = err.details;
        } else if (err?.hint) {
          errorMessage = err.hint;
        }

        setError(errorMessage);
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

  // Filter bookings by status
  const allUpcomingBookings = bookings.filter(
    (b) => b.status === "confirmed" || b.status === "pending",
  );
  const allPastBookings = bookings
    .filter((b) => b.status === "completed" || b.status === "cancelled")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const allActiveBookings = bookings.filter((b) => b.status === "in_progress");

  // Pagination logic
  const getPaginatedBookings = (bookings: any[], page: number) => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return bookings.slice(startIndex, endIndex);
  };

  const getTotalPages = (totalItems: number) => {
    return Math.ceil(totalItems / ITEMS_PER_PAGE);
  };

  // Paginated booking arrays
  const upcomingBookings = getPaginatedBookings(allUpcomingBookings, currentPage.upcoming);
  const pastBookings = getPaginatedBookings(allPastBookings, currentPage.past);
  const activeBookings = getPaginatedBookings(allActiveBookings, currentPage.active);

  // Page navigation functions
  const handlePageChange = (category: 'upcoming' | 'active' | 'past', direction: 'next' | 'prev') => {
    setCurrentPage(prev => {
      const totalItems = category === 'upcoming' ? allUpcomingBookings.length :
                        category === 'active' ? allActiveBookings.length :
                        allPastBookings.length;
      const totalPages = getTotalPages(totalItems);
      const currentPageNum = prev[category];

      let newPage = currentPageNum;
      if (direction === 'next' && currentPageNum < totalPages) {
        newPage = currentPageNum + 1;
      } else if (direction === 'prev' && currentPageNum > 1) {
        newPage = currentPageNum - 1;
      }

      return { ...prev, [category]: newPage };
    });
  };

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
                <Link to="/home">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
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
              <Link to="/home">
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
                  Upcoming ({allUpcomingBookings.length})
                </TabsTrigger>
                <TabsTrigger
                  value="active"
                  className="data-[state=active]:bg-roam-blue data-[state=active]:text-white"
                >
                  Active ({allActiveBookings.length})
                </TabsTrigger>
                <TabsTrigger
                  value="past"
                  className="data-[state=active]:bg-roam-blue data-[state=active]:text-white"
                >
                  Past ({allPastBookings.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming" className="space-y-4">
                {allUpcomingBookings.length === 0 ? (
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
                      <Link to="/home">Browse Services</Link>
                    </Button>
                  </Card>
                ) : (
                  <>
                    <div className="space-y-4">
                      {upcomingBookings.map((booking) => (
                        <BookingCard key={booking.id} booking={booking} />
                      ))}
                    </div>

                    {/* Pagination Controls for Upcoming */}
                    {getTotalPages(allUpcomingBookings.length) > 1 && (
                      <div className="flex items-center justify-between pt-4">
                        <div className="text-sm text-foreground/60">
                          Showing {((currentPage.upcoming - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage.upcoming * ITEMS_PER_PAGE, allUpcomingBookings.length)} of {allUpcomingBookings.length} bookings
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange('upcoming', 'prev')}
                            disabled={currentPage.upcoming === 1}
                          >
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                          </Button>
                          <span className="text-sm font-medium">
                            Page {currentPage.upcoming} of {getTotalPages(allUpcomingBookings.length)}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange('upcoming', 'next')}
                            disabled={currentPage.upcoming === getTotalPages(allUpcomingBookings.length)}
                          >
                            Next
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="active" className="space-y-4">
                {allActiveBookings.length === 0 ? (
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
                  <>
                    <div className="space-y-4">
                      {activeBookings.map((booking) => (
                        <BookingCard key={booking.id} booking={booking} />
                      ))}
                    </div>

                    {/* Pagination Controls for Active */}
                    {getTotalPages(allActiveBookings.length) > 1 && (
                      <div className="flex items-center justify-between pt-4">
                        <div className="text-sm text-foreground/60">
                          Showing {((currentPage.active - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage.active * ITEMS_PER_PAGE, allActiveBookings.length)} of {allActiveBookings.length} bookings
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange('active', 'prev')}
                            disabled={currentPage.active === 1}
                          >
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                          </Button>
                          <span className="text-sm font-medium">
                            Page {currentPage.active} of {getTotalPages(allActiveBookings.length)}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange('active', 'next')}
                            disabled={currentPage.active === getTotalPages(allActiveBookings.length)}
                          >
                            Next
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="past" className="space-y-4">
                {allPastBookings.length === 0 ? (
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
                  <>
                    <div className="space-y-4">
                      {pastBookings.map((booking) => (
                        <BookingCard key={booking.id} booking={booking} />
                      ))}
                    </div>

                    {/* Pagination Controls for Past */}
                    {getTotalPages(allPastBookings.length) > 1 && (
                      <div className="flex items-center justify-between pt-4">
                        <div className="text-sm text-foreground/60">
                          Showing {((currentPage.past - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage.past * ITEMS_PER_PAGE, allPastBookings.length)} of {allPastBookings.length} bookings
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange('past', 'prev')}
                            disabled={currentPage.past === 1}
                          >
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                          </Button>
                          <span className="text-sm font-medium">
                            Page {currentPage.past} of {getTotalPages(allPastBookings.length)}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange('past', 'next')}
                            disabled={currentPage.past === getTotalPages(allPastBookings.length)}
                          >
                            Next
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
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
            <Avatar className="w-16 h-16">
              <AvatarImage
                src={booking.provider.image}
                alt={booking.provider.name}
                className="object-cover"
              />
              <AvatarFallback className="bg-gradient-to-br from-roam-blue to-roam-light-blue text-white text-lg font-semibold">
                {booking.provider.firstName?.[0]?.toUpperCase() || ''}
                {booking.provider.lastName?.[0]?.toUpperCase() || ''}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg mb-1">{booking.service}</h3>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-foreground/60">
                  with {booking.provider.name}
                </p>
                {booking.status === "confirmed" && (
                  <div className="flex items-center gap-1 text-xs text-roam-blue bg-roam-blue/10 px-2 py-1 rounded-full">
                    <MessageCircle className="w-3 h-3" />
                    <span>Messaging Available</span>
                  </div>
                )}
              </div>

              {/* Booking Reference */}
              {booking.bookingReference && (
                <div className="flex items-center gap-2 mb-2 p-2 bg-gray-50 rounded-lg border-l-4 border-roam-blue">
                  <Hash className="w-4 h-4 text-roam-blue" />
                  <div>
                    <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Booking Reference</span>
                    <p className="text-sm font-mono font-semibold text-gray-900">{booking.bookingReference}</p>
                  </div>
                </div>
              )}

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
          {/* Cancel and Reschedule actions for pending or confirmed bookings */}
          {(booking.status === "pending" || booking.status === "confirmed") && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="border-red-500 text-red-600 hover:bg-red-500 hover:text-white"
                onClick={() => {
                  // TODO: Implement cancel booking functionality
                  console.log("Cancel booking:", booking.id);
                }}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white"
                onClick={() => {
                  // TODO: Implement reschedule booking functionality
                  console.log("Reschedule booking:", booking.id);
                }}
              >
                <Edit className="w-4 h-4 mr-2" />
                Reschedule
              </Button>
            </>
          )}

          {/* Message button for confirmed bookings only */}
          {booking.status === "confirmed" && (
            <Button
              size="sm"
              variant="outline"
              className="border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white"
              onClick={() => {
                // TODO: Implement messaging functionality with provider
                console.log("Open messaging with provider for booking:", booking.id);
                console.log("Provider:", booking.provider.name);
                // Could navigate to a chat interface or open a modal
                // navigate(`/bookings/${booking.id}/messages`);
              }}
              title={`Message ${booking.provider.name} about this booking`}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Message Provider
            </Button>
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
