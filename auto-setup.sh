#!/bin/bash

# Auto Manual Setup - Run all commands automatically
# Usage: chmod +x auto-setup.sh && ./auto-setup.sh

set -e

echo "=========================================="
echo "Auto Backend & Frontend Setup"
echo "=========================================="
echo ""

# Configuration
APP_DIR="/home/ubuntu/apps/price-tracker-pro"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_step() {
    echo -e "${GREEN}[STEP]${NC} $1"
}

print_done() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# ============================================
# STEP 1: Fix Git Conflict
# ============================================
print_step "Fix Git Conflict"
cd "$APP_DIR"
echo "Stashing local changes..."
git stash || true
echo "Pulling latest code..."
git pull origin main
echo "Restoring local changes..."
git stash pop || true
print_done "Git conflict resolved"
echo ""

# ============================================
# STEP 2: Install Backend Dependencies
# ============================================
print_step "Install Backend Dependencies"
cd "$BACKEND_DIR"
echo "Installing npm packages..."
npm install --production
print_done "Backend dependencies installed"
echo ""

# ============================================
# STEP 3: Install Frontend Dependencies
# ============================================
print_step "Install Frontend Dependencies"
cd "$FRONTEND_DIR"
echo "Installing npm packages..."
npm install
print_done "Frontend dependencies installed"
echo ""

# ============================================
# STEP 4: Build Frontend
# ============================================
print_step "Build Frontend"
cd "$FRONTEND_DIR"
echo "Building with Vite..."
npm run build
if [ -d "$FRONTEND_DIR/dist" ]; then
    FILES_COUNT=$(ls -1 "$FRONTEND_DIR/dist" | wc -l)
    print_done "Frontend built successfully ($FILES_COUNT files in dist/)"
else
    echo -e "${RED}✗${NC} Build directory not created"
    exit 1
fi
echo ""

# ============================================
# STEP 5: Start Backend with PM2
# ============================================
print_step "Start Backend with PM2"
cd "$BACKEND_DIR"

# Stop existing process
echo "Stopping existing PM2 app..."
pm2 stop price-tracker-backend 2>/dev/null || true
sleep 1
pm2 delete price-tracker-backend 2>/dev/null || true
sleep 1

# Start new process
echo "Starting backend with PM2..."
pm2 start server.js --name "price-tracker-backend" --env production
sleep 2

# Check if started successfully
if pm2 describe price-tracker-backend | grep -q "online"; then
    print_done "Backend started successfully with PM2"
else
    print_warning "Checking PM2 status..."
    pm2 status
fi

# Save PM2 config
pm2 save
echo ""

# ============================================
# STEP 6: Verify Everything
# ============================================
print_step "Verify Everything"
echo ""

echo "PM2 Status:"
pm2 status
echo ""

echo "Backend Health Check:"
if curl -s http://localhost:8080/health | grep -q "ok"; then
    print_done "Backend is responding"
else
    print_warning "Backend health check may not be ready yet"
fi
echo ""

echo "Frontend Build:"
ls -lh "$FRONTEND_DIR/dist/" | head -10
echo ""

echo "Nginx Test:"
if sudo nginx -t 2>&1 | grep -q "successful"; then
    print_done "Nginx configuration is valid"
else
    print_warning "Nginx test failed - may need manual review"
fi
echo ""

# ============================================
# SUMMARY
# ============================================
echo "=========================================="
echo -e "${GREEN}Setup Completed!${NC}"
echo "=========================================="
echo ""
echo "Application Status:"
echo "  Frontend: $FRONTEND_DIR/dist"
echo "  Backend: http://localhost:8080"
echo "  Public URL: http://vaycuoineo.vn"
echo ""
echo "Next Steps:"
echo "  1. Reload Nginx: sudo systemctl reload nginx"
echo "  2. Test: curl http://localhost:8080/health"
echo "  3. Visit: http://vaycuoineo.vn"
echo ""
echo "Useful Commands:"
echo "  - View logs: pm2 logs price-tracker-backend"
echo "  - Restart: pm2 restart price-tracker-backend"
echo "  - Stop: pm2 stop price-tracker-backend"
echo "  - Status: pm2 status"
echo ""
