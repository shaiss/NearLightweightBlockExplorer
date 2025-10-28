import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { nearRpc, NetworkStatus } from "@/lib/nearRpcFailover";
import { providerManager } from "@/lib/providerManager";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";

export default function Home() {
  const [status, setStatus] = useState<NetworkStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentNetwork, setCurrentNetwork] = useState(providerManager.getSelectedNetwork());
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const networkStatus = await nearRpc.getStatus();
        setStatus(networkStatus);
        setLoading(false);
      } catch (err) {
        let errorMessage = err instanceof Error ? err.message : 'Failed to connect to RPC';
        
        // Check for CORS error
        if (errorMessage.includes('fetch') || errorMessage.includes('Failed to fetch')) {
          errorMessage = 'CORS Error: Cannot connect to RPC endpoint. This may happen when connecting to external RPCs from the browser. Try using a CORS proxy or run the explorer from the same origin.';
        }
        
        setError(errorMessage);
        setLoading(false);
      }
    };

    fetchStatus();

    // Subscribe to network changes
    const unsubscribe = providerManager.subscribe(() => {
      setCurrentNetwork(providerManager.getSelectedNetwork());
    });

    return unsubscribe;
  }, []);

  const goToSettings = () => {
    setLocation('/settings');
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError(null);

    const query = searchQuery.trim();
    if (!query) return;

    // Check if it's a block number (numeric)
    if (/^\d+$/.test(query)) {
      setLocation(`/block/${query}`);
      return;
    }

    // Check if it's a transaction hash (base58 string, typically 44 chars)
    if (query.length >= 40 && /^[A-Za-z0-9]+$/.test(query)) {
      setLocation(`/tx/${query}`);
      return;
    }

    // Otherwise, assume it's a block hash
    setLocation(`/block/${query}`);
  };

  const currentProvider = nearRpc.getCurrentProviderInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background-secondary">
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/">
              <h1 className="text-2xl font-bold text-near-green hover:text-near-cyan transition-colors">NEAR Explorer</h1>
            </Link>
            <div className="hidden md:flex gap-4">
              <Link href="/blocks">
                <Button variant="ghost" className="hover:text-near-green">Blocks</Button>
              </Link>
              <Link href="/transactions">
                <Button variant="ghost" className="hover:text-near-green">Transactions</Button>
              </Link>
              <Link href="/settings">
                <Button variant="ghost" className="hover:text-near-green">Settings</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="container py-12 space-y-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-near-green to-near-cyan bg-clip-text text-transparent">
              NEAR Lightweight Block Explorer
            </h2>
            <p className="text-lg text-foreground-secondary">
              Lightweight explorer for NEAR {currentNetwork.charAt(0).toUpperCase() + currentNetwork.slice(1)}
            </p>
          </div>

          {/* Search Bar */}
          <Card className="shadow-lg border-border bg-card">
            <CardContent className="pt-6">
              <form onSubmit={handleSearch} className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Search by block number, block hash, or transaction hash..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 border-border bg-background"
                  />
                  <Button 
                    type="submit"
                    className="bg-near-green hover:bg-near-cyan text-white"
                  >
                    Search
                  </Button>
                </div>
                {searchError && (
                  <div className="text-sm text-destructive">
                    {searchError}
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-border bg-card">
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Current RPC Provider Display */}
                {currentProvider.provider && (
                  <div>
                    <label className="text-sm font-medium text-foreground">Current RPC Provider</label>
                    <div className="mt-1 p-3 bg-background border border-border rounded-lg flex items-center justify-between">
                      <div>
                        <div className="font-medium text-foreground">{currentProvider.provider.name}</div>
                        <div className="text-xs text-foreground-secondary font-mono">{currentProvider.provider.url}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {currentProvider.health && (
                          <>
                            <span className={`text-xs font-medium ${
                              currentProvider.health.isHealthy ? 'text-near-green' : 'text-red-500'
                            }`}>
                              {currentProvider.health.isHealthy ? '✓ Healthy' : '✗ Unhealthy'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="mt-2">
                      <Button 
                        onClick={goToSettings} 
                        variant="outline" 
                        className="w-full border-near-green text-near-green hover:bg-near-green hover:text-white"
                      >
                        Configure Providers
                      </Button>
                    </div>
                  </div>
                )}

                {loading && (
                  <div className="text-center py-8 text-foreground-secondary">
                    Connecting to RPC...
                  </div>
                )}

                {error && (
                  <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
                    <p className="text-destructive font-medium">Connection Error</p>
                    <p className="text-sm text-destructive/80 mt-1">{error}</p>
                    <div className="text-xs text-destructive/70 mt-2">
                      <p>Make sure:</p>
                      <ul className="list-disc list-inside mt-1">
                        <li>For localnet: Your NEAR node is running on localhost:3030</li>
                        <li>For testnet/mainnet: You have internet connectivity</li>
                        <li>At least one RPC provider is enabled in Settings</li>
                      </ul>
                    </div>
                    <Button 
                      onClick={goToSettings}
                      variant="outline" 
                      className="w-full mt-3 border-destructive text-destructive hover:bg-destructive hover:text-white"
                    >
                      Go to Settings
                    </Button>
                  </div>
                )}

                {status && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-near-green rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-near-green">Connected</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-muted-foreground">Chain ID</div>
                        <div className="font-mono font-medium text-foreground">{status.chain_id}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Latest Block</div>
                        <div className="font-mono font-medium text-foreground">
                          {status.sync_info.latest_block_height}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Version</div>
                        <div className="font-mono text-sm text-foreground">{status.version.version}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Syncing</div>
                        <div className="font-mono text-sm text-foreground">
                          {status.sync_info.syncing ? 'Yes' : 'No'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {status && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/blocks">
                <Card className="hover:shadow-lg transition-all cursor-pointer border-border hover:border-near-green bg-card">
                  <CardContent className="pt-6">
                    <h3 className="text-xl font-bold mb-2 text-near-green">View Blocks</h3>
                    <p className="text-sm text-foreground-secondary">
                      Browse recent blocks and their details
                    </p>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/transactions">
                <Card className="hover:shadow-lg transition-all cursor-pointer border-border hover:border-near-cyan bg-card">
                  <CardContent className="pt-6">
                    <h3 className="text-xl font-bold mb-2 text-near-cyan">View Transactions</h3>
                    <p className="text-sm text-foreground-secondary">
                      Stream recent transactions across blocks
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
