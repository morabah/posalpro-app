'use client';

import { Button } from '@/components/ui/forms/Button';
import { DocumentTextIcon, ChevronDownIcon, ChevronUpIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';

interface ProposalSection {
  id: string;
  title: string;
  content?: string;
  order?: number;
  type?: string;
  isRequired?: boolean;
  required?: boolean;
  estimatedHours?: number;
  dueDate?: Date;
  assignedTo?: string;
  status?: 'not_started' | 'in_progress' | 'completed' | 'reviewed';
  description?: string;
  dependencies?: string[];
  priority?: 'high' | 'medium' | 'low';
}

interface CollapsibleSectionSelectorProps {
  sections: ProposalSection[];
  selectedSections: Set<string>;
  onToggleSection: (sectionId: string) => void;
  onSelectAllSections: () => void;
  onClearAllSections: () => void;
  className?: string;
}

export function CollapsibleSectionSelector({
  sections,
  selectedSections,
  onToggleSection,
  onSelectAllSections,
  onClearAllSections,
  className = '',
}: CollapsibleSectionSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter sections based on search term
  const filteredSections = useMemo(() => {
    if (!searchTerm.trim()) return sections;

    const term = searchTerm.toLowerCase();
    return sections.filter(section =>
      section.title.toLowerCase().includes(term) ||
      (section.content && section.content.toLowerCase().includes(term)) ||
      (section.description && section.description.toLowerCase().includes(term)) ||
      (section.assignedTo && section.assignedTo.toLowerCase().includes(term)) ||
      (section.status && section.status.toLowerCase().includes(term)) ||
      (section.priority && section.priority.toLowerCase().includes(term))
    );
  }, [sections, searchTerm]);

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  if (sections.length === 0) {
    return (
      <motion.div
        className={`rounded-xl border border-gray-200 bg-gray-50 p-8 mb-6 print:shadow-none shadow-sm ${className}`}
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.3 }}
      >
        <div className="text-center">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Step 5 Sections Available
          </h3>
          <p className="text-sm text-gray-600">
            No Step 5 section assignments have been created yet.
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Complete Step 5 in the proposal wizard to assign sections and organize your content.
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
            aria-label={isExpanded ? 'Collapse sections' : 'Expand sections'}
          >
            {isExpanded ? (
              <ChevronUpIcon className="h-5 w-5 text-gray-600" />
            ) : (
              <ChevronDownIcon className="h-5 w-5 text-gray-600" />
            )}
          </Button>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <DocumentTextIcon className="h-5 w-5 text-purple-600" />
              Step 5: Section Assignment
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({sections.length} sections)
              </span>
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {isExpanded
                ? 'Select proposal sections to include in the PDF print'
                : 'Click to expand and manage proposal sections'
              }
            </p>
          </div>
        </div>

        {selectedSections.size > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-purple-700 font-medium">
              {selectedSections.size} selected
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={onClearAllSections}
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
                  placeholder="Search sections by title, description, assignee, status, or priority..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
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
                  Showing {filteredSections.length} of {sections.length} sections
                </p>
              )}
            </div>

            {/* Section List */}
            <div className="space-y-3">
              {filteredSections.length > 0 ? (
                filteredSections
                  .sort((a, b) => (a.order || 0) - (b.order || 0))
                  .map((section, index) => (
                    <motion.div
                      key={section.id}
                      className={`border border-gray-200 rounded-lg p-4 transition-colors ${
                        selectedSections.has(section.id) ? 'bg-purple-50 border-purple-200' : 'hover:bg-gray-50'
                      }`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedSections.has(section.id)}
                          onChange={() => onToggleSection(section.id)}
                          className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded print:hidden"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-gray-500">#{section.order || section.id}</span>
                            <h4 className="font-semibold text-gray-900 truncate">
                              {section.title || 'Untitled Section'}
                            </h4>
                            {(section.isRequired || section.required) && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                                Required
                              </span>
                            )}
                            {section.priority && (
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                                section.priority === 'high' ? 'bg-red-100 text-red-800' :
                                section.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {section.priority.toUpperCase()}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {section.description || section.content || 'No description specified'}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            {section.estimatedHours && <span>Hours: {section.estimatedHours}</span>}
                            {section.assignedTo && <span>Assigned: {section.assignedTo}</span>}
                            {section.status && <span>Status: {section.status.replace('_', ' ')}</span>}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <MagnifyingGlassIcon className="h-8 w-8 text-gray-300" />
                    <p className="text-sm">No sections found matching "{searchTerm}"</p>
                    <button
                      onClick={() => setSearchTerm('')}
                      className="text-xs text-purple-600 hover:text-purple-800 underline"
                    >
                      Clear search
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Select All / Clear All Controls */}
            {filteredSections.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedSections.size === filteredSections.length && filteredSections.length > 0}
                      onChange={
                        selectedSections.size === filteredSections.length && filteredSections.length > 0
                          ? onClearAllSections
                          : onSelectAllSections
                      }
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded print:hidden"
                    />
                    <span className="text-sm text-gray-700">
                      {selectedSections.size === filteredSections.length && filteredSections.length > 0
                        ? 'Deselect all'
                        : 'Select all'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {filteredSections.length} sections available
                  </span>
                </div>
              </div>
            )}

            {/* Selection Summary */}
            {selectedSections.size > 0 && (
              <motion.div
                className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-purple-800">
                    <DocumentTextIcon className="h-4 w-4" />
                    <span className="font-medium text-sm">
                      {selectedSections.size} section
                      {selectedSections.size !== 1 ? 's' : ''} selected
                    </span>
                  </div>
                  <span className="text-xs text-purple-600">
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
