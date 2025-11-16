import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  RefreshControl,
  SafeAreaView, 
  FlatList
} from 'react-native';
import { Stack } from 'expo-router';
import { Colors } from '@/styles';

// ✅ المكونات المحسنة
import Header from './Header';
import PromotionsCarousel from './PromotionsCarousel';
import CategoryChips from './CategoryChips';
import VirtualizedMenuGrid from './VirtualizedMenuGrid';
import FloatingCartButton from './FloatingCartButton';

// ✅ الهوكات المحسنة
import { useOptimizedMenuData } from '@/hooks/useOptimizedMenuData';

// ✅ أنواع البيانات
interface HomeSection {
  id: string;
  type: 'header' | 'promotions' | 'categories' | 'meals';
  data?: any;
}

const OptimizedHomeScreen = () => {
  // ✅ State مبسط
  const [selectedCategory, setSelectedCategory] = useState<'all' | number>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // ✅ البيانات المحسنة - إصلاح نوع المعلمة
  const { 
    data: meals = [], 
    isLoading, 
    refetch, 
    loadMore,
    hasMore 
  } = useOptimizedMenuData(selectedCategory === 'all' ? 'all' : selectedCategory.toString());

  // ✅ البحث المحسن
  const filteredMeals = useMemo(() => {
    if (!searchQuery.trim()) return meals;
    
    return meals.filter((meal: any) =>
      meal.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meal.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [meals, searchQuery]);

  // ✅ الأقسام المحسنة
  const sections = useMemo((): HomeSection[] => {
    const sectionsList: HomeSection[] = [
      { id: 'header', type: 'header' },
    ];

    if (searchQuery.trim() === '') {
      sectionsList.push(
        { id: 'promotions', type: 'promotions' },
        { id: 'categories', type: 'categories' }
      );
    }

    sectionsList.push({ 
      id: 'meals', 
      type: 'meals', 
      data: { meals: filteredMeals, hasMore, loading: isLoading } 
    });

    return sectionsList;
  }, [searchQuery, filteredMeals, hasMore, isLoading]);

  // ✅ Handlers محسنة
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleCategorySelect = useCallback((categoryId: 'all' | number) => {
    setSelectedCategory(categoryId);
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  // ✅ Render محسن - إصلاح أنواع TypeScript
  const renderSection = useCallback(({ item }: { item: HomeSection }) => {
    switch (item.type) {
      case 'header':
        return (
          <Header
            searchQuery={searchQuery}
            setSearchQuery={handleSearch}
            onClearSearch={handleClearSearch}
          />
        );

      case 'promotions':
        return <PromotionsCarousel />;

      case 'categories':
        return (
          <CategoryChips
            activeCategory={selectedCategory}
            onCategorySelect={handleCategorySelect}
            categories={[]} 
            loading={false}
            sectionsWithItems={[]}
          />
        );

      case 'meals':
        return (
          <VirtualizedMenuGrid
            meals={item.data?.meals || []}
            loading={item.data?.loading}
            onEndReached={item.data?.hasMore ? loadMore : undefined}
          />
        );

      default:
        return null;
    }
  }, [searchQuery, selectedCategory, handleSearch, handleClearSearch, handleCategorySelect, loadMore]);

  // ✅ إصلاح keyExtractor
  const keyExtractor = useCallback((item: HomeSection) => item.id, []);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <FlatList
        data={sections}
        renderItem={renderSection}
        keyExtractor={keyExtractor}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
        initialNumToRender={3} // ✅ تحسين الأداء
        maxToRenderPerBatch={5}
        windowSize={5}
        removeClippedSubviews={true}
      />

      <FloatingCartButton />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
});

export default OptimizedHomeScreen;