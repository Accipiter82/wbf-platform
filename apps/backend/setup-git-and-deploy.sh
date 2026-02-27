#!/bin/bash

# Setup Git and Deploy to AWS EB
# This script initializes git (required by EB CLI) and deploys

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "🔧 Setting up Git repository (required by EB CLI)..."

cd "$REPO_ROOT"

# Check if git is already initialized
if [ -d ".git" ]; then
    echo "✅ Git already initialized"
else
    echo "📦 Initializing Git repository..."
    git init

    # Create .gitignore if it doesn't exist
    if [ ! -f ".gitignore" ]; then
        cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Production
dist/
build/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# OS
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# IDE
.idea/
.vscode/
*.swp
*.swo
*~

# EB (keep config, ignore logs)
.elasticbeanstalk/*
!.elasticbeanstalk/*.cfg.yml
!.elasticbeanstalk/*.global.yml
!.elasticbeanstalk/config.yml
EOF
    fi

    echo "📝 Creating initial commit..."
    git add .
    git commit -m "Initial commit - WBF Platform ready for deployment"
    echo "✅ Git repository initialized"
fi

# Go back to backend
cd "$SCRIPT_DIR"

echo ""
echo "🚀 Now initializing Elastic Beanstalk..."
echo ""

# Check if EB is already initialized
if [ -d ".elasticbeanstalk" ]; then
    echo "✅ EB already initialized"
else
    echo "Initializing EB with 'wbf' profile..."
    eb init -p "Node.js 20 running on 64bit Amazon Linux 2023" \
        wbf-platform-backend \
        --region eu-north-1 \
        --profile wbf
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Create environment: eb create wbf-backend-prod --instance-type t3.small --profile wbf"
echo "2. Set env vars: ./set-env-vars.sh"
echo "3. Test: eb status --profile wbf && eb open --profile wbf"
echo ""
echo "⚠️  IMPORTANT: Always use --profile wbf for all EB commands"
echo ""
