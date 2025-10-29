# AWS Localnet Analysis - Block Production Observations

## Your Questions Answered

### Q1: Why only node0 and node3? Where are node1 and node2?

**Answer:** In your AWS Localnet configuration, only **node0** and **node3** are configured as validators.

This is a **valid localnet configuration**. Possible reasons:
1. **2-Validator Setup**: Your localnet was configured with only 2 validators for faster consensus
2. **Development Configuration**: Minimal validator set for testing
3. **Resource Optimization**: Fewer validators = less resource usage on AWS

### Q2: Is it 4 blocks per 600ms?

**Answer:** No, it's **4-5 blocks per 3 seconds** (the explorer's refresh interval).

**What's Actually Happening:**
- Your explorer polls every **3 seconds** for new blocks
- Between each poll, **4-5 new blocks** are produced
- **Math**: 5 blocks / 3 seconds = **~600ms per block**
- This is **faster than mainnet** (~1000ms per block)

**Why Faster on Localnet?**
- Fewer validators = faster consensus (only 2 validators vs 100+ on mainnet)
- Lower network latency (local/AWS network vs global internet)
- Configured for faster block times for development purposes

### Q3: Is each node a shard?

**Answer:** No! This is a common misconception. Let me clarify:

## NEAR Architecture Clarification

### ❌ Common Misconception
```
node0 = Shard 0
node1 = Shard 1  
node2 = Shard 2
node3 = Shard 3
```

### ✅ Actual NEAR Architecture

```
┌───────────────────────────────────────────────────────┐
│              NEAR Blockchain Network                   │
│                                                        │
│  Global Block Height: 1000 -> 1001 -> 1002 -> ...    │
│                                                        │
│  ┌─────────────────────────────────────────────┐     │
│  │         Each Block Contains:                 │     │
│  │                                              │     │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌───────┐│     │
│  │  │Chunk 0 │ │Chunk 1 │ │Chunk 2 │ │Chunk 3││     │
│  │  │(Shard0)│ │(Shard1)│ │(Shard2)│ │(Shard3)││     │
│  │  └────────┘ └────────┘ └────────┘ └───────┘│     │
│  └─────────────────────────────────────────────┘     │
│                                                        │
│  Validators (Rotate Block Production):                │
│  ┌──────┐  ┌──────┐                                  │
│  │node0 │  │node3 │                                  │
│  └──────┘  └──────┘                                  │
│      │        │                                       │
│      └────┬───┘                                       │
│           │                                           │
│    Each produces blocks AND                          │
│    chunks for ALL shards                             │
└───────────────────────────────────────────────────────┘
```

### Key Points:

1. **Block Height is Global**
   - One blockchain, one sequential block height
   - Increments by 1 for each block
   - All validators agree on this single chain

2. **Shards are Logical Partitions**
   - Shards divide the STATE (accounts, contracts, data)
   - Each shard processes different accounts/contracts
   - Number of shards is a protocol configuration (typically 4)

3. **Validators Produce for Multiple Shards**
   - Each validator can produce chunks for any shard
   - The protocol assigns validators to shards dynamically
   - Validators rotate producing blocks

4. **What You See in Your Localnet**
   - 2 active validators: node0 and node3
   - They alternate producing blocks
   - Each block they produce contains chunks from all 4 shards
   - Block height increments by 1 per block (not per shard!)

## Your Localnet Configuration

Based on your observations:

```yaml
Network: AWS Localnet
RPC Endpoint: http://54.90.246.254:3030
Active Validators: 2 (node0, node3)
Number of Shards: 4 (likely)
Block Production Rate: ~600-750ms per block
Consensus: Faster than mainnet due to fewer validators
```

## Validator Rotation Example

Here's what happens over a few blocks:

```
Block 1000: Produced by node0 (contains chunks from all shards)
Block 1001: Produced by node3 (contains chunks from all shards)
Block 1002: Produced by node0 (contains chunks from all shards)
Block 1003: Produced by node3 (contains chunks from all shards)
...
```

## Explorer Enhancements

I've enhanced your block cards to **color-code validators**:
- Each validator gets a unique, consistent color
- This makes it easy to visually see the rotation between node0 and node3
- Hover over the validator name to see the full address

## Verifying Your Configuration

To see detailed validator info from your localnet:

```bash
# Get current validators
curl -X POST http://54.90.246.254:3030 \
  -H 'Content-Type: application/json' \
  -d '{
    "jsonrpc": "2.0",
    "id": "dontcare",
    "method": "validators",
    "params": [null]
  }' | jq '.result.current_validators'
```

This will show:
- All active validators
- Their stake
- Number of blocks produced
- Expected blocks per epoch

## Summary

✅ **Your localnet is working correctly!**

- 2 validators (node0, node3) is a valid configuration
- ~600ms block time is normal for a localnet with few validators
- Block height increments by 1 per block, not per shard
- Each validator produces complete blocks containing chunks from all shards
- The absence of node1 and node2 simply means they weren't configured as validators

The 4-5 blocks you see per refresh is because your explorer polls every 3 seconds, and your localnet produces blocks every ~600-750ms.

