#!/bin/bash

# Quick deployment script - run from your local machine
# This will set up everything on the VPS

VPS_IP="167.86.95.237"
VPS_USER="root"
PROJECT_DIR="/var/www/climart"
DOMAIN="climart.biznesjon.uz"

echo "🚀 Deploying to $DOMAIN ($VPS_IP)..."

# Test SSH connection
echo "🔐 Testing SSH connection..."
ssh -o ConnectTimeout=5 $VPS_USER@$VPS_IP "echo 'SSH connection successful!'" || {
    echo "❌ Cannot connect to VPS. Please check:"
    echo "   1. SSH key is added to VPS: ssh-copy-id $VPS_USER@$VPS_IP"
    echo "   2. VPS is accessible: ping $VPS_IP"
    exit 1
}

# Copy deployment files
echo "📤 Copying deployment files..."
scp deploy.sh nginx-config.conf $VPS_USER@$VPS_IP:/tmp/

# Run deployment on VPS
echo "🔧 Running deployment on VPS..."
ssh $VPS_USER@$VPS_IP << 'ENDSSH'
set -e

# Update system
echo "📦 Updating system..."
apt update && apt upgrade -y

# Install nginx if not installed
if ! command -v nginx &> /dev/null; then
    echo "📦 Installing nginx..."
    apt install nginx -y
    ufw allow 'Nginx Full'
fi

# Install certbot if not installed
if ! command -v certbot &> /dev/null; then
    echo "📦 Installing certbot..."
    apt install certbot python3-certbot-nginx -y
fi

# Run deployment script
chmod +x /tmp/deploy.sh
/tmp/deploy.sh

# Configure nginx
echo "🌐 Configuring nginx..."
cp /tmp/nginx-config.conf /etc/nginx/sites-available/climart.biznesjon.uz
ln -sf /etc/nginx/sites-available/climart.biznesjon.uz /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

echo ""
echo "✅ Deployment completed!"
echo ""
echo "📝 Next steps:"
echo "   1. Verify DNS: nslookup climart.biznesjon.uz"
echo "   2. Test HTTP: curl http://climart.biznesjon.uz"
echo "   3. Set up SSL: sudo certbot --nginx -d climart.biznesjon.uz"
echo ""
echo "🔍 Useful commands:"
echo "   pm2 logs climart    # View application logs"
echo "   pm2 status          # Check application status"
echo "   systemctl status nginx  # Check nginx status"
ENDSSH

echo ""
echo "🎉 Deployment script completed!"
echo "🌐 Your application should be available at: http://$DOMAIN"
echo ""
echo "⚠️  Don't forget to set up SSL certificate:"
echo "   ssh $VPS_USER@$VPS_IP"
echo "   sudo certbot --nginx -d $DOMAIN"
