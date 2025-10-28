# RPC Proxy Setup Guide

This guide explains how to use the RPC proxy to bypass CORS restrictions when testing remote RPC providers.

## 🎯 Problem

Many public RPC providers (FastNEAR, dRPC, etc.) don't allow direct browser requests due to CORS restrictions. This causes tests to fail even when the providers are actually working.

## ✅ Solution

We've implemented a proxy server that sits between your browser and the RPC providers, forwarding requests while adding proper CORS headers.

---

## 🚀 Quick Start

### Option 1: Development Mode (Recommended)

The proxy is **automatically enabled** in development mode through Vite's built-in proxy.

Just run:
```bash
npm run dev
```

That's it! The proxy will automatically:
- Route remote RPC requests through the proxy
- Allow direct access to local endpoints (localhost, 127.0.0.1, etc.)
- Work seamlessly with your existing code

### Option 2: Standalone Proxy Server

For production or if you need more control, run the standalone proxy:

```bash
# Terminal 1: Start the proxy server
npm run proxy

# Terminal 2: Start your app
npm run dev
```

Or run both together:
```bash
npm run dev:full
```

The proxy server will start on port 3001 by default.

---

## 🔧 Configuration

### Enable/Disable Proxy

The proxy is automatically enabled in development mode. To manually configure:

```typescript
import { rpcProxy } from '@/lib/rpcProxy';

// Enable proxy
rpcProxy.configure({ enabled: true });

// Disable proxy
rpcProxy.configure({ enabled: false });

// Change proxy URL (for standalone server)
rpcProxy.configure({ 
  enabled: true, 
  proxyUrl: 'http://localhost:3001' 
});

// Check if proxy is enabled
console.log(rpcProxy.isEnabled());
```

### Environment Variables

For the standalone proxy server:

```bash
# Set custom port
PORT=3001 node proxy-server.js

# Or via npm script
PORT=8080 npm run proxy
```

---

## 🔍 How It Works

### Architecture

```
Browser → Vite Dev Server → Proxy → RPC Provider
         (localhost:3000)  (/rpc-proxy)  (e.g., fastnear.com)
```

### Smart Routing

The proxy automatically decides whether to use proxy or direct fetch:

- **Local URLs** (localhost, 127.0.0.1, 192.168.x.x, etc.) → Direct fetch
- **Remote URLs** with proxy enabled → Through proxy
- **Remote URLs** without proxy → Direct fetch (may fail with CORS)

### Request Flow

1. Your app makes an RPC call to `https://fastnear.com`
2. `rpcProxy.smartFetch()` detects it's a remote URL
3. Request is sent to `/rpc-proxy` with header `X-Target-URL: https://fastnear.com`
4. Vite proxy (or standalone server) forwards to the actual RPC endpoint
5. Response is returned with CORS headers added
6. Your app receives the response successfully

---

## 🧪 Testing Providers

With the proxy enabled, you can now test all providers from the Settings page:

1. Start the dev server: `npm run dev`
2. Navigate to Settings
3. Click "Test" on any provider (including FastNEAR, dRPC, etc.)
4. Tests should now succeed! ✅

### What Changed?

**Before (without proxy):**
```
❌ FastNEAR - Failed: CORS error
❌ dRPC - Failed: CORS error
❌ fast-near web4 - Failed: CORS error
✅ AWS - Success (localhost)
```

**After (with proxy):**
```
✅ FastNEAR - Success (123ms)
✅ dRPC - Success (156ms)
✅ fast-near web4 - Success (98ms)
✅ AWS - Success (45ms, direct)
```

---

## 📝 Production Deployment

### Option 1: Deploy Proxy Server

Deploy the `proxy-server.js` to your hosting platform:

**Vercel / Netlify:**
- Convert to serverless function (see below)

**AWS / DigitalOcean / Heroku:**
- Deploy as Node.js app
- Expose on public URL

