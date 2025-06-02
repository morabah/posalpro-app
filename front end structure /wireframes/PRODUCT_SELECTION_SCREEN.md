# Product Selection Screen - Refined Layout

## User Story Traceability

**Primary User Stories**: US-1.2, US-3.1, Supporting US-4.1 **Hypothesis
Coverage**: H1 (Content Discovery - 45% search time reduction), H8 (Technical
Configuration Validation), Supporting H7 (Deadline Management) **Test Cases**:
TC-H1-002, TC-H8-001, Supporting TC-H7-001

### User Story Details

- **US-1.2**: AI-suggested content browsing (Proposal Manager)
  - _Acceptance Criteria_: Auto-categorization, related content suggestions,
    filtering options
- **US-3.1**: Configuration validation (Presales Engineer)
  - _Acceptance Criteria_: Compatibility checking, fix suggestions, ≥50% error
    reduction
- **Supporting Functions**: Product catalog browsing, AI recommendations,
  selection validation

### Acceptance Criteria Implementation Mapping

- **AC-1.2.1**: Auto-categorization by topic and type →
  `ProductCatalog.aiCategories()`
- **AC-1.2.2**: Related content suggestions →
  `AIRecommendations.suggestProducts()`
- **AC-1.2.3**: Multi-dimensional filtering →
  `ProductFilter.multiDimensionalFilters()`
- **AC-3.1.1**: Flags incompatible combinations →
  `ProductValidator.compatibilityCheck()`
- **AC-3.1.2**: Suggestions for resolving issues →
  `ProductValidator.fixSuggestions()`

### Component Traceability Matrix

```typescript
// Product Selection Interface Components - User Story Mapping
interface ComponentMapping {
  ProductCatalog: {
    userStories: ['US-1.2'];
    acceptanceCriteria: ['AC-1.2.1', 'AC-1.2.3'];
    methods: [
      'aiCategories()',
      'searchProducts()',
      'multiDimensionalFilters()',
    ];
  };
  AIRecommendations: {
    userStories: ['US-1.2', 'US-4.1'];
    acceptanceCriteria: ['AC-1.2.2', 'AC-4.1.1'];
    methods: [
      'suggestProducts()',
      'generateBundles()',
      'contextualRecommendations()',
    ];
  };
  ProductValidator: {
    userStories: ['US-3.1'];
    acceptanceCriteria: ['AC-3.1.1', 'AC-3.1.2'];
    methods: [
      'compatibilityCheck()',
      'fixSuggestions()',
      'validateSelection()',
    ];
  };
  ProductDetailModal: {
    userStories: ['US-1.2', 'US-3.1'];
    acceptanceCriteria: ['AC-1.2.4', 'AC-3.1.3'];
    methods: ['displayDetails()', 'configureOptions()', 'calculateSubtotal()'];
  };
  SelectedProductsPanel: {
    userStories: ['US-3.1', 'US-4.1'];
    acceptanceCriteria: ['AC-3.1.1', 'AC-4.1.2'];
    methods: ['trackSelection()', 'validateCombination()', 'calculateTotal()'];
  };
  ProductSearch: {
    userStories: ['US-1.2'];
    acceptanceCriteria: ['AC-1.2.1', 'AC-1.2.3'];
    methods: ['semanticSearch()', 'filterResults()', 'rankByRelevance()'];
  };
}
```

### Measurement Instrumentation Requirements

```typescript
// Analytics for Product Selection Supporting Discovery & Validation
interface ProductSelectionMetrics {
  // US-1.2 Measurements (Content Discovery)
  productSearchTime: number; // Target: ≥45% reduction
  filterUsageRate: number;
  recommendationAcceptanceRate: number;
  categoryBrowsingEfficiency: number;

  // US-3.1 Measurements (Configuration Validation)
  compatibilityCheckTime: number;
  validationErrorsDetected: number;
  fixSuggestionUtilization: number;
  configurationAccuracy: number;

  // Product Selection Performance
  selectionCompletionTime: number;
  productComparisonCount: number;
  customizationOptionsUsed: number;
  averageProductsPerProposal: number;

  // AI Assistance Metrics
  aiRecommendationClicks: number;
  bundleSuggestionAcceptance: number;
  contextualRelevanceScore: number;
  searchToSelectionRatio: number;
}

// Implementation Hooks
const useProductSelectionAnalytics = () => {
  const trackProductSelection = (metrics: ProductSelectionMetrics) => {
    analytics.track('product_selection_performance', {
      ...metrics,
      timestamp: Date.now(),
      userId: user.id,
      userRole: user.role,
    });
  };

  const trackProductSearch = (
    searchQuery: string,
    resultsCount: number,
    selectionTime: number
  ) => {
    analytics.track('product_search_performance', {
      searchQuery,
      resultsCount,
      selectionTime,
      timestamp: Date.now(),
    });
  };

  const trackValidationUsage = (
    productId: string,
    errorsDetected: number,
    fixesApplied: number
  ) => {
    analytics.track('product_validation', {
      productId,
      errorsDetected,
      fixesApplied,
      timestamp: Date.now(),
    });
  };

  return { trackProductSelection, trackProductSearch, trackValidationUsage };
};

const useAIRecommendations = () => {
  const trackRecommendationInteraction = (
    recommendationType: string,
    accepted: boolean,
    relevanceScore: number
  ) => {
    analytics.track('ai_recommendation_interaction', {
      recommendationType,
      accepted,
      relevanceScore,
      timestamp: Date.now(),
    });
  };

  const trackBundleSuggestion = (
    bundleId: string,
    productsCount: number,
    accepted: boolean
  ) => {
    analytics.track('bundle_suggestion', {
      bundleId,
      productsCount,
      accepted,
      timestamp: Date.now(),
    });
  };

  return { trackRecommendationInteraction, trackBundleSuggestion };
};
```

