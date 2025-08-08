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
  const [isLoading, setIsLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string>("");
  const [paymentIntentId, setPaymentIntentId] = useState<string>("");

  // Create payment intent when component mounts
  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        // In development, Netlify functions might not be available
        const functionUrl = import.meta.env.DEV
          ? "/api/create-payment-intent"  // Fallback for development
          : "/.netlify/functions/create-payment-intent";

        const response = await fetch(functionUrl,
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
          console.error("Payment intent request failed:",
            `${response.status} ${response.statusText} - ${response.url}`
          );

          // Clone response to avoid body stream issues
          const responseClone = response.clone();

          try {
            const errorData = await response.json();
            console.error("Error response data:", errorData);
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
          } catch (jsonError) {
            console.error("Failed to parse error response as JSON, trying text...");
            try {
              const responseText = await responseClone.text();
              console.error("Error response text:", responseText);
              throw new Error(`HTTP ${response.status}: ${responseText || response.statusText}`);
            } catch (textError) {
              console.error("Failed to read response body:", textError);
              throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
            }
          }
        }

        const data = await response.json();

        setClientSecret(data.clientSecret);
        setPaymentIntentId(data.paymentIntentId);
      } catch (error: any) {
        console.error("Error creating payment intent:", error);
        onPaymentError(error.message);

        // Provide specific error messages for common issues
        let errorTitle = "Payment Setup Failed";
        let errorDescription = "Unable to initialize payment. Please try again.";

        if (error.message?.includes("Stripe secret key not configured")) {
          errorTitle = "Payment Configuration Error";
          errorDescription = "Payment system is not properly configured. Please contact support.";
        } else if (error.message?.includes("network") || error.message?.includes("fetch")) {
          errorTitle = "Network Error";
          errorDescription = "Unable to connect to payment service. Please check your internet connection.";
        }

        toast({
          title: errorTitle,
          description: errorDescription,
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
