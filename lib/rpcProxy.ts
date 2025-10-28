/**
 * RPC Proxy Client
 * 
 * This module provides a proxy client that routes RPC requests through
 * a proxy server to bypass CORS restrictions.
 * 
 * Two modes:
 * 1. Development: Uses Vite dev server proxy at /rpc-proxy
 * 2. Production: Uses standalone proxy server (configurable URL)
 * 
 * Port Configuration:
 * - The proxy server port can be configured via VITE_PROXY_PORT env var
 * - Defaults to 3001 if not specified
 */

// Get proxy port from Vite environment (build-time variable)
// This is evaluated during build/dev start and injected as a string literal
const PROXY_PORT = (import.meta as any).env?.VITE_PROXY_PORT || '3001';
const PROXY_BASE_URL = `http://localhost:${PROXY_PORT}`;

export interface ProxyConfig {
  enabled: boolean;
  proxyUrl: string; // URL of the proxy server (e.g., 'http://localhost:3001')
}

class RpcProxyClient {
  private config: ProxyConfig = {
    enabled: false,
    proxyUrl: PROXY_BASE_URL,
  };

  /**
   * Configure the proxy
   */
  configure(config: Partial<ProxyConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Check if proxy is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Get proxy configuration
   */
  getConfig(): ProxyConfig {
    return { ...this.config };
  }

  /**
   * Make an RPC request through the proxy
   * 
   * @param targetUrl - The actual RPC endpoint URL
   * @param body - The JSON-RPC request body
   * @param signal - Optional AbortSignal for cancellation
   */
  async fetch(targetUrl: string, body: string, signal?: AbortSignal): Promise<Response> {
    if (!this.config.enabled) {
      throw new Error('Proxy is not enabled');
    }

    // In development, use Vite dev proxy
    const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost';
    const proxyEndpoint = isDev ? '/rpc-proxy' : this.config.proxyUrl;

    console.log(`[RPC Proxy] Sending request to ${proxyEndpoint} for target: ${targetUrl}`);

    try {
      const response = await fetch(proxyEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Target-URL': targetUrl,
        },
        body,
        signal,
      });

      console.log(`[RPC Proxy] Response: ${response.status} ${response.statusText}`);

      return response;
    } catch (error) {
      console.error(`[RPC Proxy] Error:`, error);
      // Enhance error message
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw error; // Re-throw abort errors as-is
        }
        throw new Error(`Proxy request failed: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Direct fetch without proxy (for local endpoints or when proxy is disabled)
   */
  async directFetch(url: string, body: string, signal?: AbortSignal): Promise<Response> {
    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
      signal,
    });
  }

  /**
   * Smart fetch: automatically choose proxy or direct based on URL and config
   */
  async smartFetch(url: string, body: string, signal?: AbortSignal): Promise<Response> {
    console.log(`[RPC Proxy] smartFetch called for: ${url}`);
    console.log(`[RPC Proxy] Proxy enabled: ${this.config.enabled}`);
    console.log(`[RPC Proxy] Is local URL: ${this.isLocalUrl(url)}`);
    
    // Always use direct fetch for localhost/local IPs
    if (this.isLocalUrl(url)) {
      console.log(`[RPC Proxy] Using direct fetch for local URL`);
      return this.directFetch(url, body, signal);
    }

    // Use proxy if enabled for remote URLs
    if (this.config.enabled) {
      console.log(`[RPC Proxy] Using proxy for remote URL`);
      return this.fetch(url, body, signal);
    }

    // Fall back to direct fetch
    console.log(`[RPC Proxy] Proxy disabled, using direct fetch`);
    return this.directFetch(url, body, signal);
  }

  /**
   * Check if URL is local (localhost or local IP)
   */
  private isLocalUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname.toLowerCase();
      
      return (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '::1' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('172.16.') ||
        hostname.endsWith('.local')
      );
    } catch {
      return false;
    }
  }
}

// Singleton instance
export const rpcProxy = new RpcProxyClient();

// Auto-enable proxy in development mode (check if running on localhost)
// This runs immediately when the module loads
const enableProxy = () => {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    console.log('[RPC Proxy] Auto-enabling proxy for localhost development');
    console.log(`[RPC Proxy] Using proxy URL: ${PROXY_BASE_URL}`);
    rpcProxy.configure({ enabled: true, proxyUrl: PROXY_BASE_URL });
  } else {
    console.warn('[RPC Proxy] Not on localhost, proxy disabled');
  }
};

// Try to enable immediately
enableProxy();

// Also try on DOMContentLoaded in case window isn't ready yet
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enableProxy);
  }
}

