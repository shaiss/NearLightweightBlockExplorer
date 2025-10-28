import { useState, useEffect } from 'react';
import { providerManager, RpcProvider, ProviderHealth, NetworkType } from '@/lib/providerManager';
import { nearRpc } from '@/lib/nearRpcFailover';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Layout from '@/components/Layout';
import { toast } from '@/lib/toast';
import { useQueryClient } from '@tanstack/react-query';
import { nearKeys } from '@/lib/nearQueries';

export default function Settings() {
  const [providers, setProviders] = useState<RpcProvider[]>([]);
  const [network, setNetwork] = useState<NetworkType>('localnet');
  const [customName, setCustomName] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [customNetwork, setCustomNetwork] = useState<NetworkType>('localnet');
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [healthStatus, setHealthStatus] = useState<Map<string, ProviderHealth>>(new Map());

  // Cache management
  const queryClient = useQueryClient();
  const [cacheStats, setCacheStats] = useState({
    cachedQueries: 0,
    cachedBlocks: 0,
    cachedTransactions: 0,
    estimatedSize: 0,
  });

  // Update cache stats
  useEffect(() => {
    const updateCacheStats = () => {
      const cache = queryClient.getQueryCache();
      const allQueries = cache.getAll();

      let blockQueries = 0;
      let txQueries = 0;

      allQueries.forEach((query) => {
        const key = query.queryKey;
        if (Array.isArray(key)) {
          if (key.includes('blocks')) blockQueries++;
          if (key.includes('transactions')) txQueries++;
        }
      });

      // Rough estimate of size (each query ~1-5KB)
      const estimatedSize = allQueries.length * 3;

      setCacheStats({
        cachedQueries: allQueries.length,
        cachedBlocks: blockQueries,
        cachedTransactions: txQueries,
        estimatedSize,
      });
    };

    updateCacheStats();
    const interval = setInterval(updateCacheStats, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [queryClient]);

  // Load providers
  const loadProviders = () => {
    const currentNetwork = providerManager.getSelectedNetwork();
    setNetwork(currentNetwork);
    setCustomNetwork(currentNetwork);
    setProviders(providerManager.getAllProviders());
  };

  useEffect(() => {
    loadProviders();
    
    // Subscribe to provider changes
    const unsubscribe = providerManager.subscribe(() => {
      loadProviders();
    });
    
    return unsubscribe;
  }, []);

  // Handle network change
  const handleNetworkChange = (newNetwork: NetworkType) => {
    providerManager.setSelectedNetwork(newNetwork);
    loadProviders();
    toast.info(`Switched to ${newNetwork} network`);
  };

  // Handle toggle provider
  const handleToggleProvider = (id: string) => {
    providerManager.toggleProvider(id);
    loadProviders();
  };

  // Handle select all
  const handleSelectAll = () => {
    providerManager.enableAllInNetwork();
    loadProviders();
    toast.success(`Enabled all ${network} providers`);
  };

  // Handle deselect all
  const handleDeselectAll = () => {
    providerManager.disableAllInNetwork();
    loadProviders();
    toast.success(`Disabled all ${network} providers`);
  };

  // Handle add custom provider
  const handleAddCustom = () => {
    if (!customName.trim() || !customUrl.trim()) {
      toast.error('Please enter both name and URL');
      return;
    }

    if (!customUrl.startsWith('http://') && !customUrl.startsWith('https://')) {
      toast.error('URL must start with http:// or https://');
      return;
    }

    providerManager.addCustomProvider(customName.trim(), customUrl.trim(), customNetwork);
    setCustomName('');
    setCustomUrl('');
    loadProviders();
    toast.success(`Added custom provider: ${customName} for ${customNetwork}`);
  };

  // Handle remove custom provider
  const handleRemoveCustom = (id: string) => {
    providerManager.removeCustomProvider(id);
    loadProviders();
    toast.success('Removed custom provider');
  };

  // Handle test provider
  const handleTestProvider = async (id: string) => {
    setTestingProvider(id);
    try {
      const health = await providerManager.testProvider(id);
      setHealthStatus(new Map(healthStatus.set(id, health)));
      
      if (health.isHealthy) {
        toast.success(`Provider is healthy (${health.responseTime}ms)`);
      } else {
        toast.error(`Provider failed: ${health.error}`);
      }
    } catch (error) {
      toast.error(`Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setTestingProvider(null);
    }
  };

  // Handle move provider
  const handleMoveProvider = (id: string, direction: 'up' | 'down') => {
    providerManager.moveProvider(id, direction);
    loadProviders();
  };

  // Handle reset to defaults
  const handleResetToDefaults = () => {
    if (confirm('Are you sure you want to reset to default providers? This will remove all custom providers.')) {
      providerManager.resetToDefaults();
      loadProviders();
      toast.success('Reset to default providers');
    }
  };

  // Cache management handlers
  const handleClearAllCache = () => {
    if (confirm('Are you sure you want to clear ALL cached data? This will force a full reload of blocks and transactions.')) {
      queryClient.clear();
      setCacheStats({ cachedQueries: 0, cachedBlocks: 0, cachedTransactions: 0, estimatedSize: 0 });
      toast.success('All cache cleared');
    }
  };

  const handleClearBlocks = () => {
    queryClient.removeQueries({ queryKey: nearKeys.blocks() });
    toast.success('Block cache cleared');
  };

  const handleClearTransactions = () => {
    queryClient.removeQueries({ queryKey: nearKeys.transactions() });
    toast.success('Transaction cache cleared');
  };

  // Get current provider info
  const currentProviderInfo = nearRpc.getCurrentProviderInfo();

  // Filter enabled count
  const enabledCount = providers.filter(p => p.enabled).length;

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-near-green to-near-cyan bg-clip-text text-transparent">
              Settings
            </h1>
            <p className="text-foreground-secondary mt-2">
              Configure RPC providers, cache management, and explorer settings
            </p>
          </div>
        </div>

        {/* Cache Management Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-near-cyan">Cache Management</h2>

          {/* Cache Statistics */}
          <Card className="border-2 border-near-cyan/30 bg-near-cyan/5">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground font-semibold uppercase mb-1">Total Queries</div>
                  <div className="text-2xl font-bold text-near-cyan">{cacheStats.cachedQueries}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-semibold uppercase mb-1">Blocks Cached</div>
                  <div className="text-2xl font-bold text-near-green">{cacheStats.cachedBlocks}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-semibold uppercase mb-1">Transactions</div>
                  <div className="text-2xl font-bold text-near-green">{cacheStats.cachedTransactions}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-semibold uppercase mb-1">Est. Size</div>
                  <div className="text-2xl font-bold text-near-purple">{cacheStats.estimatedSize} KB</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cache Information */}
          <Card className="border-border bg-card p-4">
            <h3 className="font-semibold text-near-cyan mb-3">About Cache</h3>
            <ul className="text-sm space-y-2 text-foreground-secondary">
              <li>• Cache persists across page refreshes within the same browser session</li>
              <li>• Automatically cleared when you close the browser tab</li>
              <li>• Unused data is automatically removed after 10 minutes</li>
              <li>• Block data is immutable - never revalidated once cached</li>
              <li>• Transaction data is refreshed every 3 seconds for latest blockchain state</li>
            </ul>
          </Card>

          {/* Cache Control Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              onClick={handleClearAllCache}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Clear All Cache
            </Button>
            <Button
              onClick={handleClearBlocks}
              variant="outline"
              className="border-near-green text-near-green hover:bg-near-green hover:text-white"
            >
              Clear Blocks Only
            </Button>
            <Button
              onClick={handleClearTransactions}
              variant="outline"
              className="border-near-cyan text-near-cyan hover:bg-near-cyan hover:text-white"
            >
              Clear Transactions Only
            </Button>
          </div>
        </div>

        {/* RPC Provider Settings Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-near-green">RPC Provider Settings</h2>

          {/* Network Selector Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(['localnet', 'testnet', 'mainnet'] as NetworkType[]).map((net) => (
              <button
                key={net}
                onClick={() => handleNetworkChange(net)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  network === net
                    ? 'border-near-green bg-near-green/10'
                    : 'border-border hover:border-near-green bg-card'
                }`}
              >
                <div className={`font-semibold capitalize ${network === net ? 'text-near-green' : 'text-foreground'}`}>
                  {net}
                </div>
                <div className="text-xs text-foreground-secondary mt-1">
                  {net === 'localnet' ? 'Local Development' : net === 'testnet' ? 'NEAR Testnet' : 'NEAR Mainnet'}
                </div>
              </button>
            ))}
          </div>

          {/* Current Provider Status */}
          {currentProviderInfo.provider && (
            <Card className="border-2 border-near-green/30 bg-near-green/5">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-near-green mb-2">Current Active Provider</h3>
                    <div className="font-medium text-foreground">{currentProviderInfo.provider.name}</div>
                    <div className="text-sm text-foreground-secondary font-mono mt-1">
                      {currentProviderInfo.provider.url}
                    </div>
                  </div>
                  {currentProviderInfo.health && (
                    <div className={`px-4 py-2 rounded-lg font-medium ${
                      currentProviderInfo.health.isHealthy 
                        ? 'bg-near-green/20 text-near-green' 
                        : 'bg-red-500/20 text-red-500'
                    }`}>
                      {currentProviderInfo.health.isHealthy ? '✓ Healthy' : '✗ Unhealthy'}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Providers List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-near-green">Available Providers</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={enabledCount === providers.length}
                  className="border-near-green text-near-green hover:bg-near-green hover:text-white"
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeselectAll}
                  disabled={enabledCount === 0}
                  className="border-near-green text-near-green hover:bg-near-green hover:text-white"
                >
                  Deselect All
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {providers.length === 0 ? (
                <Card className="p-4 text-center text-foreground-secondary border-border">
                  No providers configured for {network.toUpperCase()} network
                </Card>
              ) : (
                providers.map((provider, index) => {
                  const health = healthStatus.get(provider.id) || providerManager.getHealth(provider.id);
                  const isCurrent = currentProviderInfo.provider?.id === provider.id;
                  const isTesting = testingProvider === provider.id;

                  return (
                    <Card key={provider.id} className={`p-4 border-border transition-all ${
                      isCurrent ? 'border-2 border-near-green bg-near-green/5' : 'hover:border-near-green/50'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <input
                            type="checkbox"
                            checked={provider.enabled}
                            onChange={() => handleToggleProvider(provider.id)}
                            className="w-4 h-4 cursor-pointer accent-near-green"
                          />
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">{provider.name}</span>
                              {isCurrent && (
                                <span className="text-xs bg-near-green text-white px-2 py-0.5 rounded">
                                  Current
                                </span>
                              )}
                              {health && (
                                <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                                  health.isHealthy 
                                    ? 'bg-near-green/20 text-near-green' 
                                    : 'bg-red-500/20 text-red-500'
                                }`}>
                                  {health.isHealthy 
                                    ? `✓ ${health.responseTime}ms` 
                                    : '✗ Failed'}
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-foreground-secondary mt-1 font-mono">
                              {provider.url}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Priority controls */}
                          <div className="flex flex-col gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMoveProvider(provider.id, 'up')}
                              disabled={index === 0}
                              className="h-6 px-2 text-near-green border-near-green hover:bg-near-green hover:text-white"
                            >
                              ↑
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMoveProvider(provider.id, 'down')}
                              disabled={index === providers.length - 1}
                              className="h-6 px-2 text-near-green border-near-green hover:bg-near-green hover:text-white"
                            >
                              ↓
                            </Button>
                          </div>

                          {/* Test button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTestProvider(provider.id)}
                            disabled={isTesting}
                            className="border-near-green text-near-green hover:bg-near-green hover:text-white"
                          >
                            {isTesting ? 'Testing...' : 'Test'}
                          </Button>

                          {/* Remove button for custom providers */}
                          {provider.isCustom && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveCustom(provider.id)}
                              className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </div>

          {/* Add Custom Provider */}
          <Card className="border-2 border-near-cyan/30 bg-near-cyan/5 p-4">
            <h3 className="text-lg font-semibold text-near-cyan mb-4">Add Custom Provider</h3>
            
            {/* Network Selector for Custom Provider */}
            <div className="mb-4">
              <label className="text-sm font-medium text-foreground mb-2 block">Select Network for Custom Provider</label>
              <div className="grid grid-cols-3 gap-2">
                {(['localnet', 'testnet', 'mainnet'] as NetworkType[]).map((net) => (
                  <button
                    key={net}
                    onClick={() => setCustomNetwork(net)}
                    className={`p-2 rounded-lg border-2 transition-all text-sm ${
                      customNetwork === net
                        ? 'border-near-cyan bg-near-cyan/20 text-near-cyan font-semibold'
                        : 'border-border hover:border-near-cyan bg-card text-foreground'
                    }`}
                  >
                    {net.charAt(0).toUpperCase() + net.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Input
                placeholder="Provider Name"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="flex-1 border-border bg-background"
              />
              <Input
                placeholder={`RPC URL (e.g., http://localhost:3030 for localnet)`}
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                className="flex-1 border-border bg-background"
              />
              <Button 
                onClick={handleAddCustom}
                className="bg-near-cyan hover:bg-near-cyan/80 text-white"
              >
                Add
              </Button>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleResetToDefaults}
              variant="outline"
              className="flex-1 border-near-purple text-near-purple hover:bg-near-purple hover:text-white"
            >
              Reset to Default Providers
            </Button>
          </div>

          {/* Info Card */}
          <Card className="border-2 border-near-purple/30 bg-near-purple/5 p-4">
            <h3 className="font-semibold text-near-purple mb-3">About Failover</h3>
            <ul className="text-sm space-y-2 text-foreground-secondary">
              <li>• You are currently using the <strong className="text-near-green">{network.toUpperCase()}</strong> network</li>
              <li>• Only providers for this network are shown above</li>
              <li>• Enabled providers are automatically tried in priority order</li>
              <li>• Each provider is retried 3 times with exponential backoff (100ms, 300ms, 900ms)</li>
              <li>• Failover only occurs on network/connection errors, not RPC errors</li>
              <li>• Use ↑↓ buttons to adjust provider priority</li>
              <li>• At least one provider must be enabled for the explorer to work</li>
            </ul>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

