# NEAR Localnet Explorer - Lean Indexer Architecture

## Core Question: Do You Even Need an Indexer?

For a **localnet explorer focused on development**, let's break down what you actually need:

### What RPC Can Do (No Indexer Needed)
✅ Get latest blocks  
✅ Get block by height or hash  
✅ Get transaction status by hash  
✅ Get account state  
✅ Get chunk details  
✅ Query contract state  

### What Requires an Indexer (Historical Queries)
❌ "Show me all transactions for account X"  
❌ "List all FT transfers in the last hour"  
❌ "Find all transactions that called method Y"  
❌ "Show transaction history for this contract"  
❌ "Search transactions by any field other than hash"  

**The key question**: Do developers using your localnet explorer need to search historical data, or just inspect recent blocks/transactions?

---

## Decision Tree

```
Do you need to search historical transactions by account/method/etc?
│
├─ NO → Use RPC-only explorer (what you built already!)
│        - Zero infrastructure
│        - Just query RPC directly
│        - Perfect for development
│
└─ YES → Need minimal indexer
         - Simple database
         - Background process to index blocks
         - Enables historical queries
```

---

## Minimal Localnet Indexer Architecture

If you **do** need historical queries, here's the **leanest possible setup**:

```
┌─────────────────────────────────────────────────┐
│  NEAR Localnet Node                             │
│  http://localhost:3030                          │
└────────────────┬────────────────────────────────┘
                 │
                 │ Poll for new blocks
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Simple Indexer Process                         │
│  (Python/Node.js script)                        │
│  - Polls RPC every 1-2 seconds                  │
│  - Extracts blocks, txs, receipts               │
│  - Writes to database                           │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  SQLite or PostgreSQL (Docker)                  │
│  - Stores blocks, transactions, receipts        │
│  - Enables historical queries                   │
└─────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Your Explorer Web App                          │
│  - Queries database for history                 │
│  - Queries RPC for real-time data               │
└─────────────────────────────────────────────────┘
```

**Total Infrastructure**: 
- 1 database (SQLite file or PostgreSQL container)
- 1 background script (50-100 lines of code)
- Your existing explorer web app

---

## Option 1: SQLite (Simplest)

### Why SQLite?
- **Zero setup**: Just a file on disk
- **Zero cost**: Free, no server needed
- **Perfect for localnet**: Handles thousands of transactions easily
- **Easy backup**: Copy the .db file
- **Portable**: Works on any OS

### Limitations
- Single writer (fine for one indexer process)
- Not suitable for production/mainnet
- Max ~1M transactions before performance degrades

### Schema Example

```sql
CREATE TABLE blocks (
    block_height INTEGER PRIMARY KEY,
    block_hash TEXT NOT NULL,
    prev_hash TEXT,
    timestamp BIGINT,
    author TEXT,
    chunks_count INTEGER,
    gas_price TEXT,
    total_supply TEXT,
    raw_json TEXT  -- Store full block JSON for flexibility
);

CREATE TABLE transactions (
    tx_hash TEXT PRIMARY KEY,
    block_height INTEGER,
    signer_id TEXT,
    receiver_id TEXT,
    status TEXT,  -- 'success' or 'failure'
    timestamp BIGINT,
    actions_json TEXT,  -- JSON array of actions
    FOREIGN KEY (block_height) REFERENCES blocks(block_height)
);

CREATE INDEX idx_tx_signer ON transactions(signer_id, timestamp);
CREATE INDEX idx_tx_receiver ON transactions(receiver_id, timestamp);
CREATE INDEX idx_tx_block ON transactions(block_height);

CREATE TABLE receipts (
    receipt_id TEXT PRIMARY KEY,
    tx_hash TEXT,
    block_height INTEGER,
    predecessor_id TEXT,
    receiver_id TEXT,
    status TEXT,
    actions_json TEXT,
    FOREIGN KEY (tx_hash) REFERENCES transactions(tx_hash)
);

CREATE INDEX idx_receipt_predecessor ON receipts(predecessor_id);
CREATE INDEX idx_receipt_receiver ON receipts(receiver_id);
```

### Simple Indexer Script (Python)

