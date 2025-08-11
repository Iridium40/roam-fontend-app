import { Handler } from "@netlify/functions";

const handler: Handler = async (event, context) => {
  // Enable CORS
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  // Handle preflight request
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing request body" }),
      };
    }

    const { to, from, subject, html } = JSON.parse(event.body);

    // Validate required fields
    if (!to || !from || !subject || !html) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing required fields" }),
      };
    }

    // Here you would typically use a service like SendGrid, Resend, or similar
    // For now, we'll use a simple email service or store in database for follow-up
    
    // Example with SendGrid (you'll need to install @sendgrid/mail and set API key)
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    // const msg = {
    //   to,
    //   from: 'noreply@roamyourbestlife.com', // Must be verified sender
    //   subject,
    //   html,
    //   replyTo: from,
    // };
    
    // await sgMail.send(msg);

    // For now, we'll simulate success and log the contact form submission
    console.log("Contact form submission:", {
      to,
      from,
      subject,
      timestamp: new Date().toISOString(),
    });

    // You could also store this in your Supabase database for tracking
    // const supabaseAdmin = createClient(
    //   process.env.SUPABASE_URL!,
    //   process.env.SUPABASE_SERVICE_ROLE_KEY!
    // );
    
    // await supabaseAdmin.from('contact_submissions').insert({
    //   from_email: from,
    //   subject,
    //   message: html,
    //   created_at: new Date().toISOString(),
    // });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        message: "Contact form submitted successfully" 
      }),
    };
  } catch (error) {
    console.error("Error processing contact form:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: "Internal server error",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }),
    };
  }
};

export { handler };
