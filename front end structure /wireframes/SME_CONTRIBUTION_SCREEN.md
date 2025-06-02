# SME Contribution Screen - Refined Layout

## User Story Traceability

**Primary User Stories**: US-2.1 **Hypothesis Coverage**: H3 (SME Contribution
Efficiency - 50% time reduction) **Test Cases**: TC-H3-001

### User Story Details

- **US-2.1**: AI-assisted technical contributions (Technical SME)
  - _Acceptance Criteria_: AI-generated drafts, template guidance, ≥50% time
    reduction, clear context

### Acceptance Criteria Implementation Mapping

- **AC-2.1.1**: Context about proposal and client →
  `AssignmentHeader.contextDisplay()`
- **AC-2.1.2**: AI generates draft responses →
  `AIAssistedEditor.generateDraft()`
- **AC-2.1.3**: Template guidance → `TemplateSelector.guideInput()`
- **AC-2.1.4**: Time reduction ≥50% → Instrumentation in `useSMEContribution()`

### Component Traceability Matrix

```typescript
// SME Interface Components - User Story Mapping
interface ComponentMapping {
  AssignmentHeader: {
    userStories: ['US-2.1'];
    acceptanceCriteria: ['AC-2.1.1'];
    methods: ['contextDisplay()', 'showDeadline()', 'displayRequirements()'];
  };
  RequirementsPanel: {
    userStories: ['US-2.1'];
    acceptanceCriteria: ['AC-2.1.1'];
    methods: ['displayRequirements()', 'highlightKeyPoints()'];
  };
  AIAssistedEditor: {
    userStories: ['US-2.1'];
    acceptanceCriteria: ['AC-2.1.2', 'AC-2.1.4'];
    methods: ['generateDraft()', 'trackEditingTime()', 'autoSave()'];
  };
  TemplateSelector: {
    userStories: ['US-2.1'];
    acceptanceCriteria: ['AC-2.1.3'];
    methods: ['guideInput()', 'suggestTemplate()', 'populateStructure()'];
  };
  ResourcesPanel: {
    userStories: ['US-2.1'];
    acceptanceCriteria: ['AC-2.1.1'];
    methods: ['loadReferences()', 'searchKnowledgeBase()'];
  };
  VersionHistory: {
    userStories: ['US-2.1'];
    acceptanceCriteria: ['AC-2.1.4'];
    methods: ['trackProgress()', 'saveVersions()', 'compareChanges()'];
  };
}
```

### Measurement Instrumentation Requirements

```typescript
// Analytics for Hypothesis H3 Validation
interface SMEContributionMetrics {
  // US-2.1 Measurements (Contribution Time Reduction)
  assignmentId: string;
  timeToStart: number; // Time from notification to first action
  activeEditingTime: number; // Target: ≥50% reduction vs baseline
  aiDraftUsed: boolean;
  aiDraftUtilization: number; // Percentage of AI content retained
  templateUsed: boolean;
  templateType: string;
  contributionQuality: number; // Target: >7/10 scale
  submissionTime: number; // Total time from start to submission

  // Context and Support Metrics
  requirementsViewTime: number;
  resourcesAccessed: number;
  knowledgeBaseSearches: number;
  versionsCreated: number;
}

// Implementation Hook
const useSMEContributionAnalytics = () => {
  const trackContribution = (metrics: SMEContributionMetrics) => {
    analytics.track('sme_contribution_performance', {
      ...metrics,
      timestamp: Date.now(),
      userId: user.id,
      proposalId: assignment.proposalId,
    });
  };

  const startContributionTimer = () => {
    const startTime = Date.now();
    return {
      stop: () => Date.now() - startTime,
      getElapsed: () => Date.now() - startTime,
    };
  };

  return { trackContribution, startContributionTimer };
};
```

### Testing Scenario Integration

- **TC-H3-001**: SME contribution time reduction validation (US-2.1)

---

## Selected Design: Version C (Guided Contribution View)

