# Proposal Creation Screen - Refined Layout

## User Story Traceability

**Primary User Stories**: US-4.1, US-2.2 **Hypothesis Coverage**: H7 (Deadline
Management - 40% on-time improvement), H4 (Cross-Department Coordination - 40%
effort reduction) **Test Cases**: TC-H7-001, TC-H4-001

### User Story Details

- **US-4.1**: Intelligent timeline creation (Proposal Manager)
  - _Acceptance Criteria_: Complexity-based estimates, critical path, ≥40%
    on-time improvement
- **US-2.2**: Intelligent assignment management (Proposal Manager)
  - _Acceptance Criteria_: Smart contributor suggestions, status tracking, ≥40%
    coordination reduction

### Acceptance Criteria Implementation Mapping

- **AC-4.1.1**: Timeline based on complexity →
  `ProposalWizard.complexityEstimation()`
- **AC-4.1.2**: Critical path identification →
  `TeamAssignmentStep.criticalPath()`
- **AC-4.1.3**: On-time completion improvement ≥40% → Instrumentation in
  `useProposalCreation()`
- **AC-2.2.1**: Smart contributor suggestions →
  `SMEAssignmentPanel.suggestContributors()`
- **AC-2.2.2**: Real-time status tracking →
  `ProposalWizard.initializeTracking()`
- **AC-2.2.3**: Coordination effort reduction ≥40% → Instrumentation in
  `useTeamCoordination()`

### Component Traceability Matrix

```typescript
// Proposal Creation Interface Components - User Story Mapping
interface ComponentMapping {
  ProposalWizard: {
    userStories: ['US-4.1', 'US-2.2'];
    acceptanceCriteria: ['AC-4.1.1', 'AC-4.1.3', 'AC-2.2.2'];
    methods: [
      'complexityEstimation()',
      'initializeTracking()',
      'createProposal()',
    ];
  };
  TeamAssignmentStep: {
    userStories: ['US-2.2', 'US-4.1'];
    acceptanceCriteria: ['AC-2.2.1', 'AC-4.1.2'];
    methods: ['suggestContributors()', 'criticalPath()', 'assignTeamMembers()'];
  };
  SMEAssignmentPanel: {
    userStories: ['US-2.2'];
    acceptanceCriteria: ['AC-2.2.1', 'AC-2.2.3'];
    methods: ['suggestContributors()', 'trackAssignmentTime()'];
  };
  ContentSelectionStep: {
    userStories: ['US-1.2'];
    acceptanceCriteria: ['AC-1.2.1', 'AC-1.2.2'];
    methods: ['suggestContent()', 'categorizeContent()'];
  };
  ValidationStep: {
    userStories: ['US-3.1'];
    acceptanceCriteria: ['AC-3.1.1'];
    methods: ['validateProposal()', 'checkCompliance()'];
  };
  TimelineEstimator: {
    userStories: ['US-4.1'];
    acceptanceCriteria: ['AC-4.1.1', 'AC-4.1.3'];
    methods: ['estimateTimeline()', 'calculateComplexity()'];
  };
}
```

### Measurement Instrumentation Requirements

