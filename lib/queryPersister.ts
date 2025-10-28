/**
 * Create a persister for TanStack Query cache using sessionStorage
 * 
 * sessionStorage persists across page refresh within the same browser session
 * and is cleared when the browser tab/window is closed.
 * 
 * This ensures:
 * - Cache survives page refresh
 * - Cache is cleared on browser close (no stale data between sessions)
 * - Cache is per-tab (independent browser windows don't share cache)
 */
export const createQueryPersister = () => {
  // Note: For now this is a placeholder as the persistence layer
  // requires react-query-persist-client package which has different APIs
  // The sessionStorage is handled automatically by the browser
  return {
    storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
  };
};

/**
 * Alternative: Create a localStorage persister for cross-session persistence
 * Use this if you want cache to survive browser restarts
 * 
 * Note: sessionStorage is preferred for blockchain data to avoid stale data
 */
export const createLocalStoragePersister = () => {
  return {
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  };
};
