import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const supabase = createClient(
  process.env.VITE_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextRequest) {
  if (req.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Verify the JWT token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { user_id, return_url } = await req.json();

    // Validate that the user_id matches the authenticated user
    if (user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if user already has a verification session
    const { data: existingVerification } = await supabase
      .from('provider_verifications')
      .select('stripe_verification_session_id, verification_status')
      .eq('user_id', user_id)
      .eq('verification_type', 'identity')
      .single();

    // If there's an existing session that's not completed, return it
    if (existingVerification && 
        ['requires_input', 'processing'].includes(existingVerification.verification_status)) {
      
      // Retrieve the existing session from Stripe
      try {
        const existingSession = await stripe.identity.verificationSessions.retrieve(
          existingVerification.stripe_verification_session_id
        );
        
        return NextResponse.json({
          id: existingSession.id,
          status: existingSession.status,
          url: existingSession.url,
          client_secret: existingSession.client_secret
        });
      } catch (stripeError) {
        console.error('Error retrieving existing Stripe session:', stripeError);
        // Continue to create a new session if the existing one is invalid
      }
    }

    // Create a new Stripe Identity verification session
    const verificationSession = await stripe.identity.verificationSessions.create({
      type: 'document',
      metadata: {
        user_id: user_id,
        purpose: 'provider_onboarding'
      },
      options: {
        document: {
          allowed_types: ['driving_license', 'passport', 'id_card'],
          require_id_number: true,
          require_live_capture: true,
          require_matching_selfie: true,
        },
      },
      return_url: return_url || `${req.headers.get('origin')}/provider-onboarding?verification=complete`,
    });

    // Store the verification session in our database
    const { error: insertError } = await supabase
      .from('provider_verifications')
      .upsert({
        user_id: user_id,
        stripe_verification_session_id: verificationSession.id,
        verification_status: verificationSession.status,
        verification_type: 'identity',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Error storing verification session:', insertError);
      // Continue anyway, as the Stripe session was created successfully
    }

    return NextResponse.json({
      id: verificationSession.id,
      status: verificationSession.status,
      url: verificationSession.url,
      client_secret: verificationSession.client_secret
    });

  } catch (error) {
    console.error('Error creating verification session:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: `Stripe error: ${error.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const config = {
  runtime: 'edge',
};
