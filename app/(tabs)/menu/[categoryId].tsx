// مسار الملف: app/menu/[categoryId].tsx

import { useLocalSearchParams, Stack, useRouter, useFocusEffect } from 'expo-router';
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import MenuItemCard from '@/components/MenuItemCard';
import { supabase } from '@/lib/supabase';
import { MenuItem } from '@/lib/types';
import { withQueryTracking } from '@/lib/query-client';
import { useFavorites } from '@/lib/useFavorites'; // ✅ استيراد هنا


// --- دوال الـ Caching (تبقى كما هي) ---
const CACHE_KEYS = { CATEGORY_ITEMS: 'category_items' };
const CACHE_DURATION = 1000 * 60 * 10; // 10 دقائق

const cacheCategoryItems = async (categoryId: string, data: any) => {
  try {
    const cacheItem = { data, timestamp: Date.now() };
    await AsyncStorage.setItem(`${CACHE_KEYS.CATEGORY_ITEMS}_${categoryId}`, JSON.stringify(cacheItem));
    console.log(`✅ Category ${categoryId} items cached (${data.length} items)`);
  } catch (error) {
    console.error('❌ Error caching category items:', error);
  }
};

const getCachedCategoryItems = async (categoryId: string) => {
  try {
    const cached = await AsyncStorage.getItem(`${CACHE_KEYS.CATEGORY_ITEMS}_${categoryId}`);
    if (!cached) return null;
    const cacheItem = JSON.parse(cached);
    if (Date.now() - cacheItem.timestamp > CACHE_DURATION) {
      await AsyncStorage.removeItem(`${CACHE_KEYS.CATEGORY_ITEMS}_${categoryId}`);
      return null;
    }
    return cacheItem.data;
  } catch (error) {
    console.error('❌ Error getting cached category items:', error);
    return null;
  }
};

// --- دوال الـ API والتحقق (تبقى كما هي) ---
const fetchCategoryItemsWithTracking = async (categoryId: string) => {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('category_id', Number(categoryId))
    .eq('is_active', true)
    .order('name');
  if (error) throw new Error(error.message);
  return data || [];
};

const validateMenuItems = (data: any): data is MenuItem[] => {
  return Array.isArray(data) && data.every(item =>
    item && typeof item.id === 'number' && typeof item.name === 'string' && typeof item.price === 'number'
  );
};

