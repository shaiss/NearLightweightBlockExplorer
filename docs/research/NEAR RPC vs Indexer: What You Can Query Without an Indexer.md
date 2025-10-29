# NEAR RPC vs Indexer: What You Can Query Without an Indexer

## TL;DR: You're Right!

**YES, you can query account data and contract state directly from NEAR RPC without an indexer!**

The confusion is about **what type of queries** you need:
- ✅ **Point queries** (specific account, specific block) → RPC can do this
- ❌ **Search queries** (all transactions for account X) → Needs indexer

---

## What NEAR RPC Can Do (No Indexer Needed)

### 1. **Account Information** ✅

**Query**: `view_account`

Get complete account details for any account:
- Balance (liquid + locked)
- Storage usage
- Code hash (if contract deployed)
- Block height of last state change

**Example**:
```json
{
  "method": "query",
  "params": {
    "request_type": "view_account",
    "finality": "final",
    "account_id": "alice.near"
  }
}
```

**Response**:
```json
{
  "amount": "100000000000000000000000000",  // Balance in yoctoNEAR
  "locked": "0",
  "code_hash": "11111111111111111111111111111111",
  "storage_usage": 182,
  "storage_paid_at": 0,
  "block_height": 17795474,
  "block_hash": "..."
}
```

**Use in your explorer**: Account detail page showing current balance, storage, etc.

---

### 2. **Contract State** ✅

**Query**: `view_state`

Get **all key-value pairs** stored in a contract's state:
- Can filter by key prefix
- Returns entire state if prefix is empty
- Data is base64 encoded

**Example**:
```json
{
  "method": "query",
  "params": {
    "request_type": "view_state",
    "finality": "final",
    "account_id": "my-contract.near",
    "prefix_base64": ""  // Empty = return all state
  }
}
```

**Response**:
```json
{
  "values": [
    {
      "key": "U1RBVEU=",  // base64 encoded
      "value": "AQ==",
      "proof": []
    }
  ],
  "block_height": 17795474,
  "block_hash": "..."
}
```

**Use in your explorer**: 
- Contract state viewer
- Show all storage keys/values
- Inspect contract data at specific block height

---

### 3. **Call Contract View Methods** ✅

**Query**: `call_function`

Execute **read-only contract methods** (view functions):
- No gas cost (read-only)
- Can pass arguments
- Returns result immediately

**Example**:
```json
{
  "method": "query",
  "params": {
    "request_type": "call_function",
    "finality": "final",
    "account_id": "token.near",
    "method_name": "ft_balance_of",
    "args_base64": "eyJhY2NvdW50X2lkIjoiYWxpY2UubmVhciJ9"  // {"account_id":"alice.near"}
  }
}
```

**Response**:
```json
{
  "result": [34, 49, 48, 48, 48, 48, 48, 48, 48, 48, 48, 34],  // "1000000000" in bytes
  "logs": [],
  "block_height": 17795474,
  "block_hash": "..."
}
```

**Use in your explorer**:
- Query FT/NFT balances for any account
- Call custom contract view methods
- Display contract-specific data (leaderboards, stats, etc.)

---

### 4. **Contract Code** ✅

**Query**: `view_code`

Get the deployed WASM bytecode for a contract:
- Returns base64 encoded WASM
- Can verify contract deployment
- Check code hash

**Example**:
```json
{
  "method": "query",
  "params": {
    "request_type": "view_code",
    "finality": "final",
    "account_id": "my-contract.near"
  }
}
```

**Use in your explorer**:
- Verify contract deployment
- Show code hash
- Download WASM for inspection

---

### 5. **Blocks and Chunks** ✅

**Queries**: `block`, `chunk`

Get complete block/chunk data:
- Block by height or hash
- All transactions in block
- All receipts in chunk
- Block metadata

**Example**:
```json
{
  "method": "block",
  "params": {
    "block_id": 123456
  }
}
```

**Use in your explorer**: (You already have this!)
- Block viewer
- Transaction list in block
- Chunk details

---

