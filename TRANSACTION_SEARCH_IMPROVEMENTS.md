# Transaction Search Improvements

## Summary
Enhanced transaction search to leverage TanStack Query cache and increased block search depth from 100 to 1000 blocks.

## Changes Made

### 1. Cache-First Transaction Lookup (pages/TransactionDetail.tsx)

**Problem**: Transaction search was doing expensive 100-block searches even when the transaction was already cached from the /transactions page.

**Solution**: Added cache-first lookup strategy:
1. Check TanStack Query cache for the transaction (from `nearKeys.recentTransactions()`)
2. If found in cache, use the cached `signer_id` to fetch full transaction details
3. If not in cache, fall back to 1000-block search
4. If still not found as TX, try as block hash (smart fallback)

**Benefits**:
- Instant lookups for recently viewed transactions
- Works for transactions beyond the 1000-block window if they're in cache
- Reduces RPC load significantly

**Code**:
```typescript
// OPTIMIZATION: First check TanStack Query cache for this transaction
const cachedTransactions = queryClient.getQueryData<Transaction[]>(nearKeys.recentTransactions());
const cachedTx = cachedTransactions?.find(tx => tx.hash === txHash);

if (cachedTx) {
  console.log(`[TxDetail] Found transaction in cache with signer_id: ${cachedTx.signer_id}`);
  const txData = await nearRpc.getTransactionByHash(txHash, cachedTx.signer_id);
  setTransaction(txData);
  return;
}

// Fall back to block search if not in cache
const txData = await nearRpc.getTransactionByHash(txHash);
```

### 2. Increased Block Search Depth (lib/nearRpc.ts, lib/nearRpcFailover.ts)

**Problem**: 100-block search only covered ~1 minute of history (at 600ms/block).

**Solution**: Increased to 1000 blocks (~10 minutes of history).

**Files Modified**:
- `lib/nearRpc.ts` - Changed from 100 to 1000 blocks
- `lib/nearRpcFailover.ts` - Changed from 100 to 1000 blocks
- Updated error messages to reflect "1000 blocks"

**Code Change**:
```typescript
const startHeight = Math.max(0, latestBlock.header.height - 1000); // Search last 1000 blocks (~10 min at 600ms/block)
```

### 3. Smart Hash Detection (pages/Home.tsx)

**Problem**: Both transaction hashes and block hashes are base58-encoded ~44 character strings, making them indistinguishable by format alone.

**Solution**: 
- Default to treating 40+ char hashes as transaction hashes (most common use case)
- TransactionDetail page tries as TX first, then automatically redirects if it's actually a block hash

**Code**:
```typescript
// For alphanumeric strings (40+ chars), default to transaction hash
// Note: Both TX hashes and block hashes are base58-encoded and ~44 chars
// The /tx/ page will intelligently try as block hash if TX lookup fails
if (query.length >= 40 && /^[A-Za-z0-9]+$/.test(query)) {
  setLocation(`/tx/${query}`);
  return;
}
```

### 4. Block Hash Fallback (pages/TransactionDetail.tsx)

**Solution**: If transaction lookup fails, automatically try fetching as a block hash and redirect:

```typescript
try {
  const txData = await nearRpc.getTransactionByHash(txHash);
  setTransaction(txData);
  return;
} catch (txError) {
  // If not found as transaction, maybe it's actually a block hash
  try {
    await nearRpc.getBlock(txHash);
    // It was a block hash! Redirect to block view
    window.location.href = `/block/${txHash}`;
    return;
  } catch (blockError) {
    // Neither worked - show the original transaction error
    throw txError;
  }
}
```

## Performance Impact

### Before
- TX search: 100 block fetches + chunk fetches = ~900 RPC calls (worst case)
- No cache utilization
- Failed for transactions > 100 blocks old

### After
- Cache hit: 1 RPC call (EXPERIMENTAL_tx_status with known signer_id)
- Cache miss: Up to 1000 block fetches (but usually much fewer)
- Works for ANY transaction that was previously loaded, regardless of age

## Cache Strategy

Transactions are cached by the TransactionList page:
- Location: `nearKeys.recentTransactions()` in TanStack Query
- Size: Last 200 transactions (prevents memory bloat)
- Persistence: 10 minutes (configurable in App.tsx)
- Automatic: Continuously updated as new blocks arrive

## User Experience Improvements

1. **Faster Searches**: Cache-first lookup provides instant results for viewed transactions
2. **Longer History**: 10 minutes vs 1 minute search window
3. **Smart Routing**: Paste any hash and it routes correctly (TX or block)
4. **Better Errors**: Updated error messages explain cache behavior
5. **Helpful Tips**: Error page suggests visiting /transactions to populate cache

## Testing

To test the improvements:

1. **Cache Test**:
   - Visit `/transactions` and let it load
   - Copy a transaction hash from the list
   - Paste it in search - should be instant (cache hit)

2. **Block Search Test**:
   - Search for a transaction that's 100-500 blocks old
   - Should now work (previously would have failed)

3. **Hash Ambiguity Test**:
   - Search with a block hash
   - Should redirect to block detail page
   - Search with a TX hash
   - Should show transaction details

## Future Enhancements

1. **Cache Persistence**: Use sessionStorage to persist cache across page reloads
2. **Loading Progress**: Show progress during 1000-block search
3. **Configurable Search Depth**: Allow users to configure search depth in settings
4. **Better Cache Management**: Implement LRU cache with configurable size limits

## Related Files
- `pages/TransactionDetail.tsx` - Main transaction detail page with cache lookup
- `lib/nearRpc.ts` - RPC client with 1000-block search
- `lib/nearRpcFailover.ts` - Failover RPC client with 1000-block search
- `pages/Home.tsx` - Search bar with smart hash detection
- `pages/TransactionList.tsx` - Populates transaction cache
- `lib/nearQueries.ts` - TanStack Query key factories

## Notes

- The cache-first approach is especially valuable for localnet/testnet where transactions are frequently re-queried
- 1000-block search is safe for localnet (no rate limits) but may hit rate limits on public RPCs
- Consider reducing search depth for mainnet if using public RPC endpoints

