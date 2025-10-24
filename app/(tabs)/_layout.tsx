import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FavoritesProvider } from '@/lib/useFavorites';

export default function TabLayout() {
  return (
    <FavoritesProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#C62828',
          tabBarInactiveTintColor: '#999',
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopWidth: 1,
            borderTopColor: '#eee',
            height: 85,
            paddingBottom: 20,
          },
        }}
      >
        {/* ✅ التبويبات الظاهرة */}
        <Tabs.Screen 
          name="index" 
          options={{
            title: 'الرئيسية',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen 
          name="favorites" 
          options={{
            title: 'المفضلة',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="heart-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen 
          name="cart" 
          options={{
            title: 'السلة',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="cart-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen 
          name="profile" 
          options={{
            title: 'حسابي',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-outline" size={size} color={color} />
            ),
          }}
        />
        
        {/* ✅ الشاشات المخفية */}
        <Tabs.Screen name="notifications" options={{ href: null }} />
        <Tabs.Screen name="menu/[categoryId]" options={{ href: null }} />
        <Tabs.Screen name="addresses" options={{ href: null }} />
      </Tabs>
    </FavoritesProvider>
  );
}