### 6. **Transaction Status** ✅

**Query**: `tx` or `EXPERIMENTAL_tx_status`

Get transaction details **if you have the transaction hash**:
- Transaction status (success/failure)
- Receipts generated
- Execution outcomes
- Logs

**Example**:
```json
{
  "method": "tx",
  "params": {
    "tx_hash": "BvJeW6gnFjkCBKCsRNEBrRLDQCFZNxLAi6uXzmLaV...",
    "sender_account_id": "alice.near"
  }
}
```

**Use in your explorer**:
- Transaction detail page (if you have the hash)
- Show execution outcome
- Display logs and receipts

---

### 7. **Account Changes** ✅

**Query**: `view_account_changes`

Track account state changes **at specific blocks**:
- Balance changes
- Storage changes
- Code deployments

**Example**:
```json
{
  "method": "changes",
  "params": {
    "changes_type": "account_changes",
    "account_ids": ["alice.near"],
    "block_id": 123456
  }
}
```

**Use in your explorer**:
- Show account state at specific block
- Track balance changes over time (if you know the blocks)

---

## What RPC CANNOT Do (Needs Indexer)

### ❌ Search/List Queries

**Cannot do**:
- "Show all transactions for account alice.near"
- "List all FT transfers in the last hour"
- "Find transactions that called method `transfer`"
- "Show transaction history for this contract"
- "Search transactions by receiver"

**Why**: RPC requires you to know the **specific transaction hash** or **block number**. It can't search across all historical data.

### ❌ Aggregations

**Cannot do**:
- "Total transaction volume for alice.near"
- "Count of transactions per day"
- "Top 10 most active accounts"
- "Average gas used per transaction"

**Why**: RPC returns raw data for specific queries, not aggregated statistics.

### ❌ Full-Text Search

**Cannot do**:
- "Search for transactions containing text X"
- "Find all contracts with method Y"
- "Search logs for error messages"

**Why**: RPC doesn't index text content.

---

## What Your Localnet Explorer Can Do (RPC-Only)

### ✅ Without Indexer

1. **Block Explorer**
   - View latest blocks (poll RPC)
   - View specific block by height/hash
   - See all transactions in a block

2. **Account Viewer**
   - Look up any account by ID
   - Show current balance, storage, code hash
   - Display account state at specific block

3. **Contract Inspector**
   - View contract state (all key-value pairs)
   - Call contract view methods
   - Query FT/NFT balances
   - Show contract code hash

4. **Transaction Viewer** (if you have the hash)
   - Show transaction details
   - Display execution outcome
   - Show receipts and logs

5. **Real-time Monitoring**
   - Latest blocks feed
   - Network status
   - Block production rate

### ❌ Requires Indexer

1. **Account Transaction History**
   - "Show all transactions for alice.near"
   - "List all transfers sent by this account"

2. **Contract Activity History**
   - "Show all calls to this contract"
   - "List all FT transfers for this token"

3. **Search Functionality**
   - "Find transactions by receiver"
   - "Search by method name"

4. **Analytics**
   - Transaction volume charts
   - Most active accounts
   - Gas usage statistics

---

## Recommended Features for Your Localnet Explorer

### Phase 1: RPC-Only (Recommended Start)

**Core Features**:
1. ✅ Block list (latest N blocks)
2. ✅ Block detail (by height/hash)
3. ✅ Account lookup (by account ID)
   - Show balance, storage, code hash
   - Display contract state if applicable
4. ✅ Contract state viewer
   - Show all key-value pairs
   - Decode common formats (JSON, numbers)
5. ✅ Contract view method caller
   - Input: account_id, method_name, args
   - Output: method result
6. ✅ Transaction viewer (by hash)
   - Show status, receipts, logs

**This covers 90% of localnet development needs!**

### Phase 2: Add Indexer (Optional)

**Only if developers need**:
1. ❌ Account transaction history
2. ❌ Contract call history
3. ❌ Search by sender/receiver
4. ❌ Analytics/charts

**Implementation**: Simple SQLite + background script (as discussed earlier)