```typescript
// Analytics for Hypotheses H7 & H4 Validation
interface ProposalCreationMetrics {
  // US-4.1 Measurements (Timeline Management)
  proposalId: string;
  creationTime: number; // Total time to create proposal
  complexityScore: number; // Calculated complexity (1-10)
  estimatedTimeline: number; // AI-generated timeline estimate
  teamAssignmentTime: number; // Time to assign team
  coordinationSetupTime: number; // Target: ≥40% reduction

  // US-2.2 Measurements (Team Assignment)
  teamSize: number;
  aiSuggestionsAccepted: number;
  manualAssignments: number;
  assignmentAccuracy: number; // How often suggestions are accepted

  // Content and Validation Integration
  contentSuggestionsUsed: number;
  validationIssuesFound: number;
  wizardCompletionRate: number;
}

// Implementation Hooks
const useProposalCreationAnalytics = () => {
  const trackCreation = (metrics: ProposalCreationMetrics) => {
    analytics.track('proposal_creation_performance', {
      ...metrics,
      timestamp: Date.now(),
      userId: user.id,
      userRole: user.role,
    });
  };

  const trackWizardStep = (step: string, timeSpent: number) => {
    analytics.track('wizard_step_performance', {
      step,
      timeSpent,
      timestamp: Date.now(),
    });
  };

  return { trackCreation, trackWizardStep };
};

const useTeamCoordinationAnalytics = () => {
  const trackAssignmentEfficiency = (
    aiSuggestions: number,
    manualChanges: number
  ) => {
    const efficiency = (aiSuggestions - manualChanges) / aiSuggestions;
    analytics.track('assignment_efficiency', {
      efficiency,
      aiSuggestions,
      manualChanges,
      timestamp: Date.now(),
    });
  };

  return { trackAssignmentEfficiency };
};
```

### Testing Scenario Integration

- **TC-H7-001**: Timeline management validation (US-4.1)
- **TC-H4-001**: Coordination effort reduction validation (US-2.2)

---

## Selected Design: Version A (Step-by-Step Wizard)

```
+-----------------------------------------------+
| POSALPRO                      [Search] [👤 MR] |
+------------+----------------------------------|
|            |                                  |
| Dashboard  | Proposals > Create New Proposal  |
|            |                                  |
| Proposals ◀| +----------------------------+   |
|            | | Step 1 of 6: Basic Information |
| Content    | +----------------------------+   |
|            |                                  |
| Assignments| Client Information                |
|            | +----------------------------+   |
| Validation | | Client Name                |   |
|            | | [Acme Corporation      ]   |   |
| Admin      | |                            |   |
|            | | Client Industry            |   |
| Settings   | | [Technology          ▼]    |   |
|            | |                            |   |
|            | | Contact Person             |   |
|            | | [Jane Smith           ]    |   |
|            | |                            |   |
|            | | Contact Email              |   |
|            | | [j.smith@acme.com     ]    |   |
|            | |                            |   |
|            | | Contact Phone              |   |
|            | | [(555) 123-4567       ]    |   |
|            | +----------------------------+   |
|            |                                  |
|            | Proposal Details                 |
|            | +----------------------------+   |
|            | | Proposal Title             |   |
|            | | [Cloud Migration Services] |   |
|            | | Title is required          |   |
|            | |                            |   |
|            | | RFP Reference Number       |   |
|            | | [ACME-2025-103        ]    |   |
|            | |                            |   |
|            | | Due Date                   |   |
|            | | [06/15/2025          ]     |   |
|            | |                            |   |
|            | | Estimated Value            |   |
|            | | [$250,000            ]     |   |
|            | |                            |   |
|            | | Priority                   |   |
|            | | (○) High  ( ) Medium ( ) Low |  |
|            | +----------------------------+   |
|            |                                  |
|            | [Cancel] [Save Draft] [Next Step >] |
|            |                                  |
+------------+----------------------------------+
```

### Step Navigation Bar (expanded)

