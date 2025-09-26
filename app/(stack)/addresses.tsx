// مسار الملف: app/(stack)/addresses.tsx

import { useRouter, useFocusEffect } from 'expo-router'; 
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Pressable,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ... (واجهة Address تبقى كما هي)
interface Address {
  id: number;
  address_line1: string;
  address_line2: string | null;
  city: string;
  notes: string | null;
}


export default function AddressesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  // ... (useFocusEffect و handleDelete يبقيان كما هما)
  useFocusEffect(
    useCallback(() => {
      const fetchAddresses = async () => {
        if (!user) { setLoading(false); return; }
        setLoading(true);
        const { data, error } = await supabase
          .from('user_addresses')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) Alert.alert('خطأ', 'لم نتمكن من جلب العناوين.');
        else setAddresses(data);
        setLoading(false);
      };
      fetchAddresses();
    }, [user]) 
  );

  const handleDelete = (addressId: number) => {
    Alert.alert('تأكيد الحذف', 'هل أنت متأكد أنك تريد حذف هذا العنوان؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف', style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('user_addresses').delete().eq('id', addressId);
          if (error) Alert.alert('خطأ', 'لم نتمكن من حذف العنوان.');
          else setAddresses(prev => prev.filter(addr => addr.id !== addressId));
        },
      },
    ]);
  };


  const renderAddress = ({ item }: { item: Address }) => (
    <Pressable
      style={({ pressed }) => [styles.addressCard, pressed && styles.cardPressed]}
      onPress={() => router.push({
        pathname: '/(modal)/address-form',
        params: { address: JSON.stringify(item) }
      })}
    >
      <View style={styles.cardIcon}>
        <FontAwesome5 name="map-marker-alt" size={22} color="#C62828" />
      </View>
      <View style={styles.cardDetails}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.address_line1}</Text>
        <Text style={styles.cardSubtitle}>{item.city}{item.address_line2 ? `, ${item.address_line2}` : ''}</Text>
      </View>
      <TouchableOpacity 
        onPress={() => handleDelete(item.id)} 
        style={styles.deleteButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="trash-outline" size={22} color="#E53935" />
      </TouchableOpacity>
    </Pressable>
  );
  
  return (
    // ✅ 1. الحاوية الرئيسية تأخذ الحواف الآمنة
    <View style={[styles.container, { paddingTop: insets.top }]}>
      
      {loading && addresses.length === 0 ? (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color="#C62828" />
        </View>
      ) : (
        // ✅ 2. FlatList أصبحت هي العنصر الرئيسي الذي يملأ الشاشة
        <FlatList
          data={addresses}
          renderItem={renderAddress}
          keyExtractor={(item) => item.id.toString()}
          // ✅ 3. إضافة مساحة علوية كافية للهيدر العائم
          contentContainerStyle={{ paddingTop: 80, paddingHorizontal: 16, paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={styles.centeredContainer}>
              <FontAwesome5 name="map-marked-alt" size={60} color="#ddd" />
              <Text style={styles.emptyText}>لا توجد عناوين محفوظة</Text>
              <Text style={styles.emptySubText}>أضف عنوانك الأول لتسهيل عملية الطلب</Text>
            </View>
          }
        />
      )}

      {/* ✅ 4. الهيدر الآن عائم فوق القائمة */}
      <View style={[styles.header, { top: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>عناويني</Text>
        <View style={{ width: 40 }} /> 
      </View>

      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 20 }]}
        onPress={() => router.push('/(modal)/address-form')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

// ✅ 5. تحديث التنسيقات
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  header: {
    // --- التغييرات الرئيسية هنا ---
    position: 'absolute',
    top: 0, // سيتم تحديثه ديناميكيًا بـ insets.top
    left: 0,
    right: 0,
    zIndex: 10, // لضمان أنه فوق كل شيء
    // ---
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop:12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9F9F9', // خلفية شفافة
  },
  headerTitle: {
    fontSize: 22, // تكبير الخط قليلاً
    fontWeight: 'bold',
    color: '#333',
  },
  backButton: {
    padding: 4,
  },
  // ... (بقية التنسيقات تبقى كما هي تقريبًا)
  listContainer: {
    padding: 16,
    paddingBottom: 100,
    flexGrow: 1,
  },
  addressCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    backgroundColor: '#F5F5F5',
  },
  cardIcon: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#FEECEB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardDetails: {
    flex: 1,
    alignItems: 'flex-end',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#777',
    marginTop: 4,
  },
  deleteButton: {
    padding: 8,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#C62828',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 4 },
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#555',
    marginTop: 20,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
});
