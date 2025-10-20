// مسار الملف: components/CategoryChips.tsx

import React, { memo, useCallback, useMemo } from 'react';
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
import { trackEvent, AnalyticsEvents } from '@/lib/analytics';

const { width: screenWidth } = Dimensions.get('window');

// ✅ تفعيل LayoutAnimation لـ Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = {
  categories: Category[];
  activeCategory: ActiveCategory;
  onCategorySelect: (id: ActiveCategory) => void;
  loading?: boolean;
};

// ✅ مكون Chip منفصل مع memo
const CategoryChip = memo(({ 
  item, 
  isActive, 
  onPress 
}: { 
  item: { id: ActiveCategory; name: string };
  isActive: boolean;
  onPress: (id: ActiveCategory) => void;
}) => {
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

  return (
    <TouchableOpacity
      style={[styles.chip, isActive && styles.activeChip]}
      onPress={handlePress}
      activeOpacity={0.8}
      delayPressIn={0}
      hitSlop={{ top: 15, bottom: 15, left: 10, right: 10 }}
      disabled={isActive}
    >
      <Text 
        style={[styles.text, isActive && styles.activeText]}
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
  // ✅ ترتيب ثابت - "الكل" أولاً ثم باقي الفئات كما تأتي من السيرفر
  const allCategories = useMemo(() => 
    [{ id: 'all' as const, name: 'الكل' }, ...categories],
    [categories]
  );

  // ✅ اختيار الفئة مع التتبع فقط
  const handleCategorySelect = useCallback((id: ActiveCategory) => {
    console.log(`🎯 Category selected: ${id}`);
    
    // ✅ تأثير حركي ناعم
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    
    onCategorySelect(id);
  }, [onCategorySelect]);

  const renderItem = useCallback(({ item }: { item: { id: ActiveCategory; name: string } }) => (
    <CategoryChip
      item={item}
      isActive={activeCategory === item.id}
      onPress={handleCategorySelect}
    />
  ), [activeCategory, handleCategorySelect]);

  const keyExtractor = useCallback((item: { id: ActiveCategory; name: string }) => 
    `category_${item.id}`, []);

  // ✅ التمرير التلقائي للفئة النشطة
  const flatListRef = React.useRef<FlatList>(null);

  React.useEffect(() => {
    if (activeCategory && flatListRef.current) {
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
  }, [activeCategory, allCategories]);

  // ✅ معالج للأخطاء في التمرير
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

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.skeletonChip} />
        <View style={styles.skeletonChip} />
        <View style={styles.skeletonChip} />
      </View>
    );
  }

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
  },
  activeChip: {
    backgroundColor: '#D32128',
    borderColor: '#D32128',
    elevation: 6,
    shadowColor: '#D32128',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
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