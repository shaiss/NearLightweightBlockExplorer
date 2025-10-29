import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from "@/components/Layout";
import { nearRpc, Transaction } from "@/lib/nearRpcFailover";
import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { nearKeys } from "@/lib/nearQueries";

// ActionCard component for displaying individual action details
function ActionCard({ action, idx, actionType, actionDetails }: { 
  action: any; 
  idx: number; 
  actionType: string; 
  actionDetails: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className="bg-muted/50 p-4 rounded-lg border border-border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="bg-near-green/10 border border-near-green/20 px-3 py-1 rounded-full">
            <span className="font-semibold text-near-green text-sm">
              Action {idx + 1}
            </span>
          </div>
          <span className="font-semibold text-foreground">{actionType}</span>
          {actionDetails && (
            <span className="text-sm text-near-cyan font-mono font-bold">
              {actionDetails}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs"
        >
          {isExpanded ? '▼ Hide Details' : '▶ Show Details'}
        </Button>
      </div>
      
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-border">
          <pre className="text-xs overflow-auto max-h-60 bg-background p-3 rounded border border-border">
            {JSON.stringify(action, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function TransactionDetail() {
  const params = useParams();
  const txHash = params.hash;
  const [transaction, setTransaction] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchTransaction = async () => {
      if (!txHash) {
        setError("No transaction hash provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // OPTIMIZATION: First check TanStack Query cache for this transaction
        // This is faster than searching through blocks and works for older transactions
        const cachedTransactions = queryClient.getQueryData<Transaction[]>(nearKeys.recentTransactions());
        const cachedTx = cachedTransactions?.find(tx => tx.hash === txHash);
        
        if (cachedTx) {
          console.log(`[TxDetail] Found transaction in cache with signer_id: ${cachedTx.signer_id}`);
          // We have the transaction from cache with signer_id, fetch full details
          try {
            const txData = await nearRpc.getTransactionByHash(txHash, cachedTx.signer_id);
            setTransaction(txData);
            setLoading(false);
            return;
          } catch (cacheErr) {
            // Cache hit but fetch failed, fall through to block search
            console.warn('[TxDetail] Cache hit but fetch failed, trying block search:', cacheErr);
          }
        }
        
        // Not in cache or cache fetch failed, try block search
        try {
          const txData = await nearRpc.getTransactionByHash(txHash);
          setTransaction(txData);
          setLoading(false);
          return;
        } catch (txError) {
          // If not found as transaction, maybe it's actually a block hash
          // Try to fetch as block instead
          try {
            await nearRpc.getBlock(txHash);
            // It was a block hash! Redirect to block view
            window.location.href = `/block/${txHash}`;
            return;
          } catch (blockError) {
            // Neither worked - show the original transaction error
            throw txError;
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch transaction";
        setError(errorMessage);
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [txHash, queryClient]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="space-y-3 text-center">
            <div className="text-lg text-foreground">Searching for transaction...</div>
            <div className="text-sm text-muted-foreground">
              Checking cache and recent blocks for transaction hash
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" className="border-border hover:border-near-green hover:text-near-green">
                ← Back to Home
              </Button>
            </Link>
            <h2 className="text-2xl font-bold text-near-cyan">Transaction Not Found</h2>
          </div>
          
          <Card className="border-destructive/50 bg-destructive/10">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <p className="text-destructive font-medium">Error: {error}</p>
                <div className="text-sm text-foreground-secondary">
                  <p className="font-semibold mb-2">Transaction hash:</p>
                  <code className="block bg-background p-2 rounded border border-border font-mono text-xs break-all">
                    {txHash}
                  </code>
                </div>
                <div className="text-sm text-muted-foreground mt-4">
                  <p className="font-semibold mb-1">Possible reasons:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>The transaction is not in cache or the last 1000 blocks</li>
                    <li>The transaction hash is invalid</li>
                    <li>The transaction is on a different network (check your network settings)</li>
                    <li>There was a network error connecting to the RPC</li>
                  </ul>
                  <p className="mt-3 text-xs">
                    <strong>Tip:</strong> Visit the /transactions page first to load recent transactions into cache, 
                    then they'll be searchable even after 1000+ blocks.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!transaction) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg text-muted-foreground">No transaction data available</div>
        </div>
      </Layout>
    );
  }

  // Helper to get action type
  const getActionType = (action: any): string => {
    const actionKeys = Object.keys(action);
    if (actionKeys.length === 0) return 'Unknown';
    
    const actionType = actionKeys[0];
    return actionType
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  // Helper to format action details
  const formatActionDetails = (action: any): string => {
    const actionKeys = Object.keys(action);
    if (actionKeys.length === 0) return '';
    
    const actionType = actionKeys[0];
    const actionData = action[actionType];
    
    if (actionType === 'Transfer') {
      const amount = nearRpc.formatNear(actionData.deposit || '0');
      return `${amount} NEAR`;
    } else if (actionType === 'FunctionCall') {
      return `${actionData.method_name}()`;
    }
    
    return '';
  };

  // Copy to clipboard helper
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add a toast notification here
  };

  const receipt = transaction.receipts_outcome?.[0] || {};
  const status = transaction.status;
  const isSuccessful = status?.SuccessValue !== undefined || status?.SuccessReceiptId !== undefined;

  // Calculate total transferred value
  const getTotalTransferred = (): string => {
    if (!transaction.transaction?.actions) return '0';
    
    let total = BigInt(0);
    for (const action of transaction.transaction.actions) {
      if (action.Transfer) {
        total += BigInt(action.Transfer.deposit || '0');
      }
    }
    
    return nearRpc.formatNear(total.toString());
  };

  // Get gas information
  const gasInfo = {
    burnt: receipt.outcome?.gas_burnt || 0,
    price: transaction.transaction_outcome?.outcome?.gas_burnt || 0,
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" className="border-border hover:border-near-green hover:text-near-green">
              ← Back
            </Button>
          </Link>
          <h2 className="text-2xl font-bold text-near-cyan">Transaction Details</h2>
        </div>

        {/* Status Badge - Enhanced */}
        <Card className={`border-2 ${isSuccessful ? 'border-near-green bg-near-green/5' : 'border-red-500 bg-red-500/5'}`}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isSuccessful ? 'bg-near-green' : 'bg-red-500'}`}>
                <span className="text-white text-2xl">{isSuccessful ? '✓' : '✗'}</span>
              </div>
              <div>
                <div className={`font-bold text-2xl ${isSuccessful ? 'text-near-green' : 'text-red-500'}`}>
                  {isSuccessful ? 'Transaction Success' : 'Transaction Failed'}
                </div>
                <div className="text-sm text-muted-foreground">
                  This transaction has been {isSuccessful ? 'successfully processed' : 'failed'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overview Card - Comprehensive */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg">Transaction Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Transaction Hash with copy button */}
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div className="flex-1">
                <div className="text-sm font-semibold text-muted-foreground mb-2">Transaction Hash:</div>
                <div className="font-mono text-sm break-all text-foreground">
                  {txHash}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(txHash || '')}
                className="ml-4 flex-shrink-0"
              >
                📋 Copy
              </Button>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="text-sm font-semibold text-muted-foreground">Status:</div>
              <div className={`px-3 py-1 rounded-full font-semibold ${
                isSuccessful 
                  ? 'bg-near-green/10 text-near-green border border-near-green/20' 
                  : 'bg-red-500/10 text-red-500 border border-red-500/20'
              }`}>
                {isSuccessful ? 'Success' : 'Failed'}
              </div>
            </div>

            {/* Block */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="text-sm font-semibold text-muted-foreground">Block:</div>
              <Link href={`/block/${transaction.transaction_outcome?.block_hash}`}>
                <div className="font-mono text-sm text-near-green hover:text-near-cyan cursor-pointer">
                  {transaction.transaction_outcome?.block_hash || 'N/A'}
                </div>
              </Link>
            </div>

            {/* Timestamp */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="text-sm font-semibold text-muted-foreground">Timestamp:</div>
              <div className="text-sm text-foreground text-right">
                <div>{nearRpc.formatTimestamp(transaction.transaction?.public_key || '0')}</div>
                <div className="text-xs text-muted-foreground">
                  ({nearRpc.formatRelativeTime(transaction.transaction?.public_key || '0')})
                </div>
              </div>
            </div>

            {/* From */}
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div className="text-sm font-semibold text-muted-foreground">From:</div>
              <div className="font-mono text-sm break-all text-foreground max-w-md text-right">
                {transaction.transaction?.signer_id || 'N/A'}
              </div>
            </div>

            {/* To */}
            <div className="flex items-start justify-between">
              <div className="text-sm font-semibold text-muted-foreground">To:</div>
              <div className="font-mono text-sm break-all text-foreground max-w-md text-right">
                {transaction.transaction?.receiver_id || 'N/A'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Details Card */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg">Transaction Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Value Transferred */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="text-sm font-semibold text-muted-foreground">Value:</div>
              <div className="font-mono text-lg font-bold text-near-cyan">
                {getTotalTransferred()} NEAR
              </div>
            </div>

            {/* Gas Used */}
            {gasInfo.burnt > 0 && (
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="text-sm font-semibold text-muted-foreground">Gas Used:</div>
                <div className="font-mono text-sm text-foreground">
                  {gasInfo.burnt.toLocaleString()}
                </div>
              </div>
            )}

            {/* Nonce */}
            {transaction.transaction?.nonce && (
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-muted-foreground">Nonce:</div>
                <div className="font-mono text-sm text-foreground">
                  {transaction.transaction.nonce}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions - Enhanced */}
        {transaction.transaction?.actions && transaction.transaction.actions.length > 0 && (
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg">
                Actions ({transaction.transaction.actions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transaction.transaction.actions.map((action: any, idx: number) => {
                  const actionType = getActionType(action);
                  const actionDetails = formatActionDetails(action);
                  
                  return (
                    <ActionCard 
                      key={idx}
                      action={action}
                      idx={idx}
                      actionType={actionType}
                      actionDetails={actionDetails}
                    />
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Receipt Outcome - Enhanced */}
        {receipt.outcome && (
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg">Receipt Outcome</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div className="text-sm font-semibold text-muted-foreground">Gas Burnt:</div>
                  <div className="font-mono text-sm font-semibold text-foreground">
                    {receipt.outcome.gas_burnt?.toLocaleString() || 'N/A'}
                  </div>
                </div>
                
                {receipt.outcome.logs && receipt.outcome.logs.length > 0 && (
                  <div>
                    <div className="text-sm font-semibold text-muted-foreground mb-3">
                      Logs ({receipt.outcome.logs.length}):
                    </div>
                    <div className="bg-background border border-border rounded-lg p-4 max-h-60 overflow-y-auto">
                      {receipt.outcome.logs.map((log: string, idx: number) => (
                        <div 
                          key={idx} 
                          className="font-mono text-xs mb-2 pb-2 border-b border-border last:border-b-0 last:mb-0 last:pb-0"
                        >
                          <span className="text-muted-foreground mr-2">[{idx}]</span>
                          <span className="text-foreground">{log}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Raw Transaction Data - Collapsible */}
        <Card className="border-border bg-card">
          <CardHeader 
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => {
              const elem = document.getElementById('raw-json-content');
              if (elem) {
                elem.style.display = elem.style.display === 'none' ? 'block' : 'none';
              }
            }}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Advanced Details (Raw JSON)</CardTitle>
              <span className="text-sm text-muted-foreground">Click to expand/collapse</span>
            </div>
          </CardHeader>
          <CardContent id="raw-json-content" style={{ display: 'none' }}>
            <pre className="bg-background p-4 rounded text-xs overflow-auto max-h-96 border border-border">
              {JSON.stringify(transaction, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

