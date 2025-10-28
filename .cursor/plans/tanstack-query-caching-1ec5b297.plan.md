<!-- 1ec5b297-9fd9-42d8-b5f9-3c987f49be2e 9d30a05d-58ac-49c2-87d8-f76dbdf2020b -->
# TanStack Query Caching Implementation

## Overview

Replace manual state management with TanStack Query to provide automatic caching, background refetching, and persistent history across navigation. This eliminates the current issue where switching between blocks and transactions loses context.

## Installation

Add TanStack Query dependency to `package.json`:

```json
"@tanstack/react-query": "^5.0.0"
```

## Implementation Steps

### 1. Setup Query Client (pages/App.tsx)

Wrap the app with `QueryClientProvider` and configure caching strategy:

- Use sessionStorage persistence via `persistQueryClient`
- Set `staleTime: 3000` for auto-refresh behavior
- Set `gcTime: 1000 * 60 * 10` to keep cache for 10 minutes
- Disable refetchOnWindowFocus for blockchain data stability

### 2. Create Query Hooks Library (lib/nearQueries.ts)

New file with organized query hooks:

**Query Key Factory:**

- `nearKeys.latestBlock()` - for latest block queries
- `nearKeys.block(height)` - for specific block by height
- `nearKeys.blockTransactions(height)` - for transactions in a block
- `nearKeys.recentBlocks()` - for last N blocks
- `nearKeys.recentTransactions()` - for recent transactions across blocks

**Core Hooks:**

- `useLatestBlock(refetchInterval)` - Auto-refreshing latest block
- `useBlock(height)` - Single block by height
- `useRecentBlocks(count)` - Fetches last N blocks using `useQueries`
- `useBlockTransactions(block)` - Transactions from specific block
- `useRecentTransactions(blockCount)` - Smart incremental loading
  - Initial load: fetch last 20 blocks worth of transactions
  - Subsequent polls: only fetch new blocks since last check
  - Maintain scroll position and existing data
  - Cache all fetched transactions

**Smart Incremental Pattern:**

The `useRecentTransactions` hook will maintain a `lastProcessedHeight` state and use React Query's ability to update cached data:

```typescript
// On initial load: fetch blocks [height-19 to height]
// On refresh: only fetch blocks [lastProcessedHeight+1 to newHeight]
// Merge new data with cached data using queryClient.setQueryData
```

### 3. Update BlockList.tsx

Replace manual state management with query hooks:

- Remove: `useState` for blocks, loading, error, latestHeight
- Remove: Manual `fetchBlocks()` function
- Remove: Auto-refresh `useEffect` intervals
- Add: `useLatestBlock(3000)` for auto-refresh
- Add: `useRecentBlocks(20)` for block data
- Add: `useQueries` to fetch transaction counts per block in parallel
- Keep: UI state (selectedBlock, hideZeroTxBlocks)
- Benefit: Blocks persist when navigating away and back

### 4. Update TransactionList.tsx

Preserve incremental loading pattern with queries:

- Remove: Manual `useState` for transactions, loading, error
- Remove: `fetchInitialTransactions()` and `fetchNewTransactions()`
- Remove: Manual polling intervals
- Add: `useLatestBlock(3000)` for height tracking
- Add: Custom `useIncrementalTransactions()` hook that:
  - Uses `useQuery` with dynamic query key based on height range
  - Tracks `lastProcessedHeight` in component state
  - Only fetches new blocks on refresh
  - Merges results client-side
- Keep: Account filtering logic (client-side on cached data)
- Benefit: Transaction history persists across navigation

### 5. Update BlockInspector.tsx

Use query hooks for block transaction data:

- Replace manual transaction fetching with `useBlockTransactions(block)`
- Chunk details can use individual `useQuery` hooks per chunk
- Benefit: Inspector data cached, instant when reopening same block

### 6. Update TransactionInspector.tsx

Minor changes for consistency:

- Transaction data already available from cache
- No fetching needed in inspector

### 7. Add Cache Management to Settings.tsx

Add new "Cache Management" section with:

- Display cache statistics:
  - Number of cached blocks
  - Number of cached transactions
  - Total cache size estimate
  - Last cache update time
- "Clear All Cache" button using `queryClient.clear()`
- "Clear Blocks Only" button using `queryClient.removeQueries(nearKeys.blocks())`
- "Clear Transactions Only" button using `queryClient.removeQueries(nearKeys.transactions())`
- Visual feedback with toast notifications

### 8. Add Persister for sessionStorage (lib/queryPersister.ts)

Create persister using `createSyncStoragePersister`:

- Persist to sessionStorage (survives refresh, not browser close)
- Serialize/deserialize query cache
- Handle storage quota errors gracefully
- Restore cache on app mount

## Technical Benefits

1. **History Preservation**: Navigate between pages without losing context
2. **Deduplication**: Same block/transaction requested multiple times = single network call
3. **Auto-refresh**: Built-in background refetching every 3 seconds
4. **Smart Caching**: New blocks append to cache, old data pruned automatically
5. **Loading States**: Built-in isLoading, isFetching states
6. **Error Handling**: Automatic retry with exponential backoff
7. **Memory Management**: Unused queries garbage collected after 10 minutes
8. **Code Reduction**: ~60% less boilerplate state management

## Files Modified

- `package.json` - Add dependency
- `pages/App.tsx` - Setup QueryClientProvider
- `lib/nearQueries.ts` - New file with query hooks
- `lib/queryPersister.ts` - New file for sessionStorage persistence
- `pages/BlockList.tsx` - Use query hooks
- `pages/TransactionList.tsx` - Use incremental query pattern
- `components/BlockInspector.tsx` - Use query hooks
- `pages/Settings.tsx` - Add cache management UI

## Testing Checklist

- Navigate between Blocks and Transactions tabs - history preserved
- Auto-refresh works on both pages
- Filter by account on transactions - instant (cached data)
- Open block inspector - instant for previously viewed blocks
- Page refresh - cache restored from sessionStorage
- Clear cache button - data refetches correctly
- New blocks arrive - incrementally added to cache

### To-dos

- [ ] Install @tanstack/react-query dependency
- [ ] Create lib/queryPersister.ts for sessionStorage persistence
- [ ] Create lib/nearQueries.ts with query hooks and smart incremental loading
- [ ] Update pages/App.tsx to setup QueryClientProvider with persister
- [ ] Refactor pages/BlockList.tsx to use query hooks
- [ ] Refactor pages/TransactionList.tsx with incremental query pattern
- [ ] Update components/BlockInspector.tsx to use query hooks
- [ ] Add cache statistics and management UI to pages/Settings.tsx
- [ ] Test history preservation across page navigation and verify incremental loading