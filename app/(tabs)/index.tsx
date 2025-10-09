// مسار الملف: app/(tabs)/index.tsx

import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, FlatList, TextInput,
  ActivityIndicator, Image, Platform, Dimensions, Linking,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import MenuItemCard from '@/components/MenuItemCard';
import CategoryChips from '@/components/CategoryChips';
import CustomBottomNav from '@/components/CustomBottomNav';
import { Category, CategoryWithItems, ActiveCategory, Promotion } from '@/lib/types';

const { width: screenWidth } = Dimensions.get('window');

// =================================================================
// ✅✅✅ مكون الإعلانات بالتصميم الجديد ✅✅✅
// =================================================================
const PromotionsCarousel = ({ promotions }: { promotions: Promotion[] }) => {
  const router = useRouter();

  const handlePress = (promotion: Promotion) => {
    if (!promotion.action_type || !promotion.action_value) return;
    switch (promotion.action_type) {
      case 'navigate_to_item':
        router.push(`/item/${promotion.action_value}`);
        break;
      case 'open_url':
        Linking.openURL(promotion.action_value).catch(err => console.error("Couldn't load page", err));
        break;
      default:
        break;
    }
  };

  if (!promotions || promotions.length === 0) {
    return null;
  }

  const CARD_WIDTH = screenWidth * 0.85;
  const CARD_MARGIN = (screenWidth - CARD_WIDTH) / 2;

  return (
    <View style={styles.promoContainer}>
      <FlatList
        data={promotions}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{
          paddingStart: CARD_MARGIN - 10,
          paddingEnd: CARD_MARGIN,
        }}
        snapToInterval={CARD_WIDTH + 10}
        decelerationRate="fast"
        renderItem={({ item }) => (
          // ✅ 1. تغيير بنية البطاقة
          <TouchableOpacity
            style={[styles.promoCard, { width: CARD_WIDTH }]}
            onPress={() => handlePress(item)}
            activeOpacity={0.9}
          >
            {/* حاوية الصورة */}
            <View style={styles.promoImageContainer}>
              <Image source={{ uri: item.image_url }} style={styles.promoImage} />
            </View>
            {/* حاوية النص (الآن أسفل الصورة) */}
            <View style={styles.promoTextContainer}>
              <Text style={styles.promoTitle} numberOfLines={1}>{item.title}</Text>
              {item.description && <Text style={styles.promoDescription} numberOfLines={1}>{item.description}</Text>}
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};


export default function HomeScreen() {
  // ... (كل الكود الخاص بـ HomeScreen يبقى كما هو تمامًا)
  const router = useRouter();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
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
        const [menuResponse, promotionsResponse] = await Promise.all([
          supabase.rpc('get_menu'),
          supabase.from('promotions').select('*').eq('is_active', true).order('display_order')
        ]);

        if (menuResponse.error) throw menuResponse.error;
        const fetchedSections: CategoryWithItems[] = menuResponse.data || [];
        const fetchedCategories: Category[] = fetchedSections.map(s => ({ id: s.id, name: s.name }));
        setSections(fetchedSections);
        setCategories(fetchedCategories);

        if (promotionsResponse.error) throw promotionsResponse.error;
        setPromotions(promotionsResponse.data || []);

      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (activeCategory === 'all' || !listRef.current || sections.length === 0) return;

    // 1. تحديد ما إذا كان قسم الإعلانات موجودًا
    const promoSectionExists = promotions.length > 0;
    
    // 2. حساب الفهرس الأساسي بشكل ديناميكي
    // الفهرس يبدأ من 0. العناصر هي: header, (promotions?), categories, ...sections
    // فهرس قسم categories هو 1 إذا لم تكن هناك إعلانات، و 2 إذا كانت موجودة.
    const categoriesIndex = 1 + (promoSectionExists ? 1 : 0);

    // 3. العثور على فهرس القسم المطلوب ضمن مصفوفة الأقسام فقط
    const sectionIndex = sections.findIndex(section => section.id === activeCategory);

    if (sectionIndex !== -1) {
      // 4. الفهرس النهائي هو فهرس قسم categories + فهرس القسم المطلوب + 1
      const targetIndex = categoriesIndex + sectionIndex + 1;
      
      const offset = chipsHeight;
      listRef.current.scrollToIndex({
        animated: true,
        index: targetIndex,
        viewOffset: offset,
      });
    }
  }, [activeCategory, chipsHeight, sections, promotions]);

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
    ...(promotions.length > 0 ? [{ type: 'promotions' as const, id: 'promo-carousel' }] : []),
    { type: 'categories' as const, id: 'cat-chips' },
    ...filteredSections,
  ], [filteredSections, promotions]);

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
          stickyHeaderIndices={promotions.length > 0 ? [2] : [1]}
          onScroll={(event) => {
            const scrollY = event.nativeEvent.contentOffset.y;
            const PROMO_HEIGHT = promotions.length > 0 ? 240 : 0; // زيادة الارتفاع
            const HEADER_HEIGHT = (Platform.OS === 'ios' ? 260 : 280) + PROMO_HEIGHT;
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
                    <TouchableOpacity 
  style={styles.notificationButton}
  onPress={() => router.push('/notifications')} // ✅ الإضافة هنا
>
  <Ionicons name="notifications-outline" size={28} color="#000" />
  {/* يمكنك لاحقًا إضافة منطق لإظهار النقطة فقط إذا كانت هناك إشعارات غير مقروءة */}
  {/* <View style={styles.notificationDot} /> */}
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

            if (item.type === 'promotions') {
              return <PromotionsCarousel promotions={promotions} />;
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
                      <MenuItemCard
                        item={menuItem}
                        onPress={() => router.push(`/item/${menuItem.id}`)}
                      />
                    )}
                    contentContainerStyle={{ paddingHorizontal: 10, overflow: 'visible',paddingVertical:10}}
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

// ✅✅✅ التنسيقات المحدثة بالكامل للتصميم الجديد ✅✅✅
const styles = StyleSheet.create({
  fullScreen: { flex: 1, backgroundColor: '#F5F5F5' },
  container: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10 },
  logoContainer: { flexDirection: 'row', alignItems: 'center' },
  logoImage: { width: 80, height: 80, resizeMode: 'contain' },
  logoText: { fontFamily: 'Cairo-Bold', fontSize: 18, marginHorizontal: 8, marginTop: 4 },
  notificationButton: { position: 'relative' },
  notificationDot: { position: 'absolute', top: 2, end: 2, width: 10, height: 10, borderRadius: 5, backgroundColor: '#D32F2F', borderWidth: 1.5, borderColor: '#fff' },
  header: { paddingHorizontal: 20, marginTop: 20, alignItems: 'flex-start'},
  headerText: { fontSize: 28, fontWeight: 'bold', color: '#333', textAlign: 'right' },
  searchSection: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 20 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 25, paddingHorizontal: 15, height: 50, elevation: 5 },
  searchInput: { flex: 1, fontSize: 16, marginHorizontal: 5, textAlign: 'right' },
  searchButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#D32F2F', justifyContent: 'center', alignItems: 'center', marginStart: 10 },
  
  // --- تنسيقات الإعلانات بالتصميم الجديد ---
  promoContainer: {
    marginTop: 25,
    marginBottom: -5,
    height: 240, // ✅ زيادة الارتفاع الكلي للحاوية
  },
  promoCard: {
    // العرض يتم تحديده ديناميكيًا
    height: 220, // ✅ زيادة ارتفاع البطاقة
    marginHorizontal: 5,
    borderRadius: 16,
    backgroundColor: '#fff', // خلفية البطاقة
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  promoImageContainer: {
    height: 150, // ✅ تحديد ارتفاع حاوية الصورة
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  promoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover', // ✅ يمكن استخدام 'cover' الآن بأمان
  },
  promoTextContainer: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'flex-end', // ✅ محاذاة النصوص لليمين
  },
  promoTitle: {
    fontSize: 17,
    fontFamily: 'Cairo-Bold',
    color: '#333', // 
  },
  promoDescription: {
    fontSize: 14,
    fontFamily: 'Cairo-Regular',
    color: '#777', // ✅ تغيير لون النص
    marginTop: 2,
  },
  // --- نهاية تنسيقات الإعلانات ---

  categoryChipsContainer: { backgroundColor: '#F5F5F5', paddingVertical: 10 },
  stickyCategoryChipsContainer: { elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3 },
  section: { marginTop: 25, backgroundColor: '#F5F5F5', overflow: 'visible'},
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15, paddingHorizontal: 20, textAlign: 'left' },
  noItemsText: { paddingHorizontal: 20, color: '#888', textAlign: 'left' },
  centered: { padding: 20, alignItems: 'center', marginTop: 50 },
});
