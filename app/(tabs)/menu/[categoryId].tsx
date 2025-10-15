// مسار الملف: app/menu/[categoryId].tsx

import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import MenuItemCard from '@/components/MenuItemCard';
import { supabase } from '@/lib/supabase';
import { MenuItem } from '@/lib/types';

// =================================================================
// ✅ دوال الـ Caching للعناصر حسب الفئة
// =================================================================
const CACHE_KEYS = {
  CATEGORY_ITEMS: 'category_items'
};

const CACHE_DURATION = 1000 * 60 * 10; // 10 دقائق

const cacheCategoryItems = async (categoryId: string, data: any) => {
  try {
    const cacheItem = { data, timestamp: Date.now() };
    await AsyncStorage.setItem(`${CACHE_KEYS.CATEGORY_ITEMS}_${categoryId}`, JSON.stringify(cacheItem));
    console.log(`✅ Category ${categoryId} items cached`);
  } catch (error) {
    console.error('❌ Error caching category items:', error);
  }
};

const getCachedCategoryItems = async (categoryId: string) => {
  try {
    const cached = await AsyncStorage.getItem(`${CACHE_KEYS.CATEGORY_ITEMS}_${categoryId}`);
    if (!cached) {
      console.log(`📭 No cache found for category: ${categoryId}`);
      return null;
    }
    const cacheItem = JSON.parse(cached);
    const isExpired = Date.now() - cacheItem.timestamp > CACHE_DURATION;
    if (isExpired) {
      console.log(`🕐 Cache expired for category: ${categoryId}`);
      await AsyncStorage.removeItem(`${CACHE_KEYS.CATEGORY_ITEMS}_${categoryId}`);
      return null;
    }
    console.log(`✅ Using cached items for category: ${categoryId}`);
    return cacheItem.data;
  } catch (error) {
    console.error('❌ Error getting cached category items:', error);
    return null;
  }
};

// =================================================================
// ✅ المكون الرئيسي المحسن
// =================================================================
export default function MenuItemsScreen() {
  const router = useRouter();
  const { categoryId, categoryName } = useLocalSearchParams<{ categoryId: string; categoryName: string }>();

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ useCallback لـ fetchMenuItems
  const fetchMenuItems = useCallback(async (isRefreshing = false) => {
    if (!categoryId) return;

    setError(null);
    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      // ✅ تحقق من الـ cache أولاً
      const cachedItems = isRefreshing ? null : await getCachedCategoryItems(categoryId);
      
      if (cachedItems && !isRefreshing) {
        console.log('✅ Using cached category items');
        setMenuItems(cachedItems);
      } else {
        console.log('🌐 Fetching fresh category items');
        const { data, error } = await supabase.rpc('get_items_by_category', {
          p_category_id: Number(categoryId),
        });

        if (error) {
          throw new Error(error.message);
        }
        
        const itemsData = data || [];
        setMenuItems(itemsData);
        
        // ✅ خزن البيانات في الـ cache
        if (itemsData.length > 0) {
          await cacheCategoryItems(categoryId, itemsData);
        }
      }
    } catch (err: any) {
      const errorMessage = "فشل في تحميل الوجبات. تأكد من اتصال الإنترنت.";
      setError(errorMessage);
      console.error('Error fetching menu items:', err.message);
      
      // ✅ fallback إلى البيانات المخزنة
      const cachedItems = await getCachedCategoryItems(categoryId);
      if (cachedItems) {
        setMenuItems(cachedItems);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [categoryId]);

  useEffect(() => {
    fetchMenuItems();
  }, [fetchMenuItems]);

  // ✅ useCallback للدوال
  const handleRefresh = useCallback(() => {
    fetchMenuItems(true);
  }, [fetchMenuItems]);

  const handleItemPress = useCallback((itemId: number) => {
    router.push(`/item/${itemId}`);
  }, [router]);

  const handleRetry = useCallback(() => {
    fetchMenuItems();
  }, [fetchMenuItems]);

  // ✅ useCallback لـ renderItem و keyExtractor
  const renderMenuItem = useCallback(({ item }: { item: MenuItem }) => (
    <View style={styles.cardWrapper}>
      <MenuItemCard
        item={item}
        onPress={() => handleItemPress(item.id)}
      />
    </View>
  ), [handleItemPress]);

  const keyExtractor = useCallback((item: MenuItem) => item.id.toString(), []);

  // ✅ useMemo للبيانات المشتقة
  const hasItems = useMemo(() => menuItems.length > 0, [menuItems.length]);

  const emptyComponent = useMemo(() => {
    if (loading) return null;
    
    return (
      <View style={styles.centered}>
        {error ? (
          <>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.emptyText}>لا توجد وجبات في هذا القسم حالياً.</Text>
        )}
      </View>
    );
  }, [loading, error, handleRetry]);

  if (loading && !refreshing && menuItems.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#C62828" />
        <Text style={styles.loadingText}>جاري تحميل الوجبات...</Text>
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
        keyExtractor={keyExtractor}
        renderItem={renderMenuItem}
        numColumns={2}
        contentContainerStyle={[
          styles.listContent,
          !hasItems && styles.emptyListContent
        ]}
        columnWrapperStyle={styles.row}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh} 
            colors={['#C62828']} 
            tintColor="#C62828"
          />
        }
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={50}
        windowSize={11}
        initialNumToRender={8}
        ListEmptyComponent={emptyComponent}
        ListFooterComponent={hasItems ? <View style={styles.listFooter} /> : null}
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
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    fontFamily: 'Cairo-Regular',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Cairo-Regular',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#C62828',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Cairo-Bold',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 15,
    paddingBottom: 20,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
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
    textAlign: 'center',
  },
  listFooter: {
    height: 20,
  },
});

// ✅ إضافة TouchableOpacity المستورد
import { TouchableOpacity } from 'react-native';