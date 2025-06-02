/**
 * PosalPro MVP2 - SME Contribution Interface
 * Advanced content creation interface for subject matter experts
 * Features: Auto-save, AI assistance, templates, real-time analytics
 */

/* eslint-disable react-hooks/exhaustive-deps */

'use client';

import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/forms/Button';
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

// Mock SME assignment data
const MOCK_ASSIGNMENT: SMEAssignment = {
  id: 'sme-001',
  proposalId: '1',
  proposalTitle: 'Enterprise IT Solution - Network Security',
  customer: 'Acme Corporation',
  sectionType: SectionType.TECHNICAL_SPECS,
  assignedBy: 'Alex Kim',
  assignedAt: new Date(Date.now() - 14400000), // 4 hours ago
  dueDate: new Date(Date.now() + 172800000), // 48 hours from now
  status: AssignmentStatus.IN_PROGRESS,
  requirements: [
    'Provide technical specifications for network security solution',
    'Include compatibility requirements with existing infrastructure',
    'Address compliance with ISO 27001 and SOC 2 Type II',
    'Detail implementation timeline with milestones',
    'Specify hardware and software requirements',
    'Include risk assessment and mitigation strategies',
  ],
  context: {
    proposalValue: 750000,
    industry: 'Financial Services',
    complexity: 'high',
    priority: 'critical',
  },
  content: {
    draft: `# Network Security Solution - Technical Specifications

## 1. Firewall Configuration

The proposed network security solution includes a next-generation firewall deployment with the following specifications:

- **Next-Gen Firewall with IPS**: Fortinet FortiGate 3000D series with integrated Intrusion Prevention System
- **Application-level filtering**: Deep packet inspection with application control and web filtering
- **Redundant deployment**: Active-passive high availability configuration with sub-second failover

## 2. Endpoint Protection

Comprehensive endpoint security covering all client devices:

- **Client security software**: CrowdStrike Falcon Prevent with EDR capabilities
- **Device management solution**: Microsoft Intune for mobile device management
- **Automated patch management**: WSUS integration with Windows Update for Business

## 3. Network Segmentation

Implementation of zero-trust network architecture:

- **VLAN segmentation**: Layer 2 isolation with role-based access control
- **Micro-segmentation**: Software-defined perimeter using Cisco ACI fabric
- **Access control**: 802.1X authentication with certificate-based device validation`,
    wordCount: 156,
    lastSaved: new Date(Date.now() - 900000), // 15 minutes ago
    version: 3,
  },
};

// Mock templates data
const MOCK_TEMPLATES: ContributionTemplate[] = [
  {
    id: 'temp-001',
    type: TemplateType.TECHNICAL_SPECIFICATIONS,
    title: 'Technical Specifications Template',
    description: 'Comprehensive template for technical solution specifications',
    estimatedTime: 45,
    difficulty: 'intermediate',
    sections: [
      {
        id: 'sec-001',
        title: 'Solution Overview',
        placeholder: 'Provide a high-level overview of the proposed technical solution...',
        required: true,
        guidance: 'Start with the core problem being solved and the approach taken',
      },
      {
        id: 'sec-002',
        title: 'Technical Architecture',
        placeholder: 'Detail the technical architecture and components...',
        required: true,
        guidance: 'Include system diagrams, component relationships, and data flows',
      },
      {
        id: 'sec-003',
        title: 'Implementation Requirements',
        placeholder: 'Specify hardware, software, and infrastructure requirements...',
        required: true,
        guidance: 'Be specific about versions, capacity, and compatibility requirements',
      },
    ],
  },
  {
    id: 'temp-002',
    type: TemplateType.SECURITY_ASSESSMENT,
    title: 'Security Assessment Template',
    description: 'Template for security analysis and risk assessment',
    estimatedTime: 60,
    difficulty: 'advanced',
    sections: [
      {
        id: 'sec-004',
        title: 'Security Framework',
        placeholder: 'Outline the security framework and standards compliance...',
        required: true,
        guidance: 'Reference relevant standards like ISO 27001, NIST, or SOC 2',
      },
      {
        id: 'sec-005',
        title: 'Risk Assessment',
        placeholder: 'Identify and assess security risks...',
        required: true,
        guidance: 'Use a structured risk assessment methodology with likelihood and impact',
      },
    ],
  },
];

