// مسار الملف: components/MenuItemCard.tsx

import React from 'react';
import {
  GestureResponderEvent,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  I18nManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MenuItem } from '../lib/types';
import { useFavorites } from '@/lib/useFavorites'; // ✅ 1. استيراد الهوك

type MenuItemCardProps = {
  item: MenuItem;
  onPress?: (event: GestureResponderEvent) => void;
};

export default function MenuItemCard({ item, onPress }: MenuItemCardProps) {
  // ✅ 2. استخدام الهوك للحصول على البيانات والدوال
  const { favoriteIds, toggleFavorite } = useFavorites();
  const isFavorite = favoriteIds.has(item.id);

  const defaultImage = 'https://scontent.fjrs27-1.fna.fbcdn.net/v/t39.30808-6/347093685_1264545104456247_8195462777365390832_n.jpg?_nc_cat=101&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=Vurk9k7Yeh4Q7kNvwFMaIvw&_nc_oc=AdnLJ7bhQuIug3NeIMvRJKxx1dpZ4xT5SN5KXbUN9MnJP_foN0PuaRhHK5T5h2_mlKE&_nc_zt=23&_nc_ht=scontent.fjrs27-1.fna&_nc_gid=M1fGk0mVLfA72P9gTCQOJg&oh=00_AfY1CYuswm2dIn4EFLv-89zIfO8z1Y9NccbV_9AQZ-NI3A&oe=68DA50FC';

  // ✅ 3. دالة للتعامل مع الضغط على القلب فقط
  const handleHeartPress = (e: GestureResponderEvent ) => {
    e.stopPropagation(); // منع الضغطة من الوصول إلى البطاقة الرئيسية
    toggleFavorite(item.id);
  };

  return (
    <TouchableOpacity style={styles.cardContainer} onPress={onPress} activeOpacity={0.8}>
      {/* ✅ 4. جعل أيقونة القلب قابلة للضغط وتغيير شكلها ولونها */}
      <TouchableOpacity
        style={[styles.heartIconContainer, { [I18nManager.isRTL ? 'left' : 'right']: 10 }]}
        onPress={handleHeartPress}
      >
        <Ionicons
          name={isFavorite ? 'heart' : 'heart-outline'}
          size={20}
          color={isFavorite ? '#E53935' : '#333'} // لون أحمر إذا كانت مفضلة
        />
      </TouchableOpacity>

      <View style={styles.imageContainer}>
        <Image source={{ uri: item.image_url || defaultImage }} style={styles.cardImage} />
      </View>
      <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.cardSubtitle} numberOfLines={2}>{item.description || ' '}</Text>
      <Text style={styles.cardPrice}>{item.price.toFixed(1)} ₪</Text>
    </TouchableOpacity>
  );
}

// التنسيقات تبقى كما هي، مع تعديل بسيط على تنسيق أيقونة القلب
const styles = StyleSheet.create({
  cardContainer: {
    width: 160,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 10,
    marginHorizontal: 7.5,
    elevation: 5,
    alignItems: 'center',
    position: 'relative',
  },
  heartIconContainer: {
    position: 'absolute',
    top: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 15,
    padding: 5, // ✅ زيادة حجم المساحة القابلة للضغط
    zIndex: 1, // ✅ ضمان أن تكون الأيقونة فوق الصورة
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageContainer: {
    width: '100%',
    height: 120,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 8,
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 10, textAlign: 'center' },
  cardSubtitle: { fontSize: 12, color: '#888', marginTop: 2, textAlign: 'center' },
  cardPrice: { fontSize: 16, fontWeight: 'bold', color: '#333', marginTop: 8 },
});
