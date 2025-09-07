#!/bin/bash
echo "Adding error handler imports to routes..."

# List of routes to update
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

for route in "${routes[@]}"; do
  if [ -f "$route" ]; then
    if ! grep -q "from '@/server/api/errorHandler'" "$route"; then
      # Find first import line and add after it
      awk '
      /^import/ && !done {
        print $0
        print "import {"
        print "  createSuccessResponse,"
        print "  withAsyncErrorHandler,"
        print "  getErrorHandler"
        print "} from '\''@/server/api/errorHandler'\'';"
        print ""
        done=1
        next
      }
      { print }
      ' "$route" > "${route}.tmp" && mv "${route}.tmp" "$route"
      echo "✅ Added imports to $route"
    else
      echo "ℹ️  Imports already present in $route"
    fi
  fi
done

echo "Import addition complete!"
