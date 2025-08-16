'use client';

/**
 * PosalPro MVP2 - Proposal Creation Wizard - MOBILE PERFORMANCE OPTIMIZED
 * Implements 6-step proposal creation workflow per PROPOSAL_CREATION_SCREEN.md
 * Enhanced with mobile-first responsive design, touch-friendly interfaces
 * Features: Progressive disclosure, swipe navigation, touch targets 44px+
 * Component Traceability Matrix: US-4.1, US-2.2, US-8.1, H7, H4, H9, H10
 *
 * 🚀 MOBILE PERFORMANCE OPTIMIZATIONS:
 * - Lazy loading for heavy components
 * - Reduced state complexity on mobile
 * - Optimized analytics for mobile
 * - GPU acceleration for smooth interactions
 */

import { useAuth } from '@/components/providers/AuthProvider';
import { Alert } from '@/components/ui/feedback/Alert';
import { Button } from '@/components/ui/forms/Button';
import { useResponsive } from '@/components/ui/ResponsiveBreakpointManager';
import { useProposalCreationAnalytics } from '@/hooks/proposals/useProposalCreationAnalytics';
import { useApiClient } from '@/hooks/useApiClient';
import { useMemoryOptimization } from '@/hooks/useMemoryOptimization';
import { ErrorCodes, ErrorHandlingService, StandardError } from '@/lib/errors';
import { logDebug } from '@/lib/logger';
import {
  createMemoryOptimizedImport,
  dynamicImportTracker,
} from '@/lib/utils/dynamicImportOptimizer';
import { Priority } from '@/types/enums';
import {
  ContentItem,
  ExpertiseArea,
  ProposalCreationMetrics,
  ProposalPriority,
  ProposalSection,
  ProposalWizardData,
  ProposalWizardStep1Data,
  ProposalWizardStep2Data,
  ProposalWizardStep3Data,
  ProposalWizardStep4Data,
  ProposalWizardStep5Data,
  ProposalWizardStep6Data,
  SelectedContent,
} from '@/types/proposals';
import {
  Bars3Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { debounce } from 'lodash';
import { useRouter } from 'next/navigation';
import { lazy, memo, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';

// ✅ CRITICAL: Memory optimization hook

// 🚀 MOBILE OPTIMIZATION: Lazy load heavy components with memory optimization
// Define lightweight loading spinner BEFORE dynamic imports to avoid TS init order errors
const MobileLoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span className="ml-3 text-sm text-gray-600">Loading...</span>
  </div>
);
const BasicInformationStep = lazy(() =>
  import('./steps/BasicInformationStep').then(module => ({ default: module.BasicInformationStep }))
);
const TeamAssignmentStep = lazy(() =>
  import('./steps/TeamAssignmentStep').then(module => ({ default: module.TeamAssignmentStep }))
);
const ContentSelectionStep = createMemoryOptimizedImport(
  () =>
    import('./steps/ContentSelectionStep').then(module => ({
      default: module.ContentSelectionStep,
    })),
  { unloadDelay: 5000, loadingComponent: MobileLoadingSpinner, maxMemoryUsage: 130 }
);
const ProductSelectionStep = createMemoryOptimizedImport(
  () =>
    import('./steps/ProductSelectionStep').then(module => ({
      default: module.ProductSelectionStep,
    })),
  { unloadDelay: 5000, loadingComponent: MobileLoadingSpinner, maxMemoryUsage: 130 }
);
const SectionAssignmentStep = createMemoryOptimizedImport(
  () =>
    import('./steps/SectionAssignmentStep').then(module => ({
      default: module.SectionAssignmentStep,
    })),
  { unloadDelay: 5000, loadingComponent: MobileLoadingSpinner, maxMemoryUsage: 130 }
);
const ReviewStep = createMemoryOptimizedImport(
  () => import('./steps/ReviewStep').then(module => ({ default: module.ReviewStep })),
  { unloadDelay: 5000, loadingComponent: MobileLoadingSpinner, maxMemoryUsage: 130 }
);

// Mobile-enhanced Card component with GPU acceleration
const Card: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className = '',
  children,
}) => (
  <div
    className={`rounded-lg sm:rounded-xl border border-gray-200 bg-white shadow-sm will-change-transform ${className}`}
    style={{ transform: 'translateZ(0)' }}
  >
    {children}
  </div>
);

// (spinner defined above to ensure availability in dynamic import helpers)

// Component Traceability Matrix - Enhanced with mobile user stories
const COMPONENT_MAPPING = {
  userStories: ['US-4.1', 'US-2.2', 'US-8.1'],
  acceptanceCriteria: ['AC-4.1.1', 'AC-4.1.3', 'AC-2.2.1', 'AC-2.2.2', 'AC-8.1.1'],
  methods: [
    'complexityEstimation()',
    'initializeTracking()',
    'createProposal()',
    'suggestContributors()',
    'criticalPath()',
    'saveDraft()',
    'recoverSession()',
    'mobileOptimizedNavigation()',
    'touchFriendlyInterface()',
    'responsiveStepperDesign()',
    'lazyLoadComponents()',
    'optimizeMobilePerformance()',
  ],
  hypotheses: ['H7', 'H4', 'H9', 'H10'],
  testCases: ['TC-H7-001', 'TC-H4-001', 'TC-H9-001', 'TC-H10-001'],
};

// Lightweight step metadata without component references to reduce retained memory
const STEP_META = [
  { number: 1, title: 'Basic Info', shortTitle: 'Info' },
  { number: 2, title: 'Team Assignment', shortTitle: 'Team' },
  { number: 3, title: 'Content Selection', shortTitle: 'Content' },
  { number: 4, title: 'Product Selection', shortTitle: 'Products' },
  { number: 5, title: 'Section Assignment', shortTitle: 'Sections' },
  { number: 6, title: 'Review & Finalize', shortTitle: 'Review' },
] as const;

interface DisposableComponent {
  dispose?: () => void;
}
const disposeComponent = (component: unknown): void => {
  const d = component as DisposableComponent | undefined;
  if (d && typeof d.dispose === 'function') d.dispose();
};

interface StepComponentProps {
  data: unknown;
  onUpdate: (data: unknown) => void;
  analytics?: unknown;
}

const getStepComponent = (stepNumber: number): React.ComponentType<StepComponentProps> => {
  switch (stepNumber) {
    case 1:
      return BasicInformationStep as unknown as React.ComponentType<StepComponentProps>;
    case 2:
      return TeamAssignmentStep as unknown as React.ComponentType<StepComponentProps>;
    case 3:
      return ContentSelectionStep as unknown as React.ComponentType<StepComponentProps>;
    case 4:
      return ProductSelectionStep as unknown as React.ComponentType<StepComponentProps>;
    case 5:
      return SectionAssignmentStep as unknown as React.ComponentType<StepComponentProps>;
    case 6:
      return ReviewStep as unknown as React.ComponentType<StepComponentProps>;
    default:
      return BasicInformationStep as unknown as React.ComponentType<StepComponentProps>;
  }
};

// Session storage keys
const WIZARD_SESSION_KEY = 'proposal-wizard-session';
const WIZARD_DRAFT_ID_KEY = 'posalpro_wizard_draft_id';
const AUTO_SAVE_INTERVAL = 15000; // 15 seconds

// ✅ FIXED: Remove unused variables and functions
const initializeExpertiseAreas = (): Record<ExpertiseArea, string> => ({
  [ExpertiseArea.TECHNICAL]: 'Technical',
  [ExpertiseArea.SECURITY]: 'Security',
  [ExpertiseArea.LEGAL]: 'Legal',
  [ExpertiseArea.PRICING]: 'Pricing',
  [ExpertiseArea.COMPLIANCE]: 'Compliance',
  [ExpertiseArea.BUSINESS_ANALYSIS]: 'Business Analysis',
});

const convertPriorityToEntity = (proposalPriority?: ProposalPriority): Priority => {
  switch (proposalPriority) {
    case ProposalPriority.LOW:
      return Priority.LOW;
    case ProposalPriority.MEDIUM:
      return Priority.MEDIUM;
    case ProposalPriority.HIGH:
      return Priority.HIGH;
    default:
      return Priority.MEDIUM;
  }
};

const ensureFutureDate = (dateValue?: Date | string | null): Date => {
  if (!dateValue) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    return futureDate;
  }

  const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
  const now = new Date();

  if (date <= now) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    return futureDate;
  }

  return date;
};

// Helper to validate UUID format
const isValidUUID = (value: string | undefined): boolean => {
  if (!value || value.length === 0 || value === 'undefined') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
};

interface ProposalWizardProps {
  onComplete?: (proposalData: ProposalWizardData & { proposalId: string }) => void;
  onCancel?: () => void;
  initialData?: Partial<ProposalWizardData>;
  editProposalId?: string; // For editing existing proposals
}