### Testing Scenario Integration

- **TC-H1-002**: Product catalog content discovery optimization (US-1.2)
- **TC-H8-001**: Product configuration compatibility validation (US-3.1)
- **Supporting TC-H7-001**: Product selection impact on timeline estimation
  (US-4.1)

---

## Design: Integrated Catalog Browser with Selection

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
|            | | [4. Products➡️] [5. Review]        | |
| Assignments| +-----------------------------------+ |
|            |                                  |
| Validation | Step 4 of 5: Product Selection   |
|            |                                  |
| Admin      | Product Catalog                  |
|            | +----------------------------+   |
| Settings   | | [🔍 Search products...]    |   |
|            | |                            |   |
|            | | Categories:                |   |
|            | | [All] [Hardware] [Software]|   |
|            | | [Services] [Support] [Training]|
|            | +----------------------------+   |
|            |                                  |
|            | Available Products              |
|            | +-------------------------------------------+ |
|            | | Product           | Price      | Actions | |
|            | |-------------------|------------|--------| |
|            | | Cloud Migration   | $25,000    | [Add+] | |
|            | | Service - Basic   | per server |        | |
|            | |-------------------|------------|--------| |
|            | | Cloud Migration   | $40,000    | [Add+] | |
|            | | Service - Advanced| per server |        | |
|            | |-------------------|------------|--------| |
|            | | Security Audit    | $15,000    | [Add+] | |
|            | | Service - Standard| flat fee   |        | |
|            | |-------------------|------------|--------| |
|            | | Managed Service   | $3,500     | [Add+] | |
|            | | Support - Monthly | per month  |        | |
|            | +-------------------------------------------+ |
|            |                                  |
|            | Selected Products (2)            |
|            | +-------------------------------------------+ |
|            | | Product        | Qty | Price    | Actions | |
|            | |----------------|-----|----------|--------| |
|            | | Cloud Migration| 5   | $125,000 | [✕][✎] | |
|            | | Service - Basic|     |          |        | |
|            | |----------------|-----|----------|--------| |
|            | | Managed Service| 12  | $42,000  | [✕][✎] | |
|            | | Support        |     |          |        | |
|            | +-------------------------------------------+ |
|            |                                  |
|            | Total: $167,000                  |
|            |                                  |
|            | [< Previous] [Save Draft] [Next Step >] |
|            |                                  |
+------------+----------------------------------+
```

### Product Detail View (Modal)

```
+-------------------------------------------+
|  Product Details             [Close ✕]    |
+-------------------------------------------+
| Cloud Migration Service - Basic           |
|                                           |
| Description:                              |
| Our standard cloud migration service      |
| includes assessment, planning, and        |
| execution of server migration to AWS,     |
| Azure, or GCP.                            |
|                                           |
| Features:                                 |
| • Workload assessment                     |
| • Migration strategy document             |
| • Lift-and-shift execution                |
| • Basic testing and validation            |
| • 2 weeks post-migration support          |
|                                           |
| Unit Price: $25,000 per server            |
|                                           |
| Quantity: [   5   ] [−] [+]               |
|                                           |
| Customization:                            |
| [ ] Add extended support (+$5,000)        |
| [ ] Include application optimization      |
| [✓] Include knowledge transfer sessions   |
|                                           |
| Notes:                                    |
| [                                   ]     |
| [                                   ]     |
|                                           |
| Subtotal: $125,000                        |
|                                           |
| [Cancel] [Add to Proposal]                |
+-------------------------------------------+
```

### AI Recommendation View

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
|            | | [4. Products➡️] [5. Review]        | |
| Assignments| +-----------------------------------+ |
|            |                                  |
| Validation | Step 4 of 5: Product Selection   |
|            |                                  |
| Admin      | AI Recommendations               |
|            | +----------------------------+   |
| Settings   | | Based on your proposal     |   |
|            | | details, we recommend:     |   |
|            | |                            |   |
|            | | • Cloud Migration Service  |   |
|            | |   (Already added)          |   |
|            | |                            |   |
|            | | • Security Audit Service   |   |
|            | |   [Add to Proposal]        |   |
|            | |                            |   |
|            | | • Training Package         |   |
|            | |   [Add to Proposal]        |   |
|            | |                            |   |
|            | | • Common Bundles:          |   |
|            | |   [Migration + Security]   |   |
|            | |   [Migration + Support]    |   |
|            | |                            |   |
|            | +----------------------------+   |
|            |                                  |
|            | Available Products              |
|            | +-------------------------------------------+ |
|            | | Product           | Price      | Actions | |
|            | |-------------------|------------|--------| |
|            | | Cloud Migration   | $25,000    | [Add+] | |
|            | | Service - Basic   | per server |        | |
|            | |-------------------|------------|--------| |
|            | | Cloud Migration   | $40,000    | [Add+] | |
|            | | Service - Advanced| per server |        | |
|            | |-------------------|------------|--------| |
|            | | Security Audit    | $15,000    | [Add+] | |
|            | | Service - Standard| flat fee   |        | |
|            | +-------------------------------------------+ |
|            |                                  |
+------------+----------------------------------+
```

