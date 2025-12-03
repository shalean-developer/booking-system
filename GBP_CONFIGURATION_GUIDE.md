# Google Business Profile Configuration Guide

## Overview
This guide explains how to configure the GBP widget and schema to match your actual Google Business Profile data.

## Required Configuration

### Step 1: Get Your GBP Information

1. **Google Business Profile URL**
   - Go to your Google Business Profile dashboard
   - Copy your business profile URL
   - Example: `https://www.google.com/maps/place/Shalean+Cleaning+Services/@-33.9249,18.4241,15z`

2. **Google Maps Place ID**
   - Open your GBP in Google Maps
   - The Place ID is in the URL or you can find it in your GBP dashboard
   - Example: `ChIJ...` (long alphanumeric string)

3. **Review Link**
   - In your GBP dashboard, go to "Get more reviews"
   - Copy the review link
   - Example: `https://g.page/r/...`

4. **Actual Business Address**
   - Your physical address (if you have a location)
   - Or service area if you're service-area based

### Step 2: Add Environment Variables

Add these to your `.env.local` file (for local development) and Vercel environment variables (for production):

```env
# Google Business Profile URL
NEXT_PUBLIC_GBP_URL=https://www.google.com/maps/place/Shalean+Cleaning+Services/@-33.9249,18.4241,15z

# Google Maps Place ID (for embed)
NEXT_PUBLIC_GOOGLE_PLACE_ID=ChIJ...

# Google Places API Key (for Maps embed)
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=your_api_key_here

# Review Link (optional)
NEXT_PUBLIC_GBP_REVIEW_LINK=https://g.page/r/...
```

### Step 3: Update Service Pages (Optional)

If you want to override defaults for specific pages, you can pass props to the `ServicePageTemplate`:

```tsx
<ServicePageTemplate
  // ... other props
  gbpUrl="https://www.google.com/maps/place/Your+Actual+GBP+URL"
  reviewLink="https://g.page/r/YourReviewLink"
/>
```

And for the GBP widget:

```tsx
<GBPWidget
  gbpUrl="https://www.google.com/maps/place/Your+Actual+GBP+URL"
  placeId="ChIJ..."
  reviewLink="https://g.page/r/YourReviewLink"
  address="Your actual address, Cape Town, Western Cape"
  rating={4.8} // Your actual rating
  reviewCount={127} // Your actual review count
/>
```

### Step 4: Update Schema Address

If you have a physical address, update the schema in `lib/gbp-schema.ts` or pass it when generating:

```tsx
const localBusinessSchema = generateServiceLocalBusinessSchema({
  // ... other options
  streetAddress: "Your Street Address, Cape Town",
  gbpUrl: process.env.NEXT_PUBLIC_GBP_URL,
});
```

## How to Find Your Place ID

### Method 1: From GBP URL
1. Open your Google Business Profile
2. Look at the URL - it may contain the Place ID
3. Or use Google's Place ID Finder: https://developers.google.com/maps/documentation/places/web-service/place-id

### Method 2: From Google Maps
1. Search for your business on Google Maps
2. Click on your business
3. The Place ID is in the URL or can be found in the business details

### Method 3: Using Google's API
1. Use the Places API to search for your business
2. The response will include the Place ID

## Testing

After configuration:

1. **Check the GBP Widget**
   - Visit any service page
   - Verify the map shows your correct location
   - Verify the "View on Google Maps" link goes to your GBP

2. **Check Schema Markup**
   - Use Google's Rich Results Test: https://search.google.com/test/rich-results
   - Enter your service page URL
   - Verify the LocalBusiness schema includes your GBP URL in `sameAs`

3. **Check Map Embed**
   - Verify the map embed shows your actual location
   - If using Place ID, ensure it's correct
   - If using search query, verify it finds your business

## Troubleshooting

### Map Not Showing Correct Location
- Verify your Place ID is correct
- Check that `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY` is set
- Ensure the Places API is enabled in Google Cloud Console

### GBP URL Not Working
- Verify the URL is complete and includes coordinates
- Test the URL in a browser to ensure it works
- Check that the URL format matches: `https://www.google.com/maps/place/...`

### Schema Not Including GBP
- Verify `NEXT_PUBLIC_GBP_URL` is set
- Check that the schema generation includes the `gbpUrl` option
- Test with Google's Rich Results Test tool

## Current Defaults

If environment variables are not set, the system uses these defaults:

- **GBP URL**: `https://www.google.com/maps/place/Shalean+Cleaning+Services`
- **Address**: Cape Town, Western Cape, South Africa (service area)
- **Rating**: 5.0 (placeholder)
- **Review Count**: 500 (placeholder)

**Important**: Update these with your actual data for accurate display and SEO benefits.











