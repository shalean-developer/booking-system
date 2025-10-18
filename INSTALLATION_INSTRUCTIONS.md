# Installation Instructions for Dynamic Pricing System

## Required Package Installation

The dynamic pricing system requires some additional npm packages that are not currently installed. Run these commands:

```bash
# Install Radix UI primitives for new components
npm install @radix-ui/react-tabs
npm install @radix-ui/react-alert-dialog
npm install @radix-ui/react-radio-group

# Install sonner for toast notifications
npm install sonner
```

Or install all at once:
```bash
npm install @radix-ui/react-tabs @radix-ui/react-alert-dialog @radix-ui/react-radio-group sonner
```

## After Installation

1. **Run the build** to verify everything works:
   ```bash
   npm run build
   ```

2. **Start the dev server**:
   ```bash
   npm run dev
   ```

3. **Run database migrations** (in Supabase SQL Editor):
   - Execute `supabase/pricing-config-table.sql`
   - Execute `supabase/update-bookings-pricing.sql`
   - Execute `supabase/seed-pricing.sql`

4. **Test the admin interface**:
   - Navigate to `/admin`
   - Click on "Pricing" tab
   - Try editing a price

## Files Created

### UI Components (3 new files)
- `components/ui/tabs.tsx`
- `components/ui/alert-dialog.tsx`
- `components/ui/radio-group.tsx`

These provide the UI primitives needed for:
- Tabbed interface in the pricing admin panel
- Confirmation dialogs when deleting scheduled prices
- Radio buttons for frequency selection in booking flow

## Troubleshooting

### If build still fails:
1. Delete `node_modules` and `package-lock.json`
2. Run `npm install`
3. Run `npm run build`

### If types are missing:
The Radix UI packages come with TypeScript definitions, so no additional `@types` packages are needed.

### Alternative: Manual Installation
If you prefer to use the shadcn/ui CLI:
```bash
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add alert-dialog
npx shadcn-ui@latest add radio-group
```

## What's Next

Once packages are installed and the build succeeds:
1. Run database migrations
2. Test pricing management in admin dashboard
3. Test booking flow with frequency selection
4. Verify price calculations include service fee and frequency discounts

See `DYNAMIC_PRICING_SYSTEM_COMPLETE.md` for complete documentation.

