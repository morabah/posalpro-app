#!/bin/bash

# PosalPro MVP2 - Migrate Scattered Tests to Unified Structure
# This script migrates all scattered test files to the unified test structure

set -e

echo "🔄 Starting test migration to unified structure..."

# Function to create directory if it doesn't exist
create_dir() {
  local dir="$1"
  if [ ! -d "$dir" ]; then
    mkdir -p "$dir"
    echo "📁 Created directory: $dir"
  fi
}

# Function to move file safely
move_file() {
  local source="$1"
  local target="$2"

  if [ -f "$source" ]; then
    create_dir "$(dirname "$target")"
    mv "$source" "$target"
    echo "📄 Moved: $source → $target"
  fi
}

# Function to move directory contents safely
move_dir_contents() {
  local source_dir="$1"
  local target_dir="$2"

  if [ -d "$source_dir" ] && [ "$(ls -A "$source_dir" 2>/dev/null)" ]; then
    create_dir "$target_dir"
    mv "$source_dir"/* "$target_dir"/ 2>/dev/null || true
    echo "📁 Moved contents: $source_dir/* → $target_dir/"
  fi
}

echo "📦 Migrating scattered test files..."

# 1. Migrate lib tests
echo "🔧 Migrating lib tests..."
move_dir_contents "src/lib/__tests__" "tests/unit/lib"
move_dir_contents "src/lib/auth/__tests__" "tests/unit/lib/auth"
move_dir_contents "src/lib/store/__tests__" "tests/unit/lib/store"
move_dir_contents "src/lib/testing/__tests__" "tests/unit/lib/testing"

# 2. Migrate service tests
echo "🔧 Migrating service tests..."
move_dir_contents "src/services/__tests__" "tests/unit/services"

# 3. Migrate component tests
echo "🔧 Migrating component tests..."
for component_dir in src/components/*/; do
  if [ -d "$component_dir" ]; then
    component_name=$(basename "$component_dir")
    if [ -d "${component_dir}__tests__" ]; then
      move_dir_contents "${component_dir}__tests__" "tests/unit/components/$component_name"
    fi
  fi
done

# 4. Migrate hook tests
echo "🔧 Migrating hook tests..."
for hook_dir in src/hooks/*/; do
  if [ -d "$hook_dir" ]; then
    hook_name=$(basename "$hook_dir")
    if [ -d "${hook_dir}__tests__" ]; then
      move_dir_contents "${hook_dir}__tests__" "tests/unit/hooks/$hook_name"
    fi
  fi
done

# 5. Migrate feature tests
echo "🔧 Migrating feature tests..."
for feature_dir in src/features/*/; do
  if [ -d "$feature_dir" ]; then
    feature_name=$(basename "$feature_dir")
    if [ -d "${feature_dir}__tests__" ]; then
      move_dir_contents "${feature_dir}__tests__" "tests/unit/features/$feature_name"
    fi
  fi
done

# 6. Migrate app/API route tests
echo "🔧 Migrating API route tests..."
# Dashboard routes
if [ -d "src/app/(dashboard)/proposals/version-history/__tests__" ]; then
  move_dir_contents "src/app/(dashboard)/proposals/version-history/__tests__" "tests/api-routes/proposals"
fi

# API routes
if [ -d "src/app/api/proposals/versions/__tests__" ]; then
  move_dir_contents "src/app/api/proposals/versions/__tests__" "tests/api-routes/proposals"
fi

# 7. Migrate utility tests
echo "🔧 Migrating utility tests..."
move_dir_contents "src/utils/__tests__" "tests/unit/utils"

# 8. Migrate existing test directory contents
echo "🔧 Migrating existing test directory contents..."
if [ -d "src/test/integration" ]; then
  move_dir_contents "src/test/integration" "tests/integration"
fi

if [ -d "src/test/api-routes" ]; then
  move_dir_contents "src/test/api-routes" "tests/api-routes"
fi

if [ -d "src/test/critical-gaps" ]; then
  move_dir_contents "src/test/critical-gaps" "tests/critical-gaps"
fi

if [ -d "src/test/security" ]; then
  move_dir_contents "src/test/security" "tests/security"
fi

if [ -d "src/test/accessibility" ]; then
  move_dir_contents "src/test/accessibility" "tests/accessibility"
fi

if [ -d "src/test/api" ]; then
  move_dir_contents "src/test/api" "tests/integration/api"
fi

# 9. Migrate standalone test files
echo "🔧 Migrating standalone test files..."
find src -name "*.test.*" -o -name "*.spec.*" | grep -v node_modules | while read -r file; do
  # Skip if already in tests directory
  if [[ "$file" == tests/* ]]; then
    continue
  fi

  # Determine target directory based on file location and content
  target_dir=""
  if [[ "$file" == *"components"* ]]; then
    component_name=$(echo "$file" | sed -n 's|.*components/\([^/]*\)/.*|\1|p')
    target_dir="tests/unit/components/${component_name:-components}"
  elif [[ "$file" == *"services"* ]]; then
    target_dir="tests/unit/services"
  elif [[ "$file" == *"lib"* ]]; then
    target_dir="tests/unit/lib"
  elif [[ "$file" == *"hooks"* ]]; then
    target_dir="tests/unit/hooks"
  elif [[ "$file" == *"utils"* ]]; then
    target_dir="tests/unit/utils"
  elif [[ "$file" == *"api"* ]]; then
    target_dir="tests/api-routes"
  elif [[ "$file" == *"integration"* ]] || [[ "$file" == *"journey"* ]]; then
    target_dir="tests/integration"
  elif [[ "$file" == *"accessibility"* ]] || [[ "$file" == *"a11y"* ]]; then
    target_dir="tests/accessibility"
  elif [[ "$file" == *"security"* ]]; then
    target_dir="tests/security"
  else
    target_dir="tests/unit/lib"
  fi

  target_file="$target_dir/$(basename "$file")"
  move_file "$file" "$target_file"
done

# 10. Migrate root-level test files
echo "🔧 Migrating root-level test files..."
if [ -d "test" ]; then
  move_dir_contents "test" "tests/e2e/puppeteer"
fi

# 11. Move remaining test directory contents
echo "🔧 Migrating remaining test directory contents..."
if [ -d "src/test" ]; then
  # Move any remaining files that weren't caught by specific migrations
  find src/test -name "*.test.*" -o -name "*.spec.*" | while read -r file; do
    filename=$(basename "$file")
    if [[ "$filename" == *"unit"* ]]; then
      move_file "$file" "tests/unit/lib/$filename"
    elif [[ "$filename" == *"integration"* ]] || [[ "$filename" == *"journey"* ]]; then
      move_file "$file" "tests/integration/$filename"
    elif [[ "$filename" == *"accessibility"* ]] || [[ "$filename" == *"a11y"* ]]; then
      move_file "$file" "tests/accessibility/$filename"
    elif [[ "$filename" == *"security"* ]]; then
      move_file "$file" "tests/security/$filename"
    elif [[ "$filename" == *"performance"* ]]; then
      move_file "$file" "tests/performance/$filename"
    else
      move_file "$file" "tests/unit/lib/$filename"
    fi
  done
fi

echo "✅ Test migration completed!"
echo ""
echo "📊 Migration Summary:"
echo "- Migrated lib tests"
echo "- Migrated component tests"
echo "- Migrated service tests"
echo "- Migrated API route tests"
echo "- Migrated integration tests"
echo "- Migrated standalone test files"
echo ""
echo "🔍 Next step: Run verification script"
echo "./scripts/verify-test-migration.sh"
