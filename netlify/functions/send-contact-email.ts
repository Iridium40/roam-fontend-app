import { Handler } from "@netlify/functions";

export const handler: Handler = async (event, context) => {
  console.log("Contact form function called with method:", event.httpMethod);

  // Enable CORS
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
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
    console.log("Invalid method:", event.httpMethod);
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    console.log("Processing contact form submission...");

    if (!event.body) {
      console.log("No request body provided");
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing request body" }),
      };
    }

    let requestData;
    try {
      requestData = JSON.parse(event.body);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Invalid JSON in request body" }),
      };
    }

    const { to, from, subject, html } = requestData;
    console.log("Form data received:", { to, from, subject: subject?.substring(0, 50) });

    // Validate required fields
    if (!to || !from || !subject || !html) {
      console.log("Missing required fields:", { to: !!to, from: !!from, subject: !!subject, html: !!html });
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Missing required fields",
          missing: {
            to: !to,
            from: !from,
            subject: !subject,
            html: !html
          }
        }),
      };
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(from)) {
      console.log("Invalid email format:", from);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Invalid email format" }),
      };
    }

    // Log the contact form submission for now
    console.log("Contact form submission:", {
      to,
      from,
      subject,
      timestamp: new Date().toISOString(),
      bodyLength: html.length
    });

    // For production, you would implement actual email sending here
    // Examples:
    // - SendGrid: await sgMail.send(msg)
    // - Resend: await resend.emails.send(msg)
    // - AWS SES: await ses.sendEmail(params).promise()

    // Store in database for manual follow-up (optional)
    // This could be added later to track contact submissions

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
        details: error instanceof Error ? error.message : "Unknown error"
      }),
    };
  }
};
