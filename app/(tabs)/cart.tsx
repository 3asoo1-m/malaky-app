// مسار الملف: app/(tabs)/cart.tsx

import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import CustomBottomNav from '@/components/CustomBottomNav'; // ✅ 1. استيراد المكون

export default function CartScreen() {
  return (
    <View style={{ flex: 1 }}>

      <View style={styles.container}>
        <Text style={styles.title}>سلة المشتريات</Text>
        <Text style={styles.subtitle}>سيتم عرض المنتجات التي أضفتها هنا.</Text>
      </View>
      <CustomBottomNav />

    </View>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
  },
});
