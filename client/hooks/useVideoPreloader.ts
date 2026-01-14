import { useRef, useCallback, useEffect } from 'react';
import { Roll } from '../types';

interface VideoPreloaderOptions {
  preloadCount?: number;
  maxCacheSize?: number;
}

export const useVideoPreloader = ({ 
  preloadCount = 3, 
  maxCacheSize = 5 
}: VideoPreloaderOptions = {}) => {
  const playersCache = useRef<Map<string, any>>(new Map());
  const preloadQueue = useRef<Set<string>>(new Set());

  const preloadVideos = useCallback((rolls: Roll[], currentIndex: number) => {
    // Clear old preload queue
    preloadQueue.current.clear();

    // Add current and next videos to preload queue
    for (let i = 0; i < preloadCount; i++) {
      const targetIndex = currentIndex + i;
      if (targetIndex < rolls.length) {
        const roll = rolls[targetIndex];
        if (roll?.videoUrl) {
          preloadQueue.current.add(roll.videoUrl);
        }
      }
    }
  }, [preloadCount]);

  const shouldPreload = useCallback((videoUrl: string) => {
    return preloadQueue.current.has(videoUrl);
  }, []);

  const cleanup = useCallback(() => {
    playersCache.current.clear();
    preloadQueue.current.clear();
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    preloadVideos,
    shouldPreload,
    cleanup,
  };
};