# Localnet Diagnostics Guide

## Current Observations

- **RPC Endpoint**: http://54.90.246.254:3030
- **Validators Seen**: node0, node3
- **Block Production Rate**: 4-5 blocks per 3 seconds (~600-750ms per block)

## Understanding What You're Seeing

### Validator Configuration

To see all validators and their status, you can query:

```bash
# Get current validators
curl -X POST http://54.90.246.254:3030 \
  -H 'Content-Type: application/json' \
  -d '{
    "jsonrpc": "2.0",
    "id": "dontcare",
    "method": "validators",
    "params": [null]
  }' | jq
```

This will show:
- `current_validators`: Active validators producing blocks
- `next_validators`: Validators for the next epoch
- `current_proposals`: Validator proposals

### Block Production Info

```bash
# Get latest block details
curl -X POST http://54.90.246.254:3030 \
  -H 'Content-Type: application/json' \
  -d '{
    "jsonrpc": "2.0",
    "id": "dontcare",
    "method": "block",
    "params": {"finality": "final"}
  }' | jq '.result.author'
```

The `author` field shows which validator produced that block.

### Protocol Configuration

```bash
# Get protocol config (includes block production settings)
curl -X POST http://54.90.246.254:3030 \
  -H 'Content-Type: application/json' \
  -d '{
    "jsonrpc": "2.0",
    "id": "dontcare",
    "method": "EXPERIMENTAL_protocol_config",
    "params": {"finality": "final"}
  }' | jq
```

Look for:
- `min_block_production_delay`: Minimum time between blocks
- `max_block_production_delay`: Maximum time between blocks
- `num_block_producer_seats`: Number of validator seats
- `num_shards`: Number of shards in the network

## Typical Localnet Configurations

### 4 Validator Setup
- node0, node1, node2, node3
- All active as validators
- Each takes turns producing blocks

### 2 Validator Setup (What you might have)
- node0, node3 (or node0, node1)
- Only these are configured as validators
- Other nodes might exist but aren't validators

### Why Some Nodes Might Not Produce Blocks

1. **Not Validators**: Only configured as RPC nodes, not validators
2. **Insufficient Stake**: Below the threshold to become a validator
3. **Offline**: Node stopped or crashed
4. **Epoch Transition**: Not selected for current epoch

## NEAR Architecture Clarification

```
┌─────────────────────────────────────────────────────┐
│                  NEAR Network                        │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │         Beacon Chain (Block Height)         │    │
│  │  Block 100 -> Block 101 -> Block 102 ->    │    │
│  └────────────────────────────────────────────┘    │
│                        │                            │
│           ┌────────────┼────────────┐              │
│           ▼            ▼            ▼              │
│       ┌──────┐    ┌──────┐    ┌──────┐           │
│       │Shard0│    │Shard1│    │Shard2│           │
│       │Chunk │    │Chunk │    │Chunk │           │
│       └──────┘    └──────┘    └──────┘           │
│                                                    │
│  ┌────────────────────────────────────────────┐  │
│  │          Validator Nodes                    │  │
│  │  node0 ─┐                                   │  │
│  │  node3 ─┼─ Produce blocks & chunks         │  │
│  │         │   for all shards                  │  │
│  └─────────┴─────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

**Key Points:**
- Each block (at block height N) contains chunks from all shards
- Validators rotate producing blocks
- Any validator can produce chunks for any shard (assigned by protocol)
- Block height is global, increments by 1 per block
- Missing validators (node1, node2) simply means fewer validators = faster consensus

## Expected Behavior

Your localnet with 2 validators (node0, node3) is working correctly:
- Faster block times (~600ms) are normal for localnet
- Fewer validators = faster consensus
- Both validators should appear in block production
- 4-5 blocks per 3-second refresh is expected

## Adding Validator Visibility to Explorer

You can enhance the explorer to show which validator produced each block by displaying the `author` field from block data. This would let you confirm the rotation between node0 and node3.

