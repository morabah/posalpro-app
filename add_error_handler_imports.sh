#!/bin/bash

# Script to add error handler imports to routes that need updating

routes=(
  "src/app/api/admin/audit/route.ts"
  "src/app/api/admin/db-sync/route.ts"
  "src/app/api/admin/users/route.ts"
  "src/app/api/analytics/users/route.ts"
  "src/app/api/customers/search/route.ts"
  "src/app/api/customers/validate-email/route.ts"
  "src/app/api/products/products_new/bulk-delete/route.ts"
  "src/app/api/products/products_new/route.ts"
  "src/app/api/products/products_new/search/route.ts"
  "src/app/api/products/relationships/rules/route.ts"
  "src/app/api/products/validate-sku/route.ts"
  "src/app/api/products/validate/route.ts"
  "src/app/api/proposals/bulk-delete/route.ts"
  "src/app/api/proposals/dashboard-metrics/route.ts"
  "src/app/api/proposals/route.ts"
  "src/app/api/proposals/stats/route.ts"
  "src/app/api/proposals/workflow/route.ts"
)

echo "Adding error handler imports to ${#routes[@]} routes..."

for route in "${routes[@]}"; do
  if [ -f "$route" ]; then
    if ! grep -q "from '@/server/api/errorHandler'" "$route"; then
      # Find the last import line and add the error handler import after it
      sed -i '' '/^import.*$/a\
import {\
  createSuccessResponse,\
  withAsyncErrorHandler,\
  getErrorHandler\
} from '\''@/server/api/errorHandler'\'';\
' "$route"
      echo "✅ Added error handler imports to $route"
    else
      echo "ℹ️  Error handler imports already present in $route"
    fi
  else
    echo "❌ Route $route not found"
  fi
done

echo "Import addition complete!"
