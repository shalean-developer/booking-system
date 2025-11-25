# Clear Next.js and Turbopack cache
Write-Host "Clearing Next.js cache..." -ForegroundColor Yellow
if (Test-Path .next) {
    Remove-Item -Recurse -Force .next
    Write-Host "✓ Cleared .next directory" -ForegroundColor Green
} else {
    Write-Host "✓ .next directory doesn't exist" -ForegroundColor Green
}

Write-Host "Clearing node_modules cache..." -ForegroundColor Yellow
if (Test-Path node_modules/.cache) {
    Remove-Item -Recurse -Force node_modules/.cache
    Write-Host "✓ Cleared node_modules/.cache" -ForegroundColor Green
} else {
    Write-Host "✓ node_modules/.cache doesn't exist" -ForegroundColor Green
}

Write-Host "`nCache cleared! Please restart your dev server." -ForegroundColor Cyan

