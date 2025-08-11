/**
 * Global Values Index
 * Central, type-safe lookup and locator for frequently changed global values.
 *
 * This does NOT duplicate values. It reads directly from the owning modules
 * (env manager, design tokens, etc.) and exposes:
 *  - getValue(key): current value from the real source
 *  - locate(key): { file, path } to jump to the owning definition
 *  - listKeys(): all available keys
 */

import { borderRadiusTokens, colorTokens, componentTokens } from '@/design-system/tokens';
import { getApiConfig, getAuthConfig, getFeatureFlags, getSecurityConfig } from '@/lib/env';

export type GlobalKey =
  | 'api.baseUrl' // Base API URL used by api client
  | 'api.timeout' // Default API timeout (ms)
  | 'api.retryAttempts' // Default retry attempts for API calls
  | 'api.retryDelay' // Initial retry delay (ms)
  | 'auth.jwtSecret' // Server JWT secret (placeholder in browser)
  | 'auth.jwtExpiration' // JWT expiration duration
  | 'auth.apiKey' // Server API key (placeholder in browser)
  | 'auth.refreshTokenExpiration' // Refresh token expiration duration
  | 'features.enableMetrics' // Toggle metrics collection
  | 'features.enableDebugMode' // Toggle debug mode features/logging
  | 'features.enableExperimentalFeatures' // Toggle experimental features
  | 'features.maintenanceMode' // Enable maintenance mode flag
  | 'security.rateLimitWindowMs' // Rate limit window in milliseconds
  | 'security.rateLimitMaxRequests' // Max requests per rate-limit window
  | 'security.corsOrigins' // Allowed CORS origins list
  | 'tokens.color.primary600' // Brand primary color shade 600
  | 'tokens.form.inputHeight' // Standard form input height
  | 'tokens.form.buttonHeight' // Standard button height
  | 'tokens.borderRadius.form'; // Standard border radius for form controls

export interface GlobalLocator {
  file: string;
  path: string;
}

function getValueInternal(key: GlobalKey): unknown {
  switch (key) {
    // API
    case 'api.baseUrl':
      return getApiConfig().baseUrl;
    case 'api.timeout':
      return getApiConfig().timeout;
    case 'api.retryAttempts':
      return getApiConfig().retryAttempts;
    case 'api.retryDelay':
      return getApiConfig().retryDelay;

    // Auth
    case 'auth.jwtSecret':
      return getAuthConfig().jwtSecret;
    case 'auth.jwtExpiration':
      return getAuthConfig().jwtExpiration;
    case 'auth.apiKey':
      return getAuthConfig().apiKey;
    case 'auth.refreshTokenExpiration':
      return getAuthConfig().refreshTokenExpiration;

    // Feature flags
    case 'features.enableMetrics':
      return getFeatureFlags().enableMetrics;
    case 'features.enableDebugMode':
      return getFeatureFlags().enableDebugMode;
    case 'features.enableExperimentalFeatures':
      return getFeatureFlags().enableExperimentalFeatures;
    case 'features.maintenanceMode':
      return getFeatureFlags().maintenanceMode;

    // Security
    case 'security.rateLimitWindowMs':
      return getSecurityConfig().rateLimitWindowMs;
    case 'security.rateLimitMaxRequests':
      return getSecurityConfig().rateLimitMaxRequests;
    case 'security.corsOrigins':
      return getSecurityConfig().corsOrigins;

    // Tokens
    case 'tokens.color.primary600':
      return colorTokens.primary[600];
    case 'tokens.form.inputHeight':
      return componentTokens.form.inputHeight;
    case 'tokens.form.buttonHeight':
      return componentTokens.form.buttonHeight;
    case 'tokens.borderRadius.form':
      return borderRadiusTokens.DEFAULT;
  }
}

function locateInternal(key: GlobalKey): GlobalLocator {
  switch (key) {
    // API
    case 'api.baseUrl':
      return { file: 'src/lib/env.ts', path: 'getApiConfig().baseUrl' };
    case 'api.timeout':
      return { file: 'src/lib/env.ts', path: 'getApiConfig().timeout' };
    case 'api.retryAttempts':
      return { file: 'src/lib/env.ts', path: 'getApiConfig().retryAttempts' };
    case 'api.retryDelay':
      return { file: 'src/lib/env.ts', path: 'getApiConfig().retryDelay' };

    // Auth
    case 'auth.jwtSecret':
      return { file: 'src/lib/env.ts', path: 'getAuthConfig().jwtSecret' };
    case 'auth.jwtExpiration':
      return { file: 'src/lib/env.ts', path: 'getAuthConfig().jwtExpiration' };
    case 'auth.apiKey':
      return { file: 'src/lib/env.ts', path: 'getAuthConfig().apiKey' };
    case 'auth.refreshTokenExpiration':
      return { file: 'src/lib/env.ts', path: 'getAuthConfig().refreshTokenExpiration' };

    // Feature flags
    case 'features.enableMetrics':
      return { file: 'src/lib/env.ts', path: 'getFeatureFlags().enableMetrics' };
    case 'features.enableDebugMode':
      return { file: 'src/lib/env.ts', path: 'getFeatureFlags().enableDebugMode' };
    case 'features.enableExperimentalFeatures':
      return { file: 'src/lib/env.ts', path: 'getFeatureFlags().enableExperimentalFeatures' };
    case 'features.maintenanceMode':
      return { file: 'src/lib/env.ts', path: 'getFeatureFlags().maintenanceMode' };

    // Security
    case 'security.rateLimitWindowMs':
      return { file: 'src/lib/env.ts', path: 'getSecurityConfig().rateLimitWindowMs' };
    case 'security.rateLimitMaxRequests':
      return { file: 'src/lib/env.ts', path: 'getSecurityConfig().rateLimitMaxRequests' };
    case 'security.corsOrigins':
      return { file: 'src/lib/env.ts', path: 'getSecurityConfig().corsOrigins' };

    // Tokens
    case 'tokens.color.primary600':
      return { file: 'src/design-system/tokens.ts', path: 'colorTokens.primary[600]' };
    case 'tokens.form.inputHeight':
      return { file: 'src/design-system/tokens.ts', path: 'componentTokens.form.inputHeight' };
    case 'tokens.form.buttonHeight':
      return { file: 'src/design-system/tokens.ts', path: 'componentTokens.form.buttonHeight' };
    case 'tokens.borderRadius.form':
      return { file: 'src/design-system/tokens.ts', path: 'borderRadiusTokens.DEFAULT' };
  }
}

