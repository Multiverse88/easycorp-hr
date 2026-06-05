#!/bin/bash
# Exit immediately if a command exits with a non-zero status
set -e

# CONFIGURATION
# Adjust these variables on your VPS if necessary
PROJECT_DIR="$(pwd)"
BRANCH="main"

echo "=================================================="
echo "🚀 Starting Redeployment: $(date)"
echo "=================================================="

# Ensure we are in the project directory
cd "$PROJECT_DIR"

# 1. Pull latest code from GitHub
echo "🔄 Fetching latest code from branch '$BRANCH'..."
# Fetch and hard reset to ensure local changes (if any) don't block the pull
git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"

# 2. Rebuild and restart containers
echo "📦 Building and starting Docker containers..."
docker compose up -d --build

# 3. Clean up unused Docker images (important for VPS disk space)
echo "🧹 Cleaning up unused Docker images..."
docker image prune -f

echo "=================================================="
echo "✅ Redeployment Completed Successfully: $(date)"
echo "=================================================="
