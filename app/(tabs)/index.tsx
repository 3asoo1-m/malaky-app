// مسار الملف: app/(tabs)/index.tsx

import React, { useEffect, useState } from 'react';
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


// ✅ استيراد المكونات المفصولة والأنواع المركزية
import MenuItemCard from '@/components/MenuItemCard';
import CategoryChips from '@/components/CategoryChips';
import { Category, CategoryWithItems, ActiveCategory } from '@/lib/types';

export default function HomeScreen() {
  const { user } = useAuth();
  const [sections, setSections] = useState<CategoryWithItems[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<ActiveCategory>('all');
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      const { data: categoriesData, error: catError } = await supabase.from('categories').select('id, name');
      if (catError) console.error(catError);
      else setCategories(categoriesData || []);

      const { data: sectionsData, error: secError } = await supabase.rpc('get_categories_with_items', { item_limit: 7 });
      if (secError) console.error(secError);
      else setSections(sectionsData || []);

      setLoading(false);
    };
    loadData();
  }, [user]);

  if (loading) {
    return <View style={styles.loader}><ActivityIndicator size="large" color="#D32F2F" /></View>;
  }

  return (
    <View style={styles.fullScreen}>
      <SafeAreaView style={styles.container}>
        <FlatList
          data={sections}
          keyExtractor={(section) => section.id.toString()}
          ListHeaderComponent={
            <>
              {/* الهيدر والبحث (يمكن فصلهما لاحقًا إذا لزم الأمر) */}
              <View style={styles.topBar}>
                <View style={styles.logoContainer}>
                  {/* استبدال الأيقونة بمكون Image */}
                  <Image
                    source={require('@/assets/images/malakylogo.png')}
                    style={styles.logoImage}
                  />
                  <Text style={styles.logoText}>الدجاج الملكي بروست</Text></View>
                <TouchableOpacity style={styles.notificationButton}><Ionicons name="notifications-outline" size={28} color="#000" /><View style={styles.notificationDot} /></TouchableOpacity>
              </View>
              <View style={styles.header}>
                <Text style={styles.headerText}>اختر</Text>
                <Text style={styles.headerText}>طعامك <Text style={{ color: '#D32F2F' }}>المفضل</Text></Text>
              </View>
              <View style={styles.searchSection}>
                <View style={styles.searchBar}><Feather name="search" size={22} color="#888" /><TextInput placeholder="ابحث..." style={styles.searchInput} placeholderTextColor="#888" /></View>
                <TouchableOpacity style={styles.searchButton}><Feather name={I18nManager.isRTL ? 'arrow-right' : 'arrow-left'} size={24} color="#fff" /></TouchableOpacity>
              </View>

              {/* ✅ استخدام مكون الفلاتر المفصول */}
              <CategoryChips
                categories={categories}
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
              />
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
                  renderItem={({ item }) => <MenuItemCard
                    item={item}
                    onPress={() => router.push(`/item/${item.id}`)}
                  />}
                  contentContainerStyle={{ paddingHorizontal: 12.5 }}
                  inverted
                />
              ) : (
                <Text style={styles.noItemsText}>لا توجد وجبات في هذا القسم حالياً.</Text>
              )}
            </View>
          )}
          ListFooterComponent={<View style={{ height: 100 }} />}
        />
      </SafeAreaView>
      {/* شريط التنقل السفلي */}
      <View style={styles.bottomNav}><TouchableOpacity style={styles.navButton}><Ionicons name="home" size={28} color="#fff" /></TouchableOpacity><TouchableOpacity style={styles.navButton}><Ionicons name="person-outline" size={28} color="#fff" /></TouchableOpacity><TouchableOpacity style={styles.navButton}><Ionicons name="location-outline" size={28} color="#fff" /></TouchableOpacity><TouchableOpacity style={styles.navButton}><Ionicons name="notifications-outline" size={28} color="#fff" /></TouchableOpacity></View>
    </View>
  );
}

// التنسيقات المتبقية خاصة بالشاشة الرئيسية فقط
const styles = StyleSheet.create({
  fullScreen: { flex: 1, backgroundColor: '#F5F5F5' },
  container: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' },
  topBar: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10 },
  logoContainer: { flexDirection: 'row-reverse', alignItems: 'center' },
  logoText: {
    fontWeight: 'bold', // يمكنك إزالة هذا إذا الخط يحتوي وزنه الخاص
    fontSize: 18,       // الحجم الافتراضي، يمكن تغييره حسب رغبتك
    marginHorizontal: 8,
    fontFamily: 'Cairo-Bold', // الخط المخصص
    marginTop: 4,              // خفضه قليلًا
  }, notificationButton: { position: 'relative' },
  notificationDot: { position: 'absolute', top: 2, right: 2, width: 10, height: 10, borderRadius: 5, backgroundColor: '#D32F2F', borderWidth: 1.5, borderColor: '#fff' },
  header: { paddingHorizontal: 20, marginTop: 20, alignItems: 'flex-end' },
  headerText: { fontSize: 28, fontWeight: 'bold', color: '#333', textAlign: 'right' },
  searchSection: { flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 20, marginTop: 20 },
  searchBar: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#fff', borderRadius: 25, paddingHorizontal: 15, height: 50, elevation: 5 },
  searchInput: { flex: 1, fontSize: 16, textAlign: 'right', marginHorizontal: 5 },
  searchButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#D32F2F', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  section: { marginTop: 25 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15, paddingHorizontal: 20, textAlign: 'right' },
  noItemsText: { paddingHorizontal: 20, textAlign: 'right', color: '#888' },
  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', height: 85, backgroundColor: '#C62828', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingBottom: 20, position: 'absolute', bottom: 0, left: 0, right: 0 },
  navButton: { padding: 10 },
  logoImage: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  }
});
