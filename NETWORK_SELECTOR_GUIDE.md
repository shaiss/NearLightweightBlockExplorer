# Network Selector Feature Guide

## Overview

The NEAR Lightweight Block Explorer now includes a network selector that ensures you only connect to one blockchain network at a time. This prevents the common mistake of mixing RPC endpoints from different networks.

## How It Works

### Network Types

The explorer supports three distinct networks:

1. **Mainnet** - The production NEAR blockchain
2. **Testnet** - The official test blockchain for NEAR development
3. **Localnet** - Local NEAR node (default, usually on localhost:3030)

### Network Isolation

Once you select a network:
- ✅ Only RPC providers for that network are shown
- ✅ Only providers from the selected network can be enabled
- ✅ Custom providers are added to the selected network
- ✅ All queries use providers from the selected network only
- ✅ Settings are automatically saved and restored

**You can never accidentally query multiple networks simultaneously.**

## Using the Network Selector

### Accessing the Network Selector

The network selector is prominently displayed in the main navigation bar at the top of the app:

```
[Logo] [Blocks] [Search] [Settings] [Localnet ▼]
                                      ↑ Network selector
```

### Switching Networks

1. Click the **network name button** in the top-right corner
2. A dropdown menu appears showing three options:
   - Mainnet
   - Testnet
   - Localnet
3. Click the network you want to switch to
4. The app immediately:
   - Switches to the new network
   - Refreshes the provider list
   - Reloads with providers for that network
   - Saves your choice in localStorage

### Current Network Display

The current network is always visible:

- **Navigation**: Shows selected network name (e.g., "localnet")
- **Settings Page**: Displays "Configure RPC providers for [NETWORK] network"
- **Color Indicator**: Selected network is highlighted in blue in the dropdown menu
- **Footer**: Provider status shows current RPC node in use

## Provider Management Per Network

### Default Providers

When you switch to each network, these providers are available by default:

#### Mainnet
- NEAR Official (enabled by default)
- FastNEAR (enabled by default)
- Pagoda
- Aurora
- Lava Network

#### Testnet
- NEAR Testnet Official (enabled by default)
- FastNEAR Testnet
- Pagoda Testnet

#### Localnet
- Localhost:3030 (enabled by default)

### Customization Per Network

Each network has its own configuration:

1. **Settings Page** shows only providers for the selected network
2. **Add Custom Provider** adds it to the current network
3. **Enable/Disable** toggles are per-network
4. **Provider Priority** (↑↓) is per-network

### Example: Switching Contexts

```
User Actions:
1. Using Localnet (localhost:3030)
   - Working on local development
   - Testing smart contracts

2. Click "Testnet" in network selector
   - Settings page shows testnet providers
   - Previous localnet configuration is saved
   - Now querying testnet RPC nodes

3. Click "Mainnet" in network selector
   - Settings page shows mainnet providers
   - Previous testnet configuration is saved
   - Now querying mainnet RPC nodes

4. Click "Localnet" in network selector
   - Returns to previous localnet configuration
   - All customizations preserved
   - Back to querying localhost
```

## Network Selection Persistence

Your network choice is **automatically saved** and persists across:

- ✅ Page refreshes
- ✅ Browser tab closures (within the same session)
- ✅ Returning to the app later
- ❌ Private/Incognito windows (fresh start each time)

### Storage Details

Network selection is stored in localStorage:
- Key: `near_rpc_network`
- Value: `'mainnet' | 'testnet' | 'localnet'`
- Default: `'localnet'` (on first visit)

To reset to default: Clear browser localStorage or click "Reset to Defaults" in Settings.

## Important Rules

### ✅ Always True
- **One network per session** - Only one network is active at any given time
- **Network isolation** - No mixing of providers from different networks
- **Consistent state** - All settings respect the selected network
- **Provider safety** - Can't accidentally query wrong network

### ❌ Never Happens
- Queries to multiple networks simultaneously
- Mixing mainnet and testnet endpoints
- Mixing testnet and localnet endpoints
- Losing network selection on refresh

## Common Use Cases

