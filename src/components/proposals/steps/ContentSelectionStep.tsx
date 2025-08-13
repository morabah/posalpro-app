'use client';

/**
 * PosalPro MVP2 - Proposal Creation Step 3: Content Selection
 * Enhanced with direct data flow from content search pages, cross-step validation, and advanced analytics
 * Based on PROPOSAL_CREATION_SCREEN.md wireframe specifications
 * Supports component traceability and analytics integration for H5 hypothesis validation
 */

import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/forms/Button';
import { useApiClient } from '@/hooks/useApiClient';
import { useResponsive } from '@/hooks/useResponsive';
import { ContentItem, ProposalWizardStep3Data, SelectedContent } from '@/types/proposals';
import {
  CheckIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  SparklesIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Removed unused COMPONENT_MAPPING to satisfy unused-vars

// Enhanced content type enum aligned with content search system
enum ContentType {
  CASE_STUDY = 'Case Study',
  TECHNICAL_DOC = 'Technical Document',
  SOLUTION = 'Solution Brief',
  TEMPLATE = 'Template',
  REFERENCE = 'Reference Document',
  METHODOLOGY = 'Methodology',
  COMPLIANCE = 'Compliance Framework',
}

// Enhanced Content interface aligned with content search system
interface EnhancedContentItem extends ContentItem {
  createdBy: string;
  fileSize: string;
  documentUrl: string;
  usageCount: number;
  qualityScore: number;
  status: 'ACTIVE' | 'ARCHIVED' | 'DRAFT';
  isVisible: boolean;
  isFeatured: boolean;
  metadata?: {
    wordCount?: number;
    readingTime?: number;
    lastReviewed?: Date;
    version?: number;
  };
}

// Removed static ENHANCED_CONTENT_LIBRARY; content must be loaded from live API

// Enhanced proposal sections with descriptions
const ENHANCED_PROPOSAL_SECTIONS = [
  {
    value: 'Executive Summary',
    label: 'Executive Summary',
    description: 'High-level overview and key points',
  },
  {
    value: 'Technical Approach',
    label: 'Technical Approach',
    description: 'Detailed technical methodology',
  },
  {
    value: 'Security Compliance',
    label: 'Security Compliance',
    description: 'Security measures and compliance',
  },
  {
    value: 'Implementation Plan',
    label: 'Implementation Plan',
    description: 'Project timeline and milestones',
  },
  {
    value: 'Technology Comparison',
    label: 'Technology Comparison',
    description: 'Technical alternatives analysis',
  },
  {
    value: 'Compliance & Risk',
    label: 'Compliance & Risk',
    description: 'Risk assessment and mitigation',
  },
  {
    value: 'Timeline & Milestones',
    label: 'Timeline & Milestones',
    description: 'Project schedule and deliverables',
  },
  {
    value: 'Team & Resources',
    label: 'Team & Resources',
    description: 'Personnel and resource allocation',
  },
  {
    value: 'Pricing & Budget',
    label: 'Pricing & Budget',
    description: 'Cost breakdown and financial terms',
  },
  { value: 'Appendices', label: 'Appendices', description: 'Supporting documents and references' },
];

// Enhanced validation schema with cross-step validation
const enhancedContentSelectionSchema = z.object({
  selectedContent: z
    .array(
      z.object({
        itemId: z.string().min(1, 'Content item is required'),
        section: z.string().min(1, 'Section assignment is required'),
        customizations: z.array(z.string()).optional(),
        relevanceScore: z.number().min(0).max(100).optional(),
        qualityScore: z.number().min(0).max(10).optional(),
      })
    )
    .min(1, 'At least one content item must be selected'),
  totalContentItems: z.number().min(0),
  crossStepValidation: z
    .object({
      teamAlignment: z.boolean().default(true),
      productCompatibility: z.boolean().default(true),
      rfpCompliance: z.boolean().default(true),
      sectionCoverage: z.boolean().default(true),
    })
    .optional(),
  searchQuery: z.string().optional(),
});

type EnhancedContentSelectionFormData = z.infer<typeof enhancedContentSelectionSchema>;

interface ContentAnalytics {
  trackContentSelection?: (
    action: string,
    contentId: string,
    metadata?: Record<string, unknown>
  ) => void;
}

interface ProposalMetadata {
  projectType?: string;
}

interface TeamData {
  subjectMatterExperts?: Record<string, string>;
  teamMembers?: unknown[];
}

interface RfpRequirement {
  category?: string;
  text?: string;
  priority?: 'high' | 'medium' | 'low' | string;
}

interface RfpData {
  parsedContent?: { requirements?: RfpRequirement[] };
}

interface ProductDataItem {
  category?: string;
}

interface ProductData {
  products?: ProductDataItem[];
}

interface ContentSelectionStepProps {
  data: Partial<ProposalWizardStep3Data>;
  onUpdate: (data: Partial<ProposalWizardStep3Data>) => void;
  analytics: ContentAnalytics;
  // Cross-step data for validation
  proposalMetadata?: ProposalMetadata;
  teamData?: TeamData;
  rfpData?: RfpData;
  productData?: ProductData;
}

export function ContentSelectionStep({
  data,
  onUpdate,
  analytics,
  proposalMetadata,
  teamData,
  rfpData,
  productData,
}: ContentSelectionStepProps) {
  // ✅ MOBILE OPTIMIZATION: Add responsive detection
  const { isMobile } = useResponsive();
  const apiClient = useApiClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredContent, setFilteredContent] = useState<EnhancedContentItem[]>([]);
  const [selectedContentIds, setSelectedContentIds] = useState<Set<string>>(new Set());
  const [selectedContentMap, setSelectedContentMap] = useState<Map<string, SelectedContent>>(
    new Map()
  );
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [crossStepValidationResults, setCrossStepValidationResults] = useState<{
    errors: string[];
    warnings: string[];
    suggestions: string[];
  }>({ errors: [], warnings: [], suggestions: [] });
  const lastSentDataRef = useRef<string>('');
  const onUpdateRef = useRef(onUpdate);
  const debouncedUpdateRef = useRef<NodeJS.Timeout | undefined>(undefined);
  // Guard to ensure we hydrate selected content from props only once
  const hasHydratedSelectedContentRef = useRef<boolean>(false);

  // Keep onUpdate ref current
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  });

  const {
    register,
    setValue,
    formState: { errors, isValid },
    getValues,
  } = useForm<EnhancedContentSelectionFormData>({
    resolver: zodResolver(enhancedContentSelectionSchema),
    defaultValues: {
      selectedContent:
        data.selectedContent?.map(content => ({
          itemId: content.item.id,
          section: content.section,
          customizations: content.customizations || [],
          relevanceScore: content.item.relevanceScore,
          qualityScore: (content.item as EnhancedContentItem).qualityScore,
        })) || [],
      totalContentItems: data.selectedContent?.length || 0,
      searchQuery: '',
    },
    // ✅ CRITICAL FIX: Mobile-optimized validation mode
    mode: isMobile ? 'onBlur' : 'onChange',
    reValidateMode: 'onBlur',
    criteriaMode: 'firstError',
  });

  // ✅ PERFORMANCE OPTIMIZATION: Manual form data collection instead of watch()
  const collectFormData = useCallback((): ProposalWizardStep3Data => {
    return {
      selectedContent: Array.from(selectedContentMap.values()),
      searchHistory: data.searchHistory || [],
      crossStepValidation: {
        teamAlignment: crossStepValidationResults.errors.length === 0,
        productCompatibility: true, // Would be calculated based on product data
        rfpCompliance: true, // Would be calculated based on RFP data
        sectionCoverage: true, // Would be calculated based on section coverage
      },
    };
  }, [selectedContentMap, data.searchHistory, crossStepValidationResults]);

  // ✅ MOBILE OPTIMIZATION: Debounced updates with mobile-aware delays
  const debouncedUpdate = useCallback(() => {
    if (debouncedUpdateRef.current) {
      clearTimeout(debouncedUpdateRef.current);
    }

    const delay = isMobile ? 500 : 300; // Longer delay for mobile
    debouncedUpdateRef.current = setTimeout(() => {
      const formData = collectFormData();
      const dataHash = JSON.stringify(formData);

      if (dataHash !== lastSentDataRef.current) {
        lastSentDataRef.current = dataHash;
        onUpdateRef.current(formData);
      }
    }, delay);
  }, [isMobile, collectFormData]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debouncedUpdateRef.current) {
        clearTimeout(debouncedUpdateRef.current);
      }
    };
  }, []);

  // Initialize selected content from props (one-time hydration to avoid loops/overwrites)
  useEffect(() => {
    if (
      !hasHydratedSelectedContentRef.current &&
      data.selectedContent &&
      data.selectedContent.length > 0
    ) {
      const contentMap = new Map<string, SelectedContent>();
      const contentIds = new Set<string>();

      data.selectedContent.forEach(content => {
        contentMap.set(content.item.id, content);
        contentIds.add(content.item.id);
      });

      setSelectedContentMap(contentMap);
      setSelectedContentIds(contentIds);
      hasHydratedSelectedContentRef.current = true;
    }
  }, [data.selectedContent]);

  // Enhanced analytics tracking with cross-step context
  const trackContentSelection = useCallback(
    (action: string, contentId: string, metadata: Record<string, unknown> = {}) => {
      const enhancedMetadata: Record<string, unknown> = {
        ...metadata,
        stepContext: 'content_selection',
        proposalType: proposalMetadata?.projectType,
        teamSize: teamData?.teamMembers ? teamData.teamMembers.length : 0,
        productCount: productData?.products ? productData.products.length : 0,
        rfpRequirements: rfpData?.parsedContent?.requirements
          ? rfpData.parsedContent.requirements.length
          : 0,
        totalSelectedContent: selectedContentIds.size,
        sessionDuration: Date.now() - Date.now(), // Would be tracked properly
        crossStepValidationStatus:
          crossStepValidationResults.errors.length === 0 ? 'valid' : 'invalid',
      };

      analytics.trackContentSelection?.(action, contentId, enhancedMetadata);

      // ✅ PERFORMANCE: Removed frequent analytics logging to prevent console spam
    },
    [
      selectedContentIds,
      proposalMetadata,
      teamData,
      rfpData,
      productData,
      crossStepValidationResults,
      analytics,
    ]
  );

  // Cross-step validation logic
  const performCrossStepValidation = useCallback(() => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    const selectedContentArray: SelectedContent[] = Array.from(selectedContentMap.values());

    // Validate against RFP requirements
    const rfpRequirements: RfpRequirement[] = rfpData?.parsedContent?.requirements ?? [];
    if (rfpRequirements.length > 0) {
      const highPriorityRequirements = rfpRequirements.filter(req => req.priority === 'high');

      const contentTags = selectedContentArray.flatMap(content => content.item.tags);
      const uncoveredRequirements = highPriorityRequirements.filter(req => {
        return !contentTags.some(
          tag =>
            (req.text || '').toLowerCase().includes(tag.toLowerCase()) ||
            tag.toLowerCase().includes((req.category || '').toLowerCase())
        );
      });

      if (uncoveredRequirements.length > 0) {
        warnings.push(
          `${uncoveredRequirements.length} high-priority RFP requirements may not be adequately addressed by selected content`
        );
        suggestions.push(
          'Consider adding content that specifically addresses: ' +
            uncoveredRequirements
              .slice(0, 2)
              .map((req: RfpRequirement) => req.category || '')
              .join(', ')
        );
      }
    }

    // Validate against team expertise
    if (teamData?.subjectMatterExperts) {
      // subjectMatterExperts is an object where keys are expertise areas and values are expert IDs
      const teamExpertise: string[] = Object.keys(teamData.subjectMatterExperts);
      const contentAreas = selectedContentArray.map(content => content.item.tags).flat();

      const expertiseGaps = contentAreas.filter(
        area =>
          !teamExpertise.some(
            expertise =>
              expertise.toLowerCase().includes(area.toLowerCase()) ||
              area.toLowerCase().includes(expertise.toLowerCase())
          )
      );

      if (expertiseGaps.length > 0) {
        const uniqueGaps = [...new Set(expertiseGaps)];
        if (uniqueGaps.length > 2) {
          warnings.push(
            `Selected content covers areas where team expertise may be limited: ${uniqueGaps.slice(0, 3).join(', ')}`
          );
          suggestions.push(
            'Consider adding team members with expertise in the content areas or selecting alternative content'
          );
        }
      }
    }

    // Validate against selected products
    if (productData?.products) {
      const productCategories = productData.products.map((p: ProductDataItem) => p.category || '');
      const contentTags = selectedContentArray.flatMap(content => content.item.tags);

      const alignedContent = productCategories.some((category: string) =>
        contentTags.some(tag => tag.toLowerCase().includes(category.toLowerCase()))
      );

      if (!alignedContent && productData.products.length > 0) {
        warnings.push('Selected content may not align well with chosen products');
        suggestions.push(
          'Consider adding content that specifically showcases the selected product categories'
        );
      }
    }

    // Section coverage validation
    const requiredSections = ['Executive Summary', 'Technical Approach', 'Implementation Plan'];
    const coveredSections = [...new Set(selectedContentArray.map(content => content.section))];
    const missingSections = requiredSections.filter(section => !coveredSections.includes(section));

    if (missingSections.length > 0) {
      errors.push(`Missing content for required sections: ${missingSections.join(', ')}`);
    }

    // Quality score validation
    const averageQuality =
      selectedContentArray.reduce((sum, content) => {
        const item = content.item as EnhancedContentItem;
        return sum + (item.qualityScore || 0);
      }, 0) / (selectedContentArray.length || 1);

    if (averageQuality < 8.0 && selectedContentArray.length > 0) {
      warnings.push(
        `Average content quality score (${averageQuality.toFixed(1)}) is below recommended threshold (8.0)`
      );
      suggestions.push('Consider replacing lower-quality content with higher-rated alternatives');
    }

    // Usage and success rate validation
    const lowUsageContent = selectedContentArray.filter(content => {
      const item = content.item as EnhancedContentItem;
      return (item.usageCount || 0) < 5;
    });

    if (lowUsageContent.length > selectedContentArray.length * 0.5) {
      suggestions.push('Consider balancing with more proven content that has higher usage rates');
    }

    setCrossStepValidationResults({ errors, warnings, suggestions });

    // ✅ PERFORMANCE: Track validation results (throttled to prevent spam)
    if (errors.length > 0 || warnings.length > 2) {
      trackContentSelection('cross_step_validation', '', {
        errorsCount: errors.length,
        warningsCount: warnings.length,
        suggestionsCount: suggestions.length,
        validationPassed: errors.length === 0,
      });
    }

    return { errors, warnings, suggestions };
  }, [selectedContentMap, rfpData, teamData, productData, trackContentSelection]);

  // Stable update function to prevent infinite loops
  const handleUpdate = useCallback((formattedData: ProposalWizardStep3Data) => {
    const dataHash = JSON.stringify(formattedData);

    if (dataHash !== lastSentDataRef.current) {
      lastSentDataRef.current = dataHash;
      onUpdateRef.current(formattedData);
    }
  }, []);

  // Update parent component when form data changes with cross-step validation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const selectedContentArray: SelectedContent[] = Array.from(selectedContentMap.values());
      // Only log if content actually changed to reduce noise

      const validationResults = performCrossStepValidation();

      const formattedData: ProposalWizardStep3Data = {
        selectedContent: selectedContentArray,
        searchHistory: data.searchHistory || [],
        crossStepValidation: {
          teamAlignment: validationResults.errors.filter(e => e.includes('team')).length === 0,
          productCompatibility:
            validationResults.errors.filter(e => e.includes('product')).length === 0,
          rfpCompliance: validationResults.errors.filter(e => e.includes('RFP')).length === 0,
          sectionCoverage: validationResults.errors.filter(e => e.includes('section')).length === 0,
        },
      };

      handleUpdate(formattedData);
    }, 500); // Increased debounce time to reduce frequency

    return () => clearTimeout(timeoutId);
  }, [selectedContentMap, data.searchHistory, handleUpdate]); // Removed performCrossStepValidation from deps

  // Load content from live API and filter based on search query with quality scoring
  useEffect(() => {
    let isCancelled = false;
    const load = async () => {
      try {
        const params = new URLSearchParams();
        if (searchQuery.trim()) params.set('search', searchQuery.trim());
        // Request minimal fields; server enforces selective hydration
        // Use correct API route and support multiple response shapes
        interface MinimalContent {
          id: string;
          title: string;
          type?: string;
          tags?: string[];
          content?: string;
          updatedAt?: string;
          createdAt?: string;
          createdBy?: string;
          qualityScore?: number;
        }
        interface ContentListResponse {
          data?: { items?: MinimalContent[]; content?: MinimalContent[] };
          content?: MinimalContent[];
        }
        const res = await apiClient.get<ContentListResponse>(`/api/content?${params.toString()}`);
        if (isCancelled) return;
        const rawList: MinimalContent[] =
          res?.data?.items ?? res?.data?.content ?? res?.content ?? [];

        const items: EnhancedContentItem[] = rawList.map((c: MinimalContent) => ({
          id: c.id,
          title: c.title,
          // Map arbitrary API type strings to the constrained ContentItem union
          type:
            ((c.type as string | undefined)?.toLowerCase() as ContentItem['type']) || 'reference',
          relevanceScore: 0,
          section: 'Executive Summary',
          tags: c.tags ?? [],
          content: c.content ?? '',
          successRate: 0,
          lastUsed: new Date(c.updatedAt ?? c.createdAt ?? Date.now()),
          createdBy: c.createdBy ?? 'Unknown',
          fileSize: '',
          documentUrl: `/content/${c.id}`,
          usageCount: 0,
          qualityScore: c.qualityScore ?? 0,
          status: 'ACTIVE',
          isVisible: true,
          isFeatured: false,
          metadata: {},
        }));

        let filtered = items.filter(item => item.isVisible && item.status === 'ACTIVE');

        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter(
            item =>
              item.title.toLowerCase().includes(query) ||
              item.tags.some(tag => tag.toLowerCase().includes(query)) ||
              item.section.toLowerCase().includes(query) ||
              item.content.toLowerCase().includes(query) ||
              item.createdBy.toLowerCase().includes(query)
          );

          filtered = filtered.map(item => {
            let score = item.relevanceScore || 0;
            const q = query.toLowerCase();
            if (item.title.toLowerCase().includes(q)) score += 20;
            if (item.tags.some(tag => tag.toLowerCase().includes(q))) score += 15;
            if (item.content.toLowerCase().includes(q)) score += 10;
            score += (item.usageCount || 0) * 0.5;
            score += (item.qualityScore || 0) * 2;
            return { ...item, relevanceScore: Math.min(100, score) };
          });

          filtered.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
        } else {
          filtered.sort((a, b) => {
            if (a.isFeatured && !b.isFeatured) return -1;
            if (!a.isFeatured && b.isFeatured) return 1;
            return (
              (b.qualityScore || 0) +
              (b.usageCount || 0) * 0.1 -
              ((a.qualityScore || 0) + (a.usageCount || 0) * 0.1)
            );
          });
        }

        setFilteredContent(filtered);

        if (searchQuery.trim()) {
          trackContentSelection('search_performed', '', {
            query: searchQuery,
            resultsCount: filtered.length,
          });
        }
      } catch {
        // In case of failure, show empty list (no mock data)
        if (!isCancelled) setFilteredContent([]);
      }
    };
    load();
    return () => {
      isCancelled = true;
    };
  }, [apiClient, searchQuery, trackContentSelection]);

  // Enhanced AI recommendations based on cross-step data
  const generateAISuggestions = useCallback(async () => {
    setIsLoadingSuggestions(true);
    setShowAISuggestions(false);

    try {
      // Simulate AI processing with cross-step context
      await new Promise(resolve => setTimeout(resolve, 2000));

      const context = {
        projectType: proposalMetadata?.projectType,
        rfpRequirements: rfpData?.parsedContent?.requirements || [],
        teamExpertise: teamData?.subjectMatterExperts
          ? Object.keys(teamData.subjectMatterExperts)
          : [],
        productCategories:
          productData?.products?.map((product: ProductDataItem) => product.category || '') || [],
        currentSelections: Array.from(selectedContentIds),
      };

      // Generate recommendations based on context from live content list
      const recommendations = filteredContent
        .filter((item: EnhancedContentItem) => !selectedContentIds.has(item.id))
        .filter((item: EnhancedContentItem) => {
          if (context.rfpRequirements.length > 0) {
            return context.rfpRequirements.some((req: RfpRequirement) =>
              (item.tags as string[]).some(
                (tag: string) =>
                  tag.toLowerCase().includes((req.category || '').toLowerCase()) ||
                  (req.text || '').toLowerCase().includes(tag.toLowerCase())
              )
            );
          }
          return true;
        })
        .slice(0, 4);

      setShowAISuggestions(true);

      trackContentSelection('ai_suggestions_generated', '', {
        recommendationsCount: recommendations.length,
        context,
        processingTime: 2000,
      });
    } catch (error) {
      // Use standardized handler upstream; keep silent here
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [
    proposalMetadata,
    rfpData,
    teamData,
    productData,
    selectedContentIds,
    filteredContent,
    trackContentSelection,
  ]);

  // Add content item to selection
  const addContentItem = useCallback(
    (item: EnhancedContentItem) => {
      const newSelection: SelectedContent = {
        item,
        section: item.section,
        customizations: [],
      };

      setSelectedContentMap(prev => new Map(prev.set(item.id, newSelection)));
      setSelectedContentIds(prev => new Set(prev.add(item.id)));

      trackContentSelection('content_added', item.id, {
        section: item.section,
        relevanceScore: item.relevanceScore,
        qualityScore: item.qualityScore,
        usageCount: item.usageCount,
        isFeatured: item.isFeatured,
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
      {/* Cross-step Validation Results */}
      {(crossStepValidationResults.errors.length > 0 ||
        crossStepValidationResults.warnings.length > 0 ||
        crossStepValidationResults.suggestions.length > 0) && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center">
              <ExclamationTriangleIcon className="w-5 h-5 mr-2 text-yellow-500" />
              Cross-step Validation
            </h3>

            {crossStepValidationResults.errors.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-red-700 mb-2">Errors (Must Fix)</h4>
                <ul className="space-y-1">
                  {crossStepValidationResults.errors.map((error, index) => (
                    <li key={index} className="text-sm text-red-600 flex items-start">
                      <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {crossStepValidationResults.warnings.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-yellow-700 mb-2">
                  Warnings (Should Review)
                </h4>
                <ul className="space-y-1">
                  {crossStepValidationResults.warnings.map((warning, index) => (
                    <li key={index} className="text-sm text-yellow-600 flex items-start">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      {warning}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {crossStepValidationResults.suggestions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-blue-700 mb-2">Suggestions (Consider)</h4>
                <ul className="space-y-1">
                  {crossStepValidationResults.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-sm text-blue-600 flex items-start">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Enhanced Search and AI Suggestions */}
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
              AI: Suggest Content
            </Button>
          </div>

          <div className="relative mb-4">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search content by title, tags, or section..."
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* AI Suggestions */}
          {showAISuggestions && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-blue-700 mb-3">AI Recommendations</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredContent
                  .filter(item => !selectedContentIds.has(item.id))
                  .slice(0, 4)
                  .map(item => (
                    <div key={item.id} className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="font-medium text-blue-900 text-sm">{item.title}</h5>
                        {item.isFeatured && (
                          <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                            Featured
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-blue-600 mb-2">
                        <span>Quality: {item.qualityScore}/10</span>
                        <span>Used: {item.usageCount} times</span>
                        <span>Success: {item.successRate}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-blue-700">{item.section}</span>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => addContentItem(item)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <PlusIcon className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Enhanced Available Content */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-6 flex items-center">
            <DocumentTextIcon className="w-5 h-5 mr-2" />
            Available Content ({filteredContent.length} items)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContent.map(item => (
              <div
                key={item.id}
                className={`border rounded-lg p-4 transition-all ${
                  selectedContentIds.has(item.id)
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900 text-sm">{item.title}</h4>
                  {item.isFeatured && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      Featured
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-500 mb-2">
                  <span>Quality: {item.qualityScore}/10</span>
                  <span>Used: {item.usageCount}x</span>
                  <span>Success: {item.successRate}%</span>
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {item.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                      {tag}
                    </span>
                  ))}
                  {item.tags.length > 3 && (
                    <span className="px-2 py-1 text-xs text-gray-500">+{item.tags.length - 3}</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">{item.section}</span>
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
                </div>
              </div>
            ))}
          </div>

          {filteredContent.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <DocumentTextIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No content found matching your criteria.</p>
              <p className="text-sm">Try adjusting your search or use AI suggestions.</p>
            </div>
          )}
        </div>
      </Card>

      {/* Enhanced Selected Content */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-neutral-900">
              Selected Content ({selectedContentArray.length})
            </h3>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">
                {selectedContentArray.length > 0
                  ? Math.round(
                      (selectedContentArray.reduce((sum, content) => {
                        const item = content.item as EnhancedContentItem;
                        return sum + (item.qualityScore || 0);
                      }, 0) /
                        selectedContentArray.length) *
                        10
                    ) / 10
                  : 0}
              </div>
              <div className="text-sm text-gray-600">Avg Quality Score</div>
            </div>
          </div>

          {selectedContentArray.length > 0 ? (
            <>
              <div className="space-y-4">
                {selectedContentArray.map(content => (
                  <div key={content.item.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{content.item.title}</h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          <span>
                            Quality: {(content.item as EnhancedContentItem).qualityScore}/10
                          </span>
                          <span>
                            Used: {(content.item as EnhancedContentItem).usageCount} times
                          </span>
                          <span>Success: {content.item.successRate}%</span>
                        </div>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => removeContentItem(content.item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Assign to Section
                        </label>
                        <Select
                          value={content.section}
                          options={ENHANCED_PROPOSAL_SECTIONS.map(section => ({
                            value: section.value,
                            label: section.label,
                          }))}
                          onChange={(value: string) => updateContentSection(content.item.id, value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                        <div className="flex flex-wrap gap-1">
                          {content.item.tags.slice(0, 4).map(tag => (
                            <span
                              key={tag}
                              className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                          {content.item.tags.length > 4 && (
                            <span className="px-2 py-1 text-xs text-gray-500">
                              +{content.item.tags.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Enhanced Summary */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {selectedContentArray.length}
                    </div>
                    <div className="text-sm text-gray-600">Content Items</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round(
                        (selectedContentArray.reduce((sum, content) => {
                          const item = content.item as EnhancedContentItem;
                          return sum + (item.qualityScore || 0);
                        }, 0) /
                          selectedContentArray.length) *
                          10
                      ) / 10 || 0}
                    </div>
                    <div className="text-sm text-gray-600">Avg Quality</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {Math.round(
                        selectedContentArray.reduce(
                          (sum, content) => sum + (content.item.successRate || 0),
                          0
                        ) / selectedContentArray.length
                      ) || 0}
                      %
                    </div>
                    <div className="text-sm text-gray-600">Avg Success Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {[...new Set(selectedContentArray.map(content => content.section))].length}
                    </div>
                    <div className="text-sm text-gray-600">Sections Covered</div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <DocumentTextIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No content selected yet.</p>
              <p className="text-sm">Add content from the library above to get started.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
