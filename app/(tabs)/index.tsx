// مسار الملف: app/(tabs)/index.tsx

// 1. ✅ استيراد useRef
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
  I18nManager,
  Image,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';
import { useRouter } from 'expo-router';

// استيراد المكونات والأنواع
import MenuItemCard from '@/components/MenuItemCard';
import CategoryChips from '@/components/CategoryChips';
import { Category, CategoryWithItems, ActiveCategory } from '@/lib/types';

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [sections, setSections] = useState<CategoryWithItems[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<ActiveCategory>('all');
  const [isChipsSticky, setIsChipsSticky] = useState(false);

  // 2. ✅ إنشاء مرجع للـ FlatList
  const listRef = useRef<FlatList>(null);

  // --- جلب البيانات ---
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

  // 3. ✅ إضافة useEffect لتفعيل التمرير التلقائي
  useEffect(() => {
    // لا تفعل شيئًا إذا كانت الفئة هي "الكل" أو إذا لم يكن المرجع جاهزًا
    if (activeCategory === 'all' || !listRef.current) {
      return;
    }

    // ابحث عن فهرس القسم المطلوب في مصفوفة `sections`
    const sectionIndex = sections.findIndex(section => section.id === activeCategory);

    // إذا تم العثور على القسم
    if (sectionIndex !== -1) {
      // الفهرس الفعلي في `listData` = فهرس القسم + 2 (لأن لدينا الهيدر والفئات قبله)
      const targetIndex = sectionIndex + 1;

      listRef.current.scrollToIndex({
        animated: true,
        index: targetIndex,
        viewPosition: 0, // 0 = اجعل بداية القسم في أعلى منطقة العرض المتاحة
      });
    }
  }, [activeCategory]); // يعتمد فقط على `activeCategory`

  // --- إنشاء قائمة بيانات مدمجة ---
  const listData = useMemo(() => {
    return [
      { type: 'header' as const, id: 'main-header' },
      { type: 'categories' as const, id: 'cat-chips' },
      ...sections,
    ];
  }, [sections]);

  if (loading) {
    return <View style={styles.loader}><ActivityIndicator size="large" color="#D32F2F" /></View>;
  }

  return (
    <View style={styles.fullScreen}>
      <SafeAreaView style={styles.container}>
        <FlatList
          // 4. ✅ ربط المرجع بالـ FlatList
          ref={listRef}
          data={listData}
          keyExtractor={(item) => item.id.toString()}
          stickyHeaderIndices={[1]}
          onScroll={(event) => {
            const scrollY = event.nativeEvent.contentOffset.y;
            const HEADER_HEIGHT = 280; 
            setIsChipsSticky(scrollY > HEADER_HEIGHT);
          }}
          scrollEventThrottle={16}
          renderItem={({ item }) => {
            // ... (بقية renderItem تبقى كما هي تمامًا)
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
                      <TextInput placeholder="ابحث..." style={styles.searchInput} placeholderTextColor="#888" />
                    </View>
                    <TouchableOpacity style={styles.searchButton}>
                      <Feather name={I18nManager.isRTL ? 'arrow-right' : 'arrow-left'} size={24} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }

            if (item.type === 'categories') {
              return (
                <View style={[
                  styles.categoryChipsContainer,
                  isChipsSticky && styles.stickyCategoryChipsContainer
                ]}>
                  <CategoryChips
                    categories={categories}
                    activeCategory={activeCategory}
                    setActiveCategory={setActiveCategory}
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
                    inverted
                  />
                ) : (
                  <Text style={styles.noItemsText}>لا توجد وجبات في هذا القسم حالياً.</Text>
                )}
              </View>
            );
          }}
          ListFooterComponent={<View style={{ height: 100 }} />}
        />
      </SafeAreaView>
      {/* شريط التنقل السفلي */}
      <View style={styles.bottomNav}>
         <TouchableOpacity style={styles.navButton}><Ionicons name="home" size={28} color="#fff" /></TouchableOpacity>
         <TouchableOpacity style={styles.navButton}><Ionicons name="person-outline" size={28} color="#fff" /></TouchableOpacity>
         <TouchableOpacity style={styles.navButton}><Ionicons name="location-outline" size={28} color="#fff" /></TouchableOpacity>
         <TouchableOpacity style={styles.navButton}><Ionicons name="notifications-outline" size={28} color="#fff" /></TouchableOpacity>
      </View>
    </View>
  );
}

// --- التنسيقات (تبقى كما هي) ---
const styles = StyleSheet.create({
  fullScreen: { flex: 1, backgroundColor: '#F5F5F5' },
  container: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' },
  topBar: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10 },
  logoContainer: { flexDirection: 'row-reverse', alignItems: 'center' },
  logoImage: { width: 80, height: 80, resizeMode: 'contain' },
  logoText: { fontFamily: 'Cairo-Bold', fontSize: 18, marginHorizontal: 8, marginTop: 4 },
  notificationButton: { position: 'relative' },
  notificationDot: { position: 'absolute', top: 2, right: 2, width: 10, height: 10, borderRadius: 5, backgroundColor: '#D32F2F', borderWidth: 1.5, borderColor: '#fff' },
  header: { paddingHorizontal: 20, marginTop: 20, alignItems: 'flex-end' },
  headerText: { fontSize: 28, fontWeight: 'bold', color: '#333', textAlign: 'right' },
  searchSection: { flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 20, marginTop: 20 },
  searchBar: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#fff', borderRadius: 25, paddingHorizontal: 15, height: 50, elevation: 5 },
  searchInput: { flex: 1, fontSize: 16, textAlign: 'right', marginHorizontal: 5 },
  searchButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#D32F2F', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  section: { marginTop: 25, backgroundColor: '#F5F5F5' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15, paddingHorizontal: 20, textAlign: 'right' },
  noItemsText: { paddingHorizontal: 20, textAlign: 'right', color: '#888' },
  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', height: 85, backgroundColor: '#C62828', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingBottom: 20, position: 'absolute', bottom: 0, left: 0, right: 0 },
  navButton: { padding: 10 },
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
});
