import { Card, CardContent } from "@/components/ui/card";
import { Transaction } from "@/lib/nearRpcFailover";
import { nearRpc } from "@/lib/nearRpcFailover";
import { Link } from "wouter";

interface LatestTransactionCardProps {
  transaction: Transaction;
}

export default function LatestTransactionCard({ transaction }: LatestTransactionCardProps) {
  // Truncate hash and addresses
  const truncateHash = (hash: string, startChars = 12, endChars = 8) => {
    if (hash.length <= startChars + endChars) return hash;
    return `${hash.slice(0, startChars)}...${hash.slice(-endChars)}`;
  };

  const truncateAddress = (addr: string, startChars = 10, endChars = 8) => {
    if (addr.length <= startChars + endChars) return addr;
    return `${addr.slice(0, startChars)}...${addr.slice(-endChars)}`;
  };

  // Get action type and transfer amount if applicable
  const getActionInfo = () => {
    if (!transaction.actions || transaction.actions.length === 0) {
      return { type: 'Unknown', amount: null };
    }

    const action = transaction.actions[0];
    const actionKeys = Object.keys(action);
    if (actionKeys.length === 0) return { type: 'Unknown', amount: null };

    const actionType = actionKeys[0];
    
    if (actionType === 'Transfer') {
      const amount = nearRpc.formatNear(action[actionType].deposit || '0');
      return { type: 'Transfer', amount };
    } else if (actionType === 'FunctionCall') {
      return { type: 'Function Call', amount: null };
    } else if (actionType === 'CreateAccount') {
      return { type: 'Create Account', amount: null };
    } else if (actionType === 'DeployContract') {
      return { type: 'Deploy Contract', amount: null };
    }

    return { 
      type: actionType.replace(/([A-Z])/g, ' $1').trim(), 
      amount: null 
    };
  };

  const { type: actionType, amount } = getActionInfo();

  // Determine status (for now, assume success; would need receipt data for actual status)
  const isSuccess = true;

  return (
    <Card className="border-border bg-card hover:bg-muted/50 transition-all">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Top row - Hash and timestamp */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Transaction icon */}
              <div className="w-10 h-10 bg-muted rounded flex items-center justify-center flex-shrink-0">
                <span className="text-lg">📝</span>
              </div>
              
              {/* Hash */}
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground mb-1">Txn Hash</div>
                <Link href={`/tx/${transaction.hash}`}>
                  <span 
                    className="font-mono text-sm text-near-green hover:text-near-cyan cursor-pointer block truncate"
                    title={transaction.hash}
                  >
                    {truncateHash(transaction.hash)}
                  </span>
                </Link>
              </div>
            </div>

            {/* Status badge */}
            <div className={`px-2 py-1 rounded text-xs font-semibold flex-shrink-0 ${
              isSuccess 
                ? 'bg-near-green/10 text-near-green border border-near-green/20' 
                : 'bg-red-500/10 text-red-500 border border-red-500/20'
            }`}>
              {isSuccess ? 'Success' : 'Failed'}
            </div>
          </div>

          {/* Timestamp */}
          <div className="text-xs text-muted-foreground">
            {nearRpc.formatRelativeTime(transaction.timestamp_nanosec)}
          </div>

          {/* From and To */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground w-12">From:</span>
              <span className="font-mono text-foreground truncate" title={transaction.signer_id}>
                {truncateAddress(transaction.signer_id)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground w-12">To:</span>
              <span className="font-mono text-foreground truncate" title={transaction.receiver_id}>
                {truncateAddress(transaction.receiver_id)}
              </span>
            </div>
          </div>

          {/* Action type and amount */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="text-xs">
              <span className="text-muted-foreground">Type: </span>
              <span className="font-semibold text-foreground">{actionType}</span>
            </div>
            {amount && (
              <div className="text-xs font-mono font-semibold text-near-cyan">
                {amount} NEAR
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

