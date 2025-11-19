// مسار الملف: components/MenuItemCard.tsx

import React from 'react';
import {
  GestureResponderEvent,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MenuItem } from '@/lib/types';

type MenuItemCardProps = {
  item: MenuItem;
  isFavorite: boolean; // ✅ تلقي الحالة كـ prop
  onToggleFavorite: () => void; // ✅ تلقي الدالة كـ prop
  onPress?: (event: GestureResponderEvent) => void;
};

// ✅ لاحظ أننا لم نعد نستدعي useFavorites هنا
function MenuItemCard({ item, isFavorite, onToggleFavorite, onPress }: MenuItemCardProps) {
  const defaultImageSource = require('@/assets/images/icon.png');
  console.log(`[LOG 3] 🟢 MenuItemCard RENDER - Item: ${item.id}, isFavorite: ${isFavorite}`);

  const handleHeartPress = (e: GestureResponderEvent) => {
    e.stopPropagation();
    onToggleFavorite(); // ✅ استدعاء الدالة من الـ props
  };

  const imageSource =
    item.images && item.images.length > 0
      ? { uri: item.images[0].image_url }
      : defaultImageSource;

  return (
    // ✅ 1. استخدام حاوية خارجية لتطبيق الهو  امش
    <View style={styles.outerContainer}>
      <TouchableOpacity style={styles.cardContainer} onPress={onPress} activeOpacity={0.8}>
        <TouchableOpacity
          style={styles.heartIconContainer}
          onPress={handleHeartPress}
        >
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'} // ✅ استخدام isFavorite من الـ props
            size={24}
            color={isFavorite ? '#E53935' : '#333'}
          />
        </TouchableOpacity>

        <View style={styles.imageContainer}>
          <Image source={imageSource} style={styles.cardImage} />
        </View>
        
        <View style={styles.textContainer}>
          {/* ✅ 2. استخدام البيانات من 'item' مع عرض الوصف */}
          <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.cardSubtitle} numberOfLines={2}>{item.description || ' '}</Text>
          <Text style={styles.cardPrice}>{item.price.toFixed(2)} ₪</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}
export default React.memo(MenuItemCard);


// ✅✅✅ 3. إعادة تطبيق التنسيقات الأصلية مع تحسينات ✅✅✅
const styles = StyleSheet.create({
  outerContainer: {
    width: 170, // عرض أكبر قليلاً لاستيعاب الهوامش الداخلية
    marginHorizontal: 7.5, // الهامش الخارجي بين البطاقات
  },
  cardContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    elevation: 4, // زيادة الظل قليلاً
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center', // محاذاة كل شيء في المنتصف
    paddingBottom: 12, // مسافة سفلية داخل البطاقة
  },
  heartIconContainer: {
    position: 'absolute',
    top: 10,
    right: 10, // تحديد الاتجاه لليمين
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    padding: 6,
    zIndex: 1,
  },
  imageContainer: {
    width: '100%',
    height: 130, // زيادة ارتفاع الصورة قليلاً
    borderTopLeftRadius: 16, // مطابقة حواف البطاقة
    borderTopRightRadius: 16,
    overflow: 'hidden',
    marginBottom: 8,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  textContainer: {
    width: '100%',
    paddingHorizontal: 10, // هوامش داخلية للنصوص
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Cairo-Bold',
    textAlign: 'center', // محاذاة في المنتصف
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    minHeight: 30, // حجز مساحة للوصف حتى لو كان فارغًا
    marginBottom: 6,
  },
  cardPrice: {
    fontSize: 17,
    fontFamily: 'Cairo-Bold',
    color: '#C62828',
    textAlign: 'center',
  },
});
