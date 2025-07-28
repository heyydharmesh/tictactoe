#!/bin/bash

# Elegant Jewelry E-Commerce Deployment Script
# This script automates the deployment process on AWS EC2

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="jewelry-ecommerce"
DOMAIN="your-domain.com"
EMAIL="admin@your-domain.com"

echo -e "${GREEN}🚀 Starting deployment of Elegant Jewelry E-Commerce...${NC}"

# Update system
echo -e "${YELLOW}📦 Updating system packages...${NC}"
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js
echo -e "${YELLOW}📦 Installing Node.js...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
echo -e "${YELLOW}📦 Installing PM2...${NC}"
sudo npm install -g pm2

# Install Nginx
echo -e "${YELLOW}📦 Installing Nginx...${NC}"
sudo apt-get install -y nginx

# Install Certbot for SSL
echo -e "${YELLOW}📦 Installing Certbot...${NC}"
sudo apt-get install -y certbot python3-certbot-nginx

# Install Docker (optional)
echo -e "${YELLOW}📦 Installing Docker...${NC}"
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Create application directory
echo -e "${YELLOW}📁 Creating application directory...${NC}"
sudo mkdir -p /var/www/$APP_NAME
sudo chown $USER:$USER /var/www/$APP_NAME

# Clone repository (if not already done)
if [ ! -d "/var/www/$APP_NAME/.git" ]; then
    echo -e "${YELLOW}📥 Cloning repository...${NC}"
    cd /var/www/$APP_NAME
    git clone https://github.com/yourusername/jewelry-ecommerce.git .
else
    echo -e "${YELLOW}📥 Pulling latest changes...${NC}"
    cd /var/www/$APP_NAME
    git pull origin main
fi

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install
cd client && npm install && npm run build && cd ..

# Create environment file
echo -e "${YELLOW}⚙️ Setting up environment variables...${NC}"
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "Please edit the .env file with your production values"
    echo "Press Enter when ready to continue..."
    read
fi

# Create Nginx configuration
echo -e "${YELLOW}🌐 Setting up Nginx...${NC}"
sudo tee /etc/nginx/sites-available/$APP_NAME > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Start application with PM2
echo -e "${YELLOW}🚀 Starting application with PM2...${NC}"
cd /var/www/$APP_NAME
pm2 delete $APP_NAME 2>/dev/null || true
pm2 start server/index.js --name $APP_NAME
pm2 startup
pm2 save

# Restart Nginx
echo -e "${YELLOW}🔄 Restarting Nginx...${NC}"
sudo systemctl restart nginx
sudo systemctl enable nginx

# Setup SSL certificate
echo -e "${YELLOW}🔒 Setting up SSL certificate...${NC}"
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --email $EMAIL --agree-tos --non-interactive

# Setup firewall
echo -e "${YELLOW}🔥 Configuring firewall...${NC}"
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Setup automatic backups
echo -e "${YELLOW}💾 Setting up automatic backups...${NC}"
sudo mkdir -p /var/backups/$APP_NAME
sudo tee /etc/cron.daily/backup-$APP_NAME > /dev/null <<EOF
#!/bin/bash
cd /var/www/$APP_NAME
tar -czf /var/backups/$APP_NAME/backup-\$(date +%Y%m%d).tar.gz .
find /var/backups/$APP_NAME -name "backup-*.tar.gz" -mtime +7 -delete
EOF
sudo chmod +x /etc/cron.daily/backup-$APP_NAME

# Setup log rotation
echo -e "${YELLOW}📝 Setting up log rotation...${NC}"
sudo tee /etc/logrotate.d/$APP_NAME > /dev/null <<EOF
/var/www/$APP_NAME/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
}
EOF

# Create monitoring script
echo -e "${YELLOW}📊 Setting up monitoring...${NC}"
sudo tee /usr/local/bin/monitor-$APP_NAME > /dev/null <<EOF
#!/bin/bash
if ! pgrep -f "node.*$APP_NAME" > /dev/null; then
    echo "\$(date): $APP_NAME is down, restarting..." >> /var/log/$APP_NAME-monitor.log
    cd /var/www/$APP_NAME
    pm2 restart $APP_NAME
fi
EOF
sudo chmod +x /usr/local/bin/monitor-$APP_NAME

# Add monitoring to crontab
(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/monitor-$APP_NAME") | crontab -

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}🌐 Your application is now running at: https://$DOMAIN${NC}"
echo -e "${YELLOW}📋 Next steps:${NC}"
echo -e "1. Update your DNS records to point to this server"
echo -e "2. Configure your domain in the Nginx configuration"
echo -e "3. Set up your production environment variables"
echo -e "4. Test the application thoroughly"
echo -e "5. Set up monitoring and alerting"

# Display status
echo -e "${YELLOW}📊 Application Status:${NC}"
pm2 status
sudo systemctl status nginx

echo -e "${GREEN}🎉 Deployment script completed!${NC}"