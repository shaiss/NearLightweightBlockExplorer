# RPC Failover Implementation Guide

## Overview

The NEAR Lightweight Block Explorer now includes robust RPC failover functionality with automatic retry logic and intelligent provider management. This feature ensures high availability by automatically switching between multiple RPC endpoints when failures occur.

## Features

### 🔄 Automatic Failover
- Seamlessly switches between RPC providers on network failures
- Maintains service continuity without user intervention
- Smart error detection distinguishes network errors from RPC errors

### 🔁 Intelligent Retry Logic
- **3 retry attempts** per provider with exponential backoff
- Backoff timing: 100ms → 300ms → 900ms
- Prevents overwhelming providers with rapid requests

### 🌐 Dynamic Provider Management
- Fetches latest provider list from GitHub on startup
- Falls back to built-in provider list if fetch fails
- Supports custom RPC endpoints (e.g., localhost:3030)

### ⚙️ User-Friendly Settings Page
- Visual provider management interface
- Enable/disable providers by network type
- Test provider connectivity in real-time
- Reorder providers to set priority
- Add custom RPC endpoints

## Architecture

### Components

1. **Provider Manager** (`lib/providerManager.ts`)
   - Manages the list of available RPC providers
   - Handles localStorage persistence
   - Fetches and parses providers from GitHub
   - Tracks provider health status

2. **Failover RPC Client** (`lib/nearRpcFailover.ts`)
   - Drop-in replacement for the original `NearRpcClient`
   - Implements retry logic with exponential backoff
   - Smart error detection (network vs RPC errors)
   - Event system for UI notifications

3. **Settings Page** (`pages/Settings.tsx`)
   - User interface for provider management
   - Provider testing and health monitoring
   - Custom endpoint configuration

## Usage

### For End Users

1. **Access Settings**
   - Navigate to `/settings` or click "Settings" in the navigation menu

2. **Select Providers**
   - Enable/disable individual providers using checkboxes
   - Use "Select All" buttons for bulk operations by network type
   - Drag providers or use ↑↓ buttons to set priority

3. **Add Custom Endpoints**
   - Enter a name and URL for your custom RPC endpoint
   - Common example: `Localhost:3030` → `http://localhost:3030`
   - Click "Add Provider" to save

4. **Test Providers**
   - Click "Test" button next to any provider
   - View response time and health status
   - Green badge = healthy, Red badge = failed

5. **Refresh Providers**
   - Click "Refresh from GitHub" to fetch latest provider list
   - Preserves your enabled/disabled selections

### For Developers

#### Basic Usage

The failover client is a drop-in replacement:

```typescript
import { nearRpc } from '@/lib/nearRpcFailover';

// All methods work the same as before
const status = await nearRpc.getStatus();
const block = await nearRpc.getBlock(12345);
const latestBlock = await nearRpc.getLatestBlock();
```

#### Listening to Failover Events

```typescript
import { nearRpc } from '@/lib/nearRpcFailover';

const unsubscribe = nearRpc.onFailoverEvent((event) => {
  switch (event.type) {
    case 'provider-switch':
      console.log(`Switched to ${event.providerUrl}`);
      break;
    case 'retry':
      console.log(`Retrying... attempt ${event.attempt}`);
      break;
    case 'error':
      console.error(`Provider error: ${event.error}`);
      break;
    case 'success':
      console.log(`Request succeeded via ${event.providerUrl}`);
      break;
  }
});

// Clean up when done
unsubscribe();
```

#### Manual Provider Selection

```typescript
import { nearRpc } from '@/lib/nearRpcFailover';

// Get current provider info
const { provider, health } = nearRpc.getCurrentProviderInfo();
console.log(`Using: ${provider?.name} (${provider?.url})`);

// Manually select a provider
nearRpc.selectProvider('mainnet-fastnear');
```

#### Provider Management

```typescript
import { providerManager } from '@/lib/providerManager';

// Get all providers
const allProviders = providerManager.getAllProviders();

// Get enabled providers only
const enabled = providerManager.getEnabledProviders();

// Filter by network
const mainnetProviders = providerManager.getProvidersByNetwork('mainnet');

// Add custom provider
const newProvider = providerManager.addCustomProvider(
  'My Local Node',
  'http://localhost:3030'
);

// Toggle provider
providerManager.toggleProvider('mainnet-fastnear', true);

// Enable all in network
providerManager.enableAllInNetwork('testnet');

// Test a provider
const health = await providerManager.testProvider('mainnet-near-official');
console.log(`Health: ${health.isHealthy}, Response: ${health.responseTime}ms`);
```

