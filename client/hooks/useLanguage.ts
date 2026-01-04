
import { useState, useEffect, useCallback } from 'react';
import { useStorage } from './useStorage';
import { languagesApi, handleApiError } from '../services/api';
import { Language } from '../types';

export function useLanguage() {
  const { value: selectedLanguage, setValue: setSelectedLanguage, isLoading: storageLoading } = useStorage('selectedLanguage', 'en');
  const [availableLanguages, setAvailableLanguages] = useState<Language[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load available languages from API
  useEffect(() => {
    const loadLanguages = async () => {
      try {
        console.log('Loading languages from API...');
        const response = await languagesApi.getAll();
        
        if (response.success && response.data) {
          console.log('Languages loaded:', response.data);
          setAvailableLanguages(response.data);
        } else {
          console.error('Failed to load languages:', response.message);
          setError(response.message || 'Failed to load languages');
        }
      } catch (err) {
        console.error('Error loading languages:', err);
        const errorMessage = handleApiError(err);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadLanguages();
  }, []);

  const getLanguageInfo = useCallback((languageCode: string) => {
    return availableLanguages.find(lang => lang.code === languageCode) || availableLanguages[0];
  }, [availableLanguages]);

  const changeLanguage = useCallback(async (languageCode: string) => {
    console.log('Changing language to:', languageCode);
    await setSelectedLanguage(languageCode);
  }, [setSelectedLanguage]);

  return {
    selectedLanguage,
    changeLanguage,
    getLanguageInfo,
    isLoading: storageLoading || isLoading,
    availableLanguages,
    error,
  };
}
