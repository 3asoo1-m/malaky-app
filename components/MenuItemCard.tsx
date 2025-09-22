// src/components/MenuItemCard.tsx

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MenuItem } from '../lib/types'; // استيراد النوع من ملف الأنواع

// تعريف الخصائص التي سيستقبلها المكون
interface MenuItemCardProps {
  item: MenuItem;
  onPress: () => void; // دالة للضغط على البطاقة نفسها
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({ item, onPress }) => {
  // صورة افتراضية في حال عدم وجود صورة للوجبة
  const imageUrl = item.image_url || 'https://via.placeholder.com/150';

  return (
    <TouchableOpacity style={styles.cardContainer} onPress={onPress}>
      {/* حاوية الصورة */}
      <Image source={{ uri: imageUrl }} style={styles.image} />

      {/* حاوية التفاصيل */}
      <View style={styles.detailsContainer}>
        <Text style={styles.title} numberOfLines={1}>{item.name}</Text>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{item.price.toFixed(2 )} شيكل</Text>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 15,
    elevation: 2, // ظل خفيف للأندرويد
    shadowColor: '#000', // ظل للـ iOS
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  image: {
    width: '100%',
    height: 120,
  },
  detailsContainer: {
    padding: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF6347', // لون السعر المميز
  },
  addButton: {
    backgroundColor: '#FF6347',
    borderRadius: 20,
    padding: 5,
  },
});

export default MenuItemCard;
