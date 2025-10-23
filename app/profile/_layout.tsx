// مسار الملف: app/profile/_layout.tsx

import { Stack } from 'expo-router';
import React from 'react';

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: 'رجوع',
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen 
        name="profile" 
        options={{ 
          title: 'الملف الشخصي',
          headerShown: false // ✅ إخفاء الهيدر إذا كنت تستخدم تصميم مخصص
        }} 
      />
      <Stack.Screen 
        name="orders" 
        options={{ 
          title: 'طلباتي', 
          headerShown: false // ✅ إخفاء الهيدر إذا كنت تستخدم تصميم مخصص
        }} 
      />
    </Stack>
  );
}