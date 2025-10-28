# Quick Start: Using These Cursor Rules

## 📍 You Are Here

You have 7 Cursor Rules + 1 Guide in `.cursor/rules/` ready to help implement the TanStack Query caching plan.

## 🚀 Get Started in 5 Minutes

### 1. Open the Master Guide
```
.cursor/rules/README.md
```
This contains the complete overview and navigation for all rules.

### 2. Read the Plan
```
.cursor/plans/tanstack-query-caching-1ec5b297.plan.md
```
This tells you what you're building and why.

### 3. Choose Your First Rule
- **Just starting?** → `dependency-migration-patterns.mdc`
- **Setting up provider?** → `data-fetching-architecture.mdc`
- **Creating hooks?** → `query-hooks-organization.mdc`
- **Refactoring components?** → `component-refactoring-patterns.mdc`
- **Adding cache UI?** → `cache-management-strategy.mdc`
- **Need progressive loading?** → `incremental-loading-patterns.mdc`
- **Writing tests?** → `testing-async-data-fetching.mdc`

## 📚 Rule Reference Card

| Need | Rule | Section |
|------|------|---------|
| Install package | dependency-migration-patterns | Adding New Dependencies |
| Setup App provider | data-fetching-architecture | Provider Setup in App.tsx |
| Organize hooks | query-hooks-organization | Query Key Factory Pattern |
| Refactor component | component-refactoring-patterns | Progressive Refactoring Strategy |
| Configure cache | cache-management-strategy | Cache Lifecycle Configuration |
| Progressive loading | incremental-loading-patterns | Architecture Pattern |
| Write tests | testing-async-data-fetching | Test Setup Pattern |

## 🔄 The Flow

```
Plan → Rule → Code → Test → Next

1. Read what the plan says
2. Find the matching rule
3. Follow the pattern
4. Write your code
5. Test using rule examples
6. Move to next step
```

## 💡 Pro Tips

✅ **Keep rule open while coding** - Put rules in side panel
✅ **Reference file paths** - Rules use `[file](mdc:file)` syntax
✅ **Follow examples exactly** - Patterns are proven and reusable
✅ **Read cross-references** - Jump between related rules
✅ **Use code examples** - Copy patterns, adapt to your code
✅ **Test as you go** - Each rule has testing guidance

## 🎯 Your First Task

Following the TanStack Query plan:

1. Open: `dependency-migration-patterns.mdc`
2. Read: "Adding New Dependencies" section
3. Add to `package.json`:
   ```json
   "@tanstack/react-query": "^5.0.0"
   "@tanstack/query-persist-client-core": "^5.0.0"
   ```
4. Run: `npm install`
5. Next: Read `data-fetching-architecture.mdc`

## 📞 Questions?

| Q | Find In |
|---|----------|
| How do I organize hooks? | query-hooks-organization.mdc |
| What state should I keep? | component-refactoring-patterns.mdc |
| How does caching work? | cache-management-strategy.mdc |
| How do I test this? | testing-async-data-fetching.mdc |
| How do I update versions? | dependency-migration-patterns.mdc |
| Where do I start? | README.md (this folder) |

## 🎓 Learning Path

### Day 1: Setup
- Read: `dependency-migration-patterns.mdc`
- Read: `data-fetching-architecture.mdc`
- Task: Install package, setup provider

### Day 2: Data Layer
- Read: `query-hooks-organization.mdc`
- Task: Create lib/nearQueries.ts

### Day 3: Components
- Read: `component-refactoring-patterns.mdc`
- Task: Refactor BlockList, TransactionList

### Day 4: Features
- Read: `cache-management-strategy.mdc`
- Task: Add Settings UI for cache

### Day 5: Advanced
- Read: `incremental-loading-patterns.mdc`
- Task: Optimize TransactionList

### Day 6-7: Testing
- Read: `testing-async-data-fetching.mdc`
- Task: Write comprehensive tests

## ✨ What Makes These Rules Special

✓ **Reusable** - Works with TanStack Query, SWR, Apollo, Relay
✓ **Specific** - Includes full code examples
✓ **Complete** - 1,500+ lines of detailed guidance
✓ **Connected** - Rules reference each other
✓ **Practical** - Based on proven patterns
✓ **Hierarchical** - From basic to advanced

---

**Next Step**: Open `README.md` in this folder for complete guidance.
