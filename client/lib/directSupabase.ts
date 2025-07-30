// Direct Supabase API calls to bypass client hanging issues
const SUPABASE_URL = import.meta.env.VITE_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

interface AuthResponse {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  expires_at?: number;
  refresh_token?: string;
  user?: {
    id: string;
    email: string;
    [key: string]: any;
  };
  session?: any; // May be present in some responses
}

interface ProviderRecord {
  id: string;
  user_id: string;
  business_id: string;
  location_id: string;
  first_name: string;
  last_name: string;
  email: string;
  provider_role: "provider" | "owner" | "dispatcher";
  is_active: boolean;
  [key: string]: any;
}

interface CustomerRecord {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  [key: string]: any;
}

class DirectSupabaseAPI {
  private baseURL: string;
  private apiKey: string;
  private accessToken: string | null = null;

  constructor() {
    this.baseURL = SUPABASE_URL;
    this.apiKey = SUPABASE_ANON_KEY;
  }

  private getHeaders(useAuthToken = false): Record<string, string> {
    const headers: Record<string, string> = {
      apikey: this.apiKey,
      "Content-Type": "application/json",
    };

    if (useAuthToken && this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    } else {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    return headers;
  }

  async signInWithPassword(
    email: string,
    password: string,
  ): Promise<AuthResponse> {
    const response = await fetch(
      `${this.baseURL}/auth/v1/token?grant_type=password`,
      {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          email,
          password,
        }),
      },
    );

    let responseText = "";
    try {
      responseText = await response.text();
    } catch (readError) {
      console.warn("Could not read response text:", readError);
      responseText = `HTTP ${response.status} - ${response.statusText}`;
    }

    if (!response.ok) {
      throw new Error(`Authentication failed: ${responseText}`);
    }

    let authData: AuthResponse;
    try {
      authData = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error(`Invalid response format: ${responseText}`);
    }