const ALL_KEYS: readonly GlobalKey[] = [
  'api.baseUrl', // Base API URL used by api client
  'api.timeout', // Default API timeout (ms)
  'api.retryAttempts', // Default retry attempts for API calls
  'api.retryDelay', // Initial retry delay (ms)
  'auth.jwtSecret', // Server JWT secret (placeholder in browser)
  'auth.jwtExpiration', // JWT expiration duration
  'auth.apiKey', // Server API key (placeholder in browser)
  'auth.refreshTokenExpiration', // Refresh token expiration duration
  'features.enableMetrics', // Toggle metrics collection
  'features.enableDebugMode', // Toggle debug mode features/logging
  'features.enableExperimentalFeatures', // Toggle experimental features
  'features.maintenanceMode', // Enable maintenance mode flag
  'security.rateLimitWindowMs', // Rate limit window in milliseconds
  'security.rateLimitMaxRequests', // Max requests per rate-limit window
  'security.corsOrigins', // Allowed CORS origins list
  'tokens.color.primary600', // Brand primary color shade 600
  'tokens.form.inputHeight', // Standard form input height
  'tokens.form.buttonHeight', // Standard button height
  'tokens.borderRadius.form', // Standard border radius for form controls
] as const;

export const globals = {
  getValue: (key: GlobalKey): unknown => getValueInternal(key),
  locate: (key: GlobalKey): GlobalLocator => locateInternal(key),
  listKeys: (): readonly GlobalKey[] => ALL_KEYS,
} as const;

export default globals;

// -------------------------------
// Domain Field Locator (entities)
// -------------------------------

export type DomainKey =
  | 'customer.id' // Customer primary key
  | 'customer.name' // Customer name
  | 'customer.email' // Customer email address
  | 'customer.phone' // Customer phone
  | 'customer.website' // Customer website
  | 'customer.industry' // Customer industry
  | 'customer.status' // Customer status enum
  | 'customer.tier' // Customer tier enum
  | 'customer.createdAt' // Customer creation timestamp
  | 'customer.updatedAt' // Customer last update timestamp
  | 'customer.metadata' // Customer metadata JSON
  | 'customer.segmentation' // Customer segmentation JSON
  | 'customer.riskScore' // Customer risk score
  | 'customer.ltv' // Customer lifetime value
  | 'proposal.id' // Proposal primary key
  | 'proposal.status' // Proposal status enum
  | 'proposal.value' // Total proposal value (server)
  | 'proposal.total' // Alias of proposal.value
  | 'proposal.totalValue' // Denormalized total proposal value
  | 'proposal.metadata' // Proposal metadata JSON
  | 'proposal.performanceData' // Proposal performanceData JSON
  | 'proposal.userStoryTracking' // Proposal userStoryTracking JSON
  | 'proposal.statsUpdatedAt' // Proposal stats updated timestamp
  | 'proposal.title' // Proposal title
  | 'proposal.description' // Proposal description
  | 'proposal.priority' // Proposal priority enum
  | 'proposal.currency' // Currency ISO code
  | 'proposal.dueDate' // Proposal due date
  | 'proposal.submittedAt' // Proposal submitted timestamp
  | 'proposal.approvedAt' // Proposal approved timestamp
  | 'proposal.createdBy' // Creator user ID
  | 'proposal.customerId' // Customer foreign key
  | 'proposal.createdAt' // Proposal creation timestamp
  | 'proposal.updatedAt' // Proposal last update timestamp
  | 'proposal.tags' // Proposal tags array
  | 'proposal.productCount' // Denormalized count of products
  | 'proposal.sectionCount' // Denormalized count of sections
  | 'proposal.lastActivityAt' // Last activity timestamp
  | 'user.id' // User primary key
  | 'user.email' // User email address
  | 'user.name' // User display name
  | 'user.department' // User department
  | 'user.status' // User status enum
  | 'user.createdAt' // User creation timestamp
  | 'user.updatedAt' // User last update timestamp
  | 'proposalProduct.total' // Line-item total for a proposal product
  | 'proposalProduct.configuration' // Product configuration JSON on proposal line
  | 'proposalProduct.selectionAnalytics' // Selection analytics JSON on proposal line
  // Wizard (frontend) fields
  | 'wizard.step4.totalValue' // Step 4 total value
  | 'wizard.step4.products.totalPrice' // Per-product total price (step 4)
  | 'wizard.step4.products.quantity' // Product quantity (step 4)
  | 'wizard.step4.products.unitPrice' // Product unit price (step 4)
  | 'wizard.summary.total' // Wizard summary total displayed
  // UI display mappings (where shown)
  | 'ui.proposals.manage.value' // Value shown in proposals management table
  | 'ui.dashboard.recentProposals.value'; // Value shown in recent proposals widget

// Product and Customer class-like field locators
export type EntityKey =
  // Product
  | 'product.id' // Product primary key
  | 'product.name' // Product name
  | 'product.description' // Product description
  | 'product.sku' // Stock Keeping Unit
  | 'product.price' // Base price
  | 'product.currency' // Currency ISO code
  | 'product.category' // Categories array
  | 'product.tags' // Tags array
  | 'product.attributes' // Attributes JSON
  | 'product.images' // Image URLs
  | 'product.isActive' // Active flag
  | 'product.version' // Version number
  | 'product.createdAt' // Created timestamp
  | 'product.updatedAt' // Updated timestamp
  // Customer
  | 'customer.address' // Customer address
  | 'customer.companySize' // Company size
  | 'customer.revenue' // Reported revenue
  | 'customer.lastContact' // Last contact date
  | 'customer.tags' // Tags array
  | 'customer.metadata' // Metadata JSON
  | 'customer.segmentation' // Segmentation JSON
  | 'customer.riskScore' // Risk score
  | 'customer.ltv'; // Lifetime value

