'use client';

import { Button } from '@/components/ui/forms/Button';
import { DocumentIcon, EyeIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import * as React from 'react';

export interface DatasheetItem {
  productId: string;
  productName: string;
  sku: string;
  datasheetPath: string;
}

interface DatasheetSelectorProps {
  datasheets: DatasheetItem[];
  selectedDatasheets: Set<string>;
  onToggleDatasheet: (productId: string) => void;
  onPreviewDatasheet?: (datasheetPath: string) => void;
  onSelectAll?: () => void;
  onClearAll?: () => void;
  className?: string;
  showPreviewButton?: boolean;
  compact?: boolean;
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export const DatasheetSelector = React.memo(function DatasheetSelector({
  datasheets,
  selectedDatasheets,
  onToggleDatasheet,
  onPreviewDatasheet,
  onSelectAll,
  onClearAll,
  className = '',
  showPreviewButton = true,
  compact = false,
}: DatasheetSelectorProps) {
  const handleSelectAll = () => {
    if (selectedDatasheets.size === datasheets.length) {
      onClearAll?.();
    } else {
      onSelectAll?.();
    }
  };

  if (datasheets.length === 0) {
    return (
      <motion.div
        className={`rounded-xl border border-gray-200 bg-gray-50 p-8 print:shadow-none shadow-sm ${className}`}
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.3 }}
      >
        <div className="text-center">
          <DocumentIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Datasheets Available</h3>
          <p className="text-gray-600">No products with datasheet URLs found in this proposal.</p>
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
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <DocumentIcon className="h-5 w-5 text-blue-600" />
            Product Datasheets
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({datasheets.length} available)
            </span>
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Select datasheets to include in the PDF print
          </p>
        </div>
        {selectedDatasheets.size > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-blue-700 font-medium">{selectedDatasheets.size} selected</span>
            {onClearAll && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClearAll}
                className="print:hidden h-7 px-2 text-xs"
              >
                Clear All
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100 print:bg-white">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-700 w-8">
                <input
                  type="checkbox"
                  checked={selectedDatasheets.size === datasheets.length && datasheets.length > 0}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded print:hidden"
                />
              </th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Product</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">SKU</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Datasheet</th>
              {showPreviewButton && (
                <th className="px-3 py-2 text-center font-medium text-gray-700 w-20">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {datasheets.map((datasheet, index) => (
              <tr
                key={datasheet.productId}
                className={`hover:bg-gray-50 transition-colors ${
                  selectedDatasheets.has(datasheet.productId) ? 'bg-blue-50' : ''
                }`}
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
                  <span className="text-gray-600 font-mono text-xs">{datasheet.sku}</span>
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
                {showPreviewButton && (
                  <td className="px-3 py-3 text-center">
                    {onPreviewDatasheet && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPreviewDatasheet(datasheet.datasheetPath)}
                        className="print:hidden h-7 px-2 text-xs"
                      >
                        <EyeIcon className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      {selectedDatasheets.size > 0 && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-800">
              <DocumentIcon className="h-4 w-4" />
              <span className="font-medium text-sm">
                {selectedDatasheets.size} datasheet{selectedDatasheets.size !== 1 ? 's' : ''}{' '}
                selected
              </span>
            </div>
            <span className="text-xs text-blue-600">Will be included in PDF print</span>
          </div>
        </div>
      )}
    </motion.div>
  );
});

// Export the types for external use
export type { DatasheetSelectorProps };
