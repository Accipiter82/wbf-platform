# WBF Platform Backend - AWS Elastic Beanstalk Deployment Guide

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Initial Setup](#initial-setup)
4. [MongoDB Atlas Configuration](#mongodb-atlas-configuration)
5. [Deployment Steps](#deployment-steps)
6. [SSL/HTTPS Setup](#sslhttps-setup)
7. [DNS Configuration](#dns-configuration)
8. [Environment Variables](#environment-variables)
9. [Future Updates](#future-updates)
10. [Monitoring & Logs](#monitoring--logs)
11. [Troubleshooting](#troubleshooting)
12. [Architecture](#architecture)

---

## Overview

**Current Deployment:**
- **Platform**: AWS Elastic Beanstalk
- **Region**: eu-north-1 (Stockholm)
- **Environment**: `wbf-backend-prod`
- **Application**: `wbf-platform-backend`
- **Domain**: `api.wbfpartnership.com`
- **SSL**: AWS Certificate Manager
- **Database**: MongoDB Atlas
- **Node.js Version**: 20.x on Amazon Linux 2023

---

## Prerequisites

### 1. AWS CLI Installation

```bash
# macOS
brew install awscli

# Verify installation
aws --version
```

### 2. Elastic Beanstalk CLI Installation

```bash
# Install using pip
pip install awsebcli --upgrade --user

# Verify installation
eb --version
```

### 3. AWS Profile Configuration

```bash
# Configure AWS credentials
aws configure --profile wbf

# Enter when prompted:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region: eu-north-1
# - Default output format: json
```

### 4. Node.js & npm

```bash
# Verify installation
node --version  # v20.x or higher
npm --version   # v10.x or higher
```

---

## Initial Setup

### 1. Project Structure

```
apps/backend/
├── src/
│   ├── index.ts              # Main application entry
│   ├── db-client.ts          # MongoDB connection
│   ├── routes/               # API routes
│   ├── services/             # Business logic
│   ├── middleware/           # Auth & other middleware
│   └── utils/                # Helper utilities
├── dist/                     # Compiled JavaScript (generated)
├── .elasticbeanstalk/        # EB configuration
├── package.json
├── tsconfig.json
├── Procfile                  # EB process definition
├── .ebignore                 # Files to exclude from deployment
├── deploy-package.json       # Simplified package.json for EB
├── setup-git-and-deploy.sh   # Deployment automation script
└── set-env-vars.sh           # Environment variables setup
```

### 2. Initialize Git Repository

```bash
cd apps/backend
git init
```

### 3. Initialize Elastic Beanstalk

```bash
# Run the setup script
bash setup-git-and-deploy.sh
```

Or manually:

```bash
eb init wbf-platform-backend \
  --platform "Node.js 20 running on 64bit Amazon Linux 2023" \
  --region eu-north-1 \
  --profile wbf
```

### 4. Create Elastic Beanstalk Environment

```bash
eb create wbf-backend-prod \
  --instance-type t3.small \
  --profile wbf
```

---

## MongoDB Atlas Configuration

### 1. Create MongoDB Cluster

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a new cluster (or use existing)
3. Choose: **M0 (Free tier)** or **M10+** for production

### 2. Create Database User

1. Go to **Database Access**
2. Add new database user:
   - Username: `partnership_api`
   - Password: (generate strong password)
   - Database User Privileges: **Read and write to any database**

### 3. Configure Network Access

**⚠️ CRITICAL**: Initially, MongoDB Atlas may have incorrect IP whitelist configuration.

1. Go to **Network Access**
2. Click **Add IP Address**
3. Add:
   - `0.0.0.0/0` (Allow from anywhere) - **For initial testing**
   
**🔐 Security Best Practice**: After deployment, restrict to EC2 IP only:

```bash
# Get EC2 instance public IP
aws ec2 describe-instances \
  --filters "Name=tag:elasticbeanstalk:environment-name,Values=wbf-backend-prod" \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --profile wbf \
  --region eu-north-1 \
  --output text

# Add this specific IP to MongoDB Atlas Network Access
# Format: <IP>/32 (e.g., 13.60.134.123/32)
```

### 4. Get Connection String

1. Go to **Database** → **Connect**
2. Choose **Connect your application**
3. Driver: **Node.js** (version 4.0 or later)
4. Copy connection string:

```
mongodb+srv://partnership_api:<password>@cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

---

## Deployment Steps

### 1. Configure Environment Variables

Edit `set-env-vars.sh` with your values:

```bash
#!/bin/bash

eb setenv \
  NODE_ENV=production \
  PORT=8080 \
  MONGODB_URI="mongodb+srv://partnership_api:YOUR_PASSWORD@cluster.xxxxx.mongodb.net/" \
  MONGODB_DB_NAME="wbf-platform" \
  JWT_SECRET="your-super-secret-jwt-key-change-in-production" \
  JWT_EXPIRES_IN="7d" \
  SMTP_HOST="smtp.gmail.com" \
  SMTP_PORT=587 \
  SMTP_SECURE=false \
  SMTP_USER="your-email@gmail.com" \
  SMTP_PASS="your-app-password" \
  FRONTEND_URL="https://portal.wbfpartnership.com" \
  --profile wbf
```

Run the script:

```bash
bash set-env-vars.sh
```

### 2. Build the Application

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` directory.

### 3. Deploy to Elastic Beanstalk

```bash
eb deploy --profile wbf
```

The deployment process:
1. Creates application version archive
2. Uploads to S3
3. Deploys to EC2 instances
4. Runs health checks
5. Completes deployment (~2-3 minutes)

### 4. Verify Deployment

```bash
# Check environment status
eb status --profile wbf

# Check health
eb health --profile wbf

# Open in browser
eb open --profile wbf

# Test API
curl https://YOUR-ENV-NAME.elasticbeanstalk.com/health
```

---

## SSL/HTTPS Setup

### 1. Request SSL Certificate

**Option A: Using AWS Console (Recommended)**

1. Go to **AWS Certificate Manager** (eu-north-1 region):
   https://console.aws.amazon.com/acm/home?region=eu-north-1

2. Click **"Request certificate"**

3. Enter domain: `api.wbfpartnership.com`

4. Choose **DNS validation**

5. Click **"Create records in Route 53"** (if using Route 53)

6. Wait for validation (~5-30 minutes)

**Option B: Using AWS CLI**

```bash
# Request certificate
aws acm request-certificate \
  --domain-name api.wbfpartnership.com \
  --validation-method DNS \
  --region eu-north-1 \
  --profile wbf

# Get certificate ARN from output
# Then describe to get validation records
aws acm describe-certificate \
  --certificate-arn <ARN> \
  --region eu-north-1 \
  --profile wbf
```

### 2. Configure Load Balancer with SSL

1. Go to **EC2 Console** → **Load Balancers**:
   https://console.aws.amazon.com/ec2/home?region=eu-north-1#LoadBalancers

2. Select your EB load balancer (e.g., `awseb-e-...`)

3. Go to **Listeners** tab

4. Click **"Add listener"**:
   - **Protocol**: HTTPS
   - **Port**: 443
   - **SSL certificate**: Select your validated certificate
   - **Default action**: Forward to target group

5. Click **"Save"**

### 3. Update Security Group

Ensure the load balancer security group allows:
- **Inbound**: Port 443 (HTTPS) from `0.0.0.0/0`
- **Outbound**: All traffic

---

## DNS Configuration

### Using Route 53

1. Go to **Route 53 Console**:
   https://console.aws.amazon.com/route53/v2/home

2. Select hosted zone: `wbfpartnership.com`

3. Create **A Record** (Alias):
   - **Record name**: `api`
   - **Record type**: `A` - IPv4 address
   - **Alias**: ✅ Yes
   - **Route traffic to**: 
     * Alias to Application and Classic Load Balancer
     * Region: eu-north-1
     * Load balancer: Select your EB load balancer
   - **Routing policy**: Simple routing

4. Click **"Create records"**

### Using AWS CLI

```bash
# Get hosted zone ID
ZONE_ID=$(aws route53 list-hosted-zones-by-name \
  --dns-name wbfpartnership.com \
  --profile wbf \
  --query 'HostedZones[0].Id' \
  --output text | cut -d'/' -f3)

# Get load balancer DNS name
LB_DNS=$(aws elasticbeanstalk describe-environment-resources \
  --environment-name wbf-backend-prod \
  --profile wbf \
  --region eu-north-1 \
  --query 'EnvironmentResources.LoadBalancers[0].Name' \
  --output text)

# Create A record
cat > /tmp/route53-change.json <<EOF
{
  "Changes": [{
    "Action": "CREATE",
    "ResourceRecordSet": {
      "Name": "api.wbfpartnership.com",
      "Type": "A",
      "AliasTarget": {
        "HostedZoneId": "Z23TAZ6LKFMNIO",
        "DNSName": "${LB_DNS}",
        "EvaluateTargetHealth": true
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

Note: `Z23TAZ6LKFMNIO` is the hosted zone ID for ELB in eu-north-1.

---

## Environment Variables

### Current Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Application port | `8080` (EB default) |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://...` |
| `MONGODB_DB_NAME` | Database name | `wbf-platform` |
| `JWT_SECRET` | Secret for JWT signing | `random-secure-string` |
| `JWT_EXPIRES_IN` | JWT expiration time | `7d` |
| `SMTP_HOST` | Email server host | `smtp.gmail.com` |
| `SMTP_PORT` | Email server port | `587` |
| `SMTP_SECURE` | Use TLS/SSL | `false` |
| `SMTP_USER` | Email account | `email@gmail.com` |
| `SMTP_PASS` | Email password/app password | `your-app-password` |
| `FRONTEND_URL` | Frontend URL for CORS | `https://portal.wbfpartnership.com` |

### View Environment Variables

```bash
eb printenv --profile wbf
```

### Update Environment Variables

```bash
# Update single variable
eb setenv VARIABLE_NAME="value" --profile wbf

# Update multiple variables
eb setenv \
  VAR1="value1" \
  VAR2="value2" \
  --profile wbf
```

---

## Future Updates

### Quick Update Script

```bash
#!/bin/bash
# quick-deploy.sh

cd apps/backend

echo "📦 Building..."
npm run build

echo "🚀 Deploying to EB..."
eb deploy --profile wbf

echo "✅ Deployment complete!"
echo "🌐 API: https://api.wbfpartnership.com"
```

### Manual Update Process

```bash
# 1. Make code changes
# 2. Build
npm run build

# 3. (Optional) Commit changes
git add .
git commit -m "Your commit message"

# 4. Deploy
eb deploy --profile wbf

# 5. Verify
curl https://api.wbfpartnership.com/health
```

### Rolling Updates

EB performs **rolling updates** by default:
- Updates instances one at a time
- Zero downtime deployments
- Automatic rollback on failure

Configure in `.elasticbeanstalk/config.yml`:

```yaml
deploy:
  artifact: deploy-package.zip
global:
  application_name: wbf-platform-backend
  default_region: eu-north-1
  profile: wbf
```

---

## Monitoring & Logs

### View Logs

```bash
# View all logs
eb logs --profile wbf

# Follow logs in real-time
eb logs --stream --profile wbf

# Save logs to file
eb logs --all --profile wbf
```

### Log Locations on EC2

- **Application logs**: `/var/log/web.stdout.log`
- **Nginx access**: `/var/log/nginx/access.log`
- **Nginx error**: `/var/log/nginx/error.log`
- **EB engine**: `/var/log/eb-engine.log`

### Monitoring via AWS Console

1. Go to **Elastic Beanstalk Console**:
   https://console.aws.amazon.com/elasticbeanstalk/home?region=eu-north-1

2. Select environment: `wbf-backend-prod`

3. View:
   - **Health**: Overall environment health
   - **Monitoring**: CPU, Network, HTTP status codes
   - **Logs**: Recent log files
   - **Events**: Deployment and configuration events

### CloudWatch Metrics

```bash
# CPU utilization
aws cloudwatch get-metric-statistics \
  --namespace AWS/ElasticBeanstalk \
  --metric-name CPUUtilization \
  --dimensions Name=EnvironmentName,Value=wbf-backend-prod \
  --start-time 2026-01-15T00:00:00Z \
  --end-time 2026-01-15T23:59:59Z \
  --period 3600 \
  --statistics Average \
  --region eu-north-1 \
  --profile wbf
```

---

## Troubleshooting

### Issue: MongoDB Connection Timeout

**Symptom**: API returns 500 errors, logs show "Connection timeout"

**Solutions**:

1. **Check MongoDB Atlas Network Access**:
   - Ensure EC2 IP or `0.0.0.0/0` is whitelisted
   - Incorrect: `0.0.0.0/32` (single IP only)
   - Correct: `0.0.0.0/0` (all IPs) or `<EC2-IP>/32`

2. **Verify connection string**:
   ```bash
   eb printenv --profile wbf | grep MONGODB_URI
   ```

3. **Test from EC2 instance**:
   ```bash
   eb ssh --profile wbf
   curl -I https://cloud.mongodb.com
   ```

### Issue: SSL/TLS Handshake Errors

**Symptom**: "ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR"

**Solution**: This was a network access issue, not SSL. Ensure MongoDB Atlas allows connections.

### Issue: Health Check Failures (404)

**Symptom**: Load balancer health checks failing

**Solution**: 
- Ensure root endpoint `/` returns 200 OK
- Configure health check path in EB:
  ```bash
  eb config --profile wbf
  # Update HealthCheckPath to /health
  ```

### Issue: CORS Errors from Frontend

**Symptom**: Browser console shows CORS policy errors

**Solution**:
1. Add frontend domain to `allowedOrigins` in `src/index.ts`
2. Rebuild and deploy:
   ```bash
   npm run build
   eb deploy --profile wbf
   ```

### Issue: Environment Won't Start

**Symptom**: Environment stuck in "Updating" state

**Solutions**:

1. **Check logs**:
   ```bash
   eb logs --profile wbf
   ```

2. **Abort deployment**:
   ```bash
   eb abort --profile wbf
   ```

3. **Rebuild environment**:
   ```bash
   eb rebuild --profile wbf
   ```

### Issue: Out of Memory

**Symptom**: 502 Bad Gateway, high memory usage

**Solution**: Upgrade instance type:

```bash
eb scale <number-of-instances> --profile wbf

# Or change instance type
eb config --profile wbf
# Update InstanceType from t3.small to t3.medium
```

---

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         User/Client                          │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   Route 53 (DNS)                             │
│              api.wbfpartnership.com                          │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│          Application Load Balancer (ALB)                     │
│         - HTTPS:443 (SSL/TLS Termination)                    │
│         - HTTP:80 → Redirect to HTTPS                        │
│         - Health Checks: /health                             │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  Nginx (Reverse Proxy)                       │
│                  - Port 80 (internal)                        │
│                  - Forwards to Node.js                       │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              Node.js Application (Express)                   │
│                    - Port 8080                               │
│              - API Routes                                    │
│              - Authentication                                │
│              - Business Logic                                │
└─────────┬────────────────────────────────┬──────────────────┘
          │                                │
          ▼                                ▼
┌──────────────────────┐      ┌──────────────────────────────┐
│   MongoDB Atlas      │      │    Firebase (Storage)        │
│   - Database         │      │    - File uploads            │
│   - eu-north-1       │      │    - Images                  │
└──────────────────────┘      └──────────────────────────────┘
```

### Component Breakdown

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **DNS** | Route 53 | Domain name resolution |
| **Load Balancer** | ALB | SSL termination, traffic distribution |
| **Reverse Proxy** | Nginx | Request forwarding, caching |
| **Application** | Node.js 20 + Express | API server |
| **Database** | MongoDB Atlas | Data storage |
| **Storage** | Firebase Storage | File uploads |
| **Email** | Gmail SMTP | Notifications |
| **Platform** | Elastic Beanstalk | Infrastructure management |

### Data Flow

1. **Request**: User → Route 53 → ALB (HTTPS)
2. **Proxy**: ALB → Nginx (HTTP) → Node.js (Port 8080)
3. **Processing**: Express routes → Business logic → MongoDB
4. **Response**: Data → Express → Nginx → ALB → User

---

## Security Best Practices

### ✅ Implemented

- [x] HTTPS enforced via ALB
- [x] SSL certificate from AWS Certificate Manager
- [x] Environment variables for secrets (not in code)
- [x] MongoDB connection over TLS
- [x] CORS whitelist for origins
- [x] Rate limiting (100 requests per 15 min)
- [x] Helmet.js security headers
- [x] Private S3 bucket (admin panel)
- [x] CloudFront Origin Access Control

### 🔒 Recommended Improvements

- [ ] Restrict MongoDB Atlas to EC2 IP only
- [ ] Enable AWS WAF for DDoS protection
- [ ] Set up CloudWatch alarms
- [ ] Enable VPC for EB environment
- [ ] Use AWS Secrets Manager for sensitive data
- [ ] Implement API key authentication
- [ ] Enable CloudTrail for audit logs

---

## Cost Optimization

### Current Estimated Costs (Monthly)

| Service | Configuration | Estimated Cost |
|---------|--------------|----------------|
| **EC2 (EB)** | 1x t3.small (24/7) | ~$15 |
| **Load Balancer** | Application LB | ~$16 |
| **Route 53** | 1 hosted zone | $0.50 |
| **Data Transfer** | 10 GB out | ~$1 |
| **MongoDB Atlas** | M0 (Free tier) | $0 |
| **SSL Certificate** | ACM | $0 |
| **CloudWatch** | Basic monitoring | $0 |

**Total**: ~$32-35/month

### Cost Reduction Strategies

1. **Use Reserved Instances**: Save up to 30% on EC2
2. **Auto-scaling**: Scale down during low traffic
3. **CloudFront**: Cache static responses
4. **S3 Lifecycle**: Archive old logs

---

## Additional Scripts

### Health Check Script

```bash
#!/bin/bash
# health-check.sh

API_URL="https://api.wbfpartnership.com"

echo "🏥 Checking API health..."

# Health endpoint
HEALTH=$(curl -s "${API_URL}/health" | jq -r '.success')

if [ "$HEALTH" == "true" ]; then
  echo "✅ API is healthy"
else
  echo "❌ API health check failed"
  exit 1
fi

# MongoDB connection test (via login attempt)
LOGIN=$(curl -s -X POST "${API_URL}/api/auth/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}' | jq -r '.error')

if [[ "$LOGIN" == *"password"* ]] || [[ "$LOGIN" == *"Login failed"* ]]; then
  echo "✅ MongoDB connection working"
else
  echo "⚠️  Unexpected response: $LOGIN"
fi

echo "🎉 All checks passed!"
```

### Backup Script

```bash
#!/bin/bash
# backup-env.sh

# Backup environment variables
eb printenv --profile wbf > env-backup-$(date +%Y%m%d).txt

# Backup configuration
eb config save --profile wbf

echo "✅ Environment backup created"
```

---

## Support & Resources

### AWS Documentation

- [Elastic Beanstalk Node.js](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/create-deploy-nodejs.html)
- [MongoDB Atlas AWS](https://www.mongodb.com/docs/atlas/reference/amazon-aws/)
- [Route 53 Documentation](https://docs.aws.amazon.com/route53/)

### Deployment Checklist

- [ ] MongoDB Atlas network access configured
- [ ] Environment variables set
- [ ] SSL certificate validated
- [ ] DNS record created
- [ ] Health checks passing
- [ ] CORS origins configured
- [ ] API accessible via HTTPS
- [ ] Frontend can connect to API

---

## Quick Reference

### Essential Commands

```bash
# Deploy
eb deploy --profile wbf

# View logs
eb logs --profile wbf

# Check status
eb status --profile wbf

# SSH into instance
eb ssh --profile wbf

# Set environment variable
eb setenv VAR="value" --profile wbf

# Scale instances
eb scale 2 --profile wbf

# Rebuild environment
eb rebuild --profile wbf
```

### API Endpoints

- **Health**: `GET /health`
- **Root**: `GET /`
- **Auth**: `POST /api/auth/*`
- **Organizations**: `GET/POST /api/organisation/*`
- **Admin**: `POST /api/admin/*`
- **Super Admin**: `GET/POST /api/super-admin/*`

---

**Last Updated**: January 15, 2026  
**Maintained by**: WBF Platform Team
