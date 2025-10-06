// مسار الملف: app/(tabs)/favorites.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView, // ✅ 1. استخدام SafeAreaView
} from 'react-native';
import { useFavorites } from '@/lib/useFavorites';
import { supabase } from '@/lib/supabase';
import { MenuItem } from '@/lib/types';
import MenuItemCard from '@/components/MenuItemCard';
import CustomBottomNav from '@/components/CustomBottomNav';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; // ✅ 2. استيراد الأيقونات

export default function FavoritesScreen() {
  const router = useRouter();
  const { favoriteIds } = useFavorites();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavoriteItems = async () => {
    if (favoriteIds.size === 0) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ids = Array.from(favoriteIds);
const { data, error } = await supabase
  .from('menu_items')
  .select(`
    *,
    images:menu_item_images (
      id,
      image_url,
      alt_text
    )
  `)
  .in('id', ids);
    if (error) console.error('Error fetching favorite items:', error);
    else setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchFavoriteItems();
  }, [favoriteIds]);

  if (loading && items.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#C62828" />
      </View>
    );
  }

  return (
    // ✅ 3. استخدام SafeAreaView كحاوية رئيسية
    <SafeAreaView style={styles.fullScreen}>
      {/* ✅ 4. عنوان بسيط بدلاً من الهيدر الكامل */}
      <Text style={styles.headerTitle}>المفضلة</Text>

      {items.length === 0 ? (
        // ✅ 5. تحسين رسالة القائمة الفارغة
        <View style={styles.centered}>
          <Ionicons name="heart-dislike-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>قائمة المفضلة فارغة</Text>
          <Text style={styles.emptySubText}>أضف بعض المنتجات التي تحبها لتبدأ</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          renderItem={({ item }) => (
  <View style={styles.cardWrapper}>
    <MenuItemCard
      id={item.id}
      name={item.name}
      description={item.description}
      price={item.price}
      imageUrl={item.images && item.images.length > 0 ? item.images[0].image_url : undefined}
      onPress={() => router.push(`/item/${item.id}`)}
    />
  </View>
)}

          // ✅ 6. تعديل التنسيقات لإضافة مسافات
          contentContainerStyle={styles.listContainer}
          columnWrapperStyle={styles.row} // تنسيق للصف
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchFavoriteItems} />
          }
        />
      )}

      <CustomBottomNav />
    </SafeAreaView>
  );
}

// ✅ 7. تحديث التنسيقات بالكامل
const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'right',
    paddingHorizontal: 20,
    paddingTop: 20, // مسافة من الأعلى
    marginBottom: 10,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80, // لرفع المحتوى فوق الشريط السفلي
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#555',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 15,
    color: '#888',
    marginTop: 8,
  },
  listContainer: {
    paddingHorizontal: 12.5, // مسافة من الجوانب
    paddingBottom: 120, // مساحة للشريط السفلي
  },
  row: {
    justifyContent: 'space-between', // يباعد بين العنصرين في الصف
  },
  cardWrapper: {
    width: '48%', // كل عنصر يأخذ أقل من نصف العرض بقليل
    marginBottom: 15, // مسافة بين الصفوف
  },
});
