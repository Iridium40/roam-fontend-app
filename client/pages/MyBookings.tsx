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
  RefreshCw
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function MyBookings() {
  const bookings = [
    {
      id: "B001",
      status: "confirmed",
      service: "Deep Tissue Massage",
      provider: {
        name: "Sarah Johnson",
        rating: 4.9,
        phone: "(305) 555-0123",
        image: "/api/placeholder/60/60"
      },
      date: "2024-01-15",
      time: "2:00 PM",
      duration: "90 minutes",
      deliveryType: "mobile",
      location: "Your Home - 123 Ocean Dr, Miami, FL",
      price: "$120",
      notes: "Please bring your own massage table",
      bookingDate: "2024-01-10"
    },
    {
      id: "B002", 
      status: "in_progress",
      service: "Personal Training Session",
      provider: {
        name: "Michael Chen",
        rating: 5.0,
        phone: "(407) 555-0456",
        image: "/api/placeholder/60/60"
      },
      date: "2024-01-12",
      time: "6:00 AM",
      duration: "60 minutes", 
      deliveryType: "mobile",
      location: "Your Home - 456 Park Ave, Orlando, FL",
      price: "$80",
      notes: "HIIT workout focus",
      bookingDate: "2024-01-05"
    },
    {
      id: "B003",
      status: "pending",
      service: "Hair Cut & Color",
      provider: {
        name: "Emily Rodriguez", 
        rating: 4.8,
        phone: "(813) 555-0789",
        image: "/api/placeholder/60/60"
      },
      date: "2024-01-20",
      time: "10:00 AM",
      duration: "3 hours",
      deliveryType: "business",
      location: "Beauty Studio - 789 Main St, Tampa, FL",
      price: "$185",
      notes: "Consultation for new color",
      bookingDate: "2024-01-08"
    },
    {
      id: "B004",
      status: "completed",
      service: "Telehealth Consultation",
      provider: {
        name: "Dr. Amanda White",
        rating: 4.9,
        phone: "(904) 555-0321",
        image: "/api/placeholder/60/60"
      },
      date: "2024-01-05",
      time: "3:00 PM", 
      duration: "30 minutes",
      deliveryType: "virtual",
      location: "Video Call",
      price: "$125",
      notes: "Annual wellness check",
      bookingDate: "2024-01-02"
    },
    {
      id: "B005",
      status: "cancelled",
      service: "Yoga Session",
      provider: {
        name: "Jessica Park",
        rating: 4.7,
        phone: "(561) 555-0654",
        image: "/api/placeholder/60/60"
      },
      date: "2024-01-08",
      time: "7:00 AM",
      duration: "75 minutes",
      deliveryType: "mobile", 
      location: "Your Home - 321 Beach Rd, West Palm Beach, FL",
      price: "$90",
      notes: "Cancelled due to weather",
      bookingDate: "2024-01-03"
    }
  ];

  const getStatusConfig = (status: string) => {
    const configs = {
      confirmed: {
        label: "Confirmed",
        color: "bg-green-100 text-green-800",
        icon: CheckCircle,
        description: "Your booking is confirmed"
      },
      pending: {
        label: "Pending",
        color: "bg-yellow-100 text-yellow-800", 
        icon: Clock,
        description: "Waiting for provider confirmation"
      },
      in_progress: {
        label: "In Progress",
        color: "bg-blue-100 text-blue-800",
        icon: RefreshCw,
        description: "Service is currently active"
      },
      completed: {
        label: "Completed",
        color: "bg-gray-100 text-gray-800",
        icon: CheckCircle,
        description: "Service completed successfully"
      },
      cancelled: {
        label: "Cancelled", 
        color: "bg-red-100 text-red-800",
        icon: XCircle,
        description: "Booking was cancelled"
      }
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  const getDeliveryIcon = (type: string) => {
    const icons = {
      mobile: Smartphone,
      business: Building,
      virtual: Video
    };
    return icons[type as keyof typeof icons] || Smartphone;
  };

  const getDeliveryLabel = (type: string) => {
    const labels = {
      mobile: "Mobile Service",
      business: "In-Studio",
      virtual: "Virtual"
    };
    return labels[type as keyof typeof labels] || type;
  };

  const upcomingBookings = bookings.filter(b => b.status === "confirmed" || b.status === "pending");
  const pastBookings = bookings.filter(b => b.status === "completed" || b.status === "cancelled");
  const activeBookings = bookings.filter(b => b.status === "in_progress");

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric', 
      month: 'long',
      day: 'numeric'
    });
  };

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
              <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2Fa42b6f9ec53e4654a92af75aad56d14f%2F38446bf6c22b453fa45caf63b0513e21?format=webp&width=800"
                  alt="ROAM Logo"
                  className="w-8 h-8 object-contain"
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
              Manage your appointments and view your booking history.
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
                      <h3 className="font-semibold text-blue-900 mb-2">Service in Progress</h3>
                      <p className="text-blue-800 mb-3">
                        {activeBookings[0].service} with {activeBookings[0].provider.name} is currently active.
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="border-blue-500 text-blue-700 hover:bg-blue-500 hover:text-white">
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Contact Provider
                        </Button>
                        <Button size="sm" variant="outline" className="border-blue-500 text-blue-700 hover:bg-blue-500 hover:text-white">
                          <Phone className="w-4 h-4 mr-2" />
                          Call
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
                <TabsTrigger value="upcoming" className="data-[state=active]:bg-roam-blue data-[state=active]:text-white">
                  Upcoming ({upcomingBookings.length})
                </TabsTrigger>
                <TabsTrigger value="active" className="data-[state=active]:bg-roam-blue data-[state=active]:text-white">
                  Active ({activeBookings.length})
                </TabsTrigger>
                <TabsTrigger value="past" className="data-[state=active]:bg-roam-blue data-[state=active]:text-white">
                  Past ({pastBookings.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming" className="space-y-4">
                {upcomingBookings.length === 0 ? (
                  <Card className="p-12 text-center">
                    <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No upcoming bookings</h3>
                    <p className="text-foreground/60 mb-4">Book your next service to see it here.</p>
                    <Button asChild className="bg-roam-blue hover:bg-roam-blue/90">
                      <Link to="/">
                        Browse Services
                      </Link>
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
                    <h3 className="text-lg font-semibold mb-2">No active services</h3>
                    <p className="text-foreground/60">When a service is in progress, it will appear here.</p>
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
                    <h3 className="text-lg font-semibold mb-2">No past bookings</h3>
                    <p className="text-foreground/60">Your completed services will appear here.</p>
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
      description: "Your booking is confirmed"
    },
    pending: {
      label: "Pending",
      color: "bg-yellow-100 text-yellow-800", 
      icon: Clock,
      description: "Waiting for provider confirmation"
    },
    in_progress: {
      label: "In Progress",
      color: "bg-blue-100 text-blue-800",
      icon: RefreshCw,
      description: "Service is currently active"
    },
    completed: {
      label: "Completed",
      color: "bg-gray-100 text-gray-800",
      icon: CheckCircle,
      description: "Service completed successfully"
    },
    cancelled: {
      label: "Cancelled", 
      color: "bg-red-100 text-red-800",
      icon: XCircle,
      description: "Booking was cancelled"
    }
  }[booking.status];

  const DeliveryIcon = {
    mobile: Smartphone,
    business: Building,
    virtual: Video
  }[booking.deliveryType];

  const deliveryLabel = {
    mobile: "Mobile Service",
    business: "In-Studio", 
    virtual: "Virtual"
  }[booking.deliveryType];

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
              <p className="text-foreground/60 mb-2">with {booking.provider.name}</p>
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>View Details</DropdownMenuItem>
                <DropdownMenuItem>Contact Provider</DropdownMenuItem>
                {booking.status === "confirmed" && (
                  <>
                    <DropdownMenuItem>Reschedule</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">Cancel</DropdownMenuItem>
                  </>
                )}
                {booking.status === "completed" && (
                  <DropdownMenuItem>Leave Review</DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
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
            <span className="text-sm font-medium">{booking.provider.rating}</span>
            <span className="text-sm text-foreground/60">•</span>
            <span className="text-sm font-semibold text-roam-blue">{booking.price}</span>
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
              <Button size="sm" variant="outline" className="border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white">
                <MessageCircle className="w-4 h-4 mr-2" />
                Message
              </Button>
              <Button size="sm" variant="outline" className="border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white">
                <Phone className="w-4 h-4 mr-2" />
                Call
              </Button>
            </>
          )}
          {booking.status === "completed" && (
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