// Wizard Step Keys (comprehensive)
export type WizardKey =
  // Step 1 - Basic Information
  | 'wizard.step1.client.id' // Selected customer ID
  | 'wizard.step1.client.name' // Selected customer name
  | 'wizard.step1.client.industry' // Customer industry
  | 'wizard.step1.client.contactPerson' // Contact person name
  | 'wizard.step1.client.contactEmail' // Contact person email
  | 'wizard.step1.client.contactPhone' // Contact person phone
  | 'wizard.step1.details.title' // Proposal title
  | 'wizard.step1.details.rfpReferenceNumber' // RFP reference number
  | 'wizard.step1.details.dueDate' // Proposal due date
  | 'wizard.step1.details.estimatedValue' // Estimated value (fallback if no products)
  | 'wizard.step1.details.priority' // Proposal priority
  | 'wizard.step1.details.description' // Proposal description
  // Step 2 - Team Assignment
  | 'wizard.step2.teamLead' // Team lead user ID
  | 'wizard.step2.salesRepresentative' // Sales representative user ID
  | 'wizard.step2.subjectMatterExperts' // SME assignments map
  | 'wizard.step2.executiveReviewers' // Executive reviewer user IDs
  // Step 3 - Content Selection
  | 'wizard.step3.selectedContent' // Selected content items list
  | 'wizard.step3.searchHistory' // Content search history
  | 'wizard.step3.crossStepValidation.teamAlignment' // Team alignment result
  | 'wizard.step3.crossStepValidation.productCompatibility' // Product compatibility result
  | 'wizard.step3.crossStepValidation.rfpCompliance' // RFP compliance result
  | 'wizard.step3.crossStepValidation.sectionCoverage' // Section coverage result
  // Step 4 - Product Selection (extended beyond basic)
  | 'wizard.step4.products' // Selected products list
  | 'wizard.step4.aiRecommendationsUsed' // Number of AI recommendations used
  | 'wizard.step4.searchHistory' // Product search history
  | 'wizard.step4.crossStepValidation.teamCompatibility' // Team-product alignment
  | 'wizard.step4.crossStepValidation.contentAlignment' // Content-product alignment
  | 'wizard.step4.crossStepValidation.budgetCompliance' // Budget compliance
  | 'wizard.step4.crossStepValidation.timelineRealistic' // Timeline realism
  | 'wizard.step4.totalValue' // Step 4 total value
  | 'wizard.step4.products.totalPrice' // Per-product total price
  | 'wizard.step4.products.quantity' // Product quantity
  | 'wizard.step4.products.unitPrice' // Product unit price
  // Step 5 - Section Assignment
  | 'wizard.step5.sections' // Proposal sections list
  | 'wizard.step5.sectionAssignments' // Section to assignee mapping
  | 'wizard.step5.totalEstimatedHours' // Total estimated hours across sections
  | 'wizard.step5.criticalPath' // Critical path dependencies
  | 'wizard.step5.timelineEstimate.startDate' // Timeline start date
  | 'wizard.step5.timelineEstimate.endDate' // Timeline end date
  | 'wizard.step5.timelineEstimate.complexity' // Estimated complexity
  | 'wizard.step5.timelineEstimate.riskFactors' // Risk factors list
  // Step 6 - Review & Finalization
  | 'wizard.step6.finalValidation.isValid' // Final validation flag
  | 'wizard.step6.finalValidation.completeness' // Completeness percentage
  | 'wizard.step6.finalValidation.issues' // Validation issues list
  | 'wizard.step6.finalValidation.complianceChecks' // Compliance checks list
  | 'wizard.step6.approvals' // Approvals list
  | 'wizard.step6.insights.complexity' // Overall complexity insight
  | 'wizard.step6.insights.winProbability' // Win probability insight
  | 'wizard.step6.insights.estimatedEffort' // Estimated effort insight
  | 'wizard.step6.insights.similarProposals' // Similar proposals reference
  | 'wizard.step6.insights.keyDifferentiators' // Key differentiators
  | 'wizard.step6.insights.suggestedFocusAreas' // Suggested focus areas
  | 'wizard.step6.insights.riskFactors' // Risks identified
  | 'wizard.step6.exportOptions' // Export options configuration
  | 'wizard.step6.finalReviewComplete' // Final review completion flag
  | 'wizard.summary.total'; // Wizard summary total displayed

export interface DomainFieldLocation {
  prisma?: string;
  types?: string;
  api?: string | string[];
  service?: string;
  validation?: string; // e.g., Zod schema path
  ui?: string | string[]; // primary UI component(s)
  notes?: string;
  description?: string;
}

