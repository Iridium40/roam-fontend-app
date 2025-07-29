import { Context } from '@netlify/functions';

// This function handles document uploads with service-level permissions
// to bypass RLS policy issues during onboarding
export default async (req: Request, context: Context) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // Parse the multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const folderPath = formData.get('folderPath') as string;
    const providerId = formData.get('providerId') as string;
    const businessId = formData.get('businessId') as string;

    if (!file || !folderPath || !providerId || !businessId) {
      return new Response('Missing required fields', { status: 400 });
    }

    // Create Supabase client with service role key for elevated permissions
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.VITE_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${folderPath}/${fileName}`;

    // Upload file using service role (bypasses RLS)
    const { data, error } = await supabase.storage
      .from('roam-provider-documents')
      .upload(filePath, file);

    if (error) {
      console.error('Upload error:', error);
      return new Response(`Upload failed: ${error.message}`, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('roam-provider-documents')
      .getPublicUrl(filePath);

    return new Response(JSON.stringify({ 
      success: true, 
      publicUrl,
      filePath: data.path 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Document upload error:', error);
    return new Response(`Internal server error: ${error.message}`, { status: 500 });
  }
};
