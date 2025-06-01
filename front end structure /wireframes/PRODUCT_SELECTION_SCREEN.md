# Product Selection Screen - Refined Layout

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
