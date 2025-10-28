import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from "@/components/Layout";
import { Block, nearRpc } from "@/lib/nearRpc";
import { useEffect, useState } from "react";
import { Link, useParams, useLocation } from "wouter";

export default function BlockDetail() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [block, setBlock] = useState<Block | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlock = async () => {
      try {
        setLoading(true);
        setError(null);
        const blockId = params.id;
        const fetchedBlock = isNaN(Number(blockId))
          ? await nearRpc.getBlock(blockId)
          : await nearRpc.getBlock(Number(blockId));
        setBlock(fetchedBlock);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch block');
        setLoading(false);
      }
    };

    if (params.id) {
      fetchBlock();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading block...</div>
      </div>
    );
  }

  if (error || !block) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-lg text-destructive">
          Error: {error || 'Block not found'}
        </div>
        <Link href="/blocks">
          <Button>Back to Blocks</Button>
        </Link>
      </div>
    );
  }

  return (
    <Layout>
      <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Link href="/blocks">
          <Button variant="outline">← Back</Button>
        </Link>
        <h1 className="text-3xl font-bold">Block #{block.header.height}</h1>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Block Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Height</div>
                <div className="font-mono font-semibold">{block.header.height}</div>
              </div>
              <div className="md:col-span-2">
                <div className="text-sm text-muted-foreground">Timestamp</div>
                <div>{nearRpc.formatTimestamp(block.header.timestamp_nanosec)}</div>
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">Hash</div>
              <div className="font-mono text-sm break-all">{block.header.hash}</div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">Previous Hash</div>
              <div className="font-mono text-sm break-all">{block.header.prev_hash}</div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">Author</div>
              <div className="font-mono">{block.author}</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Gas Price</div>
                <div className="font-mono">{block.header.gas_price}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Supply</div>
                <div className="font-mono">
                  {nearRpc.formatNear(block.header.total_supply)} NEAR
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Chunks ({block.chunks.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {block.chunks.length === 0 ? (
              <div className="text-muted-foreground">No chunks in this block</div>
            ) : (
              <div className="space-y-2">
                {block.chunks.map((chunk, idx) => (
                  <div
                    key={idx}
                    className="p-3 border rounded-lg space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Chunk {idx}</span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {chunk.chunk_hash}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Shard: {chunk.shard_id}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-2">
          {block.header.height > 0 && (
            <Button
              variant="outline"
              onClick={() => setLocation(`/block/${block.header.height - 1}`)}
            >
              ← Previous Block
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setLocation(`/block/${block.header.height + 1}`)}
          >
            Next Block →
          </Button>
        </div>
      </div>
    </div>
    </Layout>
  );
}

