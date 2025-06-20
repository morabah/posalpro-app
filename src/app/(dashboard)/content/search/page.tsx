/**
 * PosalPro MVP2 - Content Search Page
 * Advanced content search and management with AI-powered capabilities
 * Implementation based on CONTENT_SEARCH_SCREEN.md wireframe specifications
 */

'use client';

import { Breadcrumbs } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { useAnalytics } from '@/hooks/useAnalytics';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { StandardError } from '@/lib/errors/StandardError';
import {
  AdjustmentsHorizontalIcon,
  ChartBarIcon,
  ClockIcon,
  DocumentArrowUpIcon,
  DocumentTextIcon,
  EyeIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PhotoIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-5.1', 'US-5.2', 'US-1.2'],
  acceptanceCriteria: ['AC-5.1.1', 'AC-5.2.1', 'AC-1.2.1', 'AC-1.2.2'],
  methods: [
    'searchContent()',
    'filterContent()',
    'uploadContent()',
    'tagContent()',
    'trackSearchAnalytics()',
    'generateRecommendations()',
  ],
  hypotheses: ['H1', 'H8', 'H9'],
  testCases: ['TC-H1-002', 'TC-H8-001', 'TC-H9-001'],
};

interface ContentItem {
  id: string;
  name: string;
  type: 'document' | 'image' | 'data' | 'template' | 'video';
  description: string;
  size: string;
  createdAt: string;
  modifiedAt: string;
  tags: string[];
  author: string;
  category: string;
  downloadCount: number;
  relevanceScore?: number;
}

interface SearchFilters {
  type: string[];
  category: string[];
  tags: string[];
  dateRange: 'all' | 'today' | 'week' | 'month' | 'year';
  sortBy: 'relevance' | 'name' | 'date' | 'downloads';
  sortOrder: 'asc' | 'desc';
}

