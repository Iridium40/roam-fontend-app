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
    const { action, bookingId, message, customerPhone, staffName, staffRole } = JSON.parse(event.body);

    const accountSid = process.env.VITE_TWILIO_ACCOUNT_SID;
    const authToken = process.env.VITE_TWILIO_AUTH_TOKEN;
    const twilioPhone = process.env.VITE_TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !twilioPhone) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Twilio credentials not configured' }),
      };
    }

    if (action === 'send-message') {
      if (!message || !customerPhone) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Message and customer phone are required' }),
        };
      }

      // Create Twilio client
      const client = require('twilio')(accountSid, authToken);

      // Format message with staff identification
      const formattedMessage = `${message}\n\n- ${staffName} (${staffRole}) from ROAM`;

      // Send SMS
      const messageResponse = await client.messages.create({
        body: formattedMessage,
        from: twilioPhone,
        to: customerPhone,
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          messageSid: messageResponse.sid,
          status: messageResponse.status,
        }),
      };
    }

    if (action === 'get-conversation') {
      // For now, return empty array - in a real implementation,
      // you'd fetch conversation history from a database
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          messages: [],
        }),
      };
    }

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid action' }),
    };

  } catch (error: any) {
    console.error('Twilio API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to process Twilio request',
        details: error.message 
      }),
    };
  }
};

export { handler };
