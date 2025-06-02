'use client';

/**
 * PosalPro MVP2 - Proposal Creation Step 3: Content Selection
 * Based on PROPOSAL_CREATION_SCREEN.md wireframe specifications
 * Supports component traceability and analytics integration for H5 hypothesis validation
 */

import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/forms/Button';
import { ContentItem, ProposalWizardStep3Data, SelectedContent } from '@/types/proposals';
import {
  CheckIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  SparklesIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-3.1', 'US-3.2'],
  acceptanceCriteria: ['AC-3.1.1', 'AC-3.1.2', 'AC-3.2.1'],
  methods: ['suggestContent()', 'filterByRelevance()', 'assignToSection()'],
  hypotheses: ['H5'],
  testCases: ['TC-H5-001', 'TC-H5-002'],
};

// Mock content library (would come from API in production)
const MOCK_CONTENT_LIBRARY: ContentItem[] = [
  {
    id: '1',
    title: 'Cloud Migration Case Study - Retail',
    type: 'case_study',
    relevanceScore: 95,
    section: 'Technical Approach',
    tags: ['cloud', 'migration', 'retail', 'aws'],
    content: 'Comprehensive case study of retail cloud migration...',
    successRate: 82,
    lastUsed: new Date('2024-01-15'),
  },
  {
    id: '2',
    title: 'AWS Security Best Practices',
    type: 'methodology',
    relevanceScore: 87,
    section: 'Security Compliance',
    tags: ['aws', 'security', 'compliance', 'best-practices'],
    content: 'Detailed security framework and best practices...',
    successRate: 78,
    lastUsed: new Date('2024-02-10'),
  },
  {
    id: '3',
    title: 'Technical Approach Template',
    type: 'template',
    relevanceScore: 82,
    section: 'Technical Approach',
    tags: ['template', 'technical', 'approach', 'methodology'],
    content: 'Standard template for technical approach sections...',
    successRate: 75,
    lastUsed: new Date('2024-01-28'),
  },
  {
    id: '4',
    title: 'Azure vs AWS Comparison',
    type: 'reference',
    relevanceScore: 76,
    section: 'Technology Comparison',
    tags: ['azure', 'aws', 'comparison', 'analysis'],
    content: 'Comprehensive comparison of cloud platforms...',
    successRate: 70,
    lastUsed: new Date('2024-01-05'),
  },
  {
    id: '5',
    title: 'Compliance Framework Template',
    type: 'compliance',
    relevanceScore: 71,
    section: 'Compliance & Risk',
    tags: ['compliance', 'framework', 'risk', 'governance'],
    content: 'Standard compliance framework documentation...',
    successRate: 85,
    lastUsed: new Date('2024-02-20'),
  },
  {
    id: '6',
    title: 'Data Migration Methodology',
    type: 'methodology',
    relevanceScore: 68,
    section: 'Implementation Plan',
    tags: ['data', 'migration', 'methodology', 'planning'],
    content: 'Step-by-step data migration approach...',
    successRate: 73,
    lastUsed: new Date('2024-01-18'),
  },
];

const PROPOSAL_SECTIONS = [
  'Executive Summary',
  'Technical Approach',
  'Security Compliance',
  'Implementation Plan',
  'Technology Comparison',
  'Compliance & Risk',
  'Timeline & Milestones',
  'Team & Resources',
  'Pricing & Budget',
  'Appendices',
];

// Validation schema for content selection step
const contentSelectionSchema = z.object({
  selectedContent: z
    .array(
      z.object({
        itemId: z.string().min(1, 'Content item is required'),
        section: z.string().min(1, 'Section assignment is required'),
        customizations: z.array(z.string()).optional(),
      })
    )
    .min(1, 'At least one content item must be selected'),
  searchQuery: z.string().optional(),
});

type ContentSelectionFormData = z.infer<typeof contentSelectionSchema>;

interface ContentSelectionStepProps {
  data: Partial<ProposalWizardStep3Data>;
  onUpdate: (data: Partial<ProposalWizardStep3Data>) => void;
  analytics: any;
}

