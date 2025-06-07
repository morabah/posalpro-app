#!/bin/bash
# Script to fix the dashboardCache references in api.ts
sed -i '' 's/const cached = dashboardCache.get(cacheKey);/const cached = performanceMetricsCache.get(cacheKey);/g' src/lib/dashboard/api.ts
sed -i '' 's/const cached = dashboardCache.get(cacheKey);/const cached = notificationsListCache.get(cacheKey);/g' src/lib/dashboard/api.ts
