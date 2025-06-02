# Dashboard Screen - Refined Layout

## User Story Traceability

**Primary User Stories**: US-4.1, US-4.3, Supporting Overview for US-1.1,
US-2.1, US-3.1 **Hypothesis Coverage**: H7 (Deadline Management), Supporting H1,
H3, H4, H8 **Test Cases**: TC-H7-001, TC-H7-002, Supporting all test cases

### User Story Details

- **US-4.1**: Intelligent timeline creation (Proposal Manager)
  - _Acceptance Criteria_: Complexity-based estimates, critical path, ≥40%
    on-time improvement
- **US-4.3**: Intelligent task prioritization (Proposal Specialist)
  - _Acceptance Criteria_: Priority algorithms, dependency mapping, progress
    tracking
- **Supporting Functions**: Overview dashboard for all user activities and
  performance metrics

### Acceptance Criteria Implementation Mapping

- **AC-4.1.1**: Timeline overview visualization →
  `ProposalStatusChart.timelineVisualization()`
- **AC-4.1.3**: On-time completion tracking →
  `PerformanceMetrics.trackOnTimeCompletion()`
- **AC-4.3.1**: Priority visualization → `TaskPriorityPanel.displayPriorities()`
- **AC-4.3.3**: Progress tracking overview → `ActivityFeed.trackProgress()`

### Component Traceability Matrix

```typescript
// Dashboard Interface Components - User Story Mapping
interface ComponentMapping {
  ProposalStatusChart: {
    userStories: ['US-4.1'];
    acceptanceCriteria: ['AC-4.1.1', 'AC-4.1.3'];
    methods: [
      'timelineVisualization()',
      'trackOnTimeCompletion()',
      'displayStatus()',
    ];
  };
  TaskPriorityPanel: {
    userStories: ['US-4.3'];
    acceptanceCriteria: ['AC-4.3.1', 'AC-4.3.3'];
    methods: ['displayPriorities()', 'trackProgress()', 'highlightUrgent()'];
  };
  QuickActions: {
    userStories: ['US-1.1', 'US-2.1', 'US-3.1', 'US-4.1'];
    acceptanceCriteria: ['AC-1.1.1', 'AC-2.1.1', 'AC-3.1.1', 'AC-4.1.1'];
    methods: [
      'launchSearch()',
      'startAssignment()',
      'runValidation()',
      'createProposal()',
    ];
  };
  PerformanceMetrics: {
    userStories: ['US-4.1', 'US-4.3'];
    acceptanceCriteria: ['AC-4.1.3', 'AC-4.3.3'];
    methods: [
      'trackOnTimeCompletion()',
      'measureProductivity()',
      'calculateEfficiency()',
    ];
  };
  ActivityFeed: {
    userStories: ['US-4.3'];
    acceptanceCriteria: ['AC-4.3.3'];
    methods: ['trackProgress()', 'updateStatus()', 'notifyChanges()'];
  };
  RoleBasedContent: {
    userStories: ['US-2.3'];
    acceptanceCriteria: ['AC-2.3.1'];
    methods: ['displayRoleContent()', 'filterByRole()', 'customizeView()'];
  };
}
```

### Measurement Instrumentation Requirements

