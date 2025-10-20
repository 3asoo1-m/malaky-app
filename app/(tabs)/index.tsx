// مسار الملف: app/(tabs)/index.tsx

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, FlatList, TextInput,
  ActivityIndicator, Image, Platform, Dimensions, Linking,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import MenuItemCard from '@/components/MenuItemCard';
import CategoryChips from '@/components/CategoryChips';
import CustomBottomNav from '@/components/CustomBottomNav';

// ✅✅✅ استيراد كل الأنواع من مصدر الحقيقة الواحد ✅✅✅
import {
  Category,
  CategoryWithItems,
  ActiveCategory,
  Promotion,
  MenuItem,
  PromotionsCarouselProps,
  SectionComponentProps
} from '@/lib/types';

// ✅ استيراد نظام التحليلات
import { trackEvent, AnalyticsEvents, flushBackupEvents, cleanupOldBackupEvents } from '@/lib/analytics';

const { width: screenWidth } = Dimensions.get('window');

// =================================================================
// دوال الـ Caching المحسنة
// =================================================================
const CACHE_KEYS = {
  MENU_DATA: 'menu_data',
  PROMOTIONS: 'promotions_data',
  CATEGORIES: 'categories_data',
  SEARCH_CACHE: 'search_cache',
  LAST_SYNC_TIMESTAMP: 'last_sync_timestamp'
};

const CACHE_DURATION = 1000 * 60 * 10; // 10 دقائق
const SYNC_INTERVAL = 1000 * 60 * 5; // 5 دقائق

const cacheData = async (key: string, data: any) => {
  try {
    const cacheItem = {
      data,
      timestamp: Date.now(),
      version: '1.0'
    };
    await AsyncStorage.setItem(key, JSON.stringify(cacheItem));
    console.log(`✅ Data cached for key: ${key}`);
  } catch (error) {
    console.error('❌ Error caching data:', error);
  }
};

const getCachedData = async (key: string) => {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (!cached) {
      console.log(`📭 No cache found for key: ${key}`);
      return null;
    }
    const cacheItem = JSON.parse(cached);

    // ✅ التحقق من الصلاحية والنسخة
    const isExpired = Date.now() - cacheItem.timestamp > CACHE_DURATION;
    if (isExpired) {
      console.log(`🕐 Cache expired for key: ${key}`);
      await AsyncStorage.removeItem(key);
      return null;
    }

    console.log(`✅ Using cached data for key: ${key}`);
    return cacheItem.data;
  } catch (error) {
    console.error('❌ Error getting cached data:', error);
    return null;
  }
};

const clearCache = async (key?: string) => {
  try {
    if (key) {
      await AsyncStorage.removeItem(key);
    } else {
      await AsyncStorage.multiRemove(Object.values(CACHE_KEYS));
    }
    console.log(`🗑️ Cache cleared for key: ${key || 'all'}`);
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
  }
};

// =================================================================
// المكونات الفرعية المحسنة
// =================================================================

