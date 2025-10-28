# Cursor Rules for TanStack Query Implementation - Summary

## ✅ What Was Created

Seven comprehensive Cursor Rules have been generated in `.cursor/rules/` directory to guide the implementation of the TanStack Query caching plan. These rules are **library-agnostic** and reusable for future data fetching implementations.

**Total Content**: 1,581 lines of guidance and patterns

## 📋 Rules Created

### Core Architecture Rules (3 rules)
1. **data-fetching-architecture.mdc** (42 lines)
   - Provider setup patterns
   - Configuration strategy
   - Cache lifecycle documentation

2. **query-hooks-organization.mdc** (149 lines)
   - Query key factory patterns
   - Hook naming conventions
   - Implementation patterns for hooks
   - Reusable hook patterns (batch, dependent queries)

3. **component-refactoring-patterns.mdc** (85 lines)
   - What to remove (manual state management)
   - What to keep (UI state)
   - Component-type specific patterns
   - Incremental loading patterns
   - Error handling consistency

### Implementation Rules (2 rules)
4. **cache-management-strategy.mdc** (203 lines)
   - Cache lifecycle configuration
   - Persistence layer patterns
   - Cache invalidation strategies (full, selective, incremental)
   - Settings UI for cache management
   - Background sync patterns
   - Memory management
   - Error recovery

5. **incremental-loading-patterns.mdc** (311 lines)
   - Progressive loading architecture
   - Range tracking implementation
   - Smart query strategies
   - Data merging with deduplication
   - Scroll position management
   - Performance optimization
   - Complete component example
   - Debugging and testing

### Supporting Rules (2 rules)
6. **testing-async-data-fetching.mdc** (308 lines)
   - Test setup pattern
   - Mocking network requests
   - Testing loading/success/error states
   - Cache behavior testing
   - Cache invalidation testing
   - Hook lifecycle testing
   - Integration testing
   - Performance testing
   - Debugging failed tests

7. **dependency-migration-patterns.mdc** (226 lines)
   - Dependency addition checklist
   - Breaking changes handling
   - Gradual migration strategy (3 phases)
   - File organization during migration
   - Compatibility documentation
   - Version management
   - Integration patterns
   - Common pitfalls table

### Documentation Rule (1 rule)
8. **README.md** (257 lines)
   - Overview of all rules
   - When to use each rule
   - How rules work together
   - Usage examples for common scenarios
   - Rule customization guide
   - Implementation checklist
   - File reference guide
   - Maximum effectiveness tips

## 🔄 How They Connect to the Plan

The **Plan** (`.cursor/plans/tanstack-query-caching-1ec5b297.plan.md`) says:
- ✓ What to implement (specific features)
- ✓ Which files to modify
- ✓ Testing checklist

The **Rules** (`.cursor/rules/*.mdc`) say:
- ✓ How to implement (patterns and principles)
- ✓ Why each pattern matters
- ✓ Reusable knowledge for future projects

## 📚 Key Features of the Rules

### 1. **Hierarchical Organization**
```
Rule Coverage:
├─ Setup & Dependencies
├─ Architecture & Structure
├─ Component Refactoring
├─ Cache Management
├─ Incremental Loading (advanced)
├─ Testing & Verification
└─ Migration Strategies
```

### 2. **Practical Code Examples**
- TypeScript/JavaScript examples in each rule
- Complete component patterns
- Query key factory examples
- Test setup patterns
- Error handling examples

### 3. **Cross-References**
- Links between related rules
- File references using Cursor's `mdc:` syntax
- Table of common questions with rule references
- Quick reference sections

### 4. **Library-Agnostic Design**
- Patterns work with TanStack Query, SWR, Apollo, Relay
- Generic architecture principles
- Adaptable naming conventions
- Customization guide included

## 🎯 Usage Workflow

```
Step 1: Read the Plan
        ↓
Step 2: Identify which rule applies
        ↓
Step 3: Open the rule in a side panel
        ↓
Step 4: Follow the pattern described
        ↓
Step 5: Reference code examples
        ↓
Step 6: Use testing section to verify
        ↓
Step 7: Move to next step in plan
```

## 📍 File Structure

```
.cursor/
├─ rules/
│  ├─ README.md (master guide)
│  ├─ data-fetching-architecture.mdc
│  ├─ query-hooks-organization.mdc
│  ├─ component-refactoring-patterns.mdc
│  ├─ cache-management-strategy.mdc
│  ├─ incremental-loading-patterns.mdc
│  ├─ testing-async-data-fetching.mdc
│  └─ dependency-migration-patterns.mdc
├─ plans/
│  └─ tanstack-query-caching-1ec5b297.plan.md (what to build)
└─ ...
```

