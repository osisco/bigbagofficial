/**
 * useTabPrefetch Hook
 * Centralized prefetch manager for inactive tabs
 * Preloads only the first item per tab in a low-priority, lazy way
 */

import { useEffect, useRef, useCallback } from 'react';
import { rollsApi, couponsApi, categoriesApi } from '../services/api';
import { prefetchCache, CACHE_KEYS } from '../utils/prefetchCache';
import { Roll, Coupon, Category } from '../types';

interface PrefetchOptions {
  delay?: number; // Delay before starting prefetch (ms)
  enabled?: boolean; // Whether prefetch is enabled
  onComplete?: () => void; // Callback when prefetch completes
}

/**
 * Prefetch first roll (metadata only, no video loading)
 */
const prefetchFirstRoll = async (): Promise<Roll | null> => {
  try {
    // Check cache first
    const cached = prefetchCache.get(CACHE_KEYS.ROLLS_FIRST);
    if (cached) return cached;

    // Fetch only first roll with minimal data
    const response = await rollsApi.getAll({ limit: 1 });
    
    if (response.success && response.data && response.data.length > 0) {
      const firstRoll = response.data[0];
      
      // Store in cache (5 minutes stale time)
      prefetchCache.set(CACHE_KEYS.ROLLS_FIRST, firstRoll, 5 * 60 * 1000);
      
      return firstRoll;
    }
    
    return null;
  } catch (error) {
    console.warn('[Prefetch] Failed to prefetch first roll:', error);
    return null;
  }
};

/**
 * Prefetch first coupon
 */
const prefetchFirstCoupon = async (): Promise<Coupon | null> => {
  try {
    const cached = prefetchCache.get(CACHE_KEYS.COUPONS_FIRST);
    if (cached) return cached;

    const response = await couponsApi.getAll({ page: 1, limit: 1 });
    
    if (response.success && response.data && response.data.length > 0) {
      const firstCoupon = response.data[0];
      prefetchCache.set(CACHE_KEYS.COUPONS_FIRST, firstCoupon, 5 * 60 * 1000);
      return firstCoupon;
    }
    
    return null;
  } catch (error) {
    console.warn('[Prefetch] Failed to prefetch first coupon:', error);
    return null;
  }
};

/**
 * Prefetch all categories (needed for category tab)
 */
const prefetchCategories = async (): Promise<Category[] | null> => {
  try {
    const cached = prefetchCache.get(CACHE_KEYS.CATEGORIES_ALL);
    if (cached) return cached;

    const response = await categoriesApi.getAll();
    
    if (response.success && response.data) {
      prefetchCache.set(CACHE_KEYS.CATEGORIES_ALL, response.data, 10 * 60 * 1000); // 10 min for categories
      return response.data;
    }
    
    return null;
  } catch (error) {
    console.warn('[Prefetch] Failed to prefetch categories:', error);
    return null;
  }
};

/**
 * Main prefetch hook
 * Triggers prefetch after delay, only once per mount
 */
export const useTabPrefetch = (options: PrefetchOptions = {}) => {
  const { delay = 800, enabled = true, onComplete } = options;
  const hasPrefetched = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const prefetchAll = useCallback(async () => {
    if (!enabled || hasPrefetched.current) return;
    
    hasPrefetched.current = true;
    
    // Create abort controller for cancellation
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      // Prefetch in parallel but with low priority
      // Use Promise.allSettled to not fail if one fails
      const results = await Promise.allSettled([
        prefetchFirstRoll(),
        prefetchFirstCoupon(),
        // Categories prefetch happens after home page loads (see home screen)
      ]);

      if (abortController.signal.aborted) return;

      // Log results (can be removed in production)
      const [rollsResult, couponsResult] = results;
      if (rollsResult.status === 'fulfilled' && rollsResult.value) {
        console.log('[Prefetch] First roll cached');
      }
      if (couponsResult.status === 'fulfilled' && couponsResult.value) {
        console.log('[Prefetch] First coupon cached');
      }

      onComplete?.();
    } catch (error) {
      console.warn('[Prefetch] Error during prefetch:', error);
    }
  }, [enabled, onComplete]);

  useEffect(() => {
    if (!enabled) return;

    // Delay prefetch to not block initial render
    const timeoutId = setTimeout(() => {
      // Use requestIdleCallback if available, otherwise setTimeout
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(() => {
          prefetchAll();
        }, { timeout: 2000 });
      } else {
        // Fallback for React Native
        setTimeout(() => {
          prefetchAll();
        }, 100);
      }
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      // Cancel ongoing requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [delay, enabled, prefetchAll]);

  return {
    prefetchAll,
    hasPrefetched: hasPrefetched.current,
  };
};

/**
 * Hook to get prefetched data for a tab
 */
export const usePrefetchedData = <T>(cacheKey: string): T | null => {
  return prefetchCache.get(cacheKey) as T | null;
};

/**
 * Prefetch categories (called after home page finishes loading)
 */
export const prefetchCategoriesAfterHome = async (): Promise<void> => {
  try {
    await prefetchCategories();
    console.log('[Prefetch] Categories cached');
  } catch (error) {
    console.warn('[Prefetch] Failed to prefetch categories:', error);
  }
};