```typescript
// Analytics for Multi-Hypothesis Overview
interface DashboardMetrics {
  // US-4.1 Overview Measurements (Timeline Management)
  proposalsInProgress: number;
  avgCompletionTime: number; // Target: ≥40% improvement
  onTimeCompletionRate: number;
  criticalPathProposals: number;

  // US-4.3 Overview Measurements (Task Prioritization)
  highPriorityTasks: number;
  taskCompletionRate: number;
  priorityAccuracy: number;
  overdueTasks: number;

  // User Activity Metrics
  dailyActiveTime: number;
  featureUsageDistribution: Record<string, number>;
  quickActionUsage: Record<string, number>;
  navigationPatterns: string[];

  // Cross-Hypothesis Support Metrics
  searchQueries: number; // H1 support
  smeAssignments: number; // H3 support
  validationRuns: number; // H8 support
  coordinationActions: number; // H4 support
}

// Implementation Hooks
const useDashboardAnalytics = () => {
  const trackDashboardView = (metrics: DashboardMetrics) => {
    analytics.track('dashboard_overview_performance', {
      ...metrics,
      timestamp: Date.now(),
      userId: user.id,
      userRole: user.role,
    });
  };

  const trackQuickAction = (action: string, context: string) => {
    analytics.track('quick_action_usage', {
      action,
      context,
      timestamp: Date.now(),
    });
  };

  const trackNavigation = (from: string, to: string, method: string) => {
    analytics.track('navigation_pattern', {
      from,
      to,
      method,
      timestamp: Date.now(),
    });
  };

  return { trackDashboardView, trackQuickAction, trackNavigation };
};

const useRoleBasedMetrics = () => {
  const trackRoleSpecificUsage = (feature: string, timeSpent: number) => {
    analytics.track('role_specific_usage', {
      feature,
      timeSpent,
      userRole: user.role,
      timestamp: Date.now(),
    });
  };

  const trackProductivityMetrics = (
    tasksCompleted: number,
    timeActive: number
  ) => {
    const productivity = tasksCompleted / timeActive;
    analytics.track('user_productivity', {
      tasksCompleted,
      timeActive,
      productivity,
      timestamp: Date.now(),
    });
  };

  return { trackRoleSpecificUsage, trackProductivityMetrics };
};
```

### Testing Scenario Integration

- **TC-H7-001**: Timeline management validation (US-4.1)
- **TC-H7-002**: Task prioritization validation (US-4.3)
- **Supporting all test cases**: Dashboard provides overview metrics for all
  hypothesis validation

---

## Selected Design: Version B (Sidebar Navigation)

```
+-----------------------------------------------+
| POSALPRO                      [Search] [👤 MR] |
+------------+----------------------------------|
|            |                                  |
| Dashboard ◀| Welcome back, Mohamed            |
|            |                                  |
| Proposals  | Quick Actions                    |
|            | [+ New Proposal] [🔍 Search]     |
| Content    | [👥 Assign SMEs]  [✓ Validate]   |
|            |                                  |
| Assignments| Status Overview                  |
|            | +----------------+  +----------+ |
| Validation | | Proposals      |  | SMEs     | |
|            | | [CHART: 75%]   |  | [CHART]  | |
| Admin      | +----------------+  +----------+ |
|            |                                  |
| Settings   | Active Proposals          Due    |
|            | +----------------------------+   |
|            | | Tech Services RFP       | ▶ | |
|            | | May 15, 2025            |   | |
|            | | Status: DRAFT           |   | |
|            | +----------------------------+   |
|            | | North Region Bid         | ▶ | |
|            | | May 28, 2025            |   | |
|            | | Status: REVIEW          |   | |
|            | +----------------------------+   |
|            | | Government Tender 27B    | ▶ | |
|            | | June 10, 2025           |   | |
|            | | Status: ACTIVE          |   | |
|            | +----------------------------+   |
|            |                                  |
|            | Priority Items                   |
|            | +----------------------------+   |
|            | | ⚠️ Security config needs   |   |
|            | | immediate attention [Fix]  |   |
|            | +----------------------------+   |
|            | | 📌 5 assignments awaiting  |   |
|            | | your review [View]        |   |
|            | +----------------------------+   |
|            |                                  |
+------------+----------------------------------+
```

### Different Role View (SME)

