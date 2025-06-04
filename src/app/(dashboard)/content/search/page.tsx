/**
 * PosalPro MVP2 - Content Search Interface
 * Based on CONTENT_SEARCH_SCREEN.md wireframe specifications
 * Supports component traceability and analytics integration for H1 hypothesis validation
 */

'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import {
  ClockIcon,
  DocumentTextIcon,
  EyeIcon,
  LightBulbIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  PlusIcon,
  SparklesIcon,
  TagIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useCallback, useEffect, useMemo, useState } from 'react';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-1.1', 'US-1.2', 'US-1.3'],
  acceptanceCriteria: [
    'AC-1.1.1',
    'AC-1.1.2',
    'AC-1.1.3',
    'AC-1.1.4',
    'AC-1.2.1',
    'AC-1.2.2',
    'AC-1.2.3',
    'AC-1.2.4',
    'AC-1.3.1',
    'AC-1.3.2',
    'AC-1.3.3',
    'AC-1.3.4',
  ],
  methods: [
    'semanticSearch()',
    'rankingAlgorithm()',
    'trackSearchTime()',
    'contextDisplay()',
    'aiCategories()',
    'relatedSuggestions()',
    'saveAction()',
    'aiTags()',
  ],
  hypotheses: ['H1'],
  testCases: ['TC-H1-001', 'TC-H1-002', 'TC-H1-003'],
};

// Content interfaces
enum ContentType {
  CASE_STUDY = 'Case Study',
  TECHNICAL_DOC = 'Technical Document',
  SOLUTION = 'Solution Brief',
  TEMPLATE = 'Template',
  REFERENCE = 'Reference Document',
}

interface ContentItem {
  id: string;
  title: string;
  type: ContentType;
  description: string;
  content: string;
  tags: string[];
  createdAt: Date;
  lastModified: Date;
  usageCount: number;
  qualityScore: number;
  relevanceScore?: number;
  createdBy: string;
  fileSize: string;
  documentUrl: string;
}

interface ContentSearchMetrics {
  searchQuery: string;
  timeToFirstResult: number;
  timeToSelection: number;
  searchAccuracy: number;
  userSatisfactionScore: number;
  categoriesUsed: string[];
  filtersApplied: number;
  relatedContentClicks: number;
  browsingSessionDuration: number;
  contentSaved: boolean;
  tagsAccepted: number;
  tagsModified: number;
  qualityRating: number;
}

// Mock content data
const MOCK_CONTENT: ContentItem[] = [
  {
    id: 'content-001',
    title: 'Cloud Migration Case Study',
    type: ContentType.CASE_STUDY,
    description: 'Enterprise cloud migration strategy and implementation for Fortune 500 company',
    content:
      "This comprehensive case study details the successful migration of a Fortune 500 company's entire IT infrastructure to AWS cloud services. The project involved migrating 200+ servers, 50TB of data, and 100+ applications with zero downtime...",
    tags: ['Cloud', 'Migration', 'AWS', 'Enterprise'],
    createdAt: new Date('2024-05-10'),
    lastModified: new Date('2024-06-15'),
    usageCount: 7,
    qualityScore: 9.2,
    createdBy: 'Sarah Johnson',
    fileSize: '2.3 MB',
    documentUrl: '/docs/cloud-migration-case-study.pdf',
  },
  {
    id: 'content-002',
    title: 'Security Compliance Documentation',
    type: ContentType.TECHNICAL_DOC,
    description: 'Comprehensive security compliance framework for enterprise environments',
    content:
      'This technical documentation provides a complete framework for implementing enterprise-grade security compliance measures. Covers GDPR, SOC 2, ISO 27001, and HIPAA requirements with implementation checklists and audit procedures...',
    tags: ['Security', 'Compliance', 'GDPR', 'SOC2', 'ISO27001'],
    createdAt: new Date('2024-04-22'),
    lastModified: new Date('2024-05-30'),
    usageCount: 12,
    qualityScore: 9.5,
    createdBy: 'Alex Chen',
    fileSize: '4.1 MB',
    documentUrl: '/docs/security-compliance-framework.pdf',
  },
  {
    id: 'content-003',
    title: 'AI Analytics Solution Brief',
    type: ContentType.SOLUTION,
    description:
      'Advanced AI-powered analytics platform for business intelligence and predictive insights',
    content:
      'Our AI Analytics Platform revolutionizes business intelligence by combining machine learning, real-time data processing, and predictive analytics. Features include automated report generation, anomaly detection, and custom dashboards...',
    tags: ['AI', 'Analytics', 'Machine Learning', 'Business Intelligence'],
    createdAt: new Date('2024-06-01'),
    lastModified: new Date('2024-06-20'),
    usageCount: 5,
    qualityScore: 8.8,
    createdBy: 'Mohamed Rabah',
    fileSize: '1.8 MB',
    documentUrl: '/docs/ai-analytics-solution-brief.pdf',
  },
  {
    id: 'content-004',
    title: 'Data Migration Methodology',
    type: ContentType.TEMPLATE,
    description: 'Step-by-step template for large-scale data migration projects',
    content:
      'This comprehensive template provides a structured approach to data migration projects. Includes planning checklists, risk assessment frameworks, validation procedures, and rollback strategies for enterprise-scale migrations...',
    tags: ['Data Migration', 'Template', 'Enterprise', 'Methodology'],
    createdAt: new Date('2024-03-15'),
    lastModified: new Date('2024-04-10'),
    usageCount: 15,
    qualityScore: 9.0,
    createdBy: 'Lisa Wang',
    fileSize: '3.2 MB',
    documentUrl: '/templates/data-migration-methodology.docx',
  },
  {
    id: 'content-005',
    title: 'Network Security Best Practices',
    type: ContentType.REFERENCE,
    description: 'Comprehensive reference guide for network security implementation',
    content:
      'This reference document covers industry best practices for network security including firewall configuration, intrusion detection systems, VPN setup, and security monitoring. Updated with latest NIST guidelines...',
    tags: ['Network Security', 'Firewall', 'VPN', 'NIST'],
    createdAt: new Date('2024-02-20'),
    lastModified: new Date('2024-05-05'),
    usageCount: 20,
    qualityScore: 9.3,
    createdBy: 'John Smith',
    fileSize: '2.7 MB',
    documentUrl: '/docs/network-security-best-practices.pdf',
  },
];

