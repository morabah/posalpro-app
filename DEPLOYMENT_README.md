# 🚀 PosalPro MVP2 - Complete Deployment Guide

## 🎯 Quick Start (5 minutes)

If you want to deploy NOW without reading everything:

```bash
# 1. Set up Neon database (follow NEON_DATABASE_SETUP.md)
# 2. Configure Netlify environment variables
# 3. Run the automated deployment script
./scripts/deploy-to-netlify.sh production
```

That's it! The script handles everything else automatically.

---

## 📋 Table of Contents

1. [Prerequisites](#-prerequisites)
2. [Database Setup (Neon)](#-database-setup-neon)
3. [Netlify Configuration](#-netlify-configuration)
4. [Environment Variables](#-environment-variables)
5. [Automated Deployment](#-automated-deployment)
6. [Manual Deployment](#-manual-deployment)
7. [Troubleshooting](#-troubleshooting)
8. [Post-Deployment](#-post-deployment)

---

## ✅ Prerequisites

### Required Accounts
- ✅ [Neon Database](https://neon.tech) - Free PostgreSQL database
- ✅ [Netlify Account](https://netlify.com) - Free hosting
- ✅ [Git Repository](https://github.com) - For deployment

### Local Setup
```bash
# Ensure you have Node.js 20.17.0+
node --version

# Install dependencies
npm install

# Test local development
npm run dev:smart
```

---

## 🗄️ Database Setup (Neon)

### Step 1: Create Neon Project

1. Go to [console.neon.tech](https://console.neon.tech)
2. Click **"Create Project"**
3. Configure:
   - **Name**: `posalpro-mvp2-prod`
   - **Region**: Choose closest to your users
   - **PostgreSQL Version**: Latest (15+)

### Step 2: Get Connection Details

1. In Neon dashboard, click **"Connection Details"**
2. Copy the **"Pooled connection"** string
3. It should look like:
   ```
   postgresql://username:password@ep-xyz.us-east-1.neon.tech/dbname?sslmode=require
   ```

### Step 3: Initial Database Setup

```bash
# Set your Neon connection string
export DATABASE_URL="your-neon-connection-string"
export DIRECT_URL="your-neon-connection-string"

# Test connection and setup database
npm run db:generate
npm run db:push
npm run db:seed
```

---

## 🌐 Netlify Configuration

### Step 1: Connect Repository

1. Go to [netlify.com](https://netlify.com)
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect your Git repository
4. Configure build settings:

```yaml
# Build settings in Netlify
Build command: bash ./netlify-deploy.sh
Publish directory: .next
```

### Step 2: Configure Environment Variables

In Netlify dashboard:
1. Go to **Site Settings** → **Environment Variables**
2. Add these variables:

```bash
# Database (from Neon)
DATABASE_URL=postgresql://username:password@ep-xyz.us-east-1.neon.tech/dbname?sslmode=require
DIRECT_URL=postgresql://username:password@ep-xyz.us-east-1.neon.tech/dbname?sslmode=require

# Authentication
NEXTAUTH_URL=https://your-site-name.netlify.app
NEXTAUTH_SECRET=your-32-character-secret-here

# Security
JWT_SECRET=your-32-character-jwt-secret-here
CSRF_SECRET=your-32-character-csrf-secret-here

# Application
NODE_ENV=production
APP_ENV=production
NEXT_PUBLIC_APP_URL=https://your-site-name.netlify.app

# Build Configuration
PRISMA_CLI_QUERY_ENGINE_TYPE=library
PRISMA_CLIENT_ENGINE_TYPE=library
PRISMA_GENERATE_DATAPROXY=false
PRISMA_CLI_BINARY_TARGETS=debian-openssl-3.0.x
```

### Step 3: Generate Secure Secrets

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate JWT_SECRET
openssl rand -base64 32

# Generate CSRF_SECRET
openssl rand -base64 32
```

---

## 🚀 Automated Deployment

The easiest way to deploy:

```bash
# Deploy to production
./scripts/deploy-to-netlify.sh production

# Or deploy to staging
./scripts/deploy-to-netlify.sh staging
```

### What the script does:

✅ **Validates environment variables**
✅ **Tests database connection**
✅ **Sets up Prisma client**
✅ **Validates build configuration**
✅ **Tests local build**
✅ **Deploys to Netlify**
✅ **Provides post-deployment instructions**

---

## 🔧 Manual Deployment

If you prefer manual deployment:

### Step 1: Local Testing

```bash
# Test everything locally first
npm run type-check
npm run build
npm run start

# Test API endpoints
curl http://localhost:3000/api/health
curl http://localhost:3000/api/auth/session
```

### Step 2: Deploy via Git

```bash
# Commit your changes
git add .
git commit -m "Deploy: Update configuration"
git push origin main

# Netlify will auto-deploy
```

### Step 3: Manual Deploy (if needed)

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy manually
netlify deploy --prod --dir=.next
```

---

## 🔧 Troubleshooting

### ❌ "Build failed" in Netlify

**Check the build log for:**
- Missing environment variables
- Database connection errors
- TypeScript compilation errors

**Solutions:**
```bash
# Test locally first
npm run type-check
npm run build

# Check environment variables in Netlify dashboard
# Ensure DATABASE_URL is set correctly
```

### ❌ "Can't reach database server"

**Common causes:**
- Neon database is paused
- Wrong connection string
- SSL mode not set

**Solutions:**
```bash
# Check Neon dashboard
# Ensure database is not paused
# Use "Pooled connection" URL
# Verify SSL mode: ?sslmode=require
```

### ❌ "Authentication failed"

**Check:**
- NEXTAUTH_URL matches your Netlify domain
- NEXTAUTH_SECRET is set (32+ characters)
- All auth pages exist (/auth/error, /contact)

### ❌ API returns HTML instead of JSON

**Cause:** Missing catch-all redirect in netlify.toml

**Solution:** Ensure this is at the END of netlify.toml:
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## 🎉 Post-Deployment

### Verify Deployment

```bash
# Test your live site
curl -H "Accept: application/json" https://your-site.netlify.app/api/health
curl -H "Accept: application/json" https://your-site.netlify.app/api/auth/session

# Test authentication flow
# 1. Visit https://your-site.netlify.app/auth/login
# 2. Login with admin@posalpro.com / PosalPro2024!
# 3. Verify dashboard loads
```

### Monitor & Maintain

1. **Set up health checks:**
   ```bash
   curl -f https://your-site.netlify.app/api/health || alert "Site down"
   ```

2. **Monitor in Netlify dashboard:**
   - Build logs
   - Function logs
   - Performance metrics

3. **Database monitoring:**
   - Check Neon dashboard for usage
   - Monitor connection limits
   - Set up automated backups

---

## 📚 Additional Resources

- 📖 **[NEON_DATABASE_SETUP.md](./docs/NEON_DATABASE_SETUP.md)** - Detailed Neon setup
- 📖 **[NETLIFY_DEPLOYMENT_GUIDE.md](./docs/NETLIFY_DEPLOYMENT_GUIDE.md)** - Advanced Netlify config
- 🐛 **[LESSONS_LEARNED.md](./LESSONS_LEARNED.md)** - Deployment troubleshooting
- 🔧 **[scripts/deploy-to-netlify.sh](./scripts/deploy-to-netlify.sh)** - Automated deployment script

---

## 🚨 Emergency Deployment

If everything fails:

```bash
# Force deploy with minimal checks
git add .
git commit -m "Emergency deploy" --no-verify
git push origin main

# Or manual deploy
netlify deploy --prod --dir=.next --message="Emergency deployment"
```

---

## 💡 Pro Tips

- **Always test locally first** before pushing to production
- **Use the automated script** - it catches most issues
- **Monitor Neon usage** to avoid unexpected costs
- **Set up automated backups** in Neon
- **Keep secrets secure** - never commit to git
- **Use staging environment** for testing major changes

---

## 🎯 Success Checklist

- [ ] Neon database created and running
- [ ] Environment variables set in Netlify
- [ ] Database connection tested (`npm run db:push`)
- [ ] Local build successful (`npm run build`)
- [ ] Deployment completed without errors
- [ ] API endpoints return JSON (not HTML)
- [ ] Authentication works on live site
- [ ] Database operations functional

**If all checks pass: 🎉 You're deployed successfully!**

---

**Need help?** Check the troubleshooting section or open an issue in the repository.

Happy deploying! 🚀
