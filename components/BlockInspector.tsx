import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Block, Transaction } from "@/lib/nearRpcFailover";
import { useBlockTransactions } from "@/lib/nearQueries";
import { nearRpc } from "@/lib/nearRpcFailover";
import { useQuery } from "@tanstack/react-query";

interface BlockInspectorProps {
  block: Block | null;
  onClose: () => void;
  onSelectTransaction?: (transaction: Transaction) => void;
}

/**
 * Query key for chunk details
 * Chunks are immutable, so cache forever (staleTime: Infinity)
 */
const createChunkDetailsKey = (blockHeight: number) => [
  "near",
  "blocks",
  blockHeight,
  "chunks",
  "details",
] as const;

export default function BlockInspector({ block, onClose, onSelectTransaction }: BlockInspectorProps) {
  // Fetch transactions for this block from query cache
  const { data: transactions = [], isLoading: txLoading } = useBlockTransactions(block?.header.height || 0);

  // Fetch chunk details
  const { data: chunkDetails = {}, isLoading: chunkLoading } = useQuery({
    queryKey: block ? createChunkDetailsKey(block.header.height) : ["disabled"],
    queryFn: async () => {
      if (!block) return {};

      const details: Record<string, any> = {};
      for (const chunk of block.chunks) {
        try {
          const chunkData = await nearRpc.getChunk(chunk.chunk_hash);
          details[chunk.chunk_hash] = {
            transactions: Array.isArray(chunkData.transactions) ? chunkData.transactions.length : 0,
            receipts: Array.isArray(chunkData.receipts) ? chunkData.receipts.length : 0,
          };
        } catch (err) {
          console.warn(`Failed to fetch chunk details:`, err);
          details[chunk.chunk_hash] = {
            transactions: 0,
            receipts: 0,
          };
        }
      }
      return details;
    },
    enabled: !!block, // Only fetch when block is selected
    staleTime: Infinity, // Chunk data is immutable
    gcTime: 1000 * 60 * 10,
  });

  if (!block) {
    return null;
  }

  return (
    <div className="fixed right-0 top-0 h-full w-full md:w-96 bg-card border-l border-border shadow-lg z-50 overflow-y-auto">
      <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-50">
        <h2 className="text-lg font-bold text-near-green">Block Details</h2>
        <Button
          variant="outline"
          onClick={onClose}
          className="h-8 w-8 p-0 border-border hover:border-near-green hover:text-near-green"
        >
          ✕
        </Button>
      </div>

      <div className="p-4 space-y-4">
        {/* Block Height */}
        <Card className="border-border bg-background-secondary">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Height</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-mono text-lg font-bold text-near-green">#{block.header.height}</div>
          </CardContent>
        </Card>

        {/* Block Hash */}
        <Card className="border-border bg-background-secondary">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Hash</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-mono text-xs break-all bg-muted p-2 rounded text-foreground">
              {block.header.hash}
            </div>
          </CardContent>
        </Card>

        {/* Previous Hash */}
        <Card className="border-border bg-background-secondary">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Previous Hash</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-mono text-xs break-all bg-muted p-2 rounded text-foreground">
              {block.header.prev_hash}
            </div>
          </CardContent>
        </Card>

        {/* Timestamp */}
        <Card className="border-border bg-background-secondary">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Timestamp</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <div className="text-foreground">{nearRpc.formatTimestamp(block.header.timestamp_nanosec)}</div>
              <div className="text-xs text-muted-foreground font-mono">{block.header.timestamp_nanosec}</div>
            </div>
          </CardContent>
        </Card>

        {/* Author */}
        <Card className="border-border bg-background-secondary">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Author (Validator)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-mono text-sm break-all bg-muted p-2 rounded text-foreground">
              {block.author}
            </div>
          </CardContent>
        </Card>

        {/* Gas and Supply */}
        <Card className="border-border bg-background-secondary">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Gas & Supply</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                <div className="text-xs text-muted-foreground font-semibold uppercase">Gas Price</div>
                <div className="font-mono text-foreground">{block.header.gas_price}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground font-semibold uppercase">Total Supply</div>
                <div className="font-mono text-near-green">
                  {nearRpc.formatNear(block.header.total_supply)} NEAR
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chunks */}
        <Card className="border-border bg-background-secondary">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">
              Chunks (<span className="text-near-cyan">{block.chunks.length}</span>)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chunkLoading ? (
              <div className="text-sm text-muted-foreground">Loading chunk details...</div>
            ) : block.chunks.length === 0 ? (
              <div className="text-sm text-muted-foreground">No chunks</div>
            ) : (
              <div className="space-y-2">
                {block.chunks.map((chunk, idx) => {
                  const details = chunkDetails[chunk.chunk_hash];
                  return (
                    <div key={idx} className="border border-border rounded-lg p-3 bg-muted space-y-2">
                      <div className="font-semibold text-sm text-near-green">Chunk {idx}</div>
                      <div className="text-xs space-y-1">
                        <div>
                          <span className="text-muted-foreground">Shard ID:</span>{" "}
                          <span className="font-mono text-foreground">{chunk.shard_id}</span>
                        </div>
                        <div className="font-mono text-xs break-all bg-background p-1 rounded text-foreground">
                          {chunk.chunk_hash}
                        </div>
                        {details && (
                          <>
                            <div>
                              <span className="text-muted-foreground">Transactions:</span>{" "}
                              <span className="font-mono text-near-cyan">{details.transactions}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Receipts:</span>{" "}
                              <span className="font-mono text-near-cyan">{details.receipts}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transactions in Block */}
        <Card className="border-border bg-background-secondary">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">
              Transactions (<span className="text-near-cyan">{transactions.length}</span>)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {txLoading ? (
              <div className="text-sm text-muted-foreground">Loading transactions...</div>
            ) : transactions.length === 0 ? (
              <div className="text-sm text-muted-foreground">No transactions</div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {transactions.map((tx, idx) => (
                  <div
                    key={idx}
                    className="bg-muted p-2 rounded border border-border text-xs cursor-pointer hover:bg-background hover:border-near-green transition-colors"
                    onClick={() => onSelectTransaction?.(tx)}
                  >
                    <div className="font-mono truncate text-foreground" title={tx.hash}>
                      {tx.hash}
                    </div>
                    <div className="text-muted-foreground mt-1">
                      {tx.signer_id} → {tx.receiver_id}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Raw JSON */}
        <Card className="border-border bg-background-secondary">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Raw Block</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-60 border border-border text-foreground">
              {JSON.stringify(block, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
