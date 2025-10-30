import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Transaction, nearRpc } from "@/lib/nearRpcFailover";

interface TransactionInspectorProps {
  transaction: Transaction | null;
  onClose: () => void;
  onBack?: () => void;
}

export default function TransactionInspector({
  transaction,
  onClose,
  onBack,
}: TransactionInspectorProps) {
  if (!transaction) {
    return null;
  }

  return (
    <div className="fixed right-0 top-0 h-full w-full md:w-96 bg-card border-l border-border shadow-lg z-50 overflow-y-auto">
      <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-50">
        <div className="flex items-center gap-2">
          {onBack && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="h-8 w-8 p-0 border-border hover:border-near-green hover:text-near-green"
            >
              ←
            </Button>
          )}
          <h2 className="text-lg font-bold text-near-cyan">Transaction Details</h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0 border-border hover:border-near-green hover:text-near-green"
        >
          ✕
        </Button>
      </div>

      <div className="p-4 space-y-4">
        {/* Transaction Hash */}
        <Card className="border-border bg-background-secondary">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Hash</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-mono text-xs break-all bg-muted p-2 rounded text-foreground">
              {transaction.hash}
            </div>
          </CardContent>
        </Card>

        {/* Block Information */}
        <Card className="border-border bg-background-secondary">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Block</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                <div className="text-xs text-muted-foreground font-semibold uppercase">Height</div>
                <div className="font-mono text-near-green">#{transaction.block_height}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground font-semibold uppercase">Hash</div>
                <div className="font-mono text-xs break-all bg-muted p-2 rounded text-foreground">
                  {transaction.block_hash}
                </div>
              </div>
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
              <div className="text-foreground">
                {nearRpc.formatTimestamp(transaction.timestamp_nanosec)}
              </div>
              <div className="text-xs text-muted-foreground font-mono">
                {transaction.timestamp_nanosec}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* From (Signer) */}
        <Card className="border-border bg-background-secondary">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">From (Signer)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-mono text-sm break-all bg-muted p-2 rounded text-foreground">
              {transaction.signer_id}
            </div>
          </CardContent>
        </Card>

        {/* To (Receiver) */}
        <Card className="border-border bg-background-secondary">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">To (Receiver)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-mono text-sm break-all bg-muted p-2 rounded text-foreground">
              {transaction.receiver_id}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card className="border-border bg-background-secondary">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">
              Actions (<span className="text-near-cyan">{transaction.actions.length}</span>)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transaction.actions.length === 0 ? (
              <div className="text-sm text-muted-foreground">No actions</div>
            ) : (
              <div className="space-y-2">
                {transaction.actions.map((action, idx) => (
                  <div
                    key={idx}
                    className="bg-muted p-3 rounded text-xs border border-border"
                  >
                    <div className="font-semibold mb-1 text-near-green">Action {idx}</div>
                    <pre className="overflow-auto max-h-40 text-xs text-foreground">
                      {JSON.stringify(action, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Raw JSON */}
        <Card className="border-border bg-background-secondary">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Raw Transaction</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-60 border border-border text-foreground">
              {JSON.stringify(transaction, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
