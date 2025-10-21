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

// ✅ استيراد نظام التحليلات المحسن
import { 
  trackEvent, 
  AnalyticsEvents, 
  flushBackupEvents, 
  cleanupOldBackupEvents,
  initializeAnalytics,
  cleanupAnalytics,
  forceFlush
} from '@/lib/analytics';

const { width: screenWidth } = Dimensions.get('window');

// =================================================================
// إعدادات الكاش المحسنة
// =================================================================
const CACHE_KEYS = {
  MENU_DATA: 'menu_data',
  PROMOTIONS: 'promotions_data',
  CATEGORIES: 'categories_data',
  SEARCH_CACHE: 'search_cache',
  LAST_SYNC_TIMESTAMP: 'last_sync_timestamp'
};

const CACHE_DURATION = 1000 * 60 * 15; // زيادة إلى 15 دقيقة
const SYNC_INTERVAL = 1000 * 60 * 10; // زيادة إلى 10 دقائق

// ✅ دوال الكاش المحسنة
const cacheData = async (key: string, data: any) => {
  try {
    const cacheItem = {
      data,
      timestamp: Date.now(),
      version: '1.1' // تحديث النسخة
    };
    await AsyncStorage.setItem(key, JSON.stringify(cacheItem));
  } catch (error) {
    console.error('❌ Error caching data:', error);
  }
};

const getCachedData = async (key: string) => {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (!cached) return null;
    
    const cacheItem = JSON.parse(cached);
    const isExpired = Date.now() - cacheItem.timestamp > CACHE_DURATION;
    
    if (isExpired) {
      await AsyncStorage.removeItem(key);
      return null;
    }

    return cacheItem.data;
  } catch (error) {
    console.error('❌ Error getting cached data:', error);
    return null;
  }
};

// =================================================================
// المكونات الفرعية المحسنة
// =================================================================

