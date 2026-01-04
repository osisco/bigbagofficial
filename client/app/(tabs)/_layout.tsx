import React from 'react';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


import { ThemeProvider } from '../../hooks/useTheme';
import { useColors } from '../../styles/commonStyles';

function TabLayoutContent() {
  const colors = useColors();
  const insets = useSafeAreaInsets();



  const isAndroid = Platform.OS === 'android';
  
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        lazy: true,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 0,
          position: 'absolute',
          bottom: isAndroid  ? 0 : 0,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <Ionicons name="home-outline" size={20} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="shops"
        options={{
          title: 'Shops',
          tabBarIcon: ({ color }) => (
            <Ionicons name="storefront-outline" size={20} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="rolls"
        options={{
          title: 'Rolls',
          tabBarIcon: ({ color }) => (
            <Ionicons name="play-circle-outline" size={20} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="coupons"
        options={{
          title: 'Coupons',
          tabBarIcon: ({ color }) => (
            <Ionicons name="ticket-outline" size={20} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="categories"
        options={{
          title: 'Categories',
          tabBarIcon: ({ color }) => (
            <Ionicons name="grid-outline" size={20} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="favorites"
        options={{
          href: null, // Hide from tab bar
        }}
      />

      <Tabs.Screen
        name="account"
        options={{
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  return (
    <ThemeProvider>
      <TabLayoutContent />
    </ThemeProvider>
  );
}
