// NEAR RPC Client with Automatic Failover and Retry Logic

import { providerManager, RpcProvider } from './providerManager';
import { rpcProxy } from './rpcProxy';
import type { Block, NetworkStatus, Transaction } from './nearRpc';

export { Block, NetworkStatus, Transaction };

interface RpcError {
  code: number;
  message: string;
  data?: any;
}

interface FailoverEvent {
  type: 'provider-switch' | 'retry' | 'error' | 'success';
  providerId?: string;
  providerUrl?: string;
  attempt?: number;
  error?: string;
}

type FailoverListener = (event: FailoverEvent) => void;

class NearRpcFailoverClient {
  private requestId: number = 0;
  private currentProviderIndex: number = 0;
  private listeners: FailoverListener[] = [];
  
  // Retry configuration
  private readonly MAX_RETRIES = 3;
  private readonly INITIAL_BACKOFF = 100; // ms
  private readonly BACKOFF_MULTIPLIER = 3;

  constructor() {
    // Clear any bad provider data from localStorage (from broken GitHub parsing)
    // This ensures we always use the correct hardcoded RPC endpoints
    this.initializeProviders();
    
    // Subscribe to provider manager changes to reset provider index when network changes
    providerManager.subscribe(() => {
      this.currentProviderIndex = 0;
    });
  }

  private async initializeProviders(): Promise<void> {
    // Check if we have bad URLs in storage (GitHub repos, homepages instead of RPC endpoints)
    const providers = providerManager.getAllProviders();
    const hasBadUrls = providers.some(p => 
      p.url.includes('github.com') || 
      p.url.includes('docs.') ||
      (p.url.endsWith('.com') && !p.url.includes('rpc')) ||
      (p.url.endsWith('.org/') && !p.url.includes('rpc'))
    );
    
    if (hasBadUrls) {
      console.warn('Detected bad provider URLs in storage - clearing and resetting to fallback providers');
      providerManager.clearBadProviders();
    }
  }

  // Get current provider
  private getCurrentProvider(): RpcProvider | null {
    const providers = providerManager.getEnabledProviders();
    
    if (providers.length === 0) {
      return null;
    }
    
    // Ensure index is within bounds
    if (this.currentProviderIndex >= providers.length) {
      this.currentProviderIndex = 0;
    }
    
    // Handle negative index just in case
    if (this.currentProviderIndex < 0) {
      this.currentProviderIndex = 0;
    }
    
    return providers[this.currentProviderIndex];
  }

  // Get all enabled providers
  private getProviders(): RpcProvider[] {
    return providerManager.getEnabledProviders();
  }

  // Switch to next provider
  private switchToNextProvider(): RpcProvider | null {
    const providers = this.getProviders();
    
    if (providers.length === 0) {
      return null;
    }
    
    this.currentProviderIndex = (this.currentProviderIndex + 1) % providers.length;
    const provider = providers[this.currentProviderIndex];
    
    this.notifyListeners({
      type: 'provider-switch',
      providerId: provider.id,
      providerUrl: provider.url,
    });
    
    return provider;
  }

  // Determine if error is network-related (should trigger failover)
  private isNetworkError(error: any): boolean {
    // Network errors include:
    // - Fetch failures (network unreachable, timeout, CORS)
    // - HTTP errors (500, 502, 503, 504)
    // - Connection errors
    
    if (error instanceof TypeError) {
      // Fetch network errors are TypeErrors
      return true;
    }
    
    if (error.message) {
      const msg = error.message.toLowerCase();
      return (
        msg.includes('fetch') ||
        msg.includes('network') ||
        msg.includes('timeout') ||
        msg.includes('econnrefused') ||
        msg.includes('enotfound') ||
        msg.includes('cors') ||
        msg.includes('502') ||
        msg.includes('503') ||
        msg.includes('504')
      );
    }
    
    return false;
  }

