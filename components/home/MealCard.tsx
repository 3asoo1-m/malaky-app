// components/home/MealCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image'; // ✅ 1. استيراد Image من "expo-image"
import { getOptimizedImageUrl } from '@/lib/utils'; // ✅ 1. استيراد الدالة الجديدة
import { useFavorites } from '@/lib/useFavorites'; // ✅ 1. استيراد hook المفضلة الصحيح

import { MenuItem } from '@/lib/types';
import { Colors } from '@/styles';
import { Heart, Plus, Minus, ShoppingCart } from 'lucide-react-native';
import { useCart } from '@/lib/useCart';
import { useRouter } from 'expo-router'; // ✅ 1. استيراد useRouter

const defaultImage = require('../../assets/images/icon.png');
const blurhash = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4'; // هذا مجرد مثال، يمكنك إنشاء واحد لكل صورة

const MealCard = ({ meal }: { meal: MenuItem }) => {
  const router = useRouter(); // ✅ 2. تهيئة الراوتر
  const { items, addToCart, updateQuantity } = useCart();
  const { favoriteIds, toggleFavorite, loading: favoritesLoading } = useFavorites();
  const isMealFavorite = favoriteIds.has(meal.id);

  // ابحث عن العناصر المطابقة للمنتج في السلة (بغض النظر عن الخيارات)
  const itemsInCart = items.filter(item => item.product.id === meal.id);
  const totalQuantity = itemsInCart.reduce((sum, item) => sum + item.quantity, 0);

  const originalImageUrl = meal.images?.[0]?.image_url;
  
  // اطلب نسخة صغيرة ومحسنة من الصورة (e.g., 300x300 pixels, webp format)
  const optimizedImageUrl = originalImageUrl 
    ? getOptimizedImageUrl(originalImageUrl, { width: 300, height: 300, format: 'webp', quality: 80 })
    : null;

  const imageSource = optimizedImageUrl ? { uri: optimizedImageUrl } : defaultImage;

  const [isFavorite, setIsFavorite] = React.useState(false);

  // ✅ 3. تحديد ما إذا كان المنتج يحتوي على خيارات
  const hasOptions = meal.options && meal.options.length > 0;

  // ✅ 4. دالة جديدة لمعالجة الضغط على الزر
  const handlePress = () => {
    if (hasOptions) {
      // إذا كان هناك خيارات، انتقل إلى شاشة التفاصيل
      router.push(`/item/${meal.id}`);
    } else {
      // إذا لم يكن هناك خيارات، أضف إلى السلة مباشرة
      // ابحث عن العنصر البسيط (بدون خيارات) في السلة
      const simpleCartItem = items.find(item => item.product.id === meal.id && Object.keys(item.options).length === 0);
      if (simpleCartItem) {
        // إذا كان موجودًا، قم بزيادة الكمية
        updateQuantity(simpleCartItem.id, 1);
      } else {
        // إذا لم يكن موجودًا، أضفه
        addToCart(meal, 1, {});
      }
    }
  };

  const handleUpdateQuantity = (amount: 1 | -1) => {
    // هذا المنطق سيعمل فقط على أول عنصر يجده، وهو مناسب للمنتجات البسيطة
    const simpleCartItem = items.find(item => item.product.id === meal.id && Object.keys(item.options).length === 0);
    if (simpleCartItem) {
      updateQuantity(simpleCartItem.id, amount);
    }
  };
  const handleToggleFavorite = () => {
    // منع الضغط المتكرر أثناء التحميل
    if (favoritesLoading) return;
    toggleFavorite(meal.id);
  };

  return (
    // ✅ 5. جعل البطاقة بأكملها قابلة للضغط للانتقال إلى التفاصيل
    <TouchableOpacity style={styles.card} onPress={( ) => router.push(`/item/${meal.id}`)}>
      <View>
         {/* ✅ 3. استخدام مكون Image الجديد مع خصائصه المحسنة */}
        <Image
          style={styles.image}
          source={imageSource}
          placeholder={{ blurhash }}
          contentFit="cover"
          transition={300}
        />
        <TouchableOpacity style={styles.favoriteButton} onPress={handleToggleFavorite} disabled={favoritesLoading}>
          {favoritesLoading && favoriteIds.has(meal.id) ? ( // عرض مؤشر تحميل فقط على العنصر الذي يتم تحديثه
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Heart size={18} color={isMealFavorite ? Colors.primary : '#333'} fill={isMealFavorite ? Colors.primary : 'transparent'} />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>{meal.name}</Text>
        <Text style={styles.description} numberOfLines={1}>{meal.description}</Text>

        <View style={styles.footer}>
          <View>
            <Text style={styles.price}>{meal.price.toFixed(2)} ₪</Text>
          </View>

          {/* ✅ 6. تعديل منطق العرض والضغط */}
          {totalQuantity > 0 && !hasOptions ? (
            // عرض أزرار الكمية فقط للمنتجات البسيطة الموجودة في السلة
            <View style={styles.quantityContainer}>
              <TouchableOpacity onPress={() => handleUpdateQuantity(1)} style={[styles.quantityButton, { backgroundColor: Colors.primary }]}>
                <Plus size={14} color="white" />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{totalQuantity}</Text>
              <TouchableOpacity onPress={() => handleUpdateQuantity(-1)} style={[styles.quantityButton, { backgroundColor: '#E5E7EB' }]}>
                <Minus size={14} color="#374151" />
              </TouchableOpacity>
            </View>
          ) : (
            // عرض زر الإضافة/الخيارات في جميع الحالات الأخرى
            <TouchableOpacity style={styles.addButton} onPress={handlePress}>
              {hasOptions ? (
                // إذا كان هناك خيارات، أظهر أيقونة تشير إلى ذلك
                <Plus size={18} color="white" />
              ) : (
                // إذا لم يكن هناك خيارات، أظهر أيقونة السلة
                <ShoppingCart size={18} color="white" />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
    card: { width: '48%', backgroundColor: 'white', borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, overflow: 'hidden' },
    image: { width: '100%', height: 140},
    badge: { position: 'absolute', top: 8, left: 8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    badgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
    favoriteButton: { position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(255,255,255,0.8)', padding: 6, borderRadius: 99 },
    content: { padding: 12 },
    name: { fontSize: 16, fontWeight: '600', color: Colors.text, textAlign: 'left' },
    description: { fontSize: 12, color: Colors.textSecondary, textAlign: 'left', marginTop: 4 },
    footer: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
    price: { fontSize: 16, fontWeight: 'bold', color: Colors.primary },
    addButton: { backgroundColor: Colors.primary, padding: 8, borderRadius: 99 },
    quantityContainer: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 99 },
    quantityButton: { padding: 6, borderRadius: 99 },
    quantityText: { marginHorizontal: 12, fontSize: 16, fontWeight: '600' },
});

export default MealCard;