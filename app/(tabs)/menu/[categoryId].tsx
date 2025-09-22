// مسار الملف: app/menu/[categoryId].tsx

import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';

import MenuItemCard from '@/components/MenuItemCard'; // استيراد بطاقة الوجبة
import { supabase } from '@/lib/supabase';
import { MenuItem } from '@/lib/types'; // استيراد نوع الوجبة

export default function MenuItemsScreen() {
  const router = useRouter();
  const { categoryId, categoryName } = useLocalSearchParams<{ categoryId: string; categoryName: string }>();

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!categoryId) return;

    const fetchMenuItems = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('menu_items')
          .select('*')
          .eq('category_id', categoryId); // فلترة الوجبات حسب معرّف القسم

        if (error) {
          console.error('Error fetching menu items:', error);
        } else {
          setMenuItems(data || []);
        }
      } catch (error) {
        console.error('An unexpected error occurred:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItems();
  }, [categoryId]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#E63946" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: categoryName || 'القائمة',
          headerStyle: { backgroundColor: '#1D3557' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />

      <FlatList
        data={menuItems}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <MenuItemCard
            name={item.name}
            description={item.description}
            price={item.price}
            imageUrl={item.image_url}
            onPress={() => router.push(`/item/${item.id}`)}

            onAddToCart={() => {
              // هنا سنضيف الوجبة إلى سلة المشتريات لاحقاً
              console.log('Added to cart:', item.name);
            }}
          />
        )}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyText}>لا توجد وجبات في هذا القسم حالياً.</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  listContent: {
    padding: 15,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});
