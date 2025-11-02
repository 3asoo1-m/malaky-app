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
import MaintenanceScreen from './maintenance';
import ForceUpdateScreen from './force-update';

// ✅ استيراد نظام الإشعارات
import { 
  registerForPushNotificationsAsync, 
  setupNotificationHandlers,
  clearBadgeCount 
} from '@/lib/notifications';
import { AppState } from 'react-native';

// ✅ استيراد نظام OTA للتحديثات التلقائية
import * as Updates from 'expo-updates';

// ✅ استيراد نظام التحليلات
import { initializeAnalytics, cleanupAnalytics } from '@/lib/analytics';

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

  // ✅ كود التحديث التلقائي OTA
  useEffect(() => {
    const checkForOTAUpdates = async () => {
      if (__DEV__) {
        console.log('OTA disabled in development');
        return;
      }
      
      try {
        console.log('🔍 جاري التحقق من تحديثات OTA...');
        const update = await Updates.checkForUpdateAsync();
        
        if (update.isAvailable) {
          console.log('📦 يوجد تحديث OTA جديد، جاري التحميل...');
          await Updates.fetchUpdateAsync();
          console.log('✅ تم تحميل التحديث، جاري إعادة التشغيل...');
          await Updates.reloadAsync();
        } else {
          console.log('✅ التطبيق محدث بالفعل - لا يوجد تحديثات OTA جديدة');
        }
      } catch (error) {
        console.log('❌ فشل التحقق من تحديثات OTA:', error);
      }
    };

    // تحقق من التحديثات عند فتح التطبيق
    checkForOTAUpdates();
  }, []);

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

  // ✅ عرض شاشات التحميل
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
    return <MaintenanceScreen />;
  }

  // ✅ عرض شاشة التحديث الإجباري
  if (showForceUpdate) {
    return <ForceUpdateScreen />;
  }

  return <Slot />;
};

export default function RootLayout() {
  
  // ✅ إعداد أنظمة التطبيق
  useEffect(() => {
    // تهيئة نظام التحليلات
    initializeAnalytics().then(() => {
      console.log('✅ Analytics system initialized');
    }).catch(error => {
      console.error('❌ Analytics initialization failed:', error);
    });
    
    // إعداد معالجات الإشعارات
    const { removeReceivedListener, removeResponseListener } = setupNotificationHandlers();

    // التعامل مع حالة التطبيق
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        console.log('App has come to the foreground, clearing badge count.');
        clearBadgeCount();
      }
    });

    // دالة التنظيف (Cleanup function)
    return () => {
      removeReceivedListener();
      removeResponseListener();
      subscription.remove();
      cleanupAnalytics(); // ✅ تنظيف نظام التحليلات
      console.log('🧹 Analytics system cleaned up');
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