export function ContentSelectionStep({ data, onUpdate, analytics }: ContentSelectionStepProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredContent, setFilteredContent] = useState<ContentItem[]>(MOCK_CONTENT_LIBRARY);
  const [selectedContentIds, setSelectedContentIds] = useState<Set<string>>(new Set());
  const [selectedContentMap, setSelectedContentMap] = useState<Map<string, SelectedContent>>(
    new Map()
  );
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const lastSentDataRef = useRef<string>('');
  const onUpdateRef = useRef(onUpdate);

  // Keep onUpdate ref current
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  });

  const {
    register,
    watch,
    setValue,
    formState: { errors, isValid },
    getValues,
  } = useForm<ContentSelectionFormData>({
    resolver: zodResolver(contentSelectionSchema),
    defaultValues: {
      selectedContent:
        data.selectedContent?.map(content => ({
          itemId: content.item.id,
          section: content.section,
          customizations: content.customizations || [],
        })) || [],
      searchQuery: '',
    },
    mode: 'onChange',
  });

  const watchedValues = watch();

  // Initialize selected content from props
  useEffect(() => {
    if (data.selectedContent) {
      const contentMap = new Map<string, SelectedContent>();
      const contentIds = new Set<string>();

      data.selectedContent.forEach(content => {
        contentMap.set(content.item.id, content);
        contentIds.add(content.item.id);
      });

      setSelectedContentMap(contentMap);
      setSelectedContentIds(contentIds);
    }
  }, [data.selectedContent]);

  // Stable update function to prevent infinite loops
  const handleUpdate = useCallback((formattedData: ProposalWizardStep3Data) => {
    const dataHash = JSON.stringify(formattedData);

    if (dataHash !== lastSentDataRef.current) {
      lastSentDataRef.current = dataHash;
      onUpdateRef.current(formattedData);
    }
  }, []);

  // Create stable reference for watched values
  const stableWatchedValues = useMemo(() => {
    return {
      selectedContent: watchedValues.selectedContent || [],
      searchQuery: watchedValues.searchQuery || '',
    };
  }, [watchedValues.selectedContent, watchedValues.searchQuery]);

  // Update parent component when form data changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const selectedContentArray: SelectedContent[] = Array.from(selectedContentMap.values());

      const formattedData: ProposalWizardStep3Data = {
        selectedContent: selectedContentArray,
        searchHistory: data.searchHistory || [],
      };

      handleUpdate(formattedData);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [selectedContentMap, data.searchHistory, handleUpdate]);

  // Filter content based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredContent(MOCK_CONTENT_LIBRARY);
      return;
    }

    const filtered = MOCK_CONTENT_LIBRARY.filter(
      item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.section.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setFilteredContent(filtered);
  }, [searchQuery]);

  // Track analytics for content selection
  const trackContentSelection = useCallback(
    (action: string, contentId: string, metadata: any = {}) => {
      analytics.trackWizardStep(3, 'Content Selection', action, {
        contentId,
        totalSelected: selectedContentIds.size,
        searchQuery,
        ...metadata,
      });
    },
    [analytics, selectedContentIds.size, searchQuery]
  );

  // Generate AI content suggestions
  const generateAISuggestions = useCallback(async () => {
    setIsLoadingSuggestions(true);
    setShowAISuggestions(true);
    analytics.trackWizardStep(3, 'Content Selection', 'ai_suggestions_requested');

    // Simulate AI suggestion generation
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Sort by relevance score for AI suggestions
    const suggestions = [...MOCK_CONTENT_LIBRARY]
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 4);

    setFilteredContent(suggestions);
    setIsLoadingSuggestions(false);

    analytics.trackWizardStep(3, 'Content Selection', 'ai_suggestions_generated', {
      suggestionsCount: suggestions.length,
      topRelevanceScore: suggestions[0]?.relevanceScore || 0,
    });
  }, [analytics]);

  // Add content item to selection
  const addContentItem = useCallback(
    (item: ContentItem) => {
      const newSelection: SelectedContent = {
        item,
        section: item.section,
        customizations: [],
      };

      setSelectedContentMap(prev => new Map(prev.set(item.id, newSelection)));
      setSelectedContentIds(prev => new Set(prev.add(item.id)));

      trackContentSelection('content_added', item.id, {
        relevanceScore: item.relevanceScore,
        contentType: item.type,
        section: item.section,
      });
    },
    [trackContentSelection]
  );

  // Remove content item from selection
  const removeContentItem = useCallback(
    (itemId: string) => {
      setSelectedContentMap(prev => {
        const newMap = new Map(prev);
        newMap.delete(itemId);
        return newMap;
      });
      setSelectedContentIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });

      trackContentSelection('content_removed', itemId);
    },
    [trackContentSelection]
  );

  // Update section assignment for selected content
  const updateContentSection = useCallback(
    (itemId: string, newSection: string) => {
      setSelectedContentMap(prev => {
        const newMap = new Map(prev);
        const content = newMap.get(itemId);
        if (content) {
          newMap.set(itemId, { ...content, section: newSection });
        }
        return newMap;
      });

      trackContentSelection('section_updated', itemId, { newSection });
    },
    [trackContentSelection]
  );

  // Handle search
  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      setShowAISuggestions(false);

      if (query.trim()) {
        trackContentSelection('search_performed', '', { query });
      }
    },
    [trackContentSelection]
  );

  const selectedContentArray = Array.from(selectedContentMap.values());

  return (
    <div className="space-y-8">
      {/* Search and AI Suggestions */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-neutral-900 flex items-center">
              <DocumentTextIcon className="w-5 h-5 mr-2" />
              Content Discovery
            </h3>
            <Button
              variant="secondary"
              onClick={generateAISuggestions}
              disabled={isLoadingSuggestions}
              loading={isLoadingSuggestions}
              className="flex items-center"
            >
              <SparklesIcon className="w-4 h-4 mr-2" />
              AI: Suggest Similar Content
            </Button>
          </div>

          <div className="relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search for more content..."
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </Card>

      {/* Suggested Content */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-6">
            {showAISuggestions ? 'AI Suggested Content' : 'Available Content'}
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Content Item</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Relevance</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Add</th>
                </tr>
              </thead>
              <tbody>
                {filteredContent.map(item => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{item.title}</p>
                        <p className="text-sm text-gray-600 capitalize">
                          {item.type.replace('_', ' ')} • {item.section}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.tags.slice(0, 3).map(tag => (
                            <span
                              key={tag}
                              className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${item.relevanceScore}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {item.relevanceScore}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {selectedContentIds.has(item.id) ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled
                          className="flex items-center text-green-600"
                        >
                          <CheckIcon className="w-4 h-4 mr-1" />
                          Added
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => addContentItem(item)}
                          className="flex items-center"
                        >
                          <PlusIcon className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredContent.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <DocumentTextIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No content found matching your search criteria.</p>
              <p className="text-sm">Try different keywords or use AI suggestions.</p>
            </div>
          )}
        </div>
      </Card>

      {/* Selected Content */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-6">
            Selected Content ({selectedContentArray.length} items)
          </h3>

          {selectedContentArray.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Content</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Section</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Remove</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedContentArray.map(content => (
                    <tr key={content.item.id} className="border-b border-gray-100">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{content.item.title}</p>
                          <p className="text-sm text-gray-600 capitalize">
                            {content.item.type.replace('_', ' ')} • {content.item.relevanceScore}%
                            relevance
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Select
                          value={content.section}
                          options={PROPOSAL_SECTIONS.map(section => ({
                            value: section,
                            label: section,
                          }))}
                          onChange={(value: string) => updateContentSection(content.item.id, value)}
                          className="min-w-[200px]"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => removeContentItem(content.item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <DocumentTextIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No content selected yet.</p>
              <p className="text-sm">
                Add content from the suggestions above or search for specific items.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Progress Indicator */}
      <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <div
            className={`w-3 h-3 rounded-full ${
              selectedContentArray.length > 0 ? 'bg-success-600' : 'bg-neutral-300'
            }`}
          />
          <span className="text-sm text-neutral-600">
            Step 3 of 6: {selectedContentArray.length > 0 ? 'Complete' : 'In Progress'}
          </span>
        </div>
        <div className="text-sm text-neutral-600">
          {selectedContentArray.length} content items selected
        </div>
      </div>
    </div>
  );
}