function locateDomainInternal(key: DomainKey): DomainFieldLocation {
  switch (key) {
    // Customer
    case 'customer.id':
      return {
        prisma: 'prisma/schema.prisma → model Customer → id',
        types: 'src/types/entities/customer.ts',
        api: 'src/app/api/customers/[id]/route.ts',
      };
    case 'customer.name':
      return {
        prisma: 'Customer.name',
        types: 'src/types/entities/customer.ts',
        api: 'src/app/api/customers/[id]/route.ts',
      };
    case 'customer.email':
      return {
        prisma: 'Customer.email',
        types: 'src/types/entities/customer.ts',
        api: 'src/app/api/customers/[id]/route.ts',
      };
    case 'customer.phone':
      return {
        prisma: 'Customer.phone',
        types: 'src/types/entities/customer.ts',
        api: 'src/app/api/customers/[id]/route.ts',
      };
    case 'customer.website':
      return {
        prisma: 'Customer.website',
        types: 'src/types/entities/customer.ts',
        api: 'src/app/api/customers/[id]/route.ts',
      };
    case 'customer.industry':
      return {
        prisma: 'Customer.industry',
        types: 'src/types/entities/customer.ts',
        api: 'src/app/api/customers/[id]/route.ts',
      };
    case 'customer.status':
      return {
        prisma: 'Customer.status',
        types: 'src/types/entities/customer.ts',
        api: 'src/app/api/customers/[id]/route.ts',
      };
    case 'customer.tier':
      return {
        prisma: 'Customer.tier',
        types: 'src/types/entities/customer.ts',
        api: 'src/app/api/customers/[id]/route.ts',
      };
    case 'customer.createdAt':
      return {
        prisma: 'Customer.createdAt',
        api: 'src/app/api/customers/[id]/route.ts',
      };
    case 'customer.updatedAt':
      return {
        prisma: 'Customer.updatedAt',
        api: 'src/app/api/customers/[id]/route.ts',
      };
    case 'customer.metadata':
      return {
        prisma: 'Customer.metadata',
        types: 'src/types/entities/customer.ts',
      };
    case 'customer.segmentation':
      return {
        prisma: 'Customer.segmentation',
        types: 'src/types/entities/customer.ts',
      };
    case 'customer.riskScore':
      return {
        prisma: 'Customer.riskScore',
        types: 'src/types/entities/customer.ts',
      };
    case 'customer.ltv':
      return {
        prisma: 'Customer.ltv',
        types: 'src/types/entities/customer.ts',
      };

    // Proposal
    case 'proposal.id':
      return {
        prisma: 'Proposal.id',
        types: 'src/types/entities/proposal.ts',
        api: [
          'src/app/api/proposals/[id]/route.ts',
          'src/app/api/proposals/route.ts',
          'src/app/api/proposals/list/route.ts',
        ],
      };
    case 'proposal.status':
      return {
        prisma: 'Proposal.status',
        types: 'src/types/entities/proposal.ts',
        service: 'src/lib/services/proposalService.ts → updateProposalStatus()',
        api: ['src/app/api/proposals/[id]/status/route.ts', 'src/app/api/proposals/[id]/route.ts'],
      };
    case 'proposal.title':
      return {
        prisma: 'Proposal.title',
        types: 'src/types/entities/proposal.ts',
        api: ['src/app/api/proposals/[id]/route.ts', 'src/app/api/proposals/route.ts'],
      };
    case 'proposal.description':
      return {
        prisma: 'Proposal.description',
        types: 'src/types/entities/proposal.ts',
        api: ['src/app/api/proposals/[id]/route.ts', 'src/app/api/proposals/route.ts'],
      };
    case 'proposal.priority':
      return {
        prisma: 'Proposal.priority',
        types: 'src/types/entities/proposal.ts',
        api: ['src/app/api/proposals/[id]/route.ts', 'src/app/api/proposals/route.ts'],
      };
    case 'proposal.currency':
      return {
        prisma: 'Proposal.currency',
        types: 'src/types/entities/proposal.ts',
        api: ['src/app/api/proposals/[id]/route.ts', 'src/app/api/proposals/route.ts'],
      };
    case 'proposal.dueDate':
      return {
        prisma: 'Proposal.dueDate',
        types: 'src/types/entities/proposal.ts',
        api: ['src/app/api/proposals/[id]/route.ts', 'src/app/api/proposals/route.ts'],
      };
    case 'proposal.submittedAt':
      return {
        prisma: 'Proposal.submittedAt',
        api: 'src/app/api/proposals/[id]/route.ts',
      };
    case 'proposal.approvedAt':
      return {
        prisma: 'Proposal.approvedAt',
        api: 'src/app/api/proposals/[id]/route.ts',
      };
    case 'proposal.createdBy':
      return {
        prisma: 'Proposal.createdBy',
        api: 'src/app/api/proposals/[id]/route.ts',
      };
    case 'proposal.customerId':
      return {
        prisma: 'Proposal.customerId',
        api: 'src/app/api/proposals/[id]/route.ts',
      };
    case 'proposal.value':
    case 'proposal.total':
      return {
        prisma: 'Proposal.value',
        service: 'src/lib/services/proposalService.ts → calculateProposalValue()',
        api: 'src/app/api/proposals/[id]/route.ts',
        notes: 'Value is the aggregated total from ProposalProduct.total',
        ui: [
          'src/app/(dashboard)/proposals/manage/page.tsx',
          'src/components/dashboard/RecentProposals.tsx',
          'src/components/proposals/WizardSummary.tsx',
        ],
        types: 'src/types/entities/proposal.ts',
        validation:
          'src/lib/validation/schemas/proposal.ts → proposalWizardStep4Schema.totalValue (frontend) & entity schema (server)',
        description:
          'Total monetary value of a proposal. Derived from sum of ProposalProduct totals in server logic or wizard step 4 on client.',
      };
    case 'proposal.totalValue':
      return {
        prisma: 'Proposal.totalValue',
        api: 'src/app/api/proposals/[id]/route.ts',
        notes: 'Denormalized total value maintained for performance',
      };
    case 'proposal.metadata':
      return {
        prisma: 'Proposal.metadata',
        types: 'src/types/entities/proposal.ts',
      };
    case 'proposal.performanceData':
      return {
        prisma: 'Proposal.performanceData',
        types: 'src/types/entities/proposal.ts',
      };
    case 'proposal.userStoryTracking':
      return {
        prisma: 'Proposal.userStoryTracking',
        types: 'src/types/entities/proposal.ts',
      };
    case 'proposal.statsUpdatedAt':
      return {
        prisma: 'Proposal.statsUpdatedAt',
        types: 'src/types/entities/proposal.ts',
      };
    case 'proposal.createdAt':
      return {
        prisma: 'Proposal.createdAt',
        api: ['src/app/api/proposals/[id]/route.ts', 'src/app/api/proposals/route.ts'],
      };
    case 'proposal.updatedAt':
      return {
        prisma: 'Proposal.updatedAt',
        api: ['src/app/api/proposals/[id]/route.ts', 'src/app/api/proposals/route.ts'],
      };
    case 'proposal.tags':
      return {
        prisma: 'Proposal.tags',
        api: ['src/app/api/proposals/[id]/route.ts', 'src/app/api/proposals/route.ts'],
      };
    case 'proposal.productCount':
      return {
        prisma: 'Proposal.productCount',
        api: 'src/app/api/proposals/[id]/route.ts',
      };
    case 'proposal.sectionCount':
      return {
        prisma: 'Proposal.sectionCount',
        api: 'src/app/api/proposals/[id]/route.ts',
      };
    case 'proposal.lastActivityAt':
      return {
        prisma: 'Proposal.lastActivityAt',
        api: 'src/app/api/proposals/[id]/route.ts',
      };

    // Proposal Product
    case 'proposalProduct.total':
      return {
        prisma: 'ProposalProduct.total',
        service:
          'src/lib/services/proposalService.ts → addProposalProduct(), updateProposalProduct() (recalculates)',
        api: 'src/app/api/proposals/[id]/route.ts',
      };
    case 'proposalProduct.configuration':
      return {
        prisma: 'ProposalProduct.configuration',
      };
    case 'proposalProduct.selectionAnalytics':
      return {
        prisma: 'ProposalProduct.selectionAnalytics',
      };

    // Wizard Step 4 and Summary (frontend)
    case 'wizard.step4.totalValue':
      return {
        ui: [
          'src/components/proposals/steps/ProductSelectionStep.tsx (collectFormData → totalValue)',
          'src/components/proposals/ProposalWizard.tsx (finalProposalValue derived from step4.products)',
        ],
        notes:
          'Step 4 total value computed from selected products; persisted via ProposalWizard submission and mirrored into DB Proposal.value/Proposal.totalValue',
        prisma: 'Proposal.value / Proposal.totalValue (denormalized)',
        api: ['src/app/api/proposals/[id]/route.ts', 'src/app/api/proposals/route.ts'],
        types: 'src/types/proposals/index.ts → ProposalWizardStep4Data.totalValue',
        validation: 'src/lib/validation/schemas/proposal.ts → proposalWizardStep4Schema.totalValue',
        description:
          'Frontend-computed total in wizard step 4; saved on submit and shown in management/summary views.',
      };
    case 'wizard.step4.products.totalPrice':
      return {
        ui: 'src/components/proposals/steps/ProductSelectionStep.tsx (product.totalPrice)',
        notes:
          'Per-product total used to compute step4.totalValue; server-side equivalent is ProposalProduct.total',
        prisma: 'ProposalProduct.total',
        types:
          'src/lib/validation/schemas/proposal.ts → proposalWizardStep4Schema.products[].totalPrice',
        description: 'Calculated total for a single selected product in step 4 UI.',
      };
    case 'wizard.step4.products.quantity':
      return {
        ui: 'src/components/proposals/steps/ProductSelectionStep.tsx (product.quantity)',
        prisma: 'ProposalProduct.quantity',
        types:
          'src/lib/validation/schemas/proposal.ts → proposalWizardStep4Schema.products[].quantity',
        description: 'Quantity of a product selected in step 4 UI.',
      };
    case 'wizard.step4.products.unitPrice':
      return {
        ui: 'src/components/proposals/steps/ProductSelectionStep.tsx (product.unitPrice)',
        prisma: 'ProposalProduct.unitPrice',
        types:
          'src/lib/validation/schemas/proposal.ts → proposalWizardStep4Schema.products[].unitPrice',
        description: 'Unit price for a selected product in step 4 UI.',
      };
    case 'wizard.summary.total':
      return {
        ui: 'src/components/proposals/WizardSummary.tsx',
        notes:
          'Summary screen displays final total; source is step4.totalValue or estimated fallback per ProposalWizard logic',
      };

    // UI display locations (management and dashboard widgets)
    case 'ui.proposals.manage.value':
      return {
        ui: 'src/app/(dashboard)/proposals/manage/page.tsx',
        api: [
          'src/app/api/proposals/route.ts (list)',
          'src/app/api/proposals/list/route.ts (list v2)',
        ],
        prisma: undefined,
        notes:
          'Management table shows proposal value/total; ensure list endpoint selects Proposal.value or denormalized Proposal.totalValue',
        description: 'Proposal value displayed in proposals management table.',
      };
    case 'ui.dashboard.recentProposals.value':
      return {
        ui: 'src/components/dashboard/RecentProposals.tsx',
        api: 'src/app/api/proposals/route.ts',
        notes: 'Recent proposals widget displays value field from API payload',
      };

    // User
    case 'user.id':
      return {
        prisma: 'User.id',
        api: 'src/app/api/users/[id]/route.ts',
      };
    case 'user.email':
      return {
        prisma: 'User.email',
        api: 'src/app/api/users/[id]/route.ts',
        service: 'src/lib/auth/services/userService.ts',
      };
    case 'user.name':
      return {
        prisma: 'User.name',
        api: 'src/app/api/users/[id]/route.ts',
        service: 'src/lib/auth/services/userService.ts',
      };
    case 'user.department':
      return {
        prisma: 'User.department',
        api: 'src/app/api/users/[id]/route.ts',
      };
    case 'user.status':
      return {
        prisma: 'User.status',
        api: 'src/app/api/users/[id]/route.ts',
      };
    case 'user.createdAt':
      return {
        prisma: 'User.createdAt',
        api: 'src/app/api/users/[id]/route.ts',
      };
    case 'user.updatedAt':
      return {
        prisma: 'User.updatedAt',
        api: 'src/app/api/users/[id]/route.ts',
      };
  }
}

