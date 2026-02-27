#!/bin/bash

# Script to set AWS EB environment variables from .env file
# Usage: ./set-env-vars.sh
# IMPORTANT: Uses 'wbf' AWS profile

set -e

echo "🔧 Setting AWS Elastic Beanstalk environment variables from .env file..."
echo "📋 Using AWS profile: wbf"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found!"
    exit 1
fi

# Check if eb CLI is available
if ! command -v eb &> /dev/null; then
    echo "❌ Error: EB CLI not found. Install it with: pip install awsebcli"
    exit 1
fi

# Extract values from .env (simple approach)
export $(grep -v '^#' .env | xargs)

# Set all environment variables
echo "Setting environment variables..."

eb setenv \
  --profile wbf \
  JWT_SECRET="$JWT_SECRET" \
  MONGODB_URI="$MONGODB_URI" \
  MONGODB_DB_NAME="$MONGODB_DB_NAME" \
  SMTP_HOST="$SMTP_HOST" \
  SMTP_PORT="$SMTP_PORT" \
  SMTP_USER="$SMTP_USER" \
  SMTP_PASS="$SMTP_PASS" \
  SMTP_SECURE="$SMTP_SECURE" \
  AWS_REGION="$AWS_REGION" \
  AWS_S3_BUCKET="$AWS_S3_BUCKET" \
  AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID" \
  AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY" \
  FRONTEND_URL="$FRONTEND_URL" \
  CORS_ORIGIN="${CORS_ORIGIN:-https://portal.wbfpartnership.com,http://localhost:5173}" \
  NODE_ENV="production" \
  PORT="8080"

echo "✅ Environment variables set successfully!"
echo ""
echo "Verify with: eb printenv --profile wbf"
