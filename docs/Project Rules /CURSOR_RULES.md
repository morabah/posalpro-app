- # PosalPro MVP2 - Project-Specific Rules

## Project Context
- **Technology Stack**: Next.js 15, TypeScript, Tailwind CSS, ESLint
- **Project Structure**: App Router with src/ directory organization
- **Documentation Hub**: PROJECT_REFERENCE.md (central navigation)

## Implementation Constraints (CRITICAL)
- Execute ONLY tasks specified in current prompt
- NO additional features, logic, files, or suggestions beyond request
- Adhere strictly to specified paths, names, and versions
- Follow the 11-phase implementation structure from INTEGRATED_AI_DEVELOPMENT_FRAMEWORK.md

## Code Quality Standards (Senior-Level)
- Robust error handling with specific client/server distinction
- Comprehensive input validation at all boundaries
- Efficient algorithms and performance optimization
- Secure coding practices and data sanitization
- Clear variable/function names following Next.js conventions
- Modular code adhering to Single Responsibility Principle


posalpro-app/
├── src/
│ ├── app/ # Next.js App Router pages
│ ├── components/ # Reusable UI components
│ ├── lib/ # Utility functions and configurations
│ ├── types/ # TypeScript type definitions
│ └── styles/ # Global styles and design tokens
├── docs/ # Project documentation (symlinked from parent)
├── platform/ # Platform engineering configs (symlinked from parent)
└── ...config files



## Documentation Integration Requirements
- Update PROJECT_REFERENCE.md for major architectural changes
- Document new patterns in PROMPT_PATTERNS.md
- Capture lessons learned in LESSONS_LEARNED.md for complex implementations
- Log all prompt executions in IMPLEMENTATION_LOG.md
- Maintain cross-references between related components

## POST-IMPLEMENTATION DOCUMENTATION RULES

### MANDATORY: After Every Implementation
**Always update these documents immediately after completing any implementation:**

1. **IMPLEMENTATION_LOG.md** - REQUIRED for ALL implementations
   ```
   ## [DATE] [TIME] - [Brief Description]
   **Phase**: [Phase Number] - [Phase Name]
   **Status**: [✅ Complete | ⚠️ Partial | ❌ Failed]
   **Files Modified**: [List of files changed]
   **Key Changes**: [Bullet points of main changes]
   ```

### CONDITIONAL: Based on Implementation Type

#### When to Update **LESSONS_LEARNED.md**:
- ✅ **Complex Problem Solving**: Multi-step solutions, debugging sessions
- ✅ **Architecture Decisions**: Major structural changes, pattern implementations
- ✅ **Error Resolution**: Significant bugs fixed, security issues resolved
- ✅ **Performance Optimizations**: Speed improvements, resource optimization
- ✅ **Integration Challenges**: Third-party services, API integrations
- ✅ **Best Practice Discoveries**: New patterns, better approaches found

#### When to Update **PROJECT_REFERENCE.md**:
- ✅ **New Major Components**: Core system additions
- ✅ **API Endpoints**: New routes, significant route changes
- ✅ **Configuration Changes**: Environment variables, build settings
- ✅ **Directory Structure**: New folders, organization changes
- ✅ **Dependencies**: Major package additions/removals
- ✅ **Deployment Changes**: Infrastructure, hosting modifications

#### When to Update **PROMPT_PATTERNS.md**:
- ✅ **New Prompt Techniques**: Effective prompt strategies discovered
- ✅ **AI Interaction Patterns**: Successful collaboration approaches
- ✅ **Debugging Patterns**: Systematic troubleshooting approaches
- ✅ **Code Generation Patterns**: Effective code creation strategies
- ✅ **Documentation Patterns**: Successful documentation approaches

### COMPLETION TRIGGERS
**Update documentation when ANY of these occur:**

#### ✅ **Phase Completion**
- Update all relevant documents
- Add phase summary to IMPLEMENTATION_LOG.md
- Capture major lessons in LESSONS_LEARNED.md
- Update PROJECT_REFERENCE.md with new capabilities

#### ✅ **Feature Implementation**
- Log implementation details in IMPLEMENTATION_LOG.md
- Document any architectural decisions in LESSONS_LEARNED.md
- Update PROJECT_REFERENCE.md if feature adds new endpoints/components