const PromotionsCarousel = React.memo(({ promotions }: PromotionsCarouselProps) => {
  const router = useRouter();

  const handlePress = useCallback((promotion: Promotion) => {
    // ✅ تتبع النقر على الإعلان
    trackEvent(AnalyticsEvents.PROMOTION_TAPPED, {
      promotion_id: promotion.id,
      promotion_title: promotion.title,
      action_type: promotion.action_type
    });

    if (!promotion.action_type || !promotion.action_value) return;
    switch (promotion.action_type) {
      case 'navigate_to_item':
        router.push(`/item/${promotion.action_value}`);
        break;
      case 'open_url':
        Linking.openURL(promotion.action_value).catch(err => console.error("Couldn't load page", err));
        break;
      default:
        break;
    }
  }, [router]);

  const CARD_WIDTH = useMemo(() => screenWidth * 0.85, []);
  const CARD_MARGIN = useMemo(() => (screenWidth - CARD_WIDTH) / 2, [CARD_WIDTH]);

  const renderPromoItem = useCallback(({ item }: { item: Promotion }) => (
    <TouchableOpacity
      style={[styles.promoCard, { width: CARD_WIDTH }]}
      onPress={() => handlePress(item)}
      activeOpacity={0.9}
    >
      <View style={styles.promoImageContainer}>
        <Image source={{ uri: item.image_url }} style={styles.promoImage} resizeMode="cover" />
      </View>
      <View style={styles.promoTextContainer}>
        <Text style={styles.promoTitle} numberOfLines={1}>{item.title}</Text>
        {item.description && <Text style={styles.promoDescription} numberOfLines={1}>{item.description}</Text>}
      </View>
    </TouchableOpacity>
  ), [CARD_WIDTH, handlePress]);

  const keyExtractor = useCallback((item: Promotion) => item.id.toString(), []);

  // ✅ تتبع عرض الإعلانات
  useEffect(() => {
    if (promotions.length > 0) {
      trackEvent(AnalyticsEvents.PROMOTIONS_VIEWED, {
        promotions_count: promotions.length,
        promotion_ids: promotions.map(p => p.id)
      });
    }
  }, [promotions.length]);

  if (!promotions || promotions.length === 0) return null;

  return (
    <View style={styles.promoContainer}>
      <FlatList
        data={promotions}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={keyExtractor}
        contentContainerStyle={{ paddingStart: CARD_MARGIN - 10, paddingEnd: CARD_MARGIN }}
        snapToInterval={CARD_WIDTH + 10}
        decelerationRate="fast"
        removeClippedSubviews={true}
        maxToRenderPerBatch={3}
        updateCellsBatchingPeriod={50}
        windowSize={5}
        initialNumToRender={3}
        renderItem={renderPromoItem}
      />
    </View>
  );
});

const SectionComponent = React.memo(({ section, router }: SectionComponentProps) => {
  const renderMenuItem = useCallback(({ item }: { item: MenuItem }) => (
    <MenuItemCard
      item={item}
      onPress={() => {
        // ✅ نقل التتبع خارج التصيير الرئيسي
        setTimeout(() => {
          trackEvent(AnalyticsEvents.ITEM_VIEWED, {
            item_id: item.id,
            item_name: item.name,
            category_id: section.id,
          });
        }, 0);

        router.push(`/item/${item.id}`);
      }}
    />
  ), [router, section.id, section.name]);

  const keyExtractor = useCallback((menuItem: MenuItem) =>
    `menu_item_${menuItem.id}`, []);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{section.name}</Text>
      {section.menu_items && section.menu_items.length > 0 ? (
        <FlatList
          data={section.menu_items}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={keyExtractor}
          renderItem={renderMenuItem}
          contentContainerStyle={{ paddingHorizontal: 10, paddingVertical: 10 }}
          removeClippedSubviews={true}
          maxToRenderPerBatch={5}
          updateCellsBatchingPeriod={100}
          windowSize={7}
          initialNumToRender={5}
        />
      ) : (
        <Text style={styles.noItemsText}>لا توجد وجبات في هذا القسم حالياً.</Text>
      )}
    </View>
  );
});

// =================================================================
// المكون الرئيسي المحسن (HomeScreen)
// =================================================================

