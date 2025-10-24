// components/GlobalBottomNav.tsx
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';

// ✅ تعريف النوع
type IconName = React.ComponentProps<typeof Ionicons>['name'];

const navItems = [
  { name: 'home', href: '/(tabs)/', icon: 'home-outline', iconFocused: 'home' },
  { name: 'favorites', href: '/(tabs)/favorites', icon: 'heart-outline', iconFocused: 'heart' },
  { name: 'cart', href: '/(tabs)/cart', icon: 'cart-outline', iconFocused: 'cart' },
  { name: 'profile', href: '/(tabs)/profile', icon: 'person-outline', iconFocused: 'person' },
];

export default function GlobalBottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const getActiveTab = () => {
    if (pathname === '/' || pathname === '/(tabs)') return 'home';
    if (pathname.includes('favorites')) return 'favorites';
    if (pathname.includes('cart')) return 'cart';
    if (pathname.includes('/profile') || pathname.includes('/orders')) return 'profile';
    return 'home';
  };

  // ✅ دالة محسنة مع النوع الصحيح
  const getIconName = (routeName: string, focused: boolean): IconName => {
    const item = navItems.find(item => item.name === routeName);
    if (!item) return 'ellipse';
    return focused ? item.iconFocused as IconName : item.icon as IconName;
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
              name={isActive ? item.iconFocused as IconName : item.icon as IconName} // ✅ الحل
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