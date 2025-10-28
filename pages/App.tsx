import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Home from "@/pages/Home";
import BlockList from "@/pages/BlockList";
import BlockDetail from "@/pages/BlockDetail";
import TransactionList from "@/pages/TransactionList";
import TransactionDetail from "@/pages/TransactionDetail";
import Settings from "@/pages/Settings";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";

/**
 * Query Client Configuration
 * 
 * Cache behavior:
 * - staleTime: 3s - data is fresh for 3 seconds before background refetch
 * - gcTime: 10min - unused queries garbage collected after 10 minutes
 * - refetchOnMount: false - only refetch if data is stale (prevents infinite loops)
 * - refetchOnWindowFocus: false - don't auto-refetch on window focus (prevents excessive requests)
 * - refetchOnReconnect: true - auto-refetch when network comes back online
 * 
 * This ensures:
 * - Fast UI with instant cached data
 * - Controlled refetching (only when data is stale or via refetchInterval)
 * - Memory efficient with 10-minute cleanup
 * - Smooth experience navigating between pages (data persists)
 * - Prevents infinite retry loops on failed requests
 */
function createQueryClientWithConfig() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 3000,
        gcTime: 1000 * 60 * 10,
        refetchOnMount: false, // Changed from 'always' to prevent infinite loops
        refetchOnWindowFocus: false, // Changed from 'always' to prevent excessive requests
        refetchOnReconnect: true,
        retry: 3, // Increased from 1 to give more chances on transient failures
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
      },
    },
  });
}

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/blocks"} component={BlockList} />
      <Route path={"/block/:id"} component={BlockDetail} />
      <Route path={"/transactions"} component={TransactionList} />
      <Route path={"/tx/:hash"} component={TransactionDetail} />
      <Route path={"/settings"} component={Settings} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  const [queryClient, setQueryClient] = useState<QueryClient | null>(null);

  useEffect(() => {
    // Initialize query client with persistence on mount
    const client = createQueryClientWithConfig();
    
    // Optional: Setup persistence if needed
    // This would restore cached data from sessionStorage on app mount
    // Uncomment to enable automatic cache persistence:
    /*
    const persister = createQueryPersister();
    if (persister) {
      // Restore cache from storage
      client.mount();
    }
    */
    
    setQueryClient(client);
  }, []);

  if (!queryClient) {
    return null; // Wait for QueryClient to initialize
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          defaultTheme="light"
          switchable
        >
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
