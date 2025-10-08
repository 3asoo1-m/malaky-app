// مسار الملف: app/(tabs)/favorites.tsx

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { useFavorites } from '@/lib/useFavorites';
import { supabase } from '@/lib/supabase';
import { MenuItem } from '@/lib/types';
import MenuItemCard from '@/components/MenuItemCard';
import CustomBottomNav from '@/components/CustomBottomNav'; // ✅ 1. إعادة استيراد CustomBottomNav
import { Ionicons } from '@expo/vector-icons';

export default function FavoritesScreen() {
  const router = useRouter();
  const { favoriteIds } = useFavorites();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFavoriteItems = async () => {
    if (favoriteIds.size === 0) {
      setItems([]);
      return;
    }
    setLoading(true);
    const ids = Array.from(favoriteIds);
    
    const { data, error } = await supabase
      .from('menu_items')
      .select(`*, images:menu_item_images(id, image_url, display_order)`)
      .in('id', ids);

    if (error) {
      console.error('Error fetching favorite items:', error);
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchFavoriteItems();
    }, [favoriteIds])
  );

  if (loading && items.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#C62828" />
      </View>
    );
  }

  return (
    // ✅ 2. استخدام View كحاوية رئيسية للسماح بوضع الشريط السفلي بشكل مطلق
    <View style={styles.fullScreen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Text style={styles.headerTitle}>المفضلة</Text>

        {items.length === 0 ? (
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
                  item={item}
                  onPress={() => router.push(`/item/${item.id}`)}
                />
              </View>
            )}
            contentContainerStyle={styles.listContainer}
            columnWrapperStyle={styles.row}
            refreshControl={
              <RefreshControl refreshing={loading} onRefresh={fetchFavoriteItems} colors={['#C62828']} />
            }
          />
        )}
      </SafeAreaView>
      
      {/* ✅ 3. إعادة إضافة CustomBottomNav في الأسفل */}
      <CustomBottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  safeArea: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Cairo-Bold',
    textAlign: 'left',
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 10,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
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
    paddingHorizontal: 12.5,
    paddingBottom: 120, // ✅ 4. إعادة المسافة السفلية لإفساح المجال للشريط
  },
  row: {
    justifyContent: 'space-between',
  },
  cardWrapper: {
    width: '48%',
    marginBottom: 15,
  },
});
