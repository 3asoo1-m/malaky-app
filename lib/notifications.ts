// مسار الملف: lib/notifications.ts (أو أي اسم تفضله)

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants'; // لاستيراد projectId تلقائياً
import { Platform } from 'react-native';
import { supabase } from './supabase'; // تأكد من صحة المسار

// هذا الإعداد مهم لظهور الإشعارات عندما يكون التطبيق مفتوحاً
// الكود الجديد (مع الخصائص المضافة)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    // --- الخصائص الإضافية المطلوبة ---
    // عادةً ما تكون قيمتها نفس قيمة shouldShowAlert
    shouldShowBanner: true, // (خاص بـ Android)
    shouldShowList: true,   // (خاص بـ Android)
  }),
});


/**
 * الدالة الرئيسية التي تقوم بطلب الإذن، الحصول على التوكن، وحفظه في Supabase
 * يمكن استدعاؤها من أي مكان، ويفضل بعد تسجيل دخول المستخدم.
 */
export async function registerForPushNotificationsAsync() {
  // 1. التحقق من أننا على جهاز حقيقي
  if (!Device.isDevice) {
    console.log('Push notifications are only available on physical devices.');
    return;
  }

  // 2. طلب الأذونات
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    alert('فشل الحصول على إذن للإشعارات! يرجى تفعيلها من إعدادات التطبيق.');
    return;
  }

  // 3. الحصول على التوكن
  let token;
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      throw new Error('Expo project ID not found in app.json/app.config.js');
    }
    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    console.log('Expo Push Token:', token);
  } catch (e) {
    console.error("Failed to get Expo push token:", e);
    return; // اخرج إذا فشل الحصول على التوكن
  }

  // 4. حفظ التوكن في قاعدة بيانات Supabase
  if (token) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log("User not logged in, cannot save push token.");
      return;
    }

    console.log(`Saving token for user ${user.id}`);
    // upsert: إذا كان التوكن موجوداً، لا تفعل شيئاً. إذا لم يكن، أضفه.
    const { error } = await supabase
      .from('push_tokens')
      .upsert({ 
        token: token, 
        user_id: user.id 
      }, {
        onConflict: 'token' // افحص التعارض بناءً على عمود التوكن الفريد
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
