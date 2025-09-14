'use client';

import { Button } from '@/components/ui/forms/Button';
import { DocumentIcon, EyeIcon, ChevronDownIcon, ChevronUpIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';

interface DatasheetItem {
  productId: string;
  productName: string;
  sku: string;
  datasheetPath: string;
}

interface CollapsibleDatasheetSectionProps {
  datasheets: DatasheetItem[];
  selectedDatasheets: Set<string>;
  onToggleDatasheet: (productId: string) => void;
  onSelectAllDatasheets: () => void;
  onClearAllDatasheets: () => void;
  onPreviewDatasheet: (datasheetPath: string) => void;
  className?: string;
}

export function CollapsibleDatasheetSection({
  datasheets,
  selectedDatasheets,
  onToggleDatasheet,
  onSelectAllDatasheets,
  onClearAllDatasheets,
  onPreviewDatasheet,
  className = '',
}: CollapsibleDatasheetSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter datasheets based on search term
  const filteredDatasheets = useMemo(() => {
    if (!searchTerm.trim()) return datasheets;

    const term = searchTerm.toLowerCase();
    return datasheets.filter(datasheet =>
      datasheet.productName.toLowerCase().includes(term) ||
      datasheet.sku.toLowerCase().includes(term) ||
      datasheet.datasheetPath.toLowerCase().includes(term)
    );
  }, [datasheets, searchTerm]);

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  if (datasheets.length === 0) {
    return (
      <motion.div
        className={`rounded-xl border border-gray-200 bg-gray-50 p-8 mb-6 print:shadow-none shadow-sm ${className}`}
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.3 }}
      >
        <div className="text-center">
          <DocumentIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Datasheets Available
          </h3>
          <p className="text-sm text-gray-600">
            None of the products in this proposal have datasheet URLs configured.
          </p>
          <p className="text-xs text-gray-500 mt-2">
            To include datasheets, add Network URLs to products in the Product
            Management section.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`rounded-xl border border-gray-200 bg-white p-8 mb-6 print:shadow-none shadow-sm ${className}`}
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      transition={{ delay: 0.3 }}
    >
      {/* Header with Collapse/Expand Button */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 h-8 w-8 print:hidden"
            aria-label={isExpanded ? 'Collapse datasheets' : 'Expand datasheets'}
          >
            {isExpanded ? (
              <ChevronUpIcon className="h-5 w-5 text-gray-600" />
            ) : (
              <ChevronDownIcon className="h-5 w-5 text-gray-600" />
            )}
          </Button>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <DocumentIcon className="h-5 w-5 text-blue-600" />
              Product Datasheets
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({datasheets.length} available)
              </span>
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {isExpanded
                ? 'Select datasheets to include in the PDF print'
                : 'Click to expand and manage datasheets'
              }
            </p>
          </div>
        </div>

        {selectedDatasheets.size > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-blue-700 font-medium">
              {selectedDatasheets.size} selected
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={onClearAllDatasheets}
              className="print:hidden h-7 px-2 text-xs"
            >
              Clear All
            </Button>
          </div>
        )}
      </div>

      {/* Collapsible Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            {/* Search Bar */}
            <div className="mb-4">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search datasheets by product name, SKU, or filename..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              {searchTerm && (
                <p className="text-xs text-gray-500 mt-1">
                  Showing {filteredDatasheets.length} of {datasheets.length} datasheets
                </p>
              )}
            </div>

            {/* Datasheet Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 print:bg-white">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-700 w-8">
                      <input
                        type="checkbox"
                        checked={selectedDatasheets.size === filteredDatasheets.length && filteredDatasheets.length > 0}
                        onChange={
                          selectedDatasheets.size === filteredDatasheets.length && filteredDatasheets.length > 0
                            ? onClearAllDatasheets
                            : onSelectAllDatasheets
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded print:hidden"
                      />
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">
                      Product
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">SKU</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">
                      Datasheet
                    </th>
                    <th className="px-3 py-2 text-center font-medium text-gray-700 w-20">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredDatasheets.length > 0 ? (
                    filteredDatasheets.map((datasheet, index) => (
                      <motion.tr
                        key={datasheet.productId}
                        className={`hover:bg-gray-50 transition-colors ${
                          selectedDatasheets.has(datasheet.productId) ? 'bg-blue-50' : ''
                        }`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <td className="px-3 py-3">
                          <input
                            type="checkbox"
                            checked={selectedDatasheets.has(datasheet.productId)}
                            onChange={() => onToggleDatasheet(datasheet.productId)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded print:hidden"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <div
                            className="font-medium text-gray-900 truncate max-w-xs"
                            title={datasheet.productName}
                          >
                            {datasheet.productName}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span className="text-gray-600 font-mono text-xs">
                            {datasheet.sku}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <DocumentIcon className="h-4 w-4 text-blue-500 flex-shrink-0" />
                            <span
                              className="text-blue-600 text-xs truncate max-w-xs"
                              title={datasheet.datasheetPath}
                            >
                              {datasheet.datasheetPath.split('/').pop() || 'Datasheet'}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPreviewDatasheet(datasheet.datasheetPath)}
                            className="print:hidden h-7 px-2 text-xs"
                          >
                            <EyeIcon className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-3 py-8 text-center text-gray-500">
                        <div className="flex flex-col items-center gap-2">
                          <MagnifyingGlassIcon className="h-8 w-8 text-gray-300" />
                          <p className="text-sm">No datasheets found matching "{searchTerm}"</p>
                          <button
                            onClick={() => setSearchTerm('')}
                            className="text-xs text-blue-600 hover:text-blue-800 underline"
                          >
                            Clear search
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Selection Summary */}
            {selectedDatasheets.size > 0 && (
              <motion.div
                className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-blue-800">
                    <DocumentIcon className="h-4 w-4" />
                    <span className="font-medium text-sm">
                      {selectedDatasheets.size} datasheet
                      {selectedDatasheets.size !== 1 ? 's' : ''} selected
                    </span>
                  </div>
                  <span className="text-xs text-blue-600">
                    Will be included in PDF print
                  </span>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
