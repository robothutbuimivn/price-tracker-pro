#!/bin/bash

# Fix git merge conflict on VPS
# Usage: chmod +x fix-git-conflict.sh && ./fix-git-conflict.sh

set -e

echo "Fixing git merge conflict..."
echo ""

# Step 1: Stash local changes
echo "Step 1: Stashing local changes..."
git stash
echo "✓ Local changes stashed"
echo ""

# Step 2: Pull latest code
echo "Step 2: Pulling latest code from git..."
git pull origin main
echo "✓ Code pulled successfully"
echo ""

# Step 3: Restore local changes
echo "Step 3: Restoring local changes (database & config)..."
git stash pop || {
    echo "Note: If there are conflicts, they will be marked in the files"
    echo "You may need to manually resolve them"
}
echo ""

# Step 4: Add important files to git ignore
echo "Step 4: Adding local files to .gitignore..."

# Check if .gitignore exists
if [ ! -f ".gitignore" ]; then
    touch .gitignore
fi

# Add important files if not already there
if ! grep -q "backend/database.db" .gitignore; then
    echo "backend/database.db" >> .gitignore
    echo "✓ Added backend/database.db to .gitignore"
fi

if ! grep -q "frontend/.env.production" .gitignore; then
    echo "frontend/.env.production" >> .gitignore
    echo "✓ Added frontend/.env.production to .gitignore"
fi

if ! grep -q "backend/backend.log" .gitignore; then
    echo "backend/backend.log" >> .gitignore
    echo "✓ Added backend/backend.log to .gitignore"
fi

if ! grep -q "node_modules/" .gitignore; then
    echo "node_modules/" >> .gitignore
    echo "✓ Added node_modules/ to .gitignore"
fi

echo ""
echo "✅ Git conflict resolution completed!"
echo ""
echo "Next step: Run deploy script"
echo "  ./deploy.sh"
