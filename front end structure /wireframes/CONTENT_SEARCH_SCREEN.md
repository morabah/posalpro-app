# Content Search Screen - Refined Layout

## Selected Design: Version C (Split View Layout)

```
+-----------------------------------------------+
| POSALPRO                      [Search] [👤 MR] |
+------------+----------------------------------|
|            |                                  |
| Dashboard  | Content > Semantic Search        |
|            |                                  |
| Proposals  | +-------------------+ +--------+ |
|            | | Search & Filters  | | Preview | |
| Content  ◀ | |                   | |        | |
|            | | [Search for technical content..] | |        | |
| Assignments| | [🔍]              | |        | |
|            | |                   | |        | |
| Validation | | Content Type:     | | No     | |
|            | | ☑ Case Study     | | content | |
| Admin      | | ☑ Technical Doc  | | selected| |
|            | | ☑ Solution       | |        | |
| Settings   | | ☑ Template       | | Select  | |
|            | | ☑ References     | | an item | |
|            | |                   | | from the| |
|            | | Tags:             | | results | |
|            | | [Add tag...] [+]  | | list to | |
|            | | [Technical] [✕]   | | preview | |
|            | | [Security]  [✕]   | | it here.| |
|            | |                   | |        | |
|            | | Date Range:       | |        | |
|            | | From: [05/01/25]  | |        | |
|            | | To:   [05/31/25]  | |        | |
|            | |                   | |        | |
|            | | [Apply Filters]   | |        | |
|            | +-------------------+ +--------+ |
|            |                                  |
|            | Results (15)                     |
|            | +----------------------------+   |
|            | | Cloud Migration Case Study |   |
|            | | Type: Case Study           |   |
|            | | Tags: Cloud, Migration     |   |
|            | | Created: May 10, 2025      |   |
|            | | Used: 7 times              |   |
|            | +----------------------------+   |
|            | | Security Compliance Docs   |   |
|            | | Type: Technical            |   |
|            | | Tags: Security, Compliance |   |
|            | | Created: Apr 22, 2025      |   |
|            | | Used: 12 times             |   |
|            | +----------------------------+   |
|            |                                  |
+------------+----------------------------------+
```

### With Preview Content

```
+-----------------------------------------------+
| POSALPRO                      [Search] [👤 MR] |
+------------+----------------------------------|
|            |                                  |
| Dashboard  | Content > Semantic Search        |
|            |                                  |
| Proposals  | +-------------------+ +--------+ |
|            | | Search & Filters  | | Preview| |
| Content  ◀ | |                   | |        | |
|            | | [technical security standards] | | Cloud   | |
| Assignments| | [🔍]              | |Migration| |
|            | |                   | |Case    | |
| Validation | | Content Type:     | |Study   | |
|            | | ☑ Case Study     | |        | |
| Admin      | | ☑ Technical Doc  | | Type:  | |
|            | | ☑ Solution       | | Case   | |
| Settings   | | ☑ Template       | | Study  | |
|            | | ☑ References     | |        | |
|            | |                   | | Created:| |
|            | | Tags:             | | May 10, | |
|            | | [Add tag...] [+]  | | 2025   | |
|            | | [Technical] [✕]   | |        | |
|            | | [Security]  [✕]   | | Tags:  | |
|            | |                   | | Cloud, | |
|            | | Date Range:       | | Migra- | |
|            | | From: [05/01/25]  | | tion   | |
|            | | To:   [05/31/25]  | |        | |
|            | |                   | | [View] | |
|            | | [Apply Filters]   | | [Use]  | |
|            | +-------------------+ +--------+ |
|            |                                  |
|            | Results (3)                      |
|            | +----------------------------+ ◀ |
|            | | Cloud Migration Case Study |   |
|            | | Type: Case Study           |   |
|            | | Tags: Cloud, Migration     |   |
|            | | Relevance: 92% match       |   |
|            | +----------------------------+   |
|            | | Security Standards Doc     |   |
|            | | Type: Technical            |   |
|            | | Tags: Security, Compliance |   |
|            | | Relevance: 78% match       |   |
|            | +----------------------------+   |
|            | | AWS Security Best Practices|   |
|            | | Type: Technical            |   |
|            | | Tags: Cloud, Security      |   |
|            | | Relevance: 65% match       |   |
|            | +----------------------------+   |
|            |                                  |
+------------+----------------------------------+
```

### No Results State

```
+-----------------------------------------------+
| POSALPRO                      [Search] [👤 MR] |
+------------+----------------------------------|
|            |                                  |
| Dashboard  | Content > Semantic Search        |
|            |                                  |
| Proposals  | +-------------------+ +--------+ |
|            | | Search & Filters  | | Preview| |
| Content  ◀ | |                   | |        | |
|            | | [quantum blockchain defense]   | |        | |
| Assignments| | [🔍]              | | No     | |
|            | |                   | | content| |
| Validation | | Content Type:     | | to     | |
|            | | ☑ Case Study     | | preview| |
| Admin      | | ☑ Technical Doc  | |        | |
|            | | ☑ Solution       | |        | |
| Settings   | | ☑ Template       | |        | |
|            | | ☑ References     | |        | |
|            | |                   | |        | |
|            | | Tags:             | |        | |
|            | | [Add tag...] [+]  | |        | |
|            | | [Quantum]   [✕]   | |        | |
|            | |                   | |        | |
|            | | Date Range:       | |        | |
|            | | From: [05/01/25]  | |        | |
|            | | To:   [05/31/25]  | |        | |
|            | |                   | |        | |
|            | | [Apply Filters]   | |        | |
|            | +-------------------+ +--------+ |
|            |                                  |
|            | No results found                 |
|            | +----------------------------+   |
|            | |                            |   |
|            | | No content matches your    |   |
|            | | search criteria.           |   |
|            | |                            |   |
|            | | Suggestions:               |   |
|            | | • Try different keywords   |   |
|            | | • Remove some filters      |   |
|            | | • Check your spelling      |   |
|            | |                            |   |
|            | | [AI Content Suggestion]    |   |
|            | |                            |   |
|            | +----------------------------+   |
|            |                                  |
+------------+----------------------------------+
```

