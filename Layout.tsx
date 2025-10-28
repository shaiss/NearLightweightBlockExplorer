import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/">
              <h1 className="text-2xl font-bold text-slate-900 cursor-pointer hover:text-slate-700 transition-colors">
                NEAR Localnet Explorer
              </h1>
            </Link>
            <div className="hidden md:flex gap-4">
              <Link href="/blocks">
                <Button variant="ghost">Blocks</Button>
              </Link>
              <Link href="/search">
                <Button variant="ghost">Search</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="container py-8">
        {children}
      </main>

      <footer className="border-t bg-white/80 backdrop-blur-sm mt-auto">
        <div className="container py-6 text-center text-sm text-slate-600">
          <p>NEAR Localnet Block Explorer - Lightweight RPC-based explorer for development</p>
        </div>
      </footer>
    </div>
  );
}

