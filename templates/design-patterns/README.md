# Design Patterns Templates

Purpose: Provide copy-ready skeletons for common file types that strictly follow
docs/CORE_REQUIREMENTS.md. Use these templates to create new files that are
compliant with:

- Error handling (ErrorHandlingService) with standardized patterns
- React Query vs useApiClient data fetching rules
- Logging & observability via '@/lib/logger'
- RBAC for API routes with session validation
- Accessibility (WCAG 2.1 AA) with 44px touch targets
- Performance and pagination patterns (30-50 items, minimal fields)
- SSR/CSR hydration consistency
- Component Traceability Matrix with analytics tracking
- Mobile responsiveness and touch optimization
- Provider stack architecture

Directory: `templates/design-patterns/`

How to use

1. Pick a template matching your goal from the list below.
2. Copy the file to the appropriate location under `src/`.
3. Replace placeholders in your new file (listed below).
4. Verify with:
   - `npm run type-check`
   - `npm run test`
   - Follow CORE_REQUIREMENTS pre-implementation and quality gates.
5. Test mobile responsiveness and touch interactions if applicable.
6. Validate RBAC permissions and analytics tracking work correctly.

Placeholders to replace

**Universal Placeholders:**

- **FILE_DESCRIPTION**
- **USER_STORY**
- **HYPOTHESIS**
- **COMPONENT_NAME** / **HOOK_NAME** / **SERVICE_NAME** / **ROUTE_RESOURCE** /
  **SCHEMA_NAME**
- **ROUTE_PATH** (e.g., /app/(dashboard)/example/page.tsx)
- **QUERY_KEY_ROOT** (e.g., 'proposals')
- **PERMISSIONS** (e.g., { resource: 'proposals', action: 'read' })
- **PROVIDER_NAME** / **MIDDLEWARE_NAME** / **LAYOUT_NAME**
- **ERROR_HANDLER_NAME** / **ANALYTICS_HOOK_NAME** / **MOBILE_COMPONENT_NAME**

**Bridge Pattern Placeholders:**

- **BRIDGE_NAME** (e.g., "CustomerManagement", "ProductCatalog")
- **API_BRIDGE_NAME** (e.g., "CustomerApi", "ProductApi")
- **RESOURCE_NAME** (e.g., "customers", "products")
- **ENTITY_TYPE** (e.g., "Customer", "Product")
- **PAGE_NAME** (e.g., "CustomerManagement", "ProductCatalog")

Notes

**General Guidelines:**

- Prefer React Query hooks for lists/forms/mutations; use `useApiClient` for
  simple one-off fetches.
- Always include minimal fields and avoid relation hydration by default in list
  endpoints.
- Add structured logs (debug/info/error) and use ErrorHandlingService in catch
  blocks.
- API routes must validate permissions via centralized RBAC helpers.
- Components must use the design system from `src/components/ui` and tokens from
  `src/design-system`.
- All templates include Component Traceability Matrix with userStory,
  hypothesis, acceptanceCriteria.
- Mobile components must have 44px+ touch targets and proper gesture handling.
- Add data-testid attributes for reliable testing.
- Include analytics tracking for hypothesis validation.

**Bridge Pattern Guidelines:**

- Use bridge templates for centralized data management and API operations
- Implement singleton pattern for API bridges to ensure consistent caching
- Wrap pages/sections with Management Bridge providers for state coordination
- Replace `useApiClient` calls with bridge hooks for standardized error handling
- Include analytics tracking in all bridge operations for hypothesis validation
- Use TypeScript interfaces from bridge-types.template.ts for type safety
- Follow the three-layer architecture: API Bridge → Management Bridge →
  Components

Templates included

**Core Templates:**

- page.template.tsx - Server/client pages with SSR consistency
- component.template.tsx - UI components with accessibility & analytics
- hook.template.ts - Simple hooks with mount-only patterns
- react-query-hook.template.ts - Data fetching hooks with caching
- api-route.template.ts - API handlers with RBAC & performance
- service.template.ts - Business logic services with singleton pattern

**Architecture Templates:**

- middleware.template.ts - RBAC authentication middleware
- provider.template.tsx - Context providers with SSR consistency
- layout.template.tsx - Route-group layouts with provider stacks
- error-handler-hook.template.ts - Centralized error handling hooks
- analytics-hook.template.ts - Component Traceability Matrix tracking

**Bridge Pattern Templates:**

- bridge/api-bridge.template.ts - Singleton API service with caching and error
  handling
- bridge/management-bridge.template.tsx - React context provider with state
  management
- bridge/bridge-hook.template.ts - Custom hook for bridge access with React
  Query integration
- bridge/bridge-component.template.tsx - Component using bridge pattern with
  full CRUD operations
- bridge/bridge-page.template.tsx - Page with complete bridge integration and
  SSR optimization
- bridge/bridge-types.template.ts - TypeScript interfaces and types for bridge
  implementation

**Mobile & Testing:**

- mobile-component.template.tsx - Touch-optimized components (44px targets)
- test.template.ts - Unit tests
- integration-test.template.tsx - React Testing Library tests

**Data & Types:**

- zod-schema.template.ts - CUID-friendly validation schemas
- types.template.ts - TypeScript interfaces and types