export default function HomeScreen() {
  const router = useRouter();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [sections, setSections] = useState<CategoryWithItems[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<ActiveCategory>('all');
  const [isChipsSticky, setIsChipsSticky] = useState(false);
  const [chipsHeight, setChipsHeight] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<FlatList>(null);
  const [hasUnread, setHasUnread] = useState(false);
  const [searchCache, setSearchCache] = useState<{ [query: string]: CategoryWithItems[] }>({});
  const [isDataCached, setDataCached] = useState({ menu: false, promotions: false, categories: false });
  const [lastSyncTime, setLastSyncTime] = useState<number>(0);

  // ✅ استخدام useRef للـ timeout - الإصدار المصحح
  const searchTimeoutRef = useRef<number | null>(null);

  // ✅ useCallback للدوال
  const handleCategorySelect = useCallback((categoryId: ActiveCategory) => {
    setSearchQuery('');
    setActiveCategory(categoryId);

    // ✅ تتبع تغيير الفئة
    trackEvent(AnalyticsEvents.CATEGORY_CHANGED, {
      new_category: categoryId,
      previous_category: activeCategory,
      source: 'chips'
    });
  }, [activeCategory]);

  // ✅ تحسين البحث مع useRef - الإصدار المصحح
  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);

    // ✅ تنظيف الـ timeout السابق
    if (searchTimeoutRef.current !== null) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }

    // ✅ معالجة مسح البحث مباشرة
    if (text.length === 0) {
      if (searchQuery.length > 0) {
        trackEvent(AnalyticsEvents.SEARCH_CLEARED, {
          previous_query_length: searchQuery.length
        });
      }
      return;
    }

    // ✅ بحث بعد توقف الكتابة
    if (text.length > 2) {
      searchTimeoutRef.current = setTimeout(() => {
        const searchTerm = text.toLowerCase().trim();
        const hasResults = sections.some(section =>
          section.menu_items?.some(item =>
            item.name.toLowerCase().includes(searchTerm) ||
            (item.description && item.description.toLowerCase().includes(searchTerm))
          )
        );

        trackEvent(AnalyticsEvents.SEARCH_PERFORMED, {
          query: text,
          query_length: text.length,
          has_results: hasResults,
          search_term: searchTerm
        });

        searchTimeoutRef.current = null;
      }, 500);
    }
  }, [sections, searchQuery]);

  const handleClearSearch = useCallback(() => {
    if (searchQuery.length > 0) {
      // ✅ تتبع مسح البحث
      trackEvent(AnalyticsEvents.SEARCH_CLEARED, {
        previous_query: searchQuery,
        query_length: searchQuery.length
      });
    }
    setSearchQuery('');
  }, [searchQuery]);

  const handleScroll = useCallback((event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    const PROMO_HEIGHT = promotions.length > 0 ? 240 : 0;
    const HEADER_HEIGHT = (Platform.OS === 'ios' ? 260 : 280) + PROMO_HEIGHT;
    setIsChipsSticky(scrollY > HEADER_HEIGHT);

    // ✅ تتبع التمرير
    if (scrollY > 500) {
      trackEvent(AnalyticsEvents.SCROLL_DEPTH, {
        scroll_depth: 'deep',
        scroll_position: scrollY
      });
    }
  }, [promotions.length]);

  const handleNotificationPress = useCallback(() => {
    // ✅ تتبع النقر على الإشعارات
    trackEvent(AnalyticsEvents.NOTIFICATIONS_ACCESSED, {
      has_unread: hasUnread
    });
    router.push('/notifications');
  }, [router, hasUnread]);

  // ✅ دوال مساعدة محسنة
  const fetchFreshData = useCallback(async () => {
    const [menuResponse, promotionsResponse] = await Promise.all([
      supabase.rpc('get_menu'),
      supabase.from('promotions').select('*').eq('is_active', true).order('display_order'),
    ]);

    if (menuResponse.error) throw menuResponse.error;
    const fetchedSections: CategoryWithItems[] = menuResponse.data || [];
    const fetchedCategories: Category[] = fetchedSections.map(s => ({ id: s.id, name: s.name }));

    setSections(fetchedSections);
    setCategories(fetchedCategories);
    await cacheData(CACHE_KEYS.MENU_DATA, fetchedSections);
    await cacheData(CACHE_KEYS.CATEGORIES, fetchedCategories);

    if (promotionsResponse.error) throw promotionsResponse.error;
    const fetchedPromotions = promotionsResponse.data || [];
    setPromotions(fetchedPromotions);
    await cacheData(CACHE_KEYS.PROMOTIONS, fetchedPromotions);

    // ✅ تحديث وقت المزامنة
    const syncTime = Date.now();
    setLastSyncTime(syncTime);
    await AsyncStorage.setItem(CACHE_KEYS.LAST_SYNC_TIMESTAMP, syncTime.toString());

    // ✅ تتبع نجاح جلب البيانات
    trackEvent(AnalyticsEvents.DATA_FETCH_SUCCESS, {
      sections_count: fetchedSections.length,
      promotions_count: fetchedPromotions.length,
      categories_count: fetchedCategories.length
    });

    return { fetchedSections, fetchedCategories, fetchedPromotions };
  }, []);

  const checkNotifications = useCallback(async (userId: string) => {
    const { count: unreadCount, error: notificationError } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (notificationError) {
      console.error("Error fetching notification status:", notificationError);
    } else {
      setHasUnread((unreadCount ?? 0) > 0);
    }
  }, []);

  const handleCacheFallback = useCallback(async () => {
    // ✅ fallback إلى البيانات المخزنة إذا كانت موجودة
    const [cachedMenu, cachedPromotions, cachedCategories] = await Promise.all([
      getCachedData(CACHE_KEYS.MENU_DATA),
      getCachedData(CACHE_KEYS.PROMOTIONS),
      getCachedData(CACHE_KEYS.CATEGORIES)
    ]);

    if (cachedMenu && cachedPromotions && cachedCategories) {
      console.log('🔄 Using cached data as fallback');
      setSections(cachedMenu);
      setCategories(cachedCategories);
      setPromotions(cachedPromotions);
      setDataCached({ menu: true, promotions: true, categories: true });

      // ✅ تتبع استخدام البيانات المخزنة
      trackEvent(AnalyticsEvents.CACHE_USED, {
        cache_type: 'full_fallback',
        sections_count: cachedMenu.length,
        promotions_count: cachedPromotions.length
      });
    }
  }, []);

  // ✅ تحسين الـ loadData مع Error Handling والتحليلات
  const loadData = useCallback(async (isRefreshing = false) => {
    setError(null);

    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      // ✅ تتبع بدء جلب البيانات
      trackEvent(AnalyticsEvents.DATA_FETCH_STARTED, {
        is_refreshing: isRefreshing,
        user_id: user.id
      });

      // ✅ تحسين جلب البيانات المخزنة
      const cachePromises = isRefreshing
        ? [null, null, null]
        : [
          getCachedData(CACHE_KEYS.MENU_DATA),
          getCachedData(CACHE_KEYS.PROMOTIONS),
          getCachedData(CACHE_KEYS.CATEGORIES)
        ];

      const [cachedMenu, cachedPromotions, cachedCategories] = await Promise.all(cachePromises);

      let shouldFetchFromServer = true;

      // ✅ استخدام البيانات المخزنة إذا كانت متاحة
      if (cachedMenu && cachedPromotions && cachedCategories && !isRefreshing) {
        console.log('✅ Using cached data for initial render');
        setSections(cachedMenu);
        setCategories(cachedCategories);
        setPromotions(cachedPromotions);
        setDataCached({ menu: true, promotions: true, categories: true });
        shouldFetchFromServer = false;

        // ✅ تتبع استخدام الكاش
        const lastSync = await AsyncStorage.getItem(CACHE_KEYS.LAST_SYNC_TIMESTAMP);
        const dataAge = Date.now() - (lastSync ? parseInt(lastSync) : Date.now());
        trackEvent(AnalyticsEvents.CACHE_USED, {
          cache_type: 'initial_load',
          data_age: dataAge
        });
      } else {
        console.log('🌐 Fetching fresh data from server');
      }

      // ✅ جلب البيانات الجديدة إذا لزم الأمر
      if (shouldFetchFromServer || isRefreshing) {
        await fetchFreshData();
        setDataCached({ menu: false, promotions: false, categories: false });
      }

      // ✅ التحقق من الإشعارات
      await checkNotifications(user.id);

    } catch (err) {
      const errorMessage = "فشل في تحميل البيانات. تأكد من اتصال الإنترنت.";
      setError(errorMessage);
      console.error("Error loading data:", err);

      // ✅ تتبع الأخطاء
      trackEvent(AnalyticsEvents.ERROR_OCCURRED, {
        error_type: 'data_fetch_failed',
        error_message: err instanceof Error ? err.message : 'Unknown error'
      });

      // ✅ استخدام البيانات المخزنة كـ fallback
      await handleCacheFallback();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchFreshData, checkNotifications, handleCacheFallback]);

  const handleRefreshData = useCallback(async () => {
    console.log('🔄 Manually refreshing data...');

    // ✅ تتبع التحديث اليدوي
    trackEvent(AnalyticsEvents.MANUAL_REFRESH, {
      current_data_age: Date.now() - lastSyncTime
    });

    await loadData(true);
  }, [loadData, lastSyncTime]);

  // ✅ تأثير التحميل الأولي والمزامنة
  useEffect(() => {
    // ✅ تتبع فتح التطبيق
    trackEvent(AnalyticsEvents.APP_OPENED, {
      source: 'cold_start',
      platform: Platform.OS,
      timestamp: new Date().toISOString()
    });

    // ✅ محاولة إرسال الأحداث المحفوظة
    flushBackupEvents();
    cleanupOldBackupEvents();

    loadData();

    // ✅ تنظيف الـ timeout عند unmount - الإصدار المصحح
    return () => {
      if (searchTimeoutRef.current !== null) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
    };
  }, []);

  // ✅ مزامنة تلقائية دورية
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading && Date.now() - lastSyncTime > SYNC_INTERVAL) {
        console.log('🔄 Auto-syncing data...');
        loadData(true);
      }
    }, SYNC_INTERVAL);

    return () => clearInterval(interval);
  }, [loading, lastSyncTime]);

  // ✅ تحسين scroll to category
  useEffect(() => {
    if (activeCategory === 'all' || !listRef.current || sections.length === 0) return;

    const promoSectionExists = promotions.length > 0;
    const categoriesIndex = 1 + (promoSectionExists ? 1 : 0);
    const sectionIndex = sections.findIndex(section => section.id === activeCategory);

    if (sectionIndex !== -1) {
      const targetIndex = categoriesIndex + sectionIndex + 1;
      setTimeout(() => {
        listRef.current?.scrollToIndex({
          animated: true,
          index: targetIndex,
          viewOffset: chipsHeight
        });
      }, 50);
    }
  }, [activeCategory, chipsHeight, sections, promotions]);

  // ✅ تحسين البحث مع caching والتحليلات
  const filteredSections = useMemo(() => {
    if (searchQuery.trim() === '') return sections;

    const cacheKey = searchQuery.toLowerCase().trim();

    // ✅ تحقق من الـ cache أولاً
    if (searchCache[cacheKey]) {
      console.log(`✅ Using cached search results for: "${searchQuery}"`);

      // ✅ تتبع استخدام كاش البحث
      const resultsCount = searchCache[cacheKey].reduce((total, section) =>
        total + (section.menu_items?.length || 0), 0
      );
      trackEvent(AnalyticsEvents.SEARCH_CACHE_HIT, {
        query: searchQuery,
        results_count: resultsCount
      });

      return searchCache[cacheKey];
    }

    console.log(`🔍 Performing new search for: "${searchQuery}"`);

    // ✅ تحسين خوارزمية البحث
    const result = sections
      .map(section => ({
        ...section,
        menu_items: section.menu_items?.filter(item =>
          item.name.toLowerCase().includes(cacheKey) ||
          (item.description && item.description.toLowerCase().includes(cacheKey))
        ) || []
      }))
      .filter(section => section.menu_items.length > 0);

    // ✅ تتبع نتائج البحث
    const resultsCount = result.reduce((total, section) =>
      total + (section.menu_items?.length || 0), 0
    );
    trackEvent(AnalyticsEvents.SEARCH_RESULTS, {
      query: searchQuery,
      results_count: resultsCount,
      sections_with_results: result.length
    });

    // ✅ خزن النتائج فقط إذا كانت هناك نتائج
    if (result.length > 0) {
      setSearchCache(prev => ({
        ...prev,
        [cacheKey]: result
      }));
      console.log(`💾 Cached search results for: "${searchQuery}"`);
    }

    return result;
  }, [sections, searchQuery, searchCache]);

  const listData = useMemo(() => [
    { type: 'header' as const, id: 'main-header' },
    ...(promotions.length > 0 ? [{ type: 'promotions' as const, id: 'promo-carousel' }] : []),
    { type: 'categories' as const, id: 'cat-chips' },
    ...filteredSections.map(section => ({ ...section, type: 'section' as const })),
  ], [filteredSections, promotions]);

  // ✅ useCallback لـ renderItem
  const renderListItem = useCallback(({ item }: { item: any }) => {
    if (item.type === 'header') {
      return (
        <View>
          <View style={styles.topBar}>
            <View style={styles.logoContainer}>
              <Image source={require('@/assets/images/malakylogo.png')} style={styles.logoImage} />
              <Text style={styles.logoText}>الدجاج الملكي بروست</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.refreshButton} onPress={handleRefreshData}>
                <Ionicons name="refresh" size={24} color="#D32F2F" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.notificationButton} onPress={handleNotificationPress}>
                <Ionicons
                  name={hasUnread ? "notifications" : "notifications-outline"}
                  size={28}
                  color={hasUnread ? "#D32F2F" : "#000"}
                />
                {hasUnread && <View style={styles.notificationDot} />}
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.header}>
            <Text style={styles.headerText}>اختر</Text>
            <Text style={styles.headerText}>طعامك <Text style={{ color: '#c02626ff' }}>المفضل</Text></Text>
          </View>
          <View style={styles.searchSection}>
            <View style={styles.searchBar}>
              <Feather name="search" size={22} color="#888" />
              <TextInput
                placeholder="ابحث..."
                style={styles.searchInput}
                placeholderTextColor="#888"
                value={searchQuery}
                onChangeText={handleSearchChange}
              />
              {searchQuery.length > 0 && (
                <Text style={styles.searchResultsText}>
                  {filteredSections.reduce((total, section) => total + (section.menu_items?.length || 0), 0)} نتيجة
                </Text>
              )}
            </View>
            <TouchableOpacity style={styles.searchButton} onPress={handleClearSearch}>
              {searchQuery.length > 0 ?
                <Ionicons name="close" size={24} color="#fff" /> :
                <Feather name="arrow-left" size={24} color="#fff" />
              }
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (item.type === 'promotions') {
      return <PromotionsCarousel promotions={promotions} />;
    }

    if (item.type === 'categories') {
      return (
        <View
          onLayout={(event) => {
            const { height } = event.nativeEvent.layout;
            if (height > 0 && chipsHeight === 0) setChipsHeight(height);
          }}
          style={[styles.categoryChipsContainer, isChipsSticky && styles.stickyCategoryChipsContainer]}
        >
          <CategoryChips
            categories={categories}
            activeCategory={activeCategory}
            onCategorySelect={handleCategorySelect}
            loading={loading}
          />
        </View>
      );
    }

    if (item.type === 'section') {
      return <SectionComponent section={item as CategoryWithItems} router={router} />;
    }

    return null;
  }, [
    searchQuery, hasUnread, promotions, categories, activeCategory, isChipsSticky,
    chipsHeight, filteredSections, handleCategorySelect, handleSearchChange,
    handleClearSearch, handleNotificationPress, handleRefreshData, router, loading
  ]);

  const keyExtractor = useCallback((item: any) => {
    if (item.type && item.id) return item.id;
    if (item.id) return item.id.toString();
    return Math.random().toString();
  }, []);

  if (loading && !refreshing) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#D32F2F" />
        <Text style={styles.loadingText}>جاري تحميل البيانات...</Text>
        {isDataCached.menu && <Text style={styles.cachedText}>⚡ باستخدام البيانات المخزنة</Text>}
      </View>
    );
  }

  return (
    <View style={styles.fullScreen}>
      <SafeAreaView style={styles.container}>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => loadData()}>
              <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
            </TouchableOpacity>
          </View>
        )}

        <FlatList
          ref={listRef}
          data={listData}
          keyExtractor={keyExtractor}
          stickyHeaderIndices={promotions.length > 0 ? [2] : [1]}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          keyboardDismissMode="on-drag"
          removeClippedSubviews={true}
          maxToRenderPerBatch={5}
          updateCellsBatchingPeriod={50}
          windowSize={7}
          initialNumToRender={5}
          renderItem={renderListItem}
          refreshing={refreshing}
          onRefresh={() => {
            // ✅ تتبع السحب للتحديث
            trackEvent(AnalyticsEvents.PULL_TO_REFRESH);
            loadData(true);
          }}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyText}>
                {searchQuery ? 'لا توجد نتائج تطابق بحثك.' : 'لا توجد وجبات متاحة حالياً.'}
              </Text>
            </View>
          }
          ListFooterComponent={<View style={{ height: 100 }} />}
        />
      </SafeAreaView>
      <CustomBottomNav />
    </View>
  );
}

