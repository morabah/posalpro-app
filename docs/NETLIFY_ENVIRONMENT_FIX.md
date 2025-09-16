# 🚨 CRITICAL: Netlify Environment Variables Fix

## **Issue Identified**

The persistent Prisma Data Proxy error is caused by the **DATABASE_URL
environment variable in Netlify being set to a `prisma://` URL** instead of a
`postgresql://` URL.

**Error Message:**

```
Error validating datasource `db`: the URL must start with the protocol `prisma://`
```

## **Root Cause**

- The Prisma client is being generated correctly with binary engine
- However, the DATABASE_URL in Netlify environment variables is set to
  `prisma://` (Data Proxy URL)
- This causes the Prisma client to expect Data Proxy connections
- But our configuration is set for direct PostgreSQL connections

## **Solution Steps**

### **Step 1: Access Netlify Dashboard**

1. Go to [Netlify Dashboard](https://app.netlify.com/)
2. Navigate to your site: `posalpro-mvp2` or `posalpro`
3. Go to **Site settings** → **Environment variables**

### **Step 2: Check Current DATABASE_URL**

Look for the `DATABASE_URL` environment variable and verify its value:

- ❌ **WRONG**: `prisma://accelerate.prisma-data.net/...`
- ✅ **CORRECT**:
  `postgresql://username:password@host:port/database?sslmode=require`

### **Step 3: Update DATABASE_URL**

If the DATABASE_URL is set to `prisma://`, you need to change it to your direct
PostgreSQL connection string:

**Format:**

```
postgresql://username:password@host:port/database?sslmode=require
```

**Example (Neon Database):**

```
postgresql://username:password@ep-ancient-sun-a9gve4ul-pooler.gwc.azure.neon.tech/neondb?sslmode=require
```

### **Step 4: Verify All Prisma Environment Variables**

Ensure these environment variables are set correctly:

```bash
# ✅ CORRECT VALUES
PRISMA_GENERATE_DATAPROXY=false
PRISMA_CLIENT_ENGINE_TYPE=binary
PRISMA_CLI_QUERY_ENGINE_TYPE=binary
PRISMA_ENGINE_TYPE=binary
PRISMA_SKIP_POSTINSTALL_GENERATE=true
```

### **Step 5: Trigger New Deployment**

After updating the environment variables:

1. Go to **Deploys** tab in Netlify
2. Click **Trigger deploy** → **Deploy site**
3. This will trigger a new build with the corrected environment variables

## **Verification Steps**

### **After Deployment:**

1. **Test Database Health Endpoint:**

   ```bash
   curl https://posalpro.netlify.app/api/health/database
   ```

   Should return: `{"db":"up","timestamp":"..."}`

2. **Test Prisma Configuration:**

   ```bash
   curl https://posalpro.netlify.app/api/health/prisma-config
   ```

   Should show: `"engineType": "binary"` (not "unknown")

3. **Run Monitoring Script:**
   ```bash
   ./scripts/monitor-deployment.sh
   ```

## **Alternative Solution (If Environment Variables Can't Be Changed)**

If you can't modify the Netlify environment variables, we can implement a
workaround:

### **Option 1: Environment Variable Override in Build Script**

Modify `scripts/netlify-build.sh` to override the DATABASE_URL:

```bash
# Override DATABASE_URL if it's set to prisma://
if [[ "$DATABASE_URL" == prisma://* ]]; then
  echo "⚠️  Overriding prisma:// URL with postgresql:// URL"
  export DATABASE_URL="postgresql://your-actual-postgresql-url"
fi
```

### **Option 2: Runtime URL Transformation**

Modify the Prisma client initialization to transform the URL at runtime.

## **Expected Results After Fix**

✅ **Database Health Endpoint**: Returns 200 status ✅ **Prisma Configuration**:
Shows `engineType: "binary"` ✅ **No More Data Proxy Errors**: All database
operations work ✅ **Production Functionality**: Full application functionality
restored

## **Troubleshooting**

### **If Issue Persists:**

1. **Check Build Logs**: Look for Prisma generation output in Netlify build logs
2. **Verify Environment Variables**: Ensure all Prisma env vars are set
   correctly
3. **Clear Netlify Cache**: Try clearing the build cache in Netlify
4. **Check Database Connectivity**: Verify the PostgreSQL database is accessible

### **Common Issues:**

- **Wrong Database URL Format**: Must be `postgresql://` not `prisma://`
- **Missing Environment Variables**: All Prisma env vars must be set
- **Cached Build**: Netlify might be using cached build artifacts

## **Success Indicators**

When the fix is successful, you should see:

- 🎉 Database health endpoint returns 200
- 🎉 Prisma configuration shows binary engine
- 🎉 No more "prisma://" protocol errors
- 🎉 All API endpoints working correctly
- 🎉 Full application functionality restored

---

**Next Action Required:** Update the DATABASE_URL environment variable in
Netlify from `prisma://` to `postgresql://` and trigger a new deployment.
