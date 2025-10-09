// مسار الملف: components/CustomBottomNav.tsx

import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useSegments } from 'expo-router';

// استخدم as const، فهو الحل الأكثر استقرارًا لهذه الحالة
const navItems = [
  // ✅ المسار الصحيح للشاشة الرئيسية هو '/'
  { name: 'index', href: '/', icon: 'home-outline', iconFocused: 'home' },

  // ✅ المسارات الصحيحة لبقية الشاشات هي أسماؤها مسبوقة بـ '/'
  { name: 'favorites', href: '/favorites', icon: 'heart-outline', iconFocused: 'heart' },
  { name: 'cart', href: '/cart', icon: 'cart-outline', iconFocused: 'cart' },
  { name: 'profile', href: '/profile', icon: 'person-outline', iconFocused: 'person' },
] as const;

export default function CustomBottomNav() {
  const router = useRouter();
  const segments = useSegments();

  // هذا المنطق صحيح لتحديد الشاشة النشطة
  const activeScreen = segments[segments.length - 1] || 'index';

  return (
    <View style={styles.bottomNav}>
      {navItems.map((item) => {
        // نقوم بتحديد الحالة النشطة بمقارنة اسم المسار مع اسم العنصر
        const isActive = activeScreen === item.name;

        return (
          <TouchableOpacity
            key={item.name}
            style={styles.navButton}
            onPress={() => {
              // استخدم as any لتجاوز تدقيق TypeScript الصارم والمضي قدمًا
              router.push(item.href as any);
            }}
          >
            <Ionicons
              name={isActive ? item.iconFocused : item.icon}
              size={28}
              color="#fff"
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 85,
    backgroundColor: '#C62828', // اللون الأحمر الداكن
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingBottom: 30, // مساحة للأجهزة التي لا تحتوي على زر رئيسي

    // تحديد الموضع في الأسفل
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,

    // الظل
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
});
