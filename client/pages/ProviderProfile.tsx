import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Star,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Clock,
  Shield,
  Users,
  MessageCircle,
  Share2,
  Heart,
  Smartphone,
  Building,
  Video,
  Award,
  CheckCircle,
  Camera,
  ChevronRight,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useState } from "react";

export default function ProviderProfile() {
  const { providerId } = useParams();
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Mock provider data - in real app would fetch based on providerId
  const provider = {
    id: providerId || "1",
    name: "Sarah Johnson",
    title: "Licensed Massage Therapist",
    rating: 4.9,
    reviews: 127,
    responseRate: "98%",
    responseTime: "Within 1 hour",
    location: "Miami, FL",
    joinedDate: "January 2022",
    verified: true,
    profileImage: "/api/placeholder/120/120",
    coverImage:
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&h=300&fit=crop",
    bio: "I'm a licensed massage therapist with over 8 years of experience helping clients achieve relaxation and pain relief. Specializing in deep tissue and therapeutic massage, I bring my expertise directly to your location for maximum comfort and convenience.",
    specialties: [
      "Deep Tissue",
      "Swedish",
      "Sports Massage",
      "Prenatal",
      "Hot Stone",
    ],
    languages: ["English", "Spanish"],
    certifications: [
      "Licensed Massage Therapist (FL #MA12345)",
      "Certified Myofascial Release Therapist",
      "Prenatal Massage Certification",
    ],
    deliveryTypes: ["mobile", "business"],
    businessAddress: "123 Wellness Center, Miami, FL 33101",
    serviceArea: "Miami-Dade County",
    availableDays: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ],
  };

  const services = [
    {
      id: 1,
      name: "Deep Tissue Massage",
      duration: "90 minutes",
      price: 120,
      description:
        "Therapeutic massage targeting deeper layers of muscle and connective tissue to relieve chronic pain and tension.",
      deliveryTypes: ["mobile", "business"],
      popularity: "Most Popular",
    },
    {
      id: 2,
      name: "Swedish Massage",
      duration: "60 minutes",
      price: 90,
      description:
        "Relaxing full-body massage using long strokes, kneading, and circular movements to promote relaxation.",
      deliveryTypes: ["mobile", "business"],
      popularity: null,
    },
    {
      id: 3,
      name: "Sports Recovery Massage",
      duration: "75 minutes",
      price: 110,
      description:
        "Specialized massage for athletes focusing on injury prevention and recovery enhancement.",
      deliveryTypes: ["mobile"],
      popularity: null,
    },
    {
      id: 4,
      name: "Prenatal Massage",
      duration: "60 minutes",
      price: 100,
      description:
        "Gentle, safe massage designed specifically for expecting mothers to reduce pregnancy discomfort.",
      deliveryTypes: ["mobile", "business"],
      popularity: null,
    },
  ];

  const reviews = [
    {
      id: 1,
      customerName: "Maria L.",
      rating: 5,
      date: "2 weeks ago",
      service: "Deep Tissue Massage",
      review:
        "Sarah is absolutely amazing! She relieved all the tension in my shoulders and back. Very professional and skilled. Will definitely book again!",
      verified: true,
    },
    {
      id: 2,
      customerName: "John D.",
      rating: 5,
      date: "1 month ago",
      service: "Sports Recovery Massage",
      review:
        "Perfect for post-workout recovery. Sarah knows exactly how to target problem areas. Great communication and very punctual.",
      verified: true,
    },
    {
      id: 3,
      customerName: "Lisa K.",
      rating: 5,
      date: "1 month ago",
      service: "Swedish Massage",
      review:
        "So relaxing! Sarah created the perfect ambiance and her technique is excellent. Love that she comes to my home.",
      verified: true,
    },
  ];

  const getDeliveryIcon = (type: string) => {
    const icons = {
      mobile: Smartphone,
      business: Building,
      virtual: Video,
    };
    return icons[type as keyof typeof icons] || Smartphone;
  };

  const getDeliveryLabel = (type: string) => {
    const labels = {
      mobile: "Mobile Service",
      business: "In-Studio",
      virtual: "Virtual",
    };
    return labels[type as keyof typeof labels] || type;
  };

  const handleBookService = (serviceId: number) => {
    setSelectedService(serviceId.toString());
    setShowBookingModal(true);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${provider.name} - ${provider.title}`,
        text: `Book ${provider.name} for professional massage therapy services`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Profile link copied to clipboard!");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-roam-light-blue/10">
      {/* Navigation */}
      <nav className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button asChild variant="ghost" size="sm">
                <Link to="/">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Services
                </Link>
              </Button>
              <div className="flex items-center">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2Fa42b6f9ec53e4654a92af75aad56d14f%2F38446bf6c22b453fa45caf63b0513e21?format=webp&width=800"
                  alt="ROAM - Your Best Life. Everywhere."
                  className="h-8 w-auto"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Share Profile
              </Button>
              <Button asChild className="bg-roam-blue hover:bg-roam-blue/90">
                <Link to="/my-bookings">
                  <Calendar className="w-4 h-4 mr-2" />
                  My Bookings
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative">
        <div
          className="h-64 bg-cover bg-center"
          style={{ backgroundImage: `url(${provider.coverImage})` }}
        >
          <div className="absolute inset-0 bg-black/40" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative -mt-20 pb-8">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="relative">
                <div className="w-32 h-32 bg-gradient-to-br from-roam-blue to-roam-light-blue rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                  <Users className="w-16 h-16 text-white" />
                </div>
                {provider.verified && (
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-roam-blue rounded-full flex items-center justify-center border-2 border-white">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">
                        {provider.name}
                      </h1>
                      <p className="text-lg text-gray-600 mb-2">
                        {provider.title}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {provider.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Member since {provider.joinedDate}
                        </div>
                      </div>
                    </div>

                    <div className="text-center md:text-right">
                      <div className="flex items-center justify-center md:justify-end gap-1 mb-2">
                        <Star className="w-5 h-5 text-roam-warning fill-current" />
                        <span className="text-2xl font-bold">
                          {provider.rating}
                        </span>
                        <span className="text-gray-600">
                          ({provider.reviews} reviews)
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          className="bg-roam-blue hover:bg-roam-blue/90"
                          onClick={() => handleBookService(1)}
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          Book Now
                        </Button>
                        <Button
                          variant="outline"
                          className="border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Message
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Services */}
              <Card>
                <CardHeader>
                  <CardTitle>Services & Pricing</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {services.map((service) => (
                      <div
                        key={service.id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">
                                {service.name}
                              </h3>
                              {service.popularity && (
                                <Badge className="bg-roam-yellow text-gray-900">
                                  {service.popularity}
                                </Badge>
                              )}
                            </div>
                            <p className="text-gray-600 mb-3">
                              {service.description}
                            </p>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {service.deliveryTypes.map((type) => {
                                const Icon = getDeliveryIcon(type);
                                return (
                                  <Badge
                                    key={type}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    <Icon className="w-3 h-3 mr-1" />
                                    {getDeliveryLabel(type)}
                                  </Badge>
                                );
                              })}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {service.duration}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-roam-blue mb-2">
                              ${service.price}
                            </div>
                            <Button
                              size="sm"
                              className="bg-roam-blue hover:bg-roam-blue/90"
                              onClick={() => handleBookService(service.id)}
                            >
                              Book Service
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* About */}
              <Card>
                <CardHeader>
                  <CardTitle>About {provider.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed mb-6">
                    {provider.bio}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Specialties</h4>
                      <div className="flex flex-wrap gap-2">
                        {provider.specialties.map((specialty) => (
                          <Badge
                            key={specialty}
                            variant="outline"
                            className="border-roam-blue text-roam-blue"
                          >
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Languages</h4>
                      <div className="flex flex-wrap gap-2">
                        {provider.languages.map((language) => (
                          <Badge key={language} variant="secondary">
                            {language}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h4 className="font-semibold mb-3">Certifications</h4>
                    <ul className="space-y-2">
                      {provider.certifications.map((cert, index) => (
                        <li
                          key={index}
                          className="flex items-center gap-2 text-sm text-gray-700"
                        >
                          <Award className="w-4 h-4 text-roam-blue" />
                          {cert}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Reviews */}
              <Card>
                <CardHeader>
                  <CardTitle>Reviews ({provider.reviews})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <div
                        key={review.id}
                        className="border-b pb-6 last:border-b-0 last:pb-0"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold">
                                {review.customerName}
                              </span>
                              {review.verified && (
                                <Badge
                                  variant="secondary"
                                  className="text-xs bg-green-100 text-green-800"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Verified
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <div className="flex">
                                {[...Array(review.rating)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className="w-4 h-4 text-roam-warning fill-current"
                                  />
                                ))}
                              </div>
                              <span>{review.service}</span>
                              <span>•</span>
                              <span>{review.date}</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-700">{review.review}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-roam-blue" />
                    Provider Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Response Rate</span>
                    <span className="font-semibold">
                      {provider.responseRate}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Response Time</span>
                    <span className="font-semibold">
                      {provider.responseTime}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Reviews</span>
                    <span className="font-semibold">{provider.reviews}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Member Since</span>
                    <span className="font-semibold">{provider.joinedDate}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Service Area */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-roam-blue" />
                    Service Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-gray-600 block mb-1">
                      Service Area
                    </span>
                    <span className="font-semibold">
                      {provider.serviceArea}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 block mb-1">
                      Studio Location
                    </span>
                    <span className="font-semibold">
                      {provider.businessAddress}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 block mb-2">
                      Available Days
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {provider.availableDays.map((day) => (
                        <Badge
                          key={day}
                          variant="secondary"
                          className="text-xs"
                        >
                          {day.slice(0, 3)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact {provider.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full bg-roam-blue hover:bg-roam-blue/90">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call Provider
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
