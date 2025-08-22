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

Notes

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

**Mobile & Testing:**

- mobile-component.template.tsx - Touch-optimized components (44px targets)
- test.template.ts - Unit tests
- integration-test.template.tsx - React Testing Library tests

**Data & Types:**

- zod-schema.template.ts - CUID-friendly validation schemas
- types.template.ts - TypeScript interfaces and types
