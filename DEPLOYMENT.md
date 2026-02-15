# Deployment Guide for climart.biznesjon.uz

## Prerequisites
- VPS with Ubuntu/Debian
- Domain `climart.biznesjon.uz` pointing to IP `167.86.95.237`
- SSH access to the VPS

## Step 1: Add SSH Key to VPS

From your local machine, copy your SSH public key:

```bash
# Your SSH public key is already generated
# Copy it to clipboard or use this command to add it to VPS:
ssh-copy-id root@167.86.95.237
# OR manually:
cat ~/.ssh/id_rsa.pub
# Then paste it into VPS: ~/.ssh/authorized_keys
```

## Step 2: Connect to VPS

```bash
ssh root@167.86.95.237
```

## Step 3: Initial Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install nginx
sudo apt install nginx -y

# Install certbot for SSL
sudo apt install certbot python3-certbot-nginx -y

# Enable firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## Step 4: Deploy Application

Copy the `deploy.sh` script to your VPS and run it:

```bash
# From your local machine, copy the script:
scp deploy.sh root@167.86.95.237:/tmp/deploy.sh

# On VPS, run the deployment:
ssh root@167.86.95.237
chmod +x /tmp/deploy.sh
/tmp/deploy.sh
```

Or manually run these commands on VPS:

```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
sudo npm install -g pnpm

# Install PM2
sudo npm install -g pm2

# Clone repository
sudo mkdir -p /var/www/climart
sudo chown -R $USER:$USER /var/www/climart
git clone https://github.com/JahongirOfficial/climart.git /var/www/climart
cd /var/www/climart

# Install dependencies and build
pnpm install
pnpm build

# Configure environment
cp .env.example .env 2>/dev/null || echo "PORT=8080" > .env
# Edit .env with your settings if needed
nano .env

# Start with PM2
pm2 start pnpm --name climart -- start
pm2 save
pm2 startup
```

## Step 5: Configure Nginx

```bash
# Copy nginx configuration
sudo cp /var/www/climart/nginx-config.conf /etc/nginx/sites-available/climart.biznesjon.uz

# Enable site
sudo ln -s /etc/nginx/sites-available/climart.biznesjon.uz /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

## Step 6: Set Up SSL Certificate

```bash
# Get SSL certificate from Let's Encrypt
sudo certbot --nginx -d climart.biznesjon.uz

# Certbot will automatically configure nginx for HTTPS
# Follow the prompts and select option to redirect HTTP to HTTPS
```

## Step 7: Verify Deployment

```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs climart

# Check nginx status
sudo systemctl status nginx

# Test the application
curl http://localhost:8080
curl http://climart.biznesjon.uz
```

## Updating the Application

To update the application after pushing changes to GitHub:

```bash
ssh root@167.86.95.237
cd /var/www/climart
git pull origin main
pnpm install
pnpm build
pm2 restart climart
```

Or create an automated deployment script:

```bash
# On VPS, create update script
cat > /var/www/climart/update.sh << 'EOF'
#!/bin/bash
cd /var/www/climart
git pull origin main
pnpm install
pnpm build
pm2 restart climart
echo "✅ Application updated successfully!"
EOF

chmod +x /var/www/climart/update.sh

# Run updates with:
/var/www/climart/update.sh
```

## Useful Commands

```bash
# PM2 commands
pm2 status              # Check status
pm2 logs climart        # View logs
pm2 restart climart     # Restart app
pm2 stop climart        # Stop app
pm2 delete climart      # Remove from PM2

# Nginx commands
sudo systemctl status nginx    # Check status
sudo systemctl restart nginx   # Restart
sudo nginx -t                  # Test config
sudo tail -f /var/log/nginx/error.log  # View error logs

# SSL renewal (automatic, but can be tested)
sudo certbot renew --dry-run
```

## Troubleshooting

### Application not starting
```bash
pm2 logs climart --lines 100
cd /var/www/climart
pnpm start  # Test manually
```

### Port already in use
```bash
sudo lsof -i :8080
# Kill the process or change PORT in .env
```

### Nginx errors
```bash
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

### Domain not resolving
- Check DNS settings: `nslookup climart.biznesjon.uz`
- Verify A record points to `167.86.95.237`
- Wait for DNS propagation (up to 48 hours)

## Security Recommendations

1. Create a non-root user for deployment
2. Set up automatic security updates
3. Configure fail2ban
4. Regular backups
5. Monitor logs regularly

```bash
# Create deployment user
sudo adduser deploy
sudo usermod -aG sudo deploy
# Copy SSH keys to deploy user
```
