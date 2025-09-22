// مسار الملف: app/(tabs)/index.tsx

import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SectionList,
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
} from 'react-native';

import MenuItemCard from '@/components/MenuItemCard';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';
import FeaturedItemCard from '@/components/FeaturedItemCard';

interface MenuItem { id: number; name: string; description: string | null; price: number; image_url: string | null; }
interface CategoryWithItems { id: number; name: string; menu_items: MenuItem[] | null; }

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [data, setData] = useState<CategoryWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ fullname: string } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      if (user) {
        const { data: profileData } = await supabase.from('profiles').select('fullname').eq('id', user.id).single();
        setProfile(profileData);
      } else {
        setProfile(null);
      }

      const { data: categoriesData, error } = await supabase.rpc('get_categories_with_items', {
        item_limit: 7,
      });

      if (error) {
        console.error('Error fetching data with RPC:', error);
      } else {
        setData(categoriesData || []);
      }
      setLoading(false);
    };
    loadData();
  }, [user]);

  const renderSectionHeader = (section: CategoryWithItems) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.name}</Text>
      <TouchableOpacity onPress={() => router.push({ pathname: '/menu/[categoryId]', params: { categoryId: section.id.toString(), categoryName: section.name } })}>
        <Text style={styles.seeAll}>عرض الكل</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#E63946" /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <SectionList
        sections={data.map(cat => ({ ...cat, data: [cat.menu_items || []] }))}
        keyExtractor={(item, index) => `row-${index}`}
        ListHeaderComponent={() => (
          <Text style={styles.headerTitle}>
            {profile ? `مرحباً، ${profile.fullname}` : 'قائمة الطعام'}
          </Text>
        )}
        renderSectionHeader={({ section }) => renderSectionHeader(section)}
        renderItem={({ item }) => {
          if (item.length === 0) {
            return <Text style={styles.noItemsText}>لا توجد وجبات في هذا القسم بعد.</Text>;
          }
          return (
            <FlatList
              data={item}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(menuItem) => menuItem.id.toString()}
              renderItem={({ item: menuItem }) => (
                // --- هذا هو التعديل ---
                <View style={{ width: 150, marginRight: 15 }}>
                  <FeaturedItemCard
                    name={menuItem.name}
                    price={menuItem.price}
                    imageUrl={menuItem.image_url}
                    // --- هذا هو التعديل ---
                    onPress={() => router.push(`/item/${menuItem.id}`)}
                  // --------------------
                  />
                </View>
              )}
              contentContainerStyle={{ paddingHorizontal: 20 }}
            />
          );
        }}
        ListEmptyComponent={<View style={styles.centered}><Text>لا توجد أقسام متاحة حالياً.</Text></View>}
        contentContainerStyle={{ paddingBottom: 20 }}

        // --- هذا هو السطر الذي يحل المشكلة ---
        stickySectionHeadersEnabled={false}
      // ------------------------------------
      />
    </SafeAreaView>
  );
}

// نفس الـ Styles السابقة
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F7' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 32, fontWeight: 'bold', color: '#1D3557', textAlign: 'right', marginHorizontal: 20, marginTop: 20, marginBottom: 10 },
  sectionHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 20, marginBottom: 15 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', color: '#1D3557' },
  seeAll: { fontSize: 16, fontWeight: '600', color: '#E63946' },
  noItemsText: {
    paddingHorizontal: 20,
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'right',
  },
});