export default function ContentSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<ContentType[]>(Object.values(ContentType));
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [searchResults, setSearchResults] = useState<ContentItem[]>(MOCK_CONTENT);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionStartTime] = useState(Date.now());
  const [searchStartTime, setSearchStartTime] = useState<number | null>(null);

  // Analytics tracking
  const trackContentAction = useCallback(
    (action: string, metadata: any = {}) => {
      console.log('Content Search Analytics:', {
        action,
        metadata,
        timestamp: Date.now(),
        sessionDuration: Date.now() - sessionStartTime,
      });
    },
    [sessionStartTime]
  );

  // Search performance metrics
  const searchMetrics = useMemo((): Partial<ContentSearchMetrics> => {
    return {
      timeToFirstResult: 1.2, // Mock: 1.2 seconds to first result
      timeToSelection: 3.8, // Mock: 3.8 seconds to selection (45% improvement baseline: 7s)
      searchAccuracy: 92.5, // Mock: 92.5% search accuracy
      userSatisfactionScore: 6.2, // Mock: 6.2/7 satisfaction score
      filtersApplied:
        activeTags.length + (selectedTypes.length < Object.values(ContentType).length ? 1 : 0),
      browsingSessionDuration: (Date.now() - sessionStartTime) / 1000 / 60, // Minutes
    };
  }, [activeTags.length, selectedTypes.length, sessionStartTime]);

  // AI tag suggestions
  const suggestedTags = useMemo(() => {
    const allTags = MOCK_CONTENT.flatMap(item => item.tags);
    const tagCounts = allTags.reduce(
      (acc, tag) => {
        acc[tag] = (acc[tag] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([tag]) => tag)
      .filter(tag => !activeTags.includes(tag));
  }, [activeTags]);

  // Search and filter logic
  useEffect(() => {
    setIsLoading(true);
    const searchStarted = Date.now();
    setSearchStartTime(searchStarted);

    const timer = setTimeout(() => {
      let filtered = MOCK_CONTENT;

      // Filter by content types
      filtered = filtered.filter(item => selectedTypes.includes(item.type));

      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
          item =>
            item.title.toLowerCase().includes(query) ||
            item.description.toLowerCase().includes(query) ||
            item.content.toLowerCase().includes(query) ||
            item.tags.some(tag => tag.toLowerCase().includes(query))
        );

        // Add relevance scoring for search results
        filtered = filtered.map(item => {
          let score = 0;
          const q = query.toLowerCase();

          // Title match gets highest score
          if (item.title.toLowerCase().includes(q)) score += 40;
          // Description match gets medium score
          if (item.description.toLowerCase().includes(q)) score += 25;
          // Tag match gets good score
          if (item.tags.some(tag => tag.toLowerCase().includes(q))) score += 20;
          // Content match gets lower score
          if (item.content.toLowerCase().includes(q)) score += 10;
          // Usage and quality boost
          score += item.usageCount * 2;
          score += item.qualityScore;

          return { ...item, relevanceScore: Math.min(100, score) };
        });

        // Sort by relevance
        filtered.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
      } else {
        // Sort by usage and quality when no search query
        filtered.sort((a, b) => b.usageCount + b.qualityScore - (a.usageCount + a.qualityScore));
      }

      // Filter by tags
      if (activeTags.length > 0) {
        filtered = filtered.filter(item => activeTags.every(tag => item.tags.includes(tag)));
      }

      // Filter by date range
      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        filtered = filtered.filter(item => item.createdAt >= fromDate);
      }
      if (dateTo) {
        const toDate = new Date(dateTo);
        filtered = filtered.filter(item => item.createdAt <= toDate);
      }

      setSearchResults(filtered);
      setIsLoading(false);

      // Track search performance
      if (searchQuery.trim()) {
        const searchTime = Date.now() - searchStarted;
        trackContentAction('search_performed', {
          query: searchQuery,
          resultsCount: filtered.length,
          searchTime: searchTime / 1000,
          filtersApplied: searchMetrics.filtersApplied,
        });
      }
    }, 300); // Debounce search

    return () => clearTimeout(timer);
  }, [
    searchQuery,
    selectedTypes,
    activeTags,
    dateFrom,
    dateTo,
    searchMetrics.filtersApplied,
    trackContentAction,
  ]);

  // Handle content type toggle
  const toggleContentType = useCallback((type: ContentType) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  }, []);

  // Handle tag management
  const addTag = useCallback(
    (tag: string) => {
      if (tag.trim() && !activeTags.includes(tag.trim())) {
        setActiveTags(prev => [...prev, tag.trim()]);
        setNewTag('');
        trackContentAction('tag_added', { tag: tag.trim() });
      }
    },
    [activeTags, trackContentAction]
  );

  const removeTag = useCallback(
    (tag: string) => {
      setActiveTags(prev => prev.filter(t => t !== tag));
      trackContentAction('tag_removed', { tag });
    },
    [trackContentAction]
  );

  // Handle content selection
  const selectContent = useCallback(
    (content: ContentItem) => {
      setSelectedContent(content);
      const selectionTime = searchStartTime ? Date.now() - searchStartTime : 0;
      trackContentAction('content_selected', {
        contentId: content.id,
        contentTitle: content.title,
        contentType: content.type,
        selectionTime: selectionTime / 1000,
        relevanceScore: content.relevanceScore,
      });
    },
    [searchStartTime, trackContentAction]
  );

  // Handle content actions
  const handleContentAction = useCallback(
    (action: string, content: ContentItem) => {
      trackContentAction(`content_${action}`, {
        contentId: content.id,
        contentTitle: content.title,
        contentType: content.type,
      });

      switch (action) {
        case 'view':
          window.open(content.documentUrl, '_blank');
          break;
        case 'use':
          console.log('Use content in proposal:', content.id);
          break;
        case 'save':
          console.log('Save content:', content.id);
          break;
        default:
          console.log(`${action} content:`, content.id);
      }
    },
    [trackContentAction]
  );

  // Format quality score display
  const formatQualityScore = (score: number) => {
    if (score >= 9) return { label: 'Excellent', color: 'text-green-600', bg: 'bg-green-100' };
    if (score >= 8) return { label: 'Good', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (score >= 7) return { label: 'Fair', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { label: 'Poor', color: 'text-red-600', bg: 'bg-red-100' };
  };

  // Format relevance score
  const formatRelevanceScore = (score?: number) => {
    if (!score) return null;
    if (score >= 80) return { label: `${score}% match`, color: 'text-green-600' };
    if (score >= 60) return { label: `${score}% match`, color: 'text-yellow-600' };
    return { label: `${score}% match`, color: 'text-red-600' };
  };

  // Track page load
  useEffect(() => {
    trackContentAction('content_search_loaded', {
      totalContent: MOCK_CONTENT.length,
      loadTime: Date.now() - sessionStartTime,
    });
  }, [sessionStartTime, trackContentAction]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Content Search</h1>
              <p className="text-gray-600">
                {searchResults.length} results •{' '}
                {(((7 - (searchMetrics.timeToSelection || 7)) / 7) * 100).toFixed(0)}% faster search
              </p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <ClockIcon className="w-4 h-4" />
              <span>Avg search: {searchMetrics.timeToFirstResult}s</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Search & Filters Panel */}
          <div className="lg:col-span-1">
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Search & Filters</h2>

                {/* Search Bar */}
                <div className="mb-6">
                  <div className="relative">
                    <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search for technical content..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Content Type Filters */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Content Type:</h3>
                  <div className="space-y-2">
                    {Object.values(ContentType).map(type => (
                      <label key={type} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedTypes.includes(type)}
                          onChange={() => toggleContentType(type)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Tags:</h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {activeTags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          <XMarkIcon className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex">
                    <input
                      type="text"
                      placeholder="Add tag..."
                      value={newTag}
                      onChange={e => setNewTag(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag(newTag);
                        }
                      }}
                      className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded-l-md focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={() => addTag(newTag)}
                      className="px-3 py-1 bg-blue-600 text-white rounded-r-md hover:bg-blue-700"
                    >
                      <PlusIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* AI Suggested Tags */}
                {suggestedTags.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                      <SparklesIcon className="w-4 h-4 inline mr-1" />
                      AI Suggested Tags:
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {suggestedTags.slice(0, 6).map(tag => (
                        <button
                          key={tag}
                          onClick={() => addTag(tag)}
                          className="px-2 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Date Range */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Date Range:</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">From:</label>
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={e => setDateFrom(e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">To:</label>
                      <input
                        type="date"
                        value={dateTo}
                        onChange={e => setDateTo(e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* AI Assistance */}
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">AI Assistance:</h3>
                  <div className="space-y-2">
                    <button className="w-full text-left px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100">
                      <LightBulbIcon className="w-4 h-4 inline mr-2" />
                      Similar Content
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100">
                      <SparklesIcon className="w-4 h-4 inline mr-2" />
                      Refine Search
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm bg-green-50 text-green-700 rounded-md hover:bg-green-100">
                      <TagIcon className="w-4 h-4 inline mr-2" />
                      Suggest Tags
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Results & Preview Panel */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Results List */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-900">
                    Results ({searchResults.length})
                  </h2>
                  {isLoading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  )}
                </div>

                {searchResults.length === 0 ? (
                  <Card>
                    <div className="p-6 text-center">
                      <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                      <p className="text-gray-600 mb-4">No content matches your search criteria.</p>
                      <div className="text-left max-w-xs mx-auto">
                        <p className="text-sm text-gray-600 mb-2">Suggestions:</p>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Try different keywords</li>
                          <li>• Remove some filters</li>
                          <li>• Check your spelling</li>
                        </ul>
                      </div>
                      <Button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white">
                        <SparklesIcon className="w-4 h-4 mr-2" />
                        AI Content Suggestion
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {searchResults.map(content => {
                      const qualityDisplay = formatQualityScore(content.qualityScore);
                      const relevanceDisplay = formatRelevanceScore(content.relevanceScore);
                      const isSelected = selectedContent?.id === content.id;

                      return (
                        <Card
                          key={content.id}
                          className={`cursor-pointer transition-all ${
                            isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'
                          }`}
                          onClick={() => selectContent(content)}
                        >
                          <div className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-medium text-gray-900 text-sm">{content.title}</h3>
                              {relevanceDisplay && (
                                <span className={`text-xs font-medium ${relevanceDisplay.color}`}>
                                  {relevanceDisplay.label}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-4 text-xs text-gray-500 mb-2">
                              <span>Type: {content.type}</span>
                              <span>Used: {content.usageCount} times</span>
                            </div>
                            <div className="flex flex-wrap gap-1 mb-2">
                              {content.tags.slice(0, 3).map(tag => (
                                <span
                                  key={tag}
                                  className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                              {content.tags.length > 3 && (
                                <span className="px-2 py-1 text-xs text-gray-500">
                                  +{content.tags.length - 3} more
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">
                                Created: {content.createdAt.toLocaleDateString()}
                              </span>
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${qualityDisplay.bg} ${qualityDisplay.color}`}
                              >
                                {qualityDisplay.label}
                              </span>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Preview Panel */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Preview</h2>
                <Card className="h-96">
                  {selectedContent ? (
                    <div className="p-6 h-full flex flex-col">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2">
                          {selectedContent.title}
                        </h3>
                        <div className="text-sm text-gray-600 mb-3">
                          <p>Type: {selectedContent.type}</p>
                          <p>Created: {selectedContent.createdAt.toLocaleDateString()}</p>
                          <p>File Size: {selectedContent.fileSize}</p>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-4">
                          {selectedContent.tags.map(tag => (
                            <span
                              key={tag}
                              className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="text-sm text-gray-700 overflow-y-auto max-h-32">
                          {selectedContent.description}
                        </div>
                      </div>
                      <div className="border-t pt-4 mt-4">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleContentAction('view', selectedContent)}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <EyeIcon className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleContentAction('use', selectedContent)}
                            className="flex-1"
                          >
                            <PencilIcon className="w-4 h-4 mr-1" />
                            Use
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 h-full flex items-center justify-center text-center">
                      <div>
                        <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">
                          Select an item from the results list to preview it here.
                        </p>
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
