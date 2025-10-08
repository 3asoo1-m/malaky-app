// مسار الملف: app/(tabs)/index.tsx

import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

// استيراد المكونات والأنواع المحدثة
import MenuItemCard from '@/components/MenuItemCard';
import CategoryChips from '@/components/CategoryChips';
import CustomBottomNav from '@/components/CustomBottomNav';
import { Category, CategoryWithItems, ActiveCategory } from '@/lib/types';

export default function HomeScreen() {
  const router = useRouter();
  const [sections, setSections] = useState<CategoryWithItems[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<ActiveCategory>('all');
  const [isChipsSticky, setIsChipsSticky] = useState(false);
  const [chipsHeight, setChipsHeight] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const listRef = useRef<FlatList>(null);

  const handleCategorySelect = (categoryId: ActiveCategory) => {
    setSearchQuery('');
    setActiveCategory(categoryId);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // استدعاء الدالة الجديدة لجلب القائمة الكاملة
        const { data, error } = await supabase.rpc('get_menu');
        
        if (error) {
          throw error;
        }

        const fetchedSections: CategoryWithItems[] = data || [];
        
        // استخلاص الأصناف من البيانات التي تم جلبها
        const fetchedCategories: Category[] = fetchedSections.map(s => ({ id: s.id, name: s.name }));

        setSections(fetchedSections);
        setCategories(fetchedCategories);

      } catch (err) {
        console.error("Error loading menu data:", err);
        // يمكنك إضافة رسالة خطأ للمستخدم هنا
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

useEffect(() => {
  if (activeCategory === 'all' || !listRef.current || sections.length === 0) return;

  const sectionIndex = sections.findIndex(section => section.id === activeCategory);

  if (sectionIndex !== -1) {
    const targetIndex = sectionIndex + 2;
    
    // ✅ الحل: حساب الـ offset بشكل ثابت.
    // الفكرة هي أننا نريد دائمًا أن يكون القسم أسفل شريط الفلاتر.
    // لذلك، الـ offset هو دائمًا ارتفاع شريط الفلاتر.
    const offset = chipsHeight;

    listRef.current.scrollToIndex({
      animated: true,
      index: targetIndex,
      viewOffset: offset, // ✅ استخدام قيمة ثابتة للـ offset
    });
  }
  // ✅ إزالة isChipsSticky من مصفوفة الاعتمادات
}, [activeCategory, chipsHeight, sections]);

  const filteredSections = useMemo(() => {
    if (searchQuery.trim() === '') return sections;
    
    const lowercasedQuery = searchQuery.toLowerCase();
    
    return sections
      .map(section => {
        if (!section.menu_items) return { ...section, menu_items: [] };
        
        const filteredItems = section.menu_items.filter(item =>
          item.name.toLowerCase().includes(lowercasedQuery)
        );
        return { ...section, menu_items: filteredItems };
      })
      .filter(section => section.menu_items && section.menu_items.length > 0);
  }, [sections, searchQuery]);

  const listData = useMemo(() => [
    { type: 'header' as const, id: 'main-header' },
    { type: 'categories' as const, id: 'cat-chips' },
    ...filteredSections,
  ], [filteredSections]);

  if (loading) {
    return <View style={styles.loader}><ActivityIndicator size="large" color="#D32F2F" /></View>;
  }

  return (
    <View style={styles.fullScreen}>
      <SafeAreaView style={styles.container}>
        <FlatList
          ref={listRef}
          data={listData}
          keyExtractor={(item) => item.id.toString()}
          stickyHeaderIndices={[1]}
          onScroll={(event) => {
            const scrollY = event.nativeEvent.contentOffset.y;
            const HEADER_HEIGHT = Platform.OS === 'ios' ? 260 : 280;
            setIsChipsSticky(scrollY > HEADER_HEIGHT);
          }}
          scrollEventThrottle={16}
          keyboardDismissMode="on-drag"
          renderItem={({ item }) => {
            if (item.type === 'header') {
              return (
                <View>
                  <View style={styles.topBar}>
                    <View style={styles.logoContainer}>
                      <Image source={require('@/assets/images/malakylogo.png')} style={styles.logoImage} />
                      <Text style={styles.logoText}>الدجاج الملكي بروست</Text>
                    </View>
                    <TouchableOpacity style={styles.notificationButton}>
                      <Ionicons name="notifications-outline" size={28} color="#000" />
                      <View style={styles.notificationDot} />
                    </TouchableOpacity>
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
                        onChangeText={setSearchQuery}
                      />
                    </View>
                    <TouchableOpacity style={styles.searchButton} onPress={() => setSearchQuery('')}>
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
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{section.name}</Text>
                {section.menu_items && section.menu_items.length > 0 ? (
                  <FlatList
                    data={section.menu_items}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(menuItem) => menuItem.id.toString()}
                    renderItem={({ item: menuItem }) => (
                      // داخل ملف app/(tabs)/index.tsx

<MenuItemCard
  // ✅✅✅ الحل: تمرير الكائن 'menuItem' بالكامل تحت خاصية 'item' ✅✅✅
  item={menuItem}
  onPress={() => router.push(`/item/${menuItem.id}`)}
/>

                    )}
                    contentContainerStyle={{ paddingHorizontal: 20 }}
                  />
                ) : (
                  <Text style={styles.noItemsText}>لا توجد وجبات في هذا القسم حالياً.</Text>
                )}
              </View>
            );
          }}
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

// التنسيقات تبقى كما هي
const styles = StyleSheet.create({
  fullScreen: { flex: 1, backgroundColor: '#F5F5F5' },
  container: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' },
  topBar: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: 10 
  },
  logoContainer: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  logoImage: { width: 80, height: 80, resizeMode: 'contain' },
  logoText: { fontFamily: 'Cairo-Bold', fontSize: 18, marginHorizontal: 8, marginTop: 4 },
  notificationButton: { position: 'relative' },
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
  },
  headerText: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#333', 
    textAlign: 'right',
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
    textAlign: 'right',
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
  section: { marginTop: 25, backgroundColor: '#F5F5F5' },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#333', 
    marginBottom: 15, 
    paddingHorizontal: 20,
    textAlign: 'right',
  },
  noItemsText: { 
    paddingHorizontal: 20, 
    color: '#888',
    textAlign: 'right',
  },
  categoryChipsContainer: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 10,
  },
  stickyCategoryChipsContainer: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  centered: {
    padding: 20,
    alignItems: 'center',
    marginTop: 50,
  },
});
