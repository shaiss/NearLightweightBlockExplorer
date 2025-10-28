import { useQuery, useQueries } from '@tanstack/react-query';
import { Block } from './nearRpcFailover';
import { nearRpc } from './nearRpcFailover';

/**
 * Query Key Factory Pattern
 * 
 * Hierarchically organized keys enable fine-grained cache invalidation:
 * - nearKeys.all - invalidate everything
 * - nearKeys.blocks() - invalidate all block queries
 * - nearKeys.block(5) - invalidate only block #5
 */
export const nearKeys = {
  all: ['near'] as const,
  blocks: () => [...nearKeys.all, 'blocks'] as const,
  block: (height: number) => [...nearKeys.blocks(), height] as const,
  blockTransactions: (height: number) => [...nearKeys.block(height), 'transactions'] as const,
  transactions: () => [...nearKeys.all, 'transactions'] as const,
  recentTransactions: () => [...nearKeys.transactions(), 'recent'] as const,
  transactionRange: (from: number, to: number) => [...nearKeys.transactions(), { range: { from, to } }] as const,
  latestBlock: () => [...nearKeys.blocks(), 'latest'] as const,
};

/**
 * Cache configuration constants
 * Customize these based on your data freshness requirements
 */
export const CACHE_CONFIG = {
  // How long data is considered "fresh" before background refetch
  staleTime: 3000, // 3 seconds for blockchain data
  
  // How long unused cached queries persist in memory
  gcTime: 1000 * 60 * 10, // 10 minutes
  
  // Retry strategy for failed requests
  retry: 1,
  retryDelay: 1000,
};

/**
 * Fetch latest block with auto-refresh
 * Polls at specified interval to detect new blocks
 * NOTE: Only polls when query is successful to prevent infinite retry loops
 */
export function useLatestBlock(refetchInterval: number = 3000) {
  return useQuery({
    queryKey: nearKeys.latestBlock(),
    queryFn: () => nearRpc.getLatestBlock(),
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
    // Only poll when query is successful (prevents infinite loops on errors)
    refetchInterval: (query) => {
      return query.state.status === 'success' ? refetchInterval : false;
    },
    refetchIntervalInBackground: true, // Keep polling even if tab is inactive
    retry: CACHE_CONFIG.retry,
    retryDelay: CACHE_CONFIG.retryDelay,
  });
}

/**
 * Fetch a specific block by height
 */
export function useBlock(height: number) {
  return useQuery({
    queryKey: nearKeys.block(height),
    queryFn: () => nearRpc.getBlock(height),
    staleTime: Infinity, // Block data is immutable - never becomes stale
    gcTime: CACHE_CONFIG.gcTime,
    retry: CACHE_CONFIG.retry,
    retryDelay: CACHE_CONFIG.retryDelay,
  });
}

/**
 * Fetch multiple blocks in parallel
 * Useful for loading last N blocks efficiently
 */
export function useRecentBlocks(count: number = 20) {
  const { data: latestBlock, isLoading: latestLoading, error: latestError } = useLatestBlock();

  const blockHeights = latestBlock
    ? Array.from({ length: count }, (_, i) => Math.max(0, latestBlock.header.height - i))
    : [];

  const results = useQueries({
    queries: blockHeights.map((height) => ({
      queryKey: nearKeys.block(height),
      queryFn: () => nearRpc.getBlock(height),
      staleTime: Infinity, // Block data is immutable
      gcTime: CACHE_CONFIG.gcTime,
      retry: CACHE_CONFIG.retry,
      retryDelay: CACHE_CONFIG.retryDelay,
    })),
  });

  return {
    data: results.filter((r) => r.data).map((r) => r.data) as Block[],
    isLoading: latestLoading || results.some((r) => r.isLoading),
    error: latestError || results.find((r) => r.error)?.error,
    isFetching: results.some((r) => r.isFetching),
  };
}

/**
 * Fetch transactions from a specific block
 */
export function useBlockTransactions(height: number) {
  return useQuery({
    queryKey: nearKeys.blockTransactions(height),
    queryFn: async () => {
      const block = await nearRpc.getBlock(height);
      return nearRpc.getTransactionsFromBlock(block);
    },
    staleTime: Infinity, // Block transactions are immutable
    gcTime: CACHE_CONFIG.gcTime,
    retry: CACHE_CONFIG.retry,
    retryDelay: CACHE_CONFIG.retryDelay,
  });
}

/**
 * Fetch transaction counts for multiple blocks
 * Useful for showing transaction summary in block list
 */
export function useBlockTransactionCounts(heights: number[]) {
  const results = useQueries({
    queries: heights.map((height) => ({
      queryKey: nearKeys.blockTransactions(height),
      queryFn: async () => {
        const block = await nearRpc.getBlock(height);
        const transactions = await nearRpc.getTransactionsFromBlock(block);
        return { height, count: transactions.length };
      },
      staleTime: Infinity,
      gcTime: CACHE_CONFIG.gcTime,
      retry: CACHE_CONFIG.retry,
      retryDelay: CACHE_CONFIG.retryDelay,
    })),
  });

  return {
    data: results
      .filter((r) => r.data)
      .reduce(
        (acc, r) => {
          if (r.data) acc[r.data.height] = r.data.count;
          return acc;
        },
        {} as Record<number, number>
      ),
    isLoading: results.some((r) => r.isLoading),
    error: results.find((r) => r.error)?.error,
  };
}
