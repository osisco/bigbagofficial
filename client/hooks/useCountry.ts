
import { useState, useEffect, useCallback } from 'react';
import { useStorage } from './useStorage';
import { countriesApi, handleApiError } from '../services/api';
import { Country } from '../types';

export function useCountry() {
  const { value: selectedCountry, setValue: setSelectedCountry, isLoading: storageLoading } = useStorage('selectedCountry', 'US');
  const [availableCountries, setAvailableCountries] = useState<Country[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCountries = async () => {
      try {
        console.log('Loading countries from API...');
        const response = await countriesApi.getAll();
        
        if (response.success && response.data) {
          console.log('Countries loaded:', response.data);
          setAvailableCountries(response.data);
        } else {
          console.error('Failed to load countries:', response.message);
          setError(response.message || 'Failed to load countries');
        }
      } catch (err) {
        console.error('Error loading countries:', err);
        const errorMessage = handleApiError(err);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadCountries();
  }, []);

  const getCountryInfo = useCallback((countryCode: string) => {
    return availableCountries.find(country => country.code === countryCode) || availableCountries[0];
  }, [availableCountries]);

  const changeCountry = useCallback(async (countryCode: string) => {
    console.log('Changing country to:', countryCode);
    await setSelectedCountry(countryCode);
  }, [setSelectedCountry]);

  return {
    selectedCountry,
    changeCountry,
    getCountryInfo,
    isLoading: storageLoading || isLoading,
    availableCountries,
    error,
  };
}
