import { Handler } from '@netlify/functions';

const handler: Handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Stripe-Signature',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!endpointSecret) {
      console.error('Stripe webhook secret not configured');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Webhook secret not configured' }),
      };
    }

    // Verify webhook signature
    const sig = event.headers['stripe-signature'];
    let stripeEvent;

    try {
      stripeEvent = stripe.webhooks.constructEvent(event.body, sig, endpointSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid signature' }),
      };
    }

    // Handle the event
    switch (stripeEvent.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(stripeEvent.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(stripeEvent.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${stripeEvent.type}`);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ received: true }),
    };

  } catch (error: any) {
    console.error('Webhook error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Webhook processing failed' }),
    };
  }
};

async function handlePaymentSuccess(paymentIntent: any) {
  try {
    const bookingId = paymentIntent.metadata.booking_id;
    
    if (!bookingId) {
      console.error('No booking ID in payment intent metadata');
      return;
    }

    // Initialize Supabase
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Update booking payment status
    const { error } = await supabase
      .from('bookings')
      .update({
        payment_status: 'paid',
        booking_status: 'confirmed'
      })
      .eq('id', bookingId);

    if (error) {
      console.error('Error updating booking payment status:', error);
    } else {
      console.log(`Payment successful for booking ${bookingId}`);
    }

  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentFailure(paymentIntent: any) {
  try {
    const bookingId = paymentIntent.metadata.booking_id;
    
    if (!bookingId) {
      console.error('No booking ID in payment intent metadata');
      return;
    }

    // Initialize Supabase
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Update booking payment status
    const { error } = await supabase
      .from('bookings')
      .update({
        payment_status: 'failed',
        booking_status: 'cancelled'
      })
      .eq('id', bookingId);

    if (error) {
      console.error('Error updating booking payment status:', error);
    } else {
      console.log(`Payment failed for booking ${bookingId}`);
    }

  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

export { handler };