```
+-----------------------------------------------+
| POSALPRO                      [Search] [👤 MR] |
+------------+----------------------------------|
|            |                                  |
| Dashboard  | Proposals > Create New Proposal  |
|            |                                  |
| Proposals ◀| +-----------------------------------+ |
|            | | Step:                             | |
| Content    | | [1. Basic➡️] [2. Team] [3. Content] | |
|            | | [4. Products] [5. Sections] [6. Review] | |
| Assignments| +-----------------------------------+ |
|            |                                  |
| Validation | Step 2 of 6: Team Assignment     |
|            |                                  |
| Admin      | Proposal Team                    |
|            | +----------------------------+   |
| Settings   | | Team Lead                  |   |
|            | | [Mohamed Rabah      ▼]     |   |
|            | |                            |   |
|            | | Sales Representative       |   |
|            | | [Sarah Johnson      ▼]     |   |
|            | +----------------------------+   |
|            |                                  |
|            | Subject Matter Experts          |
|            | +-------------------------------------------+ |
|            | | Expertise       | Assigned SME  | Actions | |
|            | |-----------------|---------------|--------| |
|            | | Technical       | [John S.   ▼] | [✕]    | |
|            | | Security        | [Alex P.   ▼] | [✕]    | |
|            | | Legal           | [Add SME   ▼] | [✕]    | |
|            | | Pricing         | [Lisa K.   ▼] | [✕]    | |
|            | +-------------------------------------------+ |
|            |                                  |
|            | [ + Add Expertise ]              |
|            |                                  |
|            | Executive Reviewers              |
|            | +----------------------------+   |
|            | | [✓] David Chen (CTO)      |   |
|            | | [ ] Maria Rodriguez (CFO) |   |
|            | | [ ] Robert Kim (CEO)      |   |
|            | +----------------------------+   |
|            |                                  |
|            | [< Previous] [Save Draft] [Next Step >] |
|            |                                  |
+------------+----------------------------------+
```

### AI Content Selection Step

```
+-----------------------------------------------+
| POSALPRO                      [Search] [👤 MR] |
+------------+----------------------------------|
|            |                                  |
| Dashboard  | Proposals > Create New Proposal  |
|            |                                  |
| Proposals ◀| +-----------------------------------+ |
|            | | Step:                             | |
| Content    | | [1. Basic] [2. Team] [3. Content➡️] | |
|            | | [4. Products] [5. Sections] [6. Review] | |
| Assignments| +-----------------------------------+ |
|            |                                  |
| Validation | Step 3 of 6: Content Selection   |
|            |                                  |
| Admin      | Suggested Content                |
|            | +-------------------------------------------+ |
| Settings   | | Content Item         | Relevance | Add    | |
|            | |----------------------|-----------|--------| |
|            | | Cloud Migration Case | 95%       | [✓]    | |
|            | | Study - Retail       |           |        | |
|            | |----------------------|-----------|--------| |
|            | | AWS Security         | 87%       | [✓]    | |
|            | | Best Practices       |           |        | |
|            | |----------------------|-----------|--------| |
|            | | Technical Approach   | 82%       | [ ]    | |
|            | | Template             |           |        | |
|            | |----------------------|-----------|--------| |
|            | | Azure vs AWS         | 76%       | [ ]    | |
|            | | Comparison           |           |        | |
|            | +-------------------------------------------+ |
|            |                                  |
|            | [Search for more content...]     |
|            | [AI: Suggest Similar Content]    |
|            |                                  |
|            | Selected Content (2 items)       |
|            | +-------------------------------------------+ |
|            | | Content            | Section      | Remove| |
|            | |-------------------|--------------|-------| |
|            | | Cloud Migration   | Technical    | [✕]   | |
|            | | Case Study        | Approach     |       | |
|            | |-------------------|--------------|-------| |
|            | | AWS Security      | Security     | [✕]   | |
|            | | Best Practices    | Compliance   |       | |
|            | +-------------------------------------------+ |
|            |                                  |
|            | [< Previous] [Save Draft] [Next Step >] |
|            |                                  |
+------------+----------------------------------+
```

### Review Step

