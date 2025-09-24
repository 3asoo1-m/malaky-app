// مسار الملف: app/(tabs)/_layout.tsx

import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  return (
    <Tabs
      // الخاصية الأساسية لإخفاء شريط التنقل الافتراضي بالكامل
      tabBar={() => null}
      
      // يمكنك إبقاء screenOptions لإخفاء الهيدر لجميع الشاشات مرة واحدة
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* تعريف الشاشات التي ستكون جزءًا من التبويبات */}
      {/* expo-router سيظل يدير حالة التنقل بينها، لكن بدون عرض الأزرار */}
      
      <Tabs.Screen name="index" />
      <Tabs.Screen name="menu" />
      <Tabs.Screen name="cart" />
      <Tabs.Screen name="profile" />

    </Tabs>
  );
}
