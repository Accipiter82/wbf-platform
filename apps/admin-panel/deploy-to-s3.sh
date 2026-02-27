#!/bin/bash

# WBF Platform - Admin Panel S3 Deployment Script
# This script deploys the admin panel to S3 and sets up CloudFront

set -e

BUCKET_NAME="portal.wbfpartnership.com"
REGION="eu-north-1"
AWS_PROFILE="wbf"

echo "================================================"
echo "WBF Platform - Admin Panel S3 Deployment"
echo "================================================"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    echo "Visit: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Check if profile exists
if ! aws configure list-profiles | grep -q "^${AWS_PROFILE}$"; then
    echo "❌ AWS profile '${AWS_PROFILE}' not found."
    echo "Please run: aws configure --profile ${AWS_PROFILE}"
    exit 1
fi

echo ""
echo "📦 Building admin panel for production..."
npm run build

if [ ! -d "dist" ]; then
    echo "❌ Build failed - dist directory not found"
    exit 1
fi

echo ""
echo "☁️  Checking if S3 bucket exists..."

if aws s3 ls "s3://${BUCKET_NAME}" --profile ${AWS_PROFILE} 2>&1 | grep -q 'NoSuchBucket'; then
    echo "📦 Creating S3 bucket: ${BUCKET_NAME}"
    aws s3 mb "s3://${BUCKET_NAME}" --region ${REGION} --profile ${AWS_PROFILE}
    
    echo "🌐 Configuring bucket for static website hosting..."
    aws s3 website "s3://${BUCKET_NAME}" \
        --index-document index.html \
        --error-document index.html \
        --profile ${AWS_PROFILE}
    
    echo "✅ S3 bucket configured for CloudFront (private bucket)"
    echo "ℹ️  Note: Bucket is private - will be accessed via CloudFront only"
else
    echo "✅ S3 bucket already exists"
fi

echo ""
echo "📤 Uploading files to S3..."

aws s3 sync dist/ "s3://${BUCKET_NAME}" \
    --profile ${AWS_PROFILE} \
    --delete \
    --cache-control "public, max-age=31536000" \
    --exclude "index.html"

# Upload index.html separately with no-cache
aws s3 cp dist/index.html "s3://${BUCKET_NAME}/index.html" \
    --profile ${AWS_PROFILE} \
    --cache-control "no-cache, no-store, must-revalidate" \
    --content-type "text/html"

echo ""
echo "================================================"
echo "✅ Deployment Complete!"
echo "================================================"
echo ""
echo "📍 S3 Website URL:"
echo "   http://${BUCKET_NAME}.s3-website-${REGION}.amazonaws.com"
echo ""
echo "⚡ Next Steps:"
echo "   1. Create CloudFront distribution (for HTTPS)"
echo "   2. Point portal.wbfpartnership.com to CloudFront"
echo "   3. Request/attach SSL certificate"
echo ""
echo "Run: ./setup-cloudfront.sh to automate CloudFront setup"
echo "================================================"
