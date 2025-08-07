// Simplified Edge Function implementation for updateCustomerProfile
export const updateCustomerProfileViaEdgeFunction = async (
  baseURL: string,
  apiKey: string,
  accessToken: string | null,
  customerId: string,
  updateData: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string | null;
    date_of_birth?: string | null;
    bio?: string | null;
    image_url?: string | null;
  },
): Promise<void> => {
  console.log("Using Edge Function for customer profile update", {
    customerId,
    updateData,
    hasAccessToken: !!accessToken,
  });

  try {
    const response = await fetch(
      `${baseURL}/functions/v1/update-customer-profile`,
      {
        method: "POST",
        headers: {
          apikey: apiKey,
          Authorization: `Bearer ${accessToken || apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: customerId,
          ...updateData,
        }),
      },
    );

    const responseText = await response.text();

    console.log("Edge Function response", {
      status: response.status,
      statusText: response.statusText,
      responseText,
      ok: response.ok,
    });

    if (!response.ok) {
      let errorMessage;
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.error || errorData.message || responseText;
      } catch {
        errorMessage = responseText || `HTTP ${response.status} - ${response.statusText}`;
      }

      // Handle specific error types
      if (response.status === 401) {
        throw new Error("Authentication failed. Please sign in again.");
      } else if (response.status === 409) {
        throw new Error(
          `Database conflict occurred: ${errorMessage}. Please try again or contact support.`,
        );
      } else {
        throw new Error(
          `Failed to update customer profile: ${errorMessage}`,
        );
      }
    }

    console.log("Successfully updated customer profile via Edge Function");
  } catch (error: any) {
    console.error("Edge Function error:", error);
    
    // Re-throw with better error message if it's a network error
    if (error.message?.includes('Failed to fetch') || error.message?.includes('ERR_NETWORK')) {
      throw new Error(
        `Connection failed to Supabase Edge Function. Please check your internet connection and try again. Error: ${error.message}`,
      );
    }
    
    throw error;
  }
};