function locateEntityInternal(key: EntityKey): DomainFieldLocation {
  switch (key) {
    // Product
    case 'product.id':
      return {
        prisma: 'Product.id',
        types: 'src/types/entities/product.ts',
        api: 'src/app/api/products/[id]/route.ts',
      };
    case 'product.name':
      return {
        prisma: 'Product.name',
        types: 'src/types/entities/product.ts',
        api: 'src/app/api/products/[id]/route.ts',
      };
    case 'product.description':
      return { prisma: 'Product.description', types: 'src/types/entities/product.ts' };
    case 'product.sku':
      return {
        prisma: 'Product.sku',
        types: 'src/types/entities/product.ts',
        api: 'src/app/api/products/[id]/route.ts',
      };
    case 'product.price':
      return { prisma: 'Product.price', types: 'src/types/entities/product.ts' };
    case 'product.currency':
      return { prisma: 'Product.currency', types: 'src/types/entities/product.ts' };
    case 'product.category':
      return { prisma: 'Product.category', types: 'src/types/entities/product.ts' };
    case 'product.tags':
      return { prisma: 'Product.tags', types: 'src/types/entities/product.ts' };
    case 'product.attributes':
      return { prisma: 'Product.attributes', types: 'src/types/entities/product.ts' };
    case 'product.images':
      return { prisma: 'Product.images', types: 'src/types/entities/product.ts' };
    case 'product.isActive':
      return { prisma: 'Product.isActive', types: 'src/types/entities/product.ts' };
    case 'product.version':
      return { prisma: 'Product.version', types: 'src/types/entities/product.ts' };
    case 'product.createdAt':
      return { prisma: 'Product.createdAt', types: 'src/types/entities/product.ts' };
    case 'product.updatedAt':
      return { prisma: 'Product.updatedAt', types: 'src/types/entities/product.ts' };

    // Customer (additional fields beyond base ones already covered)
    case 'customer.address':
      return { prisma: 'Customer.address', types: 'src/types/entities/customer.ts' };
    case 'customer.companySize':
      return { prisma: 'Customer.companySize', types: 'src/types/entities/customer.ts' };
    case 'customer.revenue':
      return { prisma: 'Customer.revenue', types: 'src/types/entities/customer.ts' };
    case 'customer.lastContact':
      return { prisma: 'Customer.lastContact', types: 'src/types/entities/customer.ts' };
    case 'customer.tags':
      return { prisma: 'Customer.tags', types: 'src/types/entities/customer.ts' };
    case 'customer.metadata':
      return { prisma: 'Customer.metadata', types: 'src/types/entities/customer.ts' };
    case 'customer.segmentation':
      return { prisma: 'Customer.segmentation', types: 'src/types/entities/customer.ts' };
    case 'customer.riskScore':
      return { prisma: 'Customer.riskScore', types: 'src/types/entities/customer.ts' };
    case 'customer.ltv':
      return { prisma: 'Customer.ltv', types: 'src/types/entities/customer.ts' };
  }
}