## Failover Behavior

### When Failover Occurs

Failover is triggered **only** for network-related errors:
- Connection timeout
- Network unreachable
- DNS resolution failures
- HTTP 502, 503, 504 errors
- CORS errors

### When Failover Does NOT Occur

RPC-level errors do **not** trigger failover:
- Transaction not found
- Invalid parameters
- Account doesn't exist
- Block not found

These are valid responses from the server and indicate the query itself was the issue, not the provider.

### Retry Sequence

For a request with 3 enabled providers:

1. **Provider A** - Attempt 1 → Failed (network error)
2. **Provider A** - Attempt 2 (after 100ms) → Failed
3. **Provider A** - Attempt 3 (after 300ms) → Failed
4. **Provider B** - Attempt 1 → Failed
5. **Provider B** - Attempt 2 (after 100ms) → Failed
6. **Provider B** - Attempt 3 (after 300ms) → Failed
7. **Provider C** - Attempt 1 → Success! ✓

Total time: ~2.7 seconds (worst case with 3 providers)

## Default Providers

### Mainnet
- NEAR Official (`https://rpc.mainnet.near.org`)
- FastNEAR (`https://free.rpc.fastnear.com`) - Default enabled
- Pagoda (`https://rpc.mainnet.pagoda.co`)
- Aurora (`https://mainnet.aurora.dev`)
- Lava Network (`https://near.lava.build`)

### Testnet
- NEAR Testnet Official (`https://rpc.testnet.near.org`) - Default enabled
- FastNEAR Testnet (`https://test.rpc.fastnear.com`)
- Pagoda Testnet (`https://rpc.testnet.pagoda.co`)

### Localnet
- Localhost:3030 (`http://localhost:3030`) - Default enabled

## Configuration

### Provider Data Source

Providers are automatically fetched from:
```
https://raw.githubusercontent.com/near/docs/master/docs/api/rpc/providers.md
```

The system parses the markdown file to extract:
- Provider names
- RPC URLs
- Network classifications (mainnet/testnet)

### localStorage Keys

Configuration is persisted in localStorage:
- `near_rpc_providers` - Base provider list
- `near_rpc_custom_providers` - User-added custom providers
- `near_rpc_enabled_providers` - List of enabled provider IDs

### Reset to Defaults

To reset all settings:
1. Go to Settings page
2. Click "Reset to Defaults"
3. Or clear localStorage and refresh

## Troubleshooting

### All Providers Failing

**Symptom:** Error message "All RPC providers failed"

**Solutions:**
1. Check your internet connection
2. Enable more providers in Settings
3. Test each provider to identify issues
4. Add a custom localhost provider if running a local node

### Slow Performance

**Symptom:** Requests taking a long time

**Solutions:**
1. Reorder providers to prioritize faster ones
2. Test providers and disable slow/unhealthy ones
3. Reduce number of enabled providers
4. Use a local node for development

### Provider Not Appearing

**Symptom:** Expected provider missing from list

**Solutions:**
1. Click "Refresh from GitHub" to update provider list
2. Check if it's a custom provider that needs to be manually added
3. Verify the provider exists in the [NEAR docs](https://github.com/near/docs/blob/master/docs/api/rpc/providers.md)

### Settings Not Persisting

**Symptom:** Settings reset after page reload

**Solutions:**
1. Check if browser localStorage is enabled
2. Verify you're not in private/incognito mode
3. Check browser console for localStorage errors

## Future Enhancements

Potential improvements for future versions:
- Provider response time tracking and auto-optimization
- Weighted failover based on historical reliability
- Circuit breaker pattern for persistently failing providers
- Provider discovery via DNS or other protocols
- Rate limit detection and handling
- Geographic provider selection
- Provider benchmarking tools

## Reference Implementation

This implementation is inspired by the official NEAR RPC failover example:
https://github.com/near-examples/near-api-examples/blob/main/javascript/examples/rpc-failover.js

## Support

For issues or questions:
1. Check the [NEAR Docs](https://docs.near.org/api/rpc/providers)
2. Review provider status at individual provider websites
3. Test providers using the Settings page
4. Check browser console for detailed error messages

