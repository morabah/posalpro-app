/**
 * PosalPro MVP2 - Application Footer
 * Simple footer with branding and basic information
 * Based on wireframe specifications for consistent design
 */

'use client';

import Link from 'next/link';

export function AppFooter() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
          {/* Left section - Branding */}
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              © 2025 PosalPro MVP2. Enterprise Proposal Management.
            </span>
          </div>

          {/* Right section - Links */}
          <div className="flex items-center space-x-6 text-sm text-gray-500">
            <Link
              href="/help"
              className="hover:text-gray-700 transition-colors duration-150"
              aria-label="Help and support"
            >
              Help
            </Link>
            <Link
              href="/settings"
              className="hover:text-gray-700 transition-colors duration-150"
              aria-label="Application settings"
            >
              Settings
            </Link>
            <Link
              href="/privacy"
              className="hover:text-gray-700 transition-colors duration-150"
              aria-label="Privacy policy"
            >
              Privacy
            </Link>
            <span className="text-xs text-gray-400">v2.0.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
