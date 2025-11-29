# How to Get GBP URL and Place ID - Step-by-Step Guide

## 📍 Part 1: Get Your Google Business Profile URL

### Method 1: From Google Business Profile Dashboard (Easiest)

1. **Go to Google Business Profile**
   - Visit: https://www.google.com/business/
   - Sign in with your business Google account

2. **Select Your Business**
   - Click on "Shalean Cleaning Services" (or your business name)

3. **Get the URL**
   - In the left sidebar, click on "Info" or "Home"
   - Look for "Business profile" section
   - Click on "View on Google" or "View on Maps"
   - This will open your GBP in Google Maps
   - **Copy the URL from your browser's address bar**

   Example URL format:
   ```
   https://www.google.com/maps/place/Shalean+Cleaning+Services/@-33.9249,18.4241,15z/data=!3m1!4b1!4m6!3m5!1s0x1dcc5f...!8m2!3d-33.9249!4d18.4241!16s%2Fg%2F11...
   ```

### Method 2: From Google Maps Search

1. **Search for Your Business**
   - Go to: https://www.google.com/maps
   - Search for: "Shalean Cleaning Services Cape Town" (or your business name)

2. **Click on Your Business**
   - Click on your business listing in the search results

3. **Copy the URL**
   - The URL in your browser's address bar is your GBP URL
   - Copy the entire URL

### Method 3: From Google Search

1. **Search for Your Business**
   - Go to: https://www.google.com
   - Search for: "Shalean Cleaning Services" + your location

2. **Click on Your Business Profile**
   - Click on your business in the knowledge panel (right side)

3. **Get the URL**
   - Click "View on Google Maps"
   - Copy the URL from the address bar

---

## 🆔 Part 2: Get Your Google Place ID

### Method 1: Extract from GBP URL (Easiest)

Your Place ID might be in your GBP URL. Look for a long string that starts with `ChIJ`:

**Example URL:**
```
https://www.google.com/maps/place/Shalean+Cleaning+Services/@-33.9249,18.4241,15z/data=!4m6!3m5!1s0x1dcc5f1234567890:0xabcdef1234567890!8m2!3d-33.9249!4d18.4241!16s%2Fg%2F11abc123def
```

The Place ID is the part after `!1s` and before `!8m2`:
- Look for `!1s` in the URL
- The Place ID is the long string after it (before the next `!`)

**If you can't find it in the URL, use Method 2 or 3 below.**

### Method 2: Using Google Place ID Finder Tool (Recommended)

1. **Go to Place ID Finder**
   - Visit: https://developers.google.com/maps/documentation/places/web-service/place-id

2. **Search for Your Business**
   - Enter your business name: "Shalean Cleaning Services"
   - Enter your location: "Cape Town, South Africa"
   - Click "Find Place ID"

3. **Copy the Place ID**
   - The Place ID will be displayed (starts with `ChIJ...`)
   - Copy it

### Method 3: From Google Maps URL (Manual)

1. **Open Your Business on Google Maps**
   - Use the GBP URL you got from Part 1

2. **Check the URL Structure**
   - Look for a long alphanumeric string in the URL
   - It might look like: `ChIJN1t_tDeuEmsRUsoyG83frY4`
   - Or it might be in the `data=` parameter

3. **If Not Visible, Use the API Method**
   - See Method 4 below

### Method 4: Using Google Places API (Advanced)

