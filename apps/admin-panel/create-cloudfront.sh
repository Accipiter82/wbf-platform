#!/bin/bash

# WBF Platform - Automated CloudFront Distribution Creation
# This script creates a CloudFront distribution for the admin panel

set -e

BUCKET_NAME="portal.wbfpartnership.com"
DOMAIN_NAME="portal.wbfpartnership.com"
AWS_PROFILE="wbf"

echo "================================================"
echo "WBF Platform - CloudFront Distribution Setup"
echo "================================================"

# Create CloudFront Origin Access Control
echo ""
echo "📋 Creating Origin Access Control (OAC)..."

OAC_ID=$(aws cloudfront create-origin-access-control \
    --origin-access-control-config \
        Name="${BUCKET_NAME}-oac",SigningProtocol=sigv4,SigningBehavior=always,OriginAccessControlOriginType=s3 \
    --profile ${AWS_PROFILE} \
    --query 'OriginAccessControl.Id' \
    --output text 2>/dev/null || echo "")

if [ -z "$OAC_ID" ]; then
    echo "⚠️  OAC might already exist, checking..."
    OAC_ID=$(aws cloudfront list-origin-access-controls \
        --profile ${AWS_PROFILE} \
        --query "OriginAccessControlList.Items[?Name=='${BUCKET_NAME}-oac'].Id | [0]" \
        --output text)
fi

echo "✅ OAC ID: $OAC_ID"

# Create distribution config
echo ""
echo "📦 Creating CloudFront distribution..."

cat > /tmp/cloudfront-config.json <<EOF
{
    "CallerReference": "admin-panel-$(date +%s)",
    "Comment": "WBF Platform Admin Panel",
    "DefaultRootObject": "index.html",
    "Origins": {
        "Quantity": 1,
        "Items": [
            {
                "Id": "S3-${BUCKET_NAME}",
                "DomainName": "${BUCKET_NAME}.s3.eu-north-1.amazonaws.com",
                "S3OriginConfig": {
                    "OriginAccessIdentity": ""
                },
                "OriginAccessControlId": "${OAC_ID}"
            }
        ]
    },
    "DefaultCacheBehavior": {
        "TargetOriginId": "S3-${BUCKET_NAME}",
        "ViewerProtocolPolicy": "redirect-to-https",
        "AllowedMethods": {
            "Quantity": 2,
            "Items": ["GET", "HEAD"],
            "CachedMethods": {
                "Quantity": 2,
                "Items": ["GET", "HEAD"]
            }
        },
        "Compress": true,
        "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6",
        "OriginRequestPolicyId": "88a5eaf4-2fd4-4709-b370-b4c650ea3fcf"
    },
    "CustomErrorResponses": {
        "Quantity": 2,
        "Items": [
            {
                "ErrorCode": 403,
                "ResponsePagePath": "/index.html",
                "ResponseCode": "200",
                "ErrorCachingMinTTL": 300
            },
            {
                "ErrorCode": 404,
                "ResponsePagePath": "/index.html",
                "ResponseCode": "200",
                "ErrorCachingMinTTL": 300
            }
        ]
    },
    "Enabled": true,
    "HttpVersion": "http2and3",
    "IsIPV6Enabled": true
}
EOF

# Create distribution
DISTRIBUTION_ID=$(aws cloudfront create-distribution \
    --distribution-config file:///tmp/cloudfront-config.json \
    --profile ${AWS_PROFILE} \
    --query 'Distribution.Id' \
    --output text 2>/dev/null || echo "")

if [ -z "$DISTRIBUTION_ID" ]; then
    echo "❌ Failed to create distribution"
    echo "ℹ️  Creating distribution manually through AWS Console is recommended"
    rm /tmp/cloudfront-config.json
    bash setup-cloudfront.sh
    exit 1
fi

CLOUDFRONT_DOMAIN=$(aws cloudfront get-distribution \
    --id ${DISTRIBUTION_ID} \
    --profile ${AWS_PROFILE} \
    --query 'Distribution.DomainName' \
    --output text)

rm /tmp/cloudfront-config.json

echo "✅ CloudFront distribution created!"
echo ""
echo "📋 Distribution ID: ${DISTRIBUTION_ID}"
echo "🌐 CloudFront Domain: ${CLOUDFRONT_DOMAIN}"

# Update S3 bucket policy to allow CloudFront
echo ""
echo "🔐 Updating S3 bucket policy for CloudFront access..."

cat > /tmp/s3-policy.json <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowCloudFrontServicePrincipal",
            "Effect": "Allow",
            "Principal": {
                "Service": "cloudfront.amazonaws.com"
            },
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::${BUCKET_NAME}/*",
            "Condition": {
                "StringEquals": {
                    "AWS:SourceArn": "arn:aws:cloudfront::629246126847:distribution/${DISTRIBUTION_ID}"
                }
            }
        }
    ]
}
EOF

aws s3api put-bucket-policy \
    --bucket ${BUCKET_NAME} \
    --policy file:///tmp/s3-policy.json \
    --profile ${AWS_PROFILE}

rm /tmp/s3-policy.json

echo "✅ S3 bucket policy updated"

echo ""
echo "================================================"
echo "✅ CloudFront Setup Complete!"
echo "================================================"
echo ""
echo "📍 Next Steps:"
echo ""
echo "1. Wait for distribution to deploy (15-20 minutes)"
echo "   aws cloudfront wait distribution-deployed --id ${DISTRIBUTION_ID} --profile ${AWS_PROFILE}"
echo ""
echo "2. Test the CloudFront URL:"
echo "   https://${CLOUDFRONT_DOMAIN}"
echo ""
echo "3. Request SSL certificate for ${DOMAIN_NAME} in us-east-1:"
echo "   - Go to AWS Certificate Manager (us-east-1 region)"
echo "   - Request certificate for: ${DOMAIN_NAME}"
echo "   - Validate via DNS (add CNAME to Route 53)"
echo ""
echo "4. Update CloudFront distribution with certificate:"
echo "   - Add Alternate Domain Name (CNAME): ${DOMAIN_NAME}"
echo "   - Select your SSL certificate"
echo ""
echo "5. Update DNS (Route 53):"
echo "   - Create A record (Alias): ${DOMAIN_NAME} -> CloudFront distribution"
echo ""
echo "================================================"
