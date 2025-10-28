import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from "@/components/Layout";
import { nearRpc } from "@/lib/nearRpcFailover";
import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";

export default function TransactionDetail() {
  const params = useParams();
  const txHash = params.hash;
  const [transaction, setTransaction] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        const txData = await nearRpc.getTransactionByHash(txHash);
        setTransaction(txData);
        setLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch transaction";
        setError(errorMessage);
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [txHash]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="space-y-3 text-center">
            <div className="text-lg text-foreground">Searching for transaction...</div>
            <div className="text-sm text-muted-foreground">
              Scanning recent blocks to find transaction hash
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
                    <li>The transaction is not in the last 100 blocks</li>
                    <li>The transaction hash is invalid</li>
                    <li>The transaction is on a different network (check your network settings)</li>
                    <li>There was a network error connecting to the RPC</li>
                  </ul>
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

  const receipt = transaction.receipts_outcome?.[0] || {};
  const status = transaction.status;
  const isSuccessful = status?.SuccessValue !== undefined || status?.SuccessReceiptId !== undefined;

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

        {/* Status Badge */}
        <Card className={`border-2 ${isSuccessful ? 'border-near-green bg-near-green/5' : 'border-red-500 bg-red-500/5'}`}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isSuccessful ? 'bg-near-green' : 'bg-red-500'}`}></div>
              <span className={`font-bold text-lg ${isSuccessful ? 'text-near-green' : 'text-red-500'}`}>
                {isSuccessful ? 'Success' : 'Failed'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Hash */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-muted-foreground">Transaction Hash</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-mono text-sm break-all bg-muted p-3 rounded border border-border">
              {txHash}
            </div>
          </CardContent>
        </Card>

        {/* Block Info */}
        {transaction.transaction_outcome?.block_hash && (
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-muted-foreground">Block</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-xs text-muted-foreground font-semibold uppercase mb-1">Hash</div>
                <div className="font-mono text-xs break-all bg-muted p-2 rounded">
                  {transaction.transaction_outcome.block_hash}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sender and Receiver */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-muted-foreground">From (Signer)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-mono text-sm break-all bg-muted p-3 rounded border border-border">
                {transaction.transaction?.signer_id || 'N/A'}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-muted-foreground">To (Receiver)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-mono text-sm break-all bg-muted p-3 rounded border border-border">
                {transaction.transaction?.receiver_id || 'N/A'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        {transaction.transaction?.actions && transaction.transaction.actions.length > 0 && (
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-muted-foreground">
                Actions ({transaction.transaction.actions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transaction.transaction.actions.map((action: any, idx: number) => {
                  const actionType = getActionType(action);
                  const actionDetails = formatActionDetails(action);
                  return (
                    <div
                      key={idx}
                      className="bg-muted p-4 rounded border border-border"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-near-green">Action {idx + 1}:</span>
                        <span className="font-medium">{actionType}</span>
                        {actionDetails && (
                          <span className="text-sm text-muted-foreground font-mono">
                            {actionDetails}
                          </span>
                        )}
                      </div>
                      <pre className="text-xs overflow-auto max-h-40 bg-background p-2 rounded">
                        {JSON.stringify(action, null, 2)}
                      </pre>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Receipt Outcome */}
        {receipt.outcome && (
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-muted-foreground">Receipt Outcome</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-muted-foreground font-semibold uppercase mb-1">Gas Burnt</div>
                  <div className="font-mono text-sm">
                    {receipt.outcome.gas_burnt?.toLocaleString() || 'N/A'}
                  </div>
                </div>
                {receipt.outcome.logs && receipt.outcome.logs.length > 0 && (
                  <div>
                    <div className="text-xs text-muted-foreground font-semibold uppercase mb-1">Logs</div>
                    <div className="bg-muted p-3 rounded border border-border">
                      {receipt.outcome.logs.map((log: string, idx: number) => (
                        <div key={idx} className="font-mono text-xs mb-1">
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Raw Transaction Data */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-muted-foreground">Raw Transaction Data</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded text-xs overflow-auto max-h-96 border border-border">
              {JSON.stringify(transaction, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

