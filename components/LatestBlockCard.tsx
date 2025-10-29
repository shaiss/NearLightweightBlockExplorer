import { Card, CardContent } from "@/components/ui/card";
import { Block } from "@/lib/nearRpcFailover";
import { nearRpc } from "@/lib/nearRpcFailover";
import { Link } from "wouter";

interface LatestBlockCardProps {
  block: Block;
  transactionCount?: number;
}

export default function LatestBlockCard({ block, transactionCount = 0 }: LatestBlockCardProps) {
  // Truncate author/validator name if too long
  const truncateAddress = (addr: string, startChars = 10, endChars = 8) => {
    if (addr.length <= startChars + endChars) return addr;
    return `${addr.slice(0, startChars)}...${addr.slice(-endChars)}`;
  };

  // Get a consistent color for each validator
  const getValidatorColor = (validator: string) => {
    // Simple hash to get consistent color per validator
    const hash = validator.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = [
      'text-blue-500 bg-blue-500/10 border-blue-500/20',
      'text-purple-500 bg-purple-500/10 border-purple-500/20',
      'text-green-500 bg-green-500/10 border-green-500/20',
      'text-orange-500 bg-orange-500/10 border-orange-500/20',
      'text-pink-500 bg-pink-500/10 border-pink-500/20',
      'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
    ];
    return colors[hash % colors.length];
  };

  return (
    <Card className="border-border bg-card hover:bg-muted/50 transition-all">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left side - Block info */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              {/* Block icon */}
              <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                <span className="text-lg">⬛</span>
              </div>
              
              {/* Block height */}
              <div>
                <div className="text-xs text-muted-foreground">Block</div>
                <Link href={`/block/${block.header.height}`}>
                  <span className="font-mono font-bold text-near-green hover:text-near-cyan cursor-pointer">
                    {block.header.height}
                  </span>
                </Link>
              </div>
            </div>

            {/* Timestamp */}
            <div className="text-xs text-muted-foreground">
              {nearRpc.formatRelativeTime(block.header.timestamp_nanosec)}
            </div>

            {/* Validator - color coded for easy identification */}
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded border font-mono text-xs font-semibold ${getValidatorColor(block.author)}`} title={block.author}>
                {truncateAddress(block.author, 12, 10)}
              </span>
            </div>
          </div>

          {/* Right side - Transaction count badge */}
          <div className="flex flex-col items-end gap-2">
            <div className="bg-near-cyan/10 border border-near-cyan/20 px-3 py-1 rounded-full">
              <span className="text-xs font-semibold text-near-cyan">
                {transactionCount} {transactionCount === 1 ? 'txn' : 'txns'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

