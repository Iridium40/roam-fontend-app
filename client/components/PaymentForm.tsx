import React, { useState, useEffect } from "react";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
  PaymentElement,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { Loader2, CreditCard, Lock } from "lucide-react";

// Initialize Stripe with error handling for CSP issues
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY, {
  stripeAccount: undefined, // Not using Stripe Connect
}).catch((error) => {
  console.error('Failed to load Stripe:', error);
  console.warn('This might be due to Content Security Policy restrictions.');
  return null;
});

interface PaymentFormProps {
  bookingId: string;
  totalAmount: number;
  serviceFee: number;
  customerEmail: string;
  customerName: string;
  businessName: string;
  serviceName: string;
  onPaymentSuccess: (paymentIntentId: string) => void;
  onPaymentError: (error: string) => void;
}

const PaymentFormContent: React.FC<PaymentFormProps> = ({
  bookingId,
  totalAmount,
  serviceFee,
  customerEmail,
  customerName,
  businessName,
  serviceName,
  onPaymentSuccess,
  onPaymentError,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const { customer, isCustomer } = useAuth();
  
  // Debug log to see what customer data is available
  console.log('💳 PaymentForm: Customer data debug:', { 
    isCustomer, 
    customer, 
    customerHasUserId: !!customer?.user_id,
    customerKeys: customer ? Object.keys(customer) : 'no customer'
  });
  
  // Test Stripe sync directly since we have customer data with user_id
  useEffect(() => {
    if (isCustomer && customer?.user_id) {
      console.log('🧪 Testing Stripe sync with mock customer ID...');
      syncStripeCustomerToSupabase('cus_test_mock_customer_id');
    }
  }, [isCustomer, customer?.user_id]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string>("");
  const [paymentIntentId, setPaymentIntentId] = useState<string>("");
  const [stripeCustomerId, setStripeCustomerId] = useState<string>("");

  // Function to sync Stripe customer ID to Supabase
  const syncStripeCustomerToSupabase = async (stripeCustomerId: string) => {
    console.log('Stripe sync debug:', { 
      isCustomer, 
      customer, 
      customerUserId: customer?.user_id, 
      stripeCustomerId 
    });
    
    if (!isCustomer || !customer?.user_id || !stripeCustomerId) {
      console.log('Skipping Stripe customer sync - not authenticated customer or missing IDs');
      return;
    }

    try {
      // Check if stripe profile already exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('customer_stripe_profiles')
        .select('id')
        .eq('user_id', customer.user_id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error checking existing Stripe profile:', fetchError);
        return;
      }

      if (existingProfile) {
        // Update existing profile
        const { error } = await supabase
          .from('customer_stripe_profiles')
          .update({ 
            stripe_customer_id: stripeCustomerId,
            stripe_email: customerEmail 
          })
          .eq('user_id', customer.user_id);

        if (error) {
          console.error('Error updating Stripe customer profile:', error);
        } else {
          console.log('Stripe customer profile updated successfully');
        }
      } else {
        // Create new profile
        const { error } = await supabase
          .from('customer_stripe_profiles')
          .insert({
            user_id: customer.user_id,
            stripe_customer_id: stripeCustomerId,
            stripe_email: customerEmail
          });

        if (error) {
          console.error('Error creating Stripe customer profile:', error);
        } else {
          console.log('Successfully created Stripe customer profile:', stripeCustomerId);
        }
      }
    } catch (error) {
      console.error('Error syncing Stripe customer ID:', error);
    }
  };

  // Create payment intent when component mounts
  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        // Check if we're in development environment
        const isDevelopment = window.location.hostname === "localhost" ||
                              window.location.hostname.includes("fly.dev") ||
                              window.location.hostname.includes("vercel.app");

        console.log("Payment setup - Environment:", {
          hostname: window.location.hostname,
          isDevelopment,
          origin: window.location.origin
        });

        const response = await fetch(
          "/api/create-payment-intent",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              bookingId,
              totalAmount,
              serviceFee,
              customerEmail,
              customerName,
              businessName,
              serviceName,
            }),
          },
        );

        // Check response status before reading body
        if (!response.ok) {
          // Log error and throw to try fallback if needed
          console.log(`❌ Primary API endpoint failed with status: ${response.status}`);
          throw new Error(`API endpoint failed with status: ${response.status}`);

          // For other errors, try to get error message
          let errorMessage = `HTTP error! status: ${response.status}`;
          try {
            // Clone response before reading to avoid "body already used" error
            const responseClone = response.clone();
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (jsonError) {
            // If JSON parsing fails, response body might be text or empty
            console.warn("Could not parse error response as JSON");
          }

          throw new Error(errorMessage);
        }

        const data = await response.json();

        setClientSecret(data.clientSecret);
        setPaymentIntentId(data.paymentIntentId);
        setStripeCustomerId(data.stripeCustomerId || "");
        
        // Sync Stripe customer ID to Supabase if available
        if (data.stripeCustomerId) {
          await syncStripeCustomerToSupabase(data.stripeCustomerId);
        }
      } catch (error: any) {
        // Don't log as error if it's just the expected Netlify 404
        if (error.message.includes("Using fallback endpoint")) {
          console.log("🔄 Netlify function unavailable, trying Express server...");
        } else {
          console.error("Error creating payment intent:", error);
        }

        // Try fallback server endpoint if Netlify functions fail
        try {
          console.log("🚀 Attempting payment via Express server endpoint...");
          const fallbackResponse = await fetch("/api/create-payment-intent", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              bookingId,
              totalAmount,
              serviceFee,
              customerEmail,
              customerName,
              businessName,
              serviceName,
            }),
          });

          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            setClientSecret(fallbackData.clientSecret);
            setPaymentIntentId(fallbackData.paymentIntentId);
            setStripeCustomerId(fallbackData.stripeCustomerId || "");
            console.log("✅ Payment intent successfully created via fallback endpoint:", {
              paymentIntentId: fallbackData.paymentIntentId,
              hasClientSecret: !!fallbackData.clientSecret
            });

            // Show success toast to confirm payment setup worked
            toast({
              title: "Payment Ready",
              description: "Payment system initialized successfully.",
              variant: "default",
            });
            return;
          } else {
            console.error("Fallback endpoint failed with status:", fallbackResponse.status);
            const fallbackErrorText = await fallbackResponse.text().catch(() => "Could not read response");
            console.error("Fallback endpoint error:", fallbackErrorText);
          }
        } catch (fallbackError) {
          console.error("Fallback endpoint also failed:", fallbackError);
        }

        // If both endpoints fail, use mock mode for development/testing
        const isDevelopment = window.location.hostname === "localhost" || window.location.hostname.includes("fly.dev");
        if (isDevelopment) {
          console.warn("Both payment endpoints failed, using mock mode for development/testing");
          setClientSecret("pi_mock_development_client_secret_for_testing");
          setPaymentIntentId("pi_mock_payment_intent_id");
          toast({
            title: "Development Mode",
            description: "Using mock payment for testing purposes.",
            variant: "default",
          });
          return;
        }

        // For production, show error but don't break the flow
        console.error("All payment endpoints failed in production");
        onPaymentError(error.message);
        toast({
          title: "Payment Setup Failed",
          description: "Unable to initialize payment. Please contact support.",
          variant: "destructive",
        });
      }
    };

    createPaymentIntent();
  }, [
    bookingId,
    totalAmount,
    serviceFee,
    customerEmail,
    customerName,
    businessName,
    serviceName,
  ]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!clientSecret) {
      return;
    }

    setIsLoading(true);

    try {
      // Check if we're in mock development mode
      if (clientSecret.includes("mock")) {
        console.log("🧪 Mock payment processing in development mode");

        // Simulate payment processing delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Simulate successful payment
        const mockPaymentIntentId = `pi_mock_${Date.now()}`;
        console.log("Mock payment succeeded:", mockPaymentIntentId);

        onPaymentSuccess(mockPaymentIntentId);
        toast({
          title: "Payment Successful! (Mock Mode)",
          description: "Your booking has been confirmed. This was a simulated payment for development.",
        });
        return;
      }

      // Real Stripe payment processing
      if (!stripe || !elements) {
        throw new Error("Stripe not initialized");
      }
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/booking-success?booking_id=${bookingId}`,
          receipt_email: customerEmail,
        },
        redirect: "if_required",
      });

      if (error) {
        console.error("Payment error:", error);
        onPaymentError(error.message || "Payment failed");
        toast({
          title: "Payment Failed",
          description: error.message || "Your payment could not be processed.",
          variant: "destructive",
        });
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        console.log("Payment succeeded:", paymentIntent);
        onPaymentSuccess(paymentIntent.id);
        toast({
          title: "Payment Successful!",
          description: "Your booking has been confirmed and paid.",
        });
      }
    } catch (error: any) {
      console.error("Payment processing error:", error);
      onPaymentError(error.message);
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred during payment.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!clientSecret) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Setting up payment...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Payment Summary */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span>Service: {serviceName}</span>
              <span>${(totalAmount - serviceFee).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Platform Fee (15%)</span>
              <span>${serviceFee.toFixed(2)}</span>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Element */}
          <div className="p-4 border rounded-lg">
            {clientSecret.includes("mock") ? (
              // Development mode - show mock payment form
              <div className="space-y-4">
                <div className="text-center py-8">
                  <div className="text-gray-600 mb-4">
                    <CreditCard className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Development Mode
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Payment processing is in mock mode for development.
                    Click "Pay" to simulate a successful payment.
                  </p>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      💡 To test real payments, deploy to Vercel or run with proper Stripe configuration
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              // Production mode - show real Stripe PaymentElement
              <PaymentElement />
            )}
          </div>

          {/* Security Notice */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Lock className="h-4 w-4" />
            <span>Your payment information is secure and encrypted</span>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={(!stripe && !clientSecret.includes("mock")) || isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Processing Payment...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Pay ${totalAmount.toFixed(2)}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

const PaymentForm: React.FC<PaymentFormProps> = (props) => {
  const [stripeError, setStripeError] = useState<string | null>(null);

  // Handle Stripe loading errors
  useEffect(() => {
    stripePromise.then((stripe) => {
      if (!stripe) {
        setStripeError('Failed to load Stripe. This might be due to security restrictions.');
      }
    }).catch((error) => {
      setStripeError(`Stripe loading error: ${error.message}`);
    });
  }, []);

  if (stripeError) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <div className="text-red-600 mb-4">
            <CreditCard className="h-12 w-12 mx-auto mb-2" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Payment System Unavailable
          </h3>
          <p className="text-gray-600 mb-4">
            {stripeError}
          </p>
          <p className="text-sm text-gray-500">
            Please try refreshing the page or contact support if the issue persists.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <PaymentFormContent {...props} />
    </Elements>
  );
};

export default PaymentForm;