## AI Integration Point

```
+-----------------------------------------------+
| POSALPRO                      [Search] [👤 MR] |
+------------+----------------------------------|
|            |                                  |
| Dashboard  | Content > Semantic Search        |
|            |                                  |
| Proposals  | +-------------------+ +--------+ |
|            | | Search & Filters  | | Preview| |
| Content  ◀ | |                   | |        | |
|            | | [technical security standards] | |Security | |
| Assignments| | [🔍]              | |Compli- | |
|            | |                   | |ance Doc| |
| Validation | | Content Type:     | |        | |
|            | | ☑ Case Study     | |Type:   | |
| Admin      | | ☑ Technical Doc  | |Tech Doc| |
|            | | ☑ Solution       | |        | |
| Settings   | | ☑ Template       | |Created:| |
|            | | ☑ References     | |Apr 22, | |
|            | |                   | |2025    | |
|            | | AI Assistance:    | |        | |
|            | | [Similar Content] | |Tags:   | |
|            | | [Refine Search]   | |Security| |
|            | | [Suggest Tags]    | |Compli- | |
|            | |                   | |ance    | |
|            | | Tags:             | |        | |
|            | | [Add tag...] [+]  | |[View]  | |
|            | | [Technical] [✕]   | |[Use]   | |
|            | | [Security]  [✕]   | |        | |
|            | |                   | |        | |
|            | | [Apply Filters]   | |        | |
|            | +-------------------+ +--------+ |
|            |                                  |
|            | AI Suggestions                   |
|            | +----------------------------+   |
|            | | Based on your search:      |   |
|            | |                            |   |
|            | | Related Tags:              |   |
|            | | [Compliance] [Standards]   |   |
|            | | [Regulations] [GDPR]       |   |
|            | |                            |   |
|            | | You might also try:        |   |
|            | | "compliance requirements"  |   |
|            | | "security certifications"  |   |
|            | |                            |   |
|            | +----------------------------+   |
|            |                                  |
+------------+----------------------------------+
```

### Specifications

#### Layout Structure

- **Split Panel Layout**:

  - Left panel: Search and filters (35% width)
  - Right panel: Content preview (65% width)
  - Results list: Full width below panels

- **Search Area**:

  - Prominent search bar with icon
  - Type filters as checkboxes
  - Tag system with add/remove functionality
  - Date range selector
  - AI assistance buttons

- **Results Area**:

  - Card-based results with clear hierarchy
  - Relevance indicators for semantic search
  - Scrollable list with pagination or infinite scroll
  - Selected item highlighted
  - Empty state with helpful suggestions

- **Preview Panel**:
  - Document title and metadata
  - Content preview with formatting preserved
  - Action buttons (View, Use in Proposal, Edit)
  - Empty state when no content selected

#### Typography

- **Section headers**: 18px, SemiBold
- **Search input**: 16px, Regular
- **Filter labels**: 14px, Medium
- **Result titles**: 16px, Medium
- **Result metadata**: 14px, Regular
- **Preview title**: 18px, SemiBold
- **Preview content**: 14px, Regular

#### Colors

- **Search highlight**: Brand Blue (#2563EB)
- **Tag backgrounds**: Light Gray (#F1F5F9)
- **Selected item**: Light Blue background (#EFF6FF)
- **Relevance indicators**:
  - High: Green (#4ADE80)
  - Medium: Amber (#FCD34D)
  - Low: Gray (#94A3B8)

#### AI Integration Points

- **Tag suggestions** based on search content and context
- **Search refinement** suggestions for better results
- **Similar content** recommendations
- **Content generation** option when no results found
- **Usage patterns** shown based on collaborative filtering

#### Interactions

- Real-time search results as user types
- Preview panel updates on result selection
- Tag suggestions appear as user types in tag field
- Filter changes immediately update results
- "Use in Proposal" triggers proposal selection modal

#### Accessibility

- High contrast between text and backgrounds
- Clear focus states for all interactive elements
- Screen reader support for search results
- Keyboard navigation for all functions
- Error states clearly communicated

#### Responsive Behavior

- Panels stack vertically on smaller screens
- Filters collapse into expandable sections on mobile
- Preview becomes optional bottom sheet on small screens
- Search bar remains prominent at all sizes

## Mobile View

```
+-------------------------------+
| POSALPRO               [🔍]  |
|-------------------------------|
| Content > Search              |
|                               |
| [🔍 Search content...]       |
|                               |
| Content Type:                 |
| ☑ Case Study ☑ Technical Doc |
| ☑ Solution  ☑ Template       |
| ☑ References                  |
|                               |
| Tags: [Technical] [Security]  |
|                               |
| Results (24):                 |
| +---------------------------+ |
| | Enterprise Security Guide | |
| | Technical Document • 95%  | |
| +---------------------------+ |
| | Cloud Migration Playbook  | |
| | Solution Brief • 82%      | |
| +---------------------------+ |
| | Security Implementation   | |
| | Case Study • 78%          | |
| +---------------------------+ |
|                               |
| [Load More Results]           |
+-------------------------------+
```

### Mobile Search Implementation

- Search icon [🔍] in header expands to full-width search bar when tapped
- Search field collapses back to icon when not in use
- Recent searches appear below search field when expanded
- Voice search option available
- Search suggestions appear as user types
