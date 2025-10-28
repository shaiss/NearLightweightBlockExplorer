import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Layout from "@/components/Layout";
import BlockInspector from "@/components/BlockInspector";
import TransactionInspector from "@/components/TransactionInspector";
import { Block, Transaction } from "@/lib/nearRpcFailover";
import { useState } from "react";
import { useLatestBlock, useRecentBlocks, useBlockTransactionCounts } from "@/lib/nearQueries";
import { nearRpc } from "@/lib/nearRpcFailover";

// Extended Block type with transaction count
interface BlockWithTxCount extends Block {
  transactionCount?: number;
}

export default function BlockList() {
  // UI state - kept local (not data fetching state)
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [hideZeroTxBlocks, setHideZeroTxBlocks] = useState(false);

  // Data fetching with query hooks - automatic caching, deduplication, background refetch
  const { data: latestBlock, error: latestError, isLoading: latestLoading } = useLatestBlock(3000);

  // Get last 20 blocks
  const {
    data: blocks,
    isLoading: blocksLoading,
    error: blocksError,
    isFetching: blocksFetching,
  } = useRecentBlocks(20);

  // Get transaction counts for all blocks in parallel
  const blockHeights = blocks.map((b) => b.header.height);
  const { data: txCounts, isLoading: txCountsLoading } = useBlockTransactionCounts(blockHeights);

  // Merge blocks with transaction counts
  const blocksWithCounts: BlockWithTxCount[] = blocks.map((block) => ({
    ...block,
    transactionCount: txCounts[block.header.height] || 0,
  }));

  // Determine loading/error states
  const isLoading = latestLoading || blocksLoading || txCountsLoading;
  const error = latestError || blocksError;

  if (isLoading && blocks.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-foreground">Loading blocks...</div>
      </div>
    );
  }

  if (error && blocks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-lg text-destructive">
          Error: {error instanceof Error ? error.message : 'Failed to load blocks'}
        </div>
        <Button
          onClick={() => window.location.reload()}
          className="bg-near-green hover:bg-near-cyan text-white"
        >
          Retry
        </Button>
      </div>
    );
  }

  // Filter blocks based on hideZeroTxBlocks setting
  const filteredBlocks = hideZeroTxBlocks
    ? blocksWithCounts.filter((block) => (block.transactionCount ?? 0) > 0)
    : blocksWithCounts;

  const totalTxCount = blocksWithCounts.reduce((sum, block) => sum + (block.transactionCount ?? 0), 0);
  const latestHeight = latestBlock?.header.height || 0;

  return (
    <Layout>
      <div className="flex gap-4">
        {/* Main content area */}
        <div className="flex-1 space-y-4 pr-4 md:pr-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-near-green">Latest Blocks</h2>
              <p className="text-sm text-muted-foreground">
                Latest block height: <span className="text-near-cyan font-mono">{latestHeight}</span> •{" "}
                <span className="text-near-green">{totalTxCount}</span> transactions
                {blocksFetching && <span className="text-xs text-muted-foreground ml-2">(auto-refreshing...)</span>}
              </p>
            </div>
          </div>

          <div className="flex gap-2 items-center">
            <Button
              variant={hideZeroTxBlocks ? "default" : "outline"}
              onClick={() => setHideZeroTxBlocks(!hideZeroTxBlocks)}
              className={
                hideZeroTxBlocks
                  ? "bg-near-cyan hover:bg-near-green text-white"
                  : "border-border hover:border-near-cyan hover:text-near-cyan"
              }
            >
              {hideZeroTxBlocks ? "Showing blocks with transactions" : "Show all blocks"}
            </Button>
            {hideZeroTxBlocks && (
              <span className="text-sm text-muted-foreground">
                Hiding {blocksWithCounts.length - filteredBlocks.length} blocks with 0 transactions
              </span>
            )}
          </div>

          <div className="space-y-2">
            {filteredBlocks.map((block) => (
              <Card
                key={block.header.hash}
                className="p-4 hover:bg-muted cursor-pointer transition-all border-border hover:border-near-green bg-card"
                onClick={() => setSelectedBlock(block)}
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Height</div>
                    <div className="font-mono font-semibold text-near-green">{block.header.height}</div>
                  </div>
                  <div className="md:col-span-2">
                    <div className="text-sm text-muted-foreground">Hash</div>
                    <div className="font-mono text-sm truncate text-foreground">{block.header.hash}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Time</div>
                    <div className="text-sm text-foreground">
                      {nearRpc.formatTimestamp(block.header.timestamp_nanosec)}
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex gap-4 text-sm">
                  <span className="text-muted-foreground">
                    Chunks: <span className="text-near-cyan">{block.chunks.length}</span>
                  </span>
                  <span className="text-muted-foreground">
                    Transactions:{" "}
                    <span
                      className={`font-semibold ${
                        (block.transactionCount ?? 0) > 0 ? "text-near-green" : "text-muted-foreground"
                      }`}
                    >
                      {block.transactionCount ?? 0}
                    </span>
                  </span>
                  <span className="text-muted-foreground">
                    Author: <span className="text-foreground font-mono">{block.author}</span>
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Block Inspector Sidebar */}
      {!selectedTransaction ? (
        <BlockInspector
          block={selectedBlock}
          onClose={() => setSelectedBlock(null)}
          onSelectTransaction={setSelectedTransaction}
        />
      ) : (
        <TransactionInspector
          transaction={selectedTransaction}
          onClose={() => {
            setSelectedTransaction(null);
            setSelectedBlock(null);
          }}
          onBack={() => setSelectedTransaction(null)}
        />
      )}
    </Layout>
  );
}

