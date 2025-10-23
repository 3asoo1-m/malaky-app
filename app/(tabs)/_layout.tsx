// مسار الملف: app/(tabs)/_layout.tsx

import React from 'react';
import { Tabs } from 'expo-router';
import { FavoritesProvider } from '@/lib/useFavorites';

export default function TabLayout() {
  return (
    <FavoritesProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' }, // ✅ إخفاء التبويبات الافتراضية
        }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="favorites" />
        <Tabs.Screen name="cart" />
        <Tabs.Screen name="profile" />
        <Tabs.Screen name="notifications" />
        
        {/* الشاشات المخفية من التبويبات */}
        <Tabs.Screen name="menu/[categoryId]" options={{ href: null }} />
        <Tabs.Screen name="addresses" options={{ href: null }} />
      </Tabs>
    </FavoritesProvider>
  );
}