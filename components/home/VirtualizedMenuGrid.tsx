import React, { memo, useCallback } from 'react';
import { FlatList, ActivityIndicator, Text, View, StyleSheet } from 'react-native';
import { MenuItem } from '@/lib/types';
import MealCard from './MealCard';
import { Colors } from '@/styles';

interface VirtualizedMenuGridProps {
  meals: MenuItem[];
  loading?: boolean;
  onEndReached?: () => void;
}

const EmptyState = memo(() => (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyText}>لا توجد وجبات متاحة</Text>
  </View>
));

const LoadingFooter = memo(() => (
  <View style={styles.footerContainer}>
    <ActivityIndicator size="small" color={Colors.primary} />
    <Text style={styles.loadingText}>جاري تحميل المزيد...</Text>
  </View>
));

const VirtualizedMenuGrid = memo(({ meals, loading, onEndReached }: VirtualizedMenuGridProps) => {
  const renderItem = useCallback(({ item }: { item: MenuItem }) => (
    <View style={styles.cardWrapper}>
      <MealCard meal={item} />
    </View>
  ), []);

  const keyExtractor = useCallback((item: MenuItem) => item.id.toString(), []);

  return (
    <View style={styles.container}>
      <FlatList
        data={meals}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={2}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={EmptyState}
        ListFooterComponent={loading ? LoadingFooter : null}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        initialNumToRender={8}
        maxToRenderPerBatch={10}
        windowSize={5}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.contentContainer}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 400,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  cardWrapper: {
    flex: 0.5, // ✅ مهم لـ numColumns
    margin: 6,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    minHeight: 200,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  footerContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: Colors.textSecondary,
  },
});

export default VirtualizedMenuGrid;