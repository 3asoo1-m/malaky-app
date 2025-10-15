// مسار الملف: app/_layout.tsx

import React, { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '@/lib/useAuth';
import { ActivityIndicator, View, I18nManager } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FavoritesProvider } from '@/lib/useFavorites';
import { CartProvider } from '@/lib/useCart';

// ✅✅✅ 1. استيراد الدوال الجديدة والمهمة ✅✅✅
import { 
  registerForPushNotificationsAsync, 
  setupNotificationHandlers,
  clearBadgeCount 
} from '@/lib/notifications';
import { AppState } from 'react-native';

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
    if (initialLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (user) {
      // المستخدم مسجل دخوله
      if (inAuthGroup) {
        router.replace('/');
      }
      // ✅✅✅ 2. تسجيل التوكن عند تسجيل الدخول ✅✅✅
      // لا حاجة لـ useRef، هذا سيتم استدعاؤه مرة واحدة عند تغير user من null إلى قيمة
      console.log("User authenticated. Registering for push notifications...");
      registerForPushNotificationsAsync();

    } else {
      // المستخدم غير مسجل دخوله
      if (!inAuthGroup) {
        router.replace('/(auth)/login'); 
      }
    }
  }, [user, initialLoading]); // ✅ الاعتماد على user و initialLoading فقط

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
  
  // ✅✅✅ 3. إعداد معالجات الإشعارات والتطبيق ✅✅✅
  useEffect(() => {
    // --- إعداد معالجات النقر على الإشعارات ---
    const { removeReceivedListener, removeResponseListener } = setupNotificationHandlers();

    // --- التعامل مع حالة التطبيق (عندما يعود المستخدم للتطبيق) ---
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      // إذا عاد المستخدم إلى التطبيق وهو في المقدمة
      if (nextAppState === 'active') {
        console.log('App has come to the foreground, clearing badge count.');
        // قم بمسح عداد الإشعارات على أيقونة التطبيق
        clearBadgeCount();
      }
    });

    // --- دالة التنظيف (Cleanup function) ---
    // يتم استدعاؤها عند إغلاق المكون لتجنب تسرب الذاكرة
    return () => {
      removeReceivedListener();
      removeResponseListener();
      subscription.remove();
    };
  }, []); // ✅ مصفوفة فارغة تعني أن هذا الـ effect يعمل مرة واحدة فقط عند تحميل التطبيق

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
