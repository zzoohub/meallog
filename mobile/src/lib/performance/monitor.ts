import { InteractionManager } from 'react-native';
import type { PerformanceMetric, NavigationMetric } from './types';

// ============================================================================
// PERFORMANCE MONITORING STORAGE
// ============================================================================

const performanceMetrics = new Map<string, PerformanceMetric>();
const navigationMetrics: NavigationMetric[] = [];
const componentRenderTimes = new Map<string, number[]>();
const apiCallMetrics = new Map<string, { count: number; totalTime: number; errors: number }>();

// ============================================================================
// PERFORMANCE MONITORING API
// ============================================================================

export function markPerformance(name: string, metadata?: Record<string, any>): void {
  performanceMetrics.set(name, {
    name,
    startTime: performance.now(),
    metadata: metadata || {},
  });
}

export function measurePerformance(name: string): number | undefined {
  const metric = performanceMetrics.get(name);
  if (!metric) {
    console.warn(`No mark found for: ${name}`);
    return undefined;
  }

  const endTime = performance.now();
  const duration = endTime - metric.startTime;

  metric.endTime = endTime;
  metric.duration = duration;

  if (__DEV__) {
    console.log(`⏱ ${name}: ${duration.toFixed(2)}ms`, metric.metadata);
  }

  return duration;
}

export function startNavigation(from: string, to: string): void {
  navigationMetrics.push({
    from,
    to,
    startTime: performance.now(),
  });
}

export function endNavigation(from: string, to: string): void {
  const metric = navigationMetrics.find(
    m => m.from === from && m.to === to && !m.endTime
  );

  if (metric) {
    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;

    if (__DEV__) {
      console.log(`📍 Navigation ${from} → ${to}: ${metric.duration.toFixed(2)}ms`);
    }

    if (metric.duration > 300) {
      console.warn(`Slow navigation detected: ${from} → ${to} (${metric.duration.toFixed(2)}ms)`);
    }
  }
}

export function trackComponentRender(componentName: string, renderTime: number): void {
  if (!componentRenderTimes.has(componentName)) {
    componentRenderTimes.set(componentName, []);
  }

  const times = componentRenderTimes.get(componentName)!;
  times.push(renderTime);

  if (times.length > 10) {
    times.shift();
  }

  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  if (avgTime > 16.67) { // More than one frame (60fps)
    console.warn(`Slow render detected for ${componentName}: avg ${avgTime.toFixed(2)}ms`);
  }
}

export function trackAPICall(endpoint: string, duration: number, success: boolean): void {
  if (!apiCallMetrics.has(endpoint)) {
    apiCallMetrics.set(endpoint, { count: 0, totalTime: 0, errors: 0 });
  }

  const metric = apiCallMetrics.get(endpoint)!;
  metric.count++;
  metric.totalTime += duration;
  if (!success) {
    metric.errors++;
  }

  if (__DEV__) {
    const avgTime = metric.totalTime / metric.count;
    console.log(`🌐 API ${endpoint}: ${duration.toFixed(2)}ms (avg: ${avgTime.toFixed(2)}ms)`);
  }
}

export function getPerformanceSummary() {
  const navigationAvg = navigationMetrics
    .filter(m => m.duration)
    .reduce((acc, m) => acc + m.duration!, 0) / navigationMetrics.length || 0;

  const componentRenderAvg: Record<string, number> = {};
  componentRenderTimes.forEach((times, component) => {
    componentRenderAvg[component] = times.reduce((a, b) => a + b, 0) / times.length;
  });

  const apiMetrics: Record<string, any> = {};
  apiCallMetrics.forEach((metric, endpoint) => {
    apiMetrics[endpoint] = {
      avgTime: metric.totalTime / metric.count,
      errorRate: (metric.errors / metric.count) * 100,
      totalCalls: metric.count,
    };
  });

  return {
    navigation: {
      averageTime: navigationAvg,
      totalNavigations: navigationMetrics.length,
    },
    components: componentRenderAvg,
    api: apiMetrics,
    metrics: Array.from(performanceMetrics.values()).filter(m => m.duration),
  };
}

export function clearPerformanceMetrics(): void {
  performanceMetrics.clear();
  navigationMetrics.length = 0;
  componentRenderTimes.clear();
  apiCallMetrics.clear();
}

export function logPerformanceReport(): void {
  const summary = getPerformanceSummary();
  console.log('📊 Performance Report:');
  console.log('Navigation:', summary.navigation);
  console.log('Components:', summary.components);
  console.log('API Calls:', summary.api);
  
  const slowComponents = Object.entries(summary.components)
    .filter(([_, time]) => time > 16.67)
    .sort(([, a], [, b]) => b - a);
  
  if (slowComponents.length > 0) {
    console.warn('⚠️ Slow components detected:', slowComponents);
  }
}

// ============================================================================
// ASYNC UTILITIES
// ============================================================================

export async function measureAsync<T>(
  name: string,
  operation: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  markPerformance(name, metadata);
  try {
    const result = await operation();
    measurePerformance(name);
    return result;
  } catch (error) {
    measurePerformance(name);
    throw error;
  }
}

export function measureInteraction(name: string, callback: () => void): void {
  markPerformance(`interaction:${name}`);
  
  InteractionManager.runAfterInteractions(() => {
    const duration = measurePerformance(`interaction:${name}`);
    if (duration && duration > 100) {
      console.warn(`Slow interaction detected: ${name} (${duration.toFixed(2)}ms)`);
    }
    callback();
  });
}