// ✅✅✅ التنسيقات المحدثة مع تحسينات إضافية ✅✅✅
const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: '#F5F5F5'
  },
  container: {
    flex: 1
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5'
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  cachedText: {
    marginTop: 5,
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#D32F2F',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
  },
  retryButton: {
    backgroundColor: '#D32F2F',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButton: {
    padding: 8,
    marginRight: 10,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  logoImage: {
    width: 80,
    height: 80,
    resizeMode: 'contain'
  },
  logoText: {
    fontFamily: 'Cairo-Bold',
    fontSize: 18,
    marginHorizontal: 8,
    marginTop: 4
  },
  notificationButton: {
    position: 'relative'
  },
  notificationDot: {
    position: 'absolute',
    top: 2,
    end: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#D32F2F',
    borderWidth: 1.5,
    borderColor: '#fff'
  },
  header: {
    paddingHorizontal: 20,
    marginTop: 20,
    alignItems: 'flex-start'
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right'
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 20
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 50,
    elevation: 5
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginHorizontal: 5,
    textAlign: 'right'
  },
  searchResultsText: {
    fontSize: 12,
    color: '#D32F2F',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  searchButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#D32F2F',
    justifyContent: 'center',
    alignItems: 'center',
    marginStart: 10
  },

  // --- تنسيقات الإعلانات المحسنة ---
  promoContainer: {
    marginTop: 25,
    marginBottom: -5,
    height: 240,
  },
  promoCard: {
    height: 220,
    marginHorizontal: 5,
    borderRadius: 16,
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  promoImageContainer: {
    height: 150,
    width: '100%',
    backgroundColor: '#f0f0f0',
  },
  promoImage: {
    width: '100%',
    height: '100%',
  },
  promoTextContainer: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'flex-end',
    flex: 1,
  },
  promoTitle: {
    fontSize: 17,
    fontFamily: 'Cairo-Bold',
    color: '#333',
  },
  promoDescription: {
    fontSize: 14,
    fontFamily: 'Cairo-Regular',
    color: '#777',
    marginTop: 2,
  },

  categoryChipsContainer: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 10
  },
  stickyCategoryChipsContainer: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3
  },
  section: {
    marginTop: 25,
    backgroundColor: '#F5F5F5',
    overflow: 'visible'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    paddingHorizontal: 20,
    textAlign: 'left'
  },
  noItemsText: {
    paddingHorizontal: 20,
    color: '#888',
    textAlign: 'left'
  },
  centered: {
    padding: 20,
    alignItems: 'center',
    marginTop: 50
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});