**Docker:**
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY proxy-server.js .
EXPOSE 3001
CMD ["node", "proxy-server.js"]
```

### Option 2: Serverless Function

For Vercel/Netlify, convert to serverless function:

**`api/rpc-proxy.js`** (Vercel):
```javascript
export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  const targetUrl = req.headers['x-target-url'];
  const response = await fetch(targetUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req.body),
  });
  
  const data = await response.json();
  return res.json(data);
}
```

### Option 3: Backend Integration

If you have an existing backend, add a proxy endpoint:

**Express:**
```javascript
app.post('/api/rpc-proxy', async (req, res) => {
  const targetUrl = req.headers['x-target-url'];
  const response = await fetch(targetUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req.body),
  });
  const data = await response.json();
  res.json(data);
});
```

Then configure the proxy:
```typescript
rpcProxy.configure({ 
  enabled: true, 
  proxyUrl: 'https://your-api.com/api/rpc-proxy' 
});
```

---

## 🐛 Troubleshooting

### Proxy not working?

**Check if proxy is enabled:**
```javascript
import { rpcProxy } from '@/lib/rpcProxy';
console.log(rpcProxy.isEnabled()); // Should be true
```

**Check Vite proxy config:**
```typescript
// vite.config.ts should have proxy configuration
server: {
  proxy: {
    '/rpc-proxy': { ... }
  }
}
```

**Check browser console:**
- Look for requests to `/rpc-proxy`
- Check for `X-Target-URL` header
- Look for any error messages

### Still getting CORS errors?

1. Verify proxy is running: `curl http://localhost:3001`
2. Check if local URLs are being proxied (they shouldn't be)
3. Try disabling browser extensions (some block requests)
4. Check browser DevTools → Network tab for actual request

### Proxy server won't start?

```bash
# Check if port is in use
lsof -i :3001

# Use different port
PORT=8080 npm run proxy
```

---

## 📊 Monitoring

The standalone proxy server logs all requests:

```
2024-10-28T10:30:45.123Z ✅ 200 POST https://fastnear.com (123ms)
2024-10-28T10:30:46.456Z ❌ 500 POST https://drpc.org (timeout)
2024-10-28T10:30:47.789Z ✅ 200 POST http://localhost:3030 (45ms)
```

- 🟢 Green = Success (2xx)
- 🔴 Red = Error (4xx/5xx)

---

## 🔐 Security Considerations

### Development
- The dev proxy allows all origins (`*`) for convenience
- Only use in local development

### Production
- Restrict allowed origins to your domain
- Add rate limiting
- Consider authentication for sensitive endpoints
- Use HTTPS for proxy server
- Validate and sanitize target URLs

### Example: Restricted Proxy
```javascript
const ALLOWED_ORIGINS = ['https://your-app.com'];
const ALLOWED_TARGETS = [
  'https://rpc.mainnet.near.org',
  'https://rpc.testnet.near.org',
  'https://fastnear.com',
];

// Validate origin and target
if (!ALLOWED_ORIGINS.includes(req.headers.origin)) {
  return res.status(403).json({ error: 'Forbidden' });
}

if (!ALLOWED_TARGETS.includes(targetUrl)) {
  return res.status(400).json({ error: 'Invalid target' });
}
```

---

## 🎓 Advanced Usage

### Custom Fetch Logic

```typescript
import { rpcProxy } from '@/lib/rpcProxy';

// Force proxy even for local URLs
const response = await rpcProxy.fetch(
  'http://localhost:3030',
  JSON.stringify({ jsonrpc: '2.0', method: 'status' })
);

// Force direct fetch (no proxy)
const response = await rpcProxy.directFetch(
  'https://fastnear.com',
  JSON.stringify({ jsonrpc: '2.0', method: 'status' })
);
```

### With AbortController

```typescript
const controller = new AbortController();
setTimeout(() => controller.abort(), 5000); // 5s timeout

const response = await rpcProxy.smartFetch(
  url,
  body,
  controller.signal
);
```

---

## 📚 API Reference

### `rpcProxy.configure(config)`
Configure proxy settings
- `config.enabled: boolean` - Enable/disable proxy
- `config.proxyUrl: string` - Proxy server URL

### `rpcProxy.isEnabled(): boolean`
Check if proxy is enabled

### `rpcProxy.getConfig(): ProxyConfig`
Get current configuration

### `rpcProxy.smartFetch(url, body, signal?): Promise<Response>`
Automatically choose proxy or direct fetch based on URL

### `rpcProxy.fetch(url, body, signal?): Promise<Response>`
Force fetch through proxy

### `rpcProxy.directFetch(url, body, signal?): Promise<Response>`
Force direct fetch (bypass proxy)

---

## 💡 Tips

1. **Development**: Just run `npm run dev` - proxy is auto-enabled
2. **Testing**: All provider tests should now work
3. **Production**: Deploy proxy server or use serverless function
4. **Local endpoints**: Always accessed directly (no proxy)
5. **Debugging**: Check browser DevTools → Network tab

---

## 🆘 Need Help?

If you're still having issues:
1. Check the browser console for errors
2. Verify proxy server is running (if using standalone)
3. Test with `curl` to isolate browser issues:
   ```bash
   curl -X POST http://localhost:3001 \
     -H "X-Target-URL: https://rpc.testnet.near.org" \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","id":1,"method":"status","params":[]}'
   ```

---

**Happy Testing! 🚀**