    this.accessToken = authData.access_token;
    return authData;
  }

  async getProviderByUserId(userId: string): Promise<ProviderRecord | null> {
    const response = await fetch(
      `${this.baseURL}/rest/v1/providers?user_id=eq.${userId}&is_active=eq.true&select=id,user_id,business_id,location_id,first_name,last_name,email,provider_role,is_active`,
      {
        headers: this.getHeaders(true),
      },
    );

    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(`Provider lookup failed: ${responseText}`);
    }

    let providers: ProviderRecord[];
    try {
      providers = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error(`Invalid response format: ${responseText}`);
    }

    return providers.length > 0 ? providers[0] : null;
  }

  async signOut(): Promise<void> {
    if (!this.accessToken) return;

    try {
      await fetch(`${this.baseURL}/auth/v1/logout`, {
        method: "POST",
        headers: this.getHeaders(true),
      });
    } catch (error) {
      console.warn("Logout request failed:", error);
    } finally {
      this.accessToken = null;
    }
  }

  getCurrentUser(): { id: string; email: string } | null {
    // This would require parsing the JWT token
    // For now, we'll manage user state in the auth context
    return null;
  }

  async getSession(): Promise<{ user: { id: string; email: string } } | null> {
    try {
      // Check if we have a valid access token
      if (!this.accessToken) {
        console.log("No access token available for session check");
        return null;
      }

      const response = await fetch(`${this.baseURL}/auth/v1/user`, {
        headers: this.getHeaders(true),
      });

      if (!response.ok) {
        console.log(
          "Session check failed:",
          response.status,
          response.statusText,
        );
        // Clear invalid token
        this.accessToken = null;
        return null;
      }

      const user = await response.json();
      return { user };
    } catch (error) {
      console.log("Get session error:", error);
      // Clear potentially invalid token
      this.accessToken = null;
      return null;
    }
  }

  get currentAccessToken(): string | null {
    return this.accessToken;
  }

  set currentAccessToken(token: string | null) {
    this.accessToken = token;
  }

  // Storage operations using direct API
  async uploadFile(
    bucket: string,
    path: string,
    file: File,
  ): Promise<{ path: string; publicUrl: string }> {
    const formData = new FormData();
    formData.append("", file);

    const response = await fetch(
      `${this.baseURL}/storage/v1/object/${bucket}/${path}`,
      {
        method: "POST",
        headers: {
          apikey: this.apiKey,
          Authorization: `Bearer ${this.accessToken || this.apiKey}`,
        },
        body: formData,
      },
    );

    // Read response text once and handle both success and error cases
    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(`Upload failed: ${responseText}`);
    }

    // Parse the response text as JSON for success case
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      // If parsing fails, create a minimal result object
      result = { Key: null };
    }

    // Get public URL
    const publicUrl = `${this.baseURL}/storage/v1/object/public/${bucket}/${path}`;

    return {
      path: result.Key || path,
      publicUrl,
    };
  }

  async deleteFile(bucket: string, path: string): Promise<void> {
    const response = await fetch(
      `${this.baseURL}/storage/v1/object/${bucket}/${path}`,
      {
        method: "DELETE",
        headers: {
          apikey: this.apiKey,
          Authorization: `Bearer ${this.accessToken || this.apiKey}`,
        },
      },
    );

    // Read response text once for consistent handling
    const responseText = await response.text();

    if (!response.ok) {
      console.warn(`Delete failed: ${responseText}`);
      // Don't throw error for delete failures, just warn
    }
  }

  async updateProviderImage(
    providerId: string,
    imageUrl: string | null,
  ): Promise<void> {
    const response = await fetch(
      `${this.baseURL}/rest/v1/providers?id=eq.${providerId}`,
      {
        method: "PATCH",
        headers: {
          apikey: this.apiKey,
          Authorization: `Bearer ${this.accessToken || this.apiKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ image_url: imageUrl }),
      },
    );

    // Read response text once and use it for both success and error cases
    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(`Database update failed: ${responseText}`);
    }
    // Success case - responseText is empty due to Prefer: return=minimal
  }

  async updateBusinessProfile(
    businessId: string,
    updateData: any,
  ): Promise<void> {
    const response = await fetch(
      `${this.baseURL}/rest/v1/business_profiles?id=eq.${businessId}`,
      {
        method: "PATCH",
        headers: {
          apikey: this.apiKey,
          Authorization: `Bearer ${this.accessToken || this.apiKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify(updateData),
      },
    );

    // Read response text once and use it for both success and error cases
    let responseText = "";
    try {
      responseText = await response.text();
    } catch (readError) {
      console.warn("Could not read response text:", readError);
      responseText = `HTTP ${response.status} - ${response.statusText}`;
    }

    if (!response.ok) {
      // Parse response text to get detailed error info
      let errorDetails = responseText;
      try {
        const errorJson = JSON.parse(responseText);
        if (errorJson.message) {
          errorDetails = errorJson.message;
        } else if (errorJson.error) {
          errorDetails = errorJson.error;
        } else if (errorJson.hint) {
          errorDetails = errorJson.hint;
        }
      } catch (parseError) {
        // responseText is not JSON, use as-is
      }

      console.error("Business profile update failed:", {
        status: response.status,
        statusText: response.statusText,
        responseText: responseText,
        errorDetails: errorDetails,
        updateData: JSON.stringify(updateData, null, 2),
        url: `${this.baseURL}/rest/v1/business_profiles?id=eq.${businessId}`,
      });
      throw new Error(
        `Failed to update business profile: HTTP ${response.status} - ${errorDetails}`,
      );
    }
    // Success case - responseText is empty due to Prefer: return=minimal
  }

  // Customer authentication methods
  async signUpWithPassword(
    email: string,
    password: string,
  ): Promise<AuthResponse> {
    const response = await fetch(`${this.baseURL}/auth/v1/signup`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        email,
        password,
      }),
    });

    let responseText = "";
    try {
      responseText = await response.text();
    } catch (readError) {
      console.warn("Could not read response text:", readError);
      responseText = `HTTP ${response.status} - ${response.statusText}`;
    }

    if (!response.ok) {
      throw new Error(`Registration failed: ${responseText}`);
    }

    let authData: AuthResponse;
    try {
      authData = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error(`Invalid response format: ${responseText}`);
    }

    // Only set access token if one is provided (may not be present with email confirmation)
    if (authData.access_token) {
      this.accessToken = authData.access_token;
    }

    return authData;
  }

  async getCustomerByUserId(userId: string): Promise<CustomerRecord | null> {
    const response = await fetch(
      `${this.baseURL}/rest/v1/customers?user_id=eq.${userId}&is_active=eq.true&select=id,user_id,first_name,last_name,email,phone,is_active`,
      {
        headers: this.getHeaders(true),
      },
    );

    let responseText = "";
    try {
      responseText = await response.text();
    } catch (readError) {
      console.warn("Could not read response text:", readError);
      responseText = `HTTP ${response.status} - ${response.statusText}`;
    }

    if (!response.ok) {
      throw new Error(`Customer lookup failed: ${responseText}`);
    }

    let customers: CustomerRecord[];
    try {
      customers = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error(`Invalid response format: ${responseText}`);
    }

    return customers.length > 0 ? customers[0] : null;
  }

  async createCustomerProfile(customerData: {
    user_id: string;
    email: string;
    first_name: string;
    last_name: string;
    phone: string | null;
  }): Promise<CustomerRecord> {
    const response = await fetch(`${this.baseURL}/rest/v1/customers`, {
      method: "POST",
      headers: {
        apikey: this.apiKey,
        Authorization: `Bearer ${this.accessToken || this.apiKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        ...customerData,
        is_active: true,
        total_bookings: 0,
        total_spent: 0,
        loyalty_points: 0,
        preferred_communication: "email",
      }),
    });

    let responseText = "";
    try {
      responseText = await response.text();
    } catch (readError) {
      console.warn("Could not read response text:", readError);
      responseText = `HTTP ${response.status} - ${response.statusText}`;
    }

    if (!response.ok) {
      throw new Error(`Customer profile creation failed: ${responseText}`);
    }

    let customers: CustomerRecord[];
    try {
      customers = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error(`Invalid response format: ${responseText}`);
    }

    if (customers.length === 0) {
      throw new Error("No customer profile returned after creation");
    }

    return customers[0];
  }

  async uploadCustomerAvatar(
    customerId: string,
    file: File,
  ): Promise<{ path: string; publicUrl: string }> {
    const fileExt = file.name.split(".").pop();
    const fileName = `${customerId}-${Date.now()}.${fileExt}`;
    const filePath = `avatar-customer-user/${fileName}`;

    const formData = new FormData();
    formData.append("", file);

    const response = await fetch(
      `${this.baseURL}/storage/v1/object/roam-file-storage/${filePath}`,
      {
        method: "POST",
        headers: {
          apikey: this.apiKey,
          Authorization: `Bearer ${this.accessToken || this.apiKey}`,
        },
        body: formData,
      },
    );

    // Read response text once and handle both success and error cases
    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(`Avatar upload failed: ${responseText}`);
    }

    // Get public URL
    const publicUrl = `${this.baseURL}/storage/v1/object/public/roam-file-storage/${filePath}`;

    return {
      path: filePath,
      publicUrl,
    };
  }

  async updateCustomerProfile(
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
  ): Promise<void> {
    console.log("DirectSupabase updateCustomerProfile: Starting update", {
      customerId,
      updateData,
      url: `${this.baseURL}/rest/v1/customer_profiles?user_id=eq.${customerId}`,
      hasAccessToken: !!this.accessToken,
      tokenLength: this.accessToken ? this.accessToken.length : 0,
      tokenPrefix: this.accessToken
        ? this.accessToken.substring(0, 20) + "..."
        : "none",
    });

    // Try with anon key first (for tables without RLS or with public policies)
    // First, test if we can access the customer_profiles table at all
    console.log(
      "DirectSupabase updateCustomerProfile: Testing table access...",
    );
    const testResponse = await fetch(
      `${this.baseURL}/rest/v1/customer_profiles?limit=1`,
      {
        method: "GET",
        headers: {
          apikey: this.apiKey,
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    const testText = await testResponse.text();
    console.log("DirectSupabase updateCustomerProfile: Table access test", {
      status: testResponse.status,
      responseText: testText,
      ok: testResponse.ok,
    });

    if (!testResponse.ok) {
      // If we can't access the table at all, there's a fundamental issue
      if (testText.includes('relation "customer_profiles" does not exist')) {
        throw new Error("The customer_profiles table does not exist in the database. Please contact support.");
      } else if (testText.includes("permission denied")) {
        throw new Error("Access denied to customer_profiles table. Please contact support.");
      } else {
        console.warn("Table access test failed, but continuing with record check...");
      }
    }

    // Now check if a record exists for this user
    console.log(
      "DirectSupabase updateCustomerProfile: Checking if record exists...",
    );
    const checkResponse = await fetch(
      `${this.baseURL}/rest/v1/customer_profiles?user_id=eq.${customerId}&select=user_id`,
      {
        method: "GET",
        headers: {
          apikey: this.apiKey,
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    const checkText = await checkResponse.text();
    console.log("DirectSupabase updateCustomerProfile: Check response", {
      status: checkResponse.status,
      responseText: checkText,
    });

    let recordExists = false;
    if (checkResponse.ok) {
      try {
        const records = JSON.parse(checkText);
        recordExists = Array.isArray(records) && records.length > 0;
        console.log("DirectSupabase updateCustomerProfile: Record exists:", recordExists);
      } catch (parseError) {
        console.log("DirectSupabase updateCustomerProfile: Check parse error:", parseError);
      }
    }

    let response;
    if (recordExists) {
      // Update existing record
      console.log(
        "DirectSupabase updateCustomerProfile: Updating existing record...",
      );
      response = await fetch(
        `${this.baseURL}/rest/v1/customer_profiles?user_id=eq.${customerId}`,
        {
          method: "PATCH",
          headers: {
            apikey: this.apiKey,
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify(updateData),
        },
      );
    } else {
      // Create new record
      console.log(
        "DirectSupabase updateCustomerProfile: Creating new record...",
      );
      response = await fetch(
        `${this.baseURL}/rest/v1/customer_profiles`,
        {
          method: "POST",
          headers: {
            apikey: this.apiKey,
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify({
            user_id: customerId,
            ...updateData,
            is_active: true,
            email_notifications: true,
            sms_notifications: true,
            push_notifications: true,
            marketing_emails: false,
            email_verified: false,
            phone_verified: false,
          }),
        },
      );
    }

    let responseText = "";
    try {
      responseText = await response.text();
    } catch (readError) {
      console.warn("Could not read response text:", readError);
      responseText = `HTTP ${response.status} - ${response.statusText}`;
    }

    console.log("DirectSupabase updateCustomerProfile: Response", {
      status: response.status,
      statusText: response.statusText,
      responseText,
      ok: response.ok,
      operation: recordExists ? "UPDATE" : "CREATE",
    });

    if (!response.ok) {
      // Handle authentication errors specifically
      if (response.status === 401) {
        console.error(
          "DirectSupabase updateCustomerProfile: Authentication failed",
        );
        this.accessToken = null; // Clear invalid token
        throw new Error("Authentication failed. Please sign in again.");
      }

      // Handle table not found errors
      if (responseText.includes('relation "customer_profiles" does not exist')) {
        console.error("DirectSupabase updateCustomerProfile: customer_profiles table does not exist");
        throw new Error(
          "Customer profiles table does not exist in the database. Please contact support.",
        );
      }

      // Check for permission errors
      if (responseText.includes("permission denied") || responseText.includes("RLS")) {
        console.error("DirectSupabase updateCustomerProfile: Permission denied or RLS policy issue");
        throw new Error(
          "Permission denied: Unable to access customer profiles. Please contact support.",
        );
      }

      // Handle other errors with detailed information
      const operation = recordExists ? "update" : "create";
      console.error(`DirectSupabase updateCustomerProfile: Failed to ${operation} record`, {
        status: response.status,
        responseText,
        updateData,
        customerId,
      });

      throw new Error(
        `Failed to ${operation} customer profile: HTTP ${response.status} - ${responseText}`,
      );
    } else {
      const operation = recordExists ? "updated" : "created";
      console.log(`DirectSupabase updateCustomerProfile: Record ${operation} successfully`);
    }
  }

  async createCustomerProfileRecord(
    customerId: string,
    profileData: {
      first_name?: string;
      last_name?: string;
      email?: string;
      phone?: string | null;
      date_of_birth?: string | null;
      bio?: string | null;
      image_url?: string | null;
    },
  ): Promise<void> {
    console.log(
      "DirectSupabase createCustomerProfileRecord: Starting creation",
      {
        customerId,
        profileData,
        hasAccessToken: !!this.accessToken,
      },
    );

    // Try with anon key for customer_profiles table
    console.log(
      "DirectSupabase createCustomerProfileRecord: Using anon key...",
    );
    const response = await fetch(`${this.baseURL}/rest/v1/customer_profiles`, {
      method: "POST",
      headers: {
        apikey: this.apiKey,
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        user_id: customerId,
        ...profileData,
        is_active: true,
        email_notifications: true,
        sms_notifications: true,
        push_notifications: true,
        marketing_emails: false,
        email_verified: false,
        phone_verified: false,
      }),
    });

    let responseText = "";
    try {
      responseText = await response.text();
    } catch (readError) {
      console.warn("Could not read response text:", readError);
      responseText = `HTTP ${response.status} - ${response.statusText}`;
    }

    console.log("DirectSupabase createCustomerProfileRecord: Response", {
      status: response.status,
      statusText: response.statusText,
      responseText,
      ok: response.ok,
    });

    if (!response.ok) {
      // Handle authentication errors specifically
      if (response.status === 401) {
        console.error(
          "DirectSupabase createCustomerProfileRecord: Authentication failed",
        );
        this.accessToken = null; // Clear invalid token
        throw new Error("Authentication failed. Please sign in again.");
      }
      throw new Error(
        `Customer profile creation failed: HTTP ${response.status} - ${responseText}`,
      );
    } else {
      console.log(
        "DirectSupabase createCustomerProfileRecord: Creation successful",
      );
    }
  }
}

export const directSupabaseAPI = new DirectSupabaseAPI();
