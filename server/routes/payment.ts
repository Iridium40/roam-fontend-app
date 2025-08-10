import { RequestHandler } from "express";
import Stripe from "stripe";

export const createPaymentIntent: RequestHandler = async (req, res) => {
  try {
    console.log("💳 Payment Intent Request:", {
      method: req.method,
      headers: req.headers,
      body: req.body,
    });

    const {
      bookingId,
      totalAmount,
      serviceFee,
      customerEmail,
      customerName,
      businessName,
      serviceName,
    } = req.body;

    console.log("💳 Extracted values:", {
      bookingId,
      totalAmount,
      serviceFee,
      customerEmail,
      customerName,
      businessName,
      serviceName,
    });

    if (!bookingId || !totalAmount || !customerEmail) {
      console.log("❌ Missing required fields:", { bookingId, totalAmount, customerEmail });
      return res.status(400).json({
        error: "Booking ID, total amount, and customer email are required",
      });
    }

    // Validate totalAmount is a number
    const amount = typeof totalAmount === 'string' ? parseFloat(totalAmount) : totalAmount;
    if (isNaN(amount) || amount <= 0) {
      console.log("❌ Invalid amount:", { totalAmount, parsedAmount: amount });
      return res.status(400).json({
        error: "Total amount must be a valid positive number",
      });
    }

    // Check if Stripe secret key is available
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({
        error:
          "Stripe secret key not configured. Please set STRIPE_SECRET_KEY environment variable.",
      });
    }

    // Initialize Stripe with proper ES import
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-12-18.acacia",
    });

    // Convert to cents (Stripe expects amounts in cents)
    const amountInCents = Math.round(totalAmount * 100);

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd",
      metadata: {
        booking_id: bookingId,
        service_fee: serviceFee ? (serviceFee * 100).toString() : "0",
        customer_name: customerName || "",
        customer_email: customerEmail || "",
        business_name: businessName || "",
        service_name: serviceName || "",
        payment_type: "booking_payment",
      },
      description: `Booking payment for ${serviceName || "service"} at ${businessName || "business"}`,
      receipt_email: customerEmail,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: totalAmount,
      currency: "usd",
    });
  } catch (error: any) {
    console.error("Error creating payment intent:", error);
    res.status(500).json({
      error: "Failed to create payment intent",
      details: error.message,
    });
  }
};