export default function ContentSearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ContentItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<SearchFilters>({
    type: [],
    category: [],
    tags: [],
    dateRange: 'all',
    sortBy: 'relevance',
    sortOrder: 'desc',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [sessionStartTime] = useState(Date.now());

  // Standardized error handling
  const errorHandlingService = ErrorHandlingService.getInstance();
  const analytics = useAnalytics();

  // Mock content data
  const allContent: ContentItem[] = [
    {
      id: '1',
      name: 'Enterprise Security Template.docx',
      type: 'document',
      description: 'Comprehensive security proposal template for enterprise clients',
      size: '2.4 MB',
      createdAt: '2025-01-08',
      modifiedAt: '2025-01-10',
      tags: ['security', 'enterprise', 'template'],
      author: 'John Smith',
      category: 'Templates',
      downloadCount: 47,
    },
    {
      id: '2',
      name: 'Healthcare Solutions Overview.pdf',
      type: 'document',
      description: 'Overview of healthcare technology solutions and compliance requirements',
      size: '1.8 MB',
      createdAt: '2025-01-07',
      modifiedAt: '2025-01-09',
      tags: ['healthcare', 'solutions', 'compliance'],
      author: 'Sarah Johnson',
      category: 'Industry',
      downloadCount: 23,
    },
    {
      id: '3',
      name: 'Product Pricing Matrix.xlsx',
      type: 'data',
      description: 'Comprehensive pricing matrix for all product categories',
      size: '890 KB',
      createdAt: '2025-01-05',
      modifiedAt: '2025-01-09',
      tags: ['pricing', 'matrix', 'products'],
      author: 'Michael Chen',
      category: 'Pricing',
      downloadCount: 156,
    },
    {
      id: '4',
      name: 'Company Logo Assets.zip',
      type: 'image',
      description: 'Complete brand asset package including logos, colors, and fonts',
      size: '15.2 MB',
      createdAt: '2025-01-03',
      modifiedAt: '2025-01-08',
      tags: ['branding', 'logo', 'assets'],
      author: 'Design Team',
      category: 'Brand',
      downloadCount: 89,
    },
    {
      id: '5',
      name: 'Financial Services Proposal Template.docx',
      type: 'template',
      description: 'Template for financial services sector proposals',
      size: '1.6 MB',
      createdAt: '2025-01-02',
      modifiedAt: '2025-01-07',
      tags: ['financial', 'services', 'template'],
      author: 'Emily Davis',
      category: 'Templates',
      downloadCount: 34,
    },
    {
      id: '6',
      name: 'Product Demo Video.mp4',
      type: 'video',
      description: 'Complete product demonstration for client presentations',
      size: '125 MB',
      createdAt: '2024-12-28',
      modifiedAt: '2025-01-05',
      tags: ['demo', 'video', 'presentation'],
      author: 'Marketing Team',
      category: 'Media',
      downloadCount: 67,
    },
  ];

  const contentTypes = ['document', 'image', 'data', 'template', 'video'];
  const categories = ['Templates', 'Industry', 'Pricing', 'Brand', 'Media'];
  const allTags = Array.from(new Set(allContent.flatMap(item => item.tags)));

  const trackAction = useCallback(
    (action: string, metadata: any = {}) => {
      analytics.track('content_search_action', {
        action,
        metadata: {
          ...metadata,
          component: 'ContentSearchPage',
          userStory: 'US-5.1',
          hypothesis: 'H1',
          sessionDuration: Date.now() - sessionStartTime,
        },
        timestamp: Date.now(),
      });
    },
    [sessionStartTime, analytics]
  );

  // Enhanced error handling
  const handleError = useCallback(
    (error: unknown, operation: string, context?: any) => {
      const standardError =
        error instanceof Error
          ? new StandardError({
              code: ErrorCodes.VALIDATION.OPERATION_FAILED,
              message: `Content ${operation} failed: ${error.message}`,
              cause: error,
              metadata: { operation, context, component: 'ContentSearchPage' },
            })
          : new StandardError({
              code: ErrorCodes.VALIDATION.OPERATION_FAILED,
              message: `Content ${operation} failed: Unknown error`,
              metadata: { operation, context, component: 'ContentSearchPage' },
            });

      errorHandlingService.processError(standardError);
      const userMessage = errorHandlingService.getUserFriendlyMessage(standardError);
      toast.error(userMessage);
      trackAction(`${operation}_error`, { error: standardError.message, context });
    },
    [errorHandlingService, trackAction]
  );

  // Search functionality
  const performSearch = useCallback(
    async (query: string = searchQuery) => {
      try {
        setIsSearching(true);
        trackAction('search_started', { query, filters: selectedFilters });

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        let results = allContent;

        // Apply text search
        if (query.trim()) {
          results = results.filter(
            item =>
              item.name.toLowerCase().includes(query.toLowerCase()) ||
              item.description.toLowerCase().includes(query.toLowerCase()) ||
              item.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase())) ||
              item.author.toLowerCase().includes(query.toLowerCase())
          );
        }

        // Apply filters
        if (selectedFilters.type.length > 0) {
          results = results.filter(item => selectedFilters.type.includes(item.type));
        }
        if (selectedFilters.category.length > 0) {
          results = results.filter(item => selectedFilters.category.includes(item.category));
        }
        if (selectedFilters.tags.length > 0) {
          results = results.filter(item =>
            selectedFilters.tags.some(tag => item.tags.includes(tag))
          );
        }

        // Apply date range filter
        if (selectedFilters.dateRange !== 'all') {
          const now = new Date();
          const cutoffDate = new Date();
          switch (selectedFilters.dateRange) {
            case 'today':
              cutoffDate.setDate(now.getDate() - 1);
              break;
            case 'week':
              cutoffDate.setDate(now.getDate() - 7);
              break;
            case 'month':
              cutoffDate.setMonth(now.getMonth() - 1);
              break;
            case 'year':
              cutoffDate.setFullYear(now.getFullYear() - 1);
              break;
          }
          results = results.filter(item => new Date(item.modifiedAt) >= cutoffDate);
        }

        // Apply sorting
        results.sort((a, b) => {
          let comparison = 0;
          switch (selectedFilters.sortBy) {
            case 'relevance':
              // Mock relevance scoring
              comparison =
                b.downloadCount * 0.7 +
                b.tags.length * 0.3 -
                (a.downloadCount * 0.7 + a.tags.length * 0.3);
              break;
            case 'name':
              comparison = a.name.localeCompare(b.name);
              break;
            case 'date':
              comparison = new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime();
              break;
            case 'downloads':
              comparison = b.downloadCount - a.downloadCount;
              break;
          }
          return selectedFilters.sortOrder === 'asc' ? -comparison : comparison;
        });

        setSearchResults(results);
        trackAction('search_completed', {
          query,
          resultCount: results.length,
          filters: selectedFilters,
        });
      } catch (error) {
        handleError(error, 'search', { query, filters: selectedFilters });
      } finally {
        setIsSearching(false);
      }
    },
    [searchQuery, selectedFilters, trackAction, handleError]
  );

  // Filter management
  const handleFilterChange = useCallback((filterType: keyof SearchFilters, value: any) => {
    setSelectedFilters(prev => {
      const newFilters = { ...prev };

      if (filterType === 'type' || filterType === 'category' || filterType === 'tags') {
        // Handle array filters
        const array = newFilters[filterType] as string[];
        if (array.includes(value)) {
          (newFilters[filterType] as string[]) = array.filter(item => item !== value);
        } else {
          (newFilters[filterType] as string[]) = [...array, value];
        }
      } else {
        // Handle non-array filters (dateRange, sortBy, sortOrder)
        (newFilters as any)[filterType] = value;
      }

      return newFilters;
    });
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setSelectedFilters({
      type: [],
      category: [],
      tags: [],
      dateRange: 'all',
      sortBy: 'relevance',
      sortOrder: 'desc',
    });
    trackAction('filters_cleared');
  }, [trackAction]);

  // Content actions
  const handleViewContent = useCallback(
    (content: ContentItem) => {
      toast.success(`Opening ${content.name}`);
      trackAction('content_viewed', { contentId: content.id, contentName: content.name });
    },
    [trackAction]
  );

  const handleDownloadContent = useCallback(
    (content: ContentItem) => {
      toast.success(`Downloading ${content.name}`);
      trackAction('content_downloaded', { contentId: content.id, contentName: content.name });
    },
    [trackAction]
  );

  // File upload
  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files) return;

      try {
        Array.from(files).forEach(file => {
          toast.success(`Uploaded ${file.name} successfully`);
          trackAction('content_uploaded', { fileName: file.name, fileSize: file.size });
        });
        setIsUploadModalOpen(false);
      } catch (error) {
        handleError(error, 'upload');
      }
    },
    [trackAction, handleError]
  );

  // Get content type icon
  const getContentIcon = (type: string) => {
    switch (type) {
      case 'document':
      case 'template':
        return DocumentTextIcon;
      case 'image':
        return PhotoIcon;
      case 'data':
        return ChartBarIcon;
      case 'video':
        return PhotoIcon;
      default:
        return DocumentTextIcon;
    }
  };

  // Initial search on load
  useEffect(() => {
    performSearch('');
  }, []);

  // Auto-search when filters change
  useEffect(() => {
    if (searchResults.length > 0 || searchQuery) {
      performSearch();
    }
  }, [selectedFilters]);

  const activeFilterCount =
    selectedFilters.type.length +
    selectedFilters.category.length +
    selectedFilters.tags.length +
    (selectedFilters.dateRange !== 'all' ? 1 : 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Breadcrumbs className="mb-4" />
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Content Search</h1>
            <p className="text-gray-600 mt-1">
              Find and manage content for your proposals with advanced search and filtering
            </p>
          </div>
          <Button
            onClick={() => setIsUploadModalOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white flex items-center min-h-[44px]"
            aria-label="Upload content"
          >
            <DocumentArrowUpIcon className="w-5 h-5 mr-2" />
            Upload Content
          </Button>
        </div>

        {/* Search Bar */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search content by name, description, tags, or author..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && performSearch()}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              aria-label="Search content"
            />
          </div>
          <Button
            onClick={() => performSearch()}
            disabled={isSearching}
            className="bg-blue-600 hover:bg-blue-700 text-white min-h-[44px] px-6"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </Button>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            className="min-h-[44px] flex items-center"
            aria-label="Toggle filters"
          >
            <FunnelIcon className="w-5 h-5 mr-2" />
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        {showFilters && (
          <div className="lg:col-span-1">
            <Card>
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Filters</h3>
                  {activeFilterCount > 0 && (
                    <Button onClick={clearFilters} size="sm" variant="outline">
                      Clear All
                    </Button>
                  )}
                </div>

                {/* Content Type Filter */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Content Type</h4>
                  <div className="space-y-2">
                    {contentTypes.map(type => (
                      <label key={type} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedFilters.type.includes(type)}
                          onChange={() => handleFilterChange('type', type)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-600 capitalize">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Category Filter */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Category</h4>
                  <div className="space-y-2">
                    {categories.map(category => (
                      <label key={category} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedFilters.category.includes(category)}
                          onChange={() => handleFilterChange('category', category)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-600">{category}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Date Range Filter */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Date Range</h4>
                  <select
                    value={selectedFilters.dateRange}
                    onChange={e => handleFilterChange('dateRange', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">Past Week</option>
                    <option value="month">Past Month</option>
                    <option value="year">Past Year</option>
                  </select>
                </div>

                {/* Sort Options */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Sort By</h4>
                  <select
                    value={selectedFilters.sortBy}
                    onChange={e => handleFilterChange('sortBy', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="name">Name</option>
                    <option value="date">Date Modified</option>
                    <option value="downloads">Downloads</option>
                  </select>
                  <select
                    value={selectedFilters.sortOrder}
                    onChange={e => handleFilterChange('sortOrder', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                  </select>
                </div>

                {/* Popular Tags */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Popular Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {allTags.slice(0, 10).map(tag => (
                      <button
                        key={tag}
                        onClick={() => handleFilterChange('tags', tag)}
                        className={`px-2 py-1 text-xs rounded-full border ${
                          selectedFilters.tags.includes(tag)
                            ? 'bg-blue-100 text-blue-800 border-blue-200'
                            : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                        }`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Search Results */}
        <div className={showFilters ? 'lg:col-span-3' : 'lg:col-span-4'}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              Search Results ({searchResults.length} items)
            </h3>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                size="sm"
                className="lg:hidden"
              >
                <AdjustmentsHorizontalIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {isSearching ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Searching content...</span>
            </div>
          ) : searchResults.length === 0 ? (
            <Card>
              <div className="p-12 text-center">
                <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">No results found</h3>
                <p className="mt-2 text-gray-600">
                  Try adjusting your search terms or filters to find what you're looking for.
                </p>
                <Button onClick={clearFilters} className="mt-4" variant="outline">
                  Clear Filters
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {searchResults.map(content => {
                const IconComponent = getContentIcon(content.type);
                return (
                  <Card key={content.id} className="hover:shadow-md transition-shadow">
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <IconComponent className="w-8 h-8 text-gray-400 mt-1" />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-lg font-medium text-gray-900 mb-1">
                              {content.name}
                            </h4>
                            <p className="text-gray-600 mb-2 line-clamp-2">{content.description}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                              <span>By {content.author}</span>
                              <span>•</span>
                              <span>{content.size}</span>
                              <span>•</span>
                              <span className="flex items-center">
                                <ClockIcon className="w-4 h-4 mr-1" />
                                {content.modifiedAt}
                              </span>
                              <span>•</span>
                              <span>{content.downloadCount} downloads</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                                {content.category}
                              </span>
                              {content.tags.map(tag => (
                                <span
                                  key={tag}
                                  className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            onClick={() => handleViewContent(content)}
                            size="sm"
                            variant="outline"
                            className="flex items-center"
                          >
                            <EyeIcon className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button
                            onClick={() => handleDownloadContent(content)}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            Download
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Upload Content</h3>
                <button
                  onClick={() => setIsUploadModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Close modal"
                >
                  <XCircleIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Files
                  </label>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Supported formats: PDF, DOC, XLS, PNG, JPG, MP4, ZIP
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select category...</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., template, healthcare, proposal"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Brief description of the content..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  onClick={() => setIsUploadModalOpen(false)}
                  variant="outline"
                  className="min-h-[44px]"
                >
                  Cancel
                </Button>
                <Button className="bg-green-600 hover:bg-green-700 text-white min-h-[44px]">
                  Upload Files
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
