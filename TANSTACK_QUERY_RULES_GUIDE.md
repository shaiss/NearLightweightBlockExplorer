# TanStack Query Implementation - Cursor Rules Guide

## Overview

Seven reusable Cursor Rules have been created in `.cursor/rules/` to guide the implementation of the TanStack Query caching strategy. These rules are **library-agnostic** and can be adapted for any data fetching solution.

**Location**: `.cursor/rules/`

## Rules Created

| Rule File | Purpose | When to Use |
|-----------|---------|------------|
| `data-fetching-architecture.mdc` | Overall architecture patterns | Setting up new data fetching system |
| `query-hooks-organization.mdc` | Query hook structure and naming | Creating query hooks |
| `component-refactoring-patterns.mdc` | Component migration guidance | Updating components to use hooks |
| `cache-management-strategy.mdc` | Cache lifecycle and persistence | Implementing cache behavior |
| `incremental-loading-patterns.mdc` | Progressive data loading | Streaming/continuous data scenarios |
| `testing-async-data-fetching.mdc` | Testing patterns | Writing tests for async data |
| `dependency-migration-patterns.mdc` | Dependency management | Adding/updating libraries |

Plus: `README.md` - Complete guide to all rules and how they work together

## How These Rules Connect to the Plan

The plan file (`.cursor/plans/tanstack-query-caching-1ec5b297.plan.md`) defines:
- **What to implement** (specific features and components)
- **Why we need it** (benefits and technical goals)

The Cursor Rules define:
- **How to implement it** (patterns and best practices)
- **Why each pattern matters** (architecture decisions)
- **Reusable knowledge** (applies to future implementations)

### Key Differences

| Plan | Rules |
|------|-------|
| Project-specific tasks | Reusable patterns and guidance |
| Hard-coded component names | Generic, library-agnostic approaches |
| Step-by-step checklist | Foundational principles and patterns |
| "Do this" | "Here's how to think about this" |

## The Implementation Workflow

```
┌─ Read the Plan ──────────────────────────┐
│ Understand what needs to be built       │
└─ Now read the corresponding Rules ──────┘
         │
         ├─→ dependency-migration-patterns.mdc
         │   Add @tanstack/react-query
         │
         ├─→ data-fetching-architecture.mdc
         │   Setup App.tsx provider
         │
         ├─→ query-hooks-organization.mdc
         │   Create lib/nearQueries.ts
         │
         ├─→ component-refactoring-patterns.mdc
         │   Update pages/BlockList.tsx, etc.
         │
         ├─→ cache-management-strategy.mdc
         │   Add Settings UI for cache
         │
         ├─→ incremental-loading-patterns.mdc
         │   Optimize TransactionList
         │
         └─→ testing-async-data-fetching.mdc
             Write comprehensive tests
```

## Using Rules While Implementing

### Scenario: Implementing the Plan

1. **Add Dependency** (Plan Section: Installation)
   - Read: `dependency-migration-patterns.mdc`
   - Follow: "Adding New Dependencies" section
   - Verify: npm list shows correct version

2. **Setup Query Client** (Plan Section: Implementation Step 1)
   - Read: `data-fetching-architecture.mdc`
   - Follow: "Provider Setup in App.tsx" section
   - Reference: `pages/App.tsx` using mdc: syntax

3. **Create Query Hooks** (Plan Section: Implementation Step 2)
   - Read: `query-hooks-organization.mdc`
   - Follow: "Query Key Factory Pattern" section
   - Follow: "Hook Naming Conventions" section
   - Create: `lib/nearQueries.ts`

4. **Refactor BlockList** (Plan Section: Implementation Step 3)
   - Read: `component-refactoring-patterns.mdc`
   - Follow: "Data List Components" section
   - Reference: Checklist for what to remove vs. keep

5. **Add Cache Management UI** (Plan Section: Implementation Step 7)
   - Read: `cache-management-strategy.mdc`
   - Follow: "Settings/Cache Management UI" section
   - Reference: `pages/Settings.tsx`

6. **Optimize TransactionList** (Plan Section: Implementation Step 4)
   - Read: `incremental-loading-patterns.mdc`
   - Follow: "Component Pattern Example" section
   - Implement: Incremental transaction loading

7. **Write Tests** (Plan Section: Testing Checklist)
   - Read: `testing-async-data-fetching.mdc`
   - Follow: "Test Setup Pattern" section
   - Create: Tests for each component/hook

## Rule File Format

Each `.mdc` file uses Cursor's Markdown format with:

- **Frontmatter** (top section):
  ```
  ---
  globs: pages/App.tsx,lib/**
  description: Data Fetching Architecture and Provider Setup
  ---
  ```

- **Sections**: Organized by topic with clear headings
- **Code Examples**: Practical TypeScript/JavaScript examples
- **File References**: Using `[filepath](mdc:filepath)` syntax
- **Cross-references**: Links to related rules

## Navigation Tips

### Finding the Right Rule

**Question**: "How should I organize query hooks?"
→ See `query-hooks-organization.mdc`

