# NEAR Block Explorer Research for Localnet

## 1. Official NEAR Explorer (github.com/near/near-explorer)

**Status**: ⚠️ **ARCHIVED** on Sep 26, 2024 - Read-only

**Key Details**:
- Repository: https://github.com/near/near-explorer
- License: MIT and Apache-2.0
- Tech Stack: TypeScript 99%, Node.js
- Last active: September 2024

**Features**:
- Supports multiple networks: mainnet, testnet, shardnet, guildnet
- Docker-based setup available
- Node.js setup with hot reload
- Frontend + Backend architecture

**Setup Options**:
1. Docker: `npm run docker:up:mainnet` (or testnet/shardnet/guildnet)
2. Node.js: Backend + Frontend separate processes

**Issues**:
- Repository is archived (no longer maintained)
- 95 open issues
- No explicit localnet configuration mentioned in README
- Unclear if it can connect to custom localnet RPC

**Next Steps**: Check if there are forks or alternatives, and investigate localnet configuration options.

---



## 2. NearBlocks (github.com/Nearblocks/nearblocks)

**Status**: ✅ **ACTIVE** - Last commit 11 hours ago

**Key Details**:
- Repository: https://github.com/Nearblocks/nearblocks
- License: **Business Source License 1.1** (⚠️ Not fully open source - has usage restrictions)
- Tech Stack: TypeScript 97.2%, Turborepo monorepo
- Stars: 43, Forks: 28
- Very active development (948 commits, 114 branches)

**Architecture**:
- Modular design with multiple apps:
  - `api`: Serves indexed data
  - `backend`: Database migrations and cron jobs for stats
  - `indexer-base`: Near Lake indexer for blocks, receipts, transactions, accounts
  - `indexer-balance`: Secondary indexer for account balances
  - `indexer-events`: Secondary indexer for FT/NFT events
  - `bos-components`: BOS components
  - `explorer-selector`: BOS gateway

**Setup**:
- Docker Compose based
- Separate configurations for mainnet and testnet
- Multiple environment files for different modules
- Complex setup with multiple docker-compose files

**Issues for Localnet**:
- Only mainnet and testnet configurations provided
- No explicit localnet support mentioned
- License is BSL 1.1 (not fully open source - may have restrictions)
- Complex architecture may be overkill for localnet dev

---



## 3. NEAR API REST Server (github.com/near-examples/near-api-rest-server)

**Status**: ✅ Active (last commit 2 years ago)

**Key Details**:
- Repository: https://github.com/near-examples/near-api-rest-server
- License: Not specified (appears to be open)
- Tech Stack: JavaScript 90.2%, HTML 6.3%, CSS 3.5%
- Stars: 34, Forks: 12

**Functionality**:
- Simple REST API wrapper around NEAR RPC
- Provides endpoints for contract deployment, view/call methods
- Has web console for view/call requests
- Can query NEAR explorer database directly

**Key Features**:
- `/deploy` - Deploy smart contracts
- `/view` - View contract state (no gas)
- `/call` - Call contract methods (burns gas)
- `/init` - Initialize master account
- `/create_user` - Create sub-accounts
- `/balance` - Display account balance
- `/keypair` - Generate Ed25519 keypairs
- `/explorer` - Query explorer database

**Issues**:
- NOT a block explorer (just API wrapper)
- No UI for browsing blocks/transactions
- Primarily for contract interaction, not exploration
- Would need custom frontend built on top

---



## 4. Kurtosis NEAR Package

**Status**: Page not found (404 error)

**Note**: User mentioned they are NOT using Kurtosis because it's an outdated NEAR package. The documentation link is broken, confirming this is not a viable option.

---



## 5. NEAR Mini Explorer (github.com/mfornet/near-mini-explorer)

**Status**: ⚠️ Inactive (last commit 3 years ago)

**Key Details**:
- Repository: https://github.com/mfornet/near-mini-explorer
- License: Not specified
- Tech Stack: TypeScript 93.1%, React-based
- Stars: 1, Forks: 1
- Last activity: 3 years ago

**Concept**:
- Serverless NEAR explorer
- Uses IndexedDB for caching downloaded data
- Client-side only (no backend required)
- Fetches data directly from NEAR RPC

**Roadmap (incomplete)**:
- Host using web4.near.page
- Support multiple networks (mainnet, testnet)
- Add search/filter functionality
- Contract interaction page