```python
import sqlite3
import requests
import time
import json

RPC_URL = "http://localhost:3030"
DB_FILE = "near_localnet.db"

def rpc_call(method, params):
    response = requests.post(RPC_URL, json={
        "jsonrpc": "2.0",
        "id": "dontcare",
        "method": method,
        "params": params
    })
    return response.json()["result"]

def get_latest_block_height():
    status = rpc_call("status", [])
    return status["sync_info"]["latest_block_height"]

def get_block(height):
    return rpc_call("block", {"block_id": height})

def index_block(conn, block):
    cursor = conn.cursor()
    
    # Insert block
    cursor.execute("""
        INSERT OR IGNORE INTO blocks 
        (block_height, block_hash, prev_hash, timestamp, author, chunks_count, raw_json)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        block["header"]["height"],
        block["header"]["hash"],
        block["header"]["prev_hash"],
        block["header"]["timestamp"],
        block["author"],
        len(block["header"]["chunks_included"]),
        json.dumps(block)
    ))
    
    # Index chunks to get transactions
    for chunk in block["chunks"]:
        chunk_data = rpc_call("chunk", {"chunk_id": chunk["chunk_hash"]})
        
        for tx in chunk_data.get("transactions", []):
            cursor.execute("""
                INSERT OR IGNORE INTO transactions
                (tx_hash, block_height, signer_id, receiver_id, timestamp, actions_json)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                tx["hash"],
                block["header"]["height"],
                tx["signer_id"],
                tx["receiver_id"],
                block["header"]["timestamp"],
                json.dumps(tx["actions"])
            ))
    
    conn.commit()

def main():
    # Initialize database
    conn = sqlite3.connect(DB_FILE)
    # Create tables (schema from above)
    
    last_indexed_height = 0
    
    while True:
        try:
            latest_height = get_latest_block_height()
            
            # Index new blocks
            for height in range(last_indexed_height + 1, latest_height + 1):
                block = get_block(height)
                index_block(conn, block)
                print(f"Indexed block {height}")
                last_indexed_height = height
            
            time.sleep(2)  # Poll every 2 seconds
            
        except Exception as e:
            print(f"Error: {e}")
            time.sleep(5)

if __name__ == "__main__":
    main()
```

**That's it!** ~80 lines of Python, SQLite database, done.

---

## Option 2: PostgreSQL (Docker)

### Why PostgreSQL?
- More robust than SQLite
- Better for concurrent reads/writes
- JSON/JSONB support for flexible queries
- Can scale to production if needed later

### Setup

```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: near_localnet
      POSTGRES_USER: indexer
      POSTGRES_PASSWORD: dev_password
    ports:
      - "5432:5432"
    volumes:
      - ./postgres_data:/var/lib/postgresql/data
```

```bash
docker-compose up -d
```

### Same Schema, Same Indexer Script
Just change SQLite to PostgreSQL connection:

```python
import psycopg2

conn = psycopg2.connect(
    dbname="near_localnet",
    user="indexer",
    password="dev_password",
    host="localhost"
)
```

---

## AWS Indexer Example: Overkill for Localnet?

**YES, it's complete overkill.** Here's why:

### AWS Sample Indexer Uses:
- **MSK (Kafka)**: For high-throughput message streaming
  - Localnet: ~1-10 blocks/sec, doesn't need Kafka
  - Cost: $400+/month
  
- **Apache Flink**: For complex stream processing
  - Localnet: Simple sequential processing is fine
  - Cost: $80+/month
  
- **RDS**: Managed database
  - Localnet: SQLite or local PostgreSQL is fine
  - Cost: $60+/month

- **Multiple EC2 instances**: For scaling
  - Localnet: Single script is enough
  - Cost: $50+/month per instance

**Total AWS cost**: $600+/month for something you can do with a 100-line script and SQLite.

### When to Use AWS Indexer Pattern:
- ✅ Mainnet/Testnet with millions of transactions
- ✅ Multiple consumers need the same data
- ✅ Need high availability and fault tolerance
- ✅ Production blockchain explorer
- ❌ **NOT for localnet development**

---

## Recommended Approach for Your Localnet Explorer

### Phase 1: RPC-Only (Current)
Keep what you built - it's perfect for:
- Viewing recent blocks
- Inspecting specific transactions (if you have the hash)
- Checking account states
- Real-time monitoring

