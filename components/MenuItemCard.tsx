// مسار الملف: components/MenuItemCard.tsx

import React from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface MenuItemCardProps {
  name: string;
  description: string | null; // <-- سنستخدم الوصف الآن
  price: number;
  imageUrl: string | null;
  onPress: () => void;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({
  name,
  description,
  price,
  imageUrl,
  onPress,
}) => {
  const defaultImage = 'https://placehold.co/400x300/E63946/white?text=Malaky';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {/* حاوية المعلومات (الآن على اليسار ) */}
      <View style={styles.infoContainer}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {description || 'وجبة لذيذة من الدجاج الملكي بروست'}
        </Text>
        <Text style={styles.price}>{price.toFixed(2)} شيكل</Text>
      </View>

      {/* الصورة (الآن على اليمين) */}
      <Image source={{ uri: imageUrl || defaultImage }} style={styles.image} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', // <-- أهم تغيير: يجعل الصورة على اليمين والمعلومات على اليسار
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    height: 130, // ارتفاع مناسب للبطاقة الأفقية
    // الظل
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  image: {
    width: 130, // عرض ثابت للصورة
    height: '100%', // تأخذ كامل ارتفاع البطاقة
    backgroundColor: '#f0f0f0',
  },
  infoContainer: {
    flex: 1, // تأخذ باقي المساحة المتاحة
    padding: 12,
    justifyContent: 'space-between', // توزيع العناصر بشكل متساوٍ عمودياً
  },
  name: {
    fontSize: 18,
    fontFamily: 'Cairo-Bold', // استخدام الخط العريض
    color: '#1D3557',
    textAlign: 'right',
  },
  description: {
    fontSize: 14,
    fontFamily: 'Cairo-Regular', // استخدام الخط العادي
    color: '#666',
    textAlign: 'right',
    lineHeight: 20,
  },
  price: {
    fontSize: 17,
    fontFamily: 'Cairo-Bold',
    color: '#E63946',
    textAlign: 'right',
    marginTop: 4,
  },
});

export default MenuItemCard;
