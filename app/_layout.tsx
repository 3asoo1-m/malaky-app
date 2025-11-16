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
import { useGlobalImagePerformance } from '@/hooks/useImagePerformance';

import { useDataPerformance } from '@/hooks/useDataPerformance';
import { PerformanceMonitor } from '@/components/PerformanceMonitor';
import { setQueryTracker } from '@/lib/query-client';

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
  const { setupGlobalImageTracking } = useGlobalImagePerformance();

  useEffect(() => {
    initializeArabicRTL();
    
    const init = async () => {
      await initializeI18n();
      setIsI18nInitialized(true);
      
      // ✅ تفعيل تتبع أداء الصور عالمياً
      setupGlobalImageTracking();
    };
    
    init();
  }, [setupGlobalImageTracking]);

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

  // ✅ استخدام hook أداء الصور للحصول على التقارير
  const { getPerformanceReport } = useGlobalImagePerformance();

  // ✅ التأكد من تطبيق إعدادات RTL
  useEffect(() => {
    initializeArabicRTL();
  }, []);

  // ✅ كود التحديث التلقائي OTA محسن
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

  // ✅ مراقبة أداء الصور في development
  useEffect(() => {
    if (__DEV__) {
      const interval = setInterval(() => {
        const report = getPerformanceReport();
        if (report.totalImages > 0) {
          console.log('📈 Image Performance Report:', {
            totalImages: report.totalImages,
            successRate: `${report.successRate.toFixed(1)}%`,
            averageLoadTime: `${report.averageLoadTime.toFixed(0)}ms`,
            recentErrors: report.recentErrors.length,
          });
        }
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [getPerformanceReport]);

  useEffect(() => {
    if (__DEV__) {
      console.log('🧪 TEST MODE ACTIVE');
      console.log('📱 Access tests at: /test');
      
      if (process.env.EXPO_PUBLIC_TEST_MODE === 'true') {
        console.log('🔧 Test mode enabled via environment variable');
      }
    }
  }, []);

  // ✅ الحل الأفضل مع تحسين الأداء
  useEffect(() => {
    if (initialLoading || configLoading) return;

    if (showMaintenance || showForceUpdate) {
      return;
    }

    if (!segments || !Array.isArray(segments) || segments.length < 1) {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';

    if (user) {
      if (inAuthGroup) {
        router.replace('/');
      }
      registerForPushNotificationsAsync().catch(error => {
        console.warn('Failed to register for push notifications:', error);
      });
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

// ✅ مكون منفصل لتهيئة نظام مراقبة البيانات
function DataPerformanceInitializer() {
  const dataPerformance = useDataPerformance();
  
  useEffect(() => {
    setQueryTracker(dataPerformance);
    console.log('🔧 تم ربط نظام مراقبة البيانات');

    // فحص إضافي بعد ثانيتين
    setTimeout(() => {
      const report = dataPerformance.getPerformanceReport();
      console.log('🔍 [INIT CHECK] نظام المراقبة جاهز:', {
        trackQuery: !!dataPerformance.trackQuery,
        totalQueries: report.totalQueries,
        systemReady: true
      });
    }, 2000);
  }, [dataPerformance]);

  useEffect(() => {
    if (!__DEV__) return;

    const logDataPerformance = () => {
      const report = dataPerformance.getPerformanceReport();
      
      if (report.totalQueries > 0) {
        console.log(
          `%c📊 أداء البيانات - ${new Date().toLocaleTimeString()}`,
          'background: #1D3557; color: white; padding: 4px; border-radius: 4px; font-weight: bold;'
        );

        console.log(
          `%c📈 الاستعلامات:%c ${report.totalQueries} total | ${report.cachedQueries} cached | ${report.failedQueries} failed`,
          'color: #2196F3; font-weight: bold;', 'color: #666;'
        );

        console.log(
          `%c⚡ الكاش:%c ${report.cacheHitRate.toFixed(1)}% hit rate | ⏱ ${report.averageQueryTime.toFixed(0)}ms avg`,
          'color: #4CAF50; font-weight: bold;', 'color: #666;'
        );

        console.log(
          `%c💾 البيانات:%c ${(report.totalDataSize / 1024).toFixed(1)}KB total transferred`,
          'color: #FF9800; font-weight: bold;', 'color: #666;'
        );

        if (report.cacheHitRate < 60) {
          console.warn('🚨 انتبه: معدل الكاش منخفض! هذا يستهلك cached egress.');
        }

        if (report.totalDataSize > 100 * 1024) {
          console.warn('📦 كمية البيانات كبيرة! فكر في pagination أو تقليل الحقول.');
        }

        console.log('---');
      }
    };

    const interval = setInterval(logDataPerformance, 8000);
    return () => clearInterval(interval);
  }, [dataPerformance]);

  return null; // هذا المكون ما بعرض أي واجهة
}

export default function RootLayout() {
  const hideNavigationBar = React.useCallback(async () => {
    try {
      await NavigationBar.setVisibilityAsync('hidden');
      await NavigationBar.setBehaviorAsync('overlay-swipe');
      await NavigationBar.setBackgroundColorAsync('transparent');
      console.log('✅ تم إخفاء شريط التنقل بنجاح');
    } catch (error) {
      console.error('❌ فشل في إخفاء شريط التنقل:', error);
    }
  }, []);

  useEffect(() => {
    hideNavigationBar();
  }, [hideNavigationBar]);

  // ✅ تحسين إدارة الإشعارات
  useEffect(() => {
    let isMounted = true;

    const setupNotifications = async () => {
      if (!isMounted) return;
      
      try {
        const { removeReceivedListener, removeResponseListener } = setupNotificationHandlers();

        const subscription = AppState.addEventListener('change', (nextAppState) => {
          if (nextAppState === 'active' && isMounted) {
            console.log('App has come to the foreground, clearing badge count.');
            clearBadgeCount();
          }
        });

        return () => {
          removeReceivedListener?.();
          removeResponseListener?.();
          subscription?.remove();
        };
      } catch (error) {
        console.error('Failed to setup notifications:', error);
      }
    };

    const cleanupPromise = setupNotifications();

    return () => {
      isMounted = false;
      cleanupPromise.then(cleanup => cleanup?.());
    };
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <FavoritesProvider>
            <CartProvider>
              <View style={{ flex: 1, direction: 'rtl' }}>
                <InitializationWrapper />
                {__DEV__ && <PerformanceMonitor />}
                {/* ✅ إضافة مكون مراقبة البيانات هنا */}
                <DataPerformanceInitializer />
              </View>
            </CartProvider>
          </FavoritesProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}