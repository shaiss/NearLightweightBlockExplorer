// Provider Management Service for NEAR RPC endpoints

export interface RpcProvider {
  id: string;
  name: string;
  url: string;
  network: 'mainnet' | 'testnet' | 'localnet' | 'custom';
  enabled: boolean;
  priority: number;
  isCustom?: boolean;
}

export interface ProviderHealth {
  providerId: string;
  isHealthy: boolean;
  lastChecked: number;
  responseTime?: number;
  error?: string;
}

export type NetworkType = 'mainnet' | 'testnet' | 'localnet';

const STORAGE_KEY_PROVIDERS = 'near_rpc_providers';
const STORAGE_KEY_CUSTOM = 'near_rpc_custom_providers';
const STORAGE_KEY_ENABLED = 'near_rpc_enabled_providers';
const STORAGE_KEY_NETWORK = 'near_rpc_network';
const STORAGE_KEY_VERSION = 'near_rpc_config_version';
const CURRENT_CONFIG_VERSION = '2.0'; // Updated to force migration to AWS Localnet
const GITHUB_PROVIDERS_URL = 'https://raw.githubusercontent.com/near/docs/master/docs/api/rpc/providers.md';

// Fallback static provider list
const FALLBACK_PROVIDERS: RpcProvider[] = [
  // Mainnet
  { id: 'mainnet-near-official', name: 'NEAR Official', url: 'https://rpc.mainnet.near.org', network: 'mainnet', enabled: true, priority: 1 },
  { id: 'mainnet-fastnear', name: 'FastNEAR', url: 'https://free.rpc.fastnear.com', network: 'mainnet', enabled: true, priority: 2 },
  { id: 'mainnet-pagoda', name: 'Pagoda', url: 'https://rpc.mainnet.pagoda.co', network: 'mainnet', enabled: true, priority: 3 },
  { id: 'mainnet-aurora', name: 'Aurora', url: 'https://mainnet.aurora.dev', network: 'mainnet', enabled: false, priority: 4 },
  { id: 'mainnet-lava', name: 'Lava Network', url: 'https://near.lava.build', network: 'mainnet', enabled: false, priority: 5 },
  
  // Testnet
  { id: 'testnet-near-official', name: 'NEAR Testnet Official', url: 'https://rpc.testnet.near.org', network: 'testnet', enabled: true, priority: 10 },
  { id: 'testnet-fastnear', name: 'FastNEAR Testnet', url: 'https://test.rpc.fastnear.com', network: 'testnet', enabled: false, priority: 11 },
  { id: 'testnet-pagoda', name: 'Pagoda Testnet', url: 'https://rpc.testnet.pagoda.co', network: 'testnet', enabled: false, priority: 12 },
  
  // Localnet
  { id: 'localnet-aws', name: 'AWS Localnet', url: 'http://54.90.246.254:3030', network: 'localnet', enabled: true, priority: 20 },
  { id: 'localnet-default', name: 'Localhost:3030', url: 'http://localhost:3030', network: 'localnet', enabled: false, priority: 21 },
];

class ProviderManager {
  private providers: RpcProvider[] = [];
  private customProviders: RpcProvider[] = [];
  private healthStatus: Map<string, ProviderHealth> = new Map();
  private listeners: Array<() => void> = [];
  private selectedNetwork: NetworkType = 'localnet';

  constructor() {
    this.loadFromStorage();
  }

  // Load providers and network from localStorage
  private loadFromStorage(): void {
    try {
      // Check config version - auto-migrate if outdated
      const savedVersion = localStorage.getItem(STORAGE_KEY_VERSION);
      if (savedVersion !== CURRENT_CONFIG_VERSION) {
        console.log(`Migrating provider config from version ${savedVersion || 'legacy'} to ${CURRENT_CONFIG_VERSION}`);
        console.log('Resetting to new defaults with AWS Localnet...');
        this.providers = [...FALLBACK_PROVIDERS];
        this.customProviders = [];
        this.selectedNetwork = 'localnet';
        this.saveToStorage();
        return;
      }

      // Load selected network
      const savedNetwork = localStorage.getItem(STORAGE_KEY_NETWORK) as NetworkType | null;
      if (savedNetwork && ['mainnet', 'testnet', 'localnet'].includes(savedNetwork)) {
        this.selectedNetwork = savedNetwork;
      } else {
        this.selectedNetwork = 'localnet';
      }

      // Load custom providers
      const customJson = localStorage.getItem(STORAGE_KEY_CUSTOM);
      if (customJson) {
        this.customProviders = JSON.parse(customJson);
      }

      // Load base providers (or use fallback)
      const providersJson = localStorage.getItem(STORAGE_KEY_PROVIDERS);
      if (providersJson) {
        this.providers = JSON.parse(providersJson);
      } else {
        this.providers = [...FALLBACK_PROVIDERS];
      }

      // Load enabled status
      const enabledJson = localStorage.getItem(STORAGE_KEY_ENABLED);
      if (enabledJson) {
        const enabledIds = JSON.parse(enabledJson) as string[];
        const enabledSet = new Set(enabledIds);
        
        this.providers.forEach(p => {
          p.enabled = enabledSet.has(p.id);
        });
        this.customProviders.forEach(p => {
          p.enabled = enabledSet.has(p.id);
        });
      }
    } catch (error) {
      console.error('Failed to load providers from storage:', error);
      this.providers = [...FALLBACK_PROVIDERS];
      this.selectedNetwork = 'localnet';
    }
  }