// Mock resources data
const MOCK_RESOURCES: ContributionResource[] = [
  {
    id: 'res-001',
    title: 'Previous Network Security Solutions',
    type: 'example',
    url: '/resources/network-security-examples',
    description: 'Reference implementations from similar enterprise deployments',
    relevanceScore: 95,
  },
  {
    id: 'res-002',
    title: 'Fortinet Product Specifications',
    type: 'specification',
    url: '/resources/fortinet-specs',
    description: 'Technical specifications for FortiGate enterprise firewalls',
    relevanceScore: 90,
  },
  {
    id: 'res-003',
    title: 'ISO 27001 Requirements Guide',
    type: 'standard',
    url: '/resources/iso-27001-guide',
    description: 'Complete guide to ISO 27001 compliance requirements',
    relevanceScore: 85,
  },
  {
    id: 'res-004',
    title: 'Enterprise Security Architecture Best Practices',
    type: 'document',
    url: '/resources/security-best-practices',
    description: 'Industry best practices for enterprise security architecture',
    relevanceScore: 80,
  },
];

// Mock version history
const MOCK_VERSIONS: VersionHistory[] = [
  {
    id: 'ver-003',
    version: 3,
    content: MOCK_ASSIGNMENT.content.draft,
    savedAt: new Date(Date.now() - 900000),
    wordCount: 156,
    changesSummary: 'Added network segmentation section with micro-segmentation details',
    autoSaved: false,
  },
  {
    id: 'ver-002',
    version: 2,
    content: 'Previous version content...',
    savedAt: new Date(Date.now() - 3600000),
    wordCount: 124,
    changesSummary: 'Expanded endpoint protection specifications',
    autoSaved: true,
  },
  {
    id: 'ver-001',
    version: 1,
    content: 'Initial template content...',
    savedAt: new Date(Date.now() - 7200000),
    wordCount: 89,
    changesSummary: 'Initial draft from template',
    autoSaved: false,
  },
];

