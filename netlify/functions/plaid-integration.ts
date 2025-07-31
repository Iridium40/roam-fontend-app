import { Handler } from '@netlify/functions';

// Plaid configuration using provided credentials
const PLAID_CLIENT_ID = '670d967ef5ca2b001925eee0';
const PLAID_SECRET = 'b5caf79d242c0fd40a939924c8ef96';
const PLAID_ENV = 'sandbox'; // Change to 'production' for live

interface PlaidLinkTokenRequest {
  business_id: string;
  user_id: string;
  business_name: string;
}

interface PlaidLinkTokenResponse {
  link_token: string;
  expiration: string;
  request_id: string;
}

export const handler: Handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

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
    const body = JSON.parse(event.body || '{}');
    const { action, business_id, user_id, business_name } = body;

    if (action === 'create_plaid_link_token') {
      // Create Plaid Link Token
      const linkTokenRequest = {
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        client_name: business_name || 'ROAM Business',
        country_codes: ['US'],
        language: 'en',
        user: {
          client_user_id: user_id,
        },
        products: ['auth', 'identity'],
        account_filters: {
          depository: {
            account_subtypes: ['checking', 'savings'],
          },
        },
        redirect_uri: null, // For mobile apps
      };

      // Call Plaid API to create link token
      const plaidResponse = await fetch('https://sandbox.plaid.com/link/token/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(linkTokenRequest),
      });

      if (!plaidResponse.ok) {
        const errorData = await plaidResponse.json();
        console.error('Plaid API Error:', errorData);
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            error: 'Failed to create Plaid link token',
            details: errorData 
          }),
        };
      }

      const plaidData: PlaidLinkTokenResponse = await plaidResponse.json();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          link_token: plaidData.link_token,
          expiration: plaidData.expiration,
          request_id: plaidData.request_id,
        }),
      };
    }

    if (action === 'exchange_public_token') {
      const { public_token, account_id, institution } = body;

      // Exchange public token for access token
      const exchangeRequest = {
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        public_token: public_token,
      };

      const exchangeResponse = await fetch('https://sandbox.plaid.com/link/token/exchange', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exchangeRequest),
      });

      if (!exchangeResponse.ok) {
        const errorData = await exchangeResponse.json();
        console.error('Plaid Exchange Error:', errorData);
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            error: 'Failed to exchange public token',
            details: errorData 
          }),
        };
      }

      const exchangeData = await exchangeResponse.json();

      // Get account details
      const accountRequest = {
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        access_token: exchangeData.access_token,
      };

      const accountResponse = await fetch('https://sandbox.plaid.com/accounts/get', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(accountRequest),
      });

      if (!accountResponse.ok) {
        const errorData = await accountResponse.json();
        console.error('Plaid Account Error:', errorData);
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            error: 'Failed to get account details',
            details: errorData 
          }),
        };
      }

      const accountData = await accountResponse.json();

      // TODO: Here you would integrate with Stripe to create an external account
      // and save the bank account information to your database

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          access_token: exchangeData.access_token,
          item_id: exchangeData.item_id,
          accounts: accountData.accounts,
          message: 'Bank account connected successfully'
        }),
      };
    }

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid action' }),
    };

  } catch (error) {
    console.error('Plaid Integration Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};
