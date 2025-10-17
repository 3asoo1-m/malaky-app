// مسار الملف: app/_layout.tsx

import React, { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '@/lib/useAuth';
import { ActivityIndicator, View, I18nManager, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FavoritesProvider } from '@/lib/useFavorites';
import { CartProvider } from '@/lib/useCart';

// ✅ استيراد نظام الصيانة والتحديثات
import { useAppConfig } from '@/hooks/useAppConfig';
import { MaintenanceScreen } from '@/components/MaintenanceScreen';
import { ForceUpdateScreen } from '@/components/ForceUpdateScreen';

// ✅ استيراد نظام الإشعارات
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

  // ✅ استخدام نظام الصيانة والتحديثات داخل AuthGuard
  const { 
    loading: configLoading, 
    showMaintenance, 
    showForceUpdate, 
    appConfig, 
    handleUpdate 
  } = useAppConfig();

  useEffect(() => {
    if (initialLoading || configLoading) return;

    // ✅ إذا كان التطبيق تحت الصيانة أو يحتاج تحديث إجباري، لا نتحقق من المصادقة
    if (showMaintenance || showForceUpdate) {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';

    if (user) {
      // المستخدم مسجل دخوله
      if (inAuthGroup) {
        router.replace('/');
      }
      // ✅ تسجيل التوكن عند تسجيل الدخول
      console.log("User authenticated. Registering for push notifications...");
      registerForPushNotificationsAsync();

    } else {
      // المستخدم غير مسجل دخوله
      if (!inAuthGroup) {
        router.replace('/(auth)/login'); 
      }
    }
  }, [user, initialLoading, configLoading, showMaintenance, showForceUpdate]);

  // ✅ عرض شاشات الصيانة والتحديث إذا لزم الأمر
  if (configLoading || initialLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#1D3557" />
        <Text style={{ marginTop: 10, fontSize: 16, fontFamily: 'Cairo-Regular', color: '#1D3557' }}>
          {configLoading ? 'جاري التحقق من التحديثات...' : 'جاري التحميل...'}
        </Text>
      </View>
    );
  }

  // ✅ عرض شاشة الصيانة
  if (showMaintenance) {
    return <MaintenanceScreen message={appConfig.maintenance_message} />;
  }

  // ✅ عرض شاشة التحديث الإجباري
  if (showForceUpdate) {
    return (
      <ForceUpdateScreen 
        message={appConfig.force_update_message || 'يوجد تحديث جديد مطلوب'}
        onUpdate={handleUpdate}
      />
    );
  }

  return <Slot />;
};

export default function RootLayout() {
  
  // ✅ إعداد معالجات الإشعارات والتطبيق
  useEffect(() => {
    // إعداد معالجات النقر على الإشعارات
    const { removeReceivedListener, removeResponseListener } = setupNotificationHandlers();

    // التعامل مع حالة التطبيق (عندما يعود المستخدم للتطبيق)
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      // إذا عاد المستخدم إلى التطبيق وهو في المقدمة
      if (nextAppState === 'active') {
        console.log('App has come to the foreground, clearing badge count.');
        // مسح عداد الإشعارات على أيقونة التطبيق
        clearBadgeCount();
      }
    });

    // دالة التنظيف (Cleanup function)
    return () => {
      removeReceivedListener();
      removeResponseListener();
      subscription.remove();
    };
  }, []);

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