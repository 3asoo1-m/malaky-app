// مسار الملف: app/_layout.tsx

import React, { useEffect, useRef } from 'react'; // 1. استيراد useRef
import { Slot, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '@/lib/useAuth';
import { ActivityIndicator, View, I18nManager } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FavoritesProvider } from '@/lib/useFavorites';
import { CartProvider } from '@/lib/useCart';

// 2. استيراد دالتي التسجيل والإلغاء
import { registerForPushNotificationsAsync, unregisterForPushNotificationsAsync } from '@/lib/notifications';

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

  // 2. إنشاء متغير ref لتتبع المحاولة
  const notificationRegistrationAttempted = useRef(false);

  useEffect(() => {
    if (initialLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (user) {
      // المستخدم مسجل دخوله
      if (inAuthGroup) {
        router.replace('/');
      }
      
      // 3. التحقق من العلم قبل الاستدعاء
      if (!notificationRegistrationAttempted.current) {
        console.log("User authenticated. Attempting to register for push notifications (ONCE)...");
        registerForPushNotificationsAsync();
        notificationRegistrationAttempted.current = true; // 4. رفع العلم لمنع الاستدعاء مرة أخرى
      }

    } else {
      // المستخدم غير مسجل دخوله
      if (!inAuthGroup) {
        router.replace('/(auth)/login'); 
      }
      
      // 5. إعادة تعيين العلم عند تسجيل الخروج
      if (notificationRegistrationAttempted.current) {
        console.log("User logged out. Unregistering push token...");
        unregisterForPushNotificationsAsync();
        notificationRegistrationAttempted.current = false; 
      }
    }
  }, [user, initialLoading, segments, router]); // الاعتماديات تبقى كما هي

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