export default function SMEContributionInterface() {
  const router = useRouter();
  const [assignment] = useState<SMEAssignment>(MOCK_ASSIGNMENT);
  const [templates] = useState<ContributionTemplate[]>(MOCK_TEMPLATES);
  const [resources] = useState<ContributionResource[]>(MOCK_RESOURCES);
  const [versions] = useState<VersionHistory[]>(MOCK_VERSIONS);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'editor' | 'resources' | 'history'>(
    'editor'
  );
  const [content, setContent] = useState(assignment.content.draft);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [wordCount, setWordCount] = useState(assignment.content.wordCount);
  const [lastSaved, setLastSaved] = useState(assignment.content.lastSaved);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Analytics tracking refs
  const sessionStartTime = useRef(Date.now());
  const editingStartTime = useRef<number | null>(null);
  const activeEditingTime = useRef(0);
  const aiDraftUsed = useRef(false);
  const templateUsed = useRef(false);

  // Auto-save functionality
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  const handleContentChange = useCallback(
    (newContent: string) => {
      if (!editingStartTime.current) {
        editingStartTime.current = Date.now();
      }

      setContent(newContent);
      setWordCount(newContent.trim().split(/\s+/).length);
      setHasUnsavedChanges(true);

      // Clear existing timer and set new one
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }

      autoSaveTimer.current = setTimeout(() => {
        handleAutoSave(newContent);
      }, 30000); // Auto-save every 30 seconds
    },
    [handleAutoSave]
  );

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

  // Analytics tracking
  const trackAction = useCallback(
    (action: string, metadata: any = {}) => {
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
    [assignment.id, assignment.proposalId]
  );

  // Generate AI draft
  const handleGenerateDraft = useCallback(async () => {
    setIsGeneratingDraft(true);
    aiDraftUsed.current = true;

    trackAction('ai_draft_requested', {
      sectionType: assignment.sectionType,
      requirements: assignment.requirements.length,
    });

    // Simulate AI generation delay
    setTimeout(() => {
      const aiGeneratedContent = `# ${assignment.proposalTitle} - AI Generated Draft

## Executive Summary

Based on the requirements for ${
        assignment.customer
      }, this technical specification outlines a comprehensive solution addressing the following key areas:

${assignment.requirements.map((req, index) => `${index + 1}. ${req}`).join('\n')}

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
        generationTime: 3000, // Mock generation time
      });
    }, 3000);
  }, [assignment, trackAction]);

  // Apply template
  const handleApplyTemplate = useCallback(
    (templateId: string) => {
      const template = templates.find(t => t.id === templateId);
      if (!template) return;

      templateUsed.current = true;

      const templateContent = template.sections
        .map(
          section =>
            `## ${section.title}\n\n${section.placeholder}\n\n${
              section.guidance ? `<!-- Guidance: ${section.guidance} -->\n\n` : ''
            }`
        )
        .join('');

      setContent(templateContent);
      setWordCount(templateContent.trim().split(/\s+/).length);
      setHasUnsavedChanges(true);
      setShowTemplates(false);

      trackAction('template_applied', {
        templateId,
        templateType: template.type,
        estimatedTime: template.estimatedTime,
      });
    },
    [templates, trackAction]
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
    const totalSessionTime = Date.now() - sessionStartTime.current;

    if (editingStartTime.current) {
      activeEditingTime.current += Date.now() - editingStartTime.current;
    }

    const metrics: SMEContributionMetrics = {
      assignmentId: assignment.id,
      timeToStart: 0, // Mock - time from notification to first action
      activeEditingTime: activeEditingTime.current,
      aiDraftUsed: aiDraftUsed.current,
      aiDraftUtilization: aiDraftUsed.current ? 75 : 0, // Mock utilization percentage
      templateUsed: templateUsed.current,
      templateType: selectedTemplate || 'none',
      contributionQuality: 8.5, // Mock quality score
      submissionTime: totalSessionTime,
      requirementsViewTime: 120000, // Mock - 2 minutes
      resourcesAccessed: 3,
      knowledgeBaseSearches: 2,
      versionsCreated: versions.length,
    };

    trackAction('contribution_submitted', metrics);

    // Navigate back or show success state
    router.push('/dashboard');
  }, [assignment.id, selectedTemplate, versions.length, trackAction, router]);

  // Format time remaining
  const timeRemaining = useMemo(() => {
    const now = new Date();
    const due = assignment.dueDate;
    const diffMs = due.getTime() - now.getTime();

    if (diffMs <= 0) return 'Overdue';

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours < 24) {
      return `${hours}h ${minutes}m remaining`;
    } else {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h remaining`;
    }
  }, [assignment.dueDate]);

  // Filter resources by search
  const filteredResources = useMemo(() => {
    if (!searchQuery) return resources;
    return resources.filter(
      resource =>
        resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [resources, searchQuery]);

  useEffect(() => {
    trackAction('sme_contribution_session_started', {
      assignmentId: assignment.id,
      sectionType: assignment.sectionType,
      dueIn: assignment.dueDate.getTime() - Date.now(),
    });

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [assignment, trackAction]);

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
                {timeRemaining}
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
                        {templates.map(template => (
                          <div
                            key={template.id}
                            className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer"
                            onClick={() => handleApplyTemplate(template.id)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium text-gray-900">{template.title}</h5>
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${
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
                            <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                            <div className="flex items-center text-sm text-gray-500">
                              <ClockIcon className="w-4 h-4 mr-1" />
                              {template.estimatedTime} min
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
                  <span className="text-sm text-gray-600">{versions.length} versions</span>
                </div>

                <div className="space-y-4">
                  {versions.map(version => (
                    <Card
                      key={version.id}
                      className="hover:shadow-md transition-shadow duration-200"
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="text-lg font-medium text-gray-900">
                                Version {version.version}
                              </h4>
                              {version.autoSaved && (
                                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                  Auto-saved
                                </span>
                              )}
                              <span className="text-sm text-gray-500">
                                {version.savedAt.toLocaleDateString()} at{' '}
                                {version.savedAt.toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-gray-600 mb-2">{version.changesSummary}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>{version.wordCount} words</span>
                              <span>•</span>
                              <span>
                                {version.version === assignment.content.version
                                  ? 'Current version'
                                  : 'Previous version'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                trackAction('version_viewed', {
                                  versionId: version.id,
                                  version: version.version,
                                });
                                // Show version content in modal
                              }}
                              className="flex items-center"
                            >
                              <EyeIcon className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            {version.version !== assignment.content.version && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                  setContent(version.content);
                                  setWordCount(version.wordCount);
                                  setHasUnsavedChanges(true);
                                  setActiveTab('editor');

                                  trackAction('version_restored', {
                                    versionId: version.id,
                                    version: version.version,
                                  });
                                }}
                              >
                                Restore
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
