// مسار الملف: app/(tabs)/index.tsx

import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  I18nManager, // I18nManager لا يزال مفيداً للتحقق من بعض الحالات
  Image,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';
import { useRouter } from 'expo-router';

// استيراد المكونات والأنواع
import MenuItemCard from '@/components/MenuItemCard';
import CategoryChips from '@/components/CategoryChips';
import CustomBottomNav from '@/components/CustomBottomNav';
import { Category, CategoryWithItems, ActiveCategory } from '@/lib/types';

export default function HomeScreen() {
  const { user } = useAuth();
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
      const { data: categoriesData } = await supabase.from('categories').select('id, name').order('display_order', { ascending: true });
      setCategories(categoriesData || []);

      const { data: sectionsData } = await supabase.rpc('get_categories_with_items', { item_limit: 7 });
      setSections(sectionsData || []);
      setLoading(false);
    };
    loadData();
  }, [user]);

  useEffect(() => {
    if (activeCategory === 'all' || !listRef.current) return;
    const sectionIndex = sections.findIndex(section => section.id === activeCategory);
    if (sectionIndex !== -1) {
      const targetIndex = sectionIndex + 2;
      listRef.current.scrollToIndex({
        animated: true,
        index: targetIndex,
        viewOffset: chipsHeight,
      });
    }
  }, [activeCategory, chipsHeight, sections]);

  const filteredSections = useMemo(() => {
    if (searchQuery.trim() === '') return sections;
    const lowercasedQuery = searchQuery.toLowerCase();
    return sections
      .map(section => {
        if (!section.menu_items) return section;
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
            const HEADER_HEIGHT = 280; // قد تحتاج لتعديل هذا الرقم بناءً على التصميم النهائي
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
                    <Text style={styles.headerText}>طعامك <Text style={{ color: '#D32F2F' }}>المفضل</Text></Text>
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
                    <TouchableOpacity
                      style={styles.searchButton}
                      onPress={() => setSearchQuery('')}
                    >
                      {searchQuery.length > 0 ? (
                        <Ionicons name="close" size={24} color="#fff" />
                      ) : (
                        // ✅ تم التبسيط: السهم الآن ثابت لأنه في واجهة RTL دائماً
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
                  style={[
                    styles.categoryChipsContainer,
                    isChipsSticky && styles.stickyCategoryChipsContainer
                  ]}
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
                      <MenuItemCard
                        item={menuItem}
                        onPress={() => router.push(`/item/${menuItem.id}`)}
                      />
                    )}
                    contentContainerStyle={{ paddingHorizontal: 12.5 }}
                    
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

// --- التنسيقات بعد التعديل لدعم RTL ---
const styles = StyleSheet.create({
  fullScreen: { flex: 1, backgroundColor: '#F5F5F5' },
  container: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' },
  
  // ✅ تم التعديل: flexDirection: 'row' ستنعكس تلقائياً في RTL
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
  
  // ✅ تم التعديل: خاصية 'end' هي النسخة المنطقية من 'right'
  notificationDot: { 
    position: 'absolute', 
    top: 2, 
    end: 2, // <-- 'right' أصبحت 'end'
    width: 10, 
    height: 10, 
    borderRadius: 5, 
    backgroundColor: '#D32F2F', 
    borderWidth: 1.5, 
    borderColor: '#fff' 
  },
  
  // ✅ تم التعديل: 'flex-end' صحيحة لـ RTL
  header: { 
    paddingHorizontal: 20, 
    marginTop: 20, 
    alignItems: 'flex-end' 
  },
  // ✅ تم التعديل: أزلنا textAlign، سيعتمد على اتجاه اللغة
  headerText: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#333' 
  },
  
  // ✅ تم التعديل: flexDirection: 'row'
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
  // ✅ تم التعديل: أزلنا textAlign
  searchInput: { 
    flex: 1, 
    fontSize: 16, 
    marginHorizontal: 5 
  },
  // ✅✅ أهم تعديل: استخدمنا marginStart
  searchButton: { 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    backgroundColor: '#D32F2F', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginStart: 10 // <-- 'marginRight' أصبحت 'marginStart'
  },
  
  section: { marginTop: 25, backgroundColor: '#F5F5F5' },
  // ✅ تم التعديل: أزلنا textAlign
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#333', 
    marginBottom: 15, 
    paddingHorizontal: 20 
  },
  // ✅ تم التعديل: أزلنا textAlign
  noItemsText: { 
    paddingHorizontal: 20, 
    color: '#888' 
  },
  
  // CustomBottomNav سيتولى تنسيقاته بنفسه
  
  categoryChipsContainer: {
    backgroundColor: '#F5F5F5',
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
