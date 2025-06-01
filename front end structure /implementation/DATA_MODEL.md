# PosalPro MVP2 - Data Model Schema

## Overview

This document defines the data model schema for PosalPro MVP2, detailing entity
relationships, attributes, and validation rules. The schema supports all
features defined in the wireframes, with special attention to the complex logic
requirements of the Product Relationships, Approval Workflow, and Predictive
Validation modules.

## Core Entities

### User

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  roles: Role[];
  department: string;
  permissions: Permission[];
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  status: 'active' | 'inactive' | 'pending';
  temporaryAccess?: TemporaryAccess[];
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: NotificationPreferences;
  dashboardLayout: LayoutConfiguration;
  language: string;
}

interface TemporaryAccess {
  roleId: string;
  grantedBy: string;
  reason: string;
  expiresAt: Date;
  status: 'active' | 'expired' | 'revoked';
}
```

### Role

```typescript
interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  parent?: string; // Parent role ID for inheritance
  level: number; // Hierarchy level
  isSystem: boolean; // System roles cannot be modified
  createdAt: Date;
  updatedAt: Date;
  contextRules?: ContextRule[]; // For ABAC extension
}

interface ContextRule {
  attribute: string; // e.g., 'time', 'location', 'customerTier'
  operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';
  value: any;
  effect: 'grant' | 'deny';
}

interface Permission {
  id: string;
  resource: string; // e.g., 'proposals', 'products'
  action: string; // e.g., 'create', 'read', 'update', 'delete'
  constraints?: Record<string, any>; // Additional constraints
  scope?: 'all' | 'team' | 'own';
}
```

### Proposal

```typescript
interface Proposal {
  id: string;
  title: string;
  description: string;
  customer: Customer;
  createdBy: string; // User ID
  assignedTo: string[]; // User IDs
  status: ProposalStatus;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  submittedDate?: Date;
  approvalStatus: ApprovalStatus;
  sections: ProposalSection[];
  products: ProposalProduct[];
  value: number;
  currency: string;
  validUntil: Date;
  metadata: Record<string, any>;
  lifecycle: ProposalLifecycleEvent[];
  tags: string[];
  riskScore?: number; // From predictive validation
}

type ProposalStatus =
  | 'draft'
  | 'in_review'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'submitted'
  | 'accepted'
  | 'declined';

interface ProposalSection {
  id: string;
  title: string;
  content: string;
  order: number;
  type: 'text' | 'products' | 'terms' | 'pricing' | 'custom';
  metadata: Record<string, any>;
  validationStatus: 'valid' | 'invalid' | 'warning' | 'not_validated';
}

interface ProposalProduct {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  configuration: Record<string, any>;
  validationIssues: ValidationIssue[];
}

interface ProposalLifecycleEvent {
  id: string;
  stage: string;
  timestamp: Date;
  userId: string;
  notes?: string;
  metadata: Record<string, any>;
}
```

### Product

```typescript
interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  price: number;
  currency: string;
  category: string[];
  attributes: Record<string, any>;
  images: string[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  relationships: ProductRelationship[];
  validationRules: ValidationRule[];
}

interface ProductRelationship {
  id: string;
  sourceProductId: string;
  targetProductId: string;
  type: 'requires' | 'recommends' | 'incompatible' | 'alternative' | 'optional';
  quantity?: number;
  condition?: RelationshipCondition;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // User ID
}

interface RelationshipCondition {
  rules: ConditionRule[];
  operator: 'and' | 'or';
}

