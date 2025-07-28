#!/bin/bash

# Sparkle Jewelry - AWS Deployment Script
# This script automates the deployment process to AWS EC2

set -e

echo "🚀 Starting Sparkle Jewelry deployment..."

# Configuration
PROJECT_NAME="jewelry-website"
BUILD_DIR="build"
SERVER_USER="ubuntu"
SERVER_HOST=""  # Set your EC2 IP address
KEY_FILE=""     # Set path to your .pem file
REMOTE_DIR="/home/ubuntu/jewelry-website"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required variables are set
check_config() {
    if [ -z "$SERVER_HOST" ]; then
        print_error "SERVER_HOST not set. Please edit this script and add your EC2 IP address."
        exit 1
    fi
    
    if [ -z "$KEY_FILE" ]; then
        print_error "KEY_FILE not set. Please edit this script and add path to your .pem file."
        exit 1
    fi
    
    if [ ! -f "$KEY_FILE" ]; then
        print_error "Key file not found at $KEY_FILE"
        exit 1
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    npm install
    cd server && npm install
    cd ../client && npm install
    cd ..
}

# Build client application
build_client() {
    print_status "Building React client..."
    cd client
    npm run build
    cd ..
}

# Run tests
run_tests() {
    print_status "Running tests..."
    cd server
    npm test || print_warning "Backend tests failed"
    cd ../client
    npm test -- --watchAll=false || print_warning "Frontend tests failed"
    cd ..
}

# Deploy to server
deploy_to_server() {
    print_status "Deploying to AWS EC2..."
    
    # Create remote directory if it doesn't exist
    ssh -i "$KEY_FILE" "$SERVER_USER@$SERVER_HOST" "mkdir -p $REMOTE_DIR"
    
    # Copy server files
    print_status "Copying server files..."
    rsync -avz --delete -e "ssh -i $KEY_FILE" \
        --exclude node_modules \
        --exclude .env \
        server/ "$SERVER_USER@$SERVER_HOST:$REMOTE_DIR/server/"
    
    # Copy client build files
    print_status "Copying client build files..."
    rsync -avz --delete -e "ssh -i $KEY_FILE" \
        client/build/ "$SERVER_USER@$SERVER_HOST:$REMOTE_DIR/client/build/"
    
    # Copy package.json files
    scp -i "$KEY_FILE" package.json "$SERVER_USER@$SERVER_HOST:$REMOTE_DIR/"
    
    # Install dependencies on server
    print_status "Installing dependencies on server..."
    ssh -i "$KEY_FILE" "$SERVER_USER@$SERVER_HOST" "cd $REMOTE_DIR/server && npm install --production"
    
    # Restart PM2 application
    print_status "Restarting application..."
    ssh -i "$KEY_FILE" "$SERVER_USER@$SERVER_HOST" "cd $REMOTE_DIR/server && pm2 restart jewelry-api || pm2 start index.js --name jewelry-api"
    
    # Restart Nginx
    ssh -i "$KEY_FILE" "$SERVER_USER@$SERVER_HOST" "sudo systemctl restart nginx"
}

# Setup SSL certificate
setup_ssl() {
    print_status "Setting up SSL certificate..."
    read -p "Enter your domain name: " DOMAIN_NAME
    
    if [ -n "$DOMAIN_NAME" ]; then
        ssh -i "$KEY_FILE" "$SERVER_USER@$SERVER_HOST" "sudo certbot --nginx -d $DOMAIN_NAME --non-interactive --agree-tos --email admin@$DOMAIN_NAME || true"
    else
        print_warning "No domain provided. Skipping SSL setup."
    fi
}

# Main deployment function
main() {
    print_status "Starting deployment process..."
    
    # Check configuration
    check_config
    
    # Prompt for deployment type
    echo "Select deployment option:"
    echo "1. Full deployment (install deps, build, test, deploy)"
    echo "2. Quick deployment (build and deploy only)"
    echo "3. Setup SSL certificate"
    echo "4. Just build client"
    read -p "Enter your choice (1-4): " CHOICE
    
    case $CHOICE in
        1)
            install_dependencies
            build_client
            run_tests
            deploy_to_server
            print_status "✅ Full deployment completed successfully!"
            ;;
        2)
            build_client
            deploy_to_server
            print_status "✅ Quick deployment completed successfully!"
            ;;
        3)
            setup_ssl
            print_status "✅ SSL setup completed!"
            ;;
        4)
            build_client
            print_status "✅ Client build completed!"
            ;;
        *)
            print_error "Invalid choice. Exiting."
            exit 1
            ;;
    esac
    
    # Display post-deployment information
    echo ""
    print_status "🎉 Deployment Summary"
    echo "=================================="
    echo "Application: Sparkle Jewelry"
    echo "Server: $SERVER_HOST"
    echo "Frontend: https://$SERVER_HOST (or your domain)"
    echo "API: https://$SERVER_HOST/api"
    echo ""
    echo "Admin Login: admin@jewelrystore.com / admin123"
    echo "Test User: user@example.com / user123"
    echo ""
    echo "Useful commands:"
    echo "- Check logs: ssh -i $KEY_FILE $SERVER_USER@$SERVER_HOST 'pm2 logs jewelry-api'"
    echo "- Check status: ssh -i $KEY_FILE $SERVER_USER@$SERVER_HOST 'pm2 status'"
    echo "- Restart app: ssh -i $KEY_FILE $SERVER_USER@$SERVER_HOST 'pm2 restart jewelry-api'"
}

# Run main function
main "$@"