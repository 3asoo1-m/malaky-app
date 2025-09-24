// مسار الملف: app/(tabs)/index.tsx

import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Image,
  TextInput,
  ActivityIndicator,
  I18nManager, // لاستيراد مدير اتجاه الواجهة
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';

// تفعيل دعم RTL في React Native
I18nManager.forceRTL(true);
I18nManager.allowRTL(true);

// تعريف أنواع البيانات
interface MenuItem {
  id: number;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
}
interface Category {
  id: number;
  name: string;
}
interface CategoryWithItems extends Category {
  menu_items: MenuItem[] | null;
}

// --- مكون بطاقة المنتج (مع تعديلات بسيطة لدعم RTL) ---
const MenuItemCard = ({ item }: { item: MenuItem }) => {
  const router = useRouter();
  const defaultImage = 'https://reactnative.dev/img/tiny_logo.png';

  return (
    <TouchableOpacity style={styles.cardContainer} onPress={( ) => router.push(`/item/${item.id}`)}>
      <View style={styles.heartIconContainer}>
        <Ionicons name="heart-outline" size={20} color="#E53935" />
      </View>
      <Image source={{ uri: item.image_url || defaultImage }} style={styles.cardImage} />
      <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.cardSubtitle} numberOfLines={2}>{item.description || ' '}</Text>
      <Text style={styles.cardPrice}>Rs. {item.price.toFixed(1)}</Text>
    </TouchableOpacity>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [sections, setSections] = useState<CategoryWithItems[]>([]); // لتخزين الأقسام مع منتجاتها
  const [categories, setCategories] = useState<Category[]>([]); // لتخزين الفئات (الأصناف)
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<number | 'all'>('all'); // الفئة النشطة

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      // جلب جميع الفئات لعرضها في الفلاتر
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name');
      
      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
      } else {
        setCategories(categoriesData || []);
      }

      // جلب الأقسام مع منتجاتها
      const { data: sectionsData, error: sectionsError } = await supabase.rpc('get_categories_with_items', {
        item_limit: 7,
      });

      if (sectionsError) {
        console.error('Error fetching sections with items:', sectionsError);
        setSections([]);
      } else {
        setSections(sectionsData || []);
      }
      
      setLoading(false);
    };
    loadData();
  }, [user]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' }}>
        <ActivityIndicator size="large" color="#D32F2F" />
      </View>
    );
  }

  return (
    <View style={styles.fullScreen}>
      <SafeAreaView style={styles.container}>
        {/* استخدمنا `FlatList` رئيسية لعرض الأقسام عمودياً */}
        <FlatList
          data={sections}
          keyExtractor={(section) => section.id.toString()}
          ListHeaderComponent={
            <>
              {/* --- الشريط العلوي --- */}
              <View style={styles.topBar}>
                <View style={styles.logoContainer}>
                  <MaterialCommunityIcons name="fire" size={32} color="#D32F2F" />
                  <Text style={styles.logoText}>KARTIK</Text>
                </View>
                <TouchableOpacity style={styles.notificationButton}>
                  <Ionicons name="notifications-outline" size={28} color="#000" />
                  <View style={styles.notificationDot} />
                </TouchableOpacity>
              </View>

              {/* --- العنوان الرئيسي --- */}
              <View style={styles.header}>
                <Text style={styles.headerText}>اختر</Text>
                <Text style={styles.headerText}>
                  طعامك <Text style={{ color: '#D32F2F' }}>المفضل</Text>
                </Text>
              </View>

              {/* --- شريط البحث --- */}
              <View style={styles.searchSection}>
                <View style={styles.searchBar}>
                  <Feather name="search" size={22} color="#888" style={{ marginLeft: 10 }} />
                  <TextInput placeholder="ابحث..." style={styles.searchInput} placeholderTextColor="#888" />
                </View>
                <TouchableOpacity style={styles.searchButton}>
                  <Feather name="arrow-left" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* --- فلاتر الفئات (من Supabase) --- */}
              <View style={{ height: 50, marginTop: 20 }}>
                <FlatList
                  data={[{ id: 'all', name: 'الكل' }, ...categories]}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.categoryChip, activeCategory === item.id && styles.activeCategoryChip]}
                      onPress={() => setActiveCategory(item.id)}
                    >
                      <Text style={[styles.categoryText, activeCategory === item.id && styles.activeCategoryText]}>
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  )}
                  contentContainerStyle={{ paddingHorizontal: 20 }}
                  inverted // لعكس اتجاه القائمة الأفقية في RTL
                />
              </View>
            </>
          }
          renderItem={({ item: section }) => (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{section.name}</Text>
              {section.menu_items && section.menu_items.length > 0 ? (
                <FlatList
                  data={section.menu_items}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => <MenuItemCard item={item} />}
                  contentContainerStyle={{ paddingHorizontal: 20 }}
                  inverted // لعكس اتجاه القائمة الأفقية في RTL
                />
              ) : (
                <Text style={styles.noItemsText}>لا توجد وجبات في هذا القسم حالياً.</Text>
              )}
            </View>
          )}
          ListFooterComponent={<View style={{ height: 100 }} />} // مساحة للشريط السفلي
        />
      </SafeAreaView>

      {/* --- شريط التنقل السفلي --- */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navButton}>
          <Ionicons name="home" size={28} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton}>
          <Ionicons name="person-outline" size={28} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton}>
          <Ionicons name="location-outline" size={28} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton}>
          <Ionicons name="notifications-outline" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// --- التنسيقات المعدلة لدعم RTL ---
const styles = StyleSheet.create({
  fullScreen: { flex: 1, backgroundColor: '#F5F5F5' },
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row-reverse', // RTL
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  logoContainer: {
    flexDirection: 'row-reverse', // RTL
    alignItems: 'center',
  },
  logoText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginRight: 8, // RTL
  },
  notificationButton: { position: 'relative' },
  notificationDot: {
    position: 'absolute',
    top: 2,
    right: 2,
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
    alignItems: 'flex-end', // RTL
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right', // RTL
  },
  searchSection: {
    flexDirection: 'row-reverse', // RTL
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row-reverse', // RTL
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 50,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    textAlign: 'right', // RTL
  },
  searchButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#D32F2F',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10, // RTL
  },
  categoryChip: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginLeft: 10, // RTL
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  activeCategoryChip: {
    backgroundColor: '#D32F2F',
    borderColor: '#D32F2F',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  activeCategoryText: {
    color: '#fff',
  },
  section: {
    marginTop: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    paddingHorizontal: 20,
    textAlign: 'right', // RTL
  },
  cardContainer: {
    width: 160,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 10,
    marginLeft: 15, // RTL
    elevation: 5,
    alignItems: 'center',
    position: 'relative',
  },
  heartIconContainer: {
    position: 'absolute',
    top: 10,
    left: 10, // RTL
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 15,
    padding: 4,
  },
  cardImage: {
    width: 120,
    height: 100,
    borderRadius: 10,
    resizeMode: 'contain',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
    textAlign: 'center',
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  noItemsText: {
    paddingHorizontal: 20,
    textAlign: 'right',
    color: '#888',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 85,
    backgroundColor: '#C62828',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingBottom: 20,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 10,
  },
  navButton: {
    padding: 10,
  },
});
