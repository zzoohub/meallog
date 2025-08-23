import { useQuery, useMutation, useInfiniteQuery } from '@tanstack/react-query';
import { queryClient, prefetchManager } from './queryClient';
import { useEffect } from 'react';

// Hook for prefetching data when component mounts
export function usePrefetch(
  queries: Array<{
    key: string[];
    fetcher: () => Promise<any>;
    staleTime?: number;
  }>
) {
  useEffect(() => {
    // Prefetch in background after component mount
    const timeoutId = setTimeout(() => {
      prefetchManager.prefetchBatch(queries);
    }, 100); // Small delay to not block initial render

    return () => clearTimeout(timeoutId);
  }, []);
}

// Hook for prefetching navigation targets
export function usePrefetchNavigation(targets: string[]) {
  useEffect(() => {
    const prefetchTargets = async () => {
      const queries = targets.map(target => {
        switch (target) {
          case 'settings':
            return {
              key: ['settings', 'user-preferences'],
              fetcher: async () => {
                // Mock fetcher - replace with actual API
                const { storage } = await import('@/lib/storage');
                return storage.getItem('userSettings');
              },
            };
          case 'meal-history':
            return {
              key: ['meals', 'recent'],
              fetcher: async () => {
                const { mealStorage } = await import('@/domains/meals/services/mealStorage');
                return mealStorage.getRecentMeals(10);
              },
            };
          case 'progress':
            return {
              key: ['progress', 'dashboard'],
              fetcher: async () => {
                // Mock fetcher - replace with actual API
                return {
                  weeklyGoals: { current: 5, target: 7 },
                  streaks: { current: 3, best: 15 },
                  nutrition: { calories: 2100, protein: 85, carbs: 250, fat: 70 },
                };
              },
            };
          default:
            return null;
        }
      }).filter(Boolean) as any;

      if (queries.length > 0) {
        await prefetchManager.prefetchBatch(queries);
      }
    };

    // Delay prefetching to not interfere with initial render
    const timeoutId = setTimeout(prefetchTargets, 500);
    return () => clearTimeout(timeoutId);
  }, [targets]);
}

// Hook for optimistic updates
export function useOptimisticMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: {
    onMutate?: (variables: TVariables) => Promise<any>;
    onError?: (error: any, variables: TVariables, context: any) => void;
    onSuccess?: (data: TData, variables: TVariables) => void;
    invalidateKeys?: string[][];
  }
) {
  return useMutation({
    mutationFn,
    onMutate: options?.onMutate,
    onError: (error, variables, context) => {
      // Rollback on error
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          queryClient.setQueryData(JSON.parse(key), value);
        });
      }
      options?.onError?.(error, variables, context);
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries
      options?.invalidateKeys?.forEach(key => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      options?.onSuccess?.(data, variables);
    },
  });
}