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

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

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
        // Check if we're in development and Netlify functions aren't available
        const isDevelopment = window.location.hostname === "localhost";

        const response = await fetch(
          "/.netlify/functions/create-payment-intent",
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
          // If we get a 404 in development, use mock mode
          if (response.status === 404 && isDevelopment) {
            console.warn("Netlify functions not available in development. Using mock payment mode.");
            setClientSecret("pi_mock_development_client_secret_for_testing");
            return;
          }
          
          const errorData = await response
            .json()
            .catch(() => ({ error: "Unknown error" }));
          throw new Error(
            errorData.error || `HTTP error! status: ${response.status}`,
          );
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
        console.error("Error creating payment intent:", error);

        // In development, if fetch fails completely, use mock mode
        if (window.location.hostname === "localhost") {
          setClientSecret("pi_mock_development_client_secret_for_testing");
        }

        onPaymentError(error.message);
        toast({
          title: "Payment Setup Failed",
          description: "Unable to initialize payment. Please try again.",
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

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setIsLoading(true);

    try {
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
            <PaymentElement />
          </div>

          {/* Security Notice */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Lock className="h-4 w-4" />
            <span>Your payment information is secure and encrypted</span>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!stripe || isLoading}
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
  return (
    <Elements stripe={stripePromise}>
      <PaymentFormContent {...props} />
    </Elements>
  );
};

export default PaymentForm;
