// components/home/CategoryList.tsx
import React, { useRef, useEffect } from 'react'; // ✅ 1. استيراد useRef و useEffect
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Category } from '@/lib/types';
import { Colors } from '@/styles';

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
  
  // ✅ 2. إنشاء مرجع للـ FlatList
  const flatListRef = useRef<FlatList<ChipItem>>(null);
  
  const allCategories: ChipItem[] = [{ id: 'all', name: 'الكل' }, ...categories];

  // ✅ 3. استخدام useEffect للتمرير التلقائي
  useEffect(() => {
    // التأكد من وجود المرجع قبل محاولة التمرير
    if (flatListRef.current) {
      // استخدام setTimeout يضمن أن التمرير يحدث بعد اكتمال العرض الأولي
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100); // تأخير بسيط لضمان الأداء
    }
  }, []); // المصفوفة الفارغة تعني أن هذا التأثير سيعمل مرة واحدة فقط عند تحميل المكون

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
    <View style={styles.stickyContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>الفئات</Text>
        <FlatList
          ref={flatListRef} // ✅ 4. ربط المرجع بالـ FlatList
          data={allCategories}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  stickyContainer: {
    backgroundColor: '#FFF',
    zIndex: 10,
    paddingBottom: 10, 
  },
  container: {
    paddingTop: 10,
    paddingBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    paddingHorizontal: 16,
    marginBottom: 16,
    textAlign: 'left',
  },
  listContent: {
    flexDirection: 'row',
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
