/**
 * API Hooks - Enterprise-grade Mobile App
 * 
 * Custom hooks for API data fetching and caching
 * Netflix/Stripe/Shopify/Airbnb/Spotify standards
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { safeApiCall, OptimusApiError } from '@/services/api';

// ============================================
// TYPES
// ============================================

interface UseQueryOptions<T> {
  /** Whether to fetch on mount */
  enabled?: boolean;
  /** Refetch interval in milliseconds */
  refetchInterval?: number;
  /** Custom onSuccess callback */
  onSuccess?: (data: T) => void;
  /** Custom onError callback */
  onError?: (error: OptimusApiError) => void;
  /** Stale time in milliseconds */
  staleTime?: number;
}

interface UseQueryResult<T> {
  data: T | null;
  error: OptimusApiError | null;
  isLoading: boolean;
  isFetching: boolean;
  refetch: () => Promise<void>;
}

interface UseMutationOptions<TData, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: OptimusApiError, variables: TVariables) => void;
  onSettled?: () => void;
}

interface UseMutationResult<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<TData | null>;
  mutateAsync: (variables: TVariables) => Promise<TData>;
  data: TData | null;
  error: OptimusApiError | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  reset: () => void;
}

// ============================================
// USE QUERY HOOK
// ============================================

/**
 * Custom hook for data fetching with caching
 */
export function useQuery<T>(
  queryFn: () => Promise<T>,
  options: UseQueryOptions<T> = {}
): UseQueryResult<T> {
  const {
    enabled = true,
    refetchInterval,
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<OptimusApiError | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [isFetching, setIsFetching] = useState(false);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    setIsFetching(true);
    if (data === null) {
      setIsLoading(true);
    }

    const { data: result, error: err } = await safeApiCall(queryFn);

    if (err) {
      setError(err);
      onError?.(err);
    } else if (result) {
      setData(result);
      setError(null);
      onSuccess?.(result);
    }

    setIsLoading(false);
    setIsFetching(false);
  }, [enabled, queryFn, onSuccess, onError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (refetchInterval && enabled) {
      const interval = setInterval(fetchData, refetchInterval);
      return () => clearInterval(interval);
    }
  }, [refetchInterval, enabled, fetchData]);

  return {
    data,
    error,
    isLoading,
    isFetching,
    refetch: fetchData,
  };
}

// ============================================
// USE MUTATION HOOK
// ============================================

/**
 * Custom hook for mutations
 */
export function useMutation<TData, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: UseMutationOptions<TData, TVariables> = {}
): UseMutationResult<TData, TVariables> {
  const { onSuccess, onError, onSettled } = options;

  const [data, setData] = useState<TData | null>(null);
  const [error, setError] = useState<OptimusApiError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);

  const mutate = useCallback(
    async (variables: TVariables): Promise<TData | null> => {
      setIsLoading(true);
      setIsSuccess(false);
      setIsError(false);

      const { data: result, error: err } = await safeApiCall(() =>
        mutationFn(variables)
      );

      setIsLoading(false);

      if (err) {
        setError(err);
        setIsError(true);
        onError?.(err, variables);
        onSettled?.();
        return null;
      }

      if (result) {
        setData(result);
        setIsSuccess(true);
        onSuccess?.(result, variables);
      }

      onSettled?.();
      return result;
    },
    [mutationFn, onSuccess, onError, onSettled]
  );

  const mutateAsync = useCallback(
    async (variables: TVariables): Promise<TData> => {
      setIsLoading(true);
      setIsSuccess(false);
      setIsError(false);

      try {
        const result = await mutationFn(variables);
        setData(result);
        setIsSuccess(true);
        onSuccess?.(result, variables);
        onSettled?.();
        return result;
      } catch (err) {
        const apiError = OptimusApiError.fromTRPCError(err);
        setError(apiError);
        setIsError(true);
        onError?.(apiError, variables);
        onSettled?.();
        throw apiError;
      } finally {
        setIsLoading(false);
      }
    },
    [mutationFn, onSuccess, onError, onSettled]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
    setIsSuccess(false);
    setIsError(false);
  }, []);

  return {
    mutate,
    mutateAsync,
    data,
    error,
    isLoading,
    isSuccess,
    isError,
    reset,
  };
}

// ============================================
// USE INFINITE QUERY HOOK
// ============================================

interface UseInfiniteQueryOptions<T> {
  enabled?: boolean;
  getNextPageParam?: (lastPage: T, allPages: T[]) => number | undefined;
}

interface UseInfiniteQueryResult<T> {
  data: T[];
  error: OptimusApiError | null;
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for infinite scrolling / pagination
 */
export function useInfiniteQuery<T extends { pagination?: { hasNext?: boolean; page: number } }>(
  queryFn: (page: number) => Promise<T>,
  options: UseInfiniteQueryOptions<T> = {}
): UseInfiniteQueryResult<T> {
  const { enabled = true, getNextPageParam } = options;

  const [pages, setPages] = useState<T[]>([]);
  const [error, setError] = useState<OptimusApiError | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);

  const fetchPage = useCallback(
    async (page: number, isInitial: boolean = false) => {
      if (isInitial) {
        setIsLoading(true);
      } else {
        setIsFetchingNextPage(true);
      }

      const { data: result, error: err } = await safeApiCall(() => queryFn(page));

      if (err) {
        setError(err);
      } else if (result) {
        if (isInitial) {
          setPages([result]);
        } else {
          setPages((prev) => [...prev, result]);
        }

        // Determine if there are more pages
        if (getNextPageParam) {
          const nextPage = getNextPageParam(result, pages);
          setHasNextPage(nextPage !== undefined);
        } else if (result.pagination) {
          setHasNextPage(result.pagination.hasNext ?? false);
        }

        setCurrentPage(page);
      }

      setIsLoading(false);
      setIsFetchingNextPage(false);
    },
    [queryFn, getNextPageParam, pages]
  );

  useEffect(() => {
    if (enabled) {
      fetchPage(1, true);
    }
  }, [enabled]);

  const fetchNextPage = useCallback(async () => {
    if (!hasNextPage || isFetchingNextPage) return;
    await fetchPage(currentPage + 1, false);
  }, [hasNextPage, isFetchingNextPage, currentPage, fetchPage]);

  const refetch = useCallback(async () => {
    setPages([]);
    setCurrentPage(1);
    setHasNextPage(true);
    await fetchPage(1, true);
  }, [fetchPage]);

  return {
    data: pages,
    error,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  };
}

// ============================================
// USE DEBOUNCED VALUE HOOK
// ============================================

/**
 * Custom hook for debouncing values (useful for search)
 */
export function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

// ============================================
// USE PREVIOUS HOOK
// ============================================

/**
 * Custom hook to get the previous value
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

// ============================================
// USE INTERVAL HOOK
// ============================================

/**
 * Custom hook for intervals
 */
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const id = setInterval(() => savedCallback.current(), delay);

    return () => clearInterval(id);
  }, [delay]);
}

// ============================================
// USE REFRESH ON FOCUS HOOK
// ============================================

/**
 * Custom hook to refresh data when app comes to foreground
 */
export function useRefreshOnFocus(refetch: () => void) {
  const hasFetched = useRef(false);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && hasFetched.current) {
        refetch();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    hasFetched.current = true;

    return () => {
      subscription.remove();
    };
  }, [refetch]);
}
