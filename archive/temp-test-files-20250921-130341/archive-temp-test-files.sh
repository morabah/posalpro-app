#!/bin/bash

# Archive Temporary Test Files Script
# This script moves temporary test files to the archive directory

set -e

echo "🚀 Starting temporary test files archiving..."

# Get the archive directory path
ARCHIVE_DIR="/Volumes/Rabah_SSD/enrpreneurship/PosalPro/MVP2/posalpro-app/archive/temp-test-files-$(date +%Y%m%d-%H%M%S)"

# Create the archive directory
mkdir -p "$ARCHIVE_DIR"

echo "📁 Created archive directory: $ARCHIVE_DIR"

# Count of files to be moved
FILE_COUNT=0

# Find and move files, excluding archive folder and build artifacts
while IFS= read -r -d '' file; do
    if [[ -f "$file" ]]; then
        # Create relative path for better organization in archive
        REL_PATH="${file#/Volumes/Rabah_SSD/enrpreneurship/PosalPro/MVP2/posalpro-app/}"

        # Create directory structure in archive
        ARCHIVE_PATH="$ARCHIVE_DIR/$(dirname "$REL_PATH")"
        mkdir -p "$ARCHIVE_PATH"

        # Move the file
        mv "$file" "$ARCHIVE_DIR/$REL_PATH"
        echo "📦 Moved: $REL_PATH"
        ((FILE_COUNT++))
    fi
done < <(find /Volumes/Rabah_SSD/enrpreneurship/PosalPro/MVP2/posalpro-app -type f \
    \( -name "*.test.*" -o -name "*temp*" -o -name "*backup*" -o -name "*old*" -o -name "*unused*" -o -name "*obsolete*" -o -name "*sample*" \) \
    -not -path "*/archive/*" \
    -not -path "*/node_modules/*" \
    -not -path "*/coverage/*" \
    -not -path "*/.netlify/*" \
    -not -path "*/.next/*" \
    -not -path "*/.git/*" \
    -print0)

echo "✅ Archiving completed successfully!"
echo "📊 Total files archived: $FILE_COUNT"
echo "📁 Archive location: $ARCHIVE_DIR"

# Create a summary file
cat > "$ARCHIVE_DIR/README.md" << EOF
# Archived Temporary Test Files

**Archive Date:** $(date)
**Total Files:** $FILE_COUNT

## Summary
This archive contains temporary test files, backup files, sample files, and old/deprecated files that were identified as candidates for archiving to clean up the codebase.

## Categories Archived
- Test files (.test.ts, .test.tsx, .test.js)
- Backup files (.backup.tsx, .backup.ts)
- Temporary files (*temp*, *tmp*)
- Sample files (*sample*)
- Old/deprecated files (*old*)
- Template files (design patterns)
- Test scripts and utilities

## Restoration
To restore any files from this archive:
1. Navigate to: $ARCHIVE_DIR
2. Copy files back to their original locations
3. Update any references as needed

**Note:** All files were moved from their original locations to preserve directory structure.
EOF

echo "📝 Created archive summary: $ARCHIVE_DIR/README.md"
echo "🎉 Archive operation completed successfully!"
