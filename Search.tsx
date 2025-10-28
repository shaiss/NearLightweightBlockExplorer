import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Layout from "@/components/Layout";
import { nearRpc } from "@/lib/nearRpc";
import { useState } from "react";
import { useLocation } from "wouter";

export default function Search() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Try as block height first
      if (/^\d+$/.test(query)) {
        setLocation(`/block/${query}`);
        return;
      }

      // Try as block hash
      if (query.length === 44) {
        try {
          const block = await nearRpc.getBlock(query);
          setLocation(`/block/${block.header.height}`);
          return;
        } catch {
          // Not a block hash, continue
        }
      }

      // Try as account
      try {
        const account = await nearRpc.getAccount(query);
        setResult({ type: 'account', data: account, accountId: query });
      } catch (err) {
        setError('Not found. Try a block height, block hash, or account ID.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Search</h1>
        <p className="text-muted-foreground">
          Search by block height, block hash, or account ID
        </p>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Enter block height, hash, or account ID..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1"
        />
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </Button>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {result && result.type === 'account' && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <h3 className="text-xl font-bold mb-4">Account Information</h3>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">Account ID</div>
              <div className="font-mono">{result.accountId}</div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">Balance</div>
              <div className="font-mono text-lg">
                {nearRpc.formatNear(result.data.amount)} NEAR
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">Locked</div>
              <div className="font-mono">
                {nearRpc.formatNear(result.data.locked)} NEAR
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Storage Usage</div>
                <div className="font-mono">{result.data.storage_usage} bytes</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Block Height</div>
                <div className="font-mono">{result.data.block_height}</div>
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">Code Hash</div>
              <div className="font-mono text-sm break-all">
                {result.data.code_hash}
              </div>
            </div>
          </CardContent>
        </Card>
      )}  
    </div>
    </Layout>
  );
}