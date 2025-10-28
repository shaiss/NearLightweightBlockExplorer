import { Button } from "./ui/button";
import { Link, useLocation } from "wouter";
import ThemeToggle from "./ThemeToggle";
import { Input } from "./ui/input";
import { useState } from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Try as block height first
      if (/^\d+$/.test(searchQuery)) {
        setLocation(`/block/${searchQuery}`);
        setSearchQuery("");
        return;
      }

      // Try as block hash (44 chars for NEAR hashes)
      if (searchQuery.length === 44) {
        setLocation(`/block/${searchQuery}`);
        setSearchQuery("");
        return;
      }

      // Otherwise treat as account search - show results on a results page
      setLocation(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background-secondary transition-colors">
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <Link href="/">
              <h1 className="text-2xl font-bold text-near-green cursor-pointer hover:text-near-cyan transition-colors">
                NEAR Explorer
              </h1>
            </Link>
            <div className="hidden md:flex gap-4">
              <Link href="/blocks">
                <Button variant="ghost" className="hover:text-near-green">Blocks</Button>
              </Link>
              <Link href="/transactions">
                <Button variant="ghost" className="hover:text-near-green">Transactions</Button>
              </Link>
              <Link href="/settings">
                <Button variant="ghost" className="hover:text-near-green">Settings</Button>
              </Link>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-2 flex-1 md:flex-none md:w-80">
            <Input
              placeholder="Block height, hash, or account..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="border-border bg-background text-sm"
            />
            <Button 
              onClick={handleSearch}
              size="sm"
              className="bg-near-green hover:bg-near-cyan text-white whitespace-nowrap"
            >
              Search
            </Button>
          </div>

          <ThemeToggle />
        </div>
      </nav>

      <main className="container py-8">
        {children}
      </main>

      <footer className="border-t border-border bg-card/80 backdrop-blur-sm mt-auto">
        <div className="container py-6 text-center text-sm text-foreground-secondary">
          <p>NEAR Localnet Block Explorer - Lightweight RPC-based explorer for development</p>
          <p className="mt-1 text-xs text-muted-foreground">Powered by NEAR Protocol</p>
        </div>
      </footer>
    </div>
  );
}