1. **Get Google Places API Key** (if you don't have one)
   - Go to: https://console.cloud.google.com/
   - Create a project or select existing
   - Enable "Places API"
   - Create API key

2. **Use Places API to Find Place ID**
   - Use this URL (replace YOUR_API_KEY and YOUR_BUSINESS_NAME):
   ```
   https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=Shalean%20Cleaning%20Services%20Cape%20Town&inputtype=textquery&fields=place_id&key=YOUR_API_KEY
   ```

3. **The Response Will Include Place ID**
   - Look for `"place_id": "ChIJ..."` in the JSON response

---

## 📝 Part 3: Add Environment Variables

### Step 1: Create/Edit `.env.local` File

1. **Navigate to Project Root**
   - Open your project folder: `C:\Users\27825\shalean`
   - Look for `.env.local` file (it might be hidden)

2. **If `.env.local` Doesn't Exist:**
   - Create a new file named `.env.local`
   - Make sure it's in the root directory (same folder as `package.json`)

3. **If `.env.local` Already Exists:**
   - Open it in a text editor (VS Code, Notepad, etc.)

### Step 2: Add the Variables

Add these lines to your `.env.local` file:

```env
# Google Business Profile URL
NEXT_PUBLIC_GBP_URL=https://www.google.com/maps/place/Shalean+Cleaning+Services/@-33.9249,18.4241,15z

# Google Maps Place ID (for embed)
NEXT_PUBLIC_GOOGLE_PLACE_ID=ChIJN1t_tDeuEmsRUsoyG83frY4

# Google Places API Key (optional, for Maps embed)
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=your_api_key_here

# Review Link (optional, get from GBP dashboard)
NEXT_PUBLIC_GBP_REVIEW_LINK=https://g.page/r/your-review-link
```

**Replace with your actual values:**
- Replace the GBP URL with your actual URL from Part 1
- Replace the Place ID with your actual Place ID from Part 2
- Replace the API key if you have one (optional)

### Step 3: Save the File

- Save `.env.local` file
- Make sure it's saved in the project root directory

### Step 4: Restart Development Server

1. **Stop Current Server**
   - If your dev server is running, press `Ctrl+C` to stop it

2. **Restart Server**
   ```bash
   npm run dev
   ```

3. **Verify It Works**
   - The environment variables are now loaded
   - Your site will use these values

---

## 🌐 Part 4: Add to Vercel (For Production)

If your site is deployed on Vercel, you also need to add these there:

### Step 1: Go to Vercel Dashboard

1. Visit: https://vercel.com
2. Sign in to your account
3. Select your project (shalean)

### Step 2: Add Environment Variables

1. **Navigate to Settings**
   - Click on "Settings" tab
   - Click on "Environment Variables" in the left sidebar

2. **Add Each Variable**
   - Click "Add New" button
   - Enter variable name: `NEXT_PUBLIC_GBP_URL`
   - Enter variable value: (paste your GBP URL)
   - Select environments: ✅ Production, ✅ Preview, ✅ Development
   - Click "Save"

3. **Repeat for Place ID**
   - Click "Add New" again
   - Name: `NEXT_PUBLIC_GOOGLE_PLACE_ID`
   - Value: (paste your Place ID)
   - Select all environments
   - Click "Save"

4. **Optional: Add API Key**
   - If you have Google Places API key, add it as:
   - Name: `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY`
   - Value: (your API key)

5. **Optional: Add Review Link**
   - Name: `NEXT_PUBLIC_GBP_REVIEW_LINK`
   - Value: (your review link from GBP dashboard)

### Step 3: Redeploy

After adding variables:
- Vercel will automatically redeploy
- Or click "Redeploy" button manually

---

## 🔍 Part 5: Get Review Link (Optional but Recommended)

### Step 1: Go to GBP Dashboard

1. Visit: https://www.google.com/business/
2. Sign in and select your business

### Step 2: Get Review Link

1. **Navigate to Reviews**
   - Click on "Reviews" in the left sidebar
   - Or go to "Home" and look for review section

2. **Find "Get More Reviews"**
   - Look for a button or link that says "Get more reviews"
   - Or "Share review form"

3. **Copy the Link**
   - Click on it
   - Copy the URL (starts with `https://g.page/r/...`)
   - This is your review link

### Step 3: Add to Environment Variables

Add to `.env.local`:
```env
NEXT_PUBLIC_GBP_REVIEW_LINK=https://g.page/r/your-actual-review-link
```

---

## ✅ Verification Checklist

After adding the variables:

- [ ] `.env.local` file exists in project root
- [ ] `NEXT_PUBLIC_GBP_URL` is set with your actual GBP URL
- [ ] `NEXT_PUBLIC_GOOGLE_PLACE_ID` is set with your Place ID
- [ ] Development server has been restarted
- [ ] Variables added to Vercel (if deployed)
- [ ] Vercel has been redeployed (if deployed)

---

## 🧪 How to Test

### Test 1: Check GBP Widget

1. Visit any service page: `http://localhost:3000/services/deep-cleaning`
2. Scroll down to find the GBP widget
3. Click "View on Google Maps" - should open your GBP
4. Verify the map shows your correct location

### Test 2: Check Schema Markup

1. Visit: https://search.google.com/test/rich-results
2. Enter your service page URL: `https://shalean.co.za/services/deep-cleaning`
3. Click "Test URL"
4. Look for LocalBusiness schema
5. Check that `sameAs` includes your GBP URL

### Test 3: Check Environment Variables

1. In your code, you can temporarily log them:
   ```typescript
   console.log('GBP URL:', process.env.NEXT_PUBLIC_GBP_URL);
   console.log('Place ID:', process.env.NEXT_PUBLIC_GOOGLE_PLACE_ID);
   ```
2. Check browser console (should show your values)

---

## 🆘 Troubleshooting

### "GBP URL Not Found"
- Make sure you copied the entire URL from Google Maps
- URL should start with `https://www.google.com/maps/place/`
- Test the URL in a browser first to make sure it works

### "Place ID Not Working"
- Place ID should start with `ChIJ` (for most places)
- Make sure there are no spaces or extra characters
- Use the Place ID Finder tool if unsure

### "Environment Variables Not Loading"
- Make sure file is named exactly `.env.local` (not `.env` or `.env.local.txt`)
- File must be in project root (same folder as `package.json`)
- Restart your dev server after adding variables
- Check for typos in variable names (must be exact: `NEXT_PUBLIC_GBP_URL`)

### "Map Not Showing"
- Check that `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY` is set (if using embed)
- Verify Places API is enabled in Google Cloud Console
- Check browser console for errors

---

## 📋 Quick Reference

### Your `.env.local` Should Look Like:

```env
# Existing variables (don't delete these)
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=...
PAYSTACK_SECRET_KEY=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Add these new GBP variables:
NEXT_PUBLIC_GBP_URL=https://www.google.com/maps/place/Your-Actual-Business-URL
NEXT_PUBLIC_GOOGLE_PLACE_ID=ChIJYourActualPlaceIDHere
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=your_api_key_if_you_have_one
NEXT_PUBLIC_GBP_REVIEW_LINK=https://g.page/r/your-review-link
```

### Example with Real Format:

```env
NEXT_PUBLIC_GBP_URL=https://www.google.com/maps/place/Shalean+Cleaning+Services/@-33.9249,18.4241,15z/data=!4m6!3m5!1s0x1dcc5f1234567890:0xabcdef1234567890!8m2!3d-33.9249!4d18.4241
NEXT_PUBLIC_GOOGLE_PLACE_ID=ChIJN1t_tDeuEmsRUsoyG83frY4
```

---

## 🎯 Summary

1. **Get GBP URL**: From Google Business Profile dashboard or Google Maps
2. **Get Place ID**: Use Place ID Finder tool or extract from URL
3. **Add to `.env.local`**: Create/edit file in project root
4. **Add to Vercel**: If deployed, add to Vercel environment variables
5. **Restart Server**: Restart dev server to load new variables
6. **Test**: Verify GBP widget and schema work correctly

---

**Need Help?** If you can't find your GBP URL or Place ID, let me know and I can help you locate them!

