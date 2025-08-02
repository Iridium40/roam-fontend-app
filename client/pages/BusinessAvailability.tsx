import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function BusinessAvailability() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { customer, isCustomer } = useAuth();
  
  const selectedDate = searchParams.get('date');
  const selectedTime = searchParams.get('time');
  
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
        .from('services')
        .select(`
          id,
          name,
          description,
          base_price,
          duration_minutes,
          image_url,
          service_subcategories (
            service_subcategory_type,
            service_categories (
              service_category_type
            )
          )
        `)
        .eq('id', serviceId)
        .eq('is_active', true)
        .single();

      if (serviceError || !serviceData) {
        throw new Error('Service not found');
      }

      setService(serviceData);

      // Get day of week from selected date
      const date = new Date(selectedDate!);
      const dayOfWeek = date.getDay();

      // Fetch businesses that offer this service
      const { data: businessesData, error: businessesError } = await supabase
        .from('business_services')
        .select(`
          business_id,
          business_price,
          delivery_type,
          business_profiles!inner (
            id,
            business_name,
            business_description,
            business_type,
            logo_url,
            image_url,
            verification_status,
            years_in_business,
            is_active,
            business_hours,
            business_locations (
              city,
              state,
              address_line_1
            )
          )
        `)
        .eq('service_id', serviceId)
        .eq('is_active', true)
        .eq('business_profiles.is_active', true)
        .eq('business_profiles.verification_status', 'approved');

      if (businessesError) {
        console.error('Error fetching businesses:', businessesError);
        throw new Error('Failed to fetch available businesses');
      }

      // Filter businesses by time availability
      const filteredBusinesses = (businessesData || []).filter((item: any) => {
        const openTime = item.business_hours.open_time;
        const closeTime = item.business_hours.close_time;
        const requestedTime = selectedTime!;
        
        return requestedTime >= openTime && requestedTime <= closeTime;
      });

      // Transform the data for display
      const transformedBusinesses = filteredBusinesses.map((item: any) => ({
        id: item.business_profiles.id,
        name: item.business_profiles.business_name,
        description: item.business_profiles.business_description,
        type: item.business_profiles.business_type,
        logo: item.business_profiles.logo_url || item.business_profiles.image_url,
        verification_status: item.business_profiles.verification_status,
        years_in_business: item.business_profiles.years_in_business,
        location: item.business_profiles.business_locations?.city
          ? `${item.business_profiles.business_locations.city}, ${item.business_profiles.business_locations.state}`
          : 'Location not specified',
        servicePrice: item.custom_price || item.business_price,
        deliveryType: item.delivery_type,
        rating: 4.8, // Mock rating - replace with actual data
        reviewCount: Math.floor(Math.random() * 200) + 50,
        openTime: item.business_hours.open_time,
        closeTime: item.business_hours.close_time,
      }));

      setAvailableBusinesses(transformedBusinesses);

    } catch (error: any) {
      console.error('Error fetching available businesses:', error);
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
    const bookingParams = new URLSearchParams({
      date: selectedDate!,
      time: selectedTime!,
      businessId: business.id,
    });

    navigate(`/business/${business.id}/book-service?${bookingParams.toString()}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDeliveryBadge = (type: string) => {
    const config = {
      mobile: { label: "Mobile Service", color: "bg-green-100 text-green-800" },
      business_location: { label: "In-Studio", color: "bg-blue-100 text-blue-800" },
      virtual: { label: "Virtual", color: "bg-purple-100 text-purple-800" },
    };
    return config[type as keyof typeof config] || { label: type, color: "bg-gray-100 text-gray-800" };
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
                <span className="ml-2 text-sm font-medium text-green-600">Date & Time Selected</span>
              </div>
              <ChevronRight className="w-4 h-4 text-foreground/40" />
              <div className="flex items-center">
                <div className="w-8 h-8 bg-roam-blue text-white rounded-full flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <span className="ml-2 text-sm font-medium text-roam-blue">Choose Business</span>
              </div>
              <ChevronRight className="w-4 h-4 text-foreground/40" />
              <div className="flex items-center">
                <div className="w-8 h-8 bg-foreground/20 text-foreground/60 rounded-full flex items-center justify-center text-sm">
                  3
                </div>
                <span className="ml-2 text-sm text-foreground/60">Book Service</span>
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
                <span>{selectedDate ? formatDate(selectedDate) : ''}</span>
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
                <Card key={business.id} className="hover:shadow-lg transition-shadow cursor-pointer">
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
                            <h3 className="text-xl font-semibold mb-1">{business.name}</h3>
                            <p className="text-foreground/70 mb-2">{business.description}</p>
                            <div className="flex items-center gap-4 text-sm text-foreground/60">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                <span>{business.location}</span>
                              </div>
                              {business.verification_status === 'approved' && (
                                <div className="flex items-center gap-1 text-green-600">
                                  <Shield className="w-4 h-4" />
                                  <span>Verified</span>
                                </div>
                              )}
                              {business.years_in_business && (
                                <span>{business.years_in_business} years in business</span>
                              )}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="flex items-center gap-1 mb-2">
                              <Star className="w-4 h-4 text-roam-warning fill-current" />
                              <span className="font-semibold">{business.rating}</span>
                              <span className="text-sm text-foreground/60">({business.reviewCount})</span>
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
                              className={getDeliveryBadge(business.deliveryType).color}
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
              <h3 className="text-lg font-semibold mb-2">No Available Businesses</h3>
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
