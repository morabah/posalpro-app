#!/bin/bash

# PosalPro MVP2 - Add Archive Notices to Additional Archived Documents
# Adds standardized archive notices to newly archived documents

echo "🗂️ Adding archive notices to additional archived documents..."

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

# Additional archived documents
add_archive_notice "docs/archive/fixes/API_ENDPOINT_FIXES.md" \
    "Issues resolved, fixes documented elsewhere" \
    "docs/PROPOSAL_MIGRATION_ASSESSMENT.md, docs/LESSONS_LEARNED.md"

add_archive_notice "docs/archive/fixes/ERROR_HANDLING_IMPLEMENTATION.md" \
    "Implementation completed, patterns established in core docs" \
    "docs/CORE_REQUIREMENTS.md, docs/DEVELOPMENT_STANDARDS.md"

add_archive_notice "docs/archive/fixes/VALIDATION_INTEGRATION_SUMMARY.md" \
    "Integration completed, documented in current validation docs" \
    "docs/VALIDATION_LIBRARY_SUMMARY.md"

add_archive_notice "docs/archive/fixes/cleanup-plan.md" \
    "Cleanup completed, plan outdated" \
    "docs/TESTING_CODEBASE_AUDIT.md"

add_archive_notice "docs/archive/strategies/EXECUTIVE_DASHBOARD_ENHANCEMENT_STRATEGY.md" \
    "Planning document, may be outdated if enhancements implemented" \
    "docs/CORE_REQUIREMENTS.md"

add_archive_notice "docs/archive/assessments/PROPOSAL_WIZARD_COMPLIANCE_REPORT.md" \
    "Assessment completed, compliance verified" \
    "docs/PROPOSAL_MIGRATION_ASSESSMENT.md"

echo ""
echo "✅ Archive notices added to additional archived documents!"
echo ""
echo "📊 Summary:"
echo "- Fix documents: 4 files updated"
echo "- Strategy documents: 1 file updated"
echo "- Assessment documents: 1 file updated"
echo "- Total: 6 additional files with archive notices"
echo ""
echo "🗂️ All newly archived documents now have standardized notices for historical reference."
