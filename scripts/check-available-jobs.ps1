# ============================================
# Check Available Jobs Configuration
# ============================================
# This script helps diagnose why bookings aren't showing in available jobs

Write-Host "🔍 Available Jobs Diagnostic Tool" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env.local exists
if (Test-Path ".env.local") {
    Write-Host "✅ .env.local file found" -ForegroundColor Green
    
    # Check for required environment variables
    $envContent = Get-Content ".env.local" -Raw
    
    $requiredVars = @(
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        "SUPABASE_SERVICE_ROLE_KEY"
    )
    
    $missingVars = @()
    foreach ($var in $requiredVars) {
        if ($envContent -notmatch $var) {
            $missingVars += $var
        } else {
            Write-Host "  ✅ $var is set" -ForegroundColor Green
        }
    }
    
    if ($missingVars.Count -gt 0) {
        Write-Host "  ⚠️  Missing environment variables:" -ForegroundColor Yellow
        foreach ($var in $missingVars) {
            Write-Host "    - $var" -ForegroundColor Yellow
        }
    }
    
} else {
    Write-Host "❌ .env.local file not found" -ForegroundColor Red
    Write-Host "   Please create .env.local with your Supabase credentials" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Open your Supabase SQL Editor: https://app.supabase.com" -ForegroundColor White
Write-Host ""
Write-Host "2. Run the diagnostic query:" -ForegroundColor White
Write-Host "   File: supabase/quick-diagnose-jobs.sql" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. Check for these common issues:" -ForegroundColor White
Write-Host "   • Bookings have cleaner_id = NULL" -ForegroundColor Gray
Write-Host "   • Bookings have status = 'pending'" -ForegroundColor Gray
Write-Host "   • Bookings are dated today or future" -ForegroundColor Gray
Write-Host "   • Booking location matches cleaner areas" -ForegroundColor Gray
Write-Host ""
Write-Host "4. If needed, run the fix:" -ForegroundColor White
Write-Host "   File: supabase/make-bookings-available.sql" -ForegroundColor Yellow
Write-Host ""
Write-Host "📖 Full documentation: AVAILABLE_JOBS_TROUBLESHOOTING.md" -ForegroundColor Cyan
Write-Host ""

# Check if node_modules exists
if (Test-Path "node_modules") {
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "⚠️  node_modules not found - run: npm install" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🚀 To start the dev server: npm run dev" -ForegroundColor Cyan
Write-Host ""

