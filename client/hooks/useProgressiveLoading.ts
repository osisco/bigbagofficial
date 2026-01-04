import { useState, useCallback } from 'react';

interface LoadingState {
  [key: string]: boolean;
}

interface UseProgressiveLoadingReturn {
  loadingStates: LoadingState;
  setLoading: (key: string, loading: boolean) => void;
  resetLoading: (keys: string[]) => void;
  isAnyLoading: boolean;
  isAllLoaded: boolean;
}

export const useProgressiveLoading = (initialKeys: string[]): UseProgressiveLoadingReturn => {
  const [loadingStates, setLoadingStates] = useState<LoadingState>(() => {
    const initial: LoadingState = {};
    initialKeys.forEach(key => {
      initial[key] = true;
    });
    return initial;
  });

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: loading }));
  }, []);

  const resetLoading = useCallback((keys: string[]) => {
    setLoadingStates(prev => {
      const newState = { ...prev };
      keys.forEach(key => {
        newState[key] = true;
      });
      return newState;
    });
  }, []);

  const isAnyLoading = Object.values(loadingStates).some(loading => loading);
  const isAllLoaded = Object.values(loadingStates).every(loading => !loading);

  return {
    loadingStates,
    setLoading,
    resetLoading,
    isAnyLoading,
    isAllLoaded,
  };
};