### Local Development
```
1. Select "Localnet"
2. Ensure "Localhost:3030" is enabled
3. Start your local NEAR node
4. Explorer queries your local node
5. Test and develop locally
```

### Testnet Testing
```
1. Select "Testnet" from network selector
2. Settings page shows testnet providers
3. Enable preferred testnet RPC providers
4. Test contracts on testnet
5. All queries go to testnet only
```

### Mainnet Viewing
```
1. Select "Mainnet" from network selector
2. Settings page shows mainnet providers
3. Use default or custom mainnet RPC endpoints
4. View mainnet blocks and transactions
5. Read-only querying of production network
```

### Switching Between Networks
```
Start in Mainnet
  ↓
  Click "Testnet" button
  ↓
All customizations for Mainnet are saved
  ↓
Switch to Testnet providers
  ↓
Make changes to Testnet settings
  ↓
Click "Mainnet" button
  ↓
All Mainnet customizations restored
  ↓
Switch back to Mainnet providers
```

## Troubleshooting

### Issue: Settings Lost After Switching Networks

**Solution**: Settings are saved per-network. When you switch back to a network, your previous settings for that network are restored.

### Issue: "No Providers Configured" Error

**This can happen if:**
1. You switched to a new network for the first time
2. All providers for that network are disabled

**Solution:**
1. Go to Settings
2. Click "Select All" to enable all providers for the current network
3. Try again

### Issue: Queries Failing After Network Switch

**Solutions:**
1. Verify at least one provider is enabled for the network
2. Click "Test" on a provider to check connectivity
3. Ensure the RPC endpoint is accessible
4. For localhost: verify your local NEAR node is running

### Issue: Network Selection Not Saving

**This may occur in:**
1. Private/Incognito windows (localStorage disabled)
2. Browser with storage disabled
3. Very old browser versions

**Solution**: Use a normal (non-private) browser window with storage enabled.

## Technical Details

### Network Type Definition

```typescript
export type NetworkType = 'mainnet' | 'testnet' | 'localnet';
```

### API Usage

```typescript
import { providerManager } from '@/lib/providerManager';

// Get current network
const network = providerManager.getSelectedNetwork();
// Returns: 'mainnet' | 'testnet' | 'localnet'

// Switch network
providerManager.setSelectedNetwork('testnet');

// Get providers for current network
const providers = providerManager.getAllProviders();

// Get enabled providers for current network
const enabledProviders = providerManager.getEnabledProviders();
```

### Data Flow

```
Network Selector Click
    ↓
providerManager.setSelectedNetwork(network)
    ↓
localStorage updated
    ↓
subscribed listeners notified
    ↓
Settings page refreshes provider list
    ↓
failover client uses new network's providers
    ↓
All subsequent queries use selected network
```

## Best Practices

1. **Always check current network** before making queries
   - Look at the navigation bar to see selected network
   - Check the footer to see active RPC provider

2. **Test providers after switching networks**
   - Use the "Test" button in Settings
   - Verify at least one provider is healthy

3. **Enable multiple providers per network**
   - Provides failover redundancy
   - At least 2 providers recommended

4. **Use localnet for development**
   - Default network ensures safe local testing
   - Prevents accidental mainnet queries

5. **Clear custom providers when switching networks**
   - Remove test endpoints from production networks
   - Keep production endpoints separate from dev

## Key Differences from Previous Version

| Feature | Before | After |
|---------|--------|-------|
| Network Selection | Implicit (based on enabled providers) | **Explicit (dedicated selector)** |
| Network Mixing | Possible to mix networks | **Impossible (prevents mixing)** |
| Provider UI | Grouped by network in one view | **Only shows current network** |
| Accidental Queries | Could query wrong network | **Prevented by design** |
| Settings Persistence | Per provider only | **Per network + per provider** |
| User Experience | Confusing network choices | **Clear network context** |

## Summary

The network selector ensures:
- 🎯 **Clear context** - Always know which network you're using
- 🔒 **Network isolation** - Never accidentally mix networks
- 💾 **Smart persistence** - Settings saved per network
- ⚠️ **Safety by design** - Impossible to query multiple networks

This is a critical feature for avoiding expensive mistakes when working with blockchain networks!
