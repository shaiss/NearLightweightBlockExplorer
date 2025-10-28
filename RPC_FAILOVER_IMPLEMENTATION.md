# RPC Failover Implementation Summary

## Overview

This document provides a comprehensive summary of the RPC failover implementation for the NEAR Lightweight Block Explorer. The system enables automatic switching between multiple RPC providers with smart error detection, retry logic, and user-configurable preferences.

## Architecture

### Core Components

#### 1. **ProviderManager** (`lib/providerManager.ts`)

The central service for managing RPC providers across different networks.

**Key Features:**
- Fetches provider list from NEAR docs GitHub repository
- Parses Markdown provider data into structured RPC provider objects
- Stores/loads preferences in localStorage
- Network isolation (mainnet, testnet, localnet)
- Health tracking for each provider
- Custom provider support

**Key Methods:**
```typescript
// Fetching and initialization
fetchProvidersFromGitHub(): Promise<void>
loadFromStorage(): void
saveToStorage(): void

// Provider management
getAllProviders(): RpcProvider[]
getEnabledProviders(): RpcProvider[]
getProvidersByNetwork(network: NetworkType): RpcProvider[]
toggleProvider(id: string): void
enableAllInNetwork(): void
disableAllInNetwork(): void

// Custom providers
addCustomProvider(name: string, url: string): void
removeCustomProvider(id: string): void

// Network selection
getSelectedNetwork(): NetworkType
setSelectedNetwork(network: NetworkType): void

// Health tracking
testProvider(id: string): Promise<ProviderHealth>
updateProviderHealth(id: string, health: ProviderHealth): void

// Event system
subscribe(listener: ProviderListener): () => void
```

**Network Types:**
- `'mainnet'` - NEAR mainnet providers
- `'testnet'` - NEAR testnet providers  
- `'localnet'` - Custom local RPC endpoints
- `'custom'` - User-added custom providers

**Storage:**
- `localStorage['near_rpc_providers']` - Cached provider list
- `localStorage['near_rpc_custom_providers']` - Custom providers
- `localStorage['near_rpc_enabled_providers']` - Enabled provider IDs
- `localStorage['near_rpc_network']` - Selected network

#### 2. **NearRpcFailoverClient** (`lib/nearRpcFailover.ts`)

The main RPC client with automatic failover and retry logic.

**Key Features:**
- Automatic provider switching on network failures
- Exponential backoff retry strategy (100ms → 300ms → 900ms)
- Smart error detection (network vs. RPC errors)
- Request ID tracking for debugging
- Event-driven failover notifications
- Backward compatibility with existing code

**Key Methods:**
```typescript
// RPC calls
call(method: string, params?: any[]): Promise<any>
getStatus(): Promise<NetworkStatus>
getBlock(blockId: string | number): Promise<Block>
getChunk(blockId: string, shardId: number): Promise<any>
getTransaction(transactionId: string, recipient: string): Promise<Transaction>

// Provider info
getCurrentProvider(): RpcProvider | null
getCurrentProviderInfo(): ProviderInfo
selectProvider(providerId: string): boolean

// Event handling
onFailoverEvent(listener: FailoverListener): () => void

// Backward compatibility
getRpcUrl(): string
setRpcUrl(url: string): void
```

**Retry Strategy:**
1. First attempt at current provider
2. On network error, exponential backoff retry (same provider)
3. Max 3 attempts before failover
4. Automatic provider switch on repeated failures
5. Continue with next enabled provider in priority order

**Error Handling:**
- Network errors (timeout, CORS, connection refused) → Retry + Failover
- RPC errors (method not found, invalid params) → Return error immediately (no failover)
- Provider health tracked and updated

#### 3. **Settings Page** (`pages/Settings.tsx`)

User interface for managing RPC providers.

**Features:**
- Network selector dropdown (Mainnet, Testnet, Localnet)
- Provider list filtered by selected network
- Enable/disable toggles per provider
- Select All / Deselect All buttons
- Test provider connectivity
- Add custom provider with validation
- Remove custom providers
- Real-time health status indicators
- Refresh provider list from GitHub

**Network Isolation:**
- Only shows providers for currently selected network
- Custom providers always visible
- Select All/Deselect All applies only to current network
- Network changes reflected immediately

#### 4. **Layout Component** (`pages/Layout.tsx`)

Navigation and network selection UI.

**Features:**
- Network selector dropdown in header
- Current provider display
- Provider health indicator
- Settings navigation link
- Real-time network updates

### Data Flow

```
User Action
    ↓
Settings.tsx (or other component)
    ↓
providerManager.setSelectedNetwork() or toggleProvider()
    ↓
providerManager.saveToStorage()
    ↓
providerManager subscribers notified
    ↓
Components update (Layout, Home, etc.)
    ↓
RPC calls made through nearRpc instance
    ↓
nearRpcFailover.call()
    ↓
Try enabled providers in priority order
    ↓
On success: return data
    ↓
On failure: retry with backoff → failover → next provider
    ↓
Update health status
    ↓
Notify listeners of failover events
```

## Implementation Details

### Provider Parsing

The provider list is fetched from: https://github.com/near/docs/blob/master/docs/api/rpc/providers.md

The parser extracts provider information from Markdown tables and creates structured RpcProvider objects with:
- Unique ID (network-provider-name format)
- Display name
- RPC endpoint URL
- Network type (mainnet/testnet)
- Priority (for failover order)
- Enabled status (from localStorage)

### Network Isolation

The system ensures that only providers from one network are active:
- `getAllProviders()` filters by `selectedNetwork`
- Switching networks updates localStorage and notifies subscribers
- Custom providers are always included but can be network-specific

**Key Constraint:** Mainnet, testnet, localnet, and custom providers are never mixed in active provider list.

