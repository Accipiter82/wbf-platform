#!/bin/bash

# Quick update script for admin panel

set -e

BUCKET_NAME="portal.wbfpartnership.com"
DISTRIBUTION_ID="E3FTQ6RK954ZYB"
AWS_PROFILE="wbf"

echo "🔄 Updating WBF Platform Admin Panel..."

echo "📦 Building..."
npm run build

echo "📤 Uploading to S3..."
aws s3 sync dist/ "s3://${BUCKET_NAME}" --profile ${AWS_PROFILE} --delete

echo "🔄 Invalidating CloudFront cache..."
INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id ${DISTRIBUTION_ID} \
    --paths "/*" \
    --profile ${AWS_PROFILE} \
    --query 'Invalidation.Id' \
    --output text)

echo "✅ Deployment complete!"
echo "📋 Invalidation ID: ${INVALIDATION_ID}"
echo ""
echo "Wait for cache invalidation (1-2 minutes):"
echo "aws cloudfront wait invalidation-completed --distribution-id ${DISTRIBUTION_ID} --id ${INVALIDATION_ID} --profile ${AWS_PROFILE}"
echo ""
echo "🌐 Your site: https://portal.wbfpartnership.com"