**Issues**:
- Project appears abandoned (3 years inactive)
- Incomplete implementation
- No clear documentation on setup
- Unclear if it works with localnet
- Very minimal adoption (1 star)

---



## 6. Expedition Explorer (Ethereum-based)

**Status**: ✅ Active (for Ethereum)

**Key Details**:
- Repository: https://github.com/Altcoinchain/Expedition-Explorer
- License: Apache-2.0
- Tech Stack: TypeScript 98.4%, React-based
- Minimal block explorer for Ethereum Stack

**Key Features**:
- No database required
- Points at any remote RPC node
- Runtime configuration for endpoints
- Search by Block, Transaction, Address
- Charts and pagination
- Multi-language support

**Issues for NEAR**:
- Built specifically for EVM/Ethereum RPC
- Would require significant rewrite for NEAR RPC
- Different data structures and APIs
- Not a quick solution for NEAR localnet

---




## Analysis and Evaluation

### Official NEAR Explorer - Detailed Assessment

After examining the codebase, the official NEAR Explorer has the following requirements:

**Architecture**:
1. **Frontend**: Next.js/React application (port 3000)
2. **Backend**: Express/Node.js API server (port 10000)
3. **Database Dependencies**:
   - PostgreSQL (Indexer database) - stores blocks, transactions, receipts, accounts
   - PostgreSQL (Analytics database) - aggregated stats
   - PostgreSQL (Telemetry database) - validator telemetry
   - PostgreSQL (Indexer Activity database) - activity tracking

**Configuration for Localnet**:
The explorer DOES support localnet configuration:
- Default RPC URL: `http://localhost:3030`
- Default network name: `localnet`
- Can be configured via environment variables

**Critical Issue - Database Requirement**:
The explorer requires a NEAR Indexer database to function. This means:
1. You need to run `near-indexer-for-explorer` (now DEPRECATED)
2. OR use `near-lake-indexer` with appropriate database setup
3. The explorer cannot work with just RPC - it needs indexed blockchain data in PostgreSQL

**Why This is Complex for Localnet**:
- Setting up the indexer infrastructure is non-trivial
- The indexer needs to sync all blockchain data to PostgreSQL
- For localnet dev work, this is heavy infrastructure overhead
- The official indexer is deprecated, making setup even more difficult

---

### Best Options for NEAR Localnet Block Explorer

Given the research findings, here are the viable options ranked by practicality:

#### Option 1: Use Official NEAR Explorer (Despite Being Archived) ⭐ RECOMMENDED

**Pros**:
- Most complete feature set
- Officially built for NEAR
- Has localnet configuration built-in
- Well-documented architecture
- MIT/Apache-2.0 licensed (fully open source)

**Cons**:
- Repository archived (no active maintenance)
- Requires complex indexer setup
- Heavy infrastructure (PostgreSQL + Indexer)
- Deprecated indexer component

**Setup Complexity**: HIGH
**Maintenance**: None (archived)
**Best For**: If you need full explorer features and can handle the infrastructure

---

#### Option 2: Build a Minimal RPC-Only Explorer ⭐⭐ PRACTICAL ALTERNATIVE

**Approach**: Create a lightweight web UI that queries your localnet RPC directly

**Pros**:
- No database or indexer required
- Minimal infrastructure
- Can be customized for your specific needs
- Fast to set up

**Cons**:
- Limited to RPC capabilities (can't query historical data easily)
- Need to build it yourself (or adapt existing code)
- Less features than full explorer

**Implementation Options**:
1. Fork `near-mini-explorer` and update dependencies
2. Use Expedition Explorer as template and adapt for NEAR RPC
3. Build simple React app using `near-api-js`

**Setup Complexity**: MEDIUM
**Maintenance**: Self-maintained
**Best For**: Lightweight dev work where you just need to view recent blocks/transactions

---

#### Option 3: Use NEAR CLI for Basic Exploration ⭐⭐⭐ SIMPLEST

**Approach**: Use `near-cli` commands to query blockchain state

**Pros**:
- Zero setup (just install near-cli)
- Works immediately with localnet
- No infrastructure required

**Cons**:
- Command-line only (no web UI)
- Manual queries required
- Not a "block explorer" in traditional sense

**Setup Complexity**: MINIMAL
**Best For**: Quick checks during development

---


