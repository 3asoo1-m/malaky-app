// مسار الملف: components/CategoryChips.tsx

import React, { memo, useCallback, useMemo, useEffect, useState } from 'react';
import { 
  FlatList, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  Dimensions,
  LayoutAnimation,
  UIManager,
  Platform
} from 'react-native';
import { Category, ActiveCategory } from '@/lib/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { trackEvent, AnalyticsEvents } from '@/lib/analytics';

const { width: screenWidth } = Dimensions.get('window');

// ✅ تفعيل LayoutAnimation لـ Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ✅ مفاتيح التخزين المؤقت
const CACHE_KEYS = {
  CATEGORIES_ORDER: 'categories_order_cache',
  LAST_ACTIVE_CATEGORY: 'last_active_category'
};

type Props = {
  categories: Category[];
  activeCategory: ActiveCategory;
  onCategorySelect: (id: ActiveCategory) => void;
  loading?: boolean;
};

// ✅ 1. مكون Chip منفصل مع memo وتحليلات
const CategoryChip = memo(({ 
  item, 
  isActive, 
  onPress,
  isFirstRender 
}: { 
  item: { id: ActiveCategory; name: string };
  isActive: boolean;
  onPress: (id: ActiveCategory) => void;
  isFirstRender: boolean;
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const handlePress = useCallback(() => {
    // ✅ تأثير ناعم عند الضغط
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    // ✅ تتبع الحدث
    trackEvent(AnalyticsEvents.CATEGORY_SELECTED, {
      category_id: item.id,
      category_name: item.name,
      interaction_type: 'tap'
    });
    
    onPress(item.id);
  }, [item.id, item.name, onPress]);

  const handlePressIn = useCallback(() => {
    setIsPressed(true);
  }, []);

  const handlePressOut = useCallback(() => {
    setIsPressed(false);
  }, []);

  return (
    <TouchableOpacity
      style={[
        styles.chip, 
        isActive && styles.activeChip,
        isPressed && styles.pressedChip,
        isFirstRender && styles.initialRender
      ]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.8}
      delayPressIn={0}
      hitSlop={{ top: 15, bottom: 15, left: 10, right: 10 }}
      disabled={isActive}
    >
      <Text 
        style={[
          styles.text, 
          isActive && styles.activeText,
          isPressed && styles.pressedText
        ]}
        numberOfLines={1}
        ellipsizeMode="tail"
        adjustsFontSizeToFit
        minimumFontScale={0.8}
      >
        {item.name}
      </Text>
      {isActive && <View style={styles.activeIndicator} />}
    </TouchableOpacity>
  );
});

CategoryChip.displayName = 'CategoryChip';

function CategoryChips({ categories, activeCategory, onCategorySelect, loading = false }: Props) {
  const [isFirstRender, setIsFirstRender] = useState(true);
  const [cachedOrder, setCachedOrder] = useState<string[]>([]);

  // ✅ 2. جلب الترتيب المخزن للمستخدم
  useEffect(() => {
    loadCachedOrder();
  }, []);

  const loadCachedOrder = async () => {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEYS.CATEGORIES_ORDER);
      if (cached) {
        setCachedOrder(JSON.parse(cached));
        console.log('✅ Loaded cached categories order:', JSON.parse(cached));
      }
    } catch (error) {
      console.log('❌ Error loading categories order cache:', error);
    }
  };

  // ✅ 3. تخزين الترتيب بناءً على استخدام المستخدم
  const saveCategoryOrder = async (selectedId: string) => {
    try {
      const newOrder = [selectedId, ...cachedOrder.filter(id => id !== selectedId)];
      const limitedOrder = newOrder.slice(0, 10);
      setCachedOrder(limitedOrder);
      await AsyncStorage.setItem(CACHE_KEYS.CATEGORIES_ORDER, JSON.stringify(limitedOrder));
      console.log('💾 Saved category order:', limitedOrder);
    } catch (error) {
      console.log('❌ Error saving categories order:', error);
    }
  };

  // ✅ 4. ترتيب الفئات بناءً على الاستخدام + caching
  const allCategories = useMemo(() => {
    const baseCategories = [{ id: 'all' as const, name: 'الكل' }, ...categories];
    
    if (cachedOrder.length === 0 || loading) return baseCategories;

    // ✅ تطبيق الترتيب الذكي
    const orderedCategories = baseCategories.sort((a, b) => {
      const aIndex = cachedOrder.indexOf(a.id.toString());
      const bIndex = cachedOrder.indexOf(b.id.toString());
      
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      
      return aIndex - bIndex;
    });

    console.log('🔄 Applied smart ordering to categories');
    return orderedCategories;
  }, [categories, cachedOrder, loading]);

  // ✅ 5. تحسين اختيار الفئة مع التخزين المؤقت والتحليلات
  const handleCategorySelect = useCallback((id: ActiveCategory) => {
    console.log(`🎯 Category selected: ${id}`);
    
    // ✅ تأثير حركي ناعم
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    
    // ✅ تخزين آخر فئة نشطة
    AsyncStorage.setItem(CACHE_KEYS.LAST_ACTIVE_CATEGORY, id.toString());
    
    // ✅ تحديث ترتيب الفئات المستخدمة
    if (id !== 'all') {
      saveCategoryOrder(id.toString());
    }
    
    onCategorySelect(id);
  }, [onCategorySelect, cachedOrder]);

  // ✅ 6. استعادة آخر فئة نشطة من cache
  useEffect(() => {
    const restoreLastActiveCategory = async () => {
      try {
        const lastActive = await AsyncStorage.getItem(CACHE_KEYS.LAST_ACTIVE_CATEGORY);
        if (lastActive && lastActive !== 'all') {
          console.log('🔄 Restored last active category:', lastActive);
        }
      } catch (error) {
        console.log('❌ Error restoring last active category:', error);
      }
    };
    
    restoreLastActiveCategory();
  }, []);

  // ✅ 7. إلغاء تأثير first render بعد التحميل
  useEffect(() => {
    if (!loading && isFirstRender) {
      setTimeout(() => {
        setIsFirstRender(false);
        console.log('🎉 Category chips fully rendered');
      }, 300);
    }
  }, [loading, isFirstRender]);

  const renderItem = useCallback(({ item, index }: { item: { id: ActiveCategory; name: string }; index: number }) => (
    <CategoryChip
      item={item}
      isActive={activeCategory === item.id}
      onPress={handleCategorySelect}
      isFirstRender={isFirstRender && index > 5}
    />
  ), [activeCategory, handleCategorySelect, isFirstRender]);

  const keyExtractor = useCallback((item: { id: ActiveCategory; name: string }) => 
    `category_${item.id}`, []);

  // ✅ 8. التمرير التلقائي للفئة النشطة مع cache للposition
  const flatListRef = React.useRef<FlatList>(null);

  useEffect(() => {
    if (!isFirstRender && activeCategory && flatListRef.current) {
      const activeIndex = allCategories.findIndex(cat => cat.id === activeCategory);
      if (activeIndex !== -1) {
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index: activeIndex,
            animated: true,
            viewPosition: 0.5
          });
        }, 100);
      }
    }
  }, [activeCategory, isFirstRender, allCategories]);

  // ✅ 9. معالج للأخطاء في التمرير
  const handleScrollToIndexFailed = useCallback((info: {
    index: number;
    highestMeasuredFrameIndex: number;
    averageItemLength: number;
  }) => {
    setTimeout(() => {
      flatListRef.current?.scrollToIndex({
        index: Math.min(info.index, allCategories.length - 1),
        animated: true,
      });
    }, 50);
  }, [allCategories.length]);

  // ✅ 10. حالة التحميل مع skeleton
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.skeletonChip} />
        <View style={styles.skeletonChip} />
        <View style={styles.skeletonChip} />
        <View style={styles.skeletonChip} />
      </View>
    );
  }

  // ✅ 11. تتبع عرض الفئات
  useEffect(() => {
    if (!loading && allCategories.length > 0) {
      trackEvent(AnalyticsEvents.CATEGORY_VIEWED, {
        categories_count: allCategories.length,
        has_cached_order: cachedOrder.length > 0
      });
    }
  }, [loading, allCategories.length, cachedOrder.length]);

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={allCategories}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.contentContainer}
        initialNumToRender={15}
        maxToRenderPerBatch={15}
        windowSize={10}
        removeClippedSubviews={false}
        getItemLayout={(data, index) => ({
          length: 100,
          offset: 100 * index,
          index,
        })}
        decelerationRate="fast"
        snapToAlignment="center"
        onScrollToIndexFailed={handleScrollToIndexFailed}
        updateCellsBatchingPeriod={100}
        disableVirtualization={false}
        initialScrollIndex={0}
        // ✅ تحسينات أداء إضافية
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
        }}
      />
    </View>
  );
}

export default memo(CategoryChips);

const styles = StyleSheet.create({
  container: {
    height: 75,
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
  },
  contentContainer: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    alignItems: 'center',
  },
  chip: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 25,
    marginHorizontal: 6,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 45,
    minWidth: 70,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    transform: [{ scale: 1 }],
  },
  activeChip: {
    backgroundColor: '#D32128',
    borderColor: '#D32128',
    elevation: 6,
    shadowColor: '#D32128',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    transform: [{ scale: 1.02 }],
  },
  pressedChip: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9,
  },
  initialRender: {
    opacity: 0,
    transform: [{ translateY: 10 }],
  },
  text: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
  },
  activeText: {
    color: '#fff',
    fontWeight: '800',
  },
  pressedText: {
    opacity: 0.8,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -2,
    width: 20,
    height: 3,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  skeletonChip: {
    width: 80,
    height: 45,
    backgroundColor: '#E0E0E0',
    borderRadius: 25,
    marginHorizontal: 6,
  },
});