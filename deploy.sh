#!/bin/bash
# MSBT ERP Oracle Cloud Free Tier Auto-Deployment Script
# Target OS: Ubuntu 22.04 LTS

set -e

echo "============================================="
echo "🚀 Starting MSBT ERP Auto-Deployment Script"
echo "============================================="

# 1. Update and install core dependencies
echo "📦 Updating packages and installing dependencies..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential nginx certbot python3-certbot-nginx

# 2. Install Node.js v20 LTS
echo "🟢 Installing Node.js v20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install PM2 globally
echo "🚀 Installing PM2 Process Manager..."
sudo npm install -g pm2

# 4. Open ports on Ubuntu iptables firewall (Oracle Cloud specific)
echo "🛡️ Configuring Oracle iptables firewall rules for Port 80 and 443..."
sudo iptables -I INPUT 6 -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -p tcp --dport 443 -j ACCEPT
if command -v netfilter-persistent &> /dev/null; then
    sudo netfilter-persistent save
fi

# 5. Set up directories
APP_DIR="/var/www/MSBT"
if [ -d "$APP_DIR" ]; then
    echo "📂 App directory $APP_DIR already exists. Pulling latest code..."
    cd "$APP_DIR"
    git pull origin main
else
    echo "📂 Cloning MSBT repository..."
    sudo mkdir -p /var/www
    sudo chown -R ubuntu:ubuntu /var/www
    cd /var/www
    git clone https://github.com/Rajmund09/MSBT.git
    cd MSBT
fi

# 6. Install project dependencies
echo "📥 Installing project dependencies..."
npm run install:all

# 7. Configure Backend Environment
if [ ! -f "server/.env" ]; then
    echo "🔒 Generating default backend .env file..."
    cat <<EOT > server/.env
PORT=5000
JWT_SECRET=$(openssl rand -hex 32)
SQLITE_DB_PATH=/var/www/MSBT/database/msbt.db
EOT
    echo "✅ Backend .env file generated."
else
    echo "ℹ️ Backend .env already exists. Skipping generation."
fi

# 8. Build Next.js Client
echo "🏗️ Building Next.js frontend client..."
npm run build --prefix client

# 9. Start services with PM2
echo "⚡ Starting frontend and backend services under PM2..."
pm2 delete msbt-backend || true
pm2 delete msbt-frontend || true

cd server
pm2 start server.js --name "msbt-backend"

cd ../client
pm2 start "npm run start" --name "msbt-frontend"

# Save PM2 process list and configure to start on boot
pm2 save
pm2 startup | tail -n 1 > pm2_startup_cmd.sh
chmod +x pm2_startup_cmd.sh
sudo ./pm2_startup_cmd.sh
rm pm2_startup_cmd.sh

# 10. Configure Nginx Reverse Proxy
echo "🌐 Configuring Nginx reverse proxy..."
NGINX_CONF="/etc/nginx/sites-available/msbt"
sudo bash -c "cat <<'EOF' > $NGINX_CONF
server {
    listen 80;
    server_name _; # Change this to your domain later!

    # Express API Proxy
    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    # Next.js Frontend Proxy
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF"

sudo ln -sf /etc/nginx/sites-available/msbt /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

echo "============================================="
echo "🎉 MSBT ERP Deployment Complete!"
echo "============================================="
echo "Your app is running locally on the server:"
echo "👉 Frontend: Port 3000"
echo "👉 Backend API: Port 5000"
echo "🌐 Nginx is routing public HTTP requests on Port 80 to Next.js."
echo ""
echo "To finish your setup:"
echo "1. Point your domain (A records) to this server's public IP address."
echo "2. Edit Nginx configuration with your domain name: sudo nano /etc/nginx/sites-available/msbt"
echo "3. Restart Nginx: sudo systemctl restart nginx"
echo "4. Set up SSL (HTTPS) by running: sudo certbot --nginx"
echo "============================================="
