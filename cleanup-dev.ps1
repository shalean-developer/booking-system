# Cleanup script for Next.js dev server lock issues
Write-Host "Cleaning up Next.js dev server locks..." -ForegroundColor Yellow

# Kill all Node processes
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "Found $($nodeProcesses.Count) Node process(es), stopping..." -ForegroundColor Yellow
    $nodeProcesses | Stop-Process -Force
    Start-Sleep -Seconds 2
}

# Remove .next directory
if (Test-Path ".next") {
    Write-Host "Removing .next directory..." -ForegroundColor Yellow
    Remove-Item ".next" -Recurse -Force -ErrorAction SilentlyContinue
}

# Remove lock file specifically
$lockPath = ".next\dev\lock"
if (Test-Path $lockPath) {
    Write-Host "Removing lock file..." -ForegroundColor Yellow
    Remove-Item $lockPath -Force -ErrorAction SilentlyContinue
}

# Kill process 14436 if it exists
$process14436 = Get-Process -Id 14436 -ErrorAction SilentlyContinue
if ($process14436) {
    Write-Host "Killing process 14436..." -ForegroundColor Yellow
    Stop-Process -Id 14436 -Force -ErrorAction SilentlyContinue
}

Write-Host "Cleanup complete! You can now run: npm run dev" -ForegroundColor Green
