import { useState } from "react";
import { Button } from "@/components/ui/button";

export function DirectFetchTest() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log("DirectFetch:", message);
  };

  const testDirectFetch = async () => {
    setIsLoading(true);
    setLogs([]);
    
    try {
      addLog("Testing direct fetch as suggested...");
      
      const anonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY;
      
      const response = await fetch('https://vssomyuyhicaxsgiaupo.supabase.co/rest/v1/', {
        headers: {
          'apikey': anonKey
        }
      });
      
      addLog(`Response status: ${response.status} ${response.statusText}`);
      
      const data = await response.json();
      addLog(`Response data: ${JSON.stringify(data)}`);
      
      // Test providers endpoint
      addLog("Testing providers endpoint...");
      const providersResponse = await fetch('https://vssomyuyhicaxsgiaupo.supabase.co/rest/v1/providers?select=count', {
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      addLog(`Providers response: ${providersResponse.status} ${providersResponse.statusText}`);
      
      if (providersResponse.ok) {
        const providersData = await providersResponse.json();
        addLog(`Providers data: ${JSON.stringify(providersData)}`);
      } else {
        const errorText = await providersResponse.text();
        addLog(`Providers error: ${errorText}`);
      }
      
      // Test auth endpoint
      addLog("Testing auth endpoint...");
      const authResponse = await fetch('https://vssomyuyhicaxsgiaupo.supabase.co/auth/v1/token?grant_type=password', {
        method: 'POST',
        headers: {
          'apikey': anonKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'provider@roamyourbestlife.com',
          password: 'Hayes@2013'
        })
      });
      
      addLog(`Auth response: ${authResponse.status} ${authResponse.statusText}`);
      
      if (authResponse.ok) {
        const authData = await authResponse.json();
        addLog(`Auth success: User ID ${authData.user?.id || 'unknown'}`);
      } else {
        const errorText = await authResponse.text();
        addLog(`Auth error: ${errorText}`);
      }
      
    } catch (error) {
      addLog(`Fetch error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <h3 className="text-lg font-semibold mb-4 text-blue-800">Direct Fetch Test</h3>
      
      <Button 
        onClick={testDirectFetch}
        disabled={isLoading}
        className="w-full mb-4"
        variant="outline"
      >
        {isLoading ? "Testing..." : "Run Direct Fetch Test"}
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
