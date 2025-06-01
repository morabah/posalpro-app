# Product Management Screen - Refined Layout

## Selected Design: Tabbed Interface with Action Panel

```
+-----------------------------------------------+
| POSALPRO                      [Search] [👤 MR] |
+------------+----------------------------------|
|            |                                  |
| Dashboard  | Product Management               |
|            |                                  |
| Proposals  | [Create Product]   [Import Data]  |
|            |                                  |
| Products  ◀| Filter: [All Categories  ▼]      |
|            | Sort by: [Newest First   ▼]      |
| Content    | Search: [                  🔍]   |
|            |                                  |
| Assignments| +-------------------------------+ |
|            | | Product Catalog (243 products) | |
| Validation | +-------------------------------+ |
|            | | Name          | Category | Price | Status | Actions |
| Admin      | |---------------|----------|-------|--------|---------|
|            | | Cloud Security| Security | $2500 | Active | [✏️][👁️] |
| Settings   | | Package       | Solution |       |        |         |
|            | |---------------|----------|-------|--------|---------|
|            | | Data Migration| Services | $175/h| Active | [✏️][👁️] |
|            | | Service       |          |       |        |         |
|            | |---------------|----------|-------|--------|---------|
|            | | AI Analytics  | Software | $950  | Draft  | [✏️][👁️] |
|            | | Dashboard     | Product  |       |        |         |
|            | |---------------|----------|-------|--------|---------|
|            | | Network Audit | Services | $3500 | Active | [✏️][👁️] |
|            | | Package       |          |       |        |         |
|            | +-------------------------------+ |
|            | [< 1 2 3 ... 25 >]              |
|            |                                  |
+------------+----------------------------------+
```

## Product Creation Modal

```
+--------------------------------------------------+
| Create New Product                          [✕]  |
|--------------------------------------------------|
| Product Information                              |
| +----------------------------------------------+ |
| | Product Name*                                | |
| | [Cloud Security Suite                      ] | |
| |                                              | |
| | Product ID                                   | |
| | [CS-2025-001                               ] | |
| |                                              | |
| | Category*                     Sub-Category   | |
| | [Security Solution     ▼]   [Cloud       ▼]  | |
| |                                              | |
| | Short Description*                           | |
| | [Enterprise-grade cloud security solution  ] | |
| | [with advanced threat detection            ] | |
| | [                                          ] | |
| |                                              | |
| | Detailed Description                         | |
| | [# Cloud Security Suite                    ] | |
| | [                                          ] | |
| | [Our enterprise security solution provides ] | |
| | [comprehensive protection for cloud assets.] | |
| | [                                          ] | |
| | [## Key Features                           ] | |
| | [                                          ] | |
| | [- Real-time threat monitoring             ] | |
| | [- AI-powered intrusion detection          ] | |
| | [- Compliance automation                   ] | |
| | [                           ] [Format ▼] [AI✨] | |
| +----------------------------------------------+ |
|                                                  |
| Pricing Information                              |
| +----------------------------------------------+ |
| | Price Model*          Base Price*             | |
| | (○) Fixed Price      [$2500.00           ]    | |
| | ( ) Hourly Rate                               | |
| | ( ) Subscription                              | |
| |                                              | |
| | Discount Options                             | |
| | [✓] Volume discount                          | |
| | [ ] Annual commitment discount               | |
| | [ ] New client discount                      | |
| +----------------------------------------------+ |
|                                                  |
| Options & Customization                          |
| +----------------------------------------------+ |
| | [Add Option]                               | |
| |                                              | |
| | Option: Deployment Type                      | |
| | Type: [Single Select  ▼]   [Remove]          | |
| | Options:                                     | |
| | - Cloud-only (+$0)                           | |
| | - Hybrid (+$500)                             | |
| | - On-premises (+$1200)                       | |
| |                                              | |
| | Option: Support Level                        | |
| | Type: [Single Select  ▼]   [Remove]          | |
| | Options:                                     | |
| | - Standard (included)                        | |
| | - Premium (+$750/year)                       | |
| | - Enterprise (+$2000/year)                   | |
| +----------------------------------------------+ |
|                                                  |
| Related Resources                                |
| +----------------------------------------------+ |
| | [+ Add Document]  [+ Add Image]              | |
| |                                              | |
| | File: Security_Whitepaper.pdf   [View][✕]    | |
| | File: Dashboard_Screenshot.png  [View][✕]    | |
| | File: Implementation_Guide.pdf  [View][✕]    | |
| +----------------------------------------------+ |
|                                                  |
| Product Visibility & Status                      |
| +----------------------------------------------+ |
| | Status: [Draft ▼]                            | |
| |                                              | |
| | [✓] Show in proposal product catalog         | |
| | [ ] Featured product                         | |
| | [✓] Available for all clients                | |
| | [ ] Client-specific pricing available        | |
| +----------------------------------------------+ |
|                                                  |
|   [Cancel]  [Save Draft]  [Save and Activate]   |
+--------------------------------------------------+
```

## Product Detail View

