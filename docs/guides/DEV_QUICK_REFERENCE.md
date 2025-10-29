# Development Quick Reference

## Starting Development

### Standard (Default Ports 3000/3001)
```bash
./start-dev.sh
```
→ Kills old processes, starts frontend (3000) + proxy (3001)

### Custom Ports
```bash
FRONTEND_PORT=4000 PROXY_PORT=4001 ./start-dev.sh
```

### Manual Control (if you know what's running)
```bash
# Terminal 1: Frontend only
npm run dev

# Terminal 2: Proxy only
npm run proxy

# Or both together
npm run dev:full
```

---

## Port Reference

| Service | Default | Env Var | Config File |
|---------|---------|---------|-------------|
| Frontend (Vite) | 3000 | `FRONTEND_PORT` | `vite.config.ts` |
| RPC Proxy | 3001 | `PROXY_PORT` | `proxy-server.js` |
| NEAR RPC (localnet) | 3030 | `VITE_RPC_URL` | `lib/config.ts` |

---

## Common Tasks

### Kill Port 3000
```bash
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

### Kill All 3xxx Ports
```bash
./start-dev.sh  # Does this automatically
```

### Find What's Using a Port
```bash
lsof -i :3001
```

### Check if Proxy is Running
```bash
curl http://localhost:3001
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Address already in use" | `./start-dev.sh` or use different ports |
| "Can't connect to proxy" | `npm run proxy` in separate terminal |
| "Frontend shows errors" | Check browser console, Network tab in DevTools |
| "RPC requests failing" | Verify localnet (3030) or check provider settings |
| "Script hangs during startup" | Kill with Ctrl+C, try again |

---

## Environment Variables

### Set Temporarily (for one command)
```bash
PROXY_PORT=9001 npm run dev
```

### Set for Session
```bash
export FRONTEND_PORT=4000
export PROXY_PORT=4001
./start-dev.sh
```

### Set in .env File
```bash
# Create .env.local (if .gitignore allows)
FRONTEND_PORT=3000
PROXY_PORT=3001
```

---

## Useful npm Scripts

```bash
npm run dev          # Frontend only (port 3000)
npm run proxy        # Proxy only (port 3001)  
npm run dev:full     # Both frontend + proxy
npm run build        # Build for production
npm run lint         # Check for linting errors
npm run preview      # Preview production build
```

---

## Architecture at a Glance

```
Browser (:3000)
    ↓
Vite Dev Server (:3000)
    ↓ (proxies /rpc-proxy)
    ↓
RPC Proxy (:3001)
    ↓
NEAR RPC (:3030) or Remote endpoints
```

---

## Files Modified for Port Flexibility

- ✅ `vite.config.ts` - Reads FRONTEND_PORT & PROXY_PORT
- ✅ `proxy-server.js` - Reads PROXY_PORT
- ✅ `lib/rpcProxy.ts` - Reads VITE_PROXY_PORT
- ✅ `start-dev.sh` - Graceful cleanup + env export

---

## Next Time You Have Issues

1. **Read**: `PORT_CONFIGURATION_GUIDE.md`
2. **Check**: `lsof -i :3000` and `lsof -i :3001`
3. **Run**: `./start-dev.sh`
4. **Debug**: Browser DevTools → Network/Console tabs

---

**Last Updated**: 2025-01-01  
**Maintainer**: Architecture Team
