/**
 * App Providers - Enterprise-grade Mobile App
 * 
 * Central provider wrapper for the application
 * Netflix/Stripe/Shopify/Airbnb/Spotify standards
 */

import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/store/apiStores';
import { initializeTokens, setApiLanguage } from '@/services/api';
import { useLanguageStore } from '@/store';

// ============================================
// QUERY CLIENT
// ============================================

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep data in cache for 30 minutes
      gcTime: 30 * 60 * 1000,
      // Retry failed requests up to 3 times
      retry: 3,
      // Retry delay with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus (app comes to foreground)
      refetchOnWindowFocus: true,
      // Don't refetch on reconnect by default
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
    },
  },
});

// ============================================
// APP INITIALIZER COMPONENT
// ============================================

interface AppInitializerProps {
  children: React.ReactNode;
}

/**
 * Initializes the app (tokens, language, etc.)
 */
function AppInitializer({ children }: AppInitializerProps) {
  const initialize = useAuthStore((state) => state.initialize);
  const language = useLanguageStore((state) => state.language);

  useEffect(() => {
    // Initialize auth tokens
    initialize();
    
    // Sync language with API client
    setApiLanguage(language);
  }, []);

  useEffect(() => {
    // Update API language when it changes
    setApiLanguage(language);
  }, [language]);

  return <>{children}</>;
}

// ============================================
// MAIN PROVIDER
// ============================================

interface AppProvidersProps {
  children: React.ReactNode;
}

/**
 * Main provider wrapper for the application
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInitializer>
        {children}
      </AppInitializer>
    </QueryClientProvider>
  );
}

export { queryClient };
export default AppProviders;
