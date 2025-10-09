// مسار الملف: app/_layout.tsx

import React, { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '@/lib/useAuth';
import { ActivityIndicator, View, I18nManager } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FavoritesProvider } from '@/lib/useFavorites';
import { CartProvider } from '@/lib/useCart';

// ✅ 1. استيراد الدالة الجديدة والمباشرة
import { registerForPushNotificationsAsync } from '@/lib/notifications'; // تأكد من أن المسار صحيح

// --- كود RTL يبقى كما هو ---
try {
  I18nManager.forceRTL(true);
  I18nManager.allowRTL(true);
} catch (e) {
  console.error('Failed to force RTL:', e);
}

const AuthGuard = () => {
  const { user, initialLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (initialLoading) return; // انتظر حتى ينتهي التحميل الأولي

    const inAuthGroup = segments[0] === '(auth)';

    if (user) {
      // المستخدم مسجل دخوله
      if (inAuthGroup) {
        // إذا كان في صفحة تسجيل الدخول، انقله للصفحة الرئيسية
        router.replace('/');
      }
      // ✅ 2. بما أن المستخدم مسجل دخوله، قم بتسجيل توكن الإشعارات
      console.log("User is authenticated, registering for push notifications...");
      registerForPushNotificationsAsync();

    } else {
      // المستخدم غير مسجل دخوله
      if (!inAuthGroup) {
        // إذا لم يكن في مجموعة المصادقة، انقله لصفحة تسجيل الدخول
        router.replace('/(auth)/login'); 
      }
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
