#!/bin/bash
# ==============================================================================
# CampaignFlow — Automated AWS EC2 Update & Deployment Script
# Automatically pulls latest code, runs migrations, builds frontend,
# configures worker, and restarts PM2 services.
# ==============================================================================

set -e

# Detect project directory (use current directory or default /var/www/campaignflow)
if [ -d "/var/www/campaignflow" ]; then
    PROJECT_DIR="/var/www/campaignflow"
else
    PROJECT_DIR="$(pwd)"
fi

echo "🚀 [Deploy] Target Directory: ${PROJECT_DIR}"
cd "${PROJECT_DIR}"

# 1. Pull latest changes from Git
echo "📥 [Deploy] Pulling latest code from GitHub..."
git pull origin main

# 2. Update Backend dependencies (installs exceljs, etc.)
echo "📦 [Deploy] Installing backend packages..."
cd "${PROJECT_DIR}/backend"
npm install --production=false

# 3. Create uploads directory with write permissions
echo "📁 [Deploy] Ensuring uploads directory exists..."
mkdir -p "${PROJECT_DIR}/backend/uploads/imports"
chmod -R 775 "${PROJECT_DIR}/backend/uploads"

# 4. Run MySQL database migrations (applies 010_optimized_import_queue.sql)
echo "🐬 [Deploy] Applying database migrations..."
npm run migrate

# 5. Build Frontend
echo "⚛️ [Deploy] Building frontend assets..."
cd "${PROJECT_DIR}/frontend"
npm install
npm run build

# 6. Restart PM2 processes with new import worker
echo "🔄 [Deploy] Updating PM2 services (API + Import Worker)..."
cd "${PROJECT_DIR}"
pm2 startOrReload ecosystem.config.cjs --update-env
pm2 save

# 7. Reload Nginx for 100MB body size configuration
if command -v nginx > /dev/null; then
    echo "🌐 [Deploy] Reloading Nginx..."
    sudo systemctl reload nginx 2>/dev/null || true
fi

echo "===================================================="
echo "✅ Deployment Completed Successfully!"
echo "===================================================="
pm2 status

