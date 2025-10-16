# Favicon Check Script for Shalean Cleaning
Write-Host "Checking favicon files..." -ForegroundColor Green

$requiredFiles = @(
    "public/favicon.ico",
    "public/icon-32.png", 
    "public/icon-192.png",
    "public/icon-512.png",
    "public/apple-icon.png"
)

$allFilesExist = $true

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        $fileInfo = Get-Item $file
        Write-Host "✓ $file ($($fileInfo.Length) bytes)" -ForegroundColor Green
    } else {
        Write-Host "✗ $file - MISSING" -ForegroundColor Red
        $allFilesExist = $false
    }
}

if ($allFilesExist) {
    Write-Host "`n🎉 All favicon files are ready!" -ForegroundColor Green
    Write-Host "Your favicon will appear in browser tabs and bookmarks." -ForegroundColor Cyan
} else {
    Write-Host "`n⚠️  Some favicon files are missing." -ForegroundColor Yellow
    Write-Host "Please add the missing files to the public/ directory." -ForegroundColor Yellow
}
