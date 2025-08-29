#!/bin/bash

# PosalPro MVP2 - Add Archive Notices to Archived Documents
# Adds standardized archive notices to all archived documents

echo "🗂️ Adding archive notices to archived documents..."

# Function to add archive notice to a file
add_archive_notice() {
    local file="$1"
    local reason="$2"
    local current_doc="$3"

    if [ -f "$file" ]; then
        # Create temporary file with archive notice
        cat > "${file}.tmp" << EOF
# ARCHIVED DOCUMENT - HISTORICAL REFERENCE
#
# This document has been archived as it contains historical information
# about completed work or outdated planning/strategy documents.
#
# Date Archived: 2025-08-29
# Reason for Archiving: ${reason}
# Current Status: Historical reference only
# Related Current Docs: ${current_doc}
#
# ---
# Original content preserved below
#

EOF

        # Append original content
        cat "$file" >> "${file}.tmp"

        # Replace original file
        mv "${file}.tmp" "$file"

        echo "✅ Added archive notice to: $file"
    else
        echo "⚠️ File not found: $file"
    fi
}

# Migration documents
add_archive_notice "docs/archive/migrations/CUSTOMER_MIGRATION_ASSESSMENT.md" \
    "Migration completed, implementation has evolved" \
    "docs/CUSTOMER_MIGRATION_ACCEPTANCE_CHECKLIST.md (archived)"

add_archive_notice "docs/archive/migrations/PRODUCT_MIGRATION_ASSESSMENT.md" \
    "Migration work finished, document outdated" \
    "docs/PRODUCT_MIGRATION_COMPLETION.md (archived)"

add_archive_notice "docs/archive/migrations/PROPOSAL_PAGES_MIGRATION_COMPLETE.md" \
    "Historical documentation of completed work" \
    "docs/PROPOSAL_MIGRATION_ASSESSMENT.md"

add_archive_notice "docs/archive/migrations/CUSTOMER_MIGRATION_ACCEPTANCE_CHECKLIST.md" \
    "Migration completed, checklist no longer needed" \
    "docs/CUSTOMER_MIGRATION_ASSESSMENT.md (archived)"

add_archive_notice "docs/archive/migrations/PRODUCT_MIGRATION_COMPLETION.md" \
    "Historical documentation, no ongoing value" \
    "docs/PRODUCT_MIGRATION_ASSESSMENT.md (archived)"

add_archive_notice "docs/archive/migrations/CUSTOMER_MIGRATION_BENEFITS_ANALYSIS.md" \
    "Migration completed, analysis outdated" \
    "docs/CUSTOMER_MIGRATION_ASSESSMENT.md (archived)"

# Fix documents
add_archive_notice "docs/archive/fixes/EDIT_PROPOSAL_FIXES.md" \
    "Issues have been resolved, fixes documented elsewhere" \
    "docs/PROPOSAL_MIGRATION_ASSESSMENT.md, docs/LESSONS_LEARNED.md"

add_archive_notice "docs/archive/fixes/EDIT_PROPOSAL_IMPLEMENTATION.md" \
    "Implementation complete, details in main docs" \
    "docs/PROPOSAL_MIGRATION_ASSESSMENT.md"

add_archive_notice "docs/archive/fixes/EDIT_PROPOSAL_COMPLIANCE_ANALYSIS.md" \
    "Analysis complete, compliance verified" \
    "docs/PROPOSAL_MIGRATION_ASSESSMENT.md"

add_archive_notice "docs/archive/fixes/INFINITE_LOOP_FIX_ANALYSIS.md" \
    "Issue fixed, analysis no longer needed" \
    "docs/LESSONS_LEARNED.md"

# Strategy documents
add_archive_notice "docs/archive/strategy/DATA_CONSISTENCY_IMPLEMENTATION.md" \
    "Implementation completed, plan outdated" \
    "docs/CORE_REQUIREMENTS.md"

echo ""
echo "✅ Archive notices added to all archived documents!"
echo ""
echo "📊 Summary:"
echo "- Migration documents: 6 files updated"
echo "- Fix documents: 4 files updated"
echo "- Strategy documents: 1 file updated"
echo "- Total: 11 documents with archive notices"
echo ""
echo "🗂️ All archived documents now have standardized notices for historical reference."