### Empty State / First Use

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
|            | | [4. Products➡️] [5. Review]        | |
| Assignments| +-----------------------------------+ |
|            |                                  |
| Validation | Step 4 of 5: Product Selection   |
|            |                                  |
| Admin      | Product Catalog                  |
|            | +----------------------------+   |
| Settings   | | [🔍 Search products...]    |   |
|            | |                            |   |
|            | | Categories:                |   |
|            | | [All] [Hardware] [Software]|   |
|            | | [Services] [Support] [Training]|
|            | +----------------------------+   |
|            |                                  |
|            | Available Products              |
|            | +-------------------------------------------+ |
|            | | Product           | Price      | Actions | |
|            | |-------------------|------------|--------| |
|            | | Cloud Migration   | $25,000    | [Add+] | |
|            | | Service - Basic   | per server |        | |
|            | |-------------------|------------|--------| |
|            | | Cloud Migration   | $40,000    | [Add+] | |
|            | | Service - Advanced| per server |        | |
|            | +-------------------------------------------+ |
|            |                                  |
|            | Selected Products (0)            |
|            | +----------------------------+   |
|            | |                            |   |
|            | | No products selected yet.  |   |
|            | |                            |   |
|            | | Add products from the      |   |
|            | | catalog above to include   |   |
|            | | them in your proposal.     |   |
|            | |                            |   |
|            | | [Try AI Recommendations]   |   |
|            | |                            |   |
|            | +----------------------------+   |
|            |                                  |
|            | Total: $0                        |
|            |                                  |
|            | [< Previous] [Save Draft] [Next Step >] |
|            |                                  |
+------------+----------------------------------+
```

## Specifications

### Layout Structure

- **Wizard Navigation**: Consistent with other proposal creation steps
- **Product Catalog**: Search, categories, and product listing
- **Selected Products**: Summary table with quantities and pricing
- **Product Detail**: Modal window for detailed configuration
- **AI Recommendations**: Optional panel for suggested products

### Typography

- **Page title**: 24px, SemiBold
- **Step indicator**: 16px, Medium
- **Section headers**: 18px, Medium
- **Product names**: 16px, Medium
- **Product descriptions**: 14px, Regular
- **Price information**: 16px, SemiBold for totals, 14px Regular for unit prices

### Product Display Elements

- **Product Cards/Rows**: Consistent height, clear separation
- **Price Display**: Prominent with unit type indicator (per server, flat fee,
  etc.)
- **Action Buttons**: High visibility for Add/Remove actions
- **Quantity Selectors**: Numeric input with increment/decrement controls
- **Total Calculation**: Automatically updated based on selections

### Colors

- **Primary action buttons**: Brand Blue (#2563EB)
- **Secondary actions**: Gray (#64748B)
- **Price totals**: Deep Blue (#1E40AF)
- **Category selection**: Light highlighting for active category
- **Recommended items**: Light yellow background (#FEF9C3)

### Interactions

- **Product Selection**: Single-click to add basic products
- **Product Detail**: Click on product name or "Edit" icon to open details
- **Quantity Adjustment**: Inline controls in selected products table
- **Category Filtering**: Single-click category changes product display
- **Search**: Real-time filtering as user types
- **Total Updates**: Dynamic recalculation when products or quantities change

### AI Integration Points

- **Product Recommendations**: Based on proposal context and client history
- **Common Bundles**: Suggested combinations based on past successful proposals
- **Compatibility Checks**: Warnings for incompatible product selections
- **Upsell Opportunities**: Contextual suggestions for enhancements
- **Price Optimization**: Bundle discount suggestions

### Data Requirements

- Product catalog with:
  - Name, description, features
  - Base pricing models
  - Categories and tags
  - Customization options
  - Compatibility information
- Previous proposal history for recommendations
- Client industry for contextual relevance

### Accessibility Considerations

- Clear focus states for interactive elements
- Screen reader support for pricing and product information
- Keyboard navigation through catalog and selected products
- Clear error states for incompatible selections
- Sufficient color contrast for all text elements

### Responsive Behavior

- Table view converts to cards on smaller screens
- Modal adjusts to available screen space
- Categories collapse to dropdown on mobile
- Action buttons remain accessible at all screen sizes
