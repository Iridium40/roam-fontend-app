import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Clock,
  Shield,
  Star,
  Scissors,
  Dumbbell,
  Home,
  Stethoscope,
  Hand,
  Users,
  ChevronRight,
  Smartphone,
  Building,
  Video,
  Calendar,
  CheckCircle,
  ArrowRight,
  TrendingUp,
  Globe,
  Car,
  Quote,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import GoogleOneTap from "@/components/GoogleOneTap";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, BookOpen, ExternalLink } from "lucide-react";

// Service Explorer Tabs Component
function ServiceExplorerTabs() {
  const [activeTab, setActiveTab] = useState("beauty");

  const tabCategories = {
    beauty: {
      title: "Beauty",
      services: [
        "Hair & Makeup",
        "Injectables",
        "Skin Care",
        "Spray Tan",
        "Nail Services",
        "Eyebrow & Lash"
      ]
    },
    fitness: {
      title: "Fitness",
      services: [
        "Personal Training",
        "Yoga Instruction",
        "Nutrition Coaching",
        "Pilates",
        "Massage Therapy",
        "Sports Training"
      ]
    },
    wellness: {
      title: "Wellness",
      services: [
        "Mental Health",
        "Life Coaching",
        "Meditation",
        "Acupuncture",
        "Chiropractic",
        "Reiki & Energy"
      ]
    },
    lifestyle: {
      title: "Lifestyle",
      services: [
        "Personal Chef",
        "House Cleaning",
        "Organization",
        "Event Planning",
        "Pet Services",
        "Tutoring"
      ]
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8 h-14">
          {Object.entries(tabCategories).map(([key, category]) => (
            <TabsTrigger
              key={key}
              value={key}
              className="text-lg font-semibold data-[state=active]:bg-roam-blue data-[state=active]:text-white"
            >
              {category.title}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(tabCategories).map(([key, category]) => (
          <TabsContent key={key} value={key} className="mt-0">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Services Sidebar */}
              <div className="lg:col-span-1">
                <Card className="h-full bg-gradient-to-br from-roam-light-blue/10 to-roam-blue/5 border-roam-blue/20">
                  <CardContent className="p-6">
                    <h3 className="text-2xl font-bold text-roam-blue mb-6">
                      {category.title} Services
                    </h3>
                    <div className="space-y-3">
                      {category.services.map((service, index) => (
                        <div key={index} className="flex items-center gap-3 group cursor-pointer">
                          <div className="w-2 h-2 bg-roam-blue rounded-full"></div>
                          <span className="text-foreground group-hover:text-roam-blue transition-colors font-medium">
                            {service}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Blog Post */}
              <div className="lg:col-span-1">
                <Card className="h-full overflow-hidden group cursor-pointer hover:shadow-xl transition-all duration-300">
                  <div className="relative">
                    <img
                      src="https://cdn.builder.io/api/v1/image/assets%2Fa42b6f9ec53e4654a92af75aad56d14f%2Fc812f66efc8641e5a5e8b82ad8a50e3e?format=webp&width=800"
                      alt="Blog post featured image"
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-roam-yellow text-gray-900 font-semibold">
                        ROAM BLOG
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <h4 className="text-sm font-medium text-roam-blue mb-2 uppercase tracking-wide">
                      {category.title} News
                    </h4>
                    <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-roam-blue transition-colors">
                      {key === 'beauty' && "Glow Goals: How a Spray Tan Lifts Your Look & Your Spirits"}
                      {key === 'fitness' && "5 Benefits of Personal Training That Will Transform Your Fitness Journey"}
                      {key === 'wellness' && "The Science Behind Mindfulness: Why Meditation Matters More Than Ever"}
                      {key === 'lifestyle' && "Creating Work-Life Balance: Tips from Professional Life Coaches"}
                    </h3>
                    <div className="flex items-center gap-2 text-roam-blue font-medium group-hover:gap-3 transition-all">
                      <BookOpen className="w-4 h-4" />
                      <span>Read More</span>
                      <ExternalLink className="w-4 h-4" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Video Interview */}
              <div className="lg:col-span-1">
                <Card className="h-full overflow-hidden group cursor-pointer hover:shadow-xl transition-all duration-300">
                  <div className="relative">
                    <img
                      src="https://cdn.builder.io/api/v1/image/assets%2Fa42b6f9ec53e4654a92af75aad56d14f%2Fc812f66efc8641e5a5e8b82ad8a50e3e?format=webp&width=800"
                      alt="Provider spotlight video"
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center group-hover:bg-white transition-colors">
                        <Play className="w-8 h-8 text-roam-blue ml-1" />
                      </div>
                    </div>
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-red-600 text-white font-semibold">
                        LIVE INTERVIEW
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <h4 className="text-sm font-medium text-roam-blue mb-2 uppercase tracking-wide">
                      {category.title} Provider Spotlight
                    </h4>
                    <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-roam-blue transition-colors">
                      {key === 'beauty' && "Maureen: Hair Designer & Makeup Artist"}
                      {key === 'fitness' && "Jake: Certified Personal Trainer & Nutrition Expert"}
                      {key === 'wellness' && "Sarah: Licensed Therapist & Mindfulness Coach"}
                      {key === 'lifestyle' && "Maria: Professional Organizer & Lifestyle Consultant"}
                    </h3>
                    <div className="flex items-center gap-2 text-roam-blue font-medium group-hover:gap-3 transition-all">
                      <Video className="w-4 h-4" />
                      <span>Watch Interview</span>
                      <ExternalLink className="w-4 h-4" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

export default function LandingPage() {
  const { customer, isCustomer } = useAuth();
  const features = [
    {
      icon: Calendar,
      title: "Easy Booking",
      description:
        "Book services instantly with our simple and intuitive platform",
    },
    {
      icon: MapPin,
      title: "Location Flexible",
      description:
        "Choose from mobile, in-business, or virtual service options",
    },
    {
      icon: Shield,
      title: "Verified Providers",
      description: "All service providers are thoroughly vetted and verified",
    },
    {
      icon: Clock,
      title: "24/7 Availability",
      description:
        "Book services anytime, anywhere with real-time availability",
    },
  ];

  const serviceCategories = [
    {
      icon: Scissors,
      title: "Beauty",
      description: "Hair, nails, skincare, and beauty treatments",
      color: "from-pink-500 to-rose-400",
    },
    {
      icon: Dumbbell,
      title: "Fitness",
      description: "Personal training, yoga, and fitness coaching",
      color: "from-green-500 to-emerald-400",
    },
    {
      icon: Hand,
      title: "Therapy",
      description: "Physical therapy, counseling, and wellness services",
      color: "from-blue-500 to-cyan-400",
    },
    {
      icon: Stethoscope,
      title: "Healthcare",
      description: "Medical services, health screenings, and professional care",
      color: "from-purple-500 to-violet-400",
    },
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Busy Professional",
      content:
        "ROAM made it so easy to find a mobile massage therapist. The service was incredible and I didn't have to leave my home!",
      rating: 5,
    },
    {
      name: "Michael Chen",
      role: "Fitness Enthusiast",
      content:
        "I found the perfect personal trainer through ROAM. The booking process was seamless and the trainer was exactly what I needed.",
      rating: 5,
    },
    {
      name: "Emma Davis",
      role: "New Mom",
      content:
        "As a new mom, I couldn't easily get to a salon. ROAM's mobile beauty services were a lifesaver - professional and convenient.",
      rating: 5,
    },
  ];

  const stats = [
    { number: "10,000+", label: "Happy Customers" },
    { number: "500+", label: "Verified Providers" },
    { number: "50+", label: "Service Categories" },
    { number: "24/7", label: "Customer Support" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-roam-light-blue/5 to-roam-yellow/10">
      {/* Google One Tap - only show when not authenticated */}
      {!isCustomer && import.meta.env.VITE_GOOGLE_CLIENT_ID && (
        <GoogleOneTap
          clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}
          onSuccess={() => {
            console.log("Google One Tap sign-in successful");
          }}
          onError={(error) => {
            console.error("Google One Tap error:", error);
          }}
        />
      )}
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-border/50 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2Fa42b6f9ec53e4654a92af75aad56d14f%2F38446bf6c22b453fa45caf63b0513e21?format=webp&width=800"
              alt="ROAM - Your Best Life. Everywhere."
              className="h-10 w-auto"
            />
            <nav className="hidden md:flex items-center space-x-8">
              <a
                href="#features"
                className="text-foreground/80 hover:text-roam-blue transition-colors"
              >
                Features
              </a>
              <a
                href="#services"
                className="text-foreground/80 hover:text-roam-blue transition-colors"
              >
                Services
              </a>
              <a
                href="#testimonials"
                className="text-foreground/80 hover:text-roam-blue transition-colors"
              >
                Reviews
              </a>
              <Link
                to="/home"
                className="text-roam-blue hover:text-roam-blue/80 transition-colors font-medium"
              >
                Browse Services
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-roam-blue/5 via-transparent to-roam-yellow/5"></div>
        <div className="container mx-auto px-6 relative">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 bg-roam-light-blue/20 text-roam-blue border-roam-light-blue/30 px-4 py-2">
              ��� Now Available in Your Area
            </Badge>
            <h1 className="text-5xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
              Book Services
              <span className="block bg-gradient-to-r from-roam-blue to-roam-light-blue bg-clip-text text-transparent">
                That Come to You
              </span>
            </h1>
            <p className="text-xl lg:text-2xl text-foreground/70 mb-10 max-w-3xl mx-auto leading-relaxed">
              From mobile beauty treatments to in-home fitness training,
              discover verified professionals who bring premium services
              directly to your location.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                asChild
                size="lg"
                className="bg-roam-blue hover:bg-roam-blue/90 text-white px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              >
                <Link to="/home" className="flex items-center gap-2">
                  Book Today
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white px-8 py-4 text-lg font-semibold transition-all duration-300"
                asChild
              >
                <a href="#services" className="flex items-center gap-2">
                  Explore Services
                  <ChevronRight className="w-5 h-5" />
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-roam-yellow/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-roam-light-blue/20 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-roam-blue/10 rounded-full blur-lg animate-pulse delay-500"></div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-roam-blue mb-2">
                  {stat.number}
                </div>
                <div className="text-foreground/70 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-32">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Why Choose ROAM?
            </h2>
            <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
              We've reimagined how you access professional services, making it
              easier, safer, and more convenient than ever before.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="border-border/50 hover:border-roam-light-blue/50 transition-all duration-300 hover:shadow-xl group"
              >
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-roam-blue to-roam-light-blue rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-foreground/70 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>


      {/* Service Explorer */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Explore Our Services
            </h2>
            <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
              Discover detailed service categories, read our latest insights, and meet our featured providers.
            </p>
          </div>

          <ServiceExplorerTabs />
        </div>
      </section>

      {/* Instagram Feed */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-purple-50/50 to-pink-50/50">
        <div className="container mx-auto px-6">
          <InstagramFeed />
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
              How ROAM Works
            </h2>
            <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
              Getting the services you need has never been easier. Follow these
              simple steps.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-12">
            {[
              {
                step: "1",
                title: "Browse & Choose",
                description:
                  "Explore verified service providers in your area and read reviews from other customers",
                icon: Users,
              },
              {
                step: "2",
                title: "Book & Schedule",
                description:
                  "Select your preferred time slot and location preference - mobile, in-business, or virtual",
                icon: Calendar,
              },
              {
                step: "3",
                title: "Enjoy & Review",
                description:
                  "Receive your service from a professional provider and share your experience",
                icon: Star,
              },
            ].map((step, index) => (
              <div key={index} className="text-center relative">
                <div className="w-20 h-20 bg-gradient-to-br from-roam-blue to-roam-light-blue rounded-full flex items-center justify-center mx-auto mb-6">
                  <step.icon className="w-10 h-10 text-white" />
                </div>
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-roam-yellow text-roam-blue border-none px-3 py-1 text-sm font-bold">
                  {step.step}
                </Badge>
                <h3 className="text-2xl font-semibold text-foreground mb-4">
                  {step.title}
                </h3>
                <p className="text-foreground/70 leading-relaxed max-w-sm mx-auto">
                  {step.description}
                </p>
                {index < 2 && (
                  <div className="hidden lg:block absolute top-10 left-full w-12 transform -translate-x-6">
                    <ArrowRight className="w-6 h-6 text-roam-light-blue" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section
        id="testimonials"
        className="py-20 lg:py-32 bg-gradient-to-br from-roam-blue/5 to-roam-light-blue/5"
      >
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
              What Our Customers Say
            </h2>
            <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
              Don't just take our word for it. Here's what real customers have
              to say about ROAM.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card
                key={index}
                className="border-border/50 hover:border-roam-light-blue/50 transition-all duration-300 hover:shadow-xl"
              >
                <CardContent className="p-8">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-5 h-5 text-roam-yellow fill-current"
                      />
                    ))}
                  </div>
                  <Quote className="w-8 h-8 text-roam-light-blue mb-4" />
                  <p className="text-foreground/80 mb-6 leading-relaxed italic">
                    "{testimonial.content}"
                  </p>
                  <div>
                    <div className="font-semibold text-foreground">
                      {testimonial.name}
                    </div>
                    <div className="text-foreground/60 text-sm">
                      {testimonial.role}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-r from-roam-blue to-roam-light-blue">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
            Join thousands of satisfied customers who have discovered the
            convenience of professional services delivered directly to them.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="bg-white text-roam-blue hover:bg-white/90 px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              <Link to="/home" className="flex items-center gap-2">
                Book Your First Service
                <Calendar className="w-5 h-5" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white px-8 py-4 text-lg font-semibold transition-all duration-300"
            >
              <Link to="/providers" className="flex items-center gap-2">
                Become a Provider
                <TrendingUp className="w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground/5 border-t border-border/50 py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2Fa42b6f9ec53e4654a92af75aad56d14f%2F38446bf6c22b453fa45caf63b0513e21?format=webp&width=800"
                alt="ROAM - Your Best Life. Everywhere."
                className="h-8 w-auto mb-4"
              />
              <p className="text-foreground/70 leading-relaxed">
                Connecting you with verified professionals for all your service
                needs.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Services</h4>
              <ul className="space-y-2 text-foreground/70">
                <li>
                  <Link
                    to="/home"
                    className="hover:text-roam-blue transition-colors"
                  >
                    Beauty
                  </Link>
                </li>
                <li>
                  <Link
                    to="/home"
                    className="hover:text-roam-blue transition-colors"
                  >
                    Fitness
                  </Link>
                </li>
                <li>
                  <Link
                    to="/home"
                    className="hover:text-roam-blue transition-colors"
                  >
                    Therapy
                  </Link>
                </li>
                <li>
                  <Link
                    to="/home"
                    className="hover:text-roam-blue transition-colors"
                  >
                    Healthcare
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-2 text-foreground/70">
                <li>
                  <Link
                    to="/about"
                    className="hover:text-roam-blue transition-colors"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="hover:text-roam-blue transition-colors"
                  >
                    Contact
                  </Link>
                </li>
                <li>
                  <Link
                    to="/support"
                    className="hover:text-roam-blue transition-colors"
                  >
                    Support
                  </Link>
                </li>
                <li>
                  <Link
                    to="/providers"
                    className="hover:text-roam-blue transition-colors"
                  >
                    Become a Provider
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Connect</h4>
              <p className="text-foreground/70 mb-4">
                Follow us for updates and tips from our community of
                professionals.
              </p>
              <div className="flex space-x-3">
                <div className="w-10 h-10 bg-roam-light-blue/20 rounded-lg flex items-center justify-center hover:bg-roam-light-blue/30 transition-colors cursor-pointer">
                  <Globe className="w-5 h-5 text-roam-blue" />
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-border/50 mt-8 pt-8 text-center text-foreground/60">
            <p>
              &copy; 2024 ROAM. All rights reserved. Connecting you with
              professional services.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
