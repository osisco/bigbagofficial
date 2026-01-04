import { useState, useCallback, useRef, useEffect } from 'react';
import { rollsApi, handleApiError } from '../services/api';
import { Roll } from '../types';

interface UseRollFeedOptions {
  category?: string;
  pageSize?: number;
  prefetchThreshold?: number;
}

export const useRollFeed = ({ 
  category = 'all', 
  pageSize = 3,
  prefetchThreshold = 2 
}: UseRollFeedOptions = {}) => {
  const [rolls, setRolls] = useState<Roll[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentIndex = useRef(0);
  const page = useRef(0);

  const loadMore = useCallback(async (reset = false) => {
    if (loading || (!hasMore && !reset)) return;
    
    setLoading(true);
    setError(null);

    try {
      const currentPage = reset ? 0 : page.current;
      const params: any = {
        page: currentPage,
        limit: pageSize,
      };

      if (category !== 'all') {
        params.category = category;
      }

      const response = await rollsApi.getAll(params);

      if (response.success && response.data) {
        const newRolls = response.data.filter((roll: any) => 
          roll && roll.id && roll.videoUrl
        );

        if (reset) {
          setRolls(newRolls);
          page.current = 1;
          currentIndex.current = 0;
        } else {
          setRolls(prev => [...prev, ...newRolls]);
          page.current += 1;
        }

        setHasMore(newRolls.length === pageSize);
      } else {
        setError(response.message || 'Failed to load rolls');
      }
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [category, pageSize, loading, hasMore]);

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      const visibleIndex = viewableItems[0]?.index || 0;
      currentIndex.current = visibleIndex;
      
      // Trigger prefetch when approaching end of loaded content
      if (visibleIndex >= rolls.length - prefetchThreshold && hasMore && !loading) {
        loadMore();
      }
    }
  }, [rolls.length, prefetchThreshold, hasMore, loading, loadMore]);

  const refresh = useCallback(() => {
    setHasMore(true);
    loadMore(true);
  }, [loadMore]);

  // Reset when category changes
  useEffect(() => {
    setRolls([]);
    setHasMore(true);
    page.current = 0;
    currentIndex.current = 0;
    loadMore(true);
  }, [category]);

  return {
    rolls,
    loading,
    hasMore,
    error,
    currentIndex: currentIndex.current,
    onViewableItemsChanged,
    loadMore,
    refresh,
  };
};