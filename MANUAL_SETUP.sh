#!/bin/bash

# Manual Backend Start & Frontend Build Guide
# Run these commands step by step on VPS

echo "=========================================="
echo "Manual Backend & Frontend Setup"
echo "=========================================="
echo ""

# Configuration
APP_DIR="/home/ubuntu/apps/price-tracker-pro"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"

echo "📁 Working directory: $APP_DIR"
echo ""

# ============================================
# STEP 1: Fix Git Conflict
# ============================================
echo "STEP 1: Fix Git Conflict"
echo "========================================"
echo "Run these commands:"
echo ""
echo "cd $APP_DIR"
echo "git stash"
echo "git pull origin main"
echo "git stash pop"
echo ""
echo "✓ After this, your local changes (database.db, .env.production) will be restored"
echo ""

# ============================================
# STEP 2: Install Dependencies
# ============================================
echo ""
echo "STEP 2: Install Dependencies"
echo "========================================"
echo "Backend dependencies:"
echo "  cd $BACKEND_DIR"
echo "  npm install"
echo ""
echo "Frontend dependencies:"
echo "  cd $FRONTEND_DIR"
echo "  npm install"
echo ""
echo "✓ This installs all required packages"
echo ""

# ============================================
# STEP 3: Build Frontend
# ============================================
echo ""
echo "STEP 3: Build Frontend (Create Static Files)"
echo "========================================"
echo "Run these commands:"
echo ""
echo "  cd $FRONTEND_DIR"
echo "  npm run build"
echo ""
echo "This will:"
echo "  - Compile TypeScript"
echo "  - Bundle with Vite"
echo "  - Create production-ready files in: $FRONTEND_DIR/dist"
echo ""
echo "Output files will be in:"
echo "  $FRONTEND_DIR/dist/"
echo ""
echo "✓ Wait for it to complete"
echo ""

# ============================================
# STEP 4: Start Backend with PM2
# ============================================
echo ""
echo "STEP 4: Start Backend with PM2"
echo "========================================"
echo "Run these commands:"
echo ""
echo "  cd $BACKEND_DIR"
echo ""
echo "Option A - Start as new app:"
echo "  pm2 start server.js --name 'price-tracker-backend' --env production"
echo ""
echo "Option B - If app already running:"
echo "  pm2 restart price-tracker-backend"
echo ""
echo "Option C - Start fresh (recommended):"
echo "  pm2 stop price-tracker-backend"
echo "  pm2 delete price-tracker-backend"
echo "  pm2 start server.js --name 'price-tracker-backend' --env production"
echo ""
echo "Save PM2 config:"
echo "  pm2 save"
echo ""
echo "View logs:"
echo "  pm2 logs price-tracker-backend"
echo ""
echo "✓ Backend should now be running on http://localhost:8080"
echo ""

# ============================================
# STEP 5: Verify Everything
# ============================================
echo ""
echo "STEP 5: Verify Everything"
echo "========================================"
echo ""
echo "Check PM2 status:"
echo "  pm2 status"
echo ""
echo "Check backend health:"
echo "  curl http://localhost:8080/health"
echo ""
echo "Check frontend files:"
echo "  ls -la $FRONTEND_DIR/dist"
echo ""
echo "Check Nginx config:"
echo "  sudo nginx -t"
echo ""
echo "Reload Nginx:"
echo "  sudo systemctl reload nginx"
echo ""
echo "Check if working:"
echo "  curl http://vaycuoineo.vn"
echo ""
echo "✓ Everything should be working now!"
echo ""

# ============================================
# QUICK REFERENCE
# ============================================
echo ""
echo "QUICK REFERENCE"
echo "========================================"
echo ""
echo "📝 All commands in order:"
echo ""
echo "cd $APP_DIR"
echo "git stash"
echo "git pull origin main"
echo "git stash pop"
echo ""
echo "cd $BACKEND_DIR"
echo "npm install"
echo ""
echo "cd $FRONTEND_DIR"
echo "npm install"
echo "npm run build"
echo ""
echo "cd $BACKEND_DIR"
echo "pm2 stop price-tracker-backend 2>/dev/null || true"
echo "pm2 delete price-tracker-backend 2>/dev/null || true"
echo "pm2 start server.js --name 'price-tracker-backend' --env production"
echo "pm2 save"
echo ""
echo "curl http://localhost:8080/health"
echo "ls -la $FRONTEND_DIR/dist"
echo ""
echo "✅ Done!"
echo ""
