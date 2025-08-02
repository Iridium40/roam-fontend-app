import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
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
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { BusinessProfile, BusinessService, BusinessAddon, BusinessLocation } from "@/lib/database.types";

interface ProviderData {
  business: BusinessProfile;
  services: BusinessService[];
  addons: BusinessAddon[];
  location: BusinessLocation;
}

interface BookingItem {
  type: 'service' | 'addon';
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
  preferredDate: string;
  preferredTime: string;
  notes: string;
  items: BookingItem[];
}

const ProviderBooking = () => {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Get URL parameters for provider preference and service selection
  const urlParams = new URLSearchParams(window.location.search);
  const preferredProviderId = urlParams.get('provider');
  const selectedServiceId = urlParams.get('service');

  const [providerData, setProviderData] = useState<ProviderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<BookingItem[]>([]);
  const [preferredProvider, setPreferredProvider] = useState<any>(null);
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    preferredDate: '',
    preferredTime: '',
    notes: '',
    items: []
  });

  useEffect(() => {
    if (businessId) {
      fetchProviderData();
    }
  }, [businessId]);

  const fetchProviderData = async () => {
    try {
      setLoading(true);

      // Fetch business profile
      const { data: business, error: businessError } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('id', businessId)
        .eq('is_active', true)
        .eq('verification_status', 'approved')
        .single();

      if (businessError || !business) {
        throw new Error('Business not found or not available for booking');
      }

      // Fetch business services
      const { data: services, error: servicesError } = await supabase
        .from('business_services')
        .select(`
          *,
          services:service_id (
            name,
            description,
            image_url,
            estimated_duration
          )
        `)
        .eq('business_id', businessId)
        .eq('is_available', true);

      if (servicesError) {
        console.error('Error fetching services:', servicesError);
      }

      // Fetch business addons
      const { data: addons, error: addonsError } = await supabase
        .from('business_addons')
        .select(`
          *,
          addons:addon_id (
            name,
            description,
            image_url
          )
        `)
        .eq('business_id', businessId)
        .eq('is_available', true);

      if (addonsError) {
        console.error('Error fetching addons:', addonsError);
      }

      // Fetch business location
      const { data: location, error: locationError } = await supabase
        .from('business_locations')
        .select('*')
        .eq('business_id', businessId)
        .single();

      if (locationError) {
        console.error('Error fetching location:', locationError);
      }

      // Fetch business providers
      const { data: providers, error: providersError } = await supabase
        .from('providers')
        .select(`
          id,
          first_name,
          last_name,
          bio,
          experience_years,
          specialties,
          image_url,
          average_rating,
          total_reviews
        `)
        .eq('business_id', businessId)
        .eq('is_active', true);

      if (providersError) {
        console.error('Error fetching providers:', providersError);
      }

      // Set preferred provider if specified in URL
      if (preferredProviderId && providers) {
        const preferred = providers.find(p => p.id === preferredProviderId);
        setPreferredProvider(preferred);
      }

      setProviderData({
        business,
        services: services || [],
        addons: addons || [],
        location: location || null
      });

    } catch (error: any) {
      console.error('Error fetching provider data:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load provider information",
        variant: "destructive",
      });
      navigate('/providers');
    } finally {
      setLoading(false);
    }
  };

  const addItemToBooking = (item: BusinessService | BusinessAddon, type: 'service' | 'addon') => {
    const bookingItem: BookingItem = {
      type,
      id: item.id,
      name: type === 'service' ? (item as any).services.name : (item as any).addons.name,
      price: (item as any).custom_price || (item as any).business_price || 0,
      duration: type === 'service' ? (item as any).services.estimated_duration : undefined,
      quantity: 1
    };

    const existingIndex = selectedItems.findIndex(i => i.id === item.id && i.type === type);
    if (existingIndex >= 0) {
      const updated = [...selectedItems];
      updated[existingIndex].quantity += 1;
      setSelectedItems(updated);
    } else {
      setSelectedItems([...selectedItems, bookingItem]);
    }

    toast({
      title: "Added to booking",
      description: `${bookingItem.name} has been added to your booking`,
    });
  };

  const removeItemFromBooking = (itemId: string, type: 'service' | 'addon') => {
    const existingIndex = selectedItems.findIndex(i => i.id === itemId && i.type === type);
    if (existingIndex >= 0) {
      const updated = [...selectedItems];
      if (updated[existingIndex].quantity > 1) {
        updated[existingIndex].quantity -= 1;
      } else {
        updated.splice(existingIndex, 1);
      }
      setSelectedItems(updated);
    }
  };

  const getItemQuantity = (itemId: string, type: 'service' | 'addon') => {
    const item = selectedItems.find(i => i.id === itemId && i.type === type);
    return item ? item.quantity : 0;
  };

  const getTotalAmount = () => {
    return selectedItems.reduce((total, item) => total + (item.price * item.quantity), 0);
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
    setBookingForm(prev => ({ ...prev, items: selectedItems }));
    setIsBookingModalOpen(true);
  };

  const submitBooking = async () => {
    try {
      if (!bookingForm.customerName || !bookingForm.customerEmail || !bookingForm.preferredDate) {
        toast({
          title: "Missing information",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      // Create booking record
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          business_id: businessId,
          customer_name: bookingForm.customerName,
          customer_email: bookingForm.customerEmail,
          customer_phone: bookingForm.customerPhone,
          preferred_date: bookingForm.preferredDate,
          preferred_time: bookingForm.preferredTime,
          notes: bookingForm.notes,
          total_amount: getTotalAmount(),
          status: 'pending',
          booking_items: bookingForm.items
        })
        .select()
        .single();

      if (bookingError) {
        throw bookingError;
      }

      toast({
        title: "Booking submitted!",
        description: "Your booking request has been submitted. The provider will contact you shortly.",
      });

      setIsBookingModalOpen(false);
      setSelectedItems([]);
      setBookingForm({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        preferredDate: '',
        preferredTime: '',
        notes: '',
        items: []
      });

    } catch (error: any) {
      console.error('Error submitting booking:', error);
      toast({
        title: "Error",
        description: "Failed to submit booking. Please try again.",
        variant: "destructive",
      });
    }
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
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Provider Not Found</h1>
          <p className="text-gray-600 mb-6">The provider you're looking for is not available for booking.</p>
          <Button onClick={() => navigate('/providers')}>
            Browse Other Providers
          </Button>
        </div>
      </div>
    );
  }

  const { business, services, addons, location } = providerData;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={business.logo_url || business.image_url || undefined} />
              <AvatarFallback>{business.business_name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{business.business_name}</h1>
                  <p className="text-gray-600">{business.business_description}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <Badge variant="secondary">{business.business_type}</Badge>
                    {business.verification_status === 'approved' && (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <Check className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white"
                  >
                    <Link to={`/business/${business.id}`}>
                      <Building className="w-5 h-5 mr-2" />
                      View Business Profile
                    </Link>
                  </Button>
                  <FavoriteButton
                    type="business"
                    itemId={business.id}
                    size="lg"
                    variant="outline"
                    showText={true}
                    className="border-gray-300 hover:border-red-300"
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
                  <p className="text-gray-700">{business.business_description}</p>
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
                      <a href={business.website_url} target="_blank" rel="noopener noreferrer" 
                         className="text-sm text-blue-600 hover:underline">
                        Visit Website
                      </a>
                    </div>
                  )}
                  {location && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        {location.address_line1}, {location.city}, {location.state} {location.postal_code}
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

            {/* Services */}
            {services.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Services</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {services.map((service) => (
                      <div key={service.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold">{(service as any).services.name}</h3>
                                <p className="text-sm text-gray-600 mt-1">
                                  {(service as any).services.description}
                                </p>
                              </div>
                              <FavoriteButton
                                type="service"
                                itemId={service.service_id}
                                size="sm"
                                variant="ghost"
                                className="ml-2"
                              />
                            </div>
                          </div>
                          {(service as any).services.image_url && (
                            <img
                              src={(service as any).services.image_url}
                              alt={(service as any).services.name}
                              className="w-16 h-16 object-cover rounded ml-4"
                            />
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between mt-4">
                          <div className="text-sm text-gray-500 space-y-1">
                            <div className="flex items-center">
                              <DollarSign className="h-4 w-4 mr-1" />
                              <span className="font-semibold">${(service as any).custom_price || (service as any).business_price || 0}</span>
                            </div>
                            {(service as any).services.estimated_duration && (
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                <span>{(service as any).services.estimated_duration} min</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {getItemQuantity(service.id, 'service') > 0 && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => removeItemFromBooking(service.id, 'service')}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="min-w-[20px] text-center">
                                  {getItemQuantity(service.id, 'service')}
                                </span>
                              </>
                            )}
                            <Button
                              size="sm"
                              onClick={() => addItemToBooking(service, 'service')}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
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
                  <CardTitle>Add-ons</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addons.map((addon) => (
                      <div key={addon.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold">{(addon as any).addons.name}</h3>
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
                            <span className="font-semibold">${addon.custom_price}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {getItemQuantity(addon.id, 'addon') > 0 && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => removeItemFromBooking(addon.id, 'addon')}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="min-w-[20px] text-center">
                                  {getItemQuantity(addon.id, 'addon')}
                                </span>
                              </>
                            )}
                            <Button
                              size="sm"
                              onClick={() => addItemToBooking(addon, 'addon')}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
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
                      <div key={`${item.type}-${item.id}-${index}`} className="flex justify-between items-center">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-sm font-medium">
                          ${(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    ))}
                    
                    <Separator />
                    
                    <div className="flex justify-between items-center font-semibold">
                      <span>Total</span>
                      <span>${getTotalAmount().toFixed(2)}</span>
                    </div>
                    
                    <Button 
                      className="w-full mt-4" 
                      onClick={openBookingModal}
                    >
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
                    value={bookingForm.customerName}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, customerName: e.target.value }))}
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="customerEmail">Email *</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={bookingForm.customerEmail}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, customerEmail: e.target.value }))}
                    placeholder="Enter your email"
                  />
                </div>
                
                <div>
                  <Label htmlFor="customerPhone">Phone Number</Label>
                  <Input
                    id="customerPhone"
                    type="tel"
                    value={bookingForm.customerPhone}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, customerPhone: e.target.value }))}
                    placeholder="Enter your phone number"
                  />
                </div>
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
                    type="date"
                    value={bookingForm.preferredDate}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, preferredDate: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                
                <div>
                  <Label htmlFor="preferredTime">Preferred Time</Label>
                  <Input
                    id="preferredTime"
                    type="time"
                    value={bookingForm.preferredTime}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, preferredTime: e.target.value }))}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm(prev => ({ ...prev, notes: e.target.value }))}
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
                  <div key={`${item.type}-${item.id}-${index}`} className="flex justify-between">
                    <span>{item.name} (x{item.quantity})</span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>${getTotalAmount().toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              <Button variant="outline" className="flex-1" onClick={() => setIsBookingModalOpen(false)}>
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
