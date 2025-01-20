/**
 * Global Providers Component
 * Wraps the application with necessary context providers
 * Includes React Query for data fetching and ErrorBoundary for error handling
 */

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from './error-boundary';

/**
 * Configuration for the React Query client
 * Sets up default behavior for queries and mutations
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Disable automatic background refetching
      refetchOnWindowFocus: false,
      // Cache data for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Retry failed requests up to 2 times
      retry: 2
    }
  }
});

/**
 * Props for the Providers component
 */
interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * Providers Component
 * Wraps children with necessary context providers for the application
 * Includes error boundary for graceful error handling
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}