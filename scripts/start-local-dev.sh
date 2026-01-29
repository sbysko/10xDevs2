#!/bin/bash

# Start Local Development Environment
# This script helps set up the full local development environment for testing

set -e

echo "================================================"
echo "🚀 Starting Local Development Environment"
echo "================================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Check Docker
echo -e "${BLUE}Step 1: Checking Docker...${NC}"
if ! docker ps >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running!${NC}"
    echo ""
    echo "Please start Docker Desktop manually:"
    echo "  1. Open Docker Desktop application"
    echo "  2. Wait for it to fully start (whale icon in system tray)"
    echo "  3. Run this script again"
    echo ""
    exit 1
else
    echo -e "${GREEN}✅ Docker is running${NC}"
fi

# Step 2: Start Supabase
echo ""
echo -e "${BLUE}Step 2: Starting Supabase...${NC}"
npx supabase start

# Step 3: Display connection info
echo ""
echo -e "${GREEN}✅ Supabase is running!${NC}"
echo ""
echo "================================================"
echo "📋 Connection Information"
echo "================================================"
npx supabase status | grep -E "(API URL|DB URL|Studio URL|anon key)"

# Step 4: Check if .env is configured
echo ""
echo -e "${BLUE}Step 3: Checking environment variables...${NC}"

if [ ! -f ".env" ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo ""
    echo "Creating .env file with local Supabase credentials..."

    # Get credentials from Supabase status
    API_URL=$(npx supabase status --output json 2>/dev/null | grep -o '"API URL":"[^"]*' | sed 's/"API URL":"//')
    ANON_KEY=$(npx supabase status --output json 2>/dev/null | grep -o '"anon key":"[^"]*' | sed 's/"anon key":"//')

    cat > .env << EOF
# Local Supabase Configuration
SUPABASE_URL=${API_URL}
SUPABASE_KEY=${ANON_KEY}
EOF

    echo -e "${GREEN}✅ .env file created${NC}"
else
    echo -e "${GREEN}✅ .env file exists${NC}"
fi

# Step 5: Start Astro dev server
echo ""
echo -e "${BLUE}Step 4: Starting Astro dev server...${NC}"
echo ""
echo "================================================"
echo "🎮 Development Environment Ready!"
echo "================================================"
echo ""
echo "📍 Astro Dev Server: http://localhost:3000"
echo "📍 Supabase Studio:  http://localhost:54323"
echo ""
echo "Test the profiles view:"
echo "  - Demo (no auth): http://localhost:3000/profiles-demo"
echo "  - Full (with auth): http://localhost:3000/profiles"
echo ""
echo "Press Ctrl+C to stop"
echo ""

npm run dev
