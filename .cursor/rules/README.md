# Cursor Rules for TanStack Query Caching Implementation

This directory contains a set of reusable Cursor Rules designed to guide the implementation of the TanStack Query caching strategy for the NEAR Lightweight Block Explorer. These rules are **library-agnostic** and can be applied to other data fetching implementations.

## Rules Overview

### 1. **data-fetching-architecture.mdc**
Establishes the overall architecture pattern for data fetching implementations.

**When to use**: When setting up any new data fetching library or cache system
- Defines provider setup pattern
- Organizes library setup in `App.tsx`
- Structures the data layer in `lib/`
- Documents cache lifecycle

**Key concepts**: Provider, configuration, cache lifecycle

---

### 2. **query-hooks-organization.mdc**
Defines how to organize and structure query hooks and key factories.

**When to use**: When creating new query hooks or refactoring existing data fetching logic
- Query key factory patterns (hierarchical organization)
- Hook naming conventions (`useLatest*`, `useIncremental*`, etc.)
- Implementation patterns for individual hooks
- Batch query and dependent query patterns

**Key concepts**: Query keys, hook naming, factory pattern

---

### 3. **component-refactoring-patterns.mdc**
Provides guidance on migrating components from manual state management to query hooks.

**When to use**: When updating components to use the new data layer
- Identifying what to remove (manual state management)
- Identifying what to keep (UI-only state)
- Component-type specific patterns (lists, inspectors, settings)
- Incremental loading patterns
- Consistent error handling

**Key concepts**: State management, UI vs. data state, refactoring strategy

---

### 4. **cache-management-strategy.mdc**
Covers cache lifecycle, persistence, and user-facing cache management.

**When to use**: When implementing cache behavior and user settings
- Cache configuration (`staleTime`, `gcTime`, refetch behavior)
- Persistence layer setup (sessionStorage vs. localStorage)
- Cache invalidation patterns (full, selective, incremental)
- Settings UI for cache management
- Background sync patterns
- Memory management and error recovery

**Key concepts**: Cache lifecycle, persistence, invalidation, memory management

---

### 5. **incremental-loading-patterns.mdc**
Specialized patterns for progressive/incremental data loading.

**When to use**: When implementing features that load data continuously (blockchain blocks, transactions)
- Tracking loading ranges
- Smart query strategies for range-based fetching
- Merging new data with cached data
- Scroll position management
- Performance optimization
- Debugging and testing

**Key concepts**: Progressive loading, range tracking, deduplication, scroll handling

---

### 6. **testing-async-data-fetching.mdc**
Comprehensive testing patterns for async data fetching.

**When to use**: When writing tests for components using query hooks
- Test setup with fresh QueryClient
- Mocking network requests
- Testing loading/success/error states
- Cache behavior testing
- Cache invalidation testing
- Hook lifecycle testing
- Integration and performance testing

**Key concepts**: Test setup, mocking, async testing, cache testing

---

### 7. **dependency-migration-patterns.mdc**
Guidance for adding new dependencies and managing library migrations.

**When to use**: When adding new packages or upgrading major versions
- Dependency addition checklist
- Breaking change handling
- Gradual migration strategy (3 phases)
- File organization during migration
- Compatibility documentation
- Version management
- Common pitfalls and solutions

**Key concepts**: Dependency management, migration strategy, version control

---

## How the Rules Work Together

```
START: Plan a Data Fetching Implementation
│
├─ 1. Use dependency-migration-patterns.mdc
│      └─ Add new library to package.json
│      └─ Document rationale and versions
│
├─ 2. Use data-fetching-architecture.mdc
│      └─ Set up provider in App.tsx
│      └─ Configure cache behavior
│      └─ Organize lib/ directory
│
├─ 3. Use query-hooks-organization.mdc
│      └─ Create query key factory
│      └─ Implement custom hooks
│      └─ Follow naming conventions
│
├─ 4. Use component-refactoring-patterns.mdc
│      └─ Identify what to remove/keep
│      └─ Refactor components
│      └─ Follow component-type patterns
│
├─ 5. Use cache-management-strategy.mdc
│      └─ Configure cache lifecycle
│      └─ Implement persistence
│      └─ Add Settings UI
│
├─ 6. Use incremental-loading-patterns.mdc (if needed)
│      └─ For streaming/continuous data
│      └─ Range-based loading
│      └─ Merge strategies
│
└─ 7. Use testing-async-data-fetching.mdc
       └─ Test all components
       └─ Verify cache behavior
       └─ Performance testing
```

