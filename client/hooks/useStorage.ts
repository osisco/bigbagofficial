
import { useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export function useStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);

  const loadValue = useCallback(async () => {
    try {
      setIsLoading(true);
      let storedValue: string | null = null;
      
      if (Platform.OS === 'web') {
        storedValue = localStorage.getItem(key);
      } else {
        storedValue = await SecureStore.getItemAsync(key);
      }
      
      if (storedValue !== null) {
        setValue(JSON.parse(storedValue));
      }
    } catch (error) {
      console.log('Error loading value from storage:', error);
    } finally {
      setIsLoading(false);
    }
  }, [key]);

  useEffect(() => {
    loadValue();
  }, [loadValue]);

  const storeValue = async (newValue: T) => {
    try {
      setValue(newValue);
      const stringValue = JSON.stringify(newValue);
      
      if (Platform.OS === 'web') {
        localStorage.setItem(key, stringValue);
      } else {
        await SecureStore.setItemAsync(key, stringValue);
      }
    } catch (error) {
      console.log('Error storing value:', error);
    }
  };

  const removeValue = async () => {
    try {
      setValue(defaultValue);
      
      if (Platform.OS === 'web') {
        localStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.log('Error removing value:', error);
    }
  };

  return {
    value,
    setValue: storeValue,
    removeValue,
    isLoading,
  };
}
