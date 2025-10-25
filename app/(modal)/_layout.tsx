// مسار الملف: app/(modal)/_layout.tsx

import { Stack } from 'expo-router';
import React from 'react';

export default function ModalLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="address-form" 
        options={{ 
          presentation: 'modal',
          // ✅ إخفاء الهيدر الافتراضي
          headerShown: false, 
        }} 
      />
      <Stack.Screen 
        name="edit-profile" 
        options={{ 
          presentation: 'modal',
          // ✅ إخفاء الهيدر الافتراضي
          headerShown: false, 
        }} 
      />
    </Stack>
    
  );
}
