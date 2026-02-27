# WBF Platform Admin Panel - AWS Deployment Guide

## ✅ Completed Steps

1. ✅ **Built admin panel** with production API URL (`https://api.wbfpartnership.com/api`)
2. ✅ **Created S3 bucket**: `portal.wbfpartnership.com`
3. ✅ **Uploaded files** to S3
4. ✅ **Created CloudFront distribution**: `E3FTQ6RK954ZYB`
5. ✅ **Configured Origin Access Control** (OAC)
6. ✅ **Updated S3 bucket policy** for CloudFront access

## 📋 Current Status

- **CloudFront Domain**: `d3nedf778h39b3.cloudfront.net`
- **Distribution ID**: `E3FTQ6RK954ZYB`
- **S3 Bucket**: `portal.wbfpartnership.com`
- **Deployment Status**: Deploying (15-20 minutes)

## 🔄 Next Steps

### Step 1: Wait for CloudFront Deployment

The distribution is currently deploying. You can check status:

```bash
aws cloudfront wait distribution-deployed --id E3FTQ6RK954ZYB --profile wbf
```

Or check status manually:
```bash
aws cloudfront get-distribution --id E3FTQ6RK954ZYB --profile wbf --query 'Distribution.Status'
```

### Step 2: Test CloudFront URL

Once deployed, test the site:
```bash
curl -I https://d3nedf778h39b3.cloudfront.net
```

Or open in browser: https://d3nedf778h39b3.cloudfront.net

### Step 3: Request SSL Certificate

**IMPORTANT**: SSL certificates for CloudFront must be in **us-east-1** region!

#### Option A: Using AWS CLI

```bash
# Request certificate
aws acm request-certificate \
    --domain-name portal.wbfpartnership.com \
    --validation-method DNS \
    --region us-east-1 \
    --profile wbf

# Get validation records
aws acm describe-certificate \
    --certificate-arn <CERTIFICATE_ARN> \
    --region us-east-1 \
    --profile wbf \
    --query 'Certificate.DomainValidationOptions[0].ResourceRecord'
```

#### Option B: Using AWS Console (Recommended)

1. Go to **AWS Certificate Manager** (us-east-1 region):
   https://console.aws.amazon.com/acm/home?region=us-east-1

2. Click **"Request certificate"**

3. Select **"Request a public certificate"**

4. Enter domain name: `portal.wbfpartnership.com`

5. Select validation method: **DNS validation**

6. Click **"Request"**

7. In the certificate details, click **"Create records in Route 53"** (if using Route 53)
   - AWS will automatically add the CNAME validation record
   
8. Wait for validation (usually 5-30 minutes)

### Step 4: Update CloudFront with SSL Certificate

Once the certificate is validated:

#### Using AWS Console (Recommended)

1. Go to **CloudFront Console**:
   https://console.aws.amazon.com/cloudfront/v3/home

2. Click on distribution ID: `E3FTQ6RK954ZYB`

3. Click **"Edit"** in the "Settings" tab

4. Update:
   - **Alternate domain names (CNAMEs)**: Add `portal.wbfpartnership.com`
   - **Custom SSL certificate**: Select your validated certificate
   
5. Click **"Save changes"**

#### Using AWS CLI

```bash
# Get current config
aws cloudfront get-distribution-config \
    --id E3FTQ6RK954ZYB \
    --profile wbf \
    > /tmp/dist-config.json

# Update the config manually to add:
# - Aliases: ["portal.wbfpartnership.com"]
# - ViewerCertificate.ACMCertificateArn: <your-cert-arn>
# - ViewerCertificate.SSLSupportMethod: "sni-only"

# Apply updated config
aws cloudfront update-distribution \
    --id E3FTQ6RK954ZYB \
    --if-match <ETAG-from-get-config> \
    --distribution-config file:///tmp/updated-config.json \
    --profile wbf
```

### Step 5: Configure DNS (Route 53)

#### Option A: Using AWS Console (Recommended)

1. Go to **Route 53 Console**:
   https://console.aws.amazon.com/route53/v2/home

