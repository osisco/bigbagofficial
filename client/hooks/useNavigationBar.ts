import { useState, useEffect } from 'react';
import { Dimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function useNavigationBar() {
  const [hasNavigationBar, setHasNavigationBar] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (Platform.OS === 'android') {
      // On Android, if bottom inset is 0, device likely has navigation buttons
      // If bottom inset > 0, device likely uses gesture navigation
      setHasNavigationBar(insets.bottom === 0);
    } else {
      // iOS devices don't have navigation buttons
      setHasNavigationBar(false);
    }
  }, [insets.bottom]);

  return {
    hasNavigationBar,
    navigationBarHeight: hasNavigationBar ? 48 : 0, // Standard Android nav bar height
  };
}