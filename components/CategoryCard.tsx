// مسار الملف: components/CategoryCard.tsx

import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

interface CategoryCardProps {
  name: string;
  imageUrl: string | null;
  onPress: () => void;
  size?: 'small' | 'large'; // سنحتفظ بهذه الخاصية للشبكة الديناميكية
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  name,
  imageUrl,
  onPress,
  size = 'small',
}) => {
  const defaultImage = 'https://images.unsplash.com/photo-1562967914-608f82629710?q=80&w=2073&auto=format&fit=crop';
  
  const cardHeight = size === 'large' ? 240 : 200;

  return (
    <View style={styles.cardWrapper}>
      <TouchableOpacity
        style={[styles.cardContainer, { height: cardHeight }]}
        onPress={onPress}
        activeOpacity={0.8}>
        
        {/* الجزء العلوي: الصورة */}
        <Image
          source={{ uri: imageUrl || defaultImage }}
          style={styles.image}
        />

        {/* الجزء السفلي: المعلومات */}
        <View style={styles.infoContainer}>
          <Text style={styles.name} numberOfLines={2}>{name}</Text>
          <FontAwesome name="arrow-left" size={20} color="#E63946" />
        </View>

      </TouchableOpacity>
    </View>
   );
};

const styles = StyleSheet.create({
  cardWrapper: {
    flex: 1,
    maxWidth: '48%',
  },
  cardContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 15,
    backgroundColor: '#FFFFFF', // خلفية بيضاء للبطاقة بأكملها
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  image: {
    width: '100%',
    flex: 1, // تأخذ كل المساحة المتاحة فوق حاوية المعلومات
    backgroundColor: '#f0f0f0',
  },
  infoContainer: {
    padding: 12,
    minHeight: 70, // ارتفاع أدنى ثابت للجزء السفلي
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1, // خط فاصل خفيف
    borderTopColor: '#f0f0f0',
  },
  name: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1D3557', // اللون الأزرق الداكن
    flex: 1, // ليأخذ المساحة المتاحة
    marginRight: 8, // مسافة بين النص والسهم
    textAlign: 'right',
  },
});

export default CategoryCard;
