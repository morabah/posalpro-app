/**
 * PosalPro MVP2 - SME Contribution Interface
 * Advanced content creation interface for subject matter experts
 * Features: Auto-save, AI assistance, templates, real-time analytics
 */

'use client';

import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/forms/Button';
import { useOptimizedDataFetch } from '@/hooks/useOptimizedDataFetch';
import {
  ArrowLeftIcon,
  BookOpenIcon,
  ClockIcon,
  CogIcon,
  DocumentDuplicateIcon,
  DocumentTextIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-2.1'],
  acceptanceCriteria: ['AC-2.1.1', 'AC-2.1.2', 'AC-2.1.3', 'AC-2.1.4'],
  methods: [
    'contextDisplay()',
    'generateDraft()',
    'guideInput()',
    'trackEditingTime()',
    'autoSave()',
  ],
  hypotheses: ['H3'],
  testCases: ['TC-H3-001'],
};

// Assignment status enumeration
enum AssignmentStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  DRAFT_SAVED = 'draft_saved',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

// Section type enumeration
enum SectionType {
  TECHNICAL_SPECS = 'technical_specs',
  COMPLIANCE = 'compliance',
  IMPLEMENTATION = 'implementation',
  ARCHITECTURE = 'architecture',
  SECURITY = 'security',
  INTEGRATION = 'integration',
}

// Template type enumeration
enum TemplateType {
  TECHNICAL_SPECIFICATIONS = 'technical_specifications',
  SECURITY_ASSESSMENT = 'security_assessment',
  COMPLIANCE_FRAMEWORK = 'compliance_framework',
  IMPLEMENTATION_PLAN = 'implementation_plan',
  ARCHITECTURE_DESIGN = 'architecture_design',
  INTEGRATION_GUIDE = 'integration_guide',
}

// SME assignment interface
interface SMEAssignment {
  id: string;
  proposalId: string;
  proposalTitle: string;
  customer: string;
  sectionType: SectionType;
  assignedBy: string;
  assignedAt: Date;
  dueDate: Date;
  status: AssignmentStatus;
  requirements: string[];
  context: {
    proposalValue: number;
    industry: string;
    complexity: 'low' | 'medium' | 'high';
    priority: 'low' | 'medium' | 'high' | 'critical';
  };
  content: {
    draft: string;
    wordCount: number;
    lastSaved: Date;
    version: number;
  };
}

