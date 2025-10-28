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

export class NearRpcClient {
  private rpcUrl: string;
  private requestId: number = 0;

  constructor(rpcUrl: string = 'http://localhost:3030') {
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
}

export const nearRpc = new NearRpcClient();

