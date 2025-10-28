# RPC Provider Debugging Guide

## ROOT CAUSE IDENTIFIED ✅

The multi-RPC failover was **completely broken** due to a bad markdown parser that extracted **wrong URLs** from GitHub:

### What Was Happening (BAD) ❌
```
Testing URL: https://github.com/vgrichina/fast-near     ← GitHub repo!
Testing URL: https://drpc.org/                          ← Homepage!
Testing URL: https://fastnear.com                       ← Homepage!
Testing URL: https://docs.1rpc.io/                      ← Docs page!
```

### What Should Happen (GOOD) ✅
```
Testing URL: https://rpc.mainnet.near.org               ← Actual RPC!
Testing URL: https://free.rpc.fastnear.com              ← Actual RPC!
Testing URL: https://rpc.testnet.near.org               ← Actual RPC!
```

## Fixes Applied

1. **Disabled GitHub markdown parsing** - It was extracting homepage URLs and GitHub repos instead of actual RPC endpoints
2. **Using hardcoded FALLBACK_PROVIDERS** - These have the correct, verified RPC endpoints
3. **Auto-cleanup of bad URLs** - On app start, detects and removes any bad URLs from localStorage
4. **Removed "Refresh from GitHub" button** - This feature is now disabled to prevent future issues

## How to Test

### 1. Clear Your Browser Storage
Open DevTools Console and run:
```javascript
localStorage.clear();
location.reload();
```

### 2. Verify Providers Are Correct
In DevTools Console:
```javascript
// Check loaded providers
JSON.parse(localStorage.getItem('near_rpc_providers') || '[]')
  .map(p => ({ name: p.name, url: p.url }))
```

You should see:
```javascript
[
  { name: "NEAR Official", url: "https://rpc.mainnet.near.org" },
  { name: "FastNEAR", url: "https://free.rpc.fastnear.com" },
  // ... etc
]
```

### 3. Test RPC Endpoints
Go to Settings page and click "Test" on each provider. You should see:
- ✅ Green checkmark for working providers
- ❌ Red X for offline/down providers

### 4. Monitor Proxy Logs
In your proxy server terminal, you should see:
```
🎯 Target: https://rpc.mainnet.near.org      ← Correct!
2025-10-28... 200 POST https://rpc.mainnet.near.org (150ms)
```

NOT:
```
🎯 Target: https://github.com/...            ← Wrong!
```

## Expected Results

### Localnet
- Should connect directly to `http://localhost:3030`
- No proxy needed

### Testnet
- Should use proxy to connect to `https://rpc.testnet.near.org`
- Fallback to `https://test.rpc.fastnear.com`

### Mainnet
- Should use proxy to connect to `https://rpc.mainnet.near.org`
- Fallback to `https://free.rpc.fastnear.com`

## If Tests Still Fail

1. Make sure proxy server is running: `npm run proxy`
2. Make sure Vite dev server restarted: `npm run dev`
3. Clear browser cache and localStorage
4. Check browser console for errors
5. Check proxy server logs for actual URLs being tested

