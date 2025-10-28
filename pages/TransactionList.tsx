import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Layout from "@/components/Layout";
import TransactionInspector from "@/components/TransactionInspector";
import { Transaction } from "@/lib/nearRpcFailover";
import { useEffect, useState, useRef } from "react";
import { Link } from "wouter";
import { useLatestBlock } from "@/lib/nearQueries";
import { nearRpc } from "@/lib/nearRpcFailover";
import { useQueryClient } from "@tanstack/react-query";
import { nearKeys } from "@/lib/nearQueries";

export default function TransactionList() {
  // UI state - kept local
  const [accountFilter, setAccountFilter] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [lastProcessedHeight, setLastProcessedHeight] = useState<number>(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Query client for direct cache manipulation during incremental loads
  const queryClient = useQueryClient();

  // Auto-refresh latest block every 3 seconds
  const { data: latestBlock, isLoading: latestLoading, error: latestError } = useLatestBlock(3000);

  // Get transactions from cache early so useEffect can reference it
  const allTransactions = queryClient.getQueryData<Transaction[]>(nearKeys.recentTransactions()) || [];
  const transactions = allTransactions;
  const latestHeight = latestBlock?.header.height || 0;
  const isLoading = latestLoading && transactions.length === 0;
  const error = latestError;

  // Helper function to get a readable action type
  const getActionType = (action: any): string => {
    const actionKeys = Object.keys(action);
    if (actionKeys.length === 0) return "Unknown";

    const actionType = actionKeys[0];
    return actionType
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  // Helper function to format action details
  const formatActionDetails = (action: any): string => {
    const actionKeys = Object.keys(action);
    if (actionKeys.length === 0) return "";

    const actionType = actionKeys[0];
    const actionData = action[actionType];

    if (actionType === "Transfer") {
      const amount = nearRpc.formatNear(actionData.deposit || "0");
      return `${amount} NEAR`;
    } else if (actionType === "FunctionCall") {
      return `${actionData.method_name}()`;
    } else if (actionType === "CreateAccount") {
      return "New account";
    } else if (actionType === "AddKey") {
      return "Add access key";
    } else if (actionType === "DeleteKey") {
      return "Delete access key";
    } else if (actionType === "DeployContract") {
      return "Deploy contract";
    } else if (actionType === "Stake") {
      const amount = nearRpc.formatNear(actionData.stake || "0");
      return `Stake ${amount} NEAR`;
    } else if (actionType === "DeleteAccount") {
      return `Delete account → ${actionData.beneficiary_id || ""}`;
    }

    return "";
  };

  // Filter transactions by account (client-side on cached data)
  const filteredTransactions = accountFilter
    ? allTransactions.filter(
        (tx) =>
          tx.signer_id.toLowerCase().includes(accountFilter.toLowerCase()) ||
          tx.receiver_id.toLowerCase().includes(accountFilter.toLowerCase())
      )
    : allTransactions;

  // Initial load - fetch last 20 blocks when latestBlock first becomes available
  useEffect(() => {
    if (!latestBlock || initialLoadDone) return;

    const startHeight = Math.max(0, latestBlock.header.height - 19);
    setLastProcessedHeight(latestBlock.header.height);
    setInitialLoadDone(true);

    // Initialize empty transactions in cache
    const existingTransactions = queryClient.getQueryData<Transaction[]>(nearKeys.recentTransactions());
    if (!existingTransactions) {
      queryClient.setQueryData(nearKeys.recentTransactions(), []);
    }

    // Fetch and merge transactions from initial 20 blocks
    fetchAndMergeTransactions(startHeight, latestBlock.header.height);
  }, [latestBlock, initialLoadDone]);

  // Incremental updates - fetch new blocks every time latestBlock height increases
  useEffect(() => {
    if (!latestBlock || !initialLoadDone || latestBlock.header.height <= lastProcessedHeight) {
      return;
    }

    // Save scroll position before new data arrives
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }

    const startHeight = lastProcessedHeight + 1;
    const endHeight = latestBlock.header.height;

    fetchAndMergeTransactions(startHeight, endHeight);
  }, [latestBlock?.header.height, initialLoadDone]);

  // Restore scroll position after new data is rendered
  useEffect(() => {
    if (containerRef.current && scrollTop > 0) {
      containerRef.current.scrollTop = scrollTop;
    }
  }, [transactions]);

  const handleScroll = () => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  };

  /**
   * Fetch transactions from a range of blocks and merge with cache
   * This implements the incremental loading pattern:
   * - On initial load: fetch blocks [height-19 to height]
   * - On updates: fetch only [lastProcessedHeight+1 to newHeight]
   */
  const fetchAndMergeTransactions = async (from: number, to: number) => {
    try {
      const blockPromises: Promise<any>[] = [];

      // Fetch blocks in reverse order (newest first)
      for (let i = to; i >= from; i--) {
        blockPromises.push(nearRpc.getBlock(i));
      }

      const newBlocks = await Promise.all(blockPromises);

      // Extract transactions from all blocks
      const newTransactions: Transaction[] = [];
      for (const block of newBlocks) {
        const blockTransactions = await nearRpc.getTransactionsFromBlock(block);
        newTransactions.push(...blockTransactions);
      }

      // Sort by block height (newest first)
      newTransactions.sort((a, b) => {
        if (a.block_height !== b.block_height) {
          return b.block_height - a.block_height;
        }
        return 0;
      });

      // Merge with existing cache
      queryClient.setQueryData(nearKeys.recentTransactions(), (oldTransactions: Transaction[] | undefined) => {
        const combined = [...newTransactions, ...(oldTransactions || [])];

        // Deduplicate by transaction hash
        const unique = Array.from(new Map(combined.map((tx) => [tx.hash, tx])).values());

        // Keep most recent 200 transactions to prevent memory bloat
        return unique.slice(0, 200);
      });

      setLastProcessedHeight(to);
    } catch (err) {
      console.error(`Failed to fetch transactions from blocks ${from}-${to}:`, err);
      // Don't throw - let the UI continue working with cached data
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-foreground">Loading transactions...</div>
      </div>
    );
  }

  if (error && transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-lg text-destructive">
          Error: {error instanceof Error ? error.message : "Failed to load transactions"}
        </div>
        <Button onClick={() => window.location.reload()} className="bg-near-green hover:bg-near-cyan text-white">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <Layout>
      <div className="flex gap-4">
        {/* Main content area */}
        <div className="flex-1 space-y-4 pr-4 md:pr-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-near-cyan">Latest Transactions</h2>
              <p className="text-sm text-muted-foreground">
                Latest block height: <span className="text-near-cyan font-mono">{latestHeight}</span> •{" "}
                <span className="text-near-green">{transactions.length}</span> transactions in cache
              </p>
            </div>
          </div>

          <div className="flex gap-2 items-center">
            <Input
              placeholder="Filter by account (signer or receiver)..."
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              className="max-w-md border-border bg-background"
            />
            {accountFilter && (
              <Button
                variant="outline"
                onClick={() => setAccountFilter("")}
                className="border-near-green text-near-green hover:bg-near-green hover:text-white"
              >
                Clear
              </Button>
            )}
          </div>

          <div
            ref={containerRef}
            onScroll={handleScroll}
            className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto"
          >
            {filteredTransactions.length === 0 ? (
              <Card className="p-8 text-center border-border bg-card">
                <div className="text-muted-foreground">
                  {accountFilter ? "No transactions found for this account" : "No transactions found"}
                </div>
              </Card>
            ) : (
              filteredTransactions.map((tx) => (
                <Card
                  key={tx.hash}
                  className="p-4 hover:bg-muted transition-all cursor-pointer border-border hover:border-near-cyan bg-card"
                  onClick={() => setSelectedTransaction(tx)}
                >
                  <div className="space-y-3">
                    {/* First row: Hash, Time, Actions, Block */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pb-3 border-b">
                      <div className="md:col-span-2">
                        <div className="text-xs text-muted-foreground font-semibold uppercase">Hash</div>
                        <div className="font-mono text-xs truncate" title={tx.hash}>
                          {tx.hash}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground font-semibold uppercase">Block</div>
                        <Link
                          href={`/block/${tx.block_height}`}
                          className="font-mono text-xs text-near-green hover:text-near-cyan"
                          onClick={(e) => e.stopPropagation()}
                        >
                          #{tx.block_height}
                        </Link>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground font-semibold uppercase">Actions</div>
                        <div className="font-mono text-xs">{tx.actions.length}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground font-semibold uppercase">Time</div>
                        <div className="text-xs text-muted-foreground">
                          {nearRpc.formatTimestamp(tx.timestamp_nanosec)}
                        </div>
                      </div>
                    </div>

                    {/* Second row: Signer and Receiver */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-muted-foreground font-semibold uppercase">From</div>
                        <div className="font-mono text-sm truncate" title={tx.signer_id}>
                          {tx.signer_id}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground font-semibold uppercase">To</div>
                        <div className="font-mono text-sm truncate" title={tx.receiver_id}>
                          {tx.receiver_id}
                        </div>
                      </div>
                    </div>

                    {/* Third row: Actions */}
                    {tx.actions.length > 0 && (
                      <div className="pt-3 border-t">
                        <div className="text-xs text-muted-foreground font-semibold uppercase mb-2">
                          Actions ({tx.actions.length})
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {tx.actions.map((action, idx) => {
                            const actionType = getActionType(action);
                            const actionDetails = formatActionDetails(action);
                            return (
                              <div
                                key={idx}
                                className="inline-flex items-center gap-2 bg-muted px-3 py-1.5 rounded-md border border-border"
                              >
                                <span className="text-xs font-semibold text-near-green">{actionType}</span>
                                {actionDetails && (
                                  <span className="text-xs text-muted-foreground font-mono">{actionDetails}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Transaction Inspector Sidebar */}
      <TransactionInspector transaction={selectedTransaction} onClose={() => setSelectedTransaction(null)} />
    </Layout>
  );
}

