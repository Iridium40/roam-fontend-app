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
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Stripe secret key not configured. Please check environment variables.'
        }),
      };
    }

    const stripe = require('stripe')(stripeSecretKey);

    // Convert to cents (Stripe expects amounts in cents)
    const amountInCents = Math.round(totalAmount * 100);

    // Create or retrieve Stripe customer
    let stripeCustomer;
    try {
      // First, try to find existing customer by email
      const existingCustomers = await stripe.customers.list({
        email: customerEmail,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        stripeCustomer = existingCustomers.data[0];
      } else {
        // Create new Stripe customer
        stripeCustomer = await stripe.customers.create({
          email: customerEmail,
          name: customerName,
          metadata: {
            booking_id: bookingId,
            source: 'roam_booking_platform'
          },
        });
      }
    } catch (error) {
      console.error('Error creating/retrieving Stripe customer:', error);
      // Continue without customer if there's an error
      stripeCustomer = null;
    }

    // Create payment intent
    const paymentIntentData: any = {
      amount: amountInCents,
      currency: 'usd',
      metadata: {
        booking_id: bookingId,
        service_fee: serviceFee ? (serviceFee * 100).toString() : '0',
        customer_name: customerName || '',
        customer_email: customerEmail || '',
        business_name: businessName || '',
        service_name: serviceName || '',
        payment_type: 'booking_payment',
        stripe_customer_id: stripeCustomer?.id || ''
      },
      description: `Booking payment for ${serviceName || 'service'} at ${businessName || 'business'}`,
      receipt_email: customerEmail,
      automatic_payment_methods: {
        enabled: true,
      },
    };

    // Associate with Stripe customer if available
    if (stripeCustomer) {
      paymentIntentData.customer = stripeCustomer.id;
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        stripeCustomerId: stripeCustomer?.id || null,
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