```
+-----------------------------------------------+
| POSALPRO                      [Search] [👤 MR] |
+------------+----------------------------------|
|            |                                  |
| Dashboard  | Product > Cloud Security Suite   |
|            |                                  |
| Proposals  | [Edit Product] [Clone Product] [Export Data]  |
|            |                                  |
| Products  ◀| Status: ACTIVE  ID: CS-2025-001  |
|            |                                  |
| Content    | Product Information              |
|            | +----------------------------+   |
| Assignments| | Name: Cloud Security Suite |   |
|            | | Category: Security Solution|   |
| Validation | | Sub-category: Cloud        |   |
|            | |                            |   |
| Admin      | | Description:               |   |
|            | | Enterprise-grade cloud     |   |
| Settings   | | security solution with     |   |
|            | | advanced threat detection  |   |
|            | +----------------------------+   |
|            |                                  |
|            | Pricing                          |
|            | +----------------------------+   |
|            | | Base Price: $2,500         |   |
|            | | Price Model: Fixed Price   |   |
|            | |                            |   |
|            | | Customization Options:     |   |
|            | | - Deployment Type          |   |
|            | | - Support Level            |   |
|            | +----------------------------+   |
|            |                                  |
|            | Resources & Documentation        |
|            | +----------------------------+   |
|            | | • Security_Whitepaper.pdf  |   |
|            | | • Dashboard_Screenshot.png |   |
|            | | • Implementation_Guide.pdf |   |
|            | +----------------------------+   |
|            |                                  |
|            | Product History                  |
|            | +----------------------------+   |
|            | | Created: 2025-04-10        |   |
|            | | By: Mohamed Rabah          |   |
|            | | Last modified: 2025-05-22  |   |
|            | | By: Sarah Johnson          |   |
|            | +----------------------------+   |
|            |                                  |
+------------+----------------------------------+
```

## Design Specifications

### Layout

- **Main Navigation**: Consistent with other PosalPro screens, left sidebar
  navigation
- **Product List**: Tabular format with sortable columns and filtering options
- **Create/Edit Form**: Modal overlay for focused input
- **Detail View**: Full page with sections for different aspects of product
  information

### Typography

- **Headers**: 18px, Semi-bold, #1e293b
- **Table Headers**: 14px, Semi-bold, #64748b
- **Body Text**: 14px, Regular, #334155
- **Form Labels**: 14px, Medium, #475569
- **Buttons**: 14px, Medium, #ffffff (on colored background)

### Interaction States

- **Normal**: Standard view with full functionality
- **Empty State**: When no products exist, shows guidance to create first
  product
- **Loading**: Shows skeleton UI while fetching product data
- **Error**: Form validation errors with inline messages
- **Success**: Confirmation message after successful product creation/update

### Color System

- **Primary Actions**: #2563eb (blue)
- **Secondary Actions**: #64748b (slate)
- **Success States**: #16a34a (green)
- **Warning States**: #ca8a04 (yellow)
- **Error States**: #dc2626 (red)
- **Draft Status**: #9ca3af (gray)
- **Active Status**: #16a34a (green)
- **Archived Status**: #6b7280 (gray)

### Responsive Behavior

- **Desktop**: Full table view with all columns
- **Tablet**: Condensed table with fewer visible columns, expandable rows
- **Mobile**: Card-based layout instead of table, swipeable product cards

### Data Requirements

- **Product Information**:
  - Name, ID, Category, Sub-category
  - Short and detailed description
  - Status (Draft, Active, Archived)
  - Creation and modification timestamps
  - Creator and modifier user information
- **Pricing Data**:
  - Base price
  - Price model (Fixed, Hourly, Subscription)
  - Discount options
- **Customization Options**:
  - Option name
  - Option type (Single select, Multi-select, Text input, Number input)
  - Option choices and price modifiers
- **Resources**:
  - Documentation files
  - Product images
  - Technical specifications

### Accessibility

- All interactive elements have proper focus states
- Form inputs include proper labels and aria attributes
- Color contrast meets WCAG 2.1 AA standards
- Error states include both color and text indicators
- Keyboard navigation supported for all actions

### AI Integration

- **AI-assisted description generation**: Helps users create compelling product
  descriptions
- **Smart categorization**: Suggests appropriate categories based on product
  description
- **Pricing assistance**: Recommends pricing based on similar products
- **Image enhancement**: Automatically processes and optimizes product images
- **Completion assistance**: Flags missing fields and suggests improvements

## Implementation Notes

1. **Technical Requirements**:

   - Database schema for product catalog with relationships to proposals
   - File storage for product resources and images
   - Rich text editor for detailed descriptions
   - Permission controls for product management

2. **Performance Considerations**:

   - Lazy loading for product catalog with large datasets
   - Image optimization for product visuals
   - Caching for frequently accessed products
   - Efficient search indexing for quick filtering

3. **Security Considerations**:
   - Role-based access for product management
   - Content validation for uploaded resources
   - Audit logging for product changes
   - Protection against price manipulation