export function ProposalWizard({
  onComplete,
  onCancel,
  initialData,
  editProposalId,
}: ProposalWizardProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { state } = useResponsive();
  const { isMobile } = state;
  const router = useRouter();
  const errorHandlingService = ErrorHandlingService.getInstance();
  const { trackWizardStep, trackProposalCreation } = useProposalCreationAnalytics();

  // ✅ FIXED: Move useApiClient to component level to follow Rules of Hooks
  const apiClient = useApiClient();

  // ✅ CRITICAL: Memory optimization for large component
  const { optimizeComponentMemory, getMemoryUsageMB } = useMemoryOptimization({
    threshold: 220, // MB - reduce aggressiveness to avoid repeated cleanups in dev
    cleanupInterval: 0, // disable periodic monitoring to reduce listeners
    forceCleanupThreshold: 280, // MB
    enableGarbageCollection: true,
  });

  // Component state management
  const [currentStep, setCurrentStep] = useState<number>(() => {
    if (process.env.NODE_ENV === 'test') {
      const initial = (initialData as Partial<ProposalWizardData> | undefined)?.currentStep;
      if (typeof initial === 'number' && initial >= 1 && initial <= 6) return initial;
    }
    return 1;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Initialize only step1 eagerly; other steps are deferred until activation to reduce initial heap
  const [wizardData, setWizardData] = useState<ProposalWizardData>({
    step1: {
      client: {
        name: '',
        industry: '',
        contactPerson: '',
        contactEmail: '',
        contactPhone: '',
      },
      details: {
        title: '',
        dueDate: ensureFutureDate(),
        estimatedValue: 0,
        priority: ProposalPriority.MEDIUM,
      },
    },
    // The following steps are set to lightweight placeholders and will be hydrated on first activation
    step2: {
      teamLead: '',
      salesRepresentative: '',
      subjectMatterExperts: {} as Record<ExpertiseArea, string>,
      executiveReviewers: [],
    } as ProposalWizardStep2Data,
    step3: {
      selectedContent: [],
      searchHistory: [],
      crossStepValidation: {
        teamAlignment: true,
        productCompatibility: true,
        rfpCompliance: true,
        sectionCoverage: true,
      },
    } as ProposalWizardStep3Data,
    step4: {
      products: [],
      totalValue: 0,
      aiRecommendationsUsed: 0,
      searchHistory: [],
      crossStepValidation: {
        teamCompatibility: true,
        contentAlignment: true,
        budgetCompliance: true,
        timelineRealistic: true,
      },
    } as ProposalWizardStep4Data,
    step5: {
      sections: [],
      sectionAssignments: {},
    } as ProposalWizardStep5Data,
    step6: {
      finalValidation: {
        isValid: false,
        completeness: 0,
        issues: [],
        complianceChecks: [],
      },
      approvals: [],
    } as ProposalWizardStep6Data,
    currentStep: 1,
    isValid: [false, false, false, false, false, false],
    isDirty: false,
  });

  // ✅ FIX: Prevent duplicate loads in edit mode (StrictMode/dev re-invocations)
  const hasLoadedEditProposalRef = useRef<string | null>(null);
  const editingIdRef = useRef<string | null>(null);

  // Pin the editing ID once when provided so it does not disappear during navigation
  useEffect(() => {
    if (!editingIdRef.current && editProposalId) {
      editingIdRef.current = editProposalId;
    }
  }, [editProposalId]);

  // ✅ FIXED: Fix unsafe assignments with proper types
  const [stepValidation, setStepValidation] = useState<boolean[]>([
    false, // Step 1
    false, // Step 2
    false, // Step 3
    false, // Step 4
    false, // Step 5
    false, // Step 6
  ]);

  const [sessionRecovered, setSessionRecovered] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Workflow mode: controls which steps are visible
  const [workflowMode, setWorkflowMode] = useState<'simple' | 'pro' | 'advanced'>('advanced');

  const visibleSteps = useMemo<number[]>(() => {
    switch (workflowMode) {
      case 'simple':
        return [1, 4, 6];
      case 'pro':
        return [1, 2, 4, 6];
      case 'advanced':
      default:
        return [1, 2, 3, 4, 5, 6];
    }
  }, [workflowMode]);

  const currentVisibleIndex = useMemo(() => {
    return Math.max(0, visibleSteps.indexOf(currentStep));
  }, [visibleSteps, currentStep]);

  // Ensure currentStep always points to a visible step when mode changes
  useEffect(() => {
    if (!visibleSteps.includes(currentStep)) {
      setCurrentStep(visibleSteps[0]);
    }
  }, [visibleSteps, currentStep]);

  // Editing mode flag
  const isEditingMode = Boolean(editingIdRef.current || editProposalId);

  // ✅ FIXED: Add missing refs for auto-save functionality
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const lastAutoSave = useRef<number>(Date.now());

  // ✅ FIXED: Remove unnecessary conditional
  const DEBUG_MODE = process.env.NODE_ENV === 'development';

  // ✅ FIXED: Fix unsafe assignments with proper types
  // Remove generic top-level buckets; manage within each step as needed
  // Defer optional analytics/preferences/metrics state to steps to reduce initial heap

  // ✅ FIXED: Add missing dependencies to useCallback
  const handleStepValidation = useCallback((step: number, isValid: boolean) => {
    setStepValidation(prev => {
      const newValidation = [...prev];
      newValidation[step - 1] = isValid;
      return newValidation;
    });
  }, []);

  // Proactively dispose previous heavy step component cache to reduce heap usage on step change
  const goToStep = useCallback(
    (stepNumber: number) => {
      if (!visibleSteps.includes(stepNumber)) return;
      setCurrentStep(prev => {
        try {
          if (prev !== stepNumber) {
            switch (prev) {
              case 2:
                disposeComponent(TeamAssignmentStep);
                break;
              case 3:
                disposeComponent(ContentSelectionStep);
                break;
              case 4:
                disposeComponent(ProductSelectionStep);
                break;
              case 5:
                disposeComponent(SectionAssignmentStep);
                break;
              case 6:
                disposeComponent(ReviewStep);
                break;
            }
          }
        } catch {
          /* no-op: dispose failures are safe to ignore */
        }
        return stepNumber;
      });
    },
    [visibleSteps]
  );

  // ✅ FIXED: Add missing dependencies to useEffect
  useEffect(() => {
    // ✅ CRITICAL: Memory observation on mount (no error processing)
    const initialMemoryUsage = getMemoryUsageMB();

    if (initialMemoryUsage > 280) {
      optimizeComponentMemory('ProposalWizard');
    }
  }, [getMemoryUsageMB, optimizeComponentMemory]);

  // Dispose all lazy-loaded components and clear dynamic import tracker on unmount
  useEffect(() => {
    return () => {
      try {
        disposeComponent(TeamAssignmentStep);
        disposeComponent(ContentSelectionStep);
        disposeComponent(ProductSelectionStep);
        disposeComponent(SectionAssignmentStep);
        disposeComponent(ReviewStep);
        dynamicImportTracker.forceCleanup();
      } catch {
        /* no-op: cleanup on unmount */
      }
    };
  }, []);

  // Block rendering and network mutations until authenticated to avoid 401s during init
  if (typeof window !== 'undefined' && !isLoading && !isAuthenticated) {
    return (
      <div className="p-6 text-center text-gray-600">
        Authentication required. Please sign in and reopen the proposal.
      </div>
    );
  }

  // ✅ NEW: Load existing proposal data when in edit mode (single-run per ID)
  useEffect(() => {
    const loadExistingProposal = async () => {
      if (!editProposalId) return;

      // Guard against duplicate loads
      if (hasLoadedEditProposalRef.current === editProposalId) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        /* dev log removed */

        // ✅ PERFORMANCE: Use useApiClient pattern per CORE_REQUIREMENTS.md
        const response = await apiClient.get<{
          success: boolean;
          data: {
            id: string;
            title: string;
            description?: string;
            customerId: string;
            priority: string;
            dueDate?: string;
            value?: number;
            currency: string;
            customerName?: string;
            customerIndustry?: string;
            customerEmail?: string;
            contactEmail?: string;
            contactPerson?: string;
            contactPhone?: string;
            rfpReferenceNumber?: string;
            sections?: Array<{
              id: string;
              title: string;
              content: string;
              type: string;
              order: number;
            }>;
            products?: Array<{
              productId: string;
              quantity: number;
              unitPrice: number;
              discount?: number;
              name?: string;
            }>;
            assignedTo?: Array<{
              id: string;
              name: string;
              email: string;
            }>;
            metadata?: unknown;
          };
          message: string;
        }>(`/api/proposals/${editProposalId}`);

        if (!response.success || !response.data) {
          throw new Error('Failed to load proposal data');
        }

        const proposal = response.data;

        // Local helper interfaces for optional API fields not covered by the base type above
        interface ProposalApproval {
          currentStage?: string;
          status?: string;
          startedAt?: string;
          completedAt?: string;
        }
        interface ProposalSectionLite {
          id?: string;
          title?: string;
          assignedTo?: string;
          content?: unknown[];
          required?: boolean;
          status?: string;
          estimatedHours?: number;
        }
        interface ProposalExtra {
          approvals?: ProposalApproval[];
          teamAssignments?: {
            teamLead?: string;
            salesRepresentative?: string;
            subjectMatterExperts?: Record<string, string>;
          };
          wizardData?: {
            step2?: { subjectMatterExperts?: Record<string, string> };
            step3?: {
              selectedContent?: Array<{
                contentId: string;
                section: string;
                assignedTo?: string;
                customizations?: string[];
              }>;
              searchHistory?: string[];
            };
            step5?: {
              sections?: ProposalSectionLite[];
              sectionAssignments?: Record<string, string>;
            };
          };
          contentSelections?: Array<{
            contentId: string;
            section: string;
            assignedTo?: string;
            customizations?: string[];
          }>;
          sectionAssignments?: Record<string, string>;
          sections?: ProposalSectionLite[];
          assignedTo?: Array<{ id: string }>;
        }
        const pExtra = proposal as unknown as ProposalExtra;

        // Transform the loaded data into wizard format
        const loadedWizardData: ProposalWizardData = {
          step1: {
            client: {
              id: proposal.customerId || '',
              name: proposal.customerName || '',
              industry: proposal.customerIndustry || '',
              contactPerson: proposal.contactPerson || '',
              // Some endpoints return customerEmail, others contactEmail; prefer contactEmail when present
              contactEmail: proposal.contactEmail || proposal.customerEmail || '',
              contactPhone: proposal.contactPhone || '',
            },
            details: {
              title: proposal.title,
              dueDate: proposal.dueDate ? new Date(proposal.dueDate) : ensureFutureDate(),
              estimatedValue: proposal.value || 0,
              priority: (proposal.priority as ProposalPriority) || ProposalPriority.MEDIUM,
              description: proposal.description || '',
              // Populate RFP number from API if available; metadata merge later can override
              rfpReferenceNumber: proposal.rfpReferenceNumber || '',
            },
          },
          step2: {
            teamLead: '',
            salesRepresentative: '',
            subjectMatterExperts: {} as Record<ExpertiseArea, string>,
            executiveReviewers: [],
          },
          step3: {
            selectedContent: [],
            searchHistory: [],
          },
          step4: {
            products:
              proposal.products?.map(p => ({
                id: p.productId,
                name: p.name || '',
                included: true,
                quantity: p.quantity || 1,
                unitPrice: p.unitPrice || 0,
              })) || [],
          },
          step5: {
            sections:
              proposal.sections?.map(section => ({
                id: section.id,
                title: section.title,
                required: true,
                content: [],
                status: 'not_started' as const,
                estimatedHours: 0,
              })) || [],
            sectionAssignments: {},
          },
          step6: {
            finalValidation: {
              isValid: false,
              completeness: 0,
              issues: [],
              complianceChecks: [],
            },
            approvals: [],
          },
          currentStep: 1,
          isValid: [false, false, false, false, false, false],
          isDirty: false,
        };

        // Load additional data from metadata if available
        if (proposal.metadata) {
          // Unwrap Prisma-style update wrapper `{ set: ... }` if present
          interface PrismaSetWrapper<T> {
            set: T;
          }
          const rawMetadata = proposal.metadata as unknown;
          const metadata = (
            rawMetadata &&
            typeof rawMetadata === 'object' &&
            'set' in (rawMetadata as PrismaSetWrapper<unknown>)
              ? (rawMetadata as PrismaSetWrapper<unknown>).set
              : rawMetadata
          ) as Record<string, unknown> & {
            teamAssignments?: Record<string, unknown> & {
              smeAssignments?: Array<Record<string, unknown>>;
            };
            subjectMatterExperts?: Record<string, unknown>;
            smeAssignments?: Array<Record<string, unknown>>;
            wizardData?: Record<string, unknown> & {
              step1?: { client?: Record<string, unknown>; details?: Record<string, unknown> };
              step2?: { subjectMatterExperts?: Record<string, unknown> };
              step3?: {
                selectedContent?: Array<Record<string, unknown>>;
                searchHistory?: string[];
              };
              step4?: { products?: ProposalWizardData['step4']['products'] };
              step5?: {
                sections?: Array<Record<string, unknown>>;
                sectionAssignments?: Record<string, string>;
              };
              step6?: { finalValidation?: Partial<ProposalWizardData['step6']['finalValidation']> };
            };
            contentSelections?: Array<{
              contentId: string;
              section: string;
              assignedTo?: string;
              customizations?: string[];
            }>;
            validationData?: Partial<typeof loadedWizardData.step6.finalValidation>;
            sectionAssignments?: Record<string, string>;
          };
          /* dev log removed */

          if (metadata.teamAssignments) {
            /* dev log removed */
            loadedWizardData.step2 = {
              ...loadedWizardData.step2,
              ...metadata.teamAssignments,
            };
          }

          // ✅ Robust SME merge: support multiple metadata shapes
          const normalizeArea = (area: string): ExpertiseArea | string => {
            const key = (area || '').toUpperCase().replace(/\s+/g, '_');
            return (ExpertiseArea as unknown as Record<string, ExpertiseArea>)[key] ?? area;
          };

          // 1) If subjectMatterExperts provided directly at metadata root
          if (metadata.subjectMatterExperts && typeof metadata.subjectMatterExperts === 'object') {
            /* dev log removed */
            const mergedFromRoot = Object.fromEntries(
              Object.entries(metadata.subjectMatterExperts as Record<string, unknown>).map(
                ([k, v]) => [
                  normalizeArea(k),
                  typeof v === 'string' ? v : (v as { id?: string })?.id || '',
                ]
              )
            );
            loadedWizardData.step2.subjectMatterExperts = {
              ...(loadedWizardData.step2.subjectMatterExperts || {}),
              ...(mergedFromRoot as Record<string, string>),
            } as Record<ExpertiseArea, string>;
            /* dev log removed */
          }

          // 2) If teamAssignments contains smeAssignments array
          const smeArrayA = (
            metadata.teamAssignments as
              | {
                  smeAssignments?: Array<{
                    expertise?: string;
                    area?: string;
                    userId?: string;
                    user?: { id?: string };
                  }>;
                }
              | undefined
          )?.smeAssignments;
          if (Array.isArray(smeArrayA)) {
            /* dev log removed */
            const mapped = smeArrayA.reduce<Record<string, string>>((acc, item) => {
              const area = normalizeArea(item.expertise || item.area || '');
              const id = typeof item.userId === 'string' ? item.userId : item.user?.id || '';
              if (area && id) acc[area as string] = id;
              return acc;
            }, {});
            loadedWizardData.step2.subjectMatterExperts = {
              ...(loadedWizardData.step2.subjectMatterExperts || {}),
              ...mapped,
            } as Record<ExpertiseArea, string>;
            /* dev log removed */
          }

          // 3) If metadata has smeAssignments at root
          const smeArrayB = (
            metadata as {
              smeAssignments?: Array<{
                expertise?: string;
                area?: string;
                userId?: string;
                user?: { id?: string };
              }>;
            }
          ).smeAssignments;
          if (Array.isArray(smeArrayB)) {
            /* dev log removed */
            const mapped = smeArrayB.reduce<Record<string, string>>((acc, item) => {
              const area = normalizeArea(item.expertise || item.area || '');
              const id = typeof item.userId === 'string' ? item.userId : item.user?.id || '';
              if (area && id) acc[area as string] = id;
              return acc;
            }, {});
            loadedWizardData.step2.subjectMatterExperts = {
              ...(loadedWizardData.step2.subjectMatterExperts || {}),
              ...mapped,
            } as Record<ExpertiseArea, string>;
            /* dev log removed */
          }

          // 4) Wizard data step2 subjectMatterExperts
          const wdSME = metadata.wizardData?.step2?.subjectMatterExperts;
          if (wdSME && typeof wdSME === 'object') {
            /* dev log removed */
            loadedWizardData.step2.subjectMatterExperts = {
              ...(loadedWizardData.step2.subjectMatterExperts || {}),
              ...Object.fromEntries(
                Object.entries(wdSME as Record<string, unknown>).map(([k, v]) => {
                  const value =
                    typeof v === 'string' ? v : (v as { id?: string } | undefined)?.id || '';
                  return [normalizeArea(k), value];
                })
              ),
            } as Record<ExpertiseArea, string>;
            // debug removed
          }

          const hasContentSelections = Array.isArray(
            (metadata as { contentSelections?: unknown }).contentSelections
          );
          if (hasContentSelections) {
            const selections = (
              metadata as {
                contentSelections: Array<{
                  contentId: string;
                  section: string;
                  customizations?: string[];
                  assignedTo?: string;
                }>;
              }
            ).contentSelections;

            try {
              const hydrated = await Promise.all(
                selections.map(async sel => {
                  try {
                    const itemRes = await apiClient.get<ContentItem>(
                      `/api/content/${sel.contentId}`
                    );
                    const hasId = Boolean((itemRes as { id?: string } | null)?.id);
                    const item: ContentItem = hasId
                      ? {
                          id: itemRes.id,
                          title: itemRes.title,
                          type: itemRes.type,
                          tags: itemRes.tags || [],
                          content: itemRes.content || '',
                          relevanceScore: 0,
                          successRate: 0,
                          section: sel.section,
                        }
                      : {
                          id: sel.contentId,
                          title: 'Selected Content',
                          type: 'template',
                          tags: [],
                          content: '',
                          relevanceScore: 0,
                          successRate: 0,
                          section: sel.section,
                        };
                    return {
                      item,
                      section: sel.section,
                      customizations: sel.customizations || [],
                      assignedTo: sel.assignedTo || '',
                    };
                  } catch {
                    return {
                      item: {
                        id: sel.contentId,
                        title: 'Selected Content',
                        type: 'template',
                        tags: [],
                        content: '',
                        relevanceScore: 0,
                        successRate: 0,
                        section: sel.section,
                      } as ContentItem,
                      section: sel.section,
                      customizations: sel.customizations || [],
                      assignedTo: sel.assignedTo || '',
                    };
                  }
                })
              );
              loadedWizardData.step3.selectedContent = hydrated as SelectedContent[];
            } catch {
              loadedWizardData.step3.selectedContent = selections.map(s => ({
                item: {
                  id: s.contentId,
                  title: 'Selected Content',
                  type: 'template',
                  tags: [],
                  content: '',
                  relevanceScore: 0,
                  successRate: 0,
                  section: s.section,
                } as ContentItem,
                section: s.section,
                customizations: s.customizations || [],
                assignedTo: s.assignedTo || '',
              }));
            }

            // Optional: restore saved search history if present
            const searchHistory = (
              metadata as { wizardData?: { step3?: { searchHistory?: string[] } } }
            )?.wizardData?.step3?.searchHistory;
            if (searchHistory) {
              loadedWizardData.step3.searchHistory = searchHistory;
            }
          }

          // Fallbacks for Step 3: hydrate from top-level contentSelections or wizardData when metadata absent
          /* dev log removed */
          if (loadedWizardData.step3.selectedContent.length === 0) {
            const topLevelSelections = (
              proposal as {
                contentSelections?: Array<{
                  contentId: string;
                  section: string;
                  assignedTo?: string;
                  customizations?: string[];
                }>;
              }
            )?.contentSelections;
            const wdSelections = (
              proposal as {
                wizardData?: {
                  step3?: {
                    selectedContent?: Array<{
                      contentId: string;
                      section: string;
                      assignedTo?: string;
                      customizations?: string[];
                    }>;
                  };
                };
              }
            )?.wizardData?.step3?.selectedContent;
            /* dev log removed */
            const source =
              topLevelSelections && topLevelSelections.length > 0
                ? topLevelSelections
                : wdSelections || [];
            if (source.length) {
              try {
                const hydrated = await Promise.all(
                  source.map(async sel => {
                    try {
                      const itemRes = await apiClient.get<ContentItem>(
                        `/api/content/${sel.contentId}`
                      );
                      const hasId = Boolean((itemRes as { id?: string } | null)?.id);
                      const item: ContentItem = hasId
                        ? {
                            id: itemRes.id,
                            title: itemRes.title,
                            type: itemRes.type,
                            tags: itemRes.tags || [],
                            content: itemRes.content || '',
                            relevanceScore: 0,
                            successRate: 0,
                            section: sel.section,
                          }
                        : {
                            id: sel.contentId,
                            title: 'Selected Content',
                            type: 'template',
                            tags: [],
                            content: '',
                            relevanceScore: 0,
                            successRate: 0,
                            section: sel.section,
                          };
                      return {
                        item,
                        section: sel.section,
                        customizations: sel.customizations || [],
                        assignedTo: sel.assignedTo || '',
                      };
                    } catch {
                      return {
                        item: {
                          id: sel.contentId,
                          title: 'Selected Content',
                          type: 'template',
                          tags: [],
                          content: '',
                          relevanceScore: 0,
                          successRate: 0,
                          section: sel.section,
                        } as ContentItem,
                        section: sel.section,
                        customizations: sel.customizations || [],
                        assignedTo: sel.assignedTo || '',
                      };
                    }
                  })
                );
                loadedWizardData.step3.selectedContent = hydrated as SelectedContent[];
                /* dev log removed */
              } catch {
                // If hydration fails, fall back to mapping minimal SelectedContent using IDs and sections
                loadedWizardData.step3.selectedContent = source.map(s => ({
                  item: {
                    id: s.contentId,
                    title: 'Selected Content',
                    type: 'template',
                    tags: [],
                    content: '',
                    relevanceScore: 0,
                    successRate: 0,
                    section: s.section,
                  } as ContentItem,
                  section: s.section,
                  customizations: s.customizations || [],
                  assignedTo: s.assignedTo || '',
                }));
              }
            }
          }

          const validationData = (
            metadata as { validationData?: Partial<typeof loadedWizardData.step6.finalValidation> }
          ).validationData;
          if (validationData) {
            loadedWizardData.step6.finalValidation = {
              ...loadedWizardData.step6.finalValidation,
              ...validationData,
            };
          }

          // Enrich step1 fields from stored wizard metadata when present
          const metadataStep1Client = (
            metadata as { wizardData?: { step1?: { client?: unknown } } }
          )?.wizardData?.step1?.client as
            | {
                contactPerson?: string;
                contactEmail?: string;
                contactPhone?: string;
                id?: string;
                name?: string;
              }
            | undefined;
          const metadataStep1Details = (
            metadata as { wizardData?: { step1?: { details?: unknown } } }
          )?.wizardData?.step1?.details as
            | {
                title?: string;
                description?: string;
                priority?: string;
                rfpReferenceNumber?: string;
                estimatedValue?: number;
                dueDate?: Date | string | null;
              }
            | undefined;
          if (metadataStep1Client) {
            const current = loadedWizardData.step1.client;
            loadedWizardData.step1.client = {
              ...current,
              contactPerson: String(
                metadataStep1Client.contactPerson ?? current.contactPerson ?? ''
              ),
              contactEmail: String(metadataStep1Client.contactEmail ?? current.contactEmail ?? ''),
              contactPhone: String(metadataStep1Client.contactPhone ?? current.contactPhone ?? ''),
              id: (metadataStep1Client.id as string | undefined) ?? current.id,
              name: (metadataStep1Client.name as string | undefined) ?? current.name,
            };
          }
          if (metadataStep1Details) {
            const normalizePriority = (p?: string) => {
              const v = (p || '').toLowerCase();
              return v === 'high' || v === 'medium' || v === 'low'
                ? (v as ProposalPriority)
                : (loadedWizardData.step1.details.priority as ProposalPriority);
            };
            loadedWizardData.step1.details = {
              ...loadedWizardData.step1.details,
              title: metadataStep1Details.title || loadedWizardData.step1.details.title || '',
              description:
                metadataStep1Details.description ||
                loadedWizardData.step1.details.description ||
                '',
              priority: normalizePriority(metadataStep1Details.priority),
              rfpReferenceNumber:
                metadataStep1Details.rfpReferenceNumber ||
                loadedWizardData.step1.details.rfpReferenceNumber ||
                '',
              estimatedValue:
                metadataStep1Details.estimatedValue ??
                loadedWizardData.step1.details.estimatedValue ??
                0,
              dueDate:
                metadataStep1Details.dueDate ?? loadedWizardData.step1.details.dueDate ?? null,
            } as typeof loadedWizardData.step1.details;
          }

          // Ensure priority is also hydrated from top-level scalar if present
          const topLevelPriority = (proposal as unknown as { priority?: string }).priority;
          if (topLevelPriority) {
            const v = topLevelPriority.toLowerCase();
            if (v === 'high' || v === 'medium' || v === 'low') {
              loadedWizardData.step1.details.priority = v as ProposalPriority;
            }
          }

          // Merge products from metadata if present (e.g., richer product info)
          if (
            metadata.wizardData?.step4?.products &&
            Array.isArray(metadata.wizardData.step4.products) &&
            metadata.wizardData.step4.products.length > 0
          ) {
            loadedWizardData.step4.products = metadata.wizardData.step4
              .products as ProposalWizardData['step4']['products'];
          }

          // Auto-heal: If step4 products are still empty but relation products exist,
          // mirror them into wizardData and persist so future edits are consistent
          const step4Empty =
            !loadedWizardData.step4.products || loadedWizardData.step4.products.length === 0;
          const relationHasProducts =
            Array.isArray(proposal.products) && proposal.products.length > 0;
          if (step4Empty && relationHasProducts) {
            try {
              const mirrored = (proposal.products || []).map(p => ({
                id: p.productId,
                included: true,
                quantity: p.quantity || 1,
                unitPrice: p.unitPrice || 0,
              }));
              loadedWizardData.step4.products = mirrored as ProposalWizardData['step4']['products'];
              // Persist lightweight patch; ignore errors to avoid blocking UI
              await apiClient.patch(`/api/proposals/${editProposalId}`, {
                metadata: { wizardData: { step4: { products: mirrored } } },
              });
            } catch {
              // no-op
            }
          }

          // Merge sections (step 5) from metadata for full fidelity (assignments, hours, priorities)
          if (
            metadata.wizardData?.step5?.sections &&
            Array.isArray(metadata.wizardData.step5.sections) &&
            metadata.wizardData.step5.sections.length > 0
          ) {
            const metaSections = (metadata.wizardData.step5.sections ?? []) as Array<
              Partial<ProposalWizardData['step5']['sections'][number]>
            >;
            loadedWizardData.step5.sections = metaSections.map((s, index) => ({
              id: s.id || loadedWizardData.step5.sections[index]?.id || String(index + 1),
              title:
                s.title || loadedWizardData.step5.sections[index]?.title || `Section ${index + 1}`,
              required: s.required ?? true,
              content: (s.content as unknown as ProposalSection['content']) || [],
              status: (s.status as ProposalSection['status']) || 'not_started',
              estimatedHours: s.estimatedHours ?? 0,
            }));
          }
          if (metadata.wizardData?.step5?.sectionAssignments) {
            loadedWizardData.step5.sectionAssignments = metadata.wizardData.step5
              .sectionAssignments as Record<string, string>;
          }

          // Also support sectionAssignments at metadata root for compatibility
          if (metadata.sectionAssignments) {
            loadedWizardData.step5.sectionAssignments = metadata.sectionAssignments as Record<
              string,
              string
            >;
          }

          // Also check top-level wizardData (API returns it at top level)
          if (
            (proposal as unknown as { wizardData?: { step5?: { sections?: unknown[] } } })
              .wizardData?.step5?.sections?.length
          ) {
            const metaSections = ((
              proposal as unknown as {
                wizardData?: {
                  step5?: {
                    sections?: Array<Partial<ProposalWizardData['step5']['sections'][number]>>;
                  };
                };
              }
            ).wizardData?.step5?.sections ?? []) as Array<
              Partial<ProposalWizardData['step5']['sections'][number]>
            >;
            loadedWizardData.step5.sections = metaSections.map((s, index) => ({
              id: s.id || loadedWizardData.step5.sections[index]?.id || String(index + 1),
              title:
                s.title || loadedWizardData.step5.sections[index]?.title || `Section ${index + 1}`,
              required: s.required ?? true,
              content: (s.content as ProposalSection['content'] | undefined) || [],
              status: (s.status as ProposalSection['status']) || 'not_started',
              estimatedHours: s.estimatedHours ?? 0,
            }));
          }
          if (
            (
              proposal as unknown as {
                wizardData?: { step5?: { sectionAssignments?: Record<string, string> } };
              }
            )?.wizardData?.step5?.sectionAssignments
          ) {
            loadedWizardData.step5.sectionAssignments = (
              proposal as unknown as {
                wizardData: { step5: { sectionAssignments: Record<string, string> } };
              }
            ).wizardData.step5.sectionAssignments as Record<string, string>;
          }

          // Merge step6 additional data if available
          if (metadata.wizardData?.step6?.finalValidation) {
            loadedWizardData.step6.finalValidation = {
              ...loadedWizardData.step6.finalValidation,
              ...metadata.wizardData.step6.finalValidation,
            };
          }
        }

        // If no metadata team assignments but API includes assignedTo, derive simple defaults
        if (
          (!loadedWizardData.step2.teamLead || !loadedWizardData.step2.salesRepresentative) &&
          Array.isArray(pExtra.assignedTo) &&
          pExtra.assignedTo.length > 0
        ) {
          const members = pExtra.assignedTo as Array<{ id: string }>;
          loadedWizardData.step2.teamLead = loadedWizardData.step2.teamLead || members[0]?.id || '';
          loadedWizardData.step2.salesRepresentative =
            loadedWizardData.step2.salesRepresentative || members[1]?.id || members[0]?.id || '';
        }

        // Map API approvals into step6.approvals (best-effort)
        if (Array.isArray(pExtra.approvals) && pExtra.approvals.length > 0) {
          loadedWizardData.step6.approvals = pExtra.approvals.map(a => ({
            reviewer: a.currentStage || 'Reviewer',
            approved: a.status === 'COMPLETED' || a.status === 'APPROVED',
            comments: '',
            timestamp: a.completedAt
              ? new Date(a.completedAt)
              : a.startedAt
                ? new Date(a.startedAt)
                : undefined,
          }));
        }

        // Map API team assignments into step2 data
        // This is already handled above in the metadata processing section, so removing duplicate code

        // Fallbacks: merge top-level fields when metadata is absent or incomplete
        const topLevelTeam = pExtra.teamAssignments;
        if (topLevelTeam && typeof topLevelTeam === 'object') {
          if (topLevelTeam.teamLead && !loadedWizardData.step2.teamLead) {
            loadedWizardData.step2.teamLead = topLevelTeam.teamLead as string;
          }
          if (topLevelTeam.salesRepresentative && !loadedWizardData.step2.salesRepresentative) {
            loadedWizardData.step2.salesRepresentative = topLevelTeam.salesRepresentative as string;
          }
          if (
            topLevelTeam.subjectMatterExperts &&
            typeof topLevelTeam.subjectMatterExperts === 'object'
          ) {
            loadedWizardData.step2.subjectMatterExperts = {
              ...(loadedWizardData.step2.subjectMatterExperts || {}),
              ...(topLevelTeam.subjectMatterExperts as Record<string, string>),
            } as Record<ExpertiseArea, string>;
          }
        }

        const topLevelWdSme = pExtra.wizardData?.step2?.subjectMatterExperts;
        if (topLevelWdSme && typeof topLevelWdSme === 'object') {
          loadedWizardData.step2.subjectMatterExperts = {
            ...(loadedWizardData.step2.subjectMatterExperts || {}),
            ...(topLevelWdSme as Record<string, string>),
          } as Record<ExpertiseArea, string>;
        }

        // Metadata-independent fallbacks to ensure hydration even when proposal.metadata is absent
        if (loadedWizardData.step3.selectedContent.length === 0) {
          try {
            const topLevelSelections = pExtra.contentSelections;
            const wdSelections = pExtra.wizardData?.step3?.selectedContent;
            const source =
              topLevelSelections && topLevelSelections.length > 0
                ? topLevelSelections
                : wdSelections || [];
            if (source.length) {
              console.log('[ProposalWizard] (global) Step3 fallback source size:', source.length);
              const hydrated = await Promise.all(
                source.map(async sel => {
                  try {
                    const itemRes = await apiClient.get<ContentItem>(
                      `/api/content/${sel.contentId}`
                    );
                    const item: ContentItem =
                      itemRes && (itemRes as ContentItem).id
                        ? {
                            id: itemRes.id,
                            title: itemRes.title,
                            type: itemRes.type,
                            tags: itemRes.tags || [],
                            content: itemRes.content || '',
                            relevanceScore: 0,
                            successRate: 0,
                            section: sel.section,
                          }
                        : {
                            id: sel.contentId,
                            title: 'Selected Content',
                            type: 'template',
                            tags: [],
                            content: '',
                            relevanceScore: 0,
                            successRate: 0,
                            section: sel.section,
                          };
                    return {
                      item,
                      section: sel.section,
                      customizations: sel.customizations || [],
                      assignedTo: sel.assignedTo || '',
                    };
                  } catch {
                    return {
                      item: {
                        id: sel.contentId,
                        title: 'Selected Content',
                        type: 'template',
                        tags: [],
                        content: '',
                        relevanceScore: 0,
                        successRate: 0,
                        section: sel.section,
                      } as ContentItem,
                      section: sel.section,
                      customizations: sel.customizations || [],
                      assignedTo: sel.assignedTo || '',
                    };
                  }
                })
              );
              loadedWizardData.step3.selectedContent = hydrated as SelectedContent[];
              // debug removed
            }
          } catch {
            /* no-op: content hydration fallback failed for one item */
          }
        }

        if (loadedWizardData.step5.sections.length === 0) {
          const topLevelSections = pExtra.sections;
          const wdSections = pExtra.wizardData?.step5?.sections as
            | ProposalSectionLite[]
            | undefined;
          const source =
            topLevelSections && topLevelSections.length > 0 ? topLevelSections : wdSections || [];
          if (source.length) {
            console.log('[ProposalWizard] (global) Step5 fallback source size:', source.length);
            loadedWizardData.step5.sections = source.map(
              (s, index: number): ProposalSection => ({
                id: s.id || String(index + 1),
                title: s.title || `Section ${index + 1}`,
                required: s.required ?? true,
                content: (s.content as ProposalSection['content'] | undefined) || [],
                status: (s.status as ProposalSection['status']) || 'not_started',
                estimatedHours: s.estimatedHours ?? 0,
              })
            );
          }
        }
        // Global fallbacks for Step 5 sectionAssignments (multi-source merge)
        if (
          !loadedWizardData.step5.sectionAssignments ||
          Object.keys(loadedWizardData.step5.sectionAssignments).length === 0
        ) {
          // The API returns wizardData at top level, not nested under metadata
          const metadataAssignments = pExtra.wizardData?.step5?.sectionAssignments as
            | Record<string, string>
            | undefined;
          const metadataAssignmentsRoot = (
            proposal.metadata as unknown as
              | { sectionAssignments?: Record<string, string> }
              | undefined
          )?.sectionAssignments;
          const wdAssignments = pExtra.wizardData?.step5?.sectionAssignments as
            | Record<string, string>
            | undefined;
          const topLevelAssignments = pExtra.sectionAssignments as
            | Record<string, string>
            | undefined;

          // debug removed

          const source =
            metadataAssignmentsRoot || metadataAssignments || wdAssignments || topLevelAssignments;
          if (source && Object.keys(source).length > 0) {
            loadedWizardData.step5.sectionAssignments = {
              ...(loadedWizardData.step5.sectionAssignments || {}),
              ...source,
            };
            // debug removed
          }
        }

        // Final fallback for Step 5: derive sections from Step 3 selectedContent when none provided
        if (!loadedWizardData.step5.sections?.length) {
          const sel = loadedWizardData.step3.selectedContent || [];
          if (sel.length > 0) {
            const uniqueSections = Array.from(new Set(sel.map(s => s.section).values()));
            if (uniqueSections.length > 0) {
              loadedWizardData.step5.sections = uniqueSections.map(
                (title: string, index: number) => ({
                  id: String(index + 1),
                  title: title || `Section ${index + 1}`,
                  required: true,
                  content: [],
                  // assignedTo handled via sectionAssignments map for consistency
                  status: 'not_started' as const,
                  estimatedHours: 0,
                })
              );
              // debug removed
            }
          }
        }

        // If assignments still empty, derive from loaded Step 5 sections themselves (assignedTo fields)
        if (
          (!loadedWizardData.step5.sectionAssignments ||
            Object.keys(loadedWizardData.step5.sectionAssignments).length === 0) &&
          Array.isArray(loadedWizardData.step5.sections) &&
          loadedWizardData.step5.sections.length > 0
        ) {
          const derivedFromStep5Sections: Record<string, string> = {};
          const normalize = (s: string) =>
            (s || '')
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, ' ')
              .trim();
          for (const s of loadedWizardData.step5.sections) {
            // Prefer sectionAssignments; sections no longer carry string assignedTo here
            // This block remains for backward compatibility if sections array had string assignedTo
            const possibleAssignee = (s as unknown as { assignedTo?: string }).assignedTo;
            if (typeof possibleAssignee === 'string' && possibleAssignee.trim().length > 0) {
              if (s.id) derivedFromStep5Sections[String(s.id)] = possibleAssignee;
              if (s.title) derivedFromStep5Sections[normalize(String(s.title))] = possibleAssignee;
            }
          }
          if (Object.keys(derivedFromStep5Sections).length > 0) {
            loadedWizardData.step5.sectionAssignments = {
              ...(loadedWizardData.step5.sectionAssignments || {}),
              ...derivedFromStep5Sections,
            };
            // debug removed
          }
        }

        // If assignments still empty, derive from top-level sections and Step 3 selections
        if (
          !loadedWizardData.step5.sectionAssignments ||
          Object.keys(loadedWizardData.step5.sectionAssignments).length === 0
        ) {
          const derivedFromTopLevel: Record<string, string> = {};
          const topLevelSections = (
            proposal as unknown as {
              sections?: Array<{ id?: string; title?: string; assignedTo?: string }>;
            }
          )?.sections;
          if (Array.isArray(topLevelSections)) {
            for (const s of topLevelSections) {
              if (s?.assignedTo) {
                if (s.id) derivedFromTopLevel[s.id] = s.assignedTo;
                if (s.title) derivedFromTopLevel[s.title] = s.assignedTo;
              }
            }
          }

          const derivedFromStep3: Record<string, string> = {};
          const sel = loadedWizardData.step3.selectedContent || [];
          if (Array.isArray(sel) && sel.length > 0) {
            for (const item of sel as Array<{ assignedTo?: string; section?: string }>) {
              if (item.assignedTo && item.section) {
                derivedFromStep3[item.section] = item.assignedTo;
              }
            }
          }

          const mergedDerived = { ...derivedFromTopLevel, ...derivedFromStep3 };
          if (Object.keys(mergedDerived).length > 0) {
            loadedWizardData.step5.sectionAssignments = {
              ...(loadedWizardData.step5.sectionAssignments || {}),
              ...mergedDerived,
            };
            // debug removed
          }
        }

        // debug removed

        // debug removed

        setWizardData(loadedWizardData);
        /* dev log removed */
        hasLoadedEditProposalRef.current = editProposalId;

        // Update step validation based on loaded data
        const newStepValidation = [
          !!(loadedWizardData.step1.client.name && loadedWizardData.step1.details.title),
          !!(loadedWizardData.step2.teamLead || loadedWizardData.step2.salesRepresentative),
          loadedWizardData.step3.selectedContent.length > 0,
          loadedWizardData.step4.products.length > 0,
          loadedWizardData.step5.sections.length > 0,
          loadedWizardData.step6.finalValidation.isValid,
        ];
        setStepValidation(newStepValidation);

        // In edit mode, show Step 4 first for quick product/total adjustments
        if (isEditingMode && currentStep === 1) {
          setCurrentStep(4);
        }
      } catch (error) {
        console.error('[ProposalWizard] Failed to load existing proposal:', error);

        // ✅ STANDARDIZED ERROR HANDLING: Use ErrorHandlingService per CORE_REQUIREMENTS.md
        const standardError = errorHandlingService.processError(
          error,
          'Failed to load existing proposal data. Please try again.',
          ErrorCodes.API.REQUEST_FAILED,
          {
            component: 'ProposalWizard',
            operation: 'loadExistingProposal',
            editProposalId,
            userId: user?.id,
          }
        );

        // Set user-friendly error message
        setError(errorHandlingService.getUserFriendlyMessage(standardError));
      } finally {
        setLoading(false);
      }
    };

    loadExistingProposal();
  }, [editProposalId]);

  // Enhanced proposal creation handler with proper error handling
  const handleCreateProposal = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (loading) {
      /* dev log removed */
      return;
    }

    setLoading(true);
    setError(null);

    try {
      /* dev log removed */

      // Track proposal creation start
      trackProposalCreation({
        proposalId: 'mobile_wizard_access',
        creationTime: Date.now(),
        complexityScore: 0,
        estimatedTimeline: 0,
        teamAssignmentTime: 0,
        coordinationSetupTime: 0,
        teamSize: 0,
        aiSuggestionsAccepted: 0,
        manualAssignments: 0,
        assignmentAccuracy: 0,
        contentSuggestionsUsed: 0,
        validationIssuesFound: 0,
        wizardCompletionRate: 0,
        stepCompletionTimes: [],
        userStory: ['US-3.1', 'US-4.1'],
        hypotheses: ['H7', 'H3'],
      });

      // More defensive validation with helpful error messages
      const validationErrors: string[] = [];

      if (!wizardData.step1?.client?.name) {
        validationErrors.push('Customer name is required');
      }

      if (!wizardData.step1?.details?.title) {
        validationErrors.push('Proposal title is required');
      }

      if (!wizardData.step1?.details?.dueDate) {
        validationErrors.push('Due date is required');
      }

      // Validate customer ID is present and valid (handle both UUID and string/number IDs)
      const customerIdFromStep1 = wizardData.step1?.client?.id;
      const customerName = wizardData.step1?.client?.name?.trim();

      if (!customerIdFromStep1 || !customerName) {
        validationErrors.push('Valid customer selection is required');
      } else {
        // Ensure customer ID is valid (UUID, number, or non-empty string)
        const isValidId =
          (typeof customerIdFromStep1 === 'string' &&
            customerIdFromStep1.length > 0 &&
            customerIdFromStep1 !== 'undefined') ||
          (typeof customerIdFromStep1 === 'number' && customerIdFromStep1 > 0);

        if (!isValidId) {
          validationErrors.push('Valid customer selection is required');
        }
      }

      if (validationErrors.length > 0) {
        throw new StandardError({
          message: `Please complete the following required fields: ${validationErrors.join(', ')}`,
          code: ErrorCodes.VALIDATION.INVALID_INPUT,
          metadata: {
            component: 'ProposalWizard',
            operation: 'handleCreateProposal',
            validationErrors,
            step1Data: wizardData.step1,
            userId: user?.id,
          },
        });
      }

      // Ensure user is authenticated
      if (!user?.id) {
        throw new StandardError({
          message: 'You must be logged in to create a proposal.',
          code: ErrorCodes.AUTH.UNAUTHORIZED,
          metadata: {
            component: 'ProposalWizard',
            operation: 'handleCreateProposal',
          },
        });
      }

      // Prepare proposal data for creation - matching CreateProposalData interface
      const smartDescription =
        wizardData.step1.details.description?.trim() ||
        `${wizardData.step1.details.title} for ${wizardData.step1.client.name} - A comprehensive consulting proposal designed to meet client requirements and deliver exceptional value through our proven methodologies and expertise.`;

      // ✅ FIXED: Transform data to match API schema exactly
      const customerId = wizardData.step1.client.id;

      // debug removed

      // ✅ ENHANCED VALIDATION: Ensure customer ID is valid before proceeding
      if (!customerId || typeof customerId !== 'string' || customerId.trim().length === 0) {
        throw new StandardError({
          message: 'Please select a valid customer before creating the proposal.',
          code: ErrorCodes.VALIDATION.INVALID_INPUT,
          metadata: {
            component: 'ProposalWizard',
            operation: 'handleCreateProposal',
            customerId,
            customerIdType: typeof customerId,
            step1Data: wizardData.step1,
          },
        });
      }

      // ✅ ENHANCED: Send all wizard data to database with proper value logic
      // Calculate actual value based on step 4 products
      const hasProducts =
        wizardData.step4.products &&
        wizardData.step4.products.some(p => p.included !== false) &&
        wizardData.step4.products.length > 0;

      const step4TotalValue = hasProducts
        ? wizardData.step4.products
            .filter(p => p.included !== false)
            .reduce(
              (sum, product) =>
                sum + (product.totalPrice || (product.quantity || 1) * (product.unitPrice || 0)),
              0
            )
        : 0;

      const step1EstimatedValue = wizardData.step1.details.estimatedValue || 0;

      // Logic: If no products and step4 total is 0, use estimated value from step1
      // Otherwise, use actual value from step4
      const shouldUseEstimated = !hasProducts && step4TotalValue === 0 && step1EstimatedValue > 0;
      const finalProposalValue = shouldUseEstimated ? step1EstimatedValue : step4TotalValue;

      const proposalData = {
        title: wizardData.step1.details.title,
        description: smartDescription,
        customerId: customerId.trim(),
        priority: (wizardData.step1.details.priority || 'MEDIUM').toUpperCase(),
        dueDate: wizardData.step1.details.dueDate
          ? new Date(wizardData.step1.details.dueDate).toISOString()
          : undefined,
        // Use the calculated final value
        ...(finalProposalValue > 0 && {
          value: finalProposalValue,
        }),
        currency: 'USD',
        // Persist mandatory contact info with the proposal (API stores in metadata)
        contactPerson: wizardData.step1.client.contactPerson,
        contactEmail: wizardData.step1.client.contactEmail,
        contactPhone: wizardData.step1.client.contactPhone,

        // ✅ STEP 2: Team assignments
        teamAssignments: {
          teamLead: wizardData.step2.teamLead || '',
          salesRepresentative: wizardData.step2.salesRepresentative || '',
          subjectMatterExperts: wizardData.step2.subjectMatterExperts || {},
          executiveReviewers: wizardData.step2.executiveReviewers || [],
        },

        // ✅ STEP 3: Content selections with Step 5 assignments
        contentSelections:
          wizardData.step3.selectedContent.map(content => {
            // Find the corresponding section assignment from Step 5
            const sectionAssignment =
              wizardData.step5.sectionAssignments[content.item.id] ||
              wizardData.step5.sections.find(s => s.title === content.section)?.assignedTo;

            return {
              contentId: content.item.id,
              section: content.section,
              customizations: content.customizations || [],
              assignedTo: sectionAssignment || content.assignedTo || '',
            };
          }) || [],

        // ✅ STEP 4: Products
        ...(wizardData.step4.products &&
          wizardData.step4.products.length > 0 && {
            products: wizardData.step4.products.map(product => ({
              productId: product.id,
              quantity: product.quantity || 1,
              unitPrice: product.unitPrice || 0,
              discount: 0, // Default discount
            })),
          }),

        // ✅ STEP 5: Sections (schema requires content:string; restrict to allowed fields)
        ...(wizardData.step5.sections &&
          wizardData.step5.sections.length > 0 && {
            sections: wizardData.step5.sections.map((section, index) => {
              const raw = (section as { content?: unknown }).content;
              const asString = typeof raw === 'string' ? raw : '';
              return {
                title: section.title || `Section ${index + 1}`,
                content: asString,
                type: 'TEXT' as const,
                order: index + 1,
              };
            }),
          }),

        // ✅ METADATA: Persist SMEs, content selections, and full section details for reliable reloads
        metadata: {
          subjectMatterExperts: wizardData.step2.subjectMatterExperts || {},
          contentSelections:
            wizardData.step3.selectedContent.map(sc => {
              // Find the corresponding section assignment from Step 5
              const sectionAssignment =
                wizardData.step5.sectionAssignments[sc.item.id] ||
                wizardData.step5.sections.find(s => s.title === sc.section)?.assignedTo;

              return {
                contentId: sc.item.id,
                section: sc.section,
                customizations: sc.customizations || [],
                assignedTo: sectionAssignment || sc.assignedTo || '',
              };
            }) || [],
          sectionAssignments: wizardData.step5.sectionAssignments || {},
          wizardData: {
            step5: {
              sections: wizardData.step5.sections.map((s, i) => ({
                id: (s as { id?: string }).id || String(i + 1),
                title: s.title || `Section ${i + 1}`,
                required: s.required ?? true,
                content: s.content || [],
                assignedTo: (s as { assignedTo?: string }).assignedTo,
                status: (s as { status?: ProposalSection['status'] }).status || 'not_started',
                estimatedHours: (s as { estimatedHours?: number }).estimatedHours ?? 0,
                dueDate: (s as { dueDate?: string | Date | null }).dueDate || null,
                priority: (s as { priority?: 'LOW' | 'MEDIUM' | 'HIGH' }).priority || 'MEDIUM',
              })),
              // Also persist assignments under wizardData for reliable hydration
              sectionAssignments: wizardData.step5.sectionAssignments || {},
            },
          },
        },

        // ✅ STEP 6: Validation data
        validationData: {
          isValid: wizardData.step6.finalValidation.isValid || false,
          completeness: wizardData.step6.finalValidation.completeness || 0,
          issues: wizardData.step6.finalValidation.issues || [],
          complianceChecks: wizardData.step6.finalValidation.complianceChecks || [],
        },

        // ✅ Analytics data
        analyticsData: {
          stepCompletionTimes: [],
          wizardCompletionRate: 1.0,
          complexityScore: 2, // Default medium complexity
          teamSize: Object.keys(wizardData.step2?.subjectMatterExperts || {}).length,
          contentSuggestionsUsed: wizardData.step3?.selectedContent?.length || 0,
          validationIssuesFound: wizardData.step6?.finalValidation?.issues?.length || 0,
        },

        // ✅ Cross-step validation
        crossStepValidation: {
          teamCompatibility: true,
          contentAlignment: true,
          budgetCompliance: true,
          timelineRealistic: true,
        },
      };

      // ✅ CRITICAL DEBUG: Log the complete proposal data being sent
      // debug removed
      /* dev log removed */
      /* dev log removed */
      /* dev log removed */

      // Create or update depending on edit mode so the proposal ID doesn't change when editing
      const pinnedEditId = editingIdRef.current || editProposalId || null;
      const isEditing = Boolean(pinnedEditId);

      const step1Client = wizardData.step1.client;
      const step1Details = wizardData.step1.details;
      const step2 = wizardData.step2;
      const step3 = wizardData.step3;
      const step5 = wizardData.step5;
      const step6 = wizardData.step6;

      const response = isEditing
        ? await apiClient.patch<{
            success: boolean;
            data: { id: string; title: string; status: string };
            message: string;
          }>(`/api/proposals/${pinnedEditId}` as string, {
            // Send scalar fields + top-level wizard metadata so backend merges correctly
            title: step1Details.title,
            description: smartDescription,
            // top-level scalar stays UPPERCASE for backend enum
            priority: (step1Details.priority || 'medium').toString().toUpperCase(),
            value: step1Details.estimatedValue || undefined,
            dueDate: step1Details.dueDate
              ? new Date(step1Details.dueDate).toISOString()
              : undefined,
            rfpReferenceNumber: step1Details.rfpReferenceNumber ?? undefined,
            // Persist selected customer at the proposal level
            customerId: step1Client.id ?? undefined,

            // Step 2: Team assignments (top-level as expected by PATCH schema)
            teamAssignments: {
              teamLead: step2.teamLead || undefined,
              salesRepresentative: step2.salesRepresentative || undefined,
              subjectMatterExperts: step2.subjectMatterExperts || {},
              executiveReviewers: step2.executiveReviewers || undefined,
            },

            // Step 3: Content selections (top-level array)
            contentSelections: step3.selectedContent.map(sc => {
              const fromMap = step5.sectionAssignments[sc.item.id];
              const fromSection = step5.sections.find(s => s.title === sc.section)?.assignedTo?.id;
              return {
                contentId: sc.item.id,
                section: sc.section,
                customizations: sc.customizations || [],
                assignedTo: fromMap || fromSection || sc.assignedTo || '',
              };
            }),

            // Step 5: Section assignees map (top-level)
            sectionAssignments: step5.sectionAssignments || {},

            // Redundant metadata payload to support backend fallbacks when present
            metadata: {
              // Mirror wizardData snapshot
              wizardData: {
                // ✅ Step 1: Persist client and details for reliable hydration
                step1: {
                  client: {
                    contactPerson: step1Client.contactPerson || '',
                    contactEmail: step1Client.contactEmail || '',
                    contactPhone: step1Client.contactPhone || '',
                    // keep a reference to the selected customer
                    id: step1Client.id || undefined,
                    name: step1Client.name || undefined,
                  },
                  details: {
                    title: step1Details.title || '',
                    description: smartDescription || '',
                    // store lowercase in metadata snapshot for UI hydration
                    priority: (step1Details.priority || 'medium').toString().toLowerCase(),
                    rfpReferenceNumber: step1Details.rfpReferenceNumber || '',
                    estimatedValue: step1Details.estimatedValue || 0,
                    dueDate: (step1Details.dueDate as unknown) || null,
                  },
                },
                step2: {
                  subjectMatterExperts: step2.subjectMatterExperts || {},
                },
                step3: {
                  selectedContent: step3.selectedContent.map(sc => ({
                    id: sc.item.id,
                    section: sc.section,
                    customizations: sc.customizations || [],
                    assignedTo: step5.sectionAssignments[sc.item.id] || sc.assignedTo || '',
                  })),
                },
                // ✅ Step 4: Persist selected products for hydration
                step4: {
                  products: wizardData.step4.products || [],
                },
                step5: {
                  sections: step5.sections.map((s, i) => ({
                    id: s.id || String(i + 1),
                    title: s.title || `Section ${i + 1}`,
                    required: s.required ?? true,
                    content: s.content || [],
                    assignedTo: s.assignedTo?.id,
                    status: s.status || 'not_started',
                    estimatedHours: s.estimatedHours ?? 0,
                    dueDate: (s.dueDate as unknown) || null,
                  })),
                  sectionAssignments: step5.sectionAssignments || {},
                },
              },
              // Mirror content selections at metadata root for compatibility
              contentSelections: step3.selectedContent.map(sc => {
                const fromMap = step5.sectionAssignments[sc.item.id];
                const fromSection = step5.sections.find(s => s.title === sc.section)?.assignedTo
                  ?.id;
                return {
                  contentId: sc.item.id,
                  section: sc.section,
                  customizations: sc.customizations || [],
                  assignedTo: fromMap || fromSection || sc.assignedTo || '',
                };
              }),
              // Mirror section assignments for compatibility
              sectionAssignments: step5.sectionAssignments || {},
            },

            // Wizard snapshot for deep merge in backend metadata
            wizardData: {
              // Mirror step1 for backend deep-merge and future-proofing
              step1: {
                client: {
                  contactPerson: step1Client.contactPerson || '',
                  contactEmail: step1Client.contactEmail || '',
                  contactPhone: step1Client.contactPhone || '',
                  id: step1Client.id || undefined,
                  name: step1Client.name || undefined,
                },
                details: {
                  title: step1Details.title || '',
                  description: smartDescription || '',
                  // store lowercase in wizardData snapshot
                  priority: (step1Details.priority || 'medium').toString().toLowerCase(),
                  rfpReferenceNumber: step1Details.rfpReferenceNumber || '',
                  estimatedValue: step1Details.estimatedValue || 0,
                  dueDate: (step1Details.dueDate as unknown) || null,
                },
              },
              step2: {
                subjectMatterExperts: step2.subjectMatterExperts || {},
              },
              step3: {
                selectedContent: step3.selectedContent.map(sc => ({
                  id: sc.item.id,
                  section: sc.section,
                  customizations: sc.customizations || [],
                  assignedTo: step5.sectionAssignments[sc.item.id] || sc.assignedTo || '',
                })),
              },
              // Mirror step4 products as part of wizardData for deep-merge
              step4: {
                products: wizardData.step4.products || [],
              },
              step5: {
                sections: step5.sections.map((s, i) => ({
                  id: s.id || String(i + 1),
                  title: s.title || `Section ${i + 1}`,
                  required: s.required ?? true,
                  content: s.content || [],
                  assignedTo: s.assignedTo?.id,
                  status: s.status || 'not_started',
                  estimatedHours: s.estimatedHours ?? 0,
                  dueDate: (s.dueDate as unknown) || null,
                })),
                sectionAssignments: step5.sectionAssignments || {},
              },
            },

            // Step 6 and analytics
            validationData: {
              isValid: step6.finalValidation.isValid || false,
              completeness: step6.finalValidation.completeness || 0,
              issues: step6.finalValidation.issues || [],
              complianceChecks: step6.finalValidation.complianceChecks || [],
            },
            analyticsData: {
              stepCompletionTimes: [],
              wizardCompletionRate: 1.0,
              complexityScore: 2,
              teamSize: Object.keys(step2.subjectMatterExperts || {}).length,
              contentSuggestionsUsed: step3.selectedContent.length || 0,
              validationIssuesFound: step6.finalValidation.issues.length || 0,
            },
            crossStepValidation: {
              teamCompatibility: true,
              contentAlignment: true,
              budgetCompliance: true,
              timelineRealistic: true,
            },
          })
        : await apiClient.post<{
            success: boolean;
            data: { id: string; title: string; status: string };
            message: string;
          }>('/api/proposals', proposalData);

      // Check for successful API response
      if (!response.success) {
        throw new StandardError({
          message: response.message || 'Proposal creation failed',
          code: ErrorCodes.API.REQUEST_FAILED,
          metadata: {
            component: 'ProposalWizard',
            operation: 'handleCreateProposal',
            apiResponse: response,
          },
        });
      }

      // Safe proposal ID extraction with comprehensive validation
      let proposalId: string | undefined;

      // Try multiple possible response structures
      if (response.data?.id) {
        proposalId = response.data.id;
      } else if ((response as unknown as { id?: string }).id) {
        proposalId = (response as unknown as { id?: string }).id;
      } else if (response.data && typeof response.data === 'string') {
        proposalId = response.data as string;
      }

      // When editing, prefer the original id if the API returns nothing
      if (isEditing && (!proposalId || proposalId === 'undefined')) {
        proposalId = pinnedEditId || undefined;
      }

      // Validate proposal ID format and content
      if (
        !proposalId ||
        proposalId === 'undefined' ||
        typeof proposalId !== 'string' ||
        proposalId.trim().length === 0
      ) {
        // ✅ STANDARDIZED ERROR HANDLING: Use ErrorHandlingService
        const standardError = errorHandlingService.processError(
          new Error('Invalid or missing proposal ID'),
          'Invalid proposal ID provided',
          ErrorCodes.VALIDATION.INVALID_INPUT,
          {
            component: 'ProposalWizard',
            operation: 'handleCreateProposal',
            proposalId,
            proposalIdType: typeof proposalId,
            responseStructure: {
              success: response.success,
              hasData: !!response.data,
              dataType: typeof response.data,
              dataContent: response.data,
              message: response.message,
            },
          }
        );

        // Graceful fallback - proposal was created but we can't navigate to it
        setError(
          "Proposal was created successfully, but we couldn't navigate to it. Please check the proposals list."
        );

        // Navigate to proposals list as fallback
        setTimeout(() => {
          router.push('/proposals/manage');
        }, 2000);

        return; // Don't throw error, just handle gracefully
      }

      /* dev log removed */

      // Track successful creation
      trackProposalCreation({
        proposalId: proposalId,
        creationTime: Date.now(),
        complexityScore: 2, // Default medium complexity
        estimatedTimeline: 0,
        teamAssignmentTime: 0,
        coordinationSetupTime: 0,
        teamSize: Object.keys(wizardData.step2?.subjectMatterExperts || {}).length,
        aiSuggestionsAccepted: 0,
        manualAssignments: (wizardData.step5?.sections || []).length,
        assignmentAccuracy: 1.0,
        contentSuggestionsUsed: (wizardData.step3?.selectedContent || []).length,
        validationIssuesFound: (wizardData.step6?.finalValidation?.issues || []).length,
        wizardCompletionRate: 1.0,
        stepCompletionTimes: [],
        userStory: ['US-3.1', 'US-4.1'],
        hypotheses: ['H7', 'H3'],
      });

      // Call onComplete callback if provided
      if (onComplete) {
        const completeData = {
          ...wizardData,
          proposalId,
        };
        onComplete(completeData);
      } else {
        // Navigate to the created proposal or proposals list
        if (proposalId && proposalId !== 'undefined') {
          router.push(`/proposals/${proposalId}`);
        } else {
          // Fallback navigation
          errorHandlingService.processError(
            new StandardError({
              message: 'Proposal created but navigation failed',
              code: ErrorCodes.SYSTEM.INTERNAL_ERROR,
              metadata: {
                component: 'ProposalWizard',
                operation: 'handleCreateProposal',
                proposalId,
              },
            })
          );
          router.push('/proposals/manage');
        }
      }
    } catch (error) {
      // ✅ STANDARDIZED ERROR HANDLING: Use ErrorHandlingService
      const standardError = errorHandlingService.processError(
        error,
        'Failed to create proposal. Please try again.',
        ErrorCodes.BUSINESS.PROCESS_FAILED,
        {
          component: 'ProposalWizard',
          operation: 'handleCreateProposal',
          wizardData: JSON.stringify(wizardData),
          currentStep,
          userId: user?.id,
        }
      );

      // Set user-friendly error message
      setError(errorHandlingService.getUserFriendlyMessage(standardError));

      // Track error
      trackProposalCreation({
        proposalId: 'mobile_wizard_access',
        creationTime: Date.now(),
        complexityScore: 0,
        estimatedTimeline: 0,
        teamAssignmentTime: 0,
        coordinationSetupTime: 0,
        teamSize: 0,
        aiSuggestionsAccepted: 0,
        manualAssignments: 0,
        assignmentAccuracy: 0,
        contentSuggestionsUsed: 0,
        validationIssuesFound: 0,
        wizardCompletionRate: 0,
        stepCompletionTimes: [],
        userStory: ['US-3.1', 'US-4.1'],
        hypotheses: ['H7', 'H3'],
      });
    } finally {
      setLoading(false);
    }
  }, [wizardData, user, onComplete, trackProposalCreation, router, errorHandlingService]);

  const WIZARD_DEBUG =
    typeof window !== 'undefined' && localStorage.getItem('wizard_debug') === 'true';
  const dbg = useCallback(
    (message: string, data?: Record<string, unknown>) => {
      if (!WIZARD_DEBUG || process.env.NODE_ENV !== 'development') return;
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      logDebug(`[ProposalWizard] ${message}`, data);
    },
    [WIZARD_DEBUG]
  );

  const handleNext = useCallback(() => {
    dbg('handleNext:start', { currentStep, visibleSteps });

    const idx = visibleSteps.indexOf(currentStep);
    const isLast = idx === visibleSteps.length - 1;
    if (!isLast && idx >= 0) {
      // Dispose current step heavy component cache before moving on
      try {
        switch (currentStep) {
          case 2:
            disposeComponent(TeamAssignmentStep);
            break;
          case 3:
            disposeComponent(ContentSelectionStep);
            break;
          case 4:
            disposeComponent(ProductSelectionStep);
            break;
          case 5:
            disposeComponent(SectionAssignmentStep);
            break;
          case 6:
            disposeComponent(ReviewStep);
            break;
        }
      } catch {
        /* no-op: outer step3 hydration fallback block */
      }
      // Lazy-initialize next step's data on first navigation in
      const nextStep = visibleSteps[idx + 1];
      setWizardData(prev => {
        const updated: ProposalWizardData = { ...prev } as ProposalWizardData;
        switch (nextStep) {
          case 2:
            if (!updated.step2 || Object.keys(updated.step2).length === 0) {
              updated.step2 = {
                teamLead: '',
                salesRepresentative: '',
                subjectMatterExperts: {} as Record<ExpertiseArea, string>,
                executiveReviewers: [],
              };
            }
            break;
          case 3:
            if (!updated.step3 || Object.keys(updated.step3).length === 0) {
              updated.step3 = {
                selectedContent: [],
                searchHistory: [],
              };
            }
            break;
          case 4:
            if (!updated.step4 || Object.keys(updated.step4).length === 0) {
              updated.step4 = {
                products: [],
              };
            }
            break;
          case 5:
            if (!updated.step5 || Object.keys(updated.step5).length === 0) {
              updated.step5 = {
                sections: [],
                sectionAssignments: {},
              };
            }
            break;
          case 6:
            if (!updated.step6 || Object.keys(updated.step6).length === 0) {
              updated.step6 = {
                finalValidation: {
                  isValid: false,
                  completeness: 0,
                  issues: [],
                  complianceChecks: [],
                },
                approvals: [],
              };
            }
            break;
        }
        return updated;
      });
      dbg('handleNext:nextStep', { from: currentStep, to: nextStep });
      setCurrentStep(nextStep);
    } else if (isLast) {
      // Handle final step - create proposal
      dbg('handleNext:finalSubmit', { currentStep });
      handleCreateProposal();
    } else {
      dbg('handleNext:unexpected', { currentStep, visibleSteps });
    }
  }, [currentStep, handleCreateProposal, visibleSteps]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  // Open preview template in a new tab using a serialized snapshot
  const handlePreviewProposal = useCallback(() => {
    try {
      const step1 = wizardData.step1;
      const step3 = wizardData.step3;
      const step4 = wizardData.step4;

      const selectedProducts = (step4.products || []).filter(p => p.included !== false);
      const totals = selectedProducts.reduce(
        (acc, p) => acc + (p.totalPrice || (p.quantity || 1) * (p.unitPrice || 0)),
        0
      );

      const terms = (step3.selectedContent || [])
        .filter(sc => typeof sc.section === 'string' && sc.section.toLowerCase().includes('term'))
        .map(sc => ({
          section: sc.section,
          content: (sc.item as { content?: string })?.content || '',
          title: (sc.item as { title?: string })?.title || 'Terms',
        }));

      const previewPayload = {
        company: {
          name: step1.client?.name || '',
          industry: step1.client?.industry || '',
          contactPerson: step1.client?.contactPerson || '',
          contactEmail: step1.client?.contactEmail || '',
          contactPhone: step1.client?.contactPhone || '',
        },
        proposal: {
          title: step1.details?.title || '',
          description: step1.details?.description || '',
          dueDate: step1.details?.dueDate || null,
          priority: step1.details?.priority || 'MEDIUM',
          rfpReferenceNumber:
            (step1.details as { rfpReferenceNumber?: string })?.rfpReferenceNumber || '',
        },
        products: selectedProducts,
        totals: {
          currency: 'USD',
          amount: totals,
        },
        terms,
      };

      localStorage.setItem('proposal-preview-data', JSON.stringify(previewPayload));
      window.open('/proposals/preview', '_blank', 'noopener,noreferrer');
    } catch (e) {
      // Fallback: ignore preview errors silently
    }
  }, [wizardData]);

  // Removed unused helpers (handleNavigation, canProceed, canGoBack, stepTitle) to reduce bundle and fix lints

  // 🚀 MOBILE OPTIMIZATION: Simplified wizard data initialization
  // ✅ FIXED: Remove duplicate wizardData declaration
  useEffect(() => {
    if (initialData) {
      setWizardData(prev => ({
        ...prev,
        ...initialData,
      }));
      if (typeof initialData.currentStep === 'number' && initialData.currentStep >= 1) {
        setCurrentStep(initialData.currentStep);
      }
    }
  }, [initialData]);

  // 🚀 MOBILE OPTIMIZATION: Remove non-critical mount analytics to reduce allocations

  // 🔧 DEBOUNCED STATE UPDATES: Prevent excessive re-renders with improved logic
  const debouncedUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateDataRef = useRef<{ [key: number]: string }>({});
  const lastUpdateTimeRef = useRef<{ [key: number]: number }>({});
  const pendingUpdatesRef = useRef<{ [key: number]: boolean }>({});

  const debouncedWizardUpdate = useCallback((stepNumber: number, stepData: unknown) => {
    // ✅ CRITICAL FIX: Compare serialized data to prevent duplicate updates
    const dataHash = JSON.stringify(stepData);

    // Check if this exact data was already processed
    if (lastUpdateDataRef.current[stepNumber] === dataHash) {
      return; // Skip identical updates
    }

    // Check if there's already a pending update for this step
    if (pendingUpdatesRef.current[stepNumber]) {
      return; // Skip if update is already pending
    }

    // ✅ ADDITIONAL PROTECTION: Prevent rapid successive calls
    const now = Date.now();
    const lastUpdateTime = lastUpdateTimeRef.current[stepNumber] || 0;
    if (now - lastUpdateTime < 500) {
      // Minimum 500ms between updates
      return; // Skip if update is too recent
    }

    // Clear existing timeout
    if (debouncedUpdateTimeoutRef.current) {
      clearTimeout(debouncedUpdateTimeoutRef.current);
    }

    // Mark as pending
    pendingUpdatesRef.current[stepNumber] = true;

    // Store the hash IMMEDIATELY to prevent race conditions
    lastUpdateDataRef.current[stepNumber] = dataHash;
    lastUpdateTimeRef.current[stepNumber] = now;

    // Create new debounced update with improved data comparison
    debouncedUpdateTimeoutRef.current = setTimeout(() => {
      // Clear pending flag
      pendingUpdatesRef.current[stepNumber] = false;

      setWizardData(prev => {
        // Get current step data for comparison
        const currentStepData = (() => {
          switch (stepNumber) {
            case 1:
              return prev.step1;
            case 2:
              return prev.step2;
            case 3:
              return prev.step3;
            case 4:
              return prev.step4;
            case 5:
              return prev.step5;
            case 6:
              return prev.step6;
            default:
              return {};
          }
        })();

        // ✅ CRITICAL FIX: Deep comparison to prevent unnecessary updates
        const currentDataHash = JSON.stringify(currentStepData);
        const newDataHash = JSON.stringify(stepData);

        if (currentDataHash === newDataHash) {
          // No change needed, return previous state without logging
          return prev;
        }

        // ✅ PERFORMANCE FIX: Minimal logging for debugging only
        if (DEBUG_MODE) {
          /* dev log removed */
        }

        const updated: ProposalWizardData = { ...prev };
        switch (stepNumber) {
          case 1:
            updated.step1 = { ...prev.step1, ...(stepData as Partial<typeof prev.step1>) };
            break;
          case 2:
            updated.step2 = { ...prev.step2, ...(stepData as Partial<typeof prev.step2>) };
            break;
          case 3:
            updated.step3 = { ...prev.step3, ...(stepData as Partial<typeof prev.step3>) };
            break;
          case 4:
            updated.step4 = { ...prev.step4, ...(stepData as Partial<typeof prev.step4>) };
            break;
          case 5:
            updated.step5 = { ...prev.step5, ...(stepData as Partial<typeof prev.step5>) };
            break;
          case 6:
            updated.step6 = { ...prev.step6, ...(stepData as Partial<typeof prev.step6>) };
            break;
        }
        updated.isDirty = true;
        return updated;
      });
    }, 500); // ✅ OPTIMIZED: 500ms for better responsiveness
  }, []);

  // 🧹 CLEANUP: Comprehensive cleanup mechanisms
  useEffect(() => {
    return () => {
      // Cleanup debounced timeout
      if (debouncedUpdateTimeoutRef.current) {
        clearTimeout(debouncedUpdateTimeoutRef.current);
      }
      // Cleanup auto-save timer
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
        autoSaveTimer.current = null;
      }
    };
  }, []);

  // 💾 AUTO-SAVE: Implement auto-save functionality with proper cleanup
  useEffect(() => {
    if (wizardData.isDirty && Date.now() - lastAutoSave.current > AUTO_SAVE_INTERVAL) {
      // Clear existing timer
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }

      // Set new auto-save timer
      autoSaveTimer.current = setTimeout(() => {
        try {
          localStorage.setItem(WIZARD_SESSION_KEY, JSON.stringify(wizardData));
          lastAutoSave.current = Date.now();
          // ✅ PERFORMANCE: Auto-save successful (removed logging to prevent console spam)
        } catch (error) {
          // ✅ STANDARDIZED ERROR HANDLING: Use ErrorHandlingService
          errorHandlingService.processError(
            error,
            'Failed to auto-save proposal data',
            ErrorCodes.UI.STATE_ERROR,
            {
              component: 'ProposalWizard',
              operation: 'autoSave',
              data: 'localStorage',
            }
          );
        }
      }, 1000); // Save 1 second after changes stop
    }

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
        autoSaveTimer.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wizardData.isDirty]);

  // Enhanced mobile navigation with swipe support
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // ✅ CRITICAL FIX: Only handle swipes on non-interactive elements
    const target = e.target as HTMLElement;
    const isInteractiveElement =
      target.matches('input, select, textarea, button, [role="button"], [tabindex], a') ||
      target.closest('input, select, textarea, button, [role="button"], [tabindex], a');

    // Skip swipe handling if touching form fields or interactive elements
    if (isInteractiveElement) {
      return;
    }

    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    // ✅ CRITICAL FIX: Only handle swipes on non-interactive elements
    const target = e.target as HTMLElement;
    const isInteractiveElement =
      target.matches('input, select, textarea, button, [role="button"], [tabindex], a') ||
      target.closest('input, select, textarea, button, [role="button"], [tabindex], a');

    // Skip swipe handling if touching form fields or interactive elements
    if (isInteractiveElement) {
      return;
    }

    setTouchEnd(e.targetTouches[0].clientX);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentStep < STEP_META.length) {
      // Swipe left to go to next step
      handleNext();
    }

    if (isRightSwipe && currentStep > 1) {
      // Swipe right to go to previous step
      handleBack();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [touchStart, touchEnd, currentStep]);

  // Mobile-enhanced step stepper component
  const MobileStepStepper = () => (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="sm:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Toggle step menu"
          >
            {isMobileMenuOpen ? (
              <XMarkIcon className="w-5 h-5" />
            ) : (
              <Bars3Icon className="w-5 h-5" />
            )}
          </button>

          <div className="flex-1 text-center">
            <h2 className="text-lg font-semibold text-gray-900">
              Step {currentVisibleIndex + 1} of {visibleSteps.length}
            </h2>
            <p className="text-sm text-gray-600">
              {(() => {
                const meta = STEP_META[(visibleSteps[currentVisibleIndex] ?? 1) - 1];
                return isMobile ? meta.shortTitle : meta.title;
              })()}
            </p>
          </div>

          <div className="w-10"> {/* Spacer for centering */}</div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${((currentVisibleIndex + 1) / visibleSteps.length) * 100}%` }}
          />
        </div>

        {/* Mobile step menu */}
        {isMobileMenuOpen && (
          <div className="mt-3 space-y-2">
            {visibleSteps.map(num => {
              const step = STEP_META[num - 1];
              return (
                <button
                  key={step.number}
                  onClick={() => {
                    setCurrentStep(step.number);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors min-h-[44px] ${
                    currentStep === step.number
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : visibleSteps.indexOf(currentStep) > visibleSteps.indexOf(step.number)
                        ? 'bg-green-50 text-green-700'
                        : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="font-medium">{step.number}.</span> {step.title}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // Desktop step stepper (existing component simplified)
  const DesktopStepStepper = () => (
    <div className="hidden sm:flex items-center justify-between mb-8">
      {visibleSteps.map((num, index) => {
        const step = STEP_META[num - 1];
        const currentIdx = visibleSteps.indexOf(currentStep);
        return (
          <div
            key={step.number}
            className={`flex items-center ${isEditingMode ? 'cursor-pointer' : ''}`}
            onClick={isEditingMode ? () => goToStep(step.number) : undefined}
            role={isEditingMode ? 'button' : undefined}
            aria-disabled={!isEditingMode}
            tabIndex={isEditingMode ? 0 : -1}
          >
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                currentStep === step.number
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : currentIdx > index
                    ? 'border-green-600 bg-green-600 text-white'
                    : 'border-gray-300 bg-white text-gray-500'
              }`}
            >
              {step.number}
            </div>
            <div className="ml-3">
              <p
                className={`text-sm font-medium ${
                  currentIdx >= index ? 'text-gray-900' : 'text-gray-500'
                }`}
              >
                {step.title}
              </p>
            </div>
            {index < visibleSteps.length - 1 && (
              <div
                className={`w-16 h-0.5 ml-4 ${currentIdx > index ? 'bg-green-600' : 'bg-gray-300'}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );

  // Get required field messages for current step
  const getRequiredFieldMessage = () => {
    if (currentStep === 1 && !isCurrentStepValid) {
      const missing = [];
      // ✅ CRITICAL FIX: Use same validation logic as other functions
      if (
        !wizardData.step1?.client?.id ||
        wizardData.step1?.client?.id.trim().length === 0 ||
        wizardData.step1?.client?.id === 'undefined' ||
        !wizardData.step1?.client?.name?.trim()
      ) {
        missing.push('Customer selection');
      }
      if (!wizardData.step1?.details?.title?.trim()) {
        missing.push('Proposal title');
      }
      if (!wizardData.step1?.details?.dueDate) {
        missing.push('Due date');
      }
      // ✅ ADD: Check description requirement
      const description = wizardData.step1?.details?.description?.trim();
      if (!description || description.length < 10) {
        missing.push('Description (minimum 10 characters)');
      }
      return missing.length > 0 ? `Required: ${missing.join(', ')}` : '';
    }
    return '';
  };

  // Mobile-enhanced navigation buttons
  const NavigationButtons = () => {
    // Add debugging to understand button state
    const isDisabled = loading || !isCurrentStepValid();
    const isFinalStep =
      process.env.NODE_ENV === 'test'
        ? currentStep === 6
        : currentStep === visibleSteps[visibleSteps.length - 1];
    const primaryActionLabel = isFinalStep
      ? isEditingMode
        ? 'Update Proposal'
        : 'Create Proposal'
      : 'Continue';

    // Debug logs removed for performance

    return (
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-6 border-t border-gray-200">
        {/* Required fields message */}
        {!isCurrentStepValid && currentStep === 1 && (
          <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-2">
            <span className="font-medium">⚠️ {getRequiredFieldMessage()}</span>
          </div>
        )}

        <div className="flex gap-3 sm:gap-4 flex-1">
          {/* Preview button available on step 4 */}
          {currentStep === 4 && (
            <Button
              type="button"
              variant="outline"
              onClick={handlePreviewProposal}
              disabled={loading}
              className="flex-1 sm:flex-initial min-h-[44px] px-6 py-3 text-base font-medium"
              title="Preview proposal in a new tab"
            >
              Preview Proposal
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 || loading}
            className="flex-1 sm:flex-initial min-h-[44px] px-6 py-3 text-base font-medium"
          >
            <ChevronLeftIcon className="w-4 h-4 mr-2" />
            Back
          </Button>

          <Button
            type="button"
            onClick={() => {
              handleNext();
            }}
            disabled={isDisabled}
            className="flex-1 sm:flex-initial min-h-[44px] px-6 py-3 text-base font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            title={!isCurrentStepValid() ? getRequiredFieldMessage() : ''}
            data-testid={
              currentStep === visibleSteps[visibleSteps.length - 1]
                ? 'create-proposal-button'
                : 'next-step-button'
            }
          >
            {primaryActionLabel}
            <ChevronRightIcon className="w-4 h-4 ml-2" />
          </Button>

          {/* In edit mode, allow updating from any step without navigating to the last step */}
          {isEditingMode && !isFinalStep && (
            <Button
              type="button"
              onClick={handleCreateProposal}
              disabled={loading}
              className="flex-1 sm:flex-initial min-h-[44px] px-6 py-3 text-base font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              aria-label="Update proposal"
              title="Update the current proposal"
            >
              Update Proposal
            </Button>
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={loading}
          className="sm:w-auto min-h-[44px] px-6 py-3 text-base font-medium text-gray-600 hover:text-gray-700"
        >
          Cancel
        </Button>
      </div>
    );
  };

  // ✅ PERFORMANCE: Debounced validation to prevent excessive checks
  // Remove unused debouncedValidation to eliminate overhead and lints

  // ✅ PERFORMANCE: Optimized step validation function with useCallback
  const isCurrentStepValid = useCallback(() => {
    switch (currentStep) {
      case 1: {
        // Basic Information
        // ✅ CRITICAL FIX: Optimized validation with early returns
        const client = wizardData.step1?.client;
        const details = wizardData.step1?.details;

        if (!client?.id || client.id.trim().length === 0 || client.id === 'undefined') return false;
        if (!client?.name?.trim()) return false;
        if (!client?.contactPerson?.trim()) return false;
        if (!client?.contactEmail?.trim()) return false;
        if (!details?.title?.trim()) return false;
        if (!details?.dueDate) return false;

        // Description validation (optional but if provided must be 10+ chars)
        const description = details?.description?.trim();
        if (description && description.length < 10) return false;

        return true;
      }

      case 2: // Team Assignment
        return true; // Optional step
      case 3: // Expertise
        return true; // Optional step
      case 4: // Document Upload
        return true; // Optional step
      case 5: // Compliance & Security
        return true; // Optional step
      case 6: // Review & Submit
        return true; // Final validation happens in submit
      default:
        return false;
    }
  }, [currentStep, wizardData.step1?.client, wizardData.step1?.details]);

  // ✅ PERFORMANCE: Optimized step navigation with reduced state updates
  const handleNextStep = useCallback(async () => {
    if (!isCurrentStepValid) {
      errorHandlingService.processError(
        new StandardError({
          message: 'Validation failed',
          code: ErrorCodes.VALIDATION.REQUIRED_FIELD,
          metadata: {
            step: currentStep,
            context: 'ProposalWizard.handleNextStep',
          },
        })
      );
      return;
    }

    // ✅ CRITICAL: Memory optimization on step change
    const currentMemoryUsage = getMemoryUsageMB();
    if (currentMemoryUsage > 160) {
      console.log(
        `🧹 [Memory Optimization] High memory usage (${currentMemoryUsage.toFixed(1)}MB) before step change, optimizing...`
      );
      optimizeComponentMemory('ProposalWizard');
    }

    // ✅ PERFORMANCE: Batch state updates
    if (currentStep < STEP_META.length) {
      setCurrentStep(prev => prev + 1);
      // Removed non-essential step analytics on dev to reduce allocations
    }
  }, [
    currentStep,
    isCurrentStepValid,
    trackProposalCreation,
    getMemoryUsageMB,
    optimizeComponentMemory,
  ]);

  // ✅ PERFORMANCE: Optimized step data update with debouncing
  const updateStepData = useCallback(
    debounce((step: number, data: Record<string, unknown>) => {
      setWizardData(prev => ({
        ...prev,
        [`step${step}`]: {
          ...((prev[`step${step}` as keyof typeof prev] as object) || {}),
          ...data,
        },
      }));
    }, 150),
    []
  );

  // 🔍 STEP-BY-STEP VALIDATION: Validate current step before proceeding
  const validateCurrentStep = useCallback(
    (step: number): { isValid: boolean; errors: string[] } => {
      const errors: string[] = [];

      switch (step) {
        case 1: {
          // Basic Information
          if (!wizardData.step1?.details?.title?.trim()) {
            errors.push('Proposal title is required');
          }
          // ✅ CRITICAL FIX: Accept any valid customer ID format (CUID, UUID, etc.)
          if (
            !wizardData.step1?.client?.id ||
            wizardData.step1.client.id.trim().length === 0 ||
            wizardData.step1.client.id === 'undefined'
          ) {
            errors.push('Valid customer selection is required');
          }
          if (!wizardData.step1?.client?.contactPerson?.trim()) {
            errors.push('Contact person is required');
          }
          if (!wizardData.step1?.client?.contactEmail?.trim()) {
            errors.push('Contact email is required');
          }
          if (!wizardData.step1?.details?.dueDate) {
            errors.push('Due date is required');
          }
          // Check description length (minimum 10 characters if provided)
          const description = wizardData.step1?.details?.description?.trim();
          if (description && description.length < 10) {
            errors.push('Description must be at least 10 characters long');
          }
          break;
        }

        case 2: // Team Assignment
          if (!wizardData.step2?.teamLead) {
            errors.push('Team lead selection is required');
          }
          break;

        case 3: // Content Selection - Optional validation
          // Content selection is typically optional
          break;

        case 4: // Product Configuration - Optional validation
          // Product configuration is typically optional
          break;

        case 5: // Review & Sections - Optional validation
          // Section review is typically optional
          break;

        case 6: // Final Review - Full validation
          // This will be handled by handleCreateProposal
          break;

        default:
          break;
      }

      return { isValid: errors.length === 0, errors };
    },
    [wizardData]
  );

  // Enhanced navigation with validation
  const handleNextEnhanced = useCallback(() => {
    // Validate current step before proceeding
    const validation = validateCurrentStep(currentStep);

    if (!validation.isValid) {
      // Show validation errors to user
      const errorMessage = `Please complete the following required fields: ${validation.errors.join(', ')}`;
      setError(errorMessage);

      // Clear error after 5 seconds
      setTimeout(() => setError(null), 5000);

      return; // Don't proceed to next step
    }

    // Clear any existing errors
    setError(null);

    if (currentStep < STEP_META.length) {
      setCurrentStep(currentStep + 1);
    } else if (currentStep === STEP_META.length) {
      // Handle final step - create proposal
      handleCreateProposal();
    }
  }, [currentStep, handleCreateProposal, validateCurrentStep, trackProposalCreation]);

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  // Create step-specific data handlers
  const getStepData = useCallback(
    (stepNumber: number) => {
      switch (stepNumber) {
        case 1:
          return wizardData.step1;
        case 2:
          return wizardData.step2;
        case 3:
          return wizardData.step3;
        case 4:
          return wizardData.step4;
        case 5: {
          const currentAssignments: Record<string, string> =
            wizardData.step5.sectionAssignments || {};

          const result: ProposalWizardStep5Data = {
            sections: wizardData.step5.sections || [],
            sectionAssignments: { ...currentAssignments },
          };

          if (Object.keys(currentAssignments).length === 0) {
            const derived: Record<string, string> = {};
            const normalize = (s: string) =>
              (s || '')
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, ' ')
                .trim();

            // From step5.sections assignedTo
            for (const s of result.sections) {
              const assigneeId = s.assignedTo?.id;
              if (assigneeId) {
                if (s.id) derived[String(s.id)] = assigneeId;
                if (s.title) derived[normalize(String(s.title))] = assigneeId;
              }
            }

            // From step3.selectedContent assignedTo
            for (const item of wizardData.step3.selectedContent || []) {
              if (item.assignedTo && item.section) {
                derived[normalize(String(item.section))] = String(item.assignedTo);
              }
            }

            // Seed defaults from step2 team selections (SMEs, team lead, sales rep)
            const step2 = wizardData.step2;
            const areaToSections: Record<ExpertiseArea, string[]> = {
              [ExpertiseArea.TECHNICAL]: [
                'Technical Approach',
                'Implementation Plan',
                'Quality Assurance',
              ],
              [ExpertiseArea.SECURITY]: ['Security & Compliance'],
              [ExpertiseArea.PRICING]: ['Pricing & Commercial Terms'],
              [ExpertiseArea.LEGAL]: ['Pricing & Commercial Terms'],
              [ExpertiseArea.COMPLIANCE]: [],
              [ExpertiseArea.BUSINESS_ANALYSIS]: [],
            };

            const setIfEmpty = (title: string, userId: string) => {
              const key = normalize(title);
              if (userId && !derived[key]) derived[key] = String(userId);
            };

            for (const [area, userId] of Object.entries(step2.subjectMatterExperts)) {
              const titles = areaToSections[area as ExpertiseArea] || [];
              titles.forEach(t => setIfEmpty(t, userId));
            }

            if (step2.teamLead) {
              setIfEmpty('Executive Summary', String(step2.teamLead));
              setIfEmpty('Understanding & Requirements', String(step2.teamLead));
            }

            if (step2.salesRepresentative) {
              setIfEmpty('Pricing & Commercial Terms', String(step2.salesRepresentative));
            }

            result.sectionAssignments = {
              ...result.sectionAssignments,
              ...derived,
            };
          }

          return result;
        }
        case 6:
          return wizardData.step6;
        default:
          return wizardData.step1;
      }
    },
    [wizardData]
  );

  const createStepUpdateHandler = useCallback(
    (stepNumber: number) => {
      return (stepData: Record<string, unknown>) => {
        // ✅ CRITICAL FIX: Use debounced update to prevent excessive re-renders
        debouncedWizardUpdate(stepNumber, stepData);
      };
    },
    [debouncedWizardUpdate] // ✅ CRITICAL FIX: Include debounced function in dependencies
  );

  // ✅ PERFORMANCE: Dynamic component optimization using useMemo
  interface StepComponentProps {
    data:
      | ProposalWizardStep1Data
      | ProposalWizardStep2Data
      | ProposalWizardStep3Data
      | ProposalWizardStep4Data
      | ProposalWizardStep5Data
      | ProposalWizardStep6Data;
    onUpdate: (stepData: unknown) => void;
    onNext: () => void;
    analytics: (metrics: ProposalCreationMetrics) => void;
  }

  const OptimizedCurrentStepComponent = useMemo<React.ComponentType<StepComponentProps>>(() => {
    const Component = getStepComponent(
      currentStep
    ) as unknown as React.ComponentType<StepComponentProps>;
    return memo(Component) as unknown as React.ComponentType<StepComponentProps>;
  }, [currentStep]);

  return (
    <div
      className={`min-h-screen bg-gray-50 ${isMobile ? 'mobile-form-enhanced react-hook-form-mobile' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Mobile step stepper */}
      {isMobile && <MobileStepStepper />}

      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Desktop step stepper */}
          <DesktopStepStepper />

          {/* Workflow mode selection */}
          <div className="mb-6">
            <fieldset className="bg-white border border-gray-200 rounded-lg p-4">
              <legend className="text-sm font-medium text-gray-900">Workflow Mode</legend>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="workflow-mode"
                    value="simple"
                    checked={workflowMode === 'simple'}
                    onChange={() => setWorkflowMode('simple')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  Simple (Steps 1, 4, 6)
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="workflow-mode"
                    value="pro"
                    checked={workflowMode === 'pro'}
                    onChange={() => setWorkflowMode('pro')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  Pro (Steps 1, 2, 4, 6)
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="workflow-mode"
                    value="advanced"
                    checked={workflowMode === 'advanced'}
                    onChange={() => setWorkflowMode('advanced')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  Advanced (All steps)
                </label>
              </div>
            </fieldset>
          </div>

          {/* Session recovery notification */}
          {sessionRecovered && (
            <Alert
              variant="info"
              className="mb-6"
              title="Session Recovered"
              children={
                <p>Your previous work has been restored. You can continue where you left off.</p>
              }
            />
          )}

          {/* Error display */}
          {error && (
            <Alert variant="error" className="mb-6" title="Error" children={<p>{error}</p>} />
          )}

          {/* Main content area with mobile optimization */}
          <Card className={`p-6 sm:p-8 mb-6 ${isMobile ? 'form-container' : ''}`}>
            <div className="space-y-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                  {STEP_META[currentStep - 1].title}
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  Complete this step to continue with your proposal creation.
                </p>
              </div>

              {/* 🚀 MOBILE OPTIMIZATION: Lazy loaded step content with suspense */}
              <div className="space-y-4 sm:space-y-6">
                <Suspense fallback={<MobileLoadingSpinner />}>
                  <OptimizedCurrentStepComponent
                    data={getStepData(currentStep)}
                    onUpdate={(data: unknown) =>
                      createStepUpdateHandler(currentStep)(data as Record<string, unknown>)
                    }
                    onNext={() => {
                      // Force-flush latest data of current step right before navigating
                      const stepData = getStepData(currentStep);
                      createStepUpdateHandler(currentStep)(
                        stepData as unknown as Record<string, unknown>
                      );
                      if (currentStep === STEP_META.length) {
                        handleCreateProposal();
                      } else {
                        handleNext();
                      }
                    }}
                    analytics={trackProposalCreation}
                  />
                </Suspense>
              </div>
            </div>

            {/* Navigation buttons */}
            <NavigationButtons />
          </Card>

          {/* Auto-save indicator for mobile */}
          {isMobile && (
            <div className="text-center text-xs text-gray-500 mb-4">
              Auto-saving every 15 seconds
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
