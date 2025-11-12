// components/home/FloatingCartButton.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ShoppingCart } from 'lucide-react-native';
import { Colors } from '@/styles';

// ✅ الحل: أضف النوع 'number' بشكل صريح
// في تطبيق حقيقي، ستحصل على عدد العناصر من حالة السلة (Zustand, Redux, etc.)
const cartItemCount: number = 5; // مثال

const FloatingCartButton = () => {
  // الآن TypeScript يفهم أن cartItemCount هو رقم ويمكن مقارنته بـ 0
  if (cartItemCount === 0) {
    return null;
  }

  return (
    <TouchableOpacity style={styles.container}>
      <ShoppingCart color="white" size={28} />
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{cartItemCount}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 95,
    right: 24,
    backgroundColor: Colors.primary,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    zIndex: 40,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FFC107',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  badgeText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default FloatingCartButton;
