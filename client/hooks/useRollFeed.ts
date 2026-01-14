import { useState, useCallback, useRef, useEffect } from 'react';
import { rollsApi, handleApiError } from '../services/api';
import { Roll } from '../types';
import { prefetchCache, CACHE_KEYS } from '../utils/prefetchCache';

interface UseRollFeedOptions {
  category?: string;
  batchSize?: number;
  prefetchBatches?: number;
}

export const useRollFeed = ({ 
  category = 'all', 
  batchSize = 10,
  prefetchBatches = 2
}: UseRollFeedOptions = {}) => {
  const [rolls, setRolls] = useState<Roll[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentIndex = useRef(0);
  const loadedBatches = useRef(0);
  const isLoadingBatch = useRef(false);
  const lastCursor = useRef<string | null>(null);

  const loadBatch = useCallback(async (batchNumber: number) => {
    if (isLoadingBatch.current) return;
    
    isLoadingBatch.current = true;
    setError(null);

    try {
      const params: any = {
        limit: batchSize,
      };

      if (category !== 'all') {
        params.category = category;
      }

      // Use cursor for pagination instead of page numbers
      if (batchNumber > 0 && lastCursor.current) {
        params.cursor = lastCursor.current;
      }

      const response = await rollsApi.getAll(params);

      if (response.success && response.data) {
        const newRolls = response.data.filter((roll: any) => 
          roll && roll.id && roll.videoUrl
        );

        setRolls(prev => {
          // Deduplicate by ID to prevent duplicate keys
          const existingIds = new Set(prev.map(r => r.id));
          const uniqueNewRolls = newRolls.filter(r => r.id && !existingIds.has(r.id));
          return [...prev, ...uniqueNewRolls];
        });
        setHasMore(newRolls.length === batchSize);
        loadedBatches.current = batchNumber + 1;
        
        // Update cursor for next batch
        if (newRolls.length > 0) {
          lastCursor.current = newRolls[newRolls.length - 1].createdAt;
        }
      } else {
        setError(response.message || 'Failed to load rolls');
      }
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
    } finally {
      isLoadingBatch.current = false;
    }
  }, [category, batchSize]);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setRolls([]);
    loadedBatches.current = 0;
    currentIndex.current = 0;
    lastCursor.current = null;
    
    // Check prefetch cache first (only for 'all' category)
    if (category === 'all') {
      const prefetchedRoll = prefetchCache.get(CACHE_KEYS.ROLLS_FIRST);
      if (prefetchedRoll) {
        // Use prefetched roll as first item
        setRolls([prefetchedRoll]);
        loadedBatches.current = 1;
        if (prefetchedRoll.createdAt) {
          lastCursor.current = prefetchedRoll.createdAt;
        }
        // Continue loading rest of batch
        const remainingLimit = batchSize - 1;
        if (remainingLimit > 0 && lastCursor.current) {
          try {
            const response = await rollsApi.getAll({
              limit: remainingLimit,
              cursor: lastCursor.current,
            });
            if (response.success && response.data) {
              const newRolls = response.data.filter((roll: any) => 
                roll && roll.id && roll.videoUrl && roll.id !== prefetchedRoll.id
              );
              setRolls(prev => [...prev, ...newRolls]);
              if (newRolls.length > 0) {
                lastCursor.current = newRolls[newRolls.length - 1].createdAt;
              }
              setHasMore(newRolls.length === remainingLimit);
            }
          } catch (err) {
            console.warn('Error loading remaining rolls after prefetch:', err);
          }
        }
        setLoading(false);
        return;
      }
    }
    
    // No prefetch cache, load normally
    await loadBatch(0);
    if (prefetchBatches > 1 && lastCursor.current) {
      // Load second batch immediately after first completes (cursor is now set)
      await loadBatch(1);
    }
    
    setLoading(false);
  }, [loadBatch, prefetchBatches, category, batchSize]);

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      const visibleIndex = viewableItems[0]?.index || 0;
      currentIndex.current = visibleIndex;
      
      // Calculate which batch user is viewing
      const currentBatch = Math.floor(visibleIndex / batchSize);
      const nextBatchToLoad = loadedBatches.current;
      
      // Load next batch when user is halfway through current loaded content
      if (currentBatch >= nextBatchToLoad - prefetchBatches && hasMore && !isLoadingBatch.current) {
        loadBatch(nextBatchToLoad);
      }
    }
  }, [batchSize, prefetchBatches, hasMore, loadBatch]);

  const refresh = useCallback(() => {
    setHasMore(true);
    loadInitial();
  }, [loadInitial]);

  // Reset when category changes
  useEffect(() => {
    setHasMore(true);
    loadInitial();
  }, [category, loadInitial]);

  return {
    rolls,
    loading,
    hasMore,
    error,
    currentIndex: currentIndex.current,
    onViewableItemsChanged,
    refresh,
  };
};