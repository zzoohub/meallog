import React, { useCallback, useRef, useMemo, DependencyList } from 'react';

/**
 * Enhanced useCallback with dependency comparison
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: DependencyList
): T {
  const callbackRef = useRef<T>();
  const depsRef = useRef<DependencyList>();

  // Deep comparison of dependencies
  const depsChanged = useMemo(() => {
    if (!depsRef.current) return true;
    if (depsRef.current.length !== deps.length) return true;
    return depsRef.current.some((dep, index) => dep !== deps[index]);
  }, deps);

  if (depsChanged) {
    callbackRef.current = callback;
    depsRef.current = deps;
  }

  return callbackRef.current!;
}

/**
 * Debounced callback hook for performance optimization
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: DependencyList
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T,
    [callback, delay, ...deps]
  );
}

/**
 * Throttled callback hook for performance optimization
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: DependencyList
): T {
  const lastCallRef = useRef<number>(0);
  
  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCallRef.current >= delay) {
        lastCallRef.current = now;
        callback(...args);
      }
    }) as T,
    [callback, delay, ...deps]
  );
}

/**
 * Previous value hook for comparison
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  
  const previous = ref.current;
  ref.current = value;
  
  return previous;
}

/**
 * Memoized value with custom equality function
 */
export function useMemoWithEquals<T>(
  factory: () => T,
  deps: DependencyList,
  equals?: (prev: T, next: T) => boolean
): T {
  const valueRef = useRef<T>();
  const depsRef = useRef<DependencyList>();
  
  const depsChanged = useMemo(() => {
    if (!depsRef.current) return true;
    if (depsRef.current.length !== deps.length) return true;
    return depsRef.current.some((dep, index) => dep !== deps[index]);
  }, deps);
  
  if (depsChanged) {
    const newValue = factory();
    
    if (!valueRef.current || !equals?.(valueRef.current, newValue)) {
      valueRef.current = newValue;
    }
    
    depsRef.current = deps;
  }
  
  return valueRef.current!;
}

/**
 * Async operation hook with loading and error states
 */
export function useAsyncOperation<T, E = Error>() {
  const [state, setState] = React.useState<{
    data: T | null;
    loading: boolean;
    error: E | null;
  }>({
    data: null,
    loading: false,
    error: null,
  });
  
  const execute = useCallback(async (asyncFn: () => Promise<T>) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await asyncFn();
      setState({ data: result, loading: false, error: null });
      return result;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error as E 
      }));
      throw error;
    }
  }, []);
  
  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);
  
  return {
    ...state,
    execute,
    reset,
  };
}