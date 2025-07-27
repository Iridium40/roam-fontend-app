import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";

export function TestLogin() {
  const [email, setEmail] = useState("provider@roamyourbestlife.com");
  const [password, setPassword] = useState("Hayes@2013");
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const navigate = useNavigate();

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log("TestLogin:", message);
  };

  const handleSimpleLogin = async () => {
    setIsLoading(true);
    setLogs([]);

    try {
      addLog("Starting simple login test...");

      // Check Supabase configuration first
      addLog("Checking Supabase configuration...");
      addLog(`Supabase URL: ${import.meta.env.VITE_PUBLIC_SUPABASE_URL}`);
      addLog(`Anon Key: ${import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20)}...`);

      // Test basic connectivity
      addLog("Testing basic Supabase connectivity...");
      const connectivityPromise = supabase.from("providers").select("count").limit(1);
      const connectivityTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Connectivity test timeout")), 5000)
      );

      try {
        await Promise.race([connectivityPromise, connectivityTimeout]);
        addLog("Supabase connectivity: OK");
      } catch (error) {
        addLog(`Supabase connectivity error: ${error}`);
        return;
      }

      // Step 1: Authenticate with timeout
      addLog("Step 1: Authenticating with Supabase...");

      let authResult;
      const authPromise = supabase.auth.signInWithPassword({
        email,
        password,
      });

      const authTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Authentication timeout after 10 seconds")), 10000)
      );

      try {
        authResult = await Promise.race([authPromise, authTimeout]);
      } catch (error) {
        addLog(`Auth timeout or error: ${error}`);
        return;
      }

      const { data: authData, error: authError } = authResult;

      if (authError) {
        addLog(`Auth error: ${authError.message}`);
        return;
      }

      if (!authData.user) {
        addLog("No user returned from auth");
        return;
      }

      addLog(`Auth successful! User ID: ${authData.user.id}`);

      // Step 2: Look up provider
      addLog("Step 2: Looking up provider record...");
      const { data: providerData, error: providerError } = await supabase
        .from("providers")
        .select("*")
        .eq("user_id", authData.user.id)
        .eq("is_active", true)
        .single();

      if (providerError) {
        addLog(`Provider lookup error: ${providerError.message}`);
        return;
      }

      if (!providerData) {
        addLog("No provider record found");
        return;
      }

      addLog(`Provider found: ${providerData.email} (Role: ${providerData.provider_role})`);

      // Step 3: Navigate based on role
      addLog("Step 3: Navigating to dashboard...");
      const roleRoutes = {
        owner: "/owner/dashboard",
        dispatcher: "/dispatcher/dashboard", 
        provider: "/provider/dashboard"
      };
      
      const targetRoute = roleRoutes[providerData.provider_role as keyof typeof roleRoutes] || "/provider-dashboard";
      addLog(`Navigating to: ${targetRoute}`);
      
      navigate(targetRoute);
      
    } catch (error) {
      addLog(`Unexpected error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white border rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Simple Login Test</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <Input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <Input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        
        <Button 
          onClick={handleSimpleLogin}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? "Testing Login..." : "Test Simple Login"}
        </Button>
        
        {logs.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Debug Logs:</h4>
            <div className="bg-gray-900 text-green-400 p-3 rounded text-xs font-mono max-h-40 overflow-auto">
              {logs.map((log, index) => (
                <div key={index}>{log}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