interface ConditionRule {
  attribute: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';
  value: any;
}
```

### Validation

```typescript
interface ValidationRule {
  id: string;
  name: string;
  description: string;
  category: string;
  severity: 'critical' | 'warning' | 'info';
  condition: RuleCondition;
  message: string;
  suggestedFixes: SuggestedFix[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // User ID
  isActive: boolean;
  metadata: Record<string, any>;
  aiGenerated: boolean;
  confidence?: number; // For AI-generated rules
}

interface RuleCondition {
  rules: ConditionRule[];
  operator: 'and' | 'or';
}

interface SuggestedFix {
  id: string;
  description: string;
  actionType:
    | 'add_product'
    | 'remove_product'
    | 'change_configuration'
    | 'document_exception';
  actionParams: Record<string, any>;
  autoApplicable: boolean;
}

interface ValidationIssue {
  id: string;
  ruleId: string;
  entityId: string; // ID of entity being validated (e.g., proposal ID)
  entityType: 'proposal' | 'product' | 'section';
  message: string;
  severity: 'critical' | 'warning' | 'info';
  status: 'open' | 'resolved' | 'suppressed';
  createdAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string; // User ID
  resolution?: string;
  suggestedFixes: SuggestedFix[];
  context: Record<string, any>;
}
```

### Approval

```typescript
interface ApprovalWorkflow {
  id: string;
  name: string;
  description: string;
  stages: ApprovalStage[];
  isTemplate: boolean;
  applicableTypes: string[]; // Types of entities this workflow applies to
  conditions: WorkflowCondition[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // User ID
  version: number;
}

interface ApprovalStage {
  id: string;
  name: string;
  description: string;
  approvers: Approver[];
  order: number;
  requiredApprovals: number; // Number of approvals needed to proceed
  sla?: number; // Time in hours to complete this stage
  conditionalExecution?: StageCondition;
  escalation?: EscalationRule;
}

interface Approver {
  type: 'user' | 'role';
  id: string; // User ID or Role ID
  delegationAllowed: boolean;
}

interface StageCondition {
  rules: ConditionRule[];
  operator: 'and' | 'or';
}

interface EscalationRule {
  triggerAfterHours: number;
  escalateToType: 'user' | 'role';
  escalateToId: string; // User ID or Role ID
  notifications: boolean;
}

interface WorkflowCondition {
  rules: ConditionRule[];
  operator: 'and' | 'or';
}

interface ApprovalStatus {
  workflowId: string;
  currentStage: string;
  stages: StageStatus[];
  startedAt: Date;
  completedAt?: Date;
  status: 'not_started' | 'in_progress' | 'completed' | 'rejected';
  overallDecision?: 'approved' | 'rejected';
}

interface StageStatus {
  stageId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  approvals: ApprovalDecision[];
  startedAt?: Date;
  completedAt?: Date;
  slaStatus: 'within' | 'warning' | 'exceeded';
}

interface ApprovalDecision {
  approverId: string;
  decision?: 'approved' | 'rejected' | 'changes_requested';
  timestamp?: Date;
  comments?: string;
  delegatedTo?: string;
  attachments?: string[];
}
```

### Customer

```typescript
interface Customer {
  id: string;
  name: string;
  industry: string;
  tier: 'standard' | 'premium' | 'enterprise';
  contacts: Contact[];
  addresses: Address[];
  createdAt: Date;
  updatedAt: Date;
  primaryContact?: string; // Contact ID
  metadata: Record<string, any>;
  tags: string[];
}

interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  position?: string;
  isPrimary: boolean;
}

interface Address {
  id: string;
  type: 'billing' | 'shipping' | 'headquarters';
  street: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  isPrimary: boolean;
}
```

### Content

```typescript
interface Content {
  id: string;
  title: string;
  description: string;
  body: string;
  type: 'text' | 'image' | 'video' | 'document';
  tags: string[];
  categories: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // User ID
  approvedBy?: string; // User ID
  status: 'draft' | 'review' | 'approved' | 'archived';
  version: number;
  metadata: Record<string, any>;
  aiMetadata?: AIContentMetadata;
}

interface AIContentMetadata {
  generatedSections?: string[];
  suggestedKeywords?: string[];
  similarContent?: string[]; // Content IDs
  relevanceScore?: number;
}
```

### PredictiveValidation

```typescript
interface ValidationPattern {
  id: string;
  name: string;
  description: string;
  issueType: string;
  frequency: number;
  commonResolutions: Resolution[];
  affectedEntityTypes: string[];
  createdAt: Date;
  updatedAt: Date;
  confidence: number;
  status: 'active' | 'inactive' | 'proposed';
}

interface Resolution {
  id: string;
  type: string;
  description: string;
  effectiveness: number; // 0-100 scale
  applicationCount: number;
}

interface RiskAnalysis {
  id: string;
  entityId: string;
  entityType: 'proposal' | 'product';
  riskScore: number; // 0-100 scale
  factors: RiskFactor[];
  predictedIssues: PredictedIssue[];
  createdAt: Date;
  recommendedActions: RecommendedAction[];
}

interface RiskFactor {
  name: string;
  impact: number; // 0-100 scale
  description: string;
}

interface PredictedIssue {
  type: string;
  description: string;
  confidence: number; // 0-100 scale
  severity: 'critical' | 'warning' | 'info';
  suggestedFixes: SuggestedFix[];
}

interface RecommendedAction {
  id: string;
  description: string;
  type: string;
  impact: number; // 0-100 scale
  difficulty: 'easy' | 'medium' | 'hard';
}
```

## Entity Relationships

### Core Relationships

1. **User to Role (Many-to-Many)**

   - Users can have multiple roles
   - Roles can be assigned to multiple users

2. **Role to Permission (Many-to-Many)**

   - Roles consist of multiple permissions
   - Permissions can be included in multiple roles

3. **Role to Role (Many-to-One)**

   - Roles can inherit from parent roles in the hierarchy

4. **Proposal to Customer (Many-to-One)**

   - Proposals are associated with a single customer
   - Customers can have multiple proposals

5. **Proposal to User (Many-to-Many)**

   - Proposals can be assigned to multiple users
   - Users can be assigned to multiple proposals

6. **Proposal to Product (Many-to-Many)**

   - Proposals include multiple products
   - Products can be included in multiple proposals

7. **Product to Product (Many-to-Many)**

   - Products can have relationships with other products
   - Relationships include dependencies, compatibility, etc.

8. **Proposal to ApprovalWorkflow (Many-to-One)**

   - Proposals follow a specific approval workflow
   - Approval workflows can be applied to multiple proposals

9. **Proposal to ValidationIssue (One-to-Many)**

   - Proposals can have multiple validation issues
   - Each validation issue is associated with a specific proposal

10. **ValidationRule to ValidationIssue (One-to-Many)**
    - Validation rules can generate multiple validation issues
    - Each validation issue is generated by a specific rule

## Schema Diagrams

```
User ---> Role ---> Permission
 |         |
 v         v
Proposal <--- ApprovalWorkflow
 |    |
 |    v
 |  ValidationIssue <--- ValidationRule
 v
Customer

Product <---> Product (Relationships)
  ^
  |
Proposal
  |
  v
Content
```

## Validation Rules

1. **Product Relationship Validation**

   - Required products must be included in a proposal
   - Incompatible products cannot be in the same proposal
   - Quantity rules must be satisfied (e.g., 2 licenses per server)
   - Conditional rules based on product configurations

2. **Proposal Validation**

   - Required sections must be completed
   - Pricing must align with product catalog and discount policies
   - Approval workflows must match proposal characteristics
   - Customer information must be complete

3. **Permission Validation**

   - Separation of duties conflicts must be prevented
   - Role hierarchy must be respected
   - Contextual permissions must be evaluated with current context

4. **Approval Workflow Validation**
   - Workflow stages must have valid approvers
   - Conditional execution rules must be valid
   - SLA definitions must be reasonable
   - Escalation rules must refer to valid users/roles

## Technical Considerations

1. **Performance**

   - Optimize query patterns for relationship-heavy operations
   - Index frequently accessed fields
   - Consider denormalization for complex approval and validation states

2. **Security**

   - Strict validation of permission checks
   - Audit logging for all critical operations
   - Data access controls based on RBAC model

3. **Scalability**

   - Separation of read and write models for high-volume operations
   - Pagination for large data sets
   - Optimized relationship traversal

4. **AI Integration**
   - Storage for training data and learned patterns
   - Confidence scoring for predictions
   - Feedback mechanisms for improving recommendations
