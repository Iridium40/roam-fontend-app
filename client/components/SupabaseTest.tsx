import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export function SupabaseTest() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log("SupabaseTest:", message);
  };

  const testSupabaseConnection = async () => {
    setIsLoading(true);
    setLogs([]);
    
    try {
      // Check environment variables
      addLog("=== Environment Check ===");
      const url = import.meta.env.VITE_PUBLIC_SUPABASE_URL;
      const key = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY;
      
      addLog(`URL: ${url}`);
      addLog(`Key: ${key ? key.substring(0, 20) + "..." : "MISSING"}`);
      
      if (!url || !key) {
        addLog("ERROR: Missing environment variables!");
        return;
      }
      
      // Test 1: Basic fetch to Supabase REST API
      addLog("=== Test 1: Direct REST API ===");
      try {
        const response = await fetch(`${url}/rest/v1/`, {
          headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`
          }
        });
        addLog(`REST API Response: ${response.status} ${response.statusText}`);
      } catch (error) {
        addLog(`REST API Error: ${error}`);
      }
      
      // Test 2: Supabase client basic query
      addLog("=== Test 2: Supabase Client Query ===");
      try {
        const startTime = Date.now();
        const { data, error } = await Promise.race([
          supabase.from("providers").select("count").limit(1),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Query timeout")), 5000)
          )
        ]);
        const duration = Date.now() - startTime;
        
        if (error) {
          addLog(`Query Error: ${error.message}`);
        } else {
          addLog(`Query Success in ${duration}ms`);
        }
      } catch (error) {
        addLog(`Query Timeout/Error: ${error}`);
      }
      
      // Test 3: Auth status check
      addLog("=== Test 3: Auth Status ===");
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          addLog(`Auth status error: ${error.message}`);
        } else {
          addLog(`Current session: ${session ? "Active" : "None"}`);
        }
      } catch (error) {
        addLog(`Auth status check failed: ${error}`);
      }
      
      // Test 4: Simple auth attempt with timeout
      addLog("=== Test 4: Auth Attempt ===");
      try {
        const authStartTime = Date.now();
        const authPromise = supabase.auth.signInWithPassword({
          email: "test@example.com",
          password: "wrongpassword"
        });
        
        const result = await Promise.race([
          authPromise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Auth timeout")), 8000)
          )
        ]);
        
        const authDuration = Date.now() - authStartTime;
        addLog(`Auth completed in ${authDuration}ms`);
        
        if (result.error) {
          addLog(`Auth error (expected): ${result.error.message}`);
        } else {
          addLog("Auth unexpectedly succeeded");
        }
      } catch (error) {
        addLog(`Auth test failed: ${error}`);
      }
      
    } catch (error) {
      addLog(`Test failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <h3 className="text-lg font-semibold mb-4 text-yellow-800">Supabase Connection Test</h3>
      
      <Button 
        onClick={testSupabaseConnection}
        disabled={isLoading}
        className="w-full mb-4"
        variant="outline"
      >
        {isLoading ? "Testing..." : "Run Connection Tests"}
      </Button>
      
      {logs.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">Test Results:</h4>
          <div className="bg-gray-900 text-green-400 p-3 rounded text-xs font-mono max-h-60 overflow-auto">
            {logs.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
