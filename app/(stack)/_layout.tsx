// مسار الملف: app/(stack)/_layout.tsx

import { Stack } from 'expo-router';
import React from 'react';

export default function StackLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="addresses" 
        options={{ 
          title: 'عناويني',
          headerTitleAlign: 'center',
        }} 
      />
      {/* يمكنك إضافة شاشات أخرى هنا في المستقبل */}
    </Stack>
  );
}
