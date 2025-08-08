import { Handler } from '@netlify/functions';

const handler: Handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  if (!event.body) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Request body is required' }),
    };
  }

  try {
    const { 
      bookingId, 
      totalAmount, 
      serviceFee, 
      customerEmail, 
      customerName,
      businessName,
      serviceName 
    } = JSON.parse(event.body);

    if (!bookingId || !totalAmount || !customerEmail) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Booking ID, total amount, and customer email are required' 
        }),
      };
    }

    // Initialize Stripe
    console.log('Environment check:', {
      hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
      keyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 10),
    });

    if (!process.env.STRIPE_SECRET_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Stripe secret key not configured'
        }),
      };
    }

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    // Convert to cents (Stripe expects amounts in cents)
    const amountInCents = Math.round(totalAmount * 100);

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      customer_email: customerEmail,
      metadata: {
        booking_id: bookingId,
        service_fee: serviceFee ? (serviceFee * 100).toString() : '0',
        customer_name: customerName || '',
        business_name: businessName || '',
        service_name: serviceName || '',
        payment_type: 'booking_payment'
      },
      description: `Booking payment for ${serviceName || 'service'} at ${businessName || 'business'}`,
      receipt_email: customerEmail,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: totalAmount,
        currency: 'usd'
      }),
    };

  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to create payment intent',
        details: error.message 
      }),
    };
  }
};

export { handler };