```
+-----------------------------------------------+
| POSALPRO                      [Search] [👤 JS] |
+------------+----------------------------------|
|            |                                  |
| Dashboard ◀| Welcome back, John               |
|            |                                  |
| Assignments| Quick Actions                    |
|            | [✏️ Start Assignment] [🔍 Search] |
| Content    |                                  |
|            | Your Assignments                 |
|            | +----------------+  +----------+ |
|            | | Due This Week  |  | Status   | |
|            | | [CHART: 2]     |  | [CHART]  | |
|            | +----------------+  +----------+ |
| Settings   |                                  |
|            | Current Assignments       Status |
|            | +----------------------------+   |
|            | | Technical Section: RFP   | ▶ | |
|            | | Due: May 15, 2025        |   | |
|            | | Priority: HIGH           |   | |
|            | +----------------------------+   |
|            | | Security Analysis: Bid   | ▶ | |
|            | | Due: May 28, 2025        |   | |
|            | | Priority: MEDIUM         |   | |
|            | +----------------------------+   |
|            |                                  |
|            | Recent Content                   |
|            | +----------------------------+   |
|            | | Security Documentation     |   |
|            | | Added: May 10, 2025 [View] |   |
|            | +----------------------------+   |
|            | | Technical Specs Template   |   |
|            | | Updated: May 8, 2025 [View]|   |
|            | +----------------------------+   |
|            |                                  |
+------------+----------------------------------+
```

### Loading State

```
+-----------------------------------------------+
| POSALPRO                      [Search] [👤 MR] |
+------------+----------------------------------|
|            |                                  |
| Dashboard ◀| Welcome back, Mohamed            |
|            |                                  |
| Proposals  | Quick Actions                    |
|            | [+ New Proposal] [🔍 Search]     |
| Content    | [👥 Assign SMEs]  [✓ Validate]   |
|            |                                  |
| Assignments| Status Overview                  |
|            | +----------------+  +----------+ |
| Validation | |    Loading...  |  | Loading. | |
|            | |    ⟳          |  |    ⟳    | |
| Admin      | +----------------+  +----------+ |
|            |                                  |
| Settings   | Active Proposals                 |
|            | +----------------------------+   |
|            | |       Loading...          |   |
|            | |         ⟳                |   |
|            | +----------------------------+   |
|            |                                  |
+------------+----------------------------------+
```

### Specifications

#### Layout Structure

- **Sidebar**:

  - Width: 200px
  - Fixed position
  - Active item highlighted
  - Icons and labels for each navigation item
  - Role-based visibility of menu items

- **Header**:

  - Height: 64px
  - Search bar: 240px width
  - User profile: Avatar + dropdown menu
  - Sticky position

- **Content Area**:
  - Welcome message with user name
  - Quick actions: 4 primary buttons
  - Status overview: 2 chart cards (responsive width)
  - Lists: Card-based with hover states

#### Typography

- **Welcome message**: 24px, SemiBold
- **Section headers**: 18px, SemiBold
- **Card titles**: 16px, Medium
- **Card content**: 14px, Regular
- **Status indicators**: 14px, Medium

#### Colors

- **Navigation Active**: Brand Blue (#2563EB)
- **Status indicators**:
  - DRAFT: Light Blue (#93C5FD)
  - REVIEW: Amber (#FCD34D)
  - ACTIVE: Green (#4ADE80)
  - HIGH priority: Red (#EF4444)
  - MEDIUM priority: Amber (#F59E0B)

#### Charts and Data Visualization

- **Proposal Status Chart**: Donut chart showing distribution of proposals by
  status
- **SME Assignments Chart**: Bar chart showing assignments by completion status
- **Due Date Indicators**: Color-coded based on proximity to deadline

#### Interactions

- Card expansion on click
- Hover states for all interactive elements
- Quick action buttons trigger appropriate workflows
- Status charts are interactive with tooltips on hover

#### Accessibility

- High contrast between text and background
- Interactive elements have clear focus states
- Charts include screen reader text alternatives
- Keyboard navigation fully supported

#### Responsive Behavior

- Sidebar collapses to icon-only on smaller screens
- Cards stack vertically on mobile
- Charts resize proportionally
- Quick actions collapse into menu on smallest screens
