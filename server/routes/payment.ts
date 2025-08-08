import { RequestHandler } from "express";

export const createPaymentIntent: RequestHandler = async (req, res) => {
  try {
    const {
      bookingId,
      totalAmount,
      serviceFee,
      customerEmail,
      customerName,
      businessName,
      serviceName,
    } = req.body;

    if (!bookingId || !totalAmount || !customerEmail) {
      return res.status(400).json({
        error: "Booking ID, total amount, and customer email are required",
      });
    }

    // Check if Stripe secret key is available
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({
        error:
          "Stripe secret key not configured. Please set STRIPE_SECRET_KEY environment variable.",
      });
    }

    // Initialize Stripe
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

    // Convert to cents (Stripe expects amounts in cents)
    const amountInCents = Math.round(totalAmount * 100);

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd",
      customer_email: customerEmail,
      metadata: {
        booking_id: bookingId,
        service_fee: serviceFee ? (serviceFee * 100).toString() : "0",
        customer_name: customerName || "",
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
