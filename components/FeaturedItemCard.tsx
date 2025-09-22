// مسار الملف: components/FeaturedItemCard.tsx

import React from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface FeaturedItemCardProps {
  name: string;
  price: number;
  imageUrl: string | null;
  onPress: () => void;
}

const FeaturedItemCard: React.FC<FeaturedItemCardProps> = ({
  name,
  price,
  imageUrl,
  onPress,
}) => {
  const defaultImage = 'https://placehold.co/400x300/E63946/white?text=Malaky';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <Image source={{ uri: imageUrl || defaultImage }} style={styles.image} />
      <View style={styles.infoContainer}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        <Text style={styles.price}>{price.toFixed(2 )} شيكل</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 160, // عرض ثابت للبطاقة المصغرة
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 15, // مسافة بين البطاقات في القائمة الأفقية
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 3 },
    }),
  },
  image: {
    width: '100%',
    height: 100,
    backgroundColor: '#f0f0f0',
  },
  infoContainer: {
    padding: 8,
  },
  name: {
    fontSize: 14,
    fontFamily: 'Cairo-Bold',
    color: '#1D3557',
    textAlign: 'right',
  },
  price: {
    fontSize: 13,
    fontFamily: 'Cairo-Regular',
    color: '#E63946',
    textAlign: 'right',
    marginTop: 4,
  },
});

export default FeaturedItemCard;
