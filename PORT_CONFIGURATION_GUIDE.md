# Port Configuration Guide

## Overview

This project now uses **configurable ports** instead of hardcoded values. This eliminates port conflicts and makes development more flexible.

### Default Ports
- **Frontend (Vite)**: `3000`
- **RPC Proxy Server**: `3001`
- **NEAR RPC (localnet)**: `3030`

## Quick Start

### Standard Development (Default Ports)
```bash
./start-dev.sh
```

This will:
1. Kill any existing processes on ports 3000 and 3001
2. Start the frontend dev server on port 3000
3. Start the RPC proxy server on port 3001

### Custom Ports

Use environment variables to specify different ports:

```bash
# Run frontend on 4000, proxy on 4001
FRONTEND_PORT=4000 PROXY_PORT=4001 ./start-dev.sh
```

Or export them first:
```bash
export FRONTEND_PORT=4000
export PROXY_PORT=4001
./start-dev.sh
```

## Architecture

### Components

```
┌─────────────────────────────────────────────────┐
│         Browser (Frontend App)                  │
│    Running on: localhost:FRONTEND_PORT          │
└──────────────────┬──────────────────────────────┘
                   │
                   │ Requests to /rpc-proxy
                   ↓
┌─────────────────────────────────────────────────┐
│    Vite Dev Server (vite.config.ts)             │
│    - Proxies /rpc-proxy → localhost:PROXY_PORT  │
└──────────────────┬──────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────┐
│       RPC Proxy Server (proxy-server.js)        │
│    Running on: localhost:PROXY_PORT             │
│    - Handles CORS                               │
│    - Forwards requests to actual RPC endpoints  │
└──────────────────┬──────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        ↓                     ↓
    localnet:3030        Remote RPC endpoints
    (http://localhost:    (FastNEAR, Pagoda, etc)
     3030)
```

## Configuration Files

### vite.config.ts
Reads `FRONTEND_PORT` and `PROXY_PORT` from environment:
```typescript
const FRONTEND_PORT = parseInt(process.env.FRONTEND_PORT || '3000', 10);
const PROXY_PORT = parseInt(process.env.PROXY_PORT || '3001', 10);
```

### proxy-server.js
Uses port precedence:
1. `PROXY_PORT` environment variable (highest priority)
2. Command line argument: `node proxy-server.js 3001`
3. Default: `3001`

### lib/rpcProxy.ts
Reads proxy port from Vite environment:
```typescript
const PROXY_PORT = import.meta.env.VITE_PROXY_PORT || '3001';
```

### start-dev.sh
Exports environment variables and kills processes on those ports gracefully before starting.

## Usage Examples

### Example 1: Avoiding Port Conflicts
Your local NEAR node is on 3000, so use different ports:
```bash
FRONTEND_PORT=8000 PROXY_PORT=8001 ./start-dev.sh
```

### Example 2: Multiple Development Instances
Run two independent dev environments:
```bash
# Terminal 1 - Default ports
./start-dev.sh

# Terminal 2 - Alternative ports
FRONTEND_PORT=5000 PROXY_PORT=5001 ./start-dev.sh
```

### Example 3: Integration with Docker
```bash
# Inside Docker container, use container-specific ports
docker run -e FRONTEND_PORT=3000 -e PROXY_PORT=3001 my-explorer:latest
```

## Troubleshooting

### Port Already in Use
If you get "port 3000 is already in use":

**Option 1**: Use the start script (it kills existing processes)
```bash
./start-dev.sh
```

**Option 2**: Use different ports
```bash
FRONTEND_PORT=3100 PROXY_PORT=3101 ./start-dev.sh
```

**Option 3**: Manually kill the process
```bash
# Check what's using port 3000
lsof -i :3000

# Kill it
kill -9 <PID>
```

### Proxy Connection Failed
If you see "Proxy request failed":

1. **Check proxy is running**: `curl http://localhost:3001`
2. **Verify PROXY_PORT matches** between:
   - Frontend (vite.config.ts)
   - Proxy server (proxy-server.js)
   - Frontend app (lib/rpcProxy.ts)
3. **Check environment variables**:
   ```bash
   echo $FRONTEND_PORT
   echo $PROXY_PORT
   ```

### Frontend Can't Reach Proxy
If the frontend can't connect to the proxy:

1. **Verify proxy is running**: `npm run proxy` in another terminal
2. **Check the port it's running on**: Look at proxy-server startup message
3. **Export environment variables properly**:
   ```bash
   export PROXY_PORT=3001
   npm run dev
   ```

## Modifying Default Ports

To change the default ports permanently:

1. **vite.config.ts**: Change the default in the `||` operator
   ```typescript
   const FRONTEND_PORT = parseInt(process.env.FRONTEND_PORT || '5000', 10);
   ```

2. **proxy-server.js**: Change the default in the final `|| 3001`
   ```typescript
   const PORT = process.env.PROXY_PORT || process.argv[2] || 5001;
   ```

3. **lib/rpcProxy.ts**: Change the default
   ```typescript
   const PROXY_PORT = import.meta.env.VITE_PROXY_PORT || '5001';
   ```

## Environment Variable Precedence

### FRONTEND_PORT
1. `FRONTEND_PORT` env var
2. `3000` (hardcoded default in vite.config.ts)

### PROXY_PORT
1. `PROXY_PORT` env var
2. `PROXY_PORT` from script (if using start-dev.sh)
3. Command line argument to proxy-server.js
4. `3001` (hardcoded default)

## Performance Notes

- **No performance impact**: Port configuration is resolved at build/startup time
- **Environment variables**: Evaluated once when services start
- **No runtime overhead**: No dynamic port checking during requests

## Migration from Hardcoded Ports

This refactoring maintains **100% backward compatibility**:
- Old code that used hardcoded ports still works
- New code can override via environment variables
- Gradual migration possible if needed

## Next Steps

Consider these improvements:

1. **Create .env files** (add to .gitignore):
   ```bash
   # .env.local
   FRONTEND_PORT=3000
   PROXY_PORT=3001
   ```

2. **Docker Compose** for multi-service setup:
   ```yaml
   version: '3'
   services:
     near-node:
       image: near/near-node:latest
       ports:
         - "3030:3030"
     
     explorer:
       build: .
       environment:
         - FRONTEND_PORT=3000
         - PROXY_PORT=3001
       ports:
         - "3000:3000"
         - "3001:3001"
   ```

3. **GitHub Actions** with dynamic ports to avoid CI conflicts

---

**Questions?** Refer to `PROXY_SETUP.md` for detailed proxy server information.
