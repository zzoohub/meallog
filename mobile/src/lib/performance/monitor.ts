import { InteractionManager } from 'react-native';

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

interface NavigationMetric {
  from: string;
  to: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, PerformanceMetric> = new Map();
  private navigationMetrics: NavigationMetric[] = [];
  private componentRenderTimes: Map<string, number[]> = new Map();
  private apiCallMetrics: Map<string, { count: number; totalTime: number; errors: number }> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Mark the start of a performance measurement
  mark(name: string, metadata?: Record<string, any>) {
    this.metrics.set(name, {
      name,
      startTime: performance.now(),
      metadata,
    });
  }

  // Measure the duration since a mark was set
  measure(name: string): number | undefined {
    const metric = this.metrics.get(name);
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

  // Track navigation performance
  startNavigation(from: string, to: string) {
    this.navigationMetrics.push({
      from,
      to,
      startTime: performance.now(),
    });
  }

  endNavigation(from: string, to: string) {
    const metric = this.navigationMetrics.find(
      m => m.from === from && m.to === to && !m.endTime
    );

    if (metric) {
      metric.endTime = performance.now();
      metric.duration = metric.endTime - metric.startTime;

      if (__DEV__) {
        console.log(`📍 Navigation ${from} → ${to}: ${metric.duration.toFixed(2)}ms`);
      }

      // Alert if navigation takes too long
      if (metric.duration > 300) {
        console.warn(`Slow navigation detected: ${from} → ${to} (${metric.duration.toFixed(2)}ms)`);
      }
    }
  }

  // Track component render times
  trackComponentRender(componentName: string, renderTime: number) {
    if (!this.componentRenderTimes.has(componentName)) {
      this.componentRenderTimes.set(componentName, []);
    }

    const times = this.componentRenderTimes.get(componentName)!;
    times.push(renderTime);

    // Keep only last 10 render times
    if (times.length > 10) {
      times.shift();
    }

    // Warn if average render time is high
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    if (avgTime > 16.67) { // More than one frame (60fps)
      console.warn(`Slow render detected for ${componentName}: avg ${avgTime.toFixed(2)}ms`);
    }
  }

  // Track API call performance
  trackAPICall(endpoint: string, duration: number, success: boolean) {
    if (!this.apiCallMetrics.has(endpoint)) {
      this.apiCallMetrics.set(endpoint, { count: 0, totalTime: 0, errors: 0 });
    }

    const metric = this.apiCallMetrics.get(endpoint)!;
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

  // Get performance summary
  getSummary() {
    const navigationAvg = this.navigationMetrics
      .filter(m => m.duration)
      .reduce((acc, m) => acc + m.duration!, 0) / this.navigationMetrics.length || 0;

    const componentRenderAvg: Record<string, number> = {};
    this.componentRenderTimes.forEach((times, component) => {
      componentRenderAvg[component] = times.reduce((a, b) => a + b, 0) / times.length;
    });

    const apiMetrics: Record<string, any> = {};
    this.apiCallMetrics.forEach((metric, endpoint) => {
      apiMetrics[endpoint] = {
        avgTime: metric.totalTime / metric.count,
        errorRate: (metric.errors / metric.count) * 100,
        totalCalls: metric.count,
      };
    });

    return {
      navigation: {
        averageTime: navigationAvg,
        totalNavigations: this.navigationMetrics.length,
      },
      components: componentRenderAvg,
      api: apiMetrics,
      metrics: Array.from(this.metrics.values()).filter(m => m.duration),
    };
  }

  // Clear all metrics
  clear() {
    this.metrics.clear();
    this.navigationMetrics = [];
    this.componentRenderTimes.clear();
    this.apiCallMetrics.clear();
  }

  // Log performance report
  logReport() {
    const summary = this.getSummary();
    console.log('📊 Performance Report:');
    console.log('Navigation:', summary.navigation);
    console.log('Components:', summary.components);
    console.log('API Calls:', summary.api);
    
    // Identify bottlenecks
    const slowComponents = Object.entries(summary.components)
      .filter(([_, time]) => time > 16.67)
      .sort(([, a], [, b]) => b - a);
    
    if (slowComponents.length > 0) {
      console.warn('⚠️ Slow components detected:', slowComponents);
    }
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();

// Utility to measure async operations
export async function measureAsync<T>(
  name: string,
  operation: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  performanceMonitor.mark(name, metadata);
  try {
    const result = await operation();
    performanceMonitor.measure(name);
    return result;
  } catch (error) {
    performanceMonitor.measure(name);
    throw error;
  }
}

// Utility to measure interaction completion
export function measureInteraction(name: string, callback: () => void) {
  performanceMonitor.mark(`interaction:${name}`);
  
  InteractionManager.runAfterInteractions(() => {
    const duration = performanceMonitor.measure(`interaction:${name}`);
    if (duration && duration > 100) {
      console.warn(`Slow interaction detected: ${name} (${duration.toFixed(2)}ms)`);
    }
    callback();
  });
}

// React hook for performance monitoring
export function usePerformanceMonitor(componentName: string) {
  const startTime = performance.now();

  // Track render time
  requestAnimationFrame(() => {
    const renderTime = performance.now() - startTime;
    performanceMonitor.trackComponentRender(componentName, renderTime);
  });

  return {
    mark: (name: string) => performanceMonitor.mark(`${componentName}:${name}`),
    measure: (name: string) => performanceMonitor.measure(`${componentName}:${name}`),
  };
}