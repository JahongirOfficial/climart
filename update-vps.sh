#!/bin/bash

# Quick update script for VPS deployment
# Run this from your local machine after pushing changes to GitHub

VPS_IP="167.86.95.237"
VPS_USER="root"
PROJECT_DIR="/var/www/climart"

echo "🔄 Updating climart.biznesjon.uz..."

ssh $VPS_USER@$VPS_IP << 'ENDSSH'
cd /var/www/climart
echo "📥 Pulling latest changes..."
git pull origin main

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building project..."
npm run build

echo "🔄 Restarting application..."
pm2 restart climart

echo "✅ Update completed!"
echo "🌐 Site: https://climart.biznesjon.uz"
ENDSSH

echo ""
echo "🎉 Deployment completed successfully!"
echo "🌐 Visit: https://climart.biznesjon.uz"