function locateWizardInternal(key: WizardKey): DomainFieldLocation {
  switch (key) {
    // Step 1
    case 'wizard.step1.client.id':
      return {
        ui: 'src/components/proposals/steps/BasicInformationStep.tsx',
        types: 'src/types/proposals/index.ts',
      };
    case 'wizard.step1.client.name':
      return {
        ui: 'src/components/proposals/steps/BasicInformationStep.tsx',
        types: 'src/types/proposals/index.ts',
      };
    case 'wizard.step1.client.industry':
      return {
        ui: 'src/components/proposals/steps/BasicInformationStep.tsx',
        types: 'src/types/proposals/index.ts',
      };
    case 'wizard.step1.client.contactPerson':
      return { ui: 'src/components/proposals/steps/BasicInformationStep.tsx' };
    case 'wizard.step1.client.contactEmail':
      return { ui: 'src/components/proposals/steps/BasicInformationStep.tsx' };
    case 'wizard.step1.client.contactPhone':
      return { ui: 'src/components/proposals/steps/BasicInformationStep.tsx' };
    case 'wizard.step1.details.title':
    case 'wizard.step1.details.rfpReferenceNumber':
    case 'wizard.step1.details.dueDate':
    case 'wizard.step1.details.estimatedValue':
    case 'wizard.step1.details.priority':
    case 'wizard.step1.details.description':
      return {
        ui: 'src/components/proposals/steps/BasicInformationStep.tsx',
        types: 'src/types/proposals/index.ts',
        validation: 'src/lib/validation/schemas/proposal.ts → proposalMetadataSchema',
      };

    // Step 2
    case 'wizard.step2.teamLead':
    case 'wizard.step2.salesRepresentative':
    case 'wizard.step2.subjectMatterExperts':
    case 'wizard.step2.executiveReviewers':
      return {
        ui: 'src/components/proposals/steps/TeamAssignmentStep.tsx',
        validation: 'src/lib/validation/schemas/proposal.ts → proposalWizardStep2Schema',
      };

    // Step 3
    case 'wizard.step3.selectedContent':
    case 'wizard.step3.searchHistory':
    case 'wizard.step3.crossStepValidation.teamAlignment':
    case 'wizard.step3.crossStepValidation.productCompatibility':
    case 'wizard.step3.crossStepValidation.rfpCompliance':
    case 'wizard.step3.crossStepValidation.sectionCoverage':
      return {
        ui: 'src/components/proposals/steps/ContentSelectionStep.tsx',
        validation: 'src/lib/validation/schemas/proposal.ts → proposalWizardStep3Schema',
      };

    // Step 4 (extended)
    case 'wizard.step4.products':
    case 'wizard.step4.aiRecommendationsUsed':
    case 'wizard.step4.searchHistory':
    case 'wizard.step4.crossStepValidation.teamCompatibility':
    case 'wizard.step4.crossStepValidation.contentAlignment':
    case 'wizard.step4.crossStepValidation.budgetCompliance':
    case 'wizard.step4.crossStepValidation.timelineRealistic':
      return {
        ui: 'src/components/proposals/steps/ProductSelectionStep.tsx',
        validation: 'src/lib/validation/schemas/proposal.ts → proposalWizardStep4Schema',
      };

    // Step 5
    case 'wizard.step5.sections':
    case 'wizard.step5.sectionAssignments':
    case 'wizard.step5.totalEstimatedHours':
    case 'wizard.step5.criticalPath':
    case 'wizard.step5.timelineEstimate.startDate':
    case 'wizard.step5.timelineEstimate.endDate':
    case 'wizard.step5.timelineEstimate.complexity':
    case 'wizard.step5.timelineEstimate.riskFactors':
      return {
        ui: 'src/components/proposals/steps/SectionAssignmentStep.tsx',
        validation: 'src/lib/validation/schemas/proposal.ts → proposalWizardStep5Schema',
      };

    // Step 6
    case 'wizard.step6.finalValidation.isValid':
    case 'wizard.step6.finalValidation.completeness':
    case 'wizard.step6.finalValidation.issues':
    case 'wizard.step6.finalValidation.complianceChecks':
    case 'wizard.step6.approvals':
    case 'wizard.step6.insights.complexity':
    case 'wizard.step6.insights.winProbability':
    case 'wizard.step6.insights.estimatedEffort':
    case 'wizard.step6.insights.similarProposals':
    case 'wizard.step6.insights.keyDifferentiators':
    case 'wizard.step6.insights.suggestedFocusAreas':
    case 'wizard.step6.insights.riskFactors':
    case 'wizard.step6.exportOptions':
    case 'wizard.step6.finalReviewComplete':
      return {
        ui: 'src/components/proposals/steps/ReviewStep.tsx',
        validation: 'src/lib/validation/schemas/proposal.ts → proposalWizardStep6Schema',
      };
    default:
      return { notes: 'Unknown wizard key' };
  }
}

