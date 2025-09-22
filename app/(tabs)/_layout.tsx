// مسار الملف: app/(tabs)/_layout.tsx

import { FontAwesome } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

// تعريف ألوان الهوية البصرية
const COLORS = {
  primary: '#E63946', // الأحمر الملكي
  secondary: '#1D3557', // الأزرق الداكن
  inactive: '#A8A8A8', // رمادي للأيقونات غير النشطة
  background: '#FFFFFF', // أبيض لخلفية التاب بار
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary, // لون الأيقونة النشطة
        tabBarInactiveTintColor: COLORS.inactive, // لون الأيقونة غير النشطة
        tabBarShowLabel: true, // إظهار اسم التبويب تحت الأيقونة
        headerShown: false, // إخفاء الهيدر التلقائي لكل شاشة
        tabBarStyle: {
          backgroundColor: COLORS.background,
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
          height: Platform.OS === 'ios' ? 90 : 70, // ارتفاع مناسب للتاب بار
          paddingBottom: Platform.OS === 'ios' ? 30 : 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}>
      {/* التبويب الأول: الشاشة الرئيسية */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'الرئيسية',
          tabBarIcon: ({ color }) => <FontAwesome name="home" size={26} color={color} />,
        }}
      />

      {/* التبويب الثاني: قائمة الطعام الكاملة */}
      <Tabs.Screen
        name="menu"
        options={{
          title: 'القائمة',
          tabBarIcon: ({ color }) => <FontAwesome name="book" size={24} color={color} />,
        }}
      />

      {/* التبويب الثالث: سلة المشتريات */}
      <Tabs.Screen
        name="cart"
        options={{
          title: 'السلة',
          tabBarIcon: ({ color }) => <FontAwesome name="shopping-cart" size={24} color={color} />,
          // يمكنك إضافة عدد المنتجات في السلة هنا لاحقاً
          // tabBarBadge: 3, 
        }}
      />

      {/* التبويب الرابع: الملف الشخصي */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'حسابي',
          tabBarIcon: ({ color }) => <FontAwesome name="user" size={26} color={color} />,
        }}
      />
    </Tabs>
  );
}