### localStorage Structure

```json
{
  "near_rpc_providers": [/* cached provider list */],
  "near_rpc_custom_providers": [
    {
      "id": "custom-1",
      "name": "My Node",
      "url": "http://localhost:3030",
      "network": "localnet",
      "enabled": true,
      "priority": 100,
      "isCustom": true
    }
  ],
  "near_rpc_enabled_providers": ["mainnet-near-official", "mainnet-fastnear"],
  "near_rpc_network": "mainnet"
}
```

### Failover Events

The system emits events for failover actions:

```typescript
interface FailoverEvent {
  type: 'provider-switch' | 'retry' | 'error' | 'success';
  providerId?: string;
  providerUrl?: string;
  attempt?: number;
  error?: string;
}
```

**Event Types:**
- `'provider-switch'` - Switched to different provider
- `'retry'` - Retrying current provider with backoff
- `'error'` - Request failed completely
- `'success'` - Request succeeded

**Usage:**
```typescript
nearRpc.onFailoverEvent((event) => {
  if (event.type === 'provider-switch') {
    console.log(`Switched to ${event.providerId}`);
  }
});
```

## Integration Points

### Home Page (`pages/Home.tsx`)
- Displays current provider and health status
- Shows network type in header
- Provides "Configure Providers" button to Settings

### Layout Component (`pages/Layout.tsx`)
- Network selector dropdown
- Current provider indicator
- Failover event listener for real-time updates

### Settings Page (`pages/Settings.tsx`)
- Full provider management UI
- Network switching
- Custom provider management
- Provider health testing

### Search & List Components
- Use `nearRpc.call()` for all RPC queries
- Automatic failover handled transparently
- No changes needed to existing code

## Backward Compatibility

The system maintains backward compatibility:

```typescript
// Old API still works
const url = nearRpc.getRpcUrl();
nearRpc.setRpcUrl(url);

// Internally converted to:
// getRpcUrl() → getCurrentProvider().url
// setRpcUrl(url) → addCustomProvider + selectProvider
```

## Error Handling Strategy

### Network Errors (Handled)
- Timeout
- Connection refused
- CORS errors
- DNS resolution failures
- **Response:** Retry with backoff, then failover

### RPC Errors (Not Handled - Returned to Caller)
- Method not found
- Invalid parameters
- Authentication required
- **Response:** Immediate error return (no failover)

### Detection Logic
```typescript
const isNetworkError = (error: any) => {
  const message = error.message?.toLowerCase() || '';
  return message.includes('fetch') || 
         message.includes('timeout') ||
         message.includes('cors') ||
         message.includes('network');
};
```

## Performance Considerations

### Exponential Backoff
- Initial: 100ms
- Second: 300ms (100 × 3)
- Third: 900ms (300 × 3)
- Reduces server load on widespread outages

### Request Batching
- No built-in request batching (can be added if needed)
- Each request goes through failover logic independently

### Caching
- Provider list cached in localStorage
- Refreshable via Settings page
- No request-level caching (can be added)

### Health Tracking
- Provider health stored in memory (not localStorage)
- Resets on page refresh
- Can be enhanced to persist to localStorage

## Testing the Implementation

### Local Testing
1. Start the explorer: `npm run dev`
2. Go to Settings page
3. Configure providers for localnet
4. Start a local NEAR node on localhost:3030
5. Verify blocks and transactions load
6. Stop the local node and verify failover behavior

### Testnet Testing
1. Switch to Testnet in network selector
2. Verify testnet providers are displayed
3. Test provider connectivity
4. Query blocks and transactions

### Custom Provider Testing
1. Add custom provider URL in Settings
2. Test connectivity
3. Toggle enabled/disabled
4. Verify failover works with custom providers

## Future Enhancements

1. **Request Caching**
   - Cache block/transaction data for X seconds
   - Reduce API calls during failover

2. **Provider Metrics**
   - Track response times per provider
   - Auto-reorder by performance
   - Display provider stats

3. **GraphQL Support**
   - Alternative query interface
   - Subscription support for real-time data

4. **Multi-Chain Support**
   - Extend to other chains (Solana, etc.)
   - Shared provider infrastructure

5. **Advanced Retry Strategies**
   - Circuit breaker pattern
   - Provider reputation system
   - Adaptive retry intervals

## Troubleshooting

### CORS Errors
**Issue:** "Access to fetch has been blocked by CORS policy"

**Causes:**
- External RPC endpoints don't allow browser requests
- Missing Access-Control-Allow-Origin header

**Solutions:**
- Use CORS proxy service
- Run explorer from same origin as RPC
- Use localnet providers that allow CORS

### Provider Not Working
**Issue:** Provider shows as unhealthy

**Solutions:**
1. Test in browser DevTools: `fetch('https://rpc.endpoint/health')`
2. Check provider documentation for correct endpoint
3. Verify firewall/network connectivity
4. Try adding custom provider with same endpoint

### Network Stuck on Wrong Provider
**Issue:** Can't switch networks or providers

**Solutions:**
1. Clear localStorage: Open DevTools → Application → localStorage → delete near_rpc_* entries
2. Refresh page
3. Try adding new custom provider

## Conclusion

The RPC failover implementation provides a robust, user-friendly system for managing multiple RPC providers with automatic failover. The architecture is modular, testable, and extensible for future enhancements.

All core requirements have been implemented:
✅ Fetch providers from GitHub
✅ Multiple network support (mainnet, testnet, localnet)
✅ User-configurable provider selection
✅ Automatic failover with retry logic
✅ Network isolation (no mixing of networks)
✅ Health status tracking
✅ Custom provider support
✅ Backward compatibility
✅ Clean UI and navigation
