// مسار الملف: lib/notifications.ts

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const { data } = notification.request.content;

    if (data && typeof data === 'object' && 'title' in data && 'body' in data) {
      console.log('Received a data-only notification in foreground. Scheduling a local notification to display it.');
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: data.title as string,
          body: data.body as string,
          data: data,
          sound: true,
        },
        trigger: null,
      });

      // ✅ أخبر النظام بتجاهل الإشعار الأصلي بالكامل
      return {
        shouldShowAlert: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
        // ✅✅ إضافة الخصائص المفقودة
        shouldShowBanner: false, 
        shouldShowList: false,
      };
    }

    // ✅ السلوك الافتراضي للإشعارات الأخرى (يجب أن يحتوي أيضًا على كل الخصائص)
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      // ✅✅ إضافة الخصائص المفقودة
      shouldShowBanner: true, 
      shouldShowList: true,
    };
  },
});

/**
 * 2. الدالة الرئيسية لتسجيل الإشعارات
 */
export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    console.warn('Push notifications are only available on physical devices.');
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('User denied push notification permissions.');
      return null;
    }

    // ✅ استخدام projectId الديناميكي
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      throw new Error('Project ID not found in app.json/app.config.js. Make sure you have run "eas build" at least once.');
    }

    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    console.log('Acquired Expo Push Token:', token);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log("User not logged in, cannot save push token.");
      return null;
    }

    // ✅ استخدام upsert الآمن مع معلومات إضافية
    const { error } = await supabase
      .from('push_tokens')
      .upsert({ 
        token: token, 
        user_id: user.id,
        device_type: Platform.OS,
      }, {
        onConflict: 'token',
        ignoreDuplicates: false,
      });

    if (error) throw error;

    console.log('Push token saved successfully!');
    
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'طلبات المطعم',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return token;
  } catch (error) {
    console.error("Failed to register for push notifications:", error);
    return null;
  }
}

/**
 * 3. دالة إلغاء تسجيل التوكن (النسخة الآمنة)
 */
export async function unregisterForPushNotificationsAsync() {
  if (!Device.isDevice) return;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('No user logged in, skipping token removal.');
      return;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) return;

    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    if (token) {
      // ✅ الحذف الآمن: حذف التوكن للمستخدم الحالي فقط
      const { error } = await supabase
        .from('push_tokens')
        .delete()
        .eq('token', token)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error removing push token from DB:', error.message);
      } else {
        console.log('Push token successfully removed from DB for this user.');
      }
    }
  } catch (e) {
    console.warn('Could not get push token to unregister.');
  }
}

/**
 * 4. دالة إعداد معالجات الإشعارات
 */
export function setupNotificationHandlers() {
  const receivedSubscription = Notifications.addNotificationReceivedListener(notification => {
    console.log('Notification received while app is foregrounded:', notification);
  });

  const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('User tapped on notification:', response);
    const orderId = response.notification.request.content.data?.orderId;
    if (orderId) {
      console.log(`Should navigate to order: ${orderId}`);
      // في المستقبل، يمكنك استخدام مكتبة توجيه هنا للانتقال إلى الشاشة
      // import { router } from 'expo-router';
      // router.push(`/order/${orderId}`);
    }
  });

  return {
    removeReceivedListener: () => receivedSubscription.remove(),
    removeResponseListener: () => responseSubscription.remove(),
  };
}

/**
 * 5. دالة مسح عداد الإشعارات
 */
export async function clearBadgeCount() {
  try {
    await Notifications.setBadgeCountAsync(0);
    console.log('Badge count cleared.');
  } catch (error) {
    console.error('Error clearing badge count:', error);
  }
}