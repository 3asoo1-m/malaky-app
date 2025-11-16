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
import { Category, ActiveCategory, CategoryChipsProps } from '@/lib/types';
import { trackEvent, AnalyticsEvents } from '@/lib/analytics';

const { width: screenWidth } = Dimensions.get('window');

// ✅ تفعيل LayoutAnimation لـ Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ✅ مكون Chip منفصل مع memo
const CategoryChip = memo(({ 
  item, 
  isActive, 
  onPress,
  hasItems = true // ✅ خاصية جديدة للتحقق من وجود العناصر
}: { 
  item: { id: ActiveCategory; name: string };
  isActive: boolean;
  onPress: (id: ActiveCategory) => void;
  hasItems?: boolean; // ✅ خاصية جديدة
}) => {
  const handlePress = useCallback(() => {
    // ✅ إذا لم يكن هناك عناصر، لا تفعل شيئاً
    if (!hasItems && item.id !== 'all') {
      console.log(`⚠️ القسم ${item.name} فارغ - لا يمكن اختياره`);
      return;
    }

    // ✅ تأثير ناعم عند الضغط
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    // ✅ تتبع الحدث
    trackEvent(AnalyticsEvents.CATEGORY_SELECTED, {
      category_id: item.id,
      category_name: item.name,
      has_items: hasItems,
      interaction_type: 'tap'
    });
    
    onPress(item.id);
  }, [item.id, item.name, onPress, hasItems]);

  // ✅ تحديد إذا كان الزر معطلاً
  const isDisabled = !hasItems && item.id !== 'all';

  return (
    <TouchableOpacity
      style={[
        styles.chip, 
        isActive && styles.activeChip,
        isDisabled && styles.disabledChip // ✅ نمط للفئات الفارغة
      ]}
      onPress={handlePress}
      activeOpacity={isDisabled ? 1 : 0.8} // ✅ إزالة التأثير إذا كان معطلاً
      delayPressIn={0}
      hitSlop={{ top: 15, bottom: 15, left: 10, right: 10 }}
      disabled={isActive || isDisabled} // ✅ تعطيل إذا كان نشطاً أو فارغاً
    >
      <Text 
        style={[
          styles.text, 
          isActive && styles.activeText,
          isDisabled && styles.disabledText // ✅ نص للفئات الفارغة
        ]}
        numberOfLines={1}
        ellipsizeMode="tail"
        adjustsFontSizeToFit
        minimumFontScale={0.8}
      >
        {item.name}
        {isDisabled && ' (فارغ)'} {/* ✅ إشارة إلى أن القسم فارغ */}
      </Text>
      {isActive && <View style={styles.activeIndicator} />}
    </TouchableOpacity>
  );
});

CategoryChip.displayName = 'CategoryChip';

function CategoryChips({ 
  categories, 
  activeCategory, 
  onCategorySelect, 
  loading = false,
  sectionsWithItems = [] // ✅ الخاصية الجديدة
}: CategoryChipsProps) { // ✅ استخدام النوع الجديد
  // ✅ الحل: عرض كل الفئات دائماً بدون فلترة
  const allCategories = useMemo(() => {
    return [{ id: 'all' as const, name: 'الكل' }, ...categories];
  }, [categories]);

  // ✅ دالة مساعدة للتحقق من وجود عناصر في الفئة
  const categoryHasItems = useCallback((categoryId: ActiveCategory): boolean => {
    if (categoryId === 'all') return true;
    // ✅ إذا لم يتم توفير البيانات، افترض أن هناك عناصر (لا تخفي الفئات)
    if (sectionsWithItems.length === 0) return true;
    return sectionsWithItems.includes(categoryId);
  }, [sectionsWithItems]);

  // ✅ اختيار الفئة
  const handleCategorySelect = useCallback((id: ActiveCategory) => {
    console.log(`🎯 Category selected: ${id}`);
    
    // ✅ التحقق من وجود عناصر قبل الاختيار
    if (!categoryHasItems(id) && id !== 'all') {
      console.log(`❌ لا يمكن اختيار القسم ${id} لأنه فارغ`);
      trackEvent('empty_category_selection_blocked', {
        category_id: id,
        reason: 'no_items_available'
      });
      return;
    }
    
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    onCategorySelect(id);
  }, [onCategorySelect, categoryHasItems]);

  const renderItem = useCallback(({ item }: { item: { id: ActiveCategory; name: string } }) => (
    <CategoryChip
      item={item}
      isActive={activeCategory === item.id}
      onPress={handleCategorySelect}
      hasItems={categoryHasItems(item.id)} // ✅ تمرير معلومات وجود العناصر
    />
  ), [activeCategory, handleCategorySelect, categoryHasItems]);

  const keyExtractor = useCallback((item: { id: ActiveCategory; name: string }) => 
    `category_${item.id}`, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.skeletonChip} />
        <View style={styles.skeletonChip} />
        <View style={styles.skeletonChip} />
      </View>
    );
  }

  // ✅ إذا لم يكن هناك فئات لعرضها
  if (allCategories.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noCategoriesText}>لا توجد فئات متاحة</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
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
        decelerationRate="fast"
        snapToAlignment="center"
      />
    </View>
  );
}

export default memo(CategoryChips);

// ✅ التنسيقات تبقى كما هي...
const styles = StyleSheet.create({
  container: {
    height: 75,
    justifyContent: 'center',
    backgroundColor: '#fcfcfcff',
    borderRadius: 25,
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
  disabledChip: {
    backgroundColor: '#F5F5F5',
    borderColor: '#CCCCCC',
    opacity: 0.6,
    elevation: 0,
    shadowOpacity: 0,
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
  disabledText: {
    color: '#888888',
    fontStyle: 'italic',
    fontWeight: '500',
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
  noCategoriesText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 14,
    fontStyle: 'italic',
  },
});