  // Save to localStorage
  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY_VERSION, CURRENT_CONFIG_VERSION);
      localStorage.setItem(STORAGE_KEY_PROVIDERS, JSON.stringify(this.providers));
      localStorage.setItem(STORAGE_KEY_CUSTOM, JSON.stringify(this.customProviders));
      localStorage.setItem(STORAGE_KEY_NETWORK, this.selectedNetwork);
      
      const enabledIds = this.getAllProviders()
        .filter(p => p.enabled)
        .map(p => p.id);
      localStorage.setItem(STORAGE_KEY_ENABLED, JSON.stringify(enabledIds));
      
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to save providers to storage:', error);
    }
  }

  // Get current network
  getSelectedNetwork(): NetworkType {
    return this.selectedNetwork;
  }

  // Set current network (disables all other networks)
  setSelectedNetwork(network: NetworkType): void {
    this.selectedNetwork = network;
    this.saveToStorage();
  }

  // Fetch providers from GitHub - DISABLED: The markdown parser extracts wrong URLs
  // (GitHub repos, homepages, docs pages instead of actual RPC endpoints)
  // We use the hardcoded FALLBACK_PROVIDERS list instead which has correct URLs
  async fetchProvidersFromGitHub(): Promise<boolean> {
    console.warn('GitHub provider fetch is disabled - using fallback providers with correct RPC endpoints');
    
    // Reset to known-good providers
    this.providers = [...FALLBACK_PROVIDERS];
    this.saveToStorage();
    return true;
  }

  // Parse markdown content to extract providers
  private parseMarkdown(markdown: string): RpcProvider[] {
    const providers: RpcProvider[] = [];
    let priority = 1;
    
    // Look for table rows or list items with URLs
    const lines = markdown.split('\n');
    let currentNetwork: 'mainnet' | 'testnet' | 'localnet' = 'mainnet';
    
    for (const line of lines) {
      // Detect network sections
      if (line.toLowerCase().includes('mainnet') && line.match(/^#{1,3}\s/)) {
        currentNetwork = 'mainnet';
        continue;
      } else if (line.toLowerCase().includes('testnet') && line.match(/^#{1,3}\s/)) {
        currentNetwork = 'testnet';
        continue;
      }
      
      // Extract URLs from markdown links: [Name](url)
      const linkMatch = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        const [, name, url] = linkMatch;
        if (url.startsWith('http') && (url.includes('rpc') || url.includes('near'))) {
          const id = `${currentNetwork}-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
          providers.push({
            id,
            name,
            url,
            network: currentNetwork,
            enabled: false,
            priority: priority++,
          });
        }
      }
      
      // Also check for table format: | Name | URL |
      const tableMatch = line.match(/\|\s*([^|]+)\s*\|\s*(https?:\/\/[^|\s]+)\s*\|/);
      if (tableMatch) {
        const [, name, url] = tableMatch;
        const cleanName = name.trim();
        const cleanUrl = url.trim();
        
        if (cleanUrl.includes('rpc') || cleanUrl.includes('near')) {
          const id = `${currentNetwork}-${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
          providers.push({
            id,
            name: cleanName,
            url: cleanUrl,
            network: currentNetwork,
            enabled: false,
            priority: priority++,
          });
        }
      }
    }
    
    // If parsing failed, return fallback
    return providers.length > 0 ? providers : [...FALLBACK_PROVIDERS];
  }

  // Get all providers for current network only
  getAllProviders(): RpcProvider[] {
    const allProviders = [...this.providers, ...this.customProviders]
      .filter(p => p.network === this.selectedNetwork)
      .sort((a, b) => a.priority - b.priority);
    return allProviders;
  }

  // Get enabled providers for current network
  getEnabledProviders(): RpcProvider[] {
    return this.getAllProviders().filter(p => p.enabled);
  }

  // Get providers by network (across all networks)
  getProvidersByNetwork(network: NetworkType): RpcProvider[] {
    return [...this.providers, ...this.customProviders]
      .filter(p => {
        if (p.isCustom) return false;
        return p.network === network;
      })
      .sort((a, b) => a.priority - b.priority);
  }

  // Add custom provider (optionally specify network, defaults to current network)
  addCustomProvider(name: string, url: string, network?: NetworkType): RpcProvider {
    const id = `custom-${Date.now()}`;
    const provider: RpcProvider = {
      id,
      name,
      url,
      network: network || this.selectedNetwork,
      enabled: true,
      priority: 1000 + this.customProviders.length,
      isCustom: true,
    };
    
    this.customProviders.push(provider);
    this.saveToStorage();
    return provider;
  }

  // Remove custom provider
  removeCustomProvider(id: string): void {
    this.customProviders = this.customProviders.filter(p => p.id !== id);
    this.saveToStorage();
  }

  // Toggle provider enabled status
  toggleProvider(id: string, enabled?: boolean): void {
    const provider = this.getAllProviders().find(p => p.id === id);
    if (provider) {
      provider.enabled = enabled !== undefined ? enabled : !provider.enabled;
      this.saveToStorage();
    }
  }

  // Enable all providers in current network
  enableAllInNetwork(): void {
    this.getAllProviders().forEach(p => p.enabled = true);
    this.saveToStorage();
  }

  // Disable all providers in current network
  disableAllInNetwork(): void {
    this.getAllProviders().forEach(p => p.enabled = false);
    this.saveToStorage();
  }

  // Update provider priority
  updatePriority(id: string, newPriority: number): void {
    const provider = this.getAllProviders().find(p => p.id === id);
    if (provider) {
      provider.priority = newPriority;
      this.saveToStorage();
    }
  }

  // Move provider up/down in priority
  moveProvider(id: string, direction: 'up' | 'down'): void {
    const providers = this.getAllProviders();
    const index = providers.findIndex(p => p.id === id);
    
    if (index === -1) return;
    
    if (direction === 'up' && index > 0) {
      const temp = providers[index].priority;
      providers[index].priority = providers[index - 1].priority;
      providers[index - 1].priority = temp;
    } else if (direction === 'down' && index < providers.length - 1) {
      const temp = providers[index].priority;
      providers[index].priority = providers[index + 1].priority;
      providers[index + 1].priority = temp;
    }
    
    this.saveToStorage();
  }

  // Update health status
  updateHealth(providerId: string, health: Partial<ProviderHealth>): void {
    const current = this.healthStatus.get(providerId) || {
      providerId,
      isHealthy: true,
      lastChecked: Date.now(),
    };
    
    this.healthStatus.set(providerId, {
      ...current,
      ...health,
      lastChecked: Date.now(),
    });
    
    this.notifyListeners();
  }

  // Get health status
  getHealth(providerId: string): ProviderHealth | undefined {
    return this.healthStatus.get(providerId);
  }

  // Test provider connection
  async testProvider(providerId: string): Promise<ProviderHealth> {
    const provider = this.getAllProviders().find(p => p.id === providerId);
    
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }
    
    const startTime = Date.now();
    
    try {
      // Add timeout to prevent hanging on unresponsive providers
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      // Dynamically import rpcProxy to avoid circular dependency
      const { rpcProxy } = await import('./rpcProxy');
      
      const body = JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'status',
        params: [],
      });
      
      const response = await rpcProxy.smartFetch(provider.url, body, controller.signal);
      
      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      const health: ProviderHealth = {
        providerId,
        isHealthy: !data.error,
        lastChecked: Date.now(),
        responseTime,
        error: data.error ? data.error.message : undefined,
      };
      
      this.updateHealth(providerId, health);
      return health;
    } catch (error) {
      const health: ProviderHealth = {
        providerId,
        isHealthy: false,
        lastChecked: Date.now(),
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      
      this.updateHealth(providerId, health);
      return health;
    }
  }

  // Subscribe to changes
  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  // Reset to defaults
  resetToDefaults(): void {
    this.providers = [...FALLBACK_PROVIDERS];
    this.customProviders = [];
    this.selectedNetwork = 'localnet';
    this.saveToStorage();
  }

  // Clear bad provider data (for fixing broken GitHub-parsed URLs)
  clearBadProviders(): void {
    console.log('Clearing bad provider data and resetting to fallback providers');
    
    // Clear localStorage
    localStorage.removeItem(STORAGE_KEY_PROVIDERS);
    localStorage.removeItem(STORAGE_KEY_CUSTOM);
    localStorage.removeItem(STORAGE_KEY_ENABLED);
    
    // Reset to fallback providers
    this.providers = [...FALLBACK_PROVIDERS];
    this.customProviders = [];
    
    // Re-save with clean data
    this.saveToStorage();
    
    console.log('Reset complete - using these providers:', this.providers.map(p => ({ name: p.name, url: p.url })));
  }
}

// Singleton instance
export const providerManager = new ProviderManager();

