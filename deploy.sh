#!/bin/bash

# Deployment script for climart.biznesjon.uz
# Run this script on the VPS server

set -e

PROJECT_DIR="/var/www/climart"
DOMAIN="climart.biznesjon.uz"
REPO_URL="https://github.com/JahongirOfficial/climart.git"

echo "🚀 Starting deployment for $DOMAIN..."

# Install Node.js and pnpm if not installed
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    sudo npm install -g pnpm
fi

# Install PM2 if not installed
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    sudo npm install -g pm2
fi

# Create project directory if it doesn't exist
if [ ! -d "$PROJECT_DIR" ]; then
    echo "📁 Creating project directory..."
    sudo mkdir -p "$PROJECT_DIR"
    sudo chown -R $USER:$USER "$PROJECT_DIR"
fi

# Clone or pull repository
if [ -d "$PROJECT_DIR/.git" ]; then
    echo "🔄 Pulling latest changes..."
    cd "$PROJECT_DIR"
    git pull origin main
else
    echo "📥 Cloning repository..."
    git clone "$REPO_URL" "$PROJECT_DIR"
    cd "$PROJECT_DIR"
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Build the project
echo "🔨 Building project..."
pnpm build

# Copy .env if it doesn't exist
if [ ! -f "$PROJECT_DIR/.env" ]; then
    echo "⚙️  Creating .env file..."
    cp .env.example .env 2>/dev/null || echo "PORT=8080" > .env
fi

# Stop existing PM2 process
echo "🛑 Stopping existing process..."
pm2 delete climart 2>/dev/null || true

# Start with PM2
echo "▶️  Starting application with PM2..."
pm2 start pnpm --name climart -- start
pm2 save
pm2 startup

echo "✅ Application deployed successfully!"
echo "📝 Next steps:"
echo "   1. Configure nginx for domain $DOMAIN"
echo "   2. Set up SSL certificate with certbot"
echo "   3. Check logs with: pm2 logs climart"
