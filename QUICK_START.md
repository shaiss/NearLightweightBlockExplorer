# 🚀 Quick Start

## Two Issues Fixed

### 1. ✅ Network Selection Bug
Custom providers now only show up in their assigned network (localnet/testnet/mainnet).

### 2. ✅ Provider Test Failures
Added RPC proxy to bypass CORS restrictions for remote providers.

---

## Running the App

### Simple (No Proxy)
```bash
npm run dev
```

**Works for:**
- ✅ Local providers (localhost, AWS)
- ✅ Official NEAR RPC endpoints
- ❌ Most third-party providers (CORS issues)

### With Proxy (Recommended for Testing)
```bash
# Terminal 1: Start proxy server
npm run proxy

# Terminal 2: Start app
npm run dev

# OR run both at once
npm run dev:full
```

**Works for:**
- ✅ All providers including FastNEAR, dRPC, etc.
- ✅ Bypasses CORS restrictions
- ✅ Better error messages

---

## Quick Test

1. Start the app with proxy: `npm run proxy` + `npm run dev`
2. Go to Settings page
3. Switch to "Testnet" network
4. Click "Test" on any provider
5. All tests should now work! 🎉

---

## What Changed?

### Before
```
Settings Page (Testnet view):
- AWS provider (should only be in localnet) ❌
- FastNEAR test fails (CORS) ❌
- dRPC test fails (CORS) ❌
```

### After
```
Settings Page (Testnet view):
- AWS provider hidden (correct!) ✅
- FastNEAR test succeeds (123ms) ✅
- dRPC test succeeds (156ms) ✅
```

---

## Files Changed

1. **lib/providerManager.ts** - Fixed network filtering
2. **lib/rpcProxy.ts** - New proxy client
3. **lib/nearRpcFailover.ts** - Integrated proxy
4. **proxy-server.js** - Standalone proxy server
5. **vite.config.ts** - Dev proxy configuration

---

## Need More Info?

See **PROXY_SETUP.md** for:
- Detailed setup instructions
- Production deployment guide
- API reference
- Troubleshooting

---

**Happy exploring! 🚀**

