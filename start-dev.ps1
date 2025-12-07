# Script to start Next.js dev server with lock file cleanup
Write-Host "Starting Next.js dev server..." -ForegroundColor Cyan

# Kill any existing Node processes
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "Stopping existing Node processes..." -ForegroundColor Yellow
    $nodeProcesses | Stop-Process -Force
    Start-Sleep -Seconds 2
}

# Remove lock file and dev directory
$lockPath = ".next\dev\lock"
$devPath = ".next\dev"

if (Test-Path $lockPath) {
    Write-Host "Removing lock file..." -ForegroundColor Yellow
    Remove-Item $lockPath -Force -ErrorAction SilentlyContinue
}

if (Test-Path $devPath) {
    Write-Host "Removing .next\dev directory..." -ForegroundColor Yellow
    Remove-Item $devPath -Recurse -Force -ErrorAction SilentlyContinue
}

Start-Sleep -Milliseconds 500

# Start the dev server
Write-Host "`nStarting dev server on port 3002..." -ForegroundColor Green
npm run dev