const PromotionsCarousel = React.memo(({ promotions }: PromotionsCarouselProps) => {
  const router = useRouter();

  const handlePress = useCallback((promotion: Promotion) => {
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
        Linking.openURL(promotion.action_value).catch(err => 
          console.error("Couldn't load page", err)
        );
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
        <Image 
          source={{ uri: item.image_url }} 
          style={styles.promoImage} 
          resizeMode="cover"
          defaultSource={require('@/assets/images/icon.png')} // ✅ إضافة صورة افتراضية
        />
      </View>
      <View style={styles.promoTextContainer}>
        <Text style={styles.promoTitle} numberOfLines={1}>{item.title}</Text>
        {item.description && (
          <Text style={styles.promoDescription} numberOfLines={1}>
            {item.description}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  ), [CARD_WIDTH, handlePress]);

  const keyExtractor = useCallback((item: Promotion) => item.id.toString(), []);

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
        contentContainerStyle={{ 
          paddingStart: CARD_MARGIN - 10, 
          paddingEnd: CARD_MARGIN 
        }}
        snapToInterval={CARD_WIDTH + 10}
        decelerationRate="fast"
        removeClippedSubviews={Platform.OS === 'android'} // ✅ تحسين للأندرويد فقط
        maxToRenderPerBatch={2} // ✅ تقليل العدد
        updateCellsBatchingPeriod={100}
        windowSize={3} // ✅ تقليل حجم النافذة
        initialNumToRender={2}
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
        // ✅ استخدام requestAnimationFrame بدلاً من setTimeout
        requestAnimationFrame(() => {
          trackEvent(AnalyticsEvents.ITEM_VIEWED, {
            item_id: item.id,
            item_name: item.name,
            category_id: section.id,
          });
        });

        router.push(`/item/${item.id}`);
      }}
    />
  ), [router, section.id]);

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
          removeClippedSubviews={Platform.OS === 'android'}
          maxToRenderPerBatch={3} // ✅ تقليل العدد
          updateCellsBatchingPeriod={150}
          windowSize={5}
          initialNumToRender={3}
        />
      ) : (
        <View style={styles.emptySectionContainer}>
          <Text style={styles.noItemsText}>لا توجد وجبات في هذا القسم حالياً.</Text>
          <Text style={styles.emptySectionHint}>جرب اختيار قسم آخر</Text>
        </View>
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

  // ✅ استخدام useRef للـ timeout
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ✅ دالة مساعدة محسنة للعثور على أقرب قسم غير فارغ
  const findNearestNonEmptySectionId = useCallback((currentCategoryId: ActiveCategory): ActiveCategory | null => {
    if (currentCategoryId === 'all') return null;

    // ✅ فلترة الأقسام التي تحتوي على عناصر
    const nonEmptySections = sections.filter(section => 
      section && section.menu_items && section.menu_items.length > 0
    );

    if (nonEmptySections.length === 0) return null;

    const currentIndex = nonEmptySections.findIndex(section => section.id === currentCategoryId);
    
    // ✅ إذا كان القسم الحالي غير فارغ، استخدمه
    if (currentIndex !== -1) {
      console.log(`✅ القسم الحالي غير فارغ: ${nonEmptySections[currentIndex].name}`);
      return nonEmptySections[currentIndex].id;
    }

    // ✅ البحث عن أقرب قسم غير فارغ
    const allSectionIds = sections.map(s => s.id);
    const currentIndexInAll = allSectionIds.indexOf(currentCategoryId);
    
    if (currentIndexInAll === -1) return nonEmptySections[0].id;

    // ✅ البحث للأمام
    for (let i = currentIndexInAll + 1; i < sections.length; i++) {
      const section = sections[i];
      if (section && section.menu_items && section.menu_items.length > 0) {
        console.log(`✅ وجد قسم غير فارغ للأمام: ${section.name}`);
        return section.id;
      }
    }
    
    // ✅ البحث للخلف
    for (let i = currentIndexInAll - 1; i >= 0; i--) {
      const section = sections[i];
      if (section && section.menu_items && section.menu_items.length > 0) {
        console.log(`✅ وجد قسم غير فارغ للخلف: ${section.name}`);
        return section.id;
      }
    }

    console.log('⚠️ لم يتم العثور على أي قسم غير فارغ');
    return null;
  }, [sections]);

  // ✅ دالة محسنة لاختيار الفئة مع معالجة الأقسام الفارغة
  const handleCategorySelect = useCallback((categoryId: ActiveCategory) => {
    console.log(`🎯 محاولة اختيار الفئة: ${categoryId}`);
    
    if (categoryId === 'all') {
      setSearchQuery('');
      setActiveCategory('all');
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
      trackEvent(AnalyticsEvents.CATEGORY_CHANGED, { new_category: 'all', source: 'chips' });
      return;
    }

    const selectedSection = sections.find(section => section.id === categoryId);
    const isEmptySection = !selectedSection?.menu_items || selectedSection.menu_items.length === 0;

    let targetCategoryId: ActiveCategory | null = categoryId;

    // ✅ إذا كان القسم المختار فارغاً
    if (isEmptySection) {
      console.log(`⚠️ القسم '${selectedSection?.name}' فارغ. البحث عن بديل...`);
      
      // تتبع محاولة اختيار قسم فارغ
      trackEvent('empty_category_selected', {
        category_id: categoryId,
        category_name: selectedSection?.name
      });

      // ابحث عن أقرب قسم غير فارغ
      targetCategoryId = findNearestNonEmptySectionId(categoryId);
      
      // ✅ إذا لم يتم العثور على بديل، استخدم "الكل"
      if (!targetCategoryId) {
        console.log("❌ لم يتم العثور على قسم بديل، العودة إلى 'الكل'");
        setActiveCategory('all');
        trackEvent(AnalyticsEvents.CATEGORY_CHANGED, {
          original_selection: categoryId,
          final_category: 'all',
          was_redirected: true,
          reason: 'no_non_empty_sections_found'
        });
        return;
      }
    }

    // ✅ إذا وجدنا قسماً (سواء الأصلي أو البديل)
    if (targetCategoryId) {
      setSearchQuery('');
      setActiveCategory(targetCategoryId);

      // تتبع تغيير الفئة
      if (targetCategoryId !== activeCategory) {
        trackEvent(AnalyticsEvents.CATEGORY_CHANGED, {
          original_selection: categoryId,
          final_category: targetCategoryId,
          was_redirected: categoryId !== targetCategoryId,
          source: 'chips'
        });
      }
    }
  }, [activeCategory, sections, findNearestNonEmptySectionId]);

  // ✅ تحسين البحث مع تقليل التتبع
  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);

    // تنظيف الـ timeout السابق
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (text.length === 0) {
      if (searchQuery.length > 0) {
        trackEvent(AnalyticsEvents.SEARCH_CLEARED, {
          previous_query_length: searchQuery.length
        });
      }
      return;
    }

    // ✅ بحث بعد توقف الكتابة مع تقليل الأحداث
    if (text.length > 2) {
      searchTimeoutRef.current = setTimeout(() => {
        const searchTerm = text.toLowerCase().trim();
        
        // ✅ تتبع فقط إذا كانت النتائج مختلفة
        const hasResults = sections.some(section =>
          section.menu_items?.some(item =>
            item.name.toLowerCase().includes(searchTerm) ||
            (item.description && item.description.toLowerCase().includes(searchTerm))
          )
        );

        trackEvent(AnalyticsEvents.SEARCH_PERFORMED, {
          query_length: text.length,
          has_results: hasResults,
        });

      }, 600); // ✅ زيادة وقت الانتظار
    }
  }, [sections, searchQuery]);

  const handleClearSearch = useCallback(() => {
    if (searchQuery.length > 0) {
      trackEvent(AnalyticsEvents.SEARCH_CLEARED, {
        previous_query_length: searchQuery.length
      });
    }
    setSearchQuery('');
  }, [searchQuery]);

  const handleScroll = useCallback((event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    const PROMO_HEIGHT = promotions.length > 0 ? 240 : 0;
    const HEADER_HEIGHT = (Platform.OS === 'ios' ? 260 : 280) + PROMO_HEIGHT;
    setIsChipsSticky(scrollY > HEADER_HEIGHT);

    // ✅ تتبع التمرير فقط مرة واحدة عند الوصول للعمق
    if (scrollY > 500 && scrollY < 600) {
      trackEvent(AnalyticsEvents.SCROLL_DEPTH, {
        scroll_depth: 'deep'
      });
    }
  }, [promotions.length]);

  const handleNotificationPress = useCallback(() => {
    trackEvent(AnalyticsEvents.NOTIFICATIONS_ACCESSED, {
      has_unread: hasUnread
    });
    router.push('/notifications');
  }, [router, hasUnread]);

  // ✅ دوال مساعدة محسنة
  const fetchFreshData = useCallback(async () => {
    try {
      const [menuResponse, promotionsResponse] = await Promise.all([
        supabase.rpc('get_menu'),
        supabase.from('promotions').select('*').eq('is_active', true).order('display_order'),
      ]);

      if (menuResponse.error) throw menuResponse.error;
      const fetchedSections: CategoryWithItems[] = menuResponse.data || [];
      const fetchedCategories: Category[] = fetchedSections.map(s => ({ id: s.id, name: s.name }));

      setSections(fetchedSections);
      setCategories(fetchedCategories);
      
      // ✅ التخزين بشكل متوازي
      await Promise.all([
        cacheData(CACHE_KEYS.MENU_DATA, fetchedSections),
        cacheData(CACHE_KEYS.CATEGORIES, fetchedCategories)
      ]);

      if (promotionsResponse.error) throw promotionsResponse.error;
      const fetchedPromotions = promotionsResponse.data || [];
      setPromotions(fetchedPromotions);
      await cacheData(CACHE_KEYS.PROMOTIONS, fetchedPromotions);

      // ✅ تحديث وقت المزامنة
      const syncTime = Date.now();
      setLastSyncTime(syncTime);
      await AsyncStorage.setItem(CACHE_KEYS.LAST_SYNC_TIMESTAMP, syncTime.toString());

      trackEvent(AnalyticsEvents.DATA_FETCH_SUCCESS, {
        sections_count: fetchedSections.length,
        promotions_count: fetchedPromotions.length,
      });

    } catch (error) {
      throw error;
    }
  }, []);

  const checkNotifications = useCallback(async (userId: string) => {
    try {
      const { count: unreadCount, error: notificationError } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (!notificationError) {
        setHasUnread((unreadCount ?? 0) > 0);
      }
    } catch (error) {
      console.error("Error checking notifications:", error);
    }
  }, []);

  const handleCacheFallback = useCallback(async () => {
    const [cachedMenu, cachedPromotions, cachedCategories] = await Promise.all([
      getCachedData(CACHE_KEYS.MENU_DATA),
      getCachedData(CACHE_KEYS.PROMOTIONS),
      getCachedData(CACHE_KEYS.CATEGORIES)
    ]);

    if (cachedMenu && cachedPromotions && cachedCategories) {
      setSections(cachedMenu);
      setCategories(cachedCategories);
      setPromotions(cachedPromotions);
      setDataCached({ menu: true, promotions: true, categories: true });

      trackEvent(AnalyticsEvents.CACHE_USED, {
        cache_type: 'full_fallback',
        sections_count: cachedMenu.length,
      });
    }
  }, []);

  // ✅ تحسين الـ loadData مع تقليل الحمل
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

      trackEvent(AnalyticsEvents.DATA_FETCH_STARTED, {
        is_refreshing: isRefreshing,
      });

      // ✅ جلب البيانات المخزنة فقط للتحميل الأولي
      let shouldFetchFromServer = true;
      
      if (!isRefreshing) {
        const [cachedMenu, cachedPromotions, cachedCategories] = await Promise.all([
          getCachedData(CACHE_KEYS.MENU_DATA),
          getCachedData(CACHE_KEYS.PROMOTIONS),
          getCachedData(CACHE_KEYS.CATEGORIES)
        ]);

        if (cachedMenu && cachedPromotions && cachedCategories) {
          setSections(cachedMenu);
          setCategories(cachedCategories);
          setPromotions(cachedPromotions);
          setDataCached({ menu: true, promotions: true, categories: true });
          shouldFetchFromServer = false;

          const lastSync = await AsyncStorage.getItem(CACHE_KEYS.LAST_SYNC_TIMESTAMP);
          const dataAge = Date.now() - (lastSync ? parseInt(lastSync) : Date.now());
          
          trackEvent(AnalyticsEvents.CACHE_USED, {
            cache_type: 'initial_load',
            data_age: dataAge
          });
        }
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
      
      trackEvent(AnalyticsEvents.ERROR_OCCURRED, {
        error_type: 'data_fetch_failed',
        error_message: err instanceof Error ? err.message : 'Unknown error'
      });

      await handleCacheFallback();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchFreshData, checkNotifications, handleCacheFallback]);

  const handleRefreshData = useCallback(async () => {
    trackEvent(AnalyticsEvents.MANUAL_REFRESH, {
      current_data_age: Date.now() - lastSyncTime
    });

    await loadData(true);
  }, [loadData, lastSyncTime]);

  // ✅ تحسين البحث مع caching
  const filteredSections = useMemo(() => {
    if (searchQuery.trim() === '') return sections;

    const cacheKey = searchQuery.toLowerCase().trim();

    if (searchCache[cacheKey]) {
      trackEvent(AnalyticsEvents.SEARCH_CACHE_HIT, {
        query_length: searchQuery.length
      });
      return searchCache[cacheKey];
    }

    const result = sections
      .map(section => ({
        ...section,
        menu_items: section.menu_items?.filter(item =>
          item.name.toLowerCase().includes(cacheKey) ||
          (item.description && item.description.toLowerCase().includes(cacheKey))
        ) || []
      }))
      .filter(section => section.menu_items.length > 0);

    const resultsCount = result.reduce((total, section) =>
      total + (section.menu_items?.length || 0), 0
    );
    
    trackEvent(AnalyticsEvents.SEARCH_RESULTS, {
      results_count: resultsCount,
      sections_with_results: result.length
    });

    if (result.length > 0) {
      setSearchCache(prev => ({
        ...prev,
        [cacheKey]: result
      }));
    }

    return result;
  }, [sections, searchQuery, searchCache]);

  // ✅ العودة للفكرة الأصلية: عرض جميع الأقسام دائماً
  const displaySections = useMemo(() => {
    if (searchQuery.trim() !== '') {
      return filteredSections;
    }
    
    // ✅ دائماً نعرض جميع الأقسام، بغض النظر عن الفئة النشطة
    return sections;
  }, [sections, filteredSections, searchQuery]);

  const listData = useMemo(() => [
    { type: 'header' as const, id: 'main-header' },
    ...(promotions.length > 0 ? [{ type: 'promotions' as const, id: 'promo-carousel' }] : []),
    { type: 'categories' as const, id: 'cat-chips' },
    ...displaySections.map(section => ({ ...section, type: 'section' as const })),
  ], [displaySections, promotions]);

  // ✅ معالج محسن لفشل التمرير
  const handleScrollToIndexFailed = useCallback((info: any) => {
    console.warn('❌ فشل في التمرير للعنصر:', info);
    
    trackEvent(AnalyticsEvents.ERROR_OCCURRED, {
      error_type: 'scroll_to_index_failed',
      index: info.index,
      highestMeasuredFrameIndex: info.highestMeasuredFrameIndex,
      averageItemLength: info.averageItemLength
    });

    // ✅ محاولة بديلة: استخدام scrollToOffset للتمرير التقريبي
    const approximateOffset = info.averageItemLength * Math.max(0, info.index - 1);
    
    setTimeout(() => {
      listRef.current?.scrollToOffset({
        animated: true,
        offset: approximateOffset,
      });
    }, 100);
  }, []);

  // ✅ تحسين scroll to category - العودة للفكرة الأصلية
  useEffect(() => {
    if (activeCategory === 'all' || !listRef.current || sections.length === 0) return;

    const promoSectionExists = promotions.length > 0;
    const categoriesIndex = 1 + (promoSectionExists ? 1 : 0);
    
    // ✅ البحث في sections الأصلية (جميع الأقسام)
    const sectionIndex = sections.findIndex(section => section.id === activeCategory);

    console.log(`🎯 محاولة التمرير إلى القسم: ${activeCategory}, موجود في الفهرس: ${sectionIndex}, إجمالي الأقسام: ${sections.length}`);

    if (sectionIndex !== -1) {
      const targetSection = sections[sectionIndex];
      
      // ✅ التحقق إذا كان القسم فارغاً
      const isEmptySection = !targetSection.menu_items || targetSection.menu_items.length === 0;
      
      if (isEmptySection) {
        console.log(`⚠️ القسم ${targetSection.name} فارغ - إلغاء التمرير`);
        trackEvent('scroll_to_empty_section_attempt', {
          category_id: activeCategory,
          category_name: targetSection.name
        });
        return;
      }

      const targetIndex = categoriesIndex + sectionIndex + 1;
      
      console.log(`🎯 الفهرس المستهدف: ${targetIndex}, عدد العناصر في القائمة: ${listData.length}`);
      
      // ✅ التحقق من صحة الفهرس قبل التمرير
      if (targetIndex >= 0 && targetIndex < listData.length) {
        requestAnimationFrame(() => {
          listRef.current?.scrollToIndex({
            animated: true,
            index: targetIndex,
            viewOffset: chipsHeight
          });
        });
      } else {
        console.warn(`❌ الفهرس ${targetIndex} خارج النطاق (0-${listData.length - 1})`);
        trackEvent(AnalyticsEvents.ERROR_OCCURRED, {
          error_type: 'invalid_scroll_index',
          target_index: targetIndex,
          list_length: listData.length,
          category_id: activeCategory
        });
      }
    } else {
      console.warn(`❌ القسم ${activeCategory} غير موجود في الأقسام`);
    }
  }, [activeCategory, chipsHeight, sections, promotions, listData.length]);

  // ✅ تأثير التحميل الأولي والمزامنة المحسن
  useEffect(() => {
    // ✅ تهيئة التحليلات أولاً
    initializeAnalytics();

    // ✅ تتبع فتح التطبيق
    trackEvent(AnalyticsEvents.APP_OPENED, {
      source: 'cold_start',
      platform: Platform.OS,
    });

    loadData();

    // ✅ تنظيف الموارد
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      cleanupAnalytics();
    };
  }, []);

  // ✅ مزامنة تلقائية مخففة
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading && Date.now() - lastSyncTime > SYNC_INTERVAL) {
        loadData(true);
      }
    }, SYNC_INTERVAL);

    return () => clearInterval(interval);
  }, [loading, lastSyncTime]);

  // ✅ useCallback لـ renderItem محسن
  const renderListItem = useCallback(({ item }: { item: any }) => {
    switch (item.type) {
      case 'header':
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
      
      case 'promotions':
        return <PromotionsCarousel promotions={promotions} />;
      
      case 'categories':
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
              // ✅ إضافة خاصية جديدة للتعامل مع الأقسام الفارغة
              sectionsWithItems={sections.filter(s => s.menu_items && s.menu_items.length > 0).map(s => s.id)}
            />
          </View>
        );
      
      case 'section':
        return <SectionComponent section={item as CategoryWithItems} router={router} />;
      
      default:
        return null;
    }
  }, [
    searchQuery, hasUnread, promotions, categories, activeCategory, isChipsSticky,
    chipsHeight, displaySections, filteredSections,
    handleCategorySelect, handleSearchChange, handleClearSearch, 
    handleNotificationPress, handleRefreshData, router, loading
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
          scrollEventThrottle={32} // ✅ تقليل التكرار
          keyboardDismissMode="on-drag"
          removeClippedSubviews={Platform.OS === 'android'}
          maxToRenderPerBatch={3} // ✅ تقليل العدد
          updateCellsBatchingPeriod={100}
          windowSize={5}
          initialNumToRender={3}
          onScrollToIndexFailed={handleScrollToIndexFailed} // ✅ إضافة معالج الأخطاء المحسن
          renderItem={renderListItem}
          refreshing={refreshing}
          onRefresh={() => {
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
  emptySectionContainer: {
    paddingHorizontal: 20,
    alignItems: 'center',
    paddingVertical: 20,
  },
  noItemsText: {
    color: '#888',
    textAlign: 'left',
    fontSize: 16,
    marginBottom: 8,
  },
  emptySectionHint: {
    color: '#D32F2F',
    textAlign: 'left',
    fontSize: 14,
    fontStyle: 'italic',
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