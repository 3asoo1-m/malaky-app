// مسار الملف: components/FloatingCartButton.tsx

import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '@/lib/useCart';
import { useRouter } from 'expo-router';

export default function FloatingCartButton() {
  const router = useRouter();
  const { getCartItemCount } = useCart();
  const itemCount = getCartItemCount();

  // useRef للتحكم في قيم الأنيميشن
  const scaleAnim = useRef(new Animated.Value(0)).current; // يبدأ من 0 (مخفي)
  const bounceAnim = useRef(new Animated.Value(1)).current; // للتحكم في تأثير النبض

  useEffect(() => {
    // إذا كانت السلة تحتوي على عناصر، أظهر الزر
    if (itemCount > 0) {
      Animated.spring(scaleAnim, {
        toValue: 1, // إظهار بحجمه الكامل
        friction: 5,
        useNativeDriver: true,
      }).start();
    } else {
      // إذا كانت السلة فارغة، أخفِ الزر
      Animated.timing(scaleAnim, {
        toValue: 0, // إخفاء
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [itemCount]);

  // تأثير "النبض" عند إضافة عنصر جديد
  useEffect(() => {
    if (itemCount > 0) {
      bounceAnim.setValue(0.8); // ابدأ صغيرًا
      Animated.spring(bounceAnim, {
        toValue: 1, // ارجع للحجم الطبيعي
        friction: 3,
        useNativeDriver: true,
      }).start();
    }
  }, [itemCount]);

  // لا تعرض أي شيء إذا كانت السلة فارغة
  if (itemCount === 0) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/(tabs)/cart')}
        activeOpacity={0.8}
      >
        <Animated.View style={{ transform: [{ scale: bounceAnim }] }}>
          <Ionicons name="cart" size={32} color="#fff" />
        </Animated.View>
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>{itemCount}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100, // مسافة من الأسفل (فوق شريط التنقل)
    right: 20,   // مسافة من اليمين
    zIndex: 1000, // لضمان أنه فوق كل شيء
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#C62828', // اللون الأحمر الرئيسي
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  badgeContainer: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#0033A0', // اللون الأزرق للشارة
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
