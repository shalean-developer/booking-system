# Quick Setup Guide: Quotes Table

## 🚀 Quick Start (3 Steps)

### Step 1: Run the SQL Migration

**Option A: Supabase Dashboard (Recommended)**
1. Go to your Supabase project: https://supabase.com/dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **"New Query"**
4. Copy the entire contents of `supabase/quotes-table.sql`
5. Paste into the SQL editor
6. Click **"Run"** or press `Ctrl+Enter`

**Option B: Copy-Paste SQL Directly**

```sql
-- Copy this entire block and run it in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS quotes (
  id TEXT PRIMARY KEY,
  service_type TEXT NOT NULL,
  bedrooms INTEGER NOT NULL DEFAULT 0,
  bathrooms INTEGER NOT NULL DEFAULT 1,
  extras TEXT[] DEFAULT '{}',
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  estimated_price INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quotes_email ON quotes(email);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_service_type ON quotes(service_type);

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can create quotes" ON quotes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can view quotes" ON quotes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update quotes" ON quotes
  FOR UPDATE USING (auth.role() = 'authenticated');
```

### Step 2: Verify Table Creation

Run this query in SQL Editor to verify:
```sql
SELECT * FROM quotes LIMIT 5;
```

If you see an empty table (no errors), it worked! ✅

### Step 3: Test Quote Submission

1. Start your development server: `npm run dev`
2. Visit: `http://localhost:3000/booking/quote`
3. Fill out the quote form completely
4. Click "Confirm Quote & Continue"
5. Check your Supabase dashboard:
   - Go to **Table Editor**
   - Select **quotes** table
   - You should see your test quote!

## 📊 View Your Quotes

### In Supabase Dashboard
1. Go to **Table Editor**
2. Click **quotes** in the left sidebar
3. See all quote submissions in real-time

### Using SQL Queries

**All pending quotes:**
```sql
SELECT 
  id,
  service_type,
  first_name || ' ' || last_name as customer_name,
  email,
  phone,
  estimated_price,
  created_at
FROM quotes
WHERE status = 'pending'
ORDER BY created_at DESC;
```

**Today's quotes:**
```sql
SELECT * FROM quotes
WHERE DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC;
```

**Quote statistics:**
```sql
SELECT 
  service_type,
  COUNT(*) as total_quotes,
  AVG(estimated_price) as avg_price,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending
FROM quotes
GROUP BY service_type;
```

## 🔧 Update Quote Status

When you contact a customer:
```sql
UPDATE quotes 
SET status = 'contacted',
    notes = 'Called customer on 2024-12-19',
    updated_at = NOW()
WHERE id = 'QT-1234567890123';
```

When quote converts to booking:
```sql
UPDATE quotes 
SET status = 'converted',
    notes = 'Converted to booking BK-1234567890',
    updated_at = NOW()
WHERE id = 'QT-1234567890123';
```

## 🐛 Troubleshooting

### "relation quotes does not exist"
➡️ You haven't run the migration yet. Go back to Step 1.

### "permission denied for table quotes"
➡️ RLS policies are working correctly. You need to be authenticated to read quotes (as intended).

### Quotes not saving but no errors
1. Check browser console for errors
2. Check server logs: `npm run dev` output
3. Verify Supabase environment variables in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

### Database error in console
Check the specific error message:
- **"duplicate key value"** - Quote ID already exists (rare, retry)
- **"null value in column"** - Missing required field (check form validation)
- **"invalid input syntax"** - Data type mismatch (check TypeScript types)

## ✅ Success Checklist

After setup, you should have:
- [x] `quotes` table created in Supabase
- [x] 4 indexes created for performance
- [x] 3 RLS policies enabled for security
- [x] TypeScript types updated (no compile errors)
- [x] API endpoint saving quotes (check console logs)
- [x] Test quote visible in Supabase dashboard

## 📈 What Happens Now?

Every time a customer submits a quote request:
1. ✅ Quote saved to database with unique ID
2. ✅ Estimated price calculated (internal use only)
3. ✅ Status set to "pending"
4. ✅ Emails sent to customer and admin
5. ✅ Available in Supabase for you to review

## 🎯 Next Steps (Optional)

1. **Build Admin Dashboard** - Create a page to manage quotes
2. **Set up Notifications** - Get notified of new quotes
3. **Track Conversions** - Monitor which quotes become bookings
4. **Export Data** - Download quotes as CSV for analysis

---

**Need Help?** Check `QUOTES_TABLE_INTEGRATION.md` for detailed documentation.

