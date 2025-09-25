// مسار الملف: components/GridItemCard.tsx

import React from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface GridItemCardProps {
  name: string;
  price: number;
  imageUrl: string | null;
  onPress: () => void;
}

const GridItemCard: React.FC<GridItemCardProps> = ({
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
        <Text style={styles.name} numberOfLines={2}>{name}</Text>
        <Text style={styles.price}>{price.toFixed(2 )} شيكل</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1, // <-- مهم جداً لتصميم الشبكة
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    margin: 7, // مسافة صغيرة حول كل بطاقة
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 5 },
      android: { elevation: 4 },
    }),
  },
  image: {
    width: '100%',
    height: 120, // ارتفاع مناسب للصورة في بطاقة الشبكة
    backgroundColor: '#f0f0f0',
  },
  infoContainer: {
    padding: 10,
  },
  name: {
    fontSize: 15,
    fontFamily: 'Cairo-Bold',
    color: '#1D3557',
    textAlign: 'right',
    minHeight: 40, // يضمن أن الاسم يأخذ مساحة كافية حتى لو كان قصيراً
  },
  price: {
    fontSize: 14,
    fontFamily: 'Cairo-Bold',
    color: '#E63946',
    textAlign: 'right',
    marginTop: 4,
  },
});

export default GridItemCard;
