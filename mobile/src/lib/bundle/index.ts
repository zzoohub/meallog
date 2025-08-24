import { ComponentType } from 'react';
import { preloadComponent } from '@/lib/lazy';

type DomainModules = {
  camera: ComponentType<any>;
  meals: ComponentType<any>;
  aiCoach: ComponentType<any>;
  settings: ComponentType<any>;
  progress: ComponentType<any>;
};

type PreloadStrategy = 'eager' | 'on-demand' | 'idle';

class BundleManager {
  private loadedModules = new Set<string>();
  private preloadPromises = new Map<string, Promise<any>>();

  async importDomain<K extends keyof DomainModules>(
    domain: K, 
    strategy: PreloadStrategy = 'on-demand'
  ): Promise<() => Promise<{ default: DomainModules[K] }>> {
    const importFn = this.getDomainImportFunction(domain);
    
    if (strategy === 'eager' && !this.loadedModules.has(domain)) {
      preloadComponent(importFn);
      this.loadedModules.add(domain);
    } else if (strategy === 'idle' && !this.preloadPromises.has(domain)) {
      this.preloadPromises.set(domain, this.scheduleIdlePreload(importFn, domain));
    }

    return importFn;
  }

  private getDomainImportFunction<K extends keyof DomainModules>(
    domain: K
  ): () => Promise<{ default: DomainModules[K] }> {
    const importMap = {
      camera: () => import('@/domains/camera/components/OrbitalCamera'),
      meals: () => import('../../../app/meal-history'), 
      aiCoach: () => import('@/domains/ai-coach/components/AICoach'),
      settings: () => import('@/domains/settings/components/SettingsOrbital'),
      progress: () => import('@/domains/progress/components/ProgressDashboard'),
    };

    return importMap[domain] as () => Promise<{ default: DomainModules[K] }>;
  }

  private async scheduleIdlePreload(
    importFn: () => Promise<any>,
    domain: string
  ): Promise<void> {
    return new Promise((resolve) => {
      const callback = () => {
        if (!this.loadedModules.has(domain)) {
          preloadComponent(importFn);
          this.loadedModules.add(domain);
        }
        resolve();
      };

      if ('requestIdleCallback' in window) {
        requestIdleCallback(callback, { timeout: 2000 });
      } else {
        setTimeout(callback, 100);
      }
    });
  }

  preloadCriticalModules(): void {
    this.importDomain('camera', 'eager');
    this.importDomain('progress', 'idle');
  }

  getLoadedModulesCount(): number {
    return this.loadedModules.size;
  }

  isModuleLoaded(domain: keyof DomainModules): boolean {
    return this.loadedModules.has(domain);
  }
}

export const bundleManager = new BundleManager();

export const importDomain = {
  camera: () => import('@/domains/camera/components/OrbitalCamera'),
  meals: () => import('../../../app/meal-history'),
  aiCoach: () => import('@/domains/ai-coach/components/AICoach'),
  settings: () => import('@/domains/settings/components/SettingsOrbital'),
  progress: () => import('@/domains/progress/components/ProgressDashboard'),
} as const;