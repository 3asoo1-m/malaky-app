// مسار الملف: app/_layout.tsx

import React, { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '@/lib/useAuth';
import { ActivityIndicator, View, I18nManager  } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FavoritesProvider } from '@/lib/useFavorites';
import { CartProvider } from '@/lib/useCart'; // ✅ 1. استيراد مزود السلة

try {
  // فرض اتجاه اليمين إلى اليسار
  I18nManager.forceRTL(true);
  // السماح بالتقليب (مهم لبعض المكونات)
  I18nManager.allowRTL(true);
} catch (e) {
  console.error('Failed to force RTL:', e);
}

const AuthGuard = () => {
  const { user, initialLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (initialLoading) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!user && !inAuthGroup) {
      router.replace('/login');
    } else if (user && inAuthGroup) {
      router.replace('/');
    }
  }, [user, initialLoading, segments, router]);

  if (initialLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Slot />;
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <FavoritesProvider>
          <CartProvider>
            <AuthGuard />
          </CartProvider>
        </FavoritesProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
