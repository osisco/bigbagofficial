
import { useState, useEffect } from 'react';
import { favoriteApi, handleApiError } from '../services/api';
import { Shop } from '../types';

export function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const response = await favoriteApi.getFavoriteShops();
      if (response.success && response.data) {
        const ids = response.data.map((shop: Shop) => shop.id || shop._id);
        setFavoriteIds(ids);
      }
    } catch (error) {
      console.error('Error loading favorites:', handleApiError(error));
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFavorite = async (shopId: string) => {
    try {
      const response = await favoriteApi.addFavoriteShop(shopId);
      if (response.success && response.data) {
        const ids = response.data.favorites || [];
        setFavoriteIds(ids);
      }
    } catch (error) {
      console.error('Error toggling favorite:', handleApiError(error));
    }
  };

  const isFavorite = (shopId: string) => {
    return favoriteIds.includes(shopId);
  };

  return {
    favoriteIds,
    toggleFavorite,
    isFavorite,
    isLoading,
    loadFavorites,
  };
}
