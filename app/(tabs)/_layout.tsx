// مسار الملف: app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import React from 'react';
import { I18nManager } from 'react-native';

// ضبط RTL فقط عند التشغيل لأول مرة
if (!I18nManager.isRTL) {
  I18nManager.forceRTL(true);
  I18nManager.allowRTL(true);
  // ⚠️ بعد هذا يجب إعادة تشغيل التطبيق على Android لإظهار RTL
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={() => null} // لإخفاء شريط التبويبات الافتراضي
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="favorites" />
      <Tabs.Screen name="cart" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
