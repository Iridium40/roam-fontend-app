import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  MapPin, 
  Clock, 
  Shield, 
  Star, 
  ArrowRight,
  Heart,
  Scissors,
  Dumbbell,
  Home,
  Stethoscope,
  Massage,
  ChevronRight,
  Users,
  TrendingUp,
  Award
} from "lucide-react";

export default function Index() {
  const services = [
    { icon: Scissors, name: "Beauty & Wellness", count: "150+ providers" },
    { icon: Dumbbell, name: "Personal Training", count: "80+ trainers" },
    { icon: Massage, name: "Massage Therapy", count: "120+ therapists" },
    { icon: Home, name: "Home Services", count: "200+ professionals" },
    { icon: Stethoscope, name: "Healthcare", count: "90+ specialists" },
    { icon: Heart, name: "Wellness Coaching", count: "60+ coaches" },
  ];

  const stats = [
    { icon: Users, value: "10,000+", label: "Happy Customers" },
    { icon: Star, value: "4.9/5", label: "Average Rating" },
    { icon: TrendingUp, value: "50,000+", label: "Services Completed" },
    { icon: Award, value: "700+", label: "Verified Providers" },
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      service: "Mobile Massage",
      rating: 5,
      text: "Incredible service! The therapist arrived exactly on time and provided an amazing massage in the comfort of my home.",
      location: "Miami, FL"
    },
    {
      name: "Michael Chen",
      service: "Personal Training",
      rating: 5,
      text: "My trainer comes to my home gym twice a week. It's so convenient and the results have been fantastic!",
      location: "Orlando, FL"
    },
    {
      name: "Emily Rodriguez",
      service: "Home Cleaning",
      rating: 5,
      text: "Professional, thorough, and trustworthy. ROAM's cleaning service has been a game-changer for our busy family.",
      location: "Tampa, FL"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-roam-light-blue/10">
      {/* Navigation */}
      <nav className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-roam-blue to-roam-light-blue rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-roam-blue to-roam-light-blue bg-clip-text text-transparent">
                ROAM
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#services" className="text-foreground/70 hover:text-roam-blue transition-colors">Services</a>
              <a href="#how-it-works" className="text-foreground/70 hover:text-roam-blue transition-colors">How it Works</a>
              <a href="#providers" className="text-foreground/70 hover:text-roam-blue transition-colors">Become a Provider</a>
              <Button variant="outline" className="border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white">
                Sign In
              </Button>
              <Button className="bg-roam-blue hover:bg-roam-blue/90">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 bg-roam-light-blue/20 text-roam-blue border-roam-light-blue/30">
              🚀 Now serving all of Florida
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-roam-blue via-foreground to-roam-blue bg-clip-text text-transparent leading-tight">
              Premium Services
              <br />
              <span className="text-roam-blue">Delivered Anywhere</span>
            </h1>
            <p className="text-xl text-foreground/70 mb-8 max-w-2xl mx-auto leading-relaxed">
              Connect with verified professionals who bring top-tier beauty, wellness, fitness, and home services directly to your location. Experience luxury and convenience like never before.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" className="bg-roam-blue hover:bg-roam-blue/90 text-lg px-8 py-6">
                <MapPin className="w-5 h-5 mr-2" />
                Find Services Near You
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button size="lg" variant="outline" className="border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white text-lg px-8 py-6">
                <Clock className="w-5 h-5 mr-2" />
                Book Now
              </Button>
            </div>
            
            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-foreground/60">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-roam-success" />
                Background Verified
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-roam-warning" />
                5-Star Professionals
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-roam-info" />
                Same-Day Booking
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section id="services" className="py-20 bg-background/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Premium Services <span className="text-roam-blue">At Your Location</span>
            </h2>
            <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
              From beauty and wellness to fitness and home care, discover our curated selection of professional services.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border/50 hover:border-roam-light-blue/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-roam-blue to-roam-light-blue rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <service.icon className="w-6 h-6 text-white" />
                    </div>
                    <ChevronRight className="w-5 h-5 text-foreground/40 group-hover:text-roam-blue group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-roam-blue transition-colors">
                    {service.name}
                  </h3>
                  <p className="text-sm text-foreground/60">{service.count}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-roam-blue to-roam-light-blue rounded-full flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-roam-blue mb-2">{stat.value}</div>
                <div className="text-sm text-foreground/60">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-background/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              How <span className="text-roam-blue">ROAM</span> Works
            </h2>
            <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
              Getting premium services has never been easier. Book, relax, and enjoy professional care at your location.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: "01",
                title: "Choose Your Service",
                description: "Browse our curated selection of premium services and select the one that fits your needs."
              },
              {
                step: "02", 
                title: "Book Your Provider",
                description: "Select from verified professionals, choose your preferred time, and confirm your booking."
              },
              {
                step: "03",
                title: "Enjoy at Your Location",
                description: "Relax while our professional arrives at your chosen location and delivers exceptional service."
              }
            ].map((step, index) => (
              <div key={index} className="text-center relative">
                {index < 2 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-gradient-to-r from-roam-light-blue to-roam-blue/20 transform translate-x-8"></div>
                )}
                <div className="w-16 h-16 bg-gradient-to-br from-roam-blue to-roam-light-blue rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-lg relative z-10">
                  {step.step}
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-foreground/70">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              What Our <span className="text-roam-blue">Customers Say</span>
            </h2>
            <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
              Join thousands of satisfied customers who trust ROAM for their service needs.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-roam-warning fill-current" />
                    ))}
                  </div>
                  <p className="text-foreground/80 mb-4 italic">"{testimonial.text}"</p>
                  <div className="border-t pt-4">
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-foreground/60">{testimonial.service} • {testimonial.location}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-roam-blue to-roam-light-blue">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Experience Premium Service?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of Floridians who trust ROAM for their service needs. Book your first appointment today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="bg-white text-roam-blue hover:bg-white/90 text-lg px-8 py-6">
              <MapPin className="w-5 h-5 mr-2" />
              Find Services
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-roam-blue text-lg px-8 py-6">
              Become a Provider
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background/80">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-roam-blue to-roam-light-blue rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-roam-blue to-roam-light-blue bg-clip-text text-transparent">
                  ROAM
                </span>
              </div>
              <p className="text-foreground/70 mb-4 max-w-md">
                Florida's premier on-demand services marketplace. Connecting customers with verified professionals for premium services delivered anywhere.
              </p>
              <div className="flex space-x-4">
                <Badge variant="outline" className="border-roam-blue text-roam-blue">
                  🛡️ Verified Providers
                </Badge>
                <Badge variant="outline" className="border-roam-blue text-roam-blue">
                  ⭐ 5-Star Quality
                </Badge>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-sm text-foreground/70">
                <li><a href="#" className="hover:text-roam-blue transition-colors">Beauty & Wellness</a></li>
                <li><a href="#" className="hover:text-roam-blue transition-colors">Personal Training</a></li>
                <li><a href="#" className="hover:text-roam-blue transition-colors">Massage Therapy</a></li>
                <li><a href="#" className="hover:text-roam-blue transition-colors">Home Services</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-foreground/70">
                <li><a href="#" className="hover:text-roam-blue transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-roam-blue transition-colors">Become a Provider</a></li>
                <li><a href="#" className="hover:text-roam-blue transition-colors">Support</a></li>
                <li><a href="#" className="hover:text-roam-blue transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t pt-8 mt-8 text-center text-sm text-foreground/60">
            <p>&copy; 2024 ROAM. All rights reserved. Proudly serving Florida with premium on-demand services.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