#### ✅ **Bug Resolution**
- Always log in IMPLEMENTATION_LOG.md
- Add to LESSONS_LEARNED.md if complex or teaches important lesson
- Update PROJECT_REFERENCE.md if fix changes API or behavior

#### ✅ **Configuration Changes**
- Log in IMPLEMENTATION_LOG.md
- Update PROJECT_REFERENCE.md for environment/build changes
- Add to LESSONS_LEARNED.md if configuration was complex

#### ✅ **Error Handling**
- Always log resolution in IMPLEMENTATION_LOG.md
- Add debugging approach to LESSONS_LEARNED.md
- Consider adding pattern to PROMPT_PATTERNS.md if AI-assisted

#### ✅ **Performance Improvements**
- Log metrics in IMPLEMENTATION_LOG.md
- Document approach in LESSONS_LEARNED.md
- Update PROJECT_REFERENCE.md if changes affect system behavior

### DOCUMENTATION QUALITY STANDARDS

#### **IMPLEMENTATION_LOG.md Format**:
```markdown
## YYYY-MM-DD HH:MM - [Implementation Title]
**Phase**: X.Y - [Phase Name]
**Status**: [✅/⚠️/❌] [Status Description]
**Duration**: [Time spent]
**Files Modified**: 
- path/to/file1.ts
- path/to/file2.tsx
**Key Changes**:
- Bullet point summary
**Testing**: [How verified]
**Notes**: [Any important context]
```

#### **LESSONS_LEARNED.md Format**:
```markdown
## [Category] - [Lesson Title]
**Date**: YYYY-MM-DD
**Context**: [What was being implemented]
**Problem**: [What challenge was faced]
**Solution**: [How it was resolved]
**Key Insights**: [What was learned]
**Prevention**: [How to avoid in future]
**Related**: [Links to other docs/patterns]
```

#### **PROJECT_REFERENCE.md Updates**:
- Keep architecture section current
- Update API endpoint listings
- Maintain dependency lists
- Update deployment instructions
- Cross-reference related documentation

### DOCUMENTATION VALIDATION
**Before considering implementation complete:**
- [ ] IMPLEMENTATION_LOG.md updated with current session
- [ ] Relevant conditional docs updated based on change type
- [ ] All cross-references between docs verified
- [ ] Documentation reflects actual implemented state
- [ ] Future developers can understand changes from docs alone

## Validation Requirements
- Execute logValidation(phase, status, details, lessons?, patterns?) for each checkpoint
- Functional verification of all implemented features
- Integration testing for connected components
- Documentation completeness verification
- Performance impact assessment

## Technology-Specific Guidelines
- Use Next.js 15 App Router patterns exclusively
- Implement TypeScript strict mode with proper type safety
- Follow Tailwind CSS utility-first approach
- Use ESLint configuration without deviation
- Maintain path aliases (@/* for src/*)

## Platform Engineering Integration
- Follow golden path templates from platform/ directory
- Reference platform engineering foundation patterns
- Integrate with developer experience metrics tracking
- Maintain compatibility with Internal Developer Platform (IDP)

## AI Development Context
- Reference PROMPT_PATTERNS.md for standardized interactions
- Use established prompt patterns for consistency
- Maintain context management throughout sessions
- Apply validation criteria for quality assurance

## Environment Configuration
- Support multiple environments (local, development, staging, production)
- Environment-aware API client implementation
- Proper environment variable validation
- Configuration utility for type-safe access

## Error Handling Standards
- Implement comprehensive error boundaries
- Use categorized error types (Network, Auth, Validation, Business)
- Provide user-friendly error messages
- Include context and recovery strategies
- Integrate with logging infrastructure

## Performance Requirements
- Implement caching strategies with LRU and browser caching
- Performance monitoring and measurement utilities
- Web Vitals tracking and optimization
- Bundle size optimization and code splitting

## Security Implementation
- Input validation at all boundaries
- Proper authentication and authorization patterns
- Secure API communication
- Data sanitization and XSS prevention
- Security headers and CORS configuration




## File Structure Adherence

## Forbidden Practices
- No direct DOM manipulation - use React patterns
- No inline styles - use Tailwind CSS classes
- No console.log in production code - use proper logging
- No hardcoded API URLs - use environment variables
- No skipping TypeScript strict mode checks
- No modifications without documentation updates 