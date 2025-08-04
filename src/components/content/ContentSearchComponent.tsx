/**
 * PosalPro MVP2 - Content Search Component
 * Extracted from page to prevent webpack chunk loading issues
 */

'use client';

import { Breadcrumbs } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

// Safe icon imports
const MagnifyingGlassIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
    />
  </svg>
);

const FunnelIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z"
    />
  </svg>
);

const DocumentArrowUpIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12-3-3m0 0-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
    />
  </svg>
);

const XCircleIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
    />
  </svg>
);

const DocumentTextIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5-3H12M8.25 9h2.25"
    />
  </svg>
);

const PhotoIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
    />
  </svg>
);

const EyeIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

const ClockIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
    />
  </svg>
);

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

interface ContentTrackingMetadata {
  query?: string;
  resultCount?: number;
  filters?: Partial<SearchFilters>;
  contentId?: string;
  contentName?: string;
  fileName?: string;
  fileSize?: number;
  error?: string;
  context?: unknown;
  [key: string]: unknown;
}

interface ErrorContext {
  operation?: string;
  query?: string;
  filters?: SearchFilters;
  fileName?: string;
  contentId?: string;
  [key: string]: unknown;
}

export default function ContentSearchComponent() {
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
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  // Mock content data (simplified)
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
      createdAt: '2025-01-05',
      modifiedAt: '2025-01-07',
      tags: ['healthcare', 'technology', 'compliance'],
      author: 'Sarah Johnson',
      category: 'Documents',
      downloadCount: 32,
    },
    {
      id: '3',
      name: 'Financial Dashboard Screenshot.png',
      type: 'image',
      description: 'Screenshot of the financial dashboard for client presentations',
      size: '856 KB',
      createdAt: '2025-01-12',
      modifiedAt: '2025-01-12',
      tags: ['dashboard', 'financial', 'screenshot'],
      author: 'Mike Chen',
      category: 'Images',
      downloadCount: 18,
    },
  ];

  const categories = ['Templates', 'Documents', 'Images', 'Data', 'Videos'];
  const contentTypes = ['document', 'image', 'data', 'template', 'video'];

  // Get content type icon
  const getContentIcon = (type: string) => {
    switch (type) {
      case 'document':
        return <DocumentTextIcon className="w-5 h-5 text-blue-500" />;
      case 'image':
        return <PhotoIcon className="w-5 h-5 text-green-500" />;
      case 'template':
        return <DocumentTextIcon className="w-5 h-5 text-purple-500" />;
      default:
        return <DocumentTextIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  // Search functionality
  const handleSearch = useCallback(async () => {
    // If no search query and no filters, show all content
    if (!searchQuery.trim() && selectedFilters.type.length === 0) {
      setSearchResults(allContent);
      return;
    }

    setIsSearching(true);

    try {
      // Track search analytics
      await analytics(
        'content_search_initiated',
        {
          query: searchQuery,
          filters: selectedFilters,
          timestamp: Date.now(),
        },
        'medium'
      );

      // Simulate search delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Filter content based on search query and filters
      let filtered = allContent;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
          item =>
            item.name.toLowerCase().includes(query) ||
            item.description.toLowerCase().includes(query) ||
            item.tags.some(tag => tag.toLowerCase().includes(query)) ||
            item.author.toLowerCase().includes(query)
        );
      }

      if (selectedFilters.type.length > 0) {
        filtered = filtered.filter(item => selectedFilters.type.includes(item.type));
      }

      if (selectedFilters.category.length > 0) {
        filtered = filtered.filter(item => selectedFilters.category.includes(item.category));
      }

      // Sort results
      filtered.sort((a, b) => {
        const { sortBy, sortOrder } = selectedFilters;
        let comparison = 0;

        switch (sortBy) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'date':
            comparison = new Date(a.modifiedAt).getTime() - new Date(b.modifiedAt).getTime();
            break;
          case 'downloads':
            comparison = a.downloadCount - b.downloadCount;
            break;
          default: // relevance
            comparison = (b.relevanceScore || 0) - (a.relevanceScore || 0);
        }

        return sortOrder === 'desc' ? -comparison : comparison;
      });

      setSearchResults(filtered);

      // Track successful search
      await analytics(
        'content_search_completed',
        {
          query: searchQuery,
          resultCount: filtered.length,
          filters: selectedFilters,
          timestamp: Date.now(),
        },
        'medium'
      );
    } catch (error) {
      console.error('[ContentSearch] Search failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Search failed: ${errorMessage}`);

      await analytics(
        'content_search_failed',
        {
          query: searchQuery,
          error: errorMessage,
          timestamp: Date.now(),
        },
        'high'
      );
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, selectedFilters, analytics, errorHandlingService]);

  // Handle file upload
  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      try {
        await analytics(
          'content_upload_initiated',
          {
            fileCount: files.length,
            timestamp: Date.now(),
          },
          'medium'
        );

        // Simulate upload process
        toast.success(`Successfully uploaded ${files.length} file(s)`);
        setIsUploadModalOpen(false);

        await analytics(
          'content_upload_completed',
          {
            fileCount: files.length,
            timestamp: Date.now(),
          },
          'medium'
        );
      } catch (error) {
        console.error('[ContentSearch] Upload failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        toast.error(`Upload failed: ${errorMessage}`);
      }
    },
    [analytics, errorHandlingService]
  );

  // Load all content on component mount
  useEffect(() => {
    setSearchResults(allContent);
  }, []);

  // Trigger search on query or filter changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [handleSearch]);

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Content', href: '/content' },
          { label: 'Search', href: '/content/search' },
        ]}
      />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Search</h1>
          <p className="text-gray-600 mt-1">Find and manage your proposal content and resources</p>
        </div>
        <Button
          onClick={() => setIsUploadModalOpen(true)}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <DocumentArrowUpIcon className="w-5 h-5 mr-2" />
          Upload Content
        </Button>
      </div>

      {/* Search Bar */}
      <Card className="p-6">
        <div className="flex space-x-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search content, templates, documents..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            className="px-4 py-3"
          >
            <FunnelIcon className="w-5 h-5 mr-2" />
            Filters
          </Button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
                <div className="space-y-2">
                  {contentTypes.map(type => (
                    <label key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedFilters.type.includes(type)}
                        onChange={e => {
                          const newTypes = e.target.checked
                            ? [...selectedFilters.type, type]
                            : selectedFilters.type.filter(t => t !== type);
                          setSelectedFilters(prev => ({ ...prev, type: newTypes }));
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm capitalize">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <div className="space-y-2">
                  {categories.map(category => (
                    <label key={category} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedFilters.category.includes(category)}
                        onChange={e => {
                          const newCategories = e.target.checked
                            ? [...selectedFilters.category, category]
                            : selectedFilters.category.filter(c => c !== category);
                          setSelectedFilters(prev => ({ ...prev, category: newCategories }));
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">{category}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  value={selectedFilters.sortBy}
                  onChange={e =>
                    setSelectedFilters(prev => ({
                      ...prev,
                      sortBy: e.target.value as SearchFilters['sortBy'],
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="relevance">Relevance</option>
                  <option value="name">Name</option>
                  <option value="date">Date Modified</option>
                  <option value="downloads">Downloads</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Search Results */}
      <div className="space-y-4">
        {isSearching ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Searching content...</p>
          </div>
        ) : searchResults.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-600">
              {searchQuery || selectedFilters.type.length > 0 || selectedFilters.category.length > 0
                ? 'No content found matching your search criteria.'
                : 'Enter a search query or apply filters to find content.'}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {searchResults.map(item => (
              <Card key={item.id} className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">{getContentIcon(item.type)}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">{item.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                    <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                      <span className="flex items-center">
                        <ClockIcon className="w-4 h-4 mr-1" />
                        {item.modifiedAt}
                      </span>
                      <span>{item.size}</span>
                      <span>{item.downloadCount} downloads</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-3">
                      {item.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-gray-600 hover:text-gray-800"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </Button>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                      Download
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
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
