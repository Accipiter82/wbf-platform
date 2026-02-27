#!/bin/bash

# WBF Backend AWS Deployment Script
# This script builds and deploys the backend to AWS Elastic Beanstalk

set -e  # Exit on error

echo "🚀 Starting WBF Backend Deployment to AWS..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Build the backend
echo -e "${YELLOW}📦 Building backend...${NC}"
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Build failed - dist directory not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful${NC}"

# Step 2: Copy deployment package.json
echo -e "${YELLOW}📝 Preparing deployment package...${NC}"
cp deploy-package.json dist/package.json
cp Procfile dist/ 2>/dev/null || echo "web: node index.js" > dist/Procfile

# Step 3: Check if EB CLI is installed
if ! command -v eb &> /dev/null; then
    echo -e "${RED}❌ EB CLI not found. Installing...${NC}"
    echo "Please install EB CLI manually:"
    echo "  pip install awsebcli --upgrade --user"
    exit 1
fi

# Step 4: Initialize EB if needed
if [ ! -d ".elasticbeanstalk" ]; then
    echo -e "${YELLOW}🔧 Initializing Elastic Beanstalk...${NC}"
    eb init -p "Node.js 20 running on 64bit Amazon Linux 2023" wbf-platform-backend --region eu-north-1
fi

# Step 5: Check if environment exists
ENV_EXISTS=$(eb list 2>/dev/null | grep -c "wbf-backend-prod" || echo "0")

if [ "$ENV_EXISTS" -eq "0" ]; then
    echo -e "${YELLOW}🏗️  Creating new environment...${NC}"
    echo ""
    echo -e "${RED}⚠️  IMPORTANT: You need to set environment variables after creation!${NC}"
    echo "Run this after the environment is created:"
    echo ""
    echo "eb setenv \\"
    echo '  JWT_SECRET="your_jwt_secret_here" \'
    echo '  MONGODB_URI="your_mongodb_uri" \'
    echo '  MONGODB_DB_NAME="wbf-platform" \'
    echo '  SMTP_HOST="mail.cpanel1.gohost.mk" \'
    echo '  SMTP_PORT="587" \'
    echo '  SMTP_USER="your_email@example.com" \'
    echo '  SMTP_PASS="your_password" \'
    echo '  SMTP_SECURE="false" \'
    echo '  AWS_REGION="eu-north-1" \'
    echo '  AWS_S3_BUCKET="partnership-project-mainstorage" \'
    echo '  AWS_ACCESS_KEY_ID="your_key" \'
    echo '  AWS_SECRET_ACCESS_KEY="your_secret" \'
    echo '  FRONTEND_URL="https://portal.wbfpartnership.com" \'
    echo '  CORS_ORIGIN="https://portal.wbfpartnership.com,http://localhost:5173" \'
    echo '  NODE_ENV="production" \'
    echo '  PORT="8080"'
    echo ""
    read -p "Press Enter to create environment..."

    eb create wbf-backend-prod \
        --instance-type t3.small \
        --envvars NODE_ENV=production,PORT=8080
else
    echo -e "${GREEN}✅ Environment exists, deploying...${NC}"
    eb deploy
fi

# Step 6: Show status
echo ""
echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo ""
echo "Environment status:"
eb status

echo ""
echo "To view your application:"
echo "  eb open"
echo ""
echo "To view logs:"
echo "  eb logs"
echo ""
echo "To SSH into instance:"
echo "  eb ssh"
echo ""
echo -e "${YELLOW}📝 Don't forget to configure environment variables if this is first deployment!${NC}"
