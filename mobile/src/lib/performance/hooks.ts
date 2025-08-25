import React, { useCallback, useRef, useMemo, DependencyList, useState } from 'react';
import { trackComponentRender, markPerformance, measurePerformance } from './monitor';

// ============================================================================
// PERFORMANCE HOOKS
// ============================================================================

export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: DependencyList
): T {
  const callbackRef = React.useRef<T>(callback);
  const depsRef = React.useRef<DependencyList>(deps);

  const depsChanged = React.useMemo(() => {
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

export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: DependencyList
): T {
  const timeoutRef = React.useRef<NodeJS.Timeout | undefined>(undefined);
  
  return React.useCallback(
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

export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: DependencyList
): T {
  const lastCallRef = React.useRef<number>(0);
  
  return React.useCallback(
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

export function usePrevious<T>(value: T): T | undefined {
  const ref = React.useRef<T | undefined>(undefined);
  
  const previous = ref.current;
  ref.current = value;
  
  return previous;
}

export function useMemoWithEquals<T>(
  factory: () => T,
  deps: DependencyList,
  equals?: (prev: T, next: T) => boolean
): T {
  const valueRef = React.useRef<T | undefined>(undefined);
  const depsRef = React.useRef<DependencyList | undefined>(undefined);
  
  const depsChanged = React.useMemo(() => {
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
  
  const execute = React.useCallback(async (asyncFn: () => Promise<T>) => {
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
  
  const reset = React.useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);
  
  return {
    ...state,
    execute,
    reset,
  };
}

export function usePerformanceMonitor(componentName: string) {
  const startTime = performance.now();

  React.useEffect(() => {
    const renderTime = performance.now() - startTime;
    trackComponentRender(componentName, renderTime);
  });

  return {
    mark: (name: string) => markPerformance(`${componentName}:${name}`),
    measure: (name: string) => measurePerformance(`${componentName}:${name}`),
  };
}