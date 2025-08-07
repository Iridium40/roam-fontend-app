# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication with Google One Tap for your ROAM application.

## Prerequisites

1. A Google Cloud Console account
2. Supabase project with Google OAuth enabled

## Step 1: Google Cloud Console Setup

### 1.1 Create a New Project (if needed)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name your project (e.g., "ROAM Authentication")
4. Click "Create"

### 1.2 Enable Google+ API
1. In the Google Cloud Console, go to "APIs & Services" → "Library"
2. Search for "Google+ API"
3. Click on it and press "Enable"

### 1.3 Configure OAuth Consent Screen
1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" user type
3. Fill in the required fields:
   - **App name**: ROAM - Your Best Life
   - **User support email**: Your email
   - **Developer contact information**: Your email
4. Add your domain to "Authorized domains"
5. Save and continue through the scopes and test users sections

### 1.4 Create OAuth 2.0 Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Name it "ROAM Web Client"
5. Add Authorized JavaScript origins:
   - `http://localhost:5173` (for development)
   - `https://yourdomain.com` (for production)
6. Add Authorized redirect URIs:
   - `https://[your-project].supabase.co/auth/v1/callback`
7. Click "Create"
8. Copy the **Client ID** - you'll need this

## Step 2: Supabase Configuration

### 2.1 Enable Google Provider
1. Go to your Supabase dashboard
2. Navigate to Authentication → Providers
3. Find Google and click to configure
4. Toggle "Enable sign in with Google"
5. Enter your **Client ID** from Google Cloud Console
6. Enter your **Client Secret** from Google Cloud Console
7. Click "Save"

### 2.2 Configure Redirect URLs
Make sure your redirect URLs in Supabase match what you set in Google Cloud Console.

## Step 3: Application Configuration

### 3.1 Environment Variables
Add your Google Client ID to your `.env` file:

```env
VITE_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

### 3.2 Verify Implementation
The following components have been implemented:

1. **GoogleOneTap Component**: Provides the One Tap sign-in experience
2. **Enhanced AuthContext**: Includes `signInWithGoogleIdToken` method
3. **Standard OAuth Button**: In CustomerAuthModal for fallback
4. **Automatic Integration**: Added to LandingPage and Index pages

## Step 4: Testing

### 4.1 Development Testing
1. Start your development server
2. Navigate to your landing page
3. You should see the Google One Tap prompt appear
4. Test both One Tap and the standard Google OAuth button

### 4.2 Production Testing
1. Deploy your application
2. Update your Google Cloud Console with production URLs
3. Test the OAuth flow in production

## Features Implemented

### Google One Tap
- **Automatic Prompt**: Shows when user is not signed in
- **Nonce Security**: Implements proper nonce generation and validation
- **FedCM Support**: Uses FedCM for Chrome's third-party cookie changes
- **Error Handling**: Comprehensive error handling and logging

### Standard OAuth Fallback
- **Traditional Flow**: Standard OAuth redirect flow as backup
- **Consistent Experience**: Same authentication result as One Tap
- **Cross-Browser Support**: Works on all browsers

### Security Features
- **Nonce Validation**: Prevents replay attacks
- **CSRF Protection**: Built into Supabase OAuth flow
- **Secure Tokens**: JWT tokens with proper expiration

## Troubleshooting

### Common Issues

1. **One Tap Not Showing**
   - Check browser console for errors
   - Verify the Google Client ID is correct
   - Ensure domain is authorized in Google Cloud Console

2. **OAuth Redirect Errors**
   - Verify redirect URLs match exactly in both Google and Supabase
   - Check that the domain is authorized

3. **Token Validation Errors**
   - Ensure nonce is being generated and passed correctly
   - Check Supabase logs for authentication errors

### Debug Mode
Enable debug logging by checking the browser console for detailed authentication flow information.

## Security Considerations

1. **Client ID**: Safe to expose in frontend code
2. **Client Secret**: Keep secure, only use in Supabase backend
3. **Nonce**: Generated fresh for each authentication attempt
4. **HTTPS**: Required for production OAuth flows

## Support

For additional help:
- [Google OAuth Documentation](https://developers.google.com/identity/oauth2/web/guides/overview)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google One Tap Documentation](https://developers.google.com/identity/gsi/web/guides/overview)
