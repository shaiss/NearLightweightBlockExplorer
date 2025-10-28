# Transaction Search - Improved Implementation

## Overview
The transaction search has been significantly improved to work seamlessly without requiring the user to manually enter a sender account ID.

## How It Works Now

### Automatic Transaction Discovery
When you search for a transaction hash, the explorer now:

1. **Automatically searches through the last 100 blocks** to find the transaction
2. **Extracts the sender account ID** from the chunk data
3. **Fetches complete transaction details** using the discovered account ID
4. **Displays the full transaction** with status, actions, logs, etc.

### Code Implementation
```typescript
async getTransactionByHash(txHash: string, accountId?: string): Promise<any> {
  // If account ID is provided, use it directly
  if (accountId) {
    return this.call('EXPERIMENTAL_tx_status', [txHash, accountId]);
  }
  
  // Otherwise, search through recent blocks to find the transaction
  const latestBlock = await this.getLatestBlock();
  const startHeight = Math.max(0, latestBlock.header.height - 100);
  
  // Search backwards through blocks
  for (let height = latestBlock.header.height; height >= startHeight; height--) {
    const block = await this.getBlock(height);
    
    // Check each chunk for the transaction
    for (const chunk of block.chunks) {
      const chunkData = await this.getChunk(chunk.chunk_hash);
      
      if (chunkData.transactions) {
        for (const tx of chunkData.transactions) {
          if (tx.hash === txHash) {
            // Found it! Fetch full details
            return await this.call('EXPERIMENTAL_tx_status', [txHash, tx.signer_id]);
          }
        }
      }
    }
  }
  
  throw new Error('Transaction not found in the last 100 blocks');
}
```

## Why This Approach?

### Without an Indexer
- NearBlocks uses an indexer that pre-indexes all transactions by hash
- This lightweight explorer uses only RPC calls (no indexer required)
- By searching through recent blocks, we can find transactions without needing an indexer

### Perfect for Localnet
This approach is ideal for localnet because:
- **Few transactions**: Localnet typically has very few transactions
- **Recent activity**: Transactions you're testing are almost always in the last 100 blocks
- **No rate limits**: Local RPC endpoints don't have rate limits
- **No infrastructure**: No need to run an indexer for development

### Works on Mainnet/Testnet Too
While designed for localnet, it also works on mainnet/testnet for:
- Recent transactions (within last 100 blocks)
- Development and testing scenarios
- When you don't have access to an indexer

## Usage Example

### From the UI
1. Open the explorer at `http://localhost:3000`
2. Enter a transaction hash in the search box (e.g., from your localnet testing)
3. Click "Search"
4. The explorer automatically finds and displays the transaction

### Example Flow
```
User enters: 7z57ZkZEp4vJmr2NjazvVXFyFWPunWAPQPypkhRCHyF5
↓
Explorer searches last 100 blocks
↓
Finds transaction in block #220652769
↓
Extracts signer_id: "alice.testnet"
↓
Fetches full transaction details
↓
Displays complete transaction info
```

## Performance Considerations

### Speed
- Searches backwards from latest block
- Stops as soon as transaction is found
- Most recent transactions found very quickly

### RPC Calls
- Maximum: 100 block calls + 100×9 chunk calls = ~1000 RPC calls (worst case)
- Typical: 1-5 block calls (for recent transactions)
- Localnet: No rate limits, so even worst case is fast

### Optimization
The search is optimized by:
- Searching backwards (newer blocks first)
- Skipping failed chunk fetches
- Early exit when transaction is found

## Limitations

### 100 Block Window
- Only searches the last 100 blocks
- Older transactions will not be found
- For historical data, use an indexer-based explorer like NearBlocks

### Error Message
If transaction is not in the last 100 blocks:
```
Transaction {hash} not found in the last 100 blocks.
For older transactions, you may need to provide the sender account ID,
or use a block explorer with indexer support.
```

## Comparison: Before vs After

### Before (Required Manual Input)
```
1. User enters transaction hash
2. App asks for sender account ID
3. User has to look up sender elsewhere
4. User enters sender account ID
5. App fetches transaction
```

### After (Automatic)
```
1. User enters transaction hash
2. App automatically finds transaction
3. App displays transaction
```

## Files Modified
1. `/lib/nearRpc.ts` - Updated `getTransactionByHash()` with automatic search
2. `/lib/nearRpcFailover.ts` - Updated `getTransactionByHash()` with automatic search
3. `/pages/TransactionDetail.tsx` - Simplified UI, removed account ID input form

## Testing

### For Localnet
1. Start your NEAR localnet node
2. Switch explorer to localnet network
3. Create a transaction (e.g., deploy a contract, call a function)
4. Copy the transaction hash from the logs
5. Search for it in the explorer
6. ✅ Transaction displays automatically

### For Testnet/Mainnet
1. Find a recent transaction (last ~100 blocks)
2. Copy the transaction hash
3. Search for it in the explorer
4. ✅ Transaction displays automatically

**Note**: Testnet may have rate limits. For production use, consider:
- Running your own RPC node
- Using multiple provider endpoints with failover (already implemented)
- Implementing request caching

## Future Enhancements

### Optional Account ID Input
Could add an optional "Advanced" section:
- Input field for account ID (for old transactions)
- Checkbox to skip block search
- Direct lookup when account ID is known

### Configurable Search Depth
Add setting to configure how many blocks to search:
- Default: 100 blocks
- Localnet: Could be 1000+ (fast, no rate limits)
- Mainnet: Keep at 100 or less (rate limits)

### Search Progress Indicator
Show progress during search:
- "Searching block 220652769..."
- "Scanned 10 blocks..."
- Progress bar for long searches

### Caching
Cache found transactions:
- Store in localStorage
- Avoid repeated searches
- Clear on network change

## Conclusion

The transaction search now works seamlessly for the primary use case (localnet development) without requiring users to manually look up and enter sender account IDs. This matches the user experience of NearBlocks while maintaining the lightweight, RPC-only architecture of this explorer.