```
+-----------------------------------------------+
| POSALPRO                      [Search] [👤 MR] |
+------------+----------------------------------|
|            |                                  |
| Dashboard  | Proposals > Create New Proposal  |
|            |                                  |
| Proposals ◀| +-----------------------------------+ |
|            | | Step:                             | |
| Content    | | [1. Basic] [2. Team] [3. Content] | |
|            | | [4. Products] [5. Sections] [6. Review➡️]  | |
| Assignments| +-----------------------------------+ |
|            |                                  |
| Validation | Step 6 of 6: Review & Finalize   |
|            |                                  |
| Admin      | Proposal Summary                 |
|            | +----------------------------+   |
| Settings   | | Title: Cloud Migration Services|
|            | | Client: Acme Corporation    |   |
|            | | Due Date: June 15, 2025     |   |
|            | | Priority: High              |   |
|            | | Team Lead: Mohamed Rabah    |   |
|            | | Sales Rep: Sarah Johnson    |   |
|            | +----------------------------+   |
|            |                                  |
|            | Validation Results               |
|            | +----------------------------+   |
|            | | ✅ Basic information complete |   |
|            | | ✅ All required SMEs assigned |   |
|            | | ⚠️ Executive approval pending |   |
|            | | ✅ Content selected for all   |   |
|            | |   required sections         |   |
|            | | ✅ No compliance issues      |   |
|            | +----------------------------+   |
|            |                                  |
|            | AI-Generated Insights            |
|            | +----------------------------+   |
|            | | • Complexity: Medium       |   |
|            | | • Similar past proposals   |   |
|            | |   have 72% win rate        |   |
|            | | • Key differentiators      |   |
|            | |   identified in security   |   |
|            | |   section                  |   |
|            | | • Suggested focus areas:   |   |
|            | |   - Cost savings           |   |
|            | |   - Implementation timeline|   |
|            | +----------------------------+   |
|            |                                  |
|            | [< Previous] [Save Draft] [Create Proposal] |
|            |                                  |
+------------+----------------------------------+
```

### Specifications

#### Layout Structure

- **Wizard Navigation**:

  - Step indicators showing progress
  - Step titles with clear numbering
  - Current step highlighted
  - Linear progress path

- **Form Sections**:

  - Logically grouped fields
  - Clear section headings
  - Appropriate spacing between sections
  - Required fields marked

- **Navigation Controls**:
  - Previous/Next buttons consistently positioned
  - Save Draft option always available
  - Cancel option with confirmation dialog
  - Final step has Create Proposal button

#### Typography

- **Page title**: 24px, SemiBold
- **Step indicator**: 16px, Medium
- **Section headers**: 18px, Medium
- **Field labels**: 14px, Medium
- **Input text**: 16px, Regular
- **Help text**: 14px, Regular
- **Error messages**: 14px, Regular, Error Red

#### Input Fields

- **Text inputs**: 40px height, 6px border radius
- **Dropdowns**: 40px height with clear indicators
- **Date pickers**: Calendar popover with format validation
- **Radio buttons**: Clear visual distinction for selected state
- **Checkboxes**: Accessible hit areas with clear states

#### Colors

- **Primary action buttons**: Brand Blue (#2563EB)
- **Secondary actions**: Gray (#64748B)
- **Required field indicator**: Red (#EF4444)
- **Selected step**: Brand Blue background (#EFF6FF)
- **Validation success**: Green (#22C55E)
- **Validation warning**: Amber (#F59E0B)
- **Validation error**: Red (#EF4444)

#### Validation & Error States

- **Field validation**: Inline error messages
- **Required fields**: Visually marked with asterisk
- **Error summary**: Grouped at top of form when saving/submitting
- **Focused error field**: Highlighted with error border color

#### AI Integration Points

- **Content suggestions**: Based on proposal metadata
- **Team recommendations**: Based on expertise and availability
- **Validation analysis**: Ensures completeness and compliance
- **Success prediction**: Based on historical data
- **Competitive insights**: Generated from similar proposals

#### State Preservation

- **Auto-save**: Draft saved every 30 seconds
- **Session recovery**: Form state preserved on page refresh
- **Draft storage**: User can access saved drafts from dashboard
- **Version tracking**: Changes tracked between save points

#### Accessibility

- **Keyboard navigation**: Logical tab order through form
- **Screen reader support**: ARIA labels on all form elements
- **Error announcements**: Screen reader notifications for validation
- **Color independence**: All information conveyed by more than color
- **Focus management**: Clear indication of focused elements
