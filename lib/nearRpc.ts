// Simple NEAR RPC client for localnet
export interface Block {
  author: string;
  header: {
    height: number;
    hash: string;
    prev_hash: string;
    timestamp: number;
    timestamp_nanosec: string;
    gas_price: string;
    total_supply: string;
  };
  chunks: any[];
}

export interface NetworkStatus {
  chain_id: string;
  sync_info: {
    latest_block_hash: string;
    latest_block_height: number;
    latest_block_time: string;
    syncing: boolean;
  };
  version: {
    version: string;
    build: string;
  };
}

export interface Transaction {
  hash: string;
  signer_id: string;
  receiver_id: string;
  actions: any[];
  block_height: number;
  block_hash: string;
  timestamp: number;
  timestamp_nanosec: string;
}

export class NearRpcClient {
  private rpcUrl: string;
  private requestId: number = 0;

  //   constructor(rpcUrl: string = 'http://localhost:3030') {
  constructor(rpcUrl: string = 'https://free.rpc.fastnear.com') {
    // Load from localStorage if available
    const savedUrl = typeof window !== 'undefined' ? localStorage.getItem('near_rpc_url') : null;
    this.rpcUrl = savedUrl || rpcUrl;
  }

  setRpcUrl(url: string) {
    this.rpcUrl = url;
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('near_rpc_url', url);
    }
  }

  getRpcUrl(): string {
    return this.rpcUrl;
  }

  private async call(method: string, params: any): Promise<any> {
    const response = await fetch(this.rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: ++this.requestId,
        method,
        params,
      }),
    });

    if (!response.ok) {
      throw new Error(`RPC request failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || 'RPC error');
    }

    return data.result;
  }

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
      const startHeight = Math.max(0, latestBlock.header.height - 1000); // Search last 1000 blocks (~10 min at 600ms/block)
      
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
        `Transaction ${txHash} not found in the last 1000 blocks. ` +
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

  formatRelativeTime(nanosec: string | number): string {
    const ms = typeof nanosec === 'string' 
      ? parseInt(nanosec) / 1_000_000 
      : nanosec / 1_000_000;
    const now = Date.now();
    const diff = now - ms;
    const seconds = Math.floor(diff / 1000);

    if (seconds < 60) {
      return `${seconds} sec${seconds !== 1 ? 's' : ''} ago`;
    }
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min${minutes !== 1 ? 's' : ''} ago`;
    }
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }
    
    const days = Math.floor(hours / 24);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }

  async getTransactionsFromBlock(block: Block): Promise<Transaction[]> {
    const transactions: Transaction[] = [];
    
    for (const chunk of block.chunks) {
      try {
        // Fetch chunk details to get transactions
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
        // Skip chunks that fail to fetch
        console.warn(`Failed to fetch chunk ${chunk.chunk_hash}:`, err);
      }
    }
    
    return transactions;
  }
}

export const nearRpc = new NearRpcClient();

