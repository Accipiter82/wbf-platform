# AWS Elastic Beanstalk Deployment Guide

## Prerequisites
- AWS CLI installed and configured
- EB CLI installed (`pip install awsebcli`)
- Backend built (`npm run build --workspace=apps/backend`)

## Quick Deploy Steps

### 1. Install AWS EB CLI (if not installed)
```bash
pip install awsebcli --upgrade --user
```

### 2. Navigate to backend directory
```bash
cd apps/backend
```

### 3. Build the backend
```bash
npm run build
```

### 4. Initialize Elastic Beanstalk (First time only)
```bash
eb init -p node.js-20 wbf-platform-backend --region eu-north-1
```

### 5. Create environment and deploy
```bash
eb create wbf-backend-prod --instance-type t3.small --envvars \
NODE_ENV=production,\
PORT=8080
```

### 6. Set environment variables (CRITICAL - Do this immediately after creation)
```bash
eb setenv \
JWT_SECRET="your_jwt_secret_here_make_it_long_and_secure" \
MONGODB_URI="your_mongodb_atlas_uri" \
MONGODB_DB_NAME="wbf-platform" \
SMTP_HOST="mail.cpanel1.gohost.mk" \
SMTP_PORT="587" \
SMTP_USER="your_email@example.com" \
SMTP_PASS="your_smtp_password" \
SMTP_SECURE="false" \
AWS_REGION="eu-north-1" \
AWS_S3_BUCKET="partnership-project-mainstorage" \
AWS_ACCESS_KEY_ID="your_aws_access_key" \
AWS_SECRET_ACCESS_KEY="your_aws_secret_key" \
FRONTEND_URL="https://portal.wbfpartnership.com" \
CORS_ORIGIN="https://portal.wbfpartnership.com,http://localhost:5173"
```

### 7. Deploy updates (after initial setup)
```bash
npm run build
eb deploy
```

### 8. Check status and URL
```bash
eb status
eb open
```

## Testing Your Deployment

### Test health endpoint
```bash
curl https://your-eb-url.elasticbeanstalk.com/health
```

### Test API endpoint
```bash
curl https://your-eb-url.elasticbeanstalk.com/api/organisation/browse
```

## Environment Management

### View current environment variables
```bash
eb printenv
```

### SSH into instance (for debugging)
```bash
eb ssh
```

### View logs
```bash
eb logs
```

### Monitor application
```bash
eb console
```

## Scaling (if needed)

### Enable auto-scaling
```bash
eb scale 2  # Scale to 2 instances
```

## Troubleshooting

### If deployment fails:
```bash
eb logs --all
```

### If environment variables aren't working:
```bash
eb printenv  # Verify they're set
eb setenv KEY=VALUE  # Re-set if needed
```

### If MongoDB connection fails:
- Check MongoDB Atlas IP whitelist (allow EB instance IPs or use 0.0.0.0/0)
- Verify MONGODB_URI includes username, password, and proper connection string

### If CORS errors occur:
- Update CORS_ORIGIN environment variable
- Restart application: `eb deploy`

## Cost Optimization

- Development: t3.micro or t3.small
- Production: t3.medium with auto-scaling
- Consider AWS App Runner for potentially lower costs

## Alternative: AWS App Runner (Container-based)

If you prefer Docker-based deployment:
1. Create Dockerfile in apps/backend
2. Push to ECR or Docker Hub
3. Deploy via AWS App Runner console
4. Lower maintenance overhead than EB

## DNS Configuration

After deployment, update your DNS:
1. Get EB URL: `eb status`
2. Create CNAME record: `api.wbfpartnership.com` → `your-eb-url.elasticbeanstalk.com`
3. Or use AWS Route 53 for better integration
