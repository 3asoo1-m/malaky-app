// مسار الملف: components/CategoryChips.tsx

import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View, I18nManager } from 'react-native';
import { Category, ActiveCategory } from '@/lib/types';

type Props = {
  categories: Category[];
  activeCategory: ActiveCategory;
  onCategorySelect: (id: ActiveCategory) => void;
};

export default function CategoryChips({ categories, activeCategory, onCategorySelect  }: Props) {
  const allCategories = [{ id: 'all' as const, name: 'الكل' }, ...categories];

  return (
    <View style={styles.container}>
      <FlatList
        data={allCategories}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.chip, activeCategory === item.id && styles.activeChip]}
            onPress={() => onCategorySelect(item.id)}
          >
            <Text style={[styles.text, activeCategory === item.id && styles.activeText]}>
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingHorizontal: 20 }}

        // --- ✅ هذا هو السطر الحاسم ---
        // تأكد من وجود هذه الخاصية
        inverted
      // -----------------------------

      />
    </View>
  );
}

// ... (بقية التنسيقات كما هي)
const styles = StyleSheet.create({
  container: {
    height: 60,
    marginTop: 20,
  },
  chip: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    // ✅ استخدم marginHorizontal ليعمل بشكل صحيح مع inverted
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  activeChip: {
    backgroundColor: '#D32F2F',
    borderColor: '#D32F2F',
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  activeText: {
    color: '#fff',
  },
});
