# Start Local Development Environment (Windows PowerShell)
# This script helps set up the full local development environment for testing

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "🚀 Starting Local Development Environment" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Docker
Write-Host "Step 1: Checking Docker..." -ForegroundColor Blue
try {
    docker ps | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please start Docker Desktop manually:" -ForegroundColor Yellow
    Write-Host "  1. Open Docker Desktop application"
    Write-Host "  2. Wait for it to fully start (whale icon in system tray)"
    Write-Host "  3. Run this script again"
    Write-Host ""
    exit 1
}

# Step 2: Start Supabase
Write-Host ""
Write-Host "Step 2: Starting Supabase..." -ForegroundColor Blue
npx supabase start

# Step 3: Display connection info
Write-Host ""
Write-Host "✅ Supabase is running!" -ForegroundColor Green
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "📋 Connection Information" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
npx supabase status

# Step 4: Check if .env is configured
Write-Host ""
Write-Host "Step 3: Checking environment variables..." -ForegroundColor Blue

if (-not (Test-Path ".env")) {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please create .env file with Supabase credentials" -ForegroundColor Yellow
    Write-Host "Copy the API URL and anon key from above and add to .env:"
    Write-Host ""
    Write-Host "SUPABASE_URL=http://127.0.0.1:54321"
    Write-Host "SUPABASE_KEY=<your-anon-key>"
    Write-Host ""
} else {
    Write-Host "✅ .env file exists" -ForegroundColor Green
}

# Step 5: Start Astro dev server
Write-Host ""
Write-Host "Step 4: Starting Astro dev server..." -ForegroundColor Blue
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "🎮 Development Environment Ready!" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📍 Astro Dev Server: http://localhost:3000" -ForegroundColor Green
Write-Host "📍 Supabase Studio:  http://localhost:54323" -ForegroundColor Green
Write-Host ""
Write-Host "Test the profiles view:"
Write-Host "  - Demo (no auth): http://localhost:3000/profiles-demo"
Write-Host "  - Full (with auth): http://localhost:3000/profiles"
Write-Host ""
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

npm run dev