**Question**: "How do I refactor BlockList?"
→ See `component-refactoring-patterns.mdc` + `query-hooks-organization.mdc`

**Question**: "How do I test this?"
→ See `testing-async-data-fetching.mdc`

**Question**: "What do I do with npm install?"
→ See `dependency-migration-patterns.mdc`

**Question**: "How do I implement the Settings cache UI?"
→ See `cache-management-strategy.mdc`

**Question**: "How do I handle incremental updates?"
→ See `incremental-loading-patterns.mdc`

### Using File References

Rules use `[filename](mdc:filename)` references:

```markdown
Setup the provider in [pages/App.tsx](mdc:pages/App.tsx)
```

These are clickable in Cursor and help navigate the codebase.

## Integration with the Plan

### During Implementation

1. **Open the Plan** (`.cursor/plans/tanstack-query-caching-1ec5b297.plan.md`)
2. **For each section** in the plan:
   - Identify which rule applies
   - Open that rule in a side panel
   - Follow the pattern described
   - Reference the file examples

3. **After each major step**:
   - Check off the corresponding todo
   - Use relevant rule's testing section
   - Verify against the plan's checklist

### During Code Review

- Use rules to verify patterns are followed correctly
- Check against naming conventions in `query-hooks-organization.mdc`
- Verify test coverage using `testing-async-data-fetching.mdc`
- Ensure cache patterns from `cache-management-strategy.mdc`

## Customizing Rules for Different Libraries

The rules use TanStack Query examples, but can be adapted:

### To use with SWR instead:
- Replace `useQuery` with `useSWR`
- Replace `queryClient.invalidateQueries` with SWR's `mutate`
- Keep the overall architecture structure

### To use with Apollo Client:
- Replace `useQuery` with `useApolloQuery`
- Adapt query key patterns to GraphQL queries
- Keep component refactoring patterns

### To use with Relay:
- Replace hooks with Relay hooks
- Adapt cache management to Relay store
- Keep testing patterns (mostly compatible)

## Key Concepts Across All Rules

1. **Provider Setup**: All data fetching needs a provider wrapper
2. **Query Keys**: Hierarchical, immutable identifiers for cache management
3. **UI State vs. Data State**: Keep them separate
4. **Cache Lifecycle**: Define stale time, GC time, refetch behavior
5. **Error Handling**: Consistent patterns across all components
6. **Testing**: Test at the lowest level first, then integration

## Phase Breakdown

### Phase 1: Setup (rules 1-2)
- Install dependency (dependency-migration-patterns.mdc)
- Setup provider (data-fetching-architecture.mdc)
- Create basic hooks (query-hooks-organization.mdc)

### Phase 2: Components (rules 3)
- Refactor BlockList (component-refactoring-patterns.mdc)
- Refactor TransactionList (component-refactoring-patterns.mdc)
- Refactor Inspectors (component-refactoring-patterns.mdc)

### Phase 3: Features (rules 4-5)
- Cache management in Settings (cache-management-strategy.mdc)
- Incremental loading (incremental-loading-patterns.mdc)

### Phase 4: Verification (rule 6)
- Write tests (testing-async-data-fetching.mdc)
- Performance testing
- Integration testing

## Success Criteria

After following the rules and plan:

✅ TanStack Query installed and configured
✅ QueryClientProvider wraps entire app
✅ `lib/nearQueries.ts` with query key factory and hooks
✅ All data fetching uses query hooks (not manual useState)
✅ Settings has cache management UI
✅ TransactionList shows incremental loading
✅ Comprehensive tests covering all patterns
✅ Cache persists across page navigation
✅ Navigation between pages preserves context

## Common Pitfalls & Solutions

| Issue | Solution | Rule Reference |
|-------|----------|-----------------|
| Inconsistent query keys | Use key factory pattern | query-hooks-organization.mdc |
| Manual state for data | Replace with hooks | component-refactoring-patterns.mdc |
| Missing cache invalidation | Use patterns from rule | cache-management-strategy.mdc |
| Race conditions | Proper query keying | query-hooks-organization.mdc |
| Memory leaks | Set gcTime appropriately | cache-management-strategy.mdc |
| Tests fail with async | Use waitFor patterns | testing-async-data-fetching.mdc |
| Scroll jumps on update | Manage scroll position | incremental-loading-patterns.mdc |

## Next Steps

1. **Read** `.cursor/rules/README.md` for complete overview
2. **Start** with `dependency-migration-patterns.mdc`
3. **Follow** the workflow steps in order
4. **Reference** rules while implementing
5. **Test** using `testing-async-data-fetching.mdc`
6. **Verify** against plan checklist

## Rules Version

- **Created**: October 28, 2025
- **Target Plan**: TanStack Query Caching Implementation (1ec5b297)
- **Library**: TanStack Query v5
- **Compatibility**: Adaptable to other query libraries (SWR, Apollo, Relay)
- **Scope**: Reusable for any React data fetching project

## Questions?

Look in `.cursor/rules/README.md` for:
- Rule-by-rule explanations
- Cross-references between rules
- Implementation checklists
- Usage examples and scenarios
