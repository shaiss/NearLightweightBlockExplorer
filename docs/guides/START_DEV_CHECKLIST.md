# 🚀 Start Development Checklist

## Before You Start

- [ ] Node.js installed (`node --version`)
- [ ] npm dependencies installed (`npm install`)
- [ ] NEAR localnet running on port 3030 (optional)
- [ ] No other services on ports 3000-3001 (script will fix this)

## Quick Start (30 seconds)

```bash
cd /Users/Shai.Perednik/Documents/code_workspace/NearLightweightBlockExplorer
./start-dev.sh
```

That's it! The script will:
1. ✅ Kill any existing processes on ports 3000 & 3001
2. ✅ Start the frontend dev server on port 3000
3. ✅ Start the RPC proxy server on port 3001
4. ✅ Display the dev server URL

## Verify It's Working

**Frontend**: Open browser and visit `http://localhost:3000`
- ✅ Should load the NEAR Explorer app
- ✅ No errors in browser console (F12)

**Proxy**: In another terminal:
```bash
curl http://localhost:3001
# Should respond with connection refused (it only accepts POST requests)
```

**RPC**: Check if RPC requests work:
- ✅ Click on any block/transaction
- ✅ Data should load in the UI
- ✅ Check Network tab for `/rpc-proxy` requests

## Custom Ports (If Default Ports Conflict)

### Option 1: Use Different Ports
```bash
FRONTEND_PORT=4000 PROXY_PORT=4001 ./start-dev.sh
# Then visit http://localhost:4000
```

### Option 2: Run Multiple Instances
```bash
# Terminal 1 (default ports)
./start-dev.sh

# Terminal 2 (custom ports)
FRONTEND_PORT=5000 PROXY_PORT=5001 ./start-dev.sh
```

## Troubleshooting

### ❌ "Port 3000 is already in use"
**Solution**: Run `./start-dev.sh` - it kills the old process

### ❌ "Can't connect to RPC"
**Solution**: 
1. Check NEAR localnet is running on 3030
2. Verify proxy is running: `lsof -i :3001`
3. Check Network tab in browser (F12)

### ❌ "Script hangs during startup"
**Solution**:
1. Ctrl+C to stop the script
2. `lsof -i :3000` to see what's blocking
3. `kill -9 <PID>` to force kill it
4. Try again: `./start-dev.sh`

### ❌ "Frontend shows errors"
**Solution**:
1. Open DevTools (F12)
2. Check Console and Network tabs
3. Look for red errors
4. Restart: `./start-dev.sh`

## Validation

Make sure everything is configured correctly:
```bash
./validate-ports.sh
```

Should show:
```
✓ Port numbers are valid
✓ Ports are unique
✓ FRONTEND_PORT 3000 is available
✓ PROXY_PORT 3001 is available
✓ All configuration files are properly set up!
```

## Manual Control

### Run Components Separately
```bash
# Terminal 1: Frontend only
npm run dev

# Terminal 2: Proxy only (in same or different directory)
npm run proxy
```

### Check What's Running
```bash
# See what's on port 3000
lsof -i :3000

# See what's on port 3001
lsof -i :3001
```

### Stop Everything
```bash
# Ctrl+C in the main terminal
# Script will gracefully shut down both services

# Or manually:
pkill -f "vite"
pkill -f "proxy-server"
```

## Environment Variables

### Set for One Run
```bash
FRONTEND_PORT=4000 PROXY_PORT=4001 ./start-dev.sh
```

### Set for This Session
```bash
export FRONTEND_PORT=4000
export PROXY_PORT=4001
./start-dev.sh
# Variables remain set until terminal closes
```

### Verify What's Set
```bash
echo $FRONTEND_PORT
echo $PROXY_PORT
```

## Documentation

### For More Details
- 📖 `PORT_CONFIGURATION_GUIDE.md` - Full documentation
- 🔍 `DEV_QUICK_REFERENCE.md` - Quick reference
- ✅ `REFACTORING_COMPLETE.md` - What changed
- 🛠️ `validate-ports.sh` - Check configuration

### Common Questions
- **Q: Can I run multiple dev servers?** 
  A: Yes! Use different ports: `FRONTEND_PORT=5000 PROXY_PORT=5001 ./start-dev.sh`
  
- **Q: What ports are used?**
  A: Frontend (3000), Proxy (3001), NEAR RPC (3030)
  
- **Q: Can I change the default ports?**
  A: Yes! Edit the defaults in `vite.config.ts`, `proxy-server.js`, and `lib/rpcProxy.ts`

## What This Script Does

```
┌─────────────────────────────────────┐
│   User runs: ./start-dev.sh         │
└────────────┬────────────────────────┘
             │
             ├─→ Check environment variables
             │   (FRONTEND_PORT, PROXY_PORT)
             │
             ├─→ Kill old processes gracefully
             │   - Send SIGTERM (allow cleanup)
             │   - Wait 5 seconds max
             │   - Send SIGKILL if needed
             │
             ├─→ Verify ports are free
             │
             ├─→ Export environment variables
             │
             └─→ Run: npm run dev:full
                      ├─→ npm run dev (Vite frontend)
                      └─→ npm run proxy (RPC proxy)
```

## Daily Workflow

### Morning
```bash
./start-dev.sh
# ✅ Frontend running on 3000
# ✅ Proxy running on 3001
# ✅ Ready to work
```

### During Development
- Edit files → Auto-reloads (Vite)
- Check console for errors (F12)
- Network tab shows RPC requests

### Evening
```bash
# Ctrl+C in the terminal to stop everything
# Graceful shutdown
# ✅ All processes cleaned up
```

### Before Committing
```bash
npm run lint  # Check for errors
npm run build # Verify production build works
```

## Performance Tips

1. **Faster reload**: Hard refresh (Cmd+Shift+R) instead of F5
2. **Smaller bundles**: Use network throttling in DevTools to test slow connections
3. **Cache busting**: Clear browser cache if styles don't update
4. **Debug**: `npm run dev` gives more detailed error messages

## Support

If something goes wrong:

1. **Read**: `PORT_CONFIGURATION_GUIDE.md`
2. **Check**: `./validate-ports.sh`
3. **Restart**: `./start-dev.sh`
4. **Clean**: `kill -9 $(lsof -ti:3000,3001)` then try again

---

## Quick Commands Reference

```bash
# START
./start-dev.sh                              # Default ports (3000/3001)
FRONTEND_PORT=4000 PROXY_PORT=4001 ./start-dev.sh  # Custom ports

# VALIDATE
./validate-ports.sh                         # Check configuration

# BUILD
npm run build                               # Production build
npm run preview                             # Preview production build

# LINT
npm run lint                                # Check code quality

# STOP
# Ctrl+C in the terminal (graceful shutdown)
```

---

**Last Updated**: January 1, 2025  
**Status**: Ready to Use  
**Next Step**: Run `./start-dev.sh` and start developing! 🚀