// =================================================================
// ✅ المكون الرئيسي النهائي والمستقر
// =================================================================
export default function MenuItemsScreen() {
  const router = useRouter();
  const { categoryId, categoryName } = useLocalSearchParams<{ categoryId: string; categoryName: string }>();
  const mountedRef = useRef(true);

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

    const { favoriteIds, toggleFavorite } = useFavorites();
  console.log(`[LOG 1] 🔵 MenuItemsScreen RENDER - Category: ${categoryId}`);

    
  // ✅ دالة تحميل البيانات الرئيسية المبسطة والمستقرة
  const loadData = useCallback(async (isRefreshing = false) => {
    if (!categoryId) return;

    console.log(`🎯 [LOAD] Starting load for category ${categoryId}. Refreshing: ${isRefreshing}`);
    setError(null);

    if (isRefreshing) {
      setRefreshing(true);
    } else {
      // عند التحميل الأولي، اعرض مؤشر التحميل فقط إذا كانت الشاشة فارغة
      if (menuItems.length === 0) {
        setInitialLoading(true);
      }
    }

    try {
      let dataToSet: MenuItem[] | null = null;

      // الخطوة 1: حاول جلب البيانات من الكاش (إلا إذا كان تحديثاً قسرياً)
      if (!isRefreshing) {
        const cachedItems = await getCachedCategoryItems(categoryId);
        if (cachedItems && validateMenuItems(cachedItems)) {
          console.log('💾 [CACHE] Using cached items.');
          dataToSet = cachedItems;
        }
      }

      // الخطوة 2: إذا لم نجد بيانات في الكاش، أو كان تحديثاً، اذهب للشبكة
      if (dataToSet === null) {
        console.log('🌐 [API] Fetching fresh data from server...');
        const freshData = await withQueryTracking(
          ['category-items', categoryId],
          () => fetchCategoryItemsWithTracking(categoryId)
        );

        if (validateMenuItems(freshData)) {
          console.log('✅ [API] Fresh data is valid.');
          dataToSet = freshData;
          // خزن البيانات الجديدة في الكاش
          await cacheCategoryItems(categoryId, freshData);
        } else {
          // إذا فشل التحقق من البيانات الجديدة، ارمِ خطأً
          throw new Error('Invalid data received from server.');
        }
      }
      
      // الخطوة 3: تحديث الحالة بالبيانات النهائية
      if (mountedRef.current) {
        setMenuItems(dataToSet || []);
      }

    } catch (err: any) {
      console.error('❌ [ERROR] Load failed:', err.message);
      if (!mountedRef.current) return;

      // الخطة البديلة: حاول استخدام الكاش مرة أخيرة قبل إظهار الخطأ
      const fallbackItems = await getCachedCategoryItems(categoryId);
      if (fallbackItems && validateMenuItems(fallbackItems)) {
        console.log('🔄 [FALLBACK] API failed, using cached data as fallback.');
        setMenuItems(fallbackItems);
      } else {
        // إذا فشل كل شيء، اعرض الخطأ
        setError("فشل في تحميل الوجبات. تأكد من اتصال الإنترنت.");
        setMenuItems([]);
      }
    } finally {
      if (mountedRef.current) {
        setInitialLoading(false);
        setRefreshing(false);
      }
    }
  }, [categoryId]); // ✅ الاعتمادية على categoryId فقط!

  // ✅ useEffect للتحميل عند تغيير الفئة
  useEffect(() => {
    mountedRef.current = true;
    console.log(`🔃 [MOUNT] Component mounted for category: ${categoryId}`);
    loadData(); // تحميل البيانات عند المونت أو تغيير الفئة

    return () => {
      mountedRef.current = false;
      console.log('🧹 [UNMOUNT] Component cleanup');
    };
  }, [loadData]); // ✅ يعتمد على loadData التي تعتمد بدورها على categoryId

  // ✅ useFocusEffect لإعادة التحميل عند العودة للشاشة (فقط إذا كانت فارغة)
  useFocusEffect(
    useCallback(() => {
      if (menuItems.length === 0 && !initialLoading && categoryId) {
        console.log('🔍 [FOCUS] Screen is empty, reloading data...');
        loadData();
      }
    }, [categoryId, menuItems.length, initialLoading, loadData])
  );

  // --- دوال الـ Handlers (تبقى كما هي مع تعديل بسيط) ---
  const handleRefresh = useCallback(() => {
    loadData(true);
  }, [loadData]);

  const handleRetry = useCallback(() => {
    loadData();
  }, [loadData]);

  const handleItemPress = useCallback((itemId: number) => {
        console.log(`[LOG 5] ➡️ Navigating to item: ${itemId}`);

    router.push(`/item/${itemId}`);
  }, [router]);


  
  // --- مكونات العرض (تبقى كما هي) ---
  const renderMenuItem = useCallback(({ item }: { item: MenuItem }) => {
    const isFavorite = favoriteIds.has(item.id);
    console.log(`[LOG 4] 🔄 renderItem CALLED for item: ${item.id}`);

    return (
      <MenuItemCard
        item={item}
        isFavorite={isFavorite}
        onToggleFavorite={() => {
          // [LOG 6] تتبع الضغط على القلب
          console.log(`[LOG 6] ❤️ Heart pressed for item: ${item.id}`);
          toggleFavorite(item.id);
        }}
        onPress={() => handleItemPress(item.id)}
      />
    );
  }, [favoriteIds, toggleFavorite, handleItemPress]);

  console.log(`[LOG 2] 📊 FlatList is about to render with ${menuItems.length} items.`);

  const showLoading = initialLoading && menuItems.length === 0 && !error;
  const showEmpty = !initialLoading && !refreshing && menuItems.length === 0 && !error;
  const showError = !initialLoading && !refreshing && !!error;

  if (showLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: categoryName || 'القائمة' }} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#C62828" />
          <Text style={styles.loadingText}>جاري تحميل الوجبات...</Text>
        </View>
      </SafeAreaView>
    );
  }

  function keyExtractor(item: MenuItem, index: number): string {
    throw new Error('Function not implemented.');
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: categoryName || 'القائمة' }} />
      <FlatList
        data={menuItems}
        keyExtractor={keyExtractor}
        renderItem={renderMenuItem}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.row}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#C62828']}
            tintColor="#C62828"
          />
        }
        ListEmptyComponent={() => {
          if (showError) {
            return (
              <View style={styles.centered}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                  <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
                </TouchableOpacity>
              </View>
            );
          }
          if (showEmpty) {
            return (
              <View style={styles.centered}>
                <Text style={styles.emptyText}>لا توجد وجبات في هذا القسم حالياً.</Text>
              </View>
            );
          }
          return null;
        }}
      />
    </SafeAreaView>
  );
}

// --- التنسيقات (تبقى كما هي) ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 12, fontSize: 16, color: '#666', fontFamily: 'Cairo-Regular' },
  errorText: { fontSize: 16, color: '#666', fontFamily: 'Cairo-Regular', textAlign: 'center', marginBottom: 16 },
  retryButton: { backgroundColor: '#C62828', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryButtonText: { color: '#fff', fontSize: 14, fontFamily: 'Cairo-Bold' },
  listContent: { paddingHorizontal: 12, paddingTop: 15, flexGrow: 1 },
  row: { justifyContent: 'space-between' },
  cardWrapper: { width: '48%', marginBottom: 15 },
  emptyText: { fontSize: 16, color: '#666', fontFamily: 'Cairo-Regular', textAlign: 'center' },
});
