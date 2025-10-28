import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Layout from "@/components/Layout";
import { Block, nearRpc } from "@/lib/nearRpc";
import { useEffect, useState } from "react";
import { Link } from "wouter";

export default function BlockList() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [latestHeight, setLatestHeight] = useState<number>(0);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchBlocks = async () => {
    try {
      setError(null);
      const latestBlock = await nearRpc.getLatestBlock();
      setLatestHeight(latestBlock.header.height);
      
      // Fetch last 20 blocks
      const blockPromises: Promise<Block>[] = [];
      const startHeight = Math.max(0, latestBlock.header.height - 19);
      
      for (let i = latestBlock.header.height; i >= startHeight; i--) {
        blockPromises.push(nearRpc.getBlock(i));
      }
      
      const fetchedBlocks = await Promise.all(blockPromises);
      setBlocks(fetchedBlocks);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch blocks');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlocks();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchBlocks();
    }, 3000);
    
    return () => clearInterval(interval);
  }, [autoRefresh]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading blocks...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-lg text-destructive">Error: {error}</div>
        <Button onClick={fetchBlocks}>Retry</Button>
      </div>
    );
  }

  return (
    <Layout>
      <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Latest Blocks</h2>
          <p className="text-sm text-muted-foreground">
            Latest block height: {latestHeight}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
          </Button>
          <Button onClick={fetchBlocks} variant="outline">
            Refresh
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {blocks.map((block) => (
          <Link key={block.header.hash} href={`/block/${block.header.height}`}>
            <Card className="p-4 hover:bg-accent cursor-pointer transition-colors">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Height</div>
                  <div className="font-mono font-semibold">
                    {block.header.height}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-sm text-muted-foreground">Hash</div>
                  <div className="font-mono text-sm truncate">
                    {block.header.hash}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Time</div>
                  <div className="text-sm">
                    {nearRpc.formatTimestamp(block.header.timestamp_nanosec)}
                  </div>
                </div>
              </div>
              <div className="mt-2 flex gap-4 text-sm">
                <span className="text-muted-foreground">
                  Chunks: {block.chunks.length}
                </span>
                <span className="text-muted-foreground">
                  Author: {block.author}
                </span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
    </Layout>
  );
}