**No indexer needed yet.**

### Phase 2: Add Minimal Indexer (If Needed)
Only add if developers need:
- "Show all my transactions"
- "Search by contract method"
- "Transaction history for account X"

**Implementation**:
1. SQLite database (single file)
2. Simple Python/Node.js script (100 lines)
3. Runs in background, polls RPC
4. Stores blocks, transactions, receipts
5. Your web app queries SQLite for history

**Total effort**: 2-4 hours to build
**Infrastructure**: 1 SQLite file
**Cost**: $0

### Phase 3: Upgrade to PostgreSQL (Optional)
If you want:
- Better performance
- Multiple developers querying simultaneously
- Practice for production setup

**Implementation**:
1. Docker Compose with PostgreSQL
2. Same indexer script, different connection
3. More robust, still local

**Total effort**: +1 hour
**Infrastructure**: 1 Docker container
**Cost**: $0

---

## Comparison Table

| Approach | Complexity | Cost | Use Case |
|----------|------------|------|----------|
| **RPC-only** | Minimal | $0 | View recent blocks, no history search |
| **SQLite indexer** | Low | $0 | Local dev, search history, <100K txs |
| **PostgreSQL (Docker)** | Medium | $0 | Local dev, better performance, practice |
| **AWS minimal** | High | $135/mo | Small production deployment |
| **AWS full stack** | Very High | $1,250/mo | Production mainnet explorer |

---

## My Recommendation

**For your localnet explorer:**

1. **Keep the RPC-only explorer you built** ✅
   - It's perfect for development
   - Zero infrastructure
   - Fast and simple

2. **Add a minimal SQLite indexer only if you need historical queries**
   - 100-line Python script
   - SQLite database file
   - Runs in background
   - Enables "show all transactions for account X" type queries

3. **Skip AWS entirely for localnet**
   - Way too complex
   - Unnecessary cost
   - Designed for production scale

4. **Document the upgrade path**
   - Show developers how to add the indexer if they need it
   - Provide the simple Python script as an optional add-on
   - Keep the core explorer lean

---

## Sample Implementation Plan

### Week 1: Core Explorer (Done!)
✅ RPC-based block viewer  
✅ Block detail page  
✅ Search by height/hash  
✅ Account lookup  

### Week 2: Optional Indexer (If needed)
- [ ] Create SQLite schema
- [ ] Write simple indexer script (Python/Node.js)
- [ ] Add "Transaction History" page to explorer
- [ ] Add "Search by Account" feature
- [ ] Document setup in README

### Week 3: Polish
- [ ] Add filters (date range, status, etc.)
- [ ] Optimize queries with indexes
- [ ] Add data export (CSV/JSON)
- [ ] Write developer guide

---

## Code Snippet: Add to Your Explorer

If you add the indexer, your existing web app just needs to query SQLite:

```typescript
// client/src/lib/indexerDb.ts
import Database from 'better-sqlite3';

const db = new Database('near_localnet.db', { readonly: true });

export function getTransactionsByAccount(accountId: string, limit = 50) {
  return db.prepare(`
    SELECT * FROM transactions 
    WHERE signer_id = ? OR receiver_id = ?
    ORDER BY timestamp DESC 
    LIMIT ?
  `).all(accountId, accountId, limit);
}

export function searchTransactions(query: string) {
  return db.prepare(`
    SELECT * FROM transactions 
    WHERE signer_id LIKE ? OR receiver_id LIKE ? OR tx_hash LIKE ?
    ORDER BY timestamp DESC 
    LIMIT 100
  `).all(`%${query}%`, `%${query}%`, `%${query}%`);
}
```

---

## Bottom Line

**For NEAR localnet development:**
- ✅ **Your current RPC-only explorer is perfect**
- ✅ **Add SQLite indexer only if you need historical queries**
- ❌ **Don't use AWS architecture - it's for production mainnet**
- ✅ **Keep it lean, simple, and focused on development**

The beauty of your approach is that developers can start with zero infrastructure (RPC-only), then optionally add the indexer (SQLite + simple script) if they need historical queries. No cloud, no complexity, no cost.