const ALL_DOMAIN_KEYS: readonly DomainKey[] = [
  'customer.id', // Customer primary key
  'customer.name', // Customer name
  'customer.email', // Customer email address
  'customer.phone', // Customer phone
  'customer.website', // Customer website
  'customer.industry', // Customer industry
  'customer.status', // Customer status enum
  'customer.tier', // Customer tier enum
  'customer.createdAt', // Customer creation timestamp
  'customer.updatedAt', // Customer last update timestamp
  'proposal.id', // Proposal primary key
  'proposal.status', // Proposal status enum
  'proposal.value', // Total proposal value (server)
  'proposal.total', // Alias of proposal.value
  'proposal.totalValue', // Denormalized total proposal value
  'proposal.title', // Proposal title
  'proposal.description', // Proposal description
  'proposal.priority', // Proposal priority enum
  'proposal.currency', // Currency ISO code
  'proposal.dueDate', // Proposal due date
  'proposal.submittedAt', // Proposal submitted timestamp
  'proposal.approvedAt', // Proposal approved timestamp
  'proposal.createdBy', // Creator user ID
  'proposal.customerId', // Customer foreign key
  'proposal.createdAt', // Proposal creation timestamp
  'proposal.updatedAt', // Proposal last update timestamp
  'proposal.tags', // Proposal tags array
  'proposal.productCount', // Denormalized count of products
  'proposal.sectionCount', // Denormalized count of sections
  'proposal.lastActivityAt', // Last activity timestamp
  'user.id', // User primary key
  'user.email', // User email address
  'user.name', // User display name
  'user.department', // User department
  'user.status', // User status enum
  'user.createdAt', // User creation timestamp
  'user.updatedAt', // User last update timestamp
  'proposalProduct.total', // Line-item total for a proposal product
] as const;

export const domainFields = {
  locate: (key: DomainKey): DomainFieldLocation => {
    const base = locateDomainInternal(key);
    const description = base.description ?? generateDomainDescription(key);
    return { ...base, description };
  },
  listKeys: (): readonly DomainKey[] => ALL_DOMAIN_KEYS,
} as const;

const ALL_ENTITY_KEYS: readonly EntityKey[] = [
  'product.id', // Product primary key
  'product.name', // Product name
  'product.description', // Product description
  'product.sku', // Stock Keeping Unit
  'product.price', // Base price
  'product.currency', // Currency ISO code
  'product.category', // Categories array
  'product.tags', // Tags array
  'product.attributes', // Attributes JSON
  'product.images', // Image URLs
  'product.isActive', // Active flag
  'product.version', // Version number
  'product.createdAt', // Created timestamp
  'product.updatedAt', // Updated timestamp
  'customer.address', // Customer address
  'customer.companySize', // Company size
  'customer.revenue', // Reported revenue
  'customer.lastContact', // Last contact date
  'customer.tags', // Tags array
  'customer.metadata', // Metadata JSON
  'customer.segmentation', // Segmentation JSON
  'customer.riskScore', // Risk score
  'customer.ltv', // Lifetime value
] as const;

export const entityFields = {
  locate: (key: EntityKey): DomainFieldLocation => {
    const base = locateEntityInternal(key);
    const description = base.description ?? generateEntityDescription(key);
    return { ...base, description };
  },
  listKeys: (): readonly EntityKey[] => ALL_ENTITY_KEYS,
} as const;

