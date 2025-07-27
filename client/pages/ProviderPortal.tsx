import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Sparkles, 
  ArrowLeft,
  Users,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Shield,
  DollarSign,
  Calendar,
  CheckCircle,
  Phone,
  User,
  Building,
  Star
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

export default function ProviderPortal() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  
  const [loginData, setLoginData] = useState({
    email: "",
    password: ""
  });

  const [signupData, setSignupData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    businessName: "",
    agreedToTerms: false,
    agreedToBackground: false
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      // Redirect to provider dashboard
      window.location.href = "/provider-dashboard";
    }, 2000);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      // Redirect to onboarding flow
      window.location.href = "/provider-onboarding";
    }, 2000);
  };

  const benefits = [
    {
      icon: DollarSign,
      title: "You Control Your Earnings",
      description: "Keep everything you charge (minus payout transaction fee only)"
    },
    {
      icon: Calendar,
      title: "Flexible Schedule",
      description: "Control when and where you work"
    },
    {
      icon: Users,
      title: "Quality Clients",
      description: "Connect with verified customers"
    },
    {
      icon: Shield,
      title: "Full Support",
      description: "Rescheduling and Cancellation 24/7 support"
    }
  ];

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
              <div className="flex items-center">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2Fa42b6f9ec53e4654a92af75aad56d14f%2F38446bf6c22b453fa45caf63b0513e21?format=webp&width=800"
                  alt="ROAM - Your Best Life. Everywhere."
                  className="h-8 w-auto"
                />
              </div>
            </div>
            <div className="text-sm text-foreground/60">
              Provider Portal
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            
            {/* Left Side - Benefits */}
            <div className="space-y-8">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold mb-4">
                  Welcome to the <span className="text-roam-blue">Provider Portal</span>
                </h1>
                <p className="text-lg text-foreground/70 mb-8">
                  Join Florida's premier network of service professionals and start growing your business today.
                </p>
              </div>

              {/* Benefits Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {benefits.map((benefit, index) => (
                  <Card key={index} className="border-border/50">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-roam-blue to-roam-light-blue rounded-lg flex items-center justify-center mb-4">
                        <benefit.icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-semibold mb-2">{benefit.title}</h3>
                      <p className="text-sm text-foreground/70">{benefit.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Success Stories */}
              <Card className="bg-gradient-to-r from-roam-light-blue/10 to-roam-blue/10 border-roam-light-blue/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-roam-blue">
                    <Star className="w-5 h-5" />
                    Provider Success Stories
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-foreground/80 italic mb-2">
                      "ROAM has transformed my massage therapy business. I've tripled my income and love the flexibility!"
                    </p>
                    <p className="text-xs text-foreground/60">- Sarah J., Licensed Massage Therapist</p>
                  </div>
                  <div>
                    <p className="text-sm text-foreground/80 italic mb-2">
                      "The platform is easy to use and the customers are always respectful and verified."
                    </p>
                    <p className="text-xs text-foreground/60">- Michael C., Personal Trainer</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Side - Auth Forms */}
            <div className="w-full max-w-md mx-auto lg:mx-0">
              <Card className="border-border/50 shadow-lg">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-roam-blue to-roam-light-blue rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl">Provider Access</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                      <TabsTrigger value="login" className="data-[state=active]:bg-roam-blue data-[state=active]:text-white">
                        Sign In
                      </TabsTrigger>
                      <TabsTrigger value="signup" className="data-[state=active]:bg-roam-blue data-[state=active]:text-white">
                        Get Started
                      </TabsTrigger>
                    </TabsList>

                    {/* Login Form */}
                    <TabsContent value="login">
                      <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="login-email">Email Address</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                              id="login-email"
                              type="email"
                              placeholder="provider@example.com"
                              className="pl-10"
                              value={loginData.email}
                              onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="login-password">Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                              id="login-password"
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter your password"
                              className="pl-10 pr-10"
                              value={loginData.password}
                              onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                              required
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-2">
                            <Checkbox id="remember" />
                            <Label htmlFor="remember" className="text-sm font-normal">
                              Remember me
                            </Label>
                          </div>
                          <Button variant="link" className="p-0 h-auto text-roam-blue">
                            Forgot password?
                          </Button>
                        </div>

                        <Button 
                          type="submit" 
                          className="w-full bg-roam-blue hover:bg-roam-blue/90" 
                          disabled={isLoading}
                        >
                          {isLoading ? "Signing in..." : "Sign In"}
                        </Button>
                      </form>
                    </TabsContent>

                    {/* Signup Form */}
                    <TabsContent value="signup">
                      <form onSubmit={handleSignup} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                              <Input
                                id="firstName"
                                placeholder="John"
                                className="pl-10"
                                value={signupData.firstName}
                                onChange={(e) => setSignupData({...signupData, firstName: e.target.value})}
                                required
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                              id="lastName"
                              placeholder="Doe"
                              value={signupData.lastName}
                              onChange={(e) => setSignupData({...signupData, lastName: e.target.value})}
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="signup-email">Email Address</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                              id="signup-email"
                              type="email"
                              placeholder="provider@example.com"
                              className="pl-10"
                              value={signupData.email}
                              onChange={(e) => setSignupData({...signupData, email: e.target.value})}
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                              id="phone"
                              type="tel"
                              placeholder="(555) 123-4567"
                              className="pl-10"
                              value={signupData.phone}
                              onChange={(e) => setSignupData({...signupData, phone: e.target.value})}
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="businessName">Business Name</Label>
                          <div className="relative">
                            <Building className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                              id="businessName"
                              placeholder="Your Business Name"
                              className="pl-10"
                              value={signupData.businessName}
                              onChange={(e) => setSignupData({...signupData, businessName: e.target.value})}
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="signup-password">Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                              id="signup-password"
                              type="password"
                              placeholder="Create a strong password"
                              className="pl-10"
                              value={signupData.password}
                              onChange={(e) => setSignupData({...signupData, password: e.target.value})}
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">Confirm Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                              id="confirmPassword"
                              type="password"
                              placeholder="Confirm your password"
                              className="pl-10"
                              value={signupData.confirmPassword}
                              onChange={(e) => setSignupData({...signupData, confirmPassword: e.target.value})}
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-start space-x-2">
                            <Checkbox 
                              id="terms" 
                              checked={signupData.agreedToTerms}
                              onCheckedChange={(checked) => setSignupData({...signupData, agreedToTerms: checked as boolean})}
                            />
                            <Label htmlFor="terms" className="text-sm font-normal leading-none">
                              I agree to the <Button variant="link" className="p-0 h-auto text-roam-blue">Terms of Service</Button> and <Button variant="link" className="p-0 h-auto text-roam-blue">Privacy Policy</Button>
                            </Label>
                          </div>

                          <div className="flex items-start space-x-2">
                            <Checkbox 
                              id="background" 
                              checked={signupData.agreedToBackground}
                              onCheckedChange={(checked) => setSignupData({...signupData, agreedToBackground: checked as boolean})}
                            />
                            <Label htmlFor="background" className="text-sm font-normal leading-none">
                              I consent to background check and identity verification as required by ROAM
                            </Label>
                          </div>
                        </div>

                        <Button 
                          type="submit" 
                          className="w-full bg-roam-blue hover:bg-roam-blue/90" 
                          disabled={isLoading || !signupData.agreedToTerms || !signupData.agreedToBackground}
                        >
                          {isLoading ? "Creating Account..." : "Get Started"}
                        </Button>
                      </form>
                    </TabsContent>
                  </Tabs>

                  {/* Footer */}
                  <div className="mt-6 text-center text-sm text-foreground/60">
                    <p>Need help? <Button variant="link" className="p-0 h-auto text-roam-blue">Contact Support</Button></p>
                  </div>
                </CardContent>
              </Card>

              {/* Security Notice */}
              <Card className="mt-6 bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-900 mb-1">Secure & Verified</h4>
                      <p className="text-sm text-green-800">
                        All provider applications undergo comprehensive background checks and identity verification 
                        for the safety of our customers and platform integrity.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