```
+-----------------------------------------------+
| POSALPRO                      [Search] [👤 MR] |
+------------+----------------------------------|
|            |                                  |
| Dashboard  | Assignments > Technical Contribution |
|            |                                  |
| Proposals  | [◀ Back to Assignments] [Save Draft] [Submit] |
|            |                                  |
| Content    | +----------------------------+   |
|            | | Enterprise IT Solution - Network Security |
| Assignments◀| | Due: June 3, 2025 - 5:00 PM (48h remaining) |
|            | | Assigned by: Alex Kim      |   |
| Validation | +----------------------------+   |
|            |                                  |
| Admin      | [Dashboard] [Editor] [Resources] [History] |
|            |                                  |
| Settings   | Section Requirements:            |
|            | +----------------------------+   |
|            | | • Provide technical specifications for |
|            | |   network security solution       |
|            | | • Include compatibility requirements |
|            | | • Address compliance with ISO 27001 |
|            | | • Detail implementation timeline |
|            | +----------------------------+   |
|            |                                  |
|            | AI-Assisted Editor:              |
|            | +-------------------------------+ |
|            | | [Generate Draft] [Use Template] | |
|            | |                                 | |
|            | | The proposed network security   | |
|            | | solution includes:              | |
|            | |                                 | |
|            | | 1. Firewall Configuration       | |
|            | | - Next-Gen Firewall with IPS    | |
|            | | - Application-level filtering   | |
|            | | - Redundant deployment          | |
|            | |                                 | |
|            | | 2. Endpoint Protection          | |
|            | | - Client security software      | |
|            | | - Device management solution    | |
|            | | - Automated patch management    | |
|            | |                                 | |
|            | | [+ Add Section]                 | |
|            | +-------------------------------+ |
|            |                                  |
|            | Resources & References:           |
|            | +-------------------------------+ |
|            | | • Previous Network Solutions   | |
|            | | • Product Specifications       | |
|            | | • Company Security Standards   | |
|            | | • ISO 27001 Requirements       | |
|            | | • [Search Knowledge Base]      | |
|            | +-------------------------------+ |
|            |                                  |
|            | Version History:                 |
|            | +-------------------------------+ |
|            | | • Draft 1 - 15 mins ago       | |
|            | | • Initial template - 2h ago   | |
|            | +-------------------------------+ |
|            |                                  |
+------------+----------------------------------+
```

## Design Specifications

### Layout

- **Main Navigation**: Consistent left sidebar with Assignments section
  highlighted
- **Contribution View**: Multi-panel layout with requirements, editor, and
  resources
- **Assignment Context**: Header with proposal details, deadline, and assignee
  information
- **Editor View**: Rich text editor with AI assistance and template options

### Components

1. **Assignment Header**: Context about the proposal, deadline, and requirements
2. **Tabbed Navigation**: Dashboard, Editor, Resources, and History views
3. **Requirements Panel**: Clear listing of contribution requirements
4. **AI-Assisted Editor**: Rich text editor with AI draft generation
5. **Resources Panel**: Quick access to relevant reference materials
6. **Version History**: Tracking of contribution drafts and changes

### Interaction States

- **Normal**: Viewing and editing contribution content
- **Draft Generation**: AI creating initial content based on requirements
- **Template Selection**: Choosing from pre-defined templates
- **Submission**: Validation and submission workflow
- **Feedback**: Viewing and addressing reviewer comments

### Data Requirements

- **Assignment Details**: Proposal context, deadlines, requirements
- **Templates**: Pre-defined contribution templates by type
- **Reference Materials**: Related content and specifications
- **Version History**: Complete history of contribution drafts
- **User Preferences**: Preferred templates and editor settings

### AI Integration Points

- **Draft Generation**: AI-created initial content based on requirements
- **Content Suggestions**: Real-time suggestions during writing
- **Reference Recommendations**: Intelligent surfacing of relevant materials
- **Quality Analysis**: Automated review for completeness and clarity
- **Timeline Estimation**: Smart calculation of time needed to complete

### Status Indicators

- **Standard Placement**: Status indicators consistently positioned in dedicated
  Status column
