# RPC Failover Testing Checklist

Use this checklist to verify the RPC failover implementation is working correctly.

## ✅ Basic Functionality Tests

### Settings Page
- [ ] Navigate to `/settings` - page loads without errors
- [ ] Providers are grouped by network (Mainnet, Testnet, Localnet)
- [ ] Can see at least 3 mainnet providers
- [ ] Can see at least 1 testnet provider
- [ ] Can see localhost:3030 in Localnet section
- [ ] "Current Active Provider" card shows a provider
- [ ] Provider checkboxes work (can enable/disable)
- [ ] "Select All" buttons work for each network
- [ ] "Deselect All" buttons work for each network

### Custom Provider Management
- [ ] Add custom provider with valid URL (e.g., `http://localhost:3030`)
- [ ] Custom provider appears in the Localnet section
- [ ] Custom provider has "Remove" button
- [ ] Can remove custom provider
- [ ] Invalid URL shows error toast

### Provider Testing
- [ ] Click "Test" on any enabled provider
- [ ] Test shows loading state ("Testing...")
- [ ] Successful test shows green badge with response time
- [ ] Failed test shows red badge with error
- [ ] Test results persist in UI

### Provider Priority
- [ ] ↑ button moves provider up in list
- [ ] ↓ button moves provider down in list
- [ ] ↑ button disabled for first item
- [ ] ↓ button disabled for last item

### Provider Refresh
- [ ] Click "Refresh from GitHub" button
- [ ] Button shows loading state
- [ ] Success toast appears after refresh
- [ ] Providers list updates (or stays same if already current)

### Reset to Defaults
- [ ] Add a custom provider
- [ ] Disable several providers
- [ ] Click "Reset to Defaults"
- [ ] Confirmation dialog appears
- [ ] After confirming, custom providers are removed
- [ ] Default providers are restored with default enabled states

## ✅ Navigation & Layout Tests

### Navigation Menu
- [ ] "Settings" link appears in navigation
- [ ] Clicking "Settings" navigates to settings page
- [ ] Can navigate back to home from settings
- [ ] Navigation persists across page refreshes

### Footer Status Indicator
- [ ] Footer shows "RPC: [Provider Name]"
- [ ] Status indicator shows green dot when healthy
- [ ] Status indicator shows red dot when unhealthy
- [ ] Indicator updates when switching providers

## ✅ Failover Behavior Tests

### Automatic Failover
1. **Setup:**
   - [ ] Enable at least 2 mainnet providers
   - [ ] Note the current active provider

2. **Test Network Error Failover:**
   - [ ] Disable network (airplane mode or unplug ethernet)
   - [ ] Try to load a block or navigate
   - [ ] Should see retry attempts in console
   - [ ] Should eventually fail after all providers tried
   - [ ] Re-enable network and verify recovery

3. **Test Provider Switch:**
   - [ ] Use browser DevTools Network tab
   - [ ] Block requests to current provider URL
   - [ ] Navigate to blocks page
   - [ ] Should automatically switch to next provider
   - [ ] Footer should show new provider name
   - [ ] Blocks should load successfully

### RPC Error Handling
- [ ] Search for non-existent transaction hash
- [ ] Should show "not found" error, not trigger failover
- [ ] Provider should remain the same
- [ ] Search for valid data afterward should work

### Manual Provider Selection
1. [ ] Open browser console
2. [ ] Run: `window.nearRpc = (await import('@/lib/nearRpcFailover')).nearRpc`
3. [ ] Run: `nearRpc.getCurrentProviderInfo()`
4. [ ] Verify it returns current provider info
5. [ ] Change provider in settings by disabling current and enabling different one
6. [ ] Reload app and verify new provider is used

## ✅ Persistence Tests

### localStorage
- [ ] Configure providers (enable/disable some)
- [ ] Add custom provider
- [ ] Refresh page
- [ ] All settings persist
- [ ] Try in incognito/private mode - should use defaults

### Provider List Persistence
- [ ] Refresh providers from GitHub
- [ ] Close and reopen browser
- [ ] Providers list should still be from GitHub (not reset to defaults)

## ✅ Error Handling Tests

### No Providers Enabled
- [ ] Disable all providers
- [ ] Try to navigate to blocks page
- [ ] Should see error message about no providers enabled
- [ ] Go to settings and enable at least one
- [ ] App should work again

### All Providers Fail
- [ ] Enable only localhost:3030
- [ ] Ensure no local node is running
- [ ] Try to load blocks
- [ ] Should see retry attempts
- [ ] Should eventually show "All providers failed" error

### Invalid Custom Provider
- [ ] Try to add provider without URL
- [ ] Should see error toast
- [ ] Try to add provider with invalid URL (no http/https)
- [ ] Should see error toast

## ✅ UI/UX Tests

### Toast Notifications
- [ ] Success toasts appear for successful actions (green)
- [ ] Error toasts appear for failures (red)
- [ ] Toasts auto-dismiss after ~3 seconds
- [ ] Multiple toasts stack properly

### Responsive Design
- [ ] Settings page works on mobile viewport
- [ ] Navigation menu adapts to small screens
- [ ] Provider cards are readable on mobile
- [ ] Buttons are touch-friendly

### Loading States
- [ ] "Refreshing..." shows when fetching providers
- [ ] "Testing..." shows when testing provider
- [ ] Disabled state for buttons during operations

## ✅ Integration Tests

### Complete User Flow
1. [ ] Start with default settings
2. [ ] Navigate to Home page - see network status
3. [ ] Navigate to Blocks page - see blocks loading
4. [ ] Click on a block - see block details
5. [ ] Go to Settings
6. [ ] Add custom localhost provider
7. [ ] Enable only localhost (if node running) or only testnet
8. [ ] Go back to Blocks
9. [ ] Verify blocks load from new provider
10. [ ] Footer shows correct provider

### Multiple Network Test
1. [ ] Enable several mainnet providers
2. [ ] Enable several testnet providers
3. [ ] App should prefer mainnet (higher priority)
4. [ ] Disable all mainnet
5. [ ] App should switch to testnet
6. [ ] Footer shows testnet provider

## ✅ Performance Tests

### Provider Retry Timing
1. [ ] Open console
2. [ ] Enable network throttling (Slow 3G)
3. [ ] Try to load blocks
4. [ ] Observe retry delays: ~100ms, ~300ms, ~900ms
5. [ ] Total retry time should be ~1.3 seconds per provider

### Response Time Display
- [ ] Test multiple providers
- [ ] Response times should be reasonable (<1000ms for healthy)
- [ ] Slower providers show higher times
- [ ] Times are consistent across multiple tests

## 🐛 Known Issues / Edge Cases

Document any issues found during testing:

### Issue Template
```
**Issue:** [Brief description]
**Steps to Reproduce:**
1. 
2. 
3. 
**Expected:** [What should happen]
**Actual:** [What actually happened]
**Severity:** [Low/Medium/High/Critical]
```

## ✅ Browser Compatibility

Test in multiple browsers:
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

## 📝 Notes

Add any additional observations or recommendations here:

---

**Testing Completed By:** _______________  
**Date:** _______________  
**Overall Status:** [ ] Pass [ ] Pass with Issues [ ] Fail

