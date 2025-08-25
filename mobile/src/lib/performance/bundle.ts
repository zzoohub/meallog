import type { DomainModules, PreloadStrategy } from './types';
import { DOMAIN_IMPORT_MAP } from './config';
import { preloadComponent } from './lazy';

// ============================================================================
// BUNDLE MANAGEMENT
// ============================================================================

const loadedModules = new Set<string>();
const preloadPromises = new Map<string, Promise<any>>();

function getDomainImportFunction<K extends keyof DomainModules>(
  domain: K
): () => Promise<{ default: DomainModules[K] }> {
  return DOMAIN_IMPORT_MAP[domain] as () => Promise<{ default: DomainModules[K] }>;
}

async function scheduleIdlePreload(
  importFn: () => Promise<any>,
  domain: string
): Promise<void> {
  return new Promise((resolve) => {
    const callback = () => {
      if (!loadedModules.has(domain)) {
        preloadComponent(importFn);
        loadedModules.add(domain);
      }
      resolve();
    };

    if ('requestIdleCallback' in globalThis) {
      (globalThis as any).requestIdleCallback(callback, { timeout: 2000 });
    } else {
      setTimeout(callback, 100);
    }
  });
}

export async function importDomain<K extends keyof DomainModules>(
  domain: K, 
  strategy: PreloadStrategy = 'on-demand'
): Promise<() => Promise<{ default: DomainModules[K] }>> {
  const importFn = getDomainImportFunction(domain);
  
  if (strategy === 'eager' && !loadedModules.has(domain)) {
    preloadComponent(importFn);
    loadedModules.add(domain);
  } else if (strategy === 'idle' && !preloadPromises.has(domain)) {
    preloadPromises.set(domain, scheduleIdlePreload(importFn, domain));
  }

  return importFn;
}

export function preloadCriticalModules(): void {
  importDomain('camera', 'eager');
  importDomain('progress', 'idle');
}

export function getLoadedModulesCount(): number {
  return loadedModules.size;
}

export function isModuleLoaded(domain: keyof DomainModules): boolean {
  return loadedModules.has(domain);
}

export const importDomainMap = DOMAIN_IMPORT_MAP;