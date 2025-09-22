// app/(tabs)/index.tsx

import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  I18nManager,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// استيراد المكونات والأنواع الجديدة الخاصة بالمطعم
import { supabase } from '../../lib/supabase'; // تأكد من أن هذا المسار صحيح
import { Category, MenuItem } from '../../lib/types'; // سنقوم بإنشاء هذا الملف
import MenuItemCard from '../../components/MenuItemCard';

// فرض اتجاه من اليمين لليسار
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

export default function HomeScreen() {
  const router = useRouter();

  // --- حالات خاصة بالمطعم ---
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // --- دالة جلب البيانات من جداول المطعم ---
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. جلب الأقسام (Categories)
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });
      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // 2. جلب عناصر القائمة (Menu Items)
      const { data: menuItemsData, error: menuItemsError } = await supabase
        .from('menu_items')
        .select('*');
      if (menuItemsError) throw menuItemsError;
      setMenuItems(menuItemsData || []);

    } catch (error) {
      console.error('Error loading data:', error);
      // يمكنك إضافة رسالة خطأ للمستخدم هنا
    } finally {
      setLoading(false);
    }
  }, []);

  // --- تحميل البيانات عند فتح الشاشة ---
  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- وظيفة التحديث عند السحب للأسفل ---
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  // --- فلترة عناصر القائمة بناءً على البحث والقسم المختار ---
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      const categoryMatch = activeCategoryId === 'all' || item.category_id === activeCategoryId;
      const searchMatch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return categoryMatch && searchMatch;
    });
  }, [menuItems, activeCategoryId, searchQuery]);

  // --- عرض مؤشر التحميل ---
  if (loading && !refreshing) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#FF6347" /></View>;
  }

  return (
    <View style={styles.container}>
      {/* --- الترويسة --- */}
      <View style={styles.titleHeaderContainer}>
        <View>
          <Text style={styles.title}>أهلاً بك!</Text>
          <Text style={styles.subtitle}>اطلب وجبتك المفضلة</Text>
        </View>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/cart')}>
          <Ionicons name="cart-outline" size={28} color="black" />
        </TouchableOpacity>
      </View>

      {/* --- شريط البحث والفلترة --- */}
      <View style={styles.searchContainer}>
        {/* سنعيد تفعيل زر الفلاتر المتقدمة لاحقاً */}
        {/* <TouchableOpacity style={styles.filterButton}>
          <FontAwesome5 name="sliders-h" size={20} color="black" />
        </TouchableOpacity> */}
        <TextInput
          placeholder="ابحث عن وجبة..."
          placeholderTextColor="#888"
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
      </View>

      {/* --- شرائح الأقسام (Filter Chips) --- */}
      <View style={{ height: 50, marginBottom: 15 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContainer}>
          {/* زر "الكل" */}
          <TouchableOpacity
            style={[styles.chip, activeCategoryId === 'all' && styles.activeChip]}
            onPress={() => setActiveCategoryId('all')}
          >
            <Text style={[styles.chipText, activeCategoryId === 'all' && styles.activeChipText]}>الكل</Text>
          </TouchableOpacity>
          {/* باقي الأقسام من قاعدة البيانات */}
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[styles.chip, activeCategoryId === category.id && styles.activeChip]}
              onPress={() => setActiveCategoryId(category.id)}
            >
              <Text style={[styles.chipText, activeCategoryId === category.id && styles.activeChipText]}>{category.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <Text style={styles.sectionTitle}>قائمة الطعام</Text>

      {/* --- قائمة الوجبات --- */}
      <FlatList
        key={2} // <-- أضف هذا السطر
        data={filteredMenuItems}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        renderItem={({ item }) => (
          <View style={{ width: '48%' }}>
            <MenuItemCard
              item={item}
              onPress={() => {
                console.log('Pressed on:', item.name);
              }}
            />
          </View>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.emptyText}>لا توجد وجبات تطابق بحثك.</Text>}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

// --- التنسيقات (Styles) ---
// لقد قمت بتبسيطها وتعديل الألوان لتناسب هوية مطعم
const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 50, backgroundColor: '#FFF8F0' }, // لون خلفية كريمي فاتح
  titleHeaderContainer: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#333', textAlign: 'right' },
  subtitle: { fontSize: 24, fontWeight: '300', color: '#555', textAlign: 'right' },
  iconButton: { padding: 10 },
  searchContainer: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 15, marginBottom: 20, borderWidth: 1, borderColor: '#EFEFEF' },
  searchInput: { flex: 1, height: 50, fontSize: 16, textAlign: 'right', marginHorizontal: 10 },
  searchIcon: {},
  chipsContainer: { flexDirection: 'row', paddingRight: 5, gap: 10 },
  chip: { backgroundColor: '#FFFFFF', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, borderWidth: 1, borderColor: '#EFEFEF' },
  activeChip: { backgroundColor: '#FF6347', borderColor: '#FF6347' }, // لون برتقالي/أحمر للطعام
  chipText: { color: '#555', fontWeight: '500' },
  activeChipText: { color: '#FFFFFF' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'right', color: '#333' },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#888' },
  // هذا مجرد عنصر نائب مؤقت
  cardPlaceholder: {
    backgroundColor: 'white',
    padding: 20,
    margin: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
});
