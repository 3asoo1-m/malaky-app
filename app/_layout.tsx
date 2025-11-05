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
import * as NavigationBar from 'expo-navigation-bar';

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
    // إجبار تنسيق RTL
    I18nManager.forceRTL(true);
    I18nManager.allowRTL(true);
    
    // منع تغيير الاتجاه تلقائياً
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
        lng: 'ar', // إجبار اللغة العربية
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

// --- استدعاء التهيئة فوراً ---
initializeArabicRTL();
initializeI18n();



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

  // ✅ التأكد من تطبيق إعدادات RTL عند كل تحميل
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
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#fff',
        direction: 'rtl' // إضافة دعم RTL للشاشة
      }}>
        <ActivityIndicator size="large" color="#1D3557" />
        <Text style={{ 
          marginTop: 10, 
          fontSize: 16, 
          fontFamily: 'Cairo-Regular', 
          color: '#1D3557',
          textAlign: 'right', // محاذاة النص لليمين
          writingDirection: 'rtl' // اتجاه الكتابة
        }}>
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
  
  useEffect(() => {
  const hideNavigationBar = async () => {
    try {
      await NavigationBar.setVisibilityAsync('hidden'); // إخفاء الشريط
      await NavigationBar.setBehaviorAsync('overlay-swipe'); // يسمح بالسحب لإظهاره مؤقتًا
      await NavigationBar.setBackgroundColorAsync('transparent'); // يجعل الخلفية شفافة
      console.log('✅ تم إخفاء شريط التنقل بنجاح');
    } catch (error) {
      console.error('❌ فشل في إخفاء شريط التنقل:', error);
    }
  };

  hideNavigationBar();
}, []);


  
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
            {/* ✅ إضافة إعدادات RTL إضافية */}
            <View style={{ flex: 1, direction: 'rtl' }}>
              <AuthGuard />
            </View>
          </CartProvider>
        </FavoritesProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}