  // Sleep utility for backoff
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Core RPC call with retry and failover
  private async call(method: string, params: any): Promise<any> {
    const providers = this.getProviders();
    
    if (providers.length === 0) {
      throw new Error('No RPC providers enabled. Please enable at least one provider in settings.');
    }
    
    // Try each provider
    for (let providerAttempt = 0; providerAttempt < providers.length; providerAttempt++) {
      const provider = this.getCurrentProvider();
      
      if (!provider) {
        throw new Error('No provider available');
      }
      
      // Retry current provider with exponential backoff
      for (let retry = 0; retry < this.MAX_RETRIES; retry++) {
        try {
          if (retry > 0) {
            const backoffTime = this.INITIAL_BACKOFF * Math.pow(this.BACKOFF_MULTIPLIER, retry - 1);
            await this.sleep(backoffTime);
            
            this.notifyListeners({
              type: 'retry',
              providerId: provider.id,
              providerUrl: provider.url,
              attempt: retry + 1,
            });
          }
          
          const startTime = Date.now();
          
          const body = JSON.stringify({
            jsonrpc: '2.0',
            id: ++this.requestId,
            method,
            params,
          });
          
          // Use smart fetch which automatically decides proxy vs direct
          const response = await rpcProxy.smartFetch(provider.url, body);
          
          const responseTime = Date.now() - startTime;
          
          if (!response.ok) {
            // HTTP errors might be network issues
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const data = await response.json();
          
          // Check for RPC errors
          if (data.error) {
            const rpcError = data.error as RpcError;
            
            // RPC-level errors (like "not found", "invalid params") should NOT trigger failover
            // These are valid responses from the server
            providerManager.updateHealth(provider.id, {
              isHealthy: true,
              responseTime,
            });
            
            throw new Error(rpcError.message || 'RPC error');
          }
          
          // Success!
          providerManager.updateHealth(provider.id, {
            isHealthy: true,
            responseTime,
          });
          
          this.notifyListeners({
            type: 'success',
            providerId: provider.id,
            providerUrl: provider.url,
          });
          
          return data.result;
          
        } catch (error) {
          const isLastRetry = retry === this.MAX_RETRIES - 1;
          const isLastProvider = providerAttempt === providers.length - 1;
          
          // Check if it's a network error
          if (this.isNetworkError(error)) {
            providerManager.updateHealth(provider.id, {
              isHealthy: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
            
            this.notifyListeners({
              type: 'error',
              providerId: provider.id,
              providerUrl: provider.url,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
            
            if (isLastRetry) {
              // Move to next provider
              break;
            }
            // Retry with backoff
            continue;
          } else {
            // RPC error (not network error) - don't retry or failover
            throw error;
          }
        }
      }
      
      // If we get here, all retries failed for this provider
      // Switch to next provider
      if (providerAttempt < providers.length - 1) {
        this.switchToNextProvider();
      }
    }
    
    // All providers exhausted
    throw new Error('All RPC providers failed. Please check your network connection and provider settings.');
  }

  // Public API methods (matching original NearRpcClient)
  
  async getStatus(): Promise<NetworkStatus> {
    return this.call('status', []);
  }

  async getBlock(blockId: number | string): Promise<Block> {
    const params = typeof blockId === 'number' 
      ? { block_id: blockId }
      : { block_id: blockId };
    return this.call('block', params);
  }

  async getLatestBlock(): Promise<Block> {
    return this.call('block', { finality: 'final' });
  }

  async getTransaction(txHash: string, accountId: string): Promise<any> {
    return this.call('tx', [txHash, accountId]);
  }

  async getTransactionByHash(txHash: string, accountId?: string): Promise<any> {
    // If account ID is provided, use it directly
    if (accountId) {
      return this.call('EXPERIMENTAL_tx_status', [txHash, accountId]);
    }
    
    // Otherwise, search through recent blocks to find the transaction
    // This is useful for localnet and when account ID is unknown
    try {
      const latestBlock = await this.getLatestBlock();
      const startHeight = Math.max(0, latestBlock.header.height - 100); // Search last 100 blocks
      
      // Search backwards through blocks
      for (let height = latestBlock.header.height; height >= startHeight; height--) {
        try {
          const block = await this.getBlock(height);
          
          // Check each chunk for the transaction
          for (const chunk of block.chunks) {
            try {
              const chunkData = await this.getChunk(chunk.chunk_hash);
              
              if (chunkData.transactions) {
                for (const tx of chunkData.transactions) {
                  if (tx.hash === txHash) {
                    // Found it! Now fetch full transaction details with the account ID
                    return await this.call('EXPERIMENTAL_tx_status', [txHash, tx.signer_id]);
                  }
                }
              }
            } catch (err) {
              // Skip chunks that fail to fetch
              continue;
            }
          }
        } catch (err) {
          // Skip blocks that fail to fetch
          continue;
        }
      }
      
      // If not found in recent blocks, throw error
      throw new Error(
        `Transaction ${txHash} not found in the last 100 blocks. ` +
        'For older transactions, you may need to provide the sender account ID, ' +
        'or use a block explorer with indexer support.'
      );
    } catch (err) {
      throw err;
    }
  }

  async getAccount(accountId: string): Promise<any> {
    return this.call('query', {
      request_type: 'view_account',
      finality: 'final',
      account_id: accountId,
    });
  }

  async getChunk(chunkId: string): Promise<any> {
    return this.call('chunk', [chunkId]);
  }

  // Utility methods
  
  formatNear(yoctoNear: string): string {
    try {
      const value = parseFloat(yoctoNear) / 1e24;
      return value.toFixed(4);
    } catch {
      return '0.0000';
    }
  }

  formatTimestamp(nanosec: string | number): string {
    const ms = typeof nanosec === 'string' 
      ? parseInt(nanosec) / 1_000_000 
      : nanosec / 1_000_000;
    return new Date(ms).toLocaleString();
  }

  async getTransactionsFromBlock(block: Block): Promise<Transaction[]> {
    const transactions: Transaction[] = [];
    
    for (const chunk of block.chunks) {
      try {
        const chunkData = await this.getChunk(chunk.chunk_hash);
        
        if (chunkData.transactions) {
          for (const tx of chunkData.transactions) {
            transactions.push({
              hash: tx.hash,
              signer_id: tx.signer_id,
              receiver_id: tx.receiver_id,
              actions: tx.actions || [],
              block_height: block.header.height,
              block_hash: block.header.hash,
              timestamp: block.header.timestamp,
              timestamp_nanosec: block.header.timestamp_nanosec,
            });
          }
        }
      } catch (err) {
        console.warn(`Failed to fetch chunk ${chunk.chunk_hash}:`, err);
      }
    }
    
    return transactions;
  }

  // Failover management
  
  getCurrentProviderInfo(): { provider: RpcProvider | null; health: any } {
    const provider = this.getCurrentProvider();
    const health = provider ? providerManager.getHealth(provider.id) : null;
    return { provider, health };
  }

  refreshProviders(): Promise<boolean> {
    return providerManager.fetchProvidersFromGitHub();
  }

  // Event listeners for UI updates
  
  onFailoverEvent(listener: FailoverListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(event: FailoverEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in failover event listener:', error);
      }
    });
  }

  // Manual provider selection
  
  selectProvider(providerId: string): boolean {
    const providers = this.getProviders();
    const index = providers.findIndex(p => p.id === providerId);
    
    if (index !== -1) {
      this.currentProviderIndex = index;
      this.notifyListeners({
        type: 'provider-switch',
        providerId: providers[index].id,
        providerUrl: providers[index].url,
      });
      return true;
    }
    
    return false;
  }

  // Backward compatibility methods
  
  getRpcUrl(): string {
    const provider = this.getCurrentProvider();
    return provider?.url || 'http://localhost:3030';
  }

  setRpcUrl(url: string): void {
    // For backward compatibility - this now just adds a custom provider
    const network = providerManager.getSelectedNetwork();
    const existingCustom = providerManager.getAllProviders().find(p => p.url === url);
    
    if (!existingCustom) {
      providerManager.addCustomProvider(`Custom (${url})`, url);
    }
    
    // Try to enable this provider
    const provider = providerManager.getAllProviders().find(p => p.url === url);
    if (provider) {
      this.selectProvider(provider.id);
    }
  }
}

// Singleton instance
export const nearRpc = new NearRpcFailoverClient();

