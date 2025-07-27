import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export default function DebugAuth() {
  const [dbStatus, setDbStatus] = useState<string>("Testing...");
  const [providers, setProviders] = useState<any[]>([]);
  const [authUsers, setAuthUsers] = useState<any[]>([]);

  useEffect(() => {
    testDatabase();
  }, []);

  const testDatabase = async () => {
    try {
      // Test basic connection
      const { data: testData, error: testError } = await supabase
        .from("providers")
        .select("count")
        .limit(1);

      if (testError) {
        setDbStatus(`Database Error: ${testError.message}`);
        return;
      }

      setDbStatus("Database connection successful");

      // Get all providers
      const { data: providerData, error: providerError } = await supabase
        .from("providers")
        .select("*");

      if (providerError) {
        console.error("Provider fetch error:", providerError);
      } else {
        setProviders(providerData || []);
      }

      // Get current auth user
      const { data: { user } } = await supabase.auth.getUser();
      console.log("Current auth user:", user);

    } catch (error) {
      console.error("Test error:", error);
      setDbStatus(`Error: ${error}`);
    }
  };

  const testLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: "provider@roamyourbestlife.com",
        password: "Hayes@2013",
      });

      if (error) {
        console.error("Auth error:", error);
        alert(`Auth Error: ${error.message}`);
        return;
      }

      console.log("Auth success:", data);
      alert("Auth successful!");

      if (data.user) {
        // Try to fetch provider profile
        const { data: providerData, error: providerError } = await supabase
          .from("providers")
          .select("*")
          .eq("user_id", data.user.id)
          .single();

        if (providerError) {
          console.error("Provider lookup error:", providerError);
          alert(`Provider lookup error: ${providerError.message}`);
        } else {
          console.log("Provider found:", providerData);
          alert("Provider found!");
        }
      }
    } catch (error) {
      console.error("Test login error:", error);
      alert(`Test login error: ${error}`);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Auth Debug Page</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Database Status:</h2>
          <p>{dbStatus}</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold">Providers in Database:</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(providers, null, 2)}
          </pre>
        </div>

        <Button onClick={testLogin}>
          Test Login with provider@roamyourbestlife.com
        </Button>

        <Button onClick={testDatabase}>
          Refresh Database Test
        </Button>
      </div>
    </div>
  );
}
