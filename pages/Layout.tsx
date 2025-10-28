import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { nearRpc } from "@/lib/nearRpcFailover";
import { providerManager, NetworkType } from "@/lib/providerManager";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [providerInfo, setProviderInfo] = useState<{ name: string; url: string; healthy?: boolean } | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkType>('localnet');
  const [showNetworkMenu, setShowNetworkMenu] = useState(false);

  useEffect(() => {
    // Get initial provider info
    const updateProviderInfo = () => {
      const info = nearRpc.getCurrentProviderInfo();
      if (info.provider) {
        setProviderInfo({
          name: info.provider.name,
          url: info.provider.url,
          healthy: info.health?.isHealthy,
        });
      }
    };

    const updateNetwork = () => {
      setSelectedNetwork(providerManager.getSelectedNetwork());
    };

    updateProviderInfo();
    updateNetwork();

    // Listen for provider switches
    const unsubscribe = nearRpc.onFailoverEvent((event) => {
      if (event.type === 'provider-switch' || event.type === 'success') {
        updateProviderInfo();
      }
    });

    // Listen for network changes
    const unsubscribeNetwork = providerManager.subscribe(() => {
      updateNetwork();
    });

    return () => {
      unsubscribe();
      unsubscribeNetwork();
    };
  }, []);

  const handleNetworkChange = (network: NetworkType) => {
    providerManager.setSelectedNetwork(network);
    setSelectedNetwork(network);
    setShowNetworkMenu(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/">
              <h1 className="text-2xl font-bold text-slate-900 cursor-pointer hover:text-slate-700 transition-colors">
                NEAR Localnet Explorer
              </h1>
            </Link>
            <div className="hidden md:flex gap-4">
              <Link href="/blocks">
                <Button variant="ghost">Blocks</Button>
              </Link>
              <Link href="/search">
                <Button variant="ghost">Search</Button>
              </Link>
              <Link href="/settings">
                <Button variant="ghost">Settings</Button>
              </Link>
            </div>
          </div>

          {/* Network Selector */}
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setShowNetworkMenu(!showNetworkMenu)}
              className="flex items-center gap-2"
            >
              <span className="text-sm font-medium capitalize">{selectedNetwork}</span>
              <span className="text-xs">▼</span>
            </Button>

            {showNetworkMenu && (
              <div className="absolute right-0 mt-2 w-40 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
                <button
                  onClick={() => handleNetworkChange('mainnet')}
                  className={`w-full text-left px-4 py-2 hover:bg-slate-100 transition-colors ${
                    selectedNetwork === 'mainnet' ? 'bg-blue-50 font-semibold text-blue-900' : ''
                  }`}
                >
                  Mainnet
                </button>
                <button
                  onClick={() => handleNetworkChange('testnet')}
                  className={`w-full text-left px-4 py-2 hover:bg-slate-100 transition-colors border-t border-slate-200 ${
                    selectedNetwork === 'testnet' ? 'bg-blue-50 font-semibold text-blue-900' : ''
                  }`}
                >
                  Testnet
                </button>
                <button
                  onClick={() => handleNetworkChange('localnet')}
                  className={`w-full text-left px-4 py-2 hover:bg-slate-100 transition-colors border-t border-slate-200 ${
                    selectedNetwork === 'localnet' ? 'bg-blue-50 font-semibold text-blue-900' : ''
                  }`}
                >
                  Localnet
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="container py-8">
        {children}
      </main>

      <footer className="border-t bg-white/80 backdrop-blur-sm mt-auto">
        <div className="container py-6">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <p>NEAR Lightweight Block Explorer - Lightweight RPC-based explorer for development</p>
            {providerInfo && (
              <div className="flex items-center gap-2">
                <span className="text-xs">RPC:</span>
                <span className="font-medium">{providerInfo.name}</span>
                {providerInfo.healthy !== undefined && (
                  <span className={`w-2 h-2 rounded-full ${providerInfo.healthy ? 'bg-green-500' : 'bg-red-500'}`} 
                        title={providerInfo.healthy ? 'Healthy' : 'Unhealthy'} />
                )}
              </div>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