- **Consistent Symbols**:
  - Success/Approved: ✅ Green (#22C55E)
  - Warning/At Risk: ⚠️ Amber (#F59E0B)
  - Error/Failed: ❌ Red (#EF4444)
  - In Progress: ⏳ Blue (#3B82F6)
  - Pending: ⬜ Gray (#9CA3AF)
- **Accessibility**: All status indicators include both color and symbol to
  ensure accessibility
- **Prominence**: Status indicators given visual priority with adequate spacing

### Accessibility

- Keyboard navigation for all editor functions
- Screen reader support for editor content
- Color contrast compliance for all text elements
- Alternative text for all interface elements
- Notification preferences for deadline alerts

## Mobile View

```
+----------------------------------+
| POSALPRO             [👤] [Menu] |
+----------------------------------+
| Assignments > Technical Contrib. |
+----------------------------------+
| [◀ Back] [Save Draft] [Submit]   |
+----------------------------------+
| Enterprise IT Solution           |
| Due: June 3 (48h remaining)      |
+----------------------------------+
| [Dashboard][Editor][Resources]   |
+----------------------------------+
| Requirements:                    |
| • Network security specs         |
| • Compatibility requirements     |
| • ISO 27001 compliance           |
| • Implementation timeline        |
+----------------------------------+
| [Generate Draft] [Use Template]  |
+----------------------------------+
| The proposed network security    |
| solution includes:               |
|                                  |
| 1. Firewall Configuration        |
| - Next-Gen Firewall with IPS     |
| - Application-level filtering    |
| - Redundant deployment           |
|                                  |
| 2. Endpoint Protection           |
| - Client security software       |
| [+ Add Section]                  |
+----------------------------------+
| Resources:                       |
| • Previous Network Solutions     |
| • Product Specifications         |
| • [More Resources...]            |
+----------------------------------+
```

### Mobile Considerations

- **Collapsible Sections**: Requirements, resources, and version history panels
  collapse to save space
- **Simplified Editor**: Optimized toolbar with essential formatting options
- **Touch-Friendly Interface**: Larger tap targets and intuitive gestures
- **Offline Support**: Draft saving when connectivity is limited
- **Progressive Loading**: Resources load on-demand to conserve bandwidth

## AI-Assisted Features

### Draft Generation

The system analyzes the requirements and generates a structured draft with:

- Appropriate section headers based on requirement type
- Placeholder content for technical specifications
- Standard compliance statements for mentioned standards
- Implementation timeline structure

### Content Suggestions

As the SME types, the system provides:

- Technical term completion and definition
- Product specification accuracy checks
- Compliance statement suggestions
- Reference linking to knowledge base articles

### Quality Analysis

Before submission, the system performs:

- Completeness check against requirements
- Technical accuracy verification
- Compliance statement validation
- Readability and clarity assessment

## Workflow Integration

### Assignment Creation

1. Proposal Manager creates section assignment
2. System notifies SME of new assignment
3. SME receives contextual information and requirements

### Contribution Process

1. SME reviews requirements and resources
2. SME uses AI assistance or templates to create draft
3. SME refines content with real-time suggestions
4. System validates content against requirements
5. SME submits completed contribution

### Review Workflow

1. Proposal Manager receives notification of submission
2. Reviewer provides feedback on contribution
3. SME receives notification of feedback
4. SME addresses feedback and resubmits if needed

## Technical Specifications

### Typography

- **Headings**: 16-18px, Semi-bold
- **Body text**: 14px, Regular
- **Requirements**: 14px, Regular
- **Editor content**: 14px, Regular with appropriate markup
- **Status text**: 14px, Regular

### Colors

- **Status indicators**:

  - Success: Green (#22C55E)
  - Warning: Amber (#F59E0B)
  - Error: Red (#EF4444)
  - Info: Blue (#3B82F6)
  - Pending: Gray (#9CA3AF)

- **Editor interface**: Light Gray background (#F8FAFC)
- **Requirements panel**: Light Blue background (#EFF6FF)
- **Resource links**: Blue (#3B82F6)

### Behavior Notes

- Auto-save every 30 seconds while editing
- Draft versions created at logical break points
- AI suggestions appear non-intrusively as the user types
- Resource panel can be collapsed to provide more editor space
- Requirements are always visible for reference
