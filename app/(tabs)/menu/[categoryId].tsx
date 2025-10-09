// مسار الملف: app/menu/[categoryId].tsx

import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
} from 'react-native';

import MenuItemCard from '@/components/MenuItemCard';
import { supabase } from '@/lib/supabase';
import { MenuItem } from '@/lib/types';

export default function MenuItemsScreen() {
  const router = useRouter();
  const { categoryId, categoryName } = useLocalSearchParams<{ categoryId: string; categoryName: string }>();

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMenuItems = async () => {
    if (!categoryId) return;

    setLoading(true);
    try {
      // ✅ 1. استدعاء دالة RPC الجديدة مع تمرير categoryId
      const { data, error } = await supabase.rpc('get_items_by_category', {
        p_category_id: Number(categoryId),
      });

      if (error) {
        console.error('Error fetching menu items:', error.message);
      } else {
        setMenuItems(data || []);
      }
    } catch (error) {
      console.error('An unexpected error occurred:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, [categoryId]);

  if (loading && menuItems.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#C62828" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: categoryName || 'القائمة',
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#333',
          headerTitleStyle: { fontFamily: 'Cairo-Bold' },
          headerShadowVisible: false,
        }}
      />

      <FlatList
        data={menuItems}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2} // ✅ 2. عرض الوجبات في عمودين
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            {/* ✅ 3. تمرير كائن 'item' بالكامل */}
            <MenuItemCard
              item={item}
              onPress={() => router.push(`/item/${item.id}`)}
            />
          </View>
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.centered}>
              <Text style={styles.emptyText}>لا توجد وجبات في هذا القسم حالياً.</Text>
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.row}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchMenuItems} colors={['#C62828']} />
        }
      />
    </SafeAreaView>
  );
}

// ✅ 4. تحديث التنسيقات بالكامل لتناسب العرض بعمودين
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  listContent: {
    paddingHorizontal: 12.5,
    paddingTop: 15,
  },
  row: {
    justifyContent: 'space-between',
  },
  cardWrapper: {
    width: '48%',
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Cairo-Regular',
  },
});
