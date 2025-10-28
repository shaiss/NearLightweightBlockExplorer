import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { nearRpc, NetworkStatus } from "@/lib/nearRpc";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";

export default function Home() {
  const [status, setStatus] = useState<NetworkStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [rpcUrl, setRpcUrl] = useState(nearRpc.getRpcUrl());
  const [, setLocation] = useLocation();

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
  }, []);

  const handleRpcUrlChange = () => {
    if (!rpcUrl.trim()) {
      setError('Please enter a valid RPC URL');
      return;
    }
    
    nearRpc.setRpcUrl(rpcUrl);
    setLoading(true);
    setError(null);
    setStatus(null);
    window.location.reload();
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setLocation(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <nav className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/">
              <h1 className="text-2xl font-bold text-slate-900">NEAR Localnet Explorer</h1>
            </Link>
            <div className="hidden md:flex gap-4">
              <Link href="/blocks">
                <Button variant="ghost">Blocks</Button>
              </Link>
              <Link href="/search">
                <Button variant="ghost">Search</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="container py-12 space-y-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold text-slate-900">NEAR Localnet Block Explorer</h2>
            <p className="text-lg text-slate-600">
              Lightweight explorer for your NEAR localnet development environment
            </p>
          </div>

          <Card className="shadow-lg">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">RPC Endpoint</label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={rpcUrl}
                      onChange={(e) => setRpcUrl(e.target.value)}
                      placeholder="http://localhost:3030"
                    />
                    <Button onClick={handleRpcUrlChange} variant="outline">
                      Update
                    </Button>
                  </div>
                </div>

                {loading && (
                  <div className="text-center py-8 text-slate-600">
                    Connecting to RPC...
                  </div>
                )}

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 font-medium">Connection Error</p>
                    <p className="text-sm text-red-600 mt-1">{error}</p>
                    <p className="text-xs text-red-500 mt-2">
                      Make sure your NEAR localnet node is running at {rpcUrl}
                    </p>
                  </div>
                )}

                {status && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-green-700">Connected</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-slate-500">Chain ID</div>
                        <div className="font-mono font-medium">{status.chain_id}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Latest Block</div>
                        <div className="font-mono font-medium">
                          {status.sync_info.latest_block_height}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Version</div>
                        <div className="font-mono text-sm">{status.version.version}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Syncing</div>
                        <div className="font-mono text-sm">
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
            <>
              <div className="flex gap-2">
                <Input
                  placeholder="Search by block height, hash, or account..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1"
                />
                <Button onClick={handleSearch}>Search</Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/blocks">
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="pt-6">
                      <h3 className="text-xl font-bold mb-2">View Blocks</h3>
                      <p className="text-sm text-slate-600">
                        Browse recent blocks and their details
                      </p>
                    </CardContent>
                  </Card>
                </Link>
                <Link href="/search">
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="pt-6">
                      <h3 className="text-xl font-bold mb-2">Search</h3>
                      <p className="text-sm text-slate-600">
                        Look up blocks, transactions, and accounts
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
