# Dashboard Screen - Refined Layout

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
