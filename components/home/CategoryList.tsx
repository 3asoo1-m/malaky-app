// components/home/CategoryList.tsx
import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Category } from '@/lib/types';
import { Colors } from '@/styles';

// ✅ الخطوة 1: تعريف نوع موحد للعنصر
type ChipItem = {
  id: number | 'all';
  name: string;
};

interface CategoryListProps {
  categories: Category[];
  selectedCategory: number | 'all';
  onSelectCategory: (id: number | 'all') => void;
}

const CategoryList: React.FC<CategoryListProps> = ({ categories, selectedCategory, onSelectCategory }) => {
  
  // ✅ الخطوة 2: التأكد من أن المصفوفة تستخدم النوع الموحد
  const allCategories: ChipItem[] = [{ id: 'all', name: 'الكل' }, ...categories];

  // ✅ الخطوة 3: استخدام النوع الموحد في دالة العرض
  const renderItem = ({ item }: { item: ChipItem }) => {
    const isSelected = selectedCategory === item.id;
    return (
      <TouchableOpacity
        onPress={() => onSelectCategory(item.id)}
        style={[styles.chip, isSelected ? styles.chipSelected : styles.chipDefault]}
      >
        <Text style={[styles.chipText, isSelected ? styles.chipTextSelected : styles.chipTextDefault]}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>الفئات</Text>
      <FlatList
        data={allCategories}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        inverted // لعرض القائمة من اليمين لليسار
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    paddingHorizontal: 16,
    marginBottom: 16,
    textAlign: 'right',
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  chipDefault: {
    backgroundColor: 'white',
  },
  chipSelected: {
    backgroundColor: Colors.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chipTextDefault: {
    color: Colors.text,
  },
  chipTextSelected: {
    color: 'white',
  },
});

export default CategoryList;