## Usage Examples

### Scenario 1: Implement TanStack Query
1. Read `dependency-migration-patterns.mdc` → Add @tanstack/react-query
2. Read `data-fetching-architecture.mdc` → Setup QueryClientProvider
3. Read `query-hooks-organization.mdc` → Create nearQueries.ts
4. Read `component-refactoring-patterns.mdc` → Update BlockList, TransactionList
5. Read `cache-management-strategy.mdc` → Add Settings cache UI
6. Read `incremental-loading-patterns.mdc` → Optimize TransactionList
7. Read `testing-async-data-fetching.mdc` → Write comprehensive tests

### Scenario 2: Update to New Library Version
1. Read `dependency-migration-patterns.mdc` → Check breaking changes
2. Run quick reference commands to find what needs updating
3. Use `testing-async-data-fetching.mdc` → Verify tests still pass

### Scenario 3: Add New Query Hooks
1. Read `query-hooks-organization.mdc` → Follow naming and key patterns
2. Read `testing-async-data-fetching.mdc` → Write tests immediately
3. Read `component-refactoring-patterns.mdc` → Update consuming components

### Scenario 4: Debug Cache Issues
1. Read `cache-management-strategy.mdc` → Review invalidation patterns
2. Read `incremental-loading-patterns.mdc` → Check merge logic
3. Read `testing-async-data-fetching.mdc` → Add debugging tests

## Rule Customization

These rules use **generic patterns** that work across different libraries:
- TanStack Query ✓
- SWR
- Apollo Client
- Relay
- Custom hooks + Context

To adapt for a different library:
1. Replace `useQuery` patterns with the target library's API
2. Adapt query key patterns to match the library's requirements
3. Keep the overall architecture and organization the same
4. Update hook naming if the library uses different conventions

## Implementation Checklist

When following these rules for a complete implementation:

- [ ] **Phase 1 - Setup**
  - [ ] Read dependency-migration-patterns.mdc
  - [ ] Read data-fetching-architecture.mdc
  - [ ] Add dependencies
  - [ ] Setup provider

- [ ] **Phase 2 - Data Layer**
  - [ ] Read query-hooks-organization.mdc
  - [ ] Create query key factory
  - [ ] Implement core hooks

- [ ] **Phase 3 - Component Updates**
  - [ ] Read component-refactoring-patterns.mdc
  - [ ] Refactor list components
  - [ ] Refactor inspector components

- [ ] **Phase 4 - Advanced Features**
  - [ ] Read cache-management-strategy.mdc
  - [ ] Add persistence
  - [ ] Add cache management UI

- [ ] **Phase 5 - Optimization** (if needed)
  - [ ] Read incremental-loading-patterns.mdc
  - [ ] Optimize streaming/continuous data

- [ ] **Phase 6 - Testing & Verification**
  - [ ] Read testing-async-data-fetching.mdc
  - [ ] Write comprehensive tests
  - [ ] Verify cache behavior
  - [ ] Performance testing

## File References

Each rule contains references to project files using Cursor's `mdc:` syntax:
- `[pages/App.tsx](mdc:pages/App.tsx)` - Provider setup
- `[lib/](mdc:lib/)` - Data layer organization
- `[pages/BlockList.tsx](mdc:pages/BlockList.tsx)` - List component example
- `[pages/Settings.tsx](mdc:pages/Settings.tsx)` - Cache management UI

These references help navigate the codebase while following the rules.

## Tips for Maximum Effectiveness

1. **Read in order** - The rules build on each other
2. **Reference while coding** - Open the rule alongside your editor
3. **Follow patterns exactly** - Consistency enables future optimizations
4. **Test as you go** - Use testing rules after each component
5. **Keep documentation updated** - As you implement, update README
6. **Use cross-references** - Jump between rules as needed

## Questions During Implementation?

- **"What should this component's state be?"** → See component-refactoring-patterns.mdc
- **"How do I organize query hooks?"** → See query-hooks-organization.mdc
- **"How do I add a new dependency?"** → See dependency-migration-patterns.mdc
- **"How do I test this?"** → See testing-async-data-fetching.mdc
- **"How do I handle cache invalidation?"** → See cache-management-strategy.mdc
- **"How do I implement incremental loading?"** → See incremental-loading-patterns.mdc

---

**Last Updated**: October 28, 2025
**Target Plan**: TanStack Query Caching Implementation
**Compatibility**: Works with any React query/state management library
