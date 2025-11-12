// components/home/FloatingCartButton.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ShoppingCart } from 'lucide-react-native';
import { Colors } from '@/styles';
import { useCart } from '@/lib/useCart'; // ✅ 1. استيراد hook السلة
import { useRouter } from 'expo-router'; // ✅ 2. استيراد الراوتر للانتقال

const FloatingCartButton = () => {
  const router = useRouter(); // ✅ 3. تهيئة الراوتر

  // ✅ 4. استدعاء بيانات السلة الحقيقية
  // items هو مصفوفة كل العناصر في السلة
  const { items } = useCart();

  // ✅ 5. حساب العدد الإجمالي للقطع (وليس فقط عدد أنواع المنتجات)
  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // ✅ 6. إذا كانت السلة فارغة، لا تعرض أي شيء
  if (totalItemCount === 0) {
    return null;
  }

  // ✅ 7. دالة للانتقال إلى شاشة السلة
  const navigateToCart = () => {
    router.push('/(tabs)/cart'); // تأكد من أن هذا هو المسار الصحيح لشاشة السلة
  };

  return (
    // ✅ 8. إضافة خاصية onPress للزر
    <TouchableOpacity style={styles.container} onPress={navigateToCart}>
      <ShoppingCart color="white" size={28} />
      <View style={styles.badge}>
        {/* ✅ 9. عرض العدد الحقيقي من السلة */}
        <Text style={styles.badgeText}>{totalItemCount}</Text>
      </View>
    </TouchableOpacity>
  );
};

// الأنماط تبقى كما هي
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 105, // أو أي قيمة تناسب تصميمك مع الـ Tab Bar
    left: 24, // تم تغيير الاتجاه ليتناسب مع RTL
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
