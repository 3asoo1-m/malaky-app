// components/GlobalBottomNav.tsx
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';

const navItems = [
  { name: 'home', href: '/(tabs)/', icon: 'home-outline', iconFocused: 'home' },
  { name: 'cart', href: '/(tabs)/cart', icon: 'cart-outline', iconFocused: 'cart' },
  { name: 'notifications', href: '/(tabs)/notifications', icon: 'notifications-outline', iconFocused: 'notifications' },
  { name: 'profile', href: '/(tabs)/profile', icon: 'person-outline', iconFocused: 'person' },
] as const;

export default function GlobalBottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  // ✅ تحديد التبويب النشط بناءً على المسار الحالي
  const getActiveTab = () => {
    if (pathname === '/' || pathname === '/(tabs)') return 'home';
    if (pathname.includes('cart')) return 'cart';
    if (pathname.includes('notifications')) return 'notifications';
    if (pathname.includes('/profile') || pathname.includes('/orders')) return 'profile';
    return 'home';
  };

  const activeTab = getActiveTab();

  return (
    <View style={styles.bottomNav}>
      {navItems.map((item) => {
        const isActive = activeTab === item.name;

        return (
          <TouchableOpacity
            key={item.name}
            style={styles.navButton}
            onPress={() => router.push(item.href as any)}
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
    backgroundColor: '#C62828',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingBottom: 30,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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