2. Click on your hosted zone: `wbfpartnership.com`

3. Click **"Create record"**

4. Configure:
   - **Record name**: `portal`
   - **Record type**: `A` (IPv4 address)
   - **Alias**: ✅ Yes
   - **Route traffic to**: 
     * Choose: `Alias to CloudFront distribution`
     * Select: `d3nedf778h39b3.cloudfront.net`
   - **Routing policy**: Simple routing

5. Click **"Create records"**

#### Option B: Using AWS CLI

```bash
# Get hosted zone ID
ZONE_ID=$(aws route53 list-hosted-zones-by-name \
    --dns-name wbfpartnership.com \
    --profile wbf \
    --query 'HostedZones[0].Id' \
    --output text | cut -d'/' -f3)

# Create A record (alias to CloudFront)
cat > /tmp/route53-change.json <<EOF
{
    "Changes": [{
        "Action": "CREATE",
        "ResourceRecordSet": {
            "Name": "portal.wbfpartnership.com",
            "Type": "A",
            "AliasTarget": {
                "HostedZoneId": "Z2FDTNDATAQYW2",
                "DNSName": "d3nedf778h39b3.cloudfront.net",
                "EvaluateTargetHealth": false
            }
        }
    }]
}
EOF

aws route53 change-resource-record-sets \
    --hosted-zone-id ${ZONE_ID} \
    --change-batch file:///tmp/route53-change.json \
    --profile wbf
```

Note: `Z2FDTNDATAQYW2` is the CloudFront hosted zone ID (always the same for all CloudFront distributions)

### Step 6: Verify Deployment

1. Wait for DNS propagation (1-5 minutes)

2. Test the domain:
```bash
curl -I https://portal.wbfpartnership.com
```

3. Open in browser:
https://portal.wbfpartnership.com

4. Verify API connection by trying to log in

## 🔄 Future Deployments

To update the admin panel:

```bash
cd "/Users/oetoni/Desktop/wbf/new downs/wbf - platform/apps/admin-panel"

# Build with production API
npm run build

# Upload to S3
aws s3 sync dist/ s3://portal.wbfpartnership.com --profile wbf --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
    --distribution-id E3FTQ6RK954ZYB \
    --paths "/*" \
    --profile wbf
```

Or use the automated script:
```bash
bash deploy-to-s3.sh
```

## 📊 Monitoring

### Check CloudFront Status
```bash
aws cloudfront get-distribution \
    --id E3FTQ6RK954ZYB \
    --profile wbf \
    --query 'Distribution.Status'
```

### View CloudFront Logs
```bash
aws cloudfront list-distributions \
    --profile wbf \
    --query 'DistributionList.Items[?Id==`E3FTQ6RK954ZYB`]'
```

## 🔐 Security Notes

- ✅ S3 bucket is **private** (not publicly accessible)
- ✅ Access controlled via CloudFront **Origin Access Control**
- ✅ HTTPS enforced via CloudFront
- ✅ SSL/TLS certificate from AWS Certificate Manager

## 💰 Cost Estimate

- **S3 Storage**: ~$0.023/GB/month (admin panel is ~5.6 MB = ~$0.001/month)
- **CloudFront**: 
  - First 1 TB/month: $0.085/GB = ~$85/month for 1TB
  - Requests: $0.0075 per 10,000 requests
- **Route 53**: $0.50/month per hosted zone + $0.40 per million queries

**Estimated monthly cost**: $1-5 for low traffic

## 🚨 Troubleshooting

### Issue: CloudFront returns 403

**Solution**: Check S3 bucket policy allows CloudFront OAC

### Issue: SSL certificate not showing

**Solution**: Make sure certificate is in **us-east-1** region

### Issue: DNS not resolving

**Solution**: Check Route 53 record points to correct CloudFront domain

### Issue: Admin panel can't connect to API

**Solution**: Check `.env.production` has correct `VITE_API_BASE_URL`

## 📞 Support

For AWS-specific issues, refer to:
- [CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
- [S3 Static Website Hosting](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html)
- [Route 53 Documentation](https://docs.aws.amazon.com/route53/)