const ALL_WIZARD_KEYS: readonly WizardKey[] = [
  // Step 1
  'wizard.step1.client.id', // Selected customer ID
  'wizard.step1.client.name', // Selected customer name
  'wizard.step1.client.industry', // Customer industry
  'wizard.step1.client.contactPerson', // Contact person name
  'wizard.step1.client.contactEmail', // Contact person email
  'wizard.step1.client.contactPhone', // Contact person phone
  'wizard.step1.details.title', // Proposal title
  'wizard.step1.details.rfpReferenceNumber', // RFP reference number
  'wizard.step1.details.dueDate', // Proposal due date
  'wizard.step1.details.estimatedValue', // Estimated value (fallback if no products)
  'wizard.step1.details.priority', // Proposal priority
  'wizard.step1.details.description', // Proposal description
  // Step 2
  'wizard.step2.teamLead', // Team lead user ID
  'wizard.step2.salesRepresentative', // Sales representative user ID
  'wizard.step2.subjectMatterExperts', // SME assignments map
  'wizard.step2.executiveReviewers', // Executive reviewer user IDs
  // Step 3
  'wizard.step3.selectedContent', // Selected content items list
  'wizard.step3.searchHistory', // Content search history
  'wizard.step3.crossStepValidation.teamAlignment', // Team alignment result
  'wizard.step3.crossStepValidation.productCompatibility', // Product compatibility result
  'wizard.step3.crossStepValidation.rfpCompliance', // RFP compliance result
  'wizard.step3.crossStepValidation.sectionCoverage', // Section coverage result
  // Step 4
  'wizard.step4.products', // Selected products list
  'wizard.step4.aiRecommendationsUsed', // Number of AI recommendations used
  'wizard.step4.searchHistory', // Product search history
  'wizard.step4.crossStepValidation.teamCompatibility', // Team-product alignment
  'wizard.step4.crossStepValidation.contentAlignment', // Content-product alignment
  'wizard.step4.crossStepValidation.budgetCompliance', // Budget compliance
  'wizard.step4.crossStepValidation.timelineRealistic', // Timeline realism
  'wizard.step4.totalValue', // Step 4 total value
  'wizard.step4.products.totalPrice', // Per-product total price
  'wizard.step4.products.quantity', // Product quantity
  'wizard.step4.products.unitPrice', // Product unit price
  'wizard.summary.total', // Wizard summary total displayed
  // Step 5
  'wizard.step5.sections', // Proposal sections list
  'wizard.step5.sectionAssignments', // Section to assignee mapping
  'wizard.step5.totalEstimatedHours', // Total estimated hours across sections
  'wizard.step5.criticalPath', // Critical path dependencies
  'wizard.step5.timelineEstimate.startDate', // Timeline start date
  'wizard.step5.timelineEstimate.endDate', // Timeline end date
  'wizard.step5.timelineEstimate.complexity', // Estimated complexity
  'wizard.step5.timelineEstimate.riskFactors', // Risk factors list
  // Step 6
  'wizard.step6.finalValidation.isValid', // Final validation flag
  'wizard.step6.finalValidation.completeness', // Completeness percentage
  'wizard.step6.finalValidation.issues', // Validation issues list
  'wizard.step6.finalValidation.complianceChecks', // Compliance checks list
  'wizard.step6.approvals', // Approvals list
  'wizard.step6.insights.complexity', // Overall complexity insight
  'wizard.step6.insights.winProbability', // Win probability insight
  'wizard.step6.insights.estimatedEffort', // Estimated effort insight
  'wizard.step6.insights.similarProposals', // Similar proposals reference
  'wizard.step6.insights.keyDifferentiators', // Key differentiators
  'wizard.step6.insights.suggestedFocusAreas', // Suggested focus areas
  'wizard.step6.insights.riskFactors', // Risks identified
  'wizard.step6.exportOptions', // Export options configuration
  'wizard.step6.finalReviewComplete', // Final review completion flag
] as const;

export const wizardFields = {
  locate: (key: WizardKey): DomainFieldLocation => {
    const base = locateWizardInternal(key);
    const description = base.description ?? generateWizardDescription(key);
    return { ...base, description };
  },
  listKeys: (): readonly WizardKey[] => ALL_WIZARD_KEYS,
} as const;

// Auto-generated descriptions for fields
function generateDomainDescription(key: DomainKey): string {
  if (key.startsWith('customer.')) {
    const field = key.split('.')[1];
    return `Customer ${field} field as stored in Prisma and used across API/UI.`;
  }
  if (key.startsWith('proposal.')) {
    const field = key.split('.')[1];
    return `Proposal ${field} field managed in Prisma model, exposed via API, and rendered in UI.`;
  }
  if (key.startsWith('user.')) {
    const field = key.split('.')[1];
    return `User ${field} field from Prisma User model, available to backend and UI.`;
  }
  if (key.startsWith('proposalProduct.')) {
    const field = key.split('.')[1];
    return `ProposalProduct ${field} computed/stored on server and surfaced in proposal views.`;
  }
  if (key.startsWith('ui.')) {
    return `UI display mapping for ${key.split('.').slice(1).join('.')}.`;
  }
  if (key.startsWith('wizard.')) {
    return `Wizard field ${key} used in the proposal creation flow.`;
  }
  return `Field ${key} used across data model and application layers.`;
}

function generateEntityDescription(key: EntityKey): string {
  if (key.startsWith('product.')) {
    const field = key.split('.')[1];
    return `Product ${field} field defined in Prisma Product model and entity types.`;
  }
  if (key.startsWith('customer.')) {
    const field = key.split('.')[1];
    return `Customer ${field} field defined in Prisma Customer model and entity types.`;
  }
  return `Entity field ${key}.`;
}

function generateWizardDescription(key: WizardKey): string {
  if (key.includes('step1')) return 'Wizard Step 1: basic information captured from the user.';
  if (key.includes('step2')) return 'Wizard Step 2: team assignment selections and roles.';
  if (key.includes('step3')) return 'Wizard Step 3: selected content items and validation flags.';
  if (key.includes('step4')) return 'Wizard Step 4: product selections, pricing, and totals.';
  if (key.includes('step5')) return 'Wizard Step 5: sections, assignments, and timeline details.';
  if (key.includes('step6')) return 'Wizard Step 6: final review, approvals, and insights.';
  if (key.includes('wizard.summary.total')) return 'Wizard summary total displayed to the user.';
  return `Wizard field ${key}.`;
}
