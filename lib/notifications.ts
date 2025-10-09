// مسار الملف: lib/notifications.ts

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants'; // أنت تستخدم هذا لجلب projectId تلقائياً، وهذا ممتاز
import { Platform } from 'react-native';
import { supabase } from './supabase'; // تأكد من صحة المسار

// هذا الإعداد مهم لظهور الإشعارات عندما يكون التطبيق مفتوحاً
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true, // خاص بـ Android، يظهر الإشعار كـ "بانر" في الأعلى
    shouldShowList: true,   // خاص بـ Android، يضيف الإشعار إلى قائمة الإشعارات
  }),
});

/**
 * الدالة الرئيسية التي تقوم بطلب الإذن، الحصول على التوكن، وحفظه في Supabase.
 */
export async function registerForPushNotificationsAsync() {
  // 1. التحقق من أننا على جهاز حقيقي
  if (!Device.isDevice) {
    console.warn('Push notifications are only available on physical devices.');
    return;
  }

  // 2. طلب الأذونات (مع التحقق من الحالة الحالية أولاً)
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.log('User denied push notification permissions.');
    // يمكنك إظهار تنبيه هنا إذا أردت، لكن console.log أفضل لعدم إزعاج المستخدم
    // alert('فشل الحصول على إذن للإشعارات! لن تتمكن من استقبال تحديثات الطلبات.');
    return;
  }

  // 3. الحصول على التوكن
  let token;
  try {
    // طريقتك في جلب projectId هي الأفضل والأكثر ديناميكية
    const projectId = "b83c8c0f-913e-41a4-b35a-ce1f29aa4eef";
    console.log('Using hardcoded projectId:', projectId);
    
    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    console.log('Acquired Expo Push Token:', token);
  } catch (e) {
    console.error("Failed to get Expo push token:", e);
    return;
  }

  // 4. حفظ التوكن في قاعدة بيانات Supabase
  if (token) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log("User not logged in, cannot save push token.");
      return;
    }

    console.log(`Saving token for user ${user.id}`);
    // استخدام upsert هو الخيار الأمثل هنا لتجنب التكرار وتحديث user_id إذا لزم الأمر
    const { error } = await supabase
      .from('push_tokens')
      .upsert({ 
        token: token, 
        user_id: user.id 
      }, {
        onConflict: 'token' // افحص التعارض بناءً على عمود التوكن
      });

    if (error) {
      console.error('Error saving push token:', error);
    } else {
      console.log('Push token saved successfully!');
    }
  }

  // 5. إعدادات إضافية خاصة بنظام Android (مهم)
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
}


// =================================================================
// ✅ الإضافة الجديدة: دالة لإلغاء تسجيل التوكن عند تسجيل الخروج
// =================================================================
export async function unregisterForPushNotificationsAsync() {
  if (!Device.isDevice) {
    return;
  }

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      // لا داعي لرمي خطأ هنا، فقط اخرج بهدوء
      console.warn('Could not find project ID to unregister token.');
      return;
    }
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;

    if (token) {
      // احذف التوكن من قاعدة البيانات
      const { error } = await supabase
        .from('push_tokens')
        .delete()
        .eq('token', token);

      if (error) {
        console.error('Error removing push token from DB:', error.message);
      } else {
        console.log('Push token successfully removed from DB.');
      }
    }
  } catch (e) {
    // هذا الخطأ متوقع إذا لم يمنح المستخدم الإذن من الأساس
    console.warn('Could not get push token to unregister. This is normal if permissions were never granted.');
  }
}
