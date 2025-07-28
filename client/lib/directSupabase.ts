// Direct Supabase API calls to bypass client hanging issues
const SUPABASE_URL = import.meta.env.VITE_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    [key: string]: any;
  };
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

    const responseText = await response.text();

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

  get currentAccessToken(): string | null {
    return this.accessToken;
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
      throw new Error(`Failed to update business profile: ${responseText}`);
    }
    // Success case - responseText is empty due to Prefer: return=minimal
  }
}

export const directSupabaseAPI = new DirectSupabaseAPI();