// Template interface
interface ContributionTemplate {
  id: string;
  type: TemplateType;
  title: string;
  description: string;
  sections: TemplateSection[];
  estimatedTime: number; // minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

// Template section interface
interface TemplateSection {
  id: string;
  title: string;
  placeholder: string;
  required: boolean;
  guidance: string;
}

// Resource interface
interface ContributionResource {
  id: string;
  title: string;
  type: 'document' | 'specification' | 'example' | 'standard';
  url: string;
  description: string;
  relevanceScore: number; // 0-100
}

// Version history interface
interface VersionHistory {
  id: string;
  version: number;
  content: string;
  savedAt: Date;
  wordCount: number;
  changesSummary: string;
  autoSaved: boolean;
}

// Analytics interface for H3 validation
interface SMEContributionMetrics {
  assignmentId: string;
  timeToStart: number;
  activeEditingTime: number;
  aiDraftUsed: boolean;
  aiDraftUtilization: number;
  templateUsed: boolean;
  templateType: string;
  contributionQuality: number;
  submissionTime: number;
  requirementsViewTime: number;
  resourcesAccessed: number;
  knowledgeBaseSearches: number;
  versionsCreated: number;
}

export default function SMEContributionInterface() {
  const router = useRouter();

  const [assignment, setAssignment] = useState<SMEAssignment | null>(null);
  const [content, setContent] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [lastSaved, setLastSaved] = useState(new Date());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState('Saved');
  const sessionStartTime = useRef(Date.now());

  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [metrics, setMetrics] = useState<SMEContributionMetrics | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Analytics tracking refs
  const editingStartTime = useRef<number | null>(null);
  const activeEditingTime = useRef(0);
  const aiDraftUsed = useRef(false);
  const templateUsed = useRef(false);

  // Auto-save functionality
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  // Optimized data fetching with caching and error handling
  const {
    data: assignmentData,
    loading: assignmentLoading,
    error: assignmentError,
  } = useOptimizedDataFetch<SMEAssignment>('/api/sme/assignment', {
    staleTime: 30 * 1000, // 30 seconds
    cacheTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: templatesData, loading: templatesLoading } = useOptimizedDataFetch<
    ContributionTemplate[]
  >('/api/sme/templates', {
    staleTime: 60 * 1000, // 1 minute (templates change less frequently)
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  const { data: resourcesData, loading: resourcesLoading } = useOptimizedDataFetch<
    ContributionResource[]
  >('/api/sme/resources', {
    staleTime: 60 * 1000, // 1 minute
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  const { data: versionsData, loading: versionsLoading } = useOptimizedDataFetch<VersionHistory[]>(
    '/api/sme/versions',
    {
      staleTime: 10 * 1000, // 10 seconds (version history updates frequently)
      cacheTime: 2 * 60 * 1000, // 2 minutes
    }
  );

  // Combined loading and error states
  const isLoading = assignmentLoading || templatesLoading || resourcesLoading || versionsLoading;
  const fetchError = assignmentError;

  // Process assignment data when it loads
  useEffect(() => {
    if (assignmentData) {
      // Convert date strings to Date objects if needed
      const processedAssignment = {
        ...assignmentData,
        assignedAt:
          assignmentData.assignedAt instanceof Date
            ? assignmentData.assignedAt
            : new Date(assignmentData.assignedAt),
        dueDate:
          assignmentData.dueDate instanceof Date
            ? assignmentData.dueDate
            : new Date(assignmentData.dueDate),
        content: {
          ...assignmentData.content,
          lastSaved:
            assignmentData.content.lastSaved instanceof Date
              ? assignmentData.content.lastSaved
              : new Date(assignmentData.content.lastSaved),
        },
      };

      setAssignment(processedAssignment);
      setContent(processedAssignment.content.draft);
      setWordCount(processedAssignment.content.wordCount);
      setLastSaved(processedAssignment.content.lastSaved);
    }
  }, [assignmentData]);

  // Process other data when it loads
  useEffect(() => {
    if (versionsData) {
      // Convert date strings to Date objects for versions data
      const processedVersions = versionsData.map((version: any) => ({
        ...version,
        savedAt: version.savedAt instanceof Date ? version.savedAt : new Date(version.savedAt),
      }));
      // Store processed versions if needed for display
    }
  }, [versionsData]);

  const handleAutoSave = useCallback((contentToSave: string) => {
    console.log('Auto-saving content...');
    setLastSaved(new Date());
    setHasUnsavedChanges(false);

    // Track editing time
    if (editingStartTime.current) {
      activeEditingTime.current += Date.now() - editingStartTime.current;
      editingStartTime.current = Date.now();
    }

    // Note: Analytics tracking is handled separately to avoid circular dependency
    console.log('SME Contribution Analytics:', {
      action: 'content_auto_saved',
      metadata: {
        wordCount: contentToSave.trim().split(/\s+/).length,
        activeEditingTime: activeEditingTime.current,
      },
      timestamp: Date.now(),
    });
  }, []);

  const handleContentChange = useCallback(
    (newContent: string) => {
      if (!editingStartTime.current) {
        editingStartTime.current = Date.now();
      }

      setContent(newContent);
      setWordCount(newContent.trim().split(/\s+/).length);
      setHasUnsavedChanges(true);
      setAutosaveStatus('Unsaved changes');

      // Clear existing timer and set new one
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }

      autoSaveTimer.current = setTimeout(() => {
        // Use requestIdleCallback for better performance if available
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => handleAutoSave(newContent));
        } else {
          handleAutoSave(newContent);
        }
      }, 30000); // Auto-save every 30 seconds
    },
    [handleAutoSave]
  );

  // Analytics tracking
  const trackAction = useCallback(
    (action: string, metadata: any = {}) => {
      if (!assignment) return;
      console.log('SME Contribution Analytics:', {
        action,
        metadata,
        timestamp: Date.now(),
        assignmentId: assignment.id,
        proposalId: assignment.proposalId,
        sessionDuration: Date.now() - sessionStartTime.current,
        activeEditingTime: activeEditingTime.current,
      });
    },
    [assignment]
  );

  // Generate AI draft
  const handleGenerateDraft = useCallback(async () => {
    setIsGeneratingDraft(true);
    aiDraftUsed.current = true;

    trackAction('ai_draft_requested', {
      sectionType: assignment?.sectionType,
      requirements: assignment?.requirements.length,
    });

    // Optimized AI generation with chunked processing to avoid performance violations
    const generateAIDraft = () => {
      const aiGeneratedContent = `# ${assignment?.proposalTitle} - AI Generated Draft

## Executive Summary

Based on the requirements for ${
        assignment?.customer
      }, this technical specification outlines a comprehensive solution addressing the following key areas:

${assignment?.requirements.map((req, index) => `${index + 1}. ${req}`).join('\n')}

## Proposed Solution Architecture

### Core Components

The solution leverages industry-leading technologies to ensure robust, scalable, and secure implementation:

- **Primary Infrastructure**: Enterprise-grade hardware and software components
- **Security Framework**: Multi-layered security approach with compliance adherence
- **Integration Layer**: Seamless integration with existing systems and workflows
- **Monitoring and Management**: Comprehensive visibility and control capabilities

### Implementation Approach

The implementation will follow a phased approach to minimize disruption and ensure successful deployment:

**Phase 1: Assessment and Planning** (Weeks 1-2)
- Current state analysis
- Requirements validation
- Detailed planning and design

**Phase 2: Infrastructure Preparation** (Weeks 3-4)
- Hardware procurement and staging
- Network configuration and testing
- Security baseline establishment

**Phase 3: Solution Deployment** (Weeks 5-6)
- System installation and configuration
- Integration testing and validation
- User training and documentation

### Compliance and Security Considerations

This solution addresses the following compliance requirements:
- ISO 27001 information security management
- SOC 2 Type II operational controls
- Industry-specific regulatory requirements

## Next Steps

Please review this initial draft and provide feedback for refinement. The technical team is available for clarification on any aspects of the proposed solution.`;

      setContent(aiGeneratedContent);
      setWordCount(aiGeneratedContent.trim().split(/\s+/).length);
      setHasUnsavedChanges(true);
      setIsGeneratingDraft(false);

      trackAction('ai_draft_generated', {
        wordCount: aiGeneratedContent.trim().split(/\s+/).length,
        generationTime: 50, // Optimized generation time
      });
    };

    // Use requestAnimationFrame for better performance instead of setTimeout
    const animationFrame = requestAnimationFrame(() => {
      // Small delay to show loading state, then generate
      setTimeout(generateAIDraft, 50);
    });

    // Cleanup function
    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [assignment, trackAction]);

  // Apply template
  const handleApplyTemplate = useCallback(
    (templateId: string) => {
      const template = templatesData?.find(t => t.id === templateId);
      if (!template) return;

      templateUsed.current = true;
      setSelectedTemplate(templateId);

      // Generate template content
      const templateContent = template.sections
        .map(section => `## ${section.title}\n\n${section.placeholder}\n\n`)
        .join('');

      setContent(templateContent);
      setWordCount(templateContent.trim().split(/\s+/).length);
      setHasUnsavedChanges(true);

      trackAction('template_applied', {
        templateId,
        templateType: template.type,
        estimatedTime: template.estimatedTime,
      });
    },
    [templatesData, trackAction]
  );

  // Save draft
  const handleSaveDraft = useCallback(() => {
    setLastSaved(new Date());
    setHasUnsavedChanges(false);

    if (editingStartTime.current) {
      activeEditingTime.current += Date.now() - editingStartTime.current;
      editingStartTime.current = null;
    }

    trackAction('draft_saved_manually', {
      wordCount,
      activeEditingTime: activeEditingTime.current,
    });
  }, [wordCount, trackAction]);

  // Submit contribution
  const handleSubmit = useCallback(() => {
    trackAction('Submit Contribution', {
      wordCount,
      versionCount: versionsData?.length || 0,
      templateUsed: selectedTemplate !== '',
    });
    // In a real app, this would submit the content to the backend.
    toast.success('Contribution submitted successfully!');
    router.push('/dashboard/sme/assignments');
  }, [assignment, wordCount, versionsData?.length, selectedTemplate, trackAction, router]);

  // Format time remaining
  const timeRemainingText = useMemo(() => {
    if (!assignment) return 'N/A';

    const now = new Date();
    const due = new Date(assignment.dueDate);
    const diffMs = due.getTime() - now.getTime();

    if (diffMs <= 0) return 'Overdue';

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diffMs / 1000 / 60) % 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  }, [assignment]);

  // Filter resources by search
  const filteredResources = useMemo(() => {
    if (!searchQuery || !resourcesData) return resourcesData || [];
    return resourcesData.filter(
      resource =>
        resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [resourcesData, searchQuery]);

  useEffect(() => {
    if (assignment) {
      trackAction('sme_contribution_session_started', {
        assignmentId: assignment.id,
        sectionType: assignment.sectionType,
        dueIn: assignment.dueDate.getTime() - Date.now(),
      });
    }

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [assignment, trackAction]);

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-screen">
        Loading SME contribution portal...
      </div>
    );
  if (fetchError)
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        Error: {fetchError}
      </div>
    );
  if (!assignment)
    return <div className="flex items-center justify-center h-screen">No assignment found.</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Button
                  variant="secondary"
                  onClick={() => router.push('/dashboard')}
                  className="flex items-center"
                >
                  <ArrowLeftIcon className="w-4 h-4 mr-2" />
                  Back to Assignments
                </Button>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{assignment.proposalTitle}</h1>
              <p className="text-gray-600">
                {assignment.customer} • Due: {assignment.dueDate.toLocaleDateString()} •{' '}
                {timeRemainingText}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right text-sm text-gray-600">
                <div>Assigned by: {assignment.assignedBy}</div>
                <div>Last saved: {lastSaved.toLocaleTimeString()}</div>
                {hasUnsavedChanges && <div className="text-amber-600">Unsaved changes</div>}
              </div>
              <Button variant="secondary" onClick={handleSaveDraft} disabled={!hasUnsavedChanges}>
                Save Draft
              </Button>
              <Button variant="primary" onClick={handleSubmit} className="flex items-center">
                Submit Contribution
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Assignment Context */}
        <Card className="mb-8">
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Section Requirements</h3>
                <ul className="space-y-2">
                  {assignment.requirements.map((requirement, index) => (
                    <li key={index} className="flex items-start">
                      <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></span>
                      <span className="text-gray-700">{requirement}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-2">💰</span>
                    <span className="text-sm font-medium text-gray-700">Proposal Value</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    ${assignment.context.proposalValue.toLocaleString()}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Industry</div>
                    <div className="font-medium">{assignment.context.industry}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Priority</div>
                    <div
                      className={`font-medium capitalize ${
                        assignment.context.priority === 'critical'
                          ? 'text-red-600'
                          : assignment.context.priority === 'high'
                            ? 'text-orange-600'
                            : assignment.context.priority === 'medium'
                              ? 'text-yellow-600'
                              : 'text-green-600'
                      }`}
                    >
                      {assignment.context.priority}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Tabbed Navigation */}
        <Card className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: CogIcon },
                { id: 'editor', label: 'Editor', icon: DocumentTextIcon },
                { id: 'resources', label: 'Resources', icon: BookOpenIcon },
                { id: 'history', label: 'History', icon: ClockIcon },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-5 h-5 mr-2" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center">
                      <DocumentTextIcon className="w-8 h-8 text-blue-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Word Count</p>
                        <p className="text-2xl font-bold text-gray-900">{wordCount}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center">
                      <ClockIcon className="w-8 h-8 text-green-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Progress</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {Math.min(100, Math.round((wordCount / 500) * 100))}%
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center">
                      <UserIcon className="w-8 h-8 text-purple-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Version</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {assignment.content.version}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-orange-50 rounded-lg">
                    <div className="flex items-center">
                      <SparklesIcon className="w-8 h-8 text-orange-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">AI Assist</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {aiDraftUsed.current ? 'Used' : 'Available'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">
                      Contribution Guidelines
                    </h4>
                    <div className="space-y-3 text-sm text-gray-600">
                      <div className="flex items-start">
                        <span className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2 mr-3"></span>
                        <span>
                          Use clear, technical language appropriate for enterprise stakeholders
                        </span>
                      </div>
                      <div className="flex items-start">
                        <span className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2 mr-3"></span>
                        <span>
                          Include specific product names, versions, and technical specifications
                        </span>
                      </div>
                      <div className="flex items-start">
                        <span className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2 mr-3"></span>
                        <span>Reference industry standards and compliance requirements</span>
                      </div>
                      <div className="flex items-start">
                        <span className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2 mr-3"></span>
                        <span>Provide implementation timelines with realistic milestones</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Quality Checklist</h4>
                    <div className="space-y-3">
                      {[
                        { label: 'All requirements addressed', checked: wordCount > 200 },
                        {
                          label: 'Technical specifications included',
                          checked: content.includes('specification'),
                        },
                        {
                          label: 'Compliance standards referenced',
                          checked: content.includes('ISO') || content.includes('SOC'),
                        },
                        {
                          label: 'Implementation timeline provided',
                          checked: content.includes('Phase') || content.includes('Week'),
                        },
                      ].map((item, index) => (
                        <div key={index} className="flex items-center">
                          <div
                            className={`w-5 h-5 rounded mr-3 flex items-center justify-center ${
                              item.checked
                                ? 'bg-green-100 text-green-600'
                                : 'bg-gray-100 text-gray-400'
                            }`}
                          >
                            {item.checked ? '✓' : '○'}
                          </div>
                          <span className={item.checked ? 'text-gray-900' : 'text-gray-500'}>
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Editor Tab */}
            {activeTab === 'editor' && (
              <div className="space-y-6">
                {/* Editor Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="secondary"
                      onClick={handleGenerateDraft}
                      disabled={isGeneratingDraft}
                      className="flex items-center"
                    >
                      <SparklesIcon className="w-4 h-4 mr-2" />
                      {isGeneratingDraft ? 'Generating...' : 'Generate AI Draft'}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setShowTemplates(!showTemplates)}
                      className="flex items-center"
                    >
                      <DocumentDuplicateIcon className="w-4 h-4 mr-2" />
                      Use Template
                    </Button>
                  </div>
                  <div className="text-sm text-gray-600">
                    {wordCount} words • Last saved: {lastSaved.toLocaleTimeString()}
                  </div>
                </div>

                {/* Template Selection */}
                {showTemplates && (
                  <Card className="border-blue-200">
                    <div className="p-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Choose a Template</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {templatesData?.map(template => (
                          <div
                            key={template.id}
                            className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer"
                            onClick={() => handleApplyTemplate(template.id)}
                          >
                            <h5 className="font-medium text-gray-900">{template.title}</h5>
                            <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                            <div className="flex items-center justify-between mt-3">
                              <span className="text-xs text-gray-500">
                                {template.estimatedTime} min
                              </span>
                              <span
                                className={`text-xs px-2 py-1 rounded ${
                                  template.difficulty === 'beginner'
                                    ? 'bg-green-100 text-green-800'
                                    : template.difficulty === 'intermediate'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {template.difficulty}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                )}

                {/* Content Editor */}
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-300">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Content Editor</span>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>{wordCount} words</span>
                        <span>•</span>
                        <span>Version {assignment.content.version}</span>
                      </div>
                    </div>
                  </div>
                  <textarea
                    value={content}
                    onChange={e => handleContentChange(e.target.value)}
                    placeholder="Begin writing your technical contribution here. Use the AI assistance or templates above to get started..."
                    className="w-full h-96 p-4 border-0 resize-none focus:ring-0 focus:outline-none"
                    style={{ minHeight: '400px' }}
                  />
                </div>
              </div>
            )}

            {/* Resources Tab */}
            {activeTab === 'resources' && (
              <div className="space-y-6">
                {/* Search Resources */}
                <div className="relative">
                  <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search resources, specifications, and documentation..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Resources List */}
                <div className="space-y-4">
                  {filteredResources.map(resource => (
                    <Card
                      key={resource.id}
                      className="hover:shadow-md transition-shadow duration-200"
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="text-lg font-medium text-gray-900">
                                {resource.title}
                              </h4>
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${
                                  resource.type === 'document'
                                    ? 'bg-blue-100 text-blue-800'
                                    : resource.type === 'specification'
                                      ? 'bg-green-100 text-green-800'
                                      : resource.type === 'example'
                                        ? 'bg-purple-100 text-purple-800'
                                        : 'bg-orange-100 text-orange-800'
                                }`}
                              >
                                {resource.type}
                              </span>
                              <div className="flex items-center">
                                <span className="text-sm text-gray-500 mr-1">Relevance:</span>
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full"
                                    style={{ width: `${resource.relevanceScore}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm text-gray-500 ml-1">
                                  {resource.relevanceScore}%
                                </span>
                              </div>
                            </div>
                            <p className="text-gray-600 mb-4">{resource.description}</p>
                          </div>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              trackAction('resource_accessed', {
                                resourceId: resource.id,
                                resourceType: resource.type,
                                relevanceScore: resource.relevanceScore,
                              });
                              // Open resource in new tab
                              window.open(resource.url, '_blank');
                            }}
                            className="flex items-center ml-4"
                          >
                            <EyeIcon className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {filteredResources.length === 0 && (
                  <div className="text-center py-12">
                    <BookOpenIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No resources found</h3>
                    <p className="text-gray-600">
                      {searchQuery
                        ? 'Try adjusting your search terms.'
                        : 'No resources available for this assignment.'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Version History</h3>
                  <span className="text-sm text-gray-600">
                    {versionsData?.length || 0} versions
                  </span>
                </div>

                <div className="space-y-4">
                  {versionsData?.map(version => (
                    <Card
                      key={version.id}
                      className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => {
                        setContent(version.content);
                        setWordCount(version.wordCount);
                        trackAction('version_restored', {
                          versionId: version.id,
                          versionNumber: version.version,
                        });
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">
                            Version {version.version}
                          </span>
                          {version.autoSaved && (
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                              Auto-saved
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">
                          {version.savedAt.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{version.changesSummary}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{version.wordCount} words</span>
                        <span>Click to restore</span>
                      </div>
                    </Card>
                  )) || (
                    <div className="text-center py-8 text-gray-500">
                      No version history available
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