---

## Example: Enhanced Account Page (RPC-Only)

Your explorer can show rich account data without an indexer:

```typescript
// Fetch account info
const accountInfo = await nearRpc.query({
  request_type: "view_account",
  finality: "final",
  account_id: "alice.near"
});

// If it's a contract, get state
const contractState = await nearRpc.query({
  request_type: "view_state",
  finality: "final",
  account_id: "alice.near",
  prefix_base64: ""
});

// If it's an FT contract, call view methods
const totalSupply = await nearRpc.query({
  request_type: "call_function",
  finality: "final",
  account_id: "token.near",
  method_name: "ft_total_supply",
  args_base64: ""
});

// Display:
// - Balance: 100 NEAR
// - Storage: 1.2 KB
// - Contract State: 15 keys
// - Total Supply: 1,000,000 tokens (if FT contract)
```

---

## Example: Contract Inspector (RPC-Only)

```typescript
// Get all contract state
const state = await nearRpc.query({
  request_type: "view_state",
  finality: "final",
  account_id: "my-contract.near",
  prefix_base64: ""
});

// Decode and display
state.values.forEach(({ key, value }) => {
  const decodedKey = atob(key);  // Decode base64
  const decodedValue = atob(value);
  
  console.log(`${decodedKey}: ${decodedValue}`);
});

// Also call common view methods
const methods = ["get_owner", "get_total_supply", "get_metadata"];
for (const method of methods) {
  try {
    const result = await nearRpc.query({
      request_type: "call_function",
      account_id: "my-contract.near",
      method_name: method,
      args_base64: ""
    });
    console.log(`${method}:`, result);
  } catch (e) {
    // Method doesn't exist, skip
  }
}
```

---

## When Do You Actually Need an Indexer?

### Scenario 1: Developer Testing (No Indexer)
Developer deploys contract, calls methods, checks state:
- ✅ View contract state: RPC
- ✅ Call view methods: RPC
- ✅ Check account balance: RPC
- ✅ Inspect recent transactions (in blocks): RPC

**No indexer needed!**

### Scenario 2: Debugging Transaction History (Needs Indexer)
Developer wants to see all transactions their account sent:
- ❌ "Show all my transactions": Needs indexer
- ❌ "Filter by method name": Needs indexer
- ❌ "Search by receiver": Needs indexer

**Indexer required.**

### Scenario 3: Contract Analytics (Needs Indexer)
Developer wants to analyze contract usage:
- ❌ "How many times was method X called?": Needs indexer
- ❌ "Who are the top users?": Needs indexer
- ❌ "Transaction volume over time": Needs indexer

**Indexer required.**

---

## My Updated Recommendation

### For Your Localnet Explorer:

**Start with RPC-only** and add these features:

1. ✅ **Account Viewer** (Enhanced)
   - Account info (balance, storage, code hash)
   - Contract state viewer (all keys/values)
   - Contract view method caller (dynamic form)
   - FT/NFT balance checker

2. ✅ **Block Explorer** (You have this)
   - Latest blocks
   - Block details
   - Transactions in block

3. ✅ **Transaction Viewer** (By hash)
   - Transaction details
   - Execution outcome
   - Receipts and logs

4. ✅ **Contract Inspector**
   - View state
   - Call methods
   - Download code

**This gives developers everything they need for localnet development without an indexer!**

### Add Indexer Later (If Needed)

Only add if developers specifically request:
- Transaction history by account
- Search functionality
- Analytics/charts

**Implementation**: SQLite + simple background script (100 lines)

---

## Bottom Line

**You were right to question the indexer!**

For localnet development, developers primarily need:
- ✅ "What's the current state of account X?" → RPC
- ✅ "What's stored in this contract?" → RPC
- ✅ "What's the balance of this FT?" → RPC (view method)
- ✅ "What happened in block Y?" → RPC

They rarely need:
- ❌ "Show all my transactions" → Indexer
- ❌ "Search by method name" → Indexer

**Start RPC-only, add indexer only if developers ask for transaction history.**

