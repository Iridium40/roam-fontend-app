import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export default function DebugAuth() {
  const [dbStatus, setDbStatus] = useState<string>("Testing...");
  const [providers, setProviders] = useState<any[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log(message);
  };

  useEffect(() => {
    testDatabase();
  }, []);

  const testDatabase = async () => {
    try {
      addLog("Testing database connection...");
      
      // Test basic connection
      const { data: testData, error: testError } = await supabase
        .from("providers")
        .select("count")
        .limit(1);

      if (testError) {
        setDbStatus(`Database Error: ${testError.message}`);
        addLog(`Database Error: ${testError.message}`);
        return;
      }

      setDbStatus("Database connection successful");
      addLog("Database connection successful");

      // Get all providers
      const { data: providerData, error: providerError } = await supabase
        .from("providers")
        .select("*");

      if (providerError) {
        addLog(`Provider fetch error: ${providerError.message}`);
      } else {
        setProviders(providerData || []);
        addLog(`Found ${providerData?.length || 0} providers`);
      }

      // Get current auth user
      const { data: { user } } = await supabase.auth.getUser();
      addLog(`Current auth user: ${user ? user.email : 'None'}`);

    } catch (error) {
      const errorMsg = `Test error: ${error}`;
      addLog(errorMsg);
      setDbStatus(errorMsg);
    }
  };

  const testLogin = async () => {
    try {
      addLog("Starting test login...");
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: "provider@roamyourbestlife.com",
        password: "Hayes@2013",
      });

      if (error) {
        addLog(`Auth error: ${error.message}`);
        return;
      }

      addLog("Auth successful!");
      
      if (data.user) {
        addLog(`User ID: ${data.user.id}`);
        
        // Try to fetch provider profile
        const { data: providerData, error: providerError } = await supabase
          .from("providers")
          .select("*")
          .eq("user_id", data.user.id)
          .eq("is_active", true)
          .single();

        if (providerError) {
          addLog(`Provider lookup error: ${providerError.message}`);
        } else {
          addLog(`Provider found: ${providerData.email} (Role: ${providerData.provider_role})`);
        }
      }
    } catch (error) {
      addLog(`Test login error: ${error}`);
    }
  };

  const testLogout = async () => {
    try {
      addLog("Signing out...");
      const { error } = await supabase.auth.signOut();
      if (error) {
        addLog(`Logout error: ${error.message}`);
      } else {
        addLog("Logout successful");
      }
    } catch (error) {
      addLog(`Logout error: ${error}`);
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
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-40">
            {JSON.stringify(providers, null, 2)}
          </pre>
        </div>

        <div className="space-x-2">
          <Button onClick={testLogin}>
            Test Login with provider@roamyourbestlife.com
          </Button>
          
          <Button onClick={testLogout} variant="outline">
            Test Logout
          </Button>

          <Button onClick={testDatabase} variant="outline">
            Refresh Database Test
          </Button>
        </div>

        <div>
          <h2 className="text-lg font-semibold">Debug Logs:</h2>
          <div className="bg-black text-green-400 p-4 rounded text-sm font-mono max-h-60 overflow-auto">
            {logs.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
