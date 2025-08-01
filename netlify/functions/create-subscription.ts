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

  if (!event.body) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Request body is required' }),
    };
  }

  try {
    const { planId, businessId, customerId } = JSON.parse(event.body);

    if (!planId || !businessId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Plan ID and Business ID are required' }),
      };
    }

    // Stripe configuration
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    // Define price IDs for each plan (these would be created in Stripe Dashboard)
    const priceIds = {
      'independent': process.env.STRIPE_INDEPENDENT_PRICE_ID || 'price_independent',
      'small-business': process.env.STRIPE_SMALL_BUSINESS_PRICE_ID || 'price_small_business', 
      'medium-business': process.env.STRIPE_MEDIUM_BUSINESS_PRICE_ID || 'price_medium_business',
      'large-business': process.env.STRIPE_LARGE_BUSINESS_PRICE_ID || 'price_large_business'
    };

    const priceId = priceIds[planId as keyof typeof priceIds];
    
    if (!priceId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid plan ID' }),
      };
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      subscription_data: {
        trial_period_days: 30, // 30-day free trial
        metadata: {
          business_id: businessId,
          plan_id: planId,
        },
      },
      customer_email: customerId, // This should be the customer's email
      success_url: `${process.env.URL || 'http://localhost:8080'}/#subscription?success=true`,
      cancel_url: `${process.env.URL || 'http://localhost:8080'}/#subscription?canceled=true`,
      metadata: {
        business_id: businessId,
        plan_id: planId,
      },
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        sessionId: session.id,
        url: session.url,
      }),
    };

  } catch (error: any) {
    console.error('Stripe subscription error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to create subscription',
        details: error.message 
      }),
    };
  }
};

export { handler };