## 🚀 Next Steps

1. **Read** `.cursor/rules/README.md` for complete overview
2. **Open** `.cursor/plans/tanstack-query-caching-1ec5b297.plan.md` 
3. **Start** with `dependency-migration-patterns.mdc` (add the package)
4. **Follow** the rules in the suggested order
5. **Reference** code examples while implementing
6. **Test** using `testing-async-data-fetching.mdc`
7. **Verify** against plan checklist

## 📊 Content Breakdown

| Rule | Lines | Focus Area |
|------|-------|-----------|
| Testing | 308 | Test setup, mocking, assertions |
| Incremental | 311 | Progressive loading patterns |
| Dependencies | 226 | Migration and version management |
| Cache Management | 203 | Lifecycle, persistence, invalidation |
| Query Hooks | 149 | Key factory, naming, patterns |
| Component Refactor | 85 | State management, UI state |
| Architecture | 42 | Provider setup, organization |
| README (Guide) | 257 | Master overview and navigation |
| **Total** | **1,581** | **Complete guidance system** |

## ✨ Key Concepts Covered

1. **Architecture Patterns**
   - Provider setup and configuration
   - Hierarchical file organization
   - Cache lifecycle management

2. **Data Fetching Patterns**
   - Query key factories for cache management
   - Hook naming conventions
   - Dependent and batch queries

3. **Component Patterns**
   - UI state vs. data state separation
   - Component-specific refactoring strategies
   - Incremental loading implementation

4. **Cache Patterns**
   - Stale time and GC time configuration
   - Persistence (sessionStorage vs. localStorage)
   - Invalidation strategies (full, selective, incremental)
   - Memory management and error recovery

5. **Testing Patterns**
   - Test setup with fresh clients
   - Network mocking at lowest level
   - Cache behavior verification
   - Integration testing

6. **Migration Patterns**
   - Gradual migration strategy (3 phases)
   - Dependency version management
   - Common pitfalls and solutions

## 🎓 Best Practices Encoded

✓ Separate concerns (UI state vs. data state)
✓ Use factory pattern for query keys
✓ Test at lowest level first
✓ Document cache behavior explicitly
✓ Handle errors consistently
✓ Manage memory with GC time
✓ Test cache invalidation patterns
✓ Use persistence for better UX
✓ Implement incremental loading for streaming data
✓ Gradual migration to avoid breakage

## 💡 Smart Features

- **Side-by-side reading**: Rules reference specific files using Cursor's `mdc:` syntax
- **Progressive complexity**: Start with setup, advance to optimization
- **Reusable patterns**: Works across multiple libraries
- **Quick reference**: Common questions answered with rule pointers
- **Complete examples**: Each rule has practical code examples
- **Debugging guides**: Troubleshooting sections in most rules

## 🔍 How to Find What You Need

**Question**: "How do I organize my query hooks?"
→ See `query-hooks-organization.mdc` section "Query Key Factory Pattern"

**Question**: "How do I refactor a component?"
→ See `component-refactoring-patterns.mdc` + `query-hooks-organization.mdc`

**Question**: "How do I test this implementation?"
→ See `testing-async-data-fetching.mdc` section "Test Setup Pattern"

**Question**: "How do I add dependencies?"
→ See `dependency-migration-patterns.mdc` section "Adding New Dependencies"

**Question**: "How do I implement progressive loading?"
→ See `incremental-loading-patterns.mdc` section "Component Pattern Example"

**Question**: "How do I manage the cache?"
→ See `cache-management-strategy.mdc` section "Cache Lifecycle Configuration"

**Question**: "Where do I start?"
→ See `.cursor/rules/README.md` for complete navigation guide

## 📈 Usage in Different Contexts

### During Implementation
- Keep the relevant rule open in a side panel
- Follow patterns step-by-step
- Reference code examples
- Use testing sections to verify work

### During Code Review
- Check against naming conventions
- Verify cache patterns are correct
- Ensure test coverage matches guidelines
- Verify error handling consistency

### For Future Projects
- Adapt patterns for new libraries
- Reuse organization structure
- Apply same testing philosophy
- Use migration patterns for updates

---

**Status**: ✅ Complete
**Created**: October 28, 2025
**Target**: TanStack Query Caching Implementation
**Scope**: Reusable for any React data fetching project
**Next Action**: Read `.cursor/rules/README.md` and start implementation
