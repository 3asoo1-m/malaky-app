import React, { useEffect, useState } from 'react';
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
import * as NavigationBar from 'expo-navigation-bar';

// ✅ إضافة TanStack Query Provider
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';

// ✅ استيراد نظام الإشعارات
import { 
  registerForPushNotificationsAsync, 
  setupNotificationHandlers,
  clearBadgeCount 
} from '@/lib/notifications';
import { AppState } from 'react-native';

// ✅ استيراد نظام OTA للتحديثات التلقائية
import * as Updates from 'expo-updates';

// ✅ استيراد مكتبات إضافية للغة
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ar from '@/locales/ar.json';

// --- تهيئة اللغة العربية وإجبار RTL ---
const initializeArabicRTL = () => {
  try {
    I18nManager.forceRTL(true);
    I18nManager.allowRTL(true);
    
    if (I18nManager.swapLeftAndRightInRTL) {
      I18nManager.swapLeftAndRightInRTL(false);
    }
    
    console.log('✅ تم تفعيل اللغة العربية وتنسيق RTL بنجاح');
  } catch (error) {
    console.error('❌ فشل في تفعيل RTL:', error);
  }
};

// --- تهيئة نظام الترجمة ---
const initializeI18n = async () => {
  try {
    await i18n
      .use(initReactI18next)
      .init({
        resources: {
          ar: {
            translation: ar
          }
        },
        lng: 'ar',
        fallbackLng: 'ar',
        interpolation: {
          escapeValue: false
        }
      });
    
    console.log('✅ تم تهيئة نظام الترجمة باللغة العربية');
  } catch (error) {
    console.error('❌ فشل في تهيئة نظام الترجمة:', error);
  }
};

const InitializationWrapper = () => {
  const [isI18nInitialized, setIsI18nInitialized] = useState(false);

  useEffect(() => {
    initializeArabicRTL();
    
    const init = async () => {
      await initializeI18n();
      setIsI18nInitialized(true);
    };
    
    init();
  }, []);

  if (!isI18nInitialized) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#fff'
      }}>
        <ActivityIndicator size="large" color="#1D3557" />
        <Text style={{ marginTop: 10, fontSize: 16 }}>
          جاري تهيئة التطبيق...
        </Text>
      </View>
    );
  }

  return <AuthGuard />;
};

const AuthGuard = () => {
  const { user, initialLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  const { 
    loading: configLoading, 
    showMaintenance, 
    showForceUpdate, 
    appConfig, 
    handleUpdate 
  } = useAppConfig();

  // ✅ التأكد من تطبيق إعدادات RTL
  useEffect(() => {
    initializeArabicRTL();
  }, []);

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

    checkForOTAUpdates();
  }, []);

  // ✅ الحل الأفضل
  useEffect(() => {
    if (initialLoading || configLoading) return;

    if (showMaintenance || showForceUpdate) {
      return;
    }

    // ✅ تحسين التحقق من segments
    if (!segments || !Array.isArray(segments) || segments.length < 1) {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';

    if (user) {
      if (inAuthGroup) {
        router.replace('/');
      }
      registerForPushNotificationsAsync();
    } else {
      if (!inAuthGroup) {
        router.replace('/(auth)/login'); 
      }
    }
  }, [user, initialLoading, configLoading, showMaintenance, showForceUpdate, segments]);

  if (configLoading || initialLoading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#fff',
        direction: 'rtl'
      }}>
        <ActivityIndicator size="large" color="#1D3557" />
        <Text style={{ 
          marginTop: 10, 
          fontSize: 16, 
          fontFamily: 'Cairo-Regular', 
          color: '#1D3557',
          textAlign: 'right',
          writingDirection: 'rtl'
        }}>
          {configLoading ? 'جاري التحقق من التحديثات...' : 'جاري التحميل...'}
        </Text>
      </View>
    );
  }

  if (showMaintenance) {
    return <MaintenanceScreen />;
  }

  if (showForceUpdate) {
    return <ForceUpdateScreen />;
  }

  return <Slot />;
};

export default function RootLayout() {
  useEffect(() => {
    const hideNavigationBar = async () => {
      try {
        await NavigationBar.setVisibilityAsync('hidden');
        await NavigationBar.setBehaviorAsync('overlay-swipe');
        await NavigationBar.setBackgroundColorAsync('transparent');
        console.log('✅ تم إخفاء شريط التنقل بنجاح');
      } catch (error) {
        console.error('❌ فشل في إخفاء شريط التنقل:', error);
      }
    };

    hideNavigationBar();
  }, []);

  useEffect(() => {
    const { removeReceivedListener, removeResponseListener } = setupNotificationHandlers();

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        console.log('App has come to the foreground, clearing badge count.');
        clearBadgeCount();
      }
    });

    return () => {
      removeReceivedListener();
      removeResponseListener();
      subscription.remove();
    };
  }, []);

  return (
    <SafeAreaProvider>
      {/* ✅ إضافة QueryClientProvider في المستوى الأعلى */}
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <FavoritesProvider>
            <CartProvider>
              <View style={{ flex: 1, direction: 'rtl' }}>
                <InitializationWrapper />
              </View>
            </CartProvider>
          </FavoritesProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}