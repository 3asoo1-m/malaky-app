// مسار الملف: app/_layout.tsx

import React, { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '@/lib/useAuth';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context'; // ✅ 1. استيراد المزود
import { FavoritesProvider } from '@/lib/useFavorites';

// ✅ 1. إنشاء "الحارس"
const AuthGuard = () => {
  const { user, initialLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // لا تفعل شيئًا أثناء التحميل الأولي
    if (initialLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    // إذا لم يكن المستخدم مسجلاً للدخول وليس في مجموعة المصادقة
    if (!user && !inAuthGroup) {
      // إعادة توجيه إلى شاشة تسجيل الدخول
      router.replace('/login');
    }
    // إذا كان المستخدم مسجلاً للدخول وهو في مجموعة المصادقة
    else if (user && inAuthGroup) {
      // إعادة توجيه إلى الشاشة الرئيسية
      router.replace('/');
    }
  }, [user, initialLoading, segments, router]);

  // ✅ 2. عرض شاشة تحميل أثناء التحقق الأولي
  if (initialLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // ✅ 3. عرض المحتوى الفعلي (الشاشة الحالية) بعد التحقق
  return <Slot />;
};

// ✅ 4. إنشاء التخطيط الجذري
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <FavoritesProvider>
          <AuthGuard />
        </FavoritesProvider>
      </AuthProvider>
    </SafeAreaProvider>

  );
}
