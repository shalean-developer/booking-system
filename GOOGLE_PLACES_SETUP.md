# Google Places API Setup Guide

## Overview

This guide will help you set up Google Places Autocomplete API for the Service Address field in the booking form.

## Step 1: Get Google API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the required APIs:
   - Go to "APIs & Services" > "Library"
   - Search for "Places API" and enable it
   - Search for "Maps JavaScript API" and enable it (optional, but recommended)
4. Create API Key:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy your API key

## Step 2: (Optional) Restrict API Key

For production, restrict your API key for security:

1. Click on your API key to edit it
2. Under "API restrictions":
   - Select "Restrict key"
   - Choose "Places API" and "Maps JavaScript API"
3. Under "Application restrictions":
   - Select "HTTP referrers (web sites)"
   - Add your domain(s):
     - `localhost:*` (for development)
     - `yourdomain.com/*` (for production)
     - `*.vercel.app/*` (if using Vercel)

## Step 3: Add Environment Variable

Add the API key to your `.env.local` file:

```env
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=your_api_key_here
```

## Step 4: Add to Vercel (If Deployed)

If your app is deployed on Vercel:

1. Go to your Vercel project dashboard
2. Navigate to "Settings" > "Environment Variables"
3. Add:
   - **Name**: `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY`
   - **Value**: Your API key
   - **Environments**: Production, Preview, Development
4. Click "Save"
5. Redeploy your application

## Step 5: Test the Integration

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the booking form contact step
3. Start typing in the "Street Address" field
4. You should see Google Places autocomplete suggestions appearing

## Features

- **Automatic Address Parsing**: When a user selects an address, the component automatically fills:
  - Street Address (line1)
  - Suburb
  - City

- **South Africa Focus**: The autocomplete is restricted to South African addresses only

- **Fallback Support**: If the API fails to load, the input still works as a regular text field

## Troubleshooting

### Autocomplete not appearing

- Check that `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY` is set in your `.env.local`
- Verify the API key is correct in Google Cloud Console
- Ensure "Places API" is enabled in your Google Cloud project
- Check browser console for any error messages
- Make sure you've restarted your development server after adding the environment variable

### Address components not populating

- Check that the selected address has all components (some addresses may have missing suburb/city)
- The component tries to parse multiple address component types for better compatibility
- If suburb is missing, try a more specific address

### API Key Errors

- "This API project is not authorized to use this API": Enable Places API in Google Cloud Console
- "RefererNotAllowedMapError": Add your domain to API key restrictions or remove restrictions for testing
- "OVER_QUERY_LIMIT": You've exceeded the quota, check your billing and quotas in Google Cloud Console

## Cost Considerations

Google Places API has usage-based pricing:
- **Free tier**: $200 credit per month (covers approximately 28,000 autocomplete requests)
- **After free tier**: ~$0.007 per autocomplete request

To monitor usage:
1. Go to Google Cloud Console
2. Navigate to "APIs & Services" > "Dashboard"
3. Check your API usage and set up billing alerts

## Implementation Details

The autocomplete component:
- Loads Google Maps script dynamically
- Restricts results to South Africa (`country: 'za'`)
- Parses address components intelligently for South African address formats
- Integrates seamlessly with the existing form validation
- Falls back gracefully if the API is unavailable

## File Locations

- Component: `components/address-autocomplete.tsx`
- Integration: `components/step-contact.tsx`
- Environment variable: `.env.local` and Vercel dashboard

