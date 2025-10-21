// مسار الملف: app/(tabs)/favorites.tsx

import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { useFavorites } from '@/lib/useFavorites';
import { supabase } from '@/lib/supabase';
import { MenuItem } from '@/lib/types';
import MenuItemCard from '@/components/MenuItemCard';
import CustomBottomNav from '@/components/CustomBottomNav';
import { Ionicons } from '@expo/vector-icons';

// ✅ استيراد نظام التحليلات
import { trackEvent, AnalyticsEvents } from '@/lib/analytics';

const { width: screenWidth } = Dimensions.get('window');

export default function FavoritesScreen() {
  const router = useRouter();
  const { favoriteIds } = useFavorites();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // ✅ useCallback لـ fetchFavoriteItems مع تحسينات
  const fetchFavoriteItems = useCallback(async (isRefreshing = false) => {
    if (favoriteIds.size === 0) {
      setItems([]);
      if (isRefreshing) {
        setRefreshing(false);
      }
      return;
    }

    setError(null);
    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const ids = Array.from(favoriteIds);
      
      console.log('🌐 Fetching favorite items:', ids.length);
      
      const { data, error } = await supabase
        .from('menu_items')
        .select(`*, images:menu_item_images(id, image_url, display_order)`)
        .in('id', ids)
        .order('name');

      if (error) {
        throw new Error(error.message);
      }

      setItems(data || []);

      // ✅ تتبع نجاح جلب المفضلة
      trackEvent('favorites_fetched', {
        favorites_count: data?.length || 0,
        is_refreshing: isRefreshing
      });

    } catch (err: any) {
      const errorMessage = "فشل في تحميل المفضلة. تأكد من اتصال الإنترنت.";
      setError(errorMessage);
      console.error('Error fetching favorite items:', err);
      
      // ✅ تتبع الأخطاء
      trackEvent(AnalyticsEvents.ERROR_OCCURRED, {
        screen: 'favorites',
        error_type: 'fetch_favorites_failed',
        error_message: err.message
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [favoriteIds]);

  // ✅ useFocusEffect محسن
  useFocusEffect(
    useCallback(() => {
      // ✅ تتبع فتح شاشة المفضلة
      trackEvent('favorites_screen_viewed', {
        favorites_count: favoriteIds.size,
        has_favorites: favoriteIds.size > 0
      });

      fetchFavoriteItems();
    }, [fetchFavoriteItems, favoriteIds])
  );

  // ✅ useCallback للدوال التفاعلية
  const handleRefresh = useCallback(() => {
    // ✅ تتبع السحب للتحديث
    trackEvent(AnalyticsEvents.PULL_TO_REFRESH, {
      screen: 'favorites',
      current_favorites_count: items.length
    });
    
    fetchFavoriteItems(true);
  }, [fetchFavoriteItems, items.length]);

  const handleRetry = useCallback(() => {
    // ✅ تتبع إعادة المحاولة
    trackEvent('favorites_retry_attempt', {
      previous_error: error
    });
    
    fetchFavoriteItems();
  }, [fetchFavoriteItems, error]);

  const handleBrowseMenu = useCallback(() => {
    // ✅ تتبع الانتقال للقائمة
    trackEvent('browse_menu_from_favorites', {
      source: 'empty_favorites',
      favorites_count: favoriteIds.size
    });
    
    router.push('/');
  }, [router, favoriteIds.size]);

  const handleItemPress = useCallback((item: MenuItem) => {
    // ✅ تتبع النقر على عنصر في المفضلة
    trackEvent('favorite_item_tapped', {
      item_id: item.id,
      item_name: item.name,
      item_price: item.price,
      category_id: item.category_id
    });
    
    router.push(`/item/${item.id}`);
  }, [router]);

  // ✅ useCallback لـ renderItem و keyExtractor
  const renderItem = useCallback(({ item, index }: { item: MenuItem; index: number }) => (
    <View style={[
      styles.cardWrapper,
      index % 2 === 0 ? styles.cardLeft : styles.cardRight
    ]}>
      <MenuItemCard
        item={item}
        onPress={() => handleItemPress(item)}
      />
    </View>
  ), [handleItemPress]);

  const keyExtractor = useCallback((item: MenuItem) => 
    `favorite_${item.id}`, []);

  // ✅ useMemo للبيانات المشتقة
  const hasFavorites = useMemo(() => items.length > 0, [items.length]);
  const isEmpty = useMemo(() => !loading && items.length === 0, [loading, items.length]);

  // ✅ حساب الأبعاد بشكل ديناميكي
  const CARD_MARGIN = 10;
  const CARD_WIDTH = useMemo(() => 
    (screenWidth - (CARD_MARGIN * 3)) / 2, 
    [screenWidth]
  );

  if (loading && !refreshing && items.length === 0) {
    return (
      <View style={styles.fullScreen}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <Text style={styles.headerTitle}>المفضلة</Text>
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#C62828" />
            <Text style={styles.loadingText}>جاري تحميل المفضلة...</Text>
          </View>
        </SafeAreaView>
        <CustomBottomNav />
      </View>
    );
  }

  return (
    <View style={styles.fullScreen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* ✅ رأس الصفحة المحسن */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>المفضلة</Text>
          {hasFavorites && (
            <Text style={styles.favoritesCount}>
              {items.length} عنصر
            </Text>
          )}
        </View>

        {/* ✅ عرض الخطأ إذا وجد */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning-outline" size={20} color="#D32F2F" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
            </TouchableOpacity>
          </View>
        )}

        {isEmpty ? (
          <View style={styles.centered}>
            <Ionicons name="heart-dislike-outline" size={80} color="#E5E7EB" />
            <Text style={styles.emptyText}>قائمة المفضلة فارغة</Text>
            <Text style={styles.emptySubText}>أضف بعض المنتجات التي تحبها لتبدأ</Text>
            <TouchableOpacity 
              style={styles.browseButton}
              onPress={handleBrowseMenu}
            >
              <Text style={styles.browseButtonText}>تصفح القائمة</Text>
              <Ionicons name="fast-food-outline" size={18} color="#fff" style={styles.browseIcon} />
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={items}
            keyExtractor={keyExtractor}
            numColumns={2}
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
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
            updateCellsBatchingPeriod={100}
            windowSize={7}
            initialNumToRender={6}
            ListFooterComponent={hasFavorites ? <View style={styles.listFooter} /> : null}
          />
        )}
      </SafeAreaView>
      
      <CustomBottomNav />
    </View>
  );
}

// ✅ التنسيقات المحسنة مع حل مشكلة الهوامش
const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: '#F5F5F5',
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Cairo-Bold',
    color: '#1A1A1A',
  },
  favoritesCount: {
    fontSize: 14,
    fontFamily: 'Cairo-Regular',
    color: '#666',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#D32F2F',
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
    fontFamily: 'Cairo-Regular',
    marginRight: 8,
  },
  retryButton: {
    backgroundColor: '#D32F2F',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Cairo-SemiBold',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    fontFamily: 'Cairo-Regular',
  },
  emptyText: {
    fontSize: 20,
    fontFamily: 'Cairo-Bold',
    color: '#555',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 15,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
    fontFamily: 'Cairo-Regular',
    lineHeight: 22,
  },
  browseButton: {
    marginTop: 20,
    backgroundColor: '#C62828',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Cairo-Bold',
  },
  browseIcon: {
    marginRight: 8,
  },
  listContainer: {
    paddingHorizontal: 10, // ✅ تقليل الهوامش الجانبية
    paddingBottom: 120,
    paddingTop: 5,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 5, // ✅ إضافة padding داخلي للمساعدة في التوزيع المتساوي
  },
  cardWrapper: {
    width: '48%', // ✅ استخدام نسبة مئوية ثابتة
    marginBottom: 15,
  },
  cardLeft: {
    // ✅ لا حاجة لتحسينات إضافية - الهوامش متساوية الآن
  },
  cardRight: {
    // ✅ لا حاجة لتحسينات إضافية - الهوامش متساوية الآن
  },
  listFooter: {
    height: 20,
  },
});