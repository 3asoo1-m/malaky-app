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
import { Category, CategoryWithItems, ActiveCategory, Promotion } from '@/lib/types';

const { width: screenWidth } = Dimensions.get('window');

// =================================================================
// ✅ دوال الـ Caching
// =================================================================
const CACHE_KEYS = {
  MENU_DATA: 'menu_data',
  PROMOTIONS: 'promotions_data',
  CATEGORIES: 'categories_data',
  SEARCH_CACHE: 'search_cache'
};

const CACHE_DURATION = 1000 * 60 * 10; // 10 دقائق

const cacheData = async (key: string, data: any) => {
  try {
    const cacheItem = {
      data,
      timestamp: Date.now()
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
      console.log(`🗑️ Cache cleared for key: ${key}`);
    } else {
      await AsyncStorage.multiRemove(Object.values(CACHE_KEYS));
      console.log('🗑️ All cache cleared');
    }
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
  }
};

// =================================================================
// ✅✅✅ مكون الإعلانات بالتصميم الجديد مع التحسينات ✅✅✅
// =================================================================
const PromotionsCarousel = React.memo(({ promotions }: { promotions: Promotion[] }) => {
  const router = useRouter();

  const handlePress = useCallback((promotion: Promotion) => {
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
        <Image 
          source={{ uri: item.image_url }} 
          style={styles.promoImage} 
          resizeMode="cover"
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

  if (!promotions || promotions.length === 0) {
    return null;
  }

  return (
    <View style={styles.promoContainer}>
      <FlatList
        data={promotions}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={keyExtractor}
        contentContainerStyle={{
          paddingStart: CARD_MARGIN - 10,
          paddingEnd: CARD_MARGIN,
        }}
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

// ✅ مكون منفصل للأقسام مع React.memo
const SectionComponent = React.memo(({ section, router }: { section: CategoryWithItems, router: any }) => {
  const renderMenuItem = useCallback(({ item }: { item: any }) => (
    <MenuItemCard
      item={item}
      onPress={() => router.push(`/item/${item.id}`)}
    />
  ), [router]);

  const keyExtractor = useCallback((menuItem: any) => menuItem.id.toString(), []);

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
          contentContainerStyle={{ paddingHorizontal: 10, overflow: 'visible', paddingVertical: 10 }}
          removeClippedSubviews={true}
          maxToRenderPerBatch={3}
          windowSize={3}
          initialNumToRender={3}
        />
      ) : (
        <Text style={styles.noItemsText}>لا توجد وجبات في هذا القسم حالياً.</Text>
      )}
    </View>
  );
});

export default function HomeScreen() {
  const router = useRouter();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [sections, setSections] = useState<CategoryWithItems[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<ActiveCategory>('all');
  const [isChipsSticky, setIsChipsSticky] = useState(false);
  const [chipsHeight, setChipsHeight] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const listRef = useRef<FlatList>(null);
  const [hasUnread, setHasUnread] = useState(false);
  
  // ✅ state للـ caching
  const [searchCache, setSearchCache] = useState<{[query: string]: CategoryWithItems[]}>({});
  const [isDataCached, setDataCached] = useState({ 
    menu: false, 
    promotions: false, 
    categories: false 
  });

  // ✅ useCallback للدوال
  const handleCategorySelect = useCallback((categoryId: ActiveCategory) => {
    setSearchQuery('');
    setActiveCategory(categoryId);
  }, []);

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  const handleScroll = useCallback((event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    const PROMO_HEIGHT = promotions.length > 0 ? 240 : 0;
    const HEADER_HEIGHT = (Platform.OS === 'ios' ? 260 : 280) + PROMO_HEIGHT;
    setIsChipsSticky(scrollY > HEADER_HEIGHT);
  }, [promotions.length]);

  const handleNotificationPress = useCallback(() => {
    router.push('/notifications');
  }, [router]);

  const handleRefreshData = useCallback(async () => {
    console.log('🔄 Manually refreshing data...');
    await clearCache();
    loadData();
  }, []);

  // ✅ تحسين الـ useEffect لتحميل البيانات مع Caching
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");
      
      // ✅ تحقق من وجود بيانات مخزنة محلياً أولاً
      const [cachedMenu, cachedPromotions, cachedCategories] = await Promise.all([
        getCachedData(CACHE_KEYS.MENU_DATA),
        getCachedData(CACHE_KEYS.PROMOTIONS),
        getCachedData(CACHE_KEYS.CATEGORIES)
      ]);

      let shouldFetchFromServer = false;

      if (cachedMenu && cachedPromotions && cachedCategories) {
        // ✅ استخدم البيانات المخزنة
        console.log('✅ Using cached data for initial render');
        setSections(cachedMenu);
        setCategories(cachedCategories);
        setPromotions(cachedPromotions);
        setDataCached({ menu: true, promotions: true, categories: true });
      } else {
        shouldFetchFromServer = true;
        console.log('🌐 Fetching fresh data from server');
      }

      const [menuResponse, promotionsResponse, notificationResponse] = await Promise.all([
        shouldFetchFromServer ? supabase.rpc('get_menu') : Promise.resolve({ data: cachedMenu, error: null }),
        shouldFetchFromServer ? supabase.from('promotions').select('*').eq('is_active', true).order('display_order') : Promise.resolve({ data: cachedPromotions, error: null }),
        supabase.from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false)
      ]);

      if (menuResponse.error) throw menuResponse.error;
      const fetchedSections: CategoryWithItems[] = menuResponse.data || [];
      const fetchedCategories: Category[] = fetchedSections.map(s => ({ 
        id: s.id, 
        name: s.name 
      }));
      
      if (shouldFetchFromServer) {
        setSections(fetchedSections);
        setCategories(fetchedCategories);
        
        // ✅ خزن البيانات بعد جلبها
        await Promise.all([
          cacheData(CACHE_KEYS.MENU_DATA, fetchedSections),
          cacheData(CACHE_KEYS.CATEGORIES, fetchedCategories)
        ]);
      }

      if (promotionsResponse.error) throw promotionsResponse.error;
      const fetchedPromotions = promotionsResponse.data || [];
      
      if (shouldFetchFromServer) {
        setPromotions(fetchedPromotions);
        await cacheData(CACHE_KEYS.PROMOTIONS, fetchedPromotions);
      }

      if (notificationResponse.error) {
        console.error("Error fetching notification status:", notificationResponse.error);
      } else {
        const unreadCount = notificationResponse.count ?? 0;
        setHasUnread(unreadCount > 0);
      }

    } catch (err) {
      console.error("Error loading data:", err);
      // ✅ إذا كان هناك خطأ، حاول استخدام البيانات المخزنة
      const cachedMenu = await getCachedData(CACHE_KEYS.MENU_DATA);
      const cachedPromotions = await getCachedData(CACHE_KEYS.PROMOTIONS);
      const cachedCategories = await getCachedData(CACHE_KEYS.CATEGORIES);
      
      if (cachedMenu && cachedPromotions && cachedCategories) {
        console.log('🔄 Using cached data as fallback due to error');
        setSections(cachedMenu);
        setCategories(cachedCategories);
        setPromotions(cachedPromotions);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ✅ تحسين scroll to category مع caching للحسابات
  useEffect(() => {
    if (activeCategory === 'all' || !listRef.current || sections.length === 0) return;

    const promoSectionExists = promotions.length > 0;
    const categoriesIndex = 1 + (promoSectionExists ? 1 : 0);
    const sectionIndex = sections.findIndex(section => section.id === activeCategory);

    if (sectionIndex !== -1) {
      const targetIndex = categoriesIndex + sectionIndex + 1;
      const offset = chipsHeight;
      
      // ✅ إضافة setTimeout لتحسين الأداء
      setTimeout(() => {
        listRef.current?.scrollToIndex({
          animated: true,
          index: targetIndex,
          viewOffset: offset,
        });
      }, 50);
    }
  }, [activeCategory, chipsHeight, sections, promotions]);

  // ✅ useMemo للبيانات المصفاة مع Search Caching
  const filteredSections = useMemo(() => {
    if (searchQuery.trim() === '') return sections;
    
    // ✅ تحقق من الـ cache أولاً
    const cacheKey = searchQuery.toLowerCase().trim();
    if (searchCache[cacheKey]) {
      console.log(`✅ Using cached search results for: "${searchQuery}"`);
      return searchCache[cacheKey];
    }

    console.log(`🔍 Performing new search for: "${searchQuery}"`);
    const lowercasedQuery = searchQuery.toLowerCase();
    const result = sections
      .map(section => {
        if (!section.menu_items) return { ...section, menu_items: [] };
        const filteredItems = section.menu_items.filter(item =>
          item.name.toLowerCase().includes(lowercasedQuery)
        );
        return { ...section, menu_items: filteredItems };
      })
      .filter(section => section.menu_items && section.menu_items.length > 0);

    // ✅ خزن نتيجة البحث في الـ cache
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
    ...filteredSections,
  ], [filteredSections, promotions]);

  // ✅ useCallback لـ renderItem
  const renderListItem = useCallback(({ item }: { item: any }) => {
    if (item.type === 'header') {
      return (
        <View>
          <View style={styles.topBar}>
            <View style={styles.logoContainer}>
              <Image 
                source={require('@/assets/images/malakylogo.png')} 
                style={styles.logoImage} 
              />
              <Text style={styles.logoText}>الدجاج الملكي بروست</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={handleRefreshData}
              >
                <Ionicons name="refresh" size={24} color="#D32F2F" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.notificationButton}
                onPress={handleNotificationPress}
              >
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
              {searchQuery.length > 0 ? (
                <Ionicons name="close" size={24} color="#fff" />
              ) : (
                <Feather name="arrow-left" size={24} color="#fff" />
              )}
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
          />
        </View>
      );
    }

    const section = item as CategoryWithItems;
    return (
      <SectionComponent 
        section={section} 
        router={router}
      />
    );
  }, [
    searchQuery, 
    hasUnread, 
    promotions, 
    categories, 
    activeCategory, 
    isChipsSticky, 
    chipsHeight, 
    filteredSections,
    handleCategorySelect, 
    handleSearchChange, 
    handleClearSearch, 
    handleNotificationPress,
    handleRefreshData,
    router
  ]);

  // ✅ useCallback للـ keyExtractor
  const keyExtractor = useCallback((item: any) => {
    if (item.type) return item.id;
    return (item as CategoryWithItems).id.toString();
  }, []);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#D32F2F" />
        <Text style={styles.loadingText}>جاري تحميل البيانات...</Text>
        {isDataCached.menu && (
          <Text style={styles.cachedText}>⚡ باستخدام البيانات المخزنة</Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.fullScreen}>
      <SafeAreaView style={styles.container}>
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
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text>لا توجد نتائج تطابق بحثك.</Text>
            </View>
          }
          ListFooterComponent={<View style={{ height: 100 }} />}
        />
      </SafeAreaView>
      <CustomBottomNav />
    </View>
  );
}

// ✅✅✅ التنسيقات المحدثة مع تحسينات الأداء ✅✅✅
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
});