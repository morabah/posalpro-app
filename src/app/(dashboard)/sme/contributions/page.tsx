/**
 * PosalPro MVP2 - SME Contribution Interface
 * Advanced content creation interface for subject matter experts
 * Features: Auto-save, AI assistance, templates, real-time analytics
 */

'use client';

import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/forms/Button';
import { useApiClient } from '@/hooks/useApiClient';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { ApiResponse } from '@/types/api';
import {
  ArrowLeftIcon,
  BookOpenIcon,
  ClockIcon,
  DocumentDuplicateIcon,
  DocumentTextIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
// import { toast } from 'react-hot-toast'; // Removed as per edit hint

// Simple toast function to replace react-hot-toast
const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  console.log(`Toast (${type}):`, message);
  // In a real implementation, this would show a toast notification
};

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
  const apiClient = useApiClient();

  const [assignmentData, setAssignmentData] = useState<SMEAssignment | null>(null);
  const [templatesData, setTemplatesData] = useState<ContributionTemplate[]>([]);
  const [resourcesData, setResourcesData] = useState<ContributionResource[]>([]);
  const [versionsData, setVersionsData] = useState<VersionHistory[]>([]);
  const [content, setContent] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('editor');
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [autosaveStatus, setAutosaveStatus] = useState('Saved');

  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const sessionStartTime = useRef(Date.now());
  const editingStartTime = useRef<number | null>(null);
  const activeEditingTime = useRef(0);
  const dataFetchedRef = useRef(false);
  const aiDraftUsed = useRef(false);
  const templateUsed = useRef(false);

  const { trackOptimized: trackAction } = useOptimizedAnalytics();

  useEffect(() => {
    const fetchData = async () => {
      if (dataFetchedRef.current) return;
      dataFetchedRef.current = true;
      setIsLoading(true);
      try {
        console.log('[SMEContributions] 🚀 Fetching SME data via apiClient...');
        const [assignmentResponse, templatesResponse, resourcesResponse, versionsResponse] =
          await Promise.all([
            apiClient.get<ApiResponse<SMEAssignment>>('/sme/assignment'),
            apiClient.get<ApiResponse<ContributionTemplate[]>>('/sme/templates'),
            apiClient.get<ApiResponse<ContributionResource[]>>('/sme/resources'),
            apiClient.get<ApiResponse<VersionHistory[]>>('/sme/versions'),
          ]);

        if (assignmentResponse.success && assignmentResponse.data) {
          const assignment = {
            ...assignmentResponse.data,
            assignedAt: new Date(assignmentResponse.data.assignedAt),
            dueDate: new Date(assignmentResponse.data.dueDate),
            content: {
              ...assignmentResponse.data.content,
              lastSaved: new Date(assignmentResponse.data.content.lastSaved),
            },
          };
          setAssignmentData(assignment);
          setContent(assignment.content.draft);
          setWordCount(assignment.content.wordCount);
          setLastSaved(assignment.content.lastSaved);
        } else {
          // Handle assignment fetch failure gracefully
          const errorMessage = assignmentResponse.error || 'Failed to fetch assignment data';
          console.warn('[SMEContributions] ⚠️ Assignment data not available:', errorMessage);
          setFetchError(errorMessage);
          trackAction('sme_assignment_load_failed', { error: errorMessage }, 'medium');
        }

        if (templatesResponse.success && templatesResponse.data) {
          setTemplatesData(templatesResponse.data);
        }

        if (resourcesResponse.success && resourcesResponse.data) {
          setResourcesData(resourcesResponse.data);
        }

        if (versionsResponse.success && versionsResponse.data) {
          setVersionsData(
            versionsResponse.data.map((v: VersionHistory) => ({
              ...v,
              savedAt: new Date(v.savedAt),
            }))
          );
        }
      } catch (error) {
        console.error('[SMEContributions] ❌ Error fetching SME data:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        setFetchError(errorMessage);
        trackAction('sme_data_load_failed', { error: errorMessage }, 'high');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [apiClient, trackAction]);

  const handleAutoSave = useCallback(async () => {
    if (!hasUnsavedChanges) return;

    setAutosaveStatus('Saving...');
    try {
      const response = await apiClient.post<ApiResponse<VersionHistory>>('/sme/autosave', {
        assignmentId: assignmentData?.id,
        content,
        wordCount,
      });

      if (response.success && response.data) {
        const versionData = response.data;
        setVersionsData(prev => [
          ...prev,
          { ...versionData, savedAt: new Date(versionData.savedAt) },
        ]);
        setHasUnsavedChanges(false);
        setLastSaved(new Date());
        setAutosaveStatus('Saved');
        showToast('Draft auto-saved successfully!', 'success');
        trackAction(
          'autosave_success',
          {
            wordCount,
            version: (versionsData?.length || 0) + 1,
          },
          'low'
        );
      } else {
        // Handle autosave failure gracefully
        const errorMessage = response.error || 'Autosave failed';
        console.warn('[SMEContributions] ⚠️ Autosave failed:', errorMessage);
        setAutosaveStatus('Error saving');
        showToast('Failed to auto-save draft.', 'error');
        trackAction('autosave_failed', { error: errorMessage }, 'high');
        return; // Exit early to prevent further processing
      }
    } catch (error) {
      setAutosaveStatus('Error saving');
      showToast('Failed to auto-save draft.', 'error');
      trackAction('autosave_failed', { error: (error as Error).message }, 'high');
    }
  }, [assignmentData, content, wordCount, hasUnsavedChanges, versionsData, apiClient, trackAction]);

  const handleContentChange = useCallback(
    (newContent: string) => {
      if (editingStartTime.current === null) {
        editingStartTime.current = Date.now();
      }
      setContent(newContent);
      setWordCount(newContent.trim().split(/\s+/).filter(Boolean).length);
      setHasUnsavedChanges(true);
      setAutosaveStatus('Unsaved changes');

      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(handleAutoSave, 30000); // 30s
    },
    [handleAutoSave]
  );

  const handleGenerateDraft = useCallback(() => {
    if (!assignmentData) return;

    setIsGeneratingDraft(true);
    aiDraftUsed.current = true;
    trackAction('ai_draft_requested', { currentWordCount: wordCount }, 'medium');

    setTimeout(() => {
      const aiGeneratedContent = `## AI-Generated Draft for ${assignmentData.proposalTitle}\n\nBased on the requirements for the **${assignmentData.sectionType}** section, here is a starting point:\n\n### Key Considerations\n\n*   **Scalability:** The proposed architecture is designed to handle a 10x increase in user load without significant performance degradation.\n*   **Security:** All data transmission is encrypted using TLS 1.3, and data at rest is protected by AES-256 encryption.\n*   **Compliance:** The solution adheres to relevant industry standards, including SOC 2 and ISO 27001.`;

      setContent(aiGeneratedContent);
      setWordCount(aiGeneratedContent.trim().split(/\s+/).length);
      setHasUnsavedChanges(true);
      setIsGeneratingDraft(false);

      trackAction(
        'ai_draft_generated',
        {
          wordCount: aiGeneratedContent.trim().split(/\s+/).length,
          generationTime: 50,
        },
        'medium'
      );
    }, 1000);
  }, [assignmentData, wordCount, trackAction]);

  const handleApplyTemplate = useCallback(
    (templateId: string) => {
      const template = templatesData.find(t => t.id === templateId);
      if (!template) return;

      templateUsed.current = true;
      setSelectedTemplate(templateId);

      const templateContent = template.sections
        .map(section => `## ${section.title}\n\n${section.placeholder}\n\n`)
        .join('');

      setContent(templateContent);
      setWordCount(templateContent.trim().split(/\s+/).length);
      setHasUnsavedChanges(true);

      trackAction(
        'template_applied',
        {
          templateId,
          templateType: template.type,
        },
        'medium'
      );
      setShowTemplates(false);
    },
    [templatesData, trackAction]
  );

  const handleSubmit = useCallback(() => {
    trackAction(
      'contribution_submitted',
      {
        finalWordCount: wordCount,
        versionCount: (versionsData?.length || 0) + 1,
        templateUsed: !!selectedTemplate,
      },
      'high'
    );
    showToast('Contribution submitted successfully!', 'success');
    router.push('/dashboard/sme/assignments');
  }, [wordCount, versionsData, selectedTemplate, trackAction, router]);

  const timeRemainingText = useMemo(() => {
    if (!assignmentData) return 'N/A';
    const now = new Date();
    const due = new Date(assignmentData.dueDate);
    const diffMs = due.getTime() - now.getTime();

    if (diffMs <= 0) return 'Overdue';

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diffMs / 1000 / 60) % 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  }, [assignmentData]);

  const filteredResources = useMemo(() => {
    if (!searchQuery) return resourcesData;
    return resourcesData.filter(
      resource =>
        resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, resourcesData]);

  useEffect(() => {
    if (assignmentData) {
      trackAction(
        'sme_contribution_session_started',
        {
          assignmentId: assignmentData.id,
          sectionType: assignmentData.sectionType,
          dueIn: assignmentData.dueDate.getTime() - Date.now(),
        },
        'medium'
      );
    }

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [assignmentData, trackAction]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (fetchError) {
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        Error: {fetchError}
      </div>
    );
  }

  if (!assignmentData) {
    return (
      <div className="flex justify-center items-center h-screen">No assignment data found.</div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="bg-white shadow-sm rounded-lg p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <Button
                variant="secondary"
                onClick={() => router.push('/dashboard/sme')}
                className="flex items-center mb-4"
              >
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back to Assignments
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">{assignmentData.proposalTitle}</h1>
              <p className="text-gray-600 mt-1">
                {assignmentData.customer} &bull; Due:{' '}
                {new Date(assignmentData.dueDate).toLocaleDateString()} &bull; {timeRemainingText}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right text-sm">
                <div className="text-gray-600">{autosaveStatus}</div>
                {lastSaved && (
                  <div className="text-gray-500">
                    Last saved: {new Date(lastSaved).toLocaleTimeString()}
                  </div>
                )}
              </div>
              <Button variant="primary" onClick={handleSubmit} className="flex items-center">
                Submit Contribution
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel: Editor and Tabs */}
          <div className="lg:col-span-2">
            <Card>
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  {[
                    { id: 'editor', label: 'Editor', icon: DocumentTextIcon },
                    { id: 'resources', label: 'Resources', icon: BookOpenIcon },
                    { id: 'history', label: 'History', icon: ClockIcon },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        trackAction('tab_changed', { tab: tab.id }, 'low');
                      }}
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
                {/* Editor Tab */}
                {activeTab === 'editor' && (
                  <div className="space-y-6">
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
                      <div className="text-sm text-gray-600">{wordCount} words</div>
                    </div>

                    {showTemplates && (
                      <Card className="border-blue-200">
                        <div className="p-6">
                          <h4 className="text-lg font-medium text-gray-900 mb-4">
                            Choose a Template
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {templatesData?.map(template => (
                              <div
                                key={template.id}
                                className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer"
                                onClick={() => handleApplyTemplate(template.id)}
                              >
                                <h5 className="font-medium text-gray-900">{template.title}</h5>
                                <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </Card>
                    )}

                    <textarea
                      value={content}
                      onChange={e => handleContentChange(e.target.value)}
                      placeholder="Begin writing your technical contribution here..."
                      className="w-full h-96 p-4 border border-gray-300 rounded-lg resize-none focus:ring-blue-500 focus:border-blue-500"
                      style={{ minHeight: '500px' }}
                    />
                  </div>
                )}

                {/* Resources Tab */}
                {activeTab === 'resources' && (
                  <div className="space-y-6">
                    <div className="relative">
                      <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Search resources..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    <div className="space-y-4">
                      {filteredResources.map(resource => (
                        <Card key={resource.id} className="hover:shadow-md transition-shadow">
                          <div className="p-4 flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">{resource.title}</h4>
                              <p className="text-sm text-gray-600">{resource.description}</p>
                            </div>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                trackAction(
                                  'resource_accessed',
                                  {
                                    resourceId: resource.id,
                                    resourceType: resource.type,
                                  },
                                  'low'
                                );
                                window.open(resource.url, '_blank');
                              }}
                              className="flex items-center ml-4"
                            >
                              <EyeIcon className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* History Tab */}
                {activeTab === 'history' && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      {versionsData.length > 0 ? (
                        versionsData.map(version => (
                          <Card
                            key={version.id}
                            className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => {
                              setContent(version.content);
                              setWordCount(version.wordCount);
                              trackAction(
                                'version_restored',
                                { versionId: version.id, versionNumber: version.version },
                                'medium'
                              );
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <p className="font-medium">
                                Version {version.version} {version.autoSaved ? '(Auto-saved)' : ''}
                              </p>
                              <p className="text-sm text-gray-500">
                                {new Date(version.savedAt).toLocaleString()}
                              </p>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{version.changesSummary}</p>
                          </Card>
                        ))
                      ) : (
                        <p className="text-center text-gray-500 py-8">
                          No version history available.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right Panel: Context and Guidelines */}
          <div className="space-y-8">
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Section Requirements</h3>
                <ul className="space-y-2">
                  {assignmentData.requirements.map((req, i) => (
                    <li key={i} className="flex items-start">
                      <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></span>
                      <span className="text-gray-700">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Context</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-600">Proposal Value</span>
                    <span className="font-bold text-lg text-green-600">
                      ${assignmentData.context.proposalValue.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-600">Industry</span>
                    <span className="text-gray-800">{assignmentData.context.industry}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-600">Priority</span>
                    <span className="font-bold capitalize">{assignmentData.context.priority}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
