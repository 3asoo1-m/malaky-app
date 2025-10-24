// مسار الملف: app/(tabs)/addresses.tsx

import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
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
import { useCart } from '@/lib/useCart';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Address } from '@/lib/types';

export default function AddressesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ استخدام نظام from الموحد
  const { setSelectedAddress } = useCart();
  const params = useLocalSearchParams();
  const fromScreen = params.from as string; // 'profile' أو 'cart'

  // ✅ تحديد وضع الاختيار بناءً على from
  const isSelectionMode = fromScreen === 'cart';

  // ✅ دالة العودة الذكية
const handleBack = () => {
  if (fromScreen === 'profile') {
    // ✅ استخدم navigate بدلاً من back للعودة للبروفايل
    router.navigate('/(tabs)/profile');
  } else if (fromScreen === 'cart') {
    // ✅ استخدم navigate بدلاً من back للعودة للسلة
    router.navigate('/(tabs)/cart');
  } else {
    router.back(); // ✅ العودة الافتراضية
  }
};

  useFocusEffect(
    useCallback(() => {
      const fetchAddresses = async () => {
        if (!user) {
          setLoading(false);
          return;
        }
        setLoading(true);
        const { data: rawData, error } = await supabase
          .from('user_addresses')
          .select(`
            id, street_address, notes, created_at,
            delivery_zones (city, area_name, delivery_price)
          `)
          .eq('user_id', user.id)
          .is('deleted_at', null) 
          .order('created_at', { ascending: false });

        if (error) {
          Alert.alert('خطأ', 'لم نتمكن من جلب العناوين.');
        } else if (rawData) {
          const formattedData: Address[] = rawData.map(addr => ({
            ...addr,
            delivery_zones: Array.isArray(addr.delivery_zones) ? addr.delivery_zones[0] || null : addr.delivery_zones,
          }));
          setAddresses(formattedData);
        }
        setLoading(false);
      };
      fetchAddresses();
    }, [user])
  );

  const handleDelete = (addressId: number) => {
    Alert.alert('تأكيد الحذف', 'هل أنت متأكد أنك تريد حذف هذا العنوان؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.rpc('delete_user_address', {
            address_id_to_delete: addressId
          });
          if (error) {
            console.error('RPC Error:', error);
            Alert.alert('خطأ', 'لم نتمكن من حذف العنوان.');
          } else {
            setAddresses(prev => prev.filter(addr => addr.id !== addressId));
            Alert.alert('نجاح', 'تم حذف العنوان بنجاح');
          }
        },
      },
    ]);
  };

  // ✅ دالة اختيار العنوان المحسنة
  const handleSelectAddress = (item: Address) => {
    if (isSelectionMode) {
      setSelectedAddress(item); // تحديث العنوان في الحالة العامة
      handleBack(); // ✅ استخدم دالة العودة الذكية
    } else {
      router.push({
        pathname: '/(modal)/address-form',
        params: { address: JSON.stringify(item) },
      });
    }
  };

  const renderAddress = ({ item }: { item: Address }) => {
    return (
      <Pressable
        style={({ pressed }) => [styles.addressCard, pressed && styles.cardPressed]}
        onPress={() => handleSelectAddress(item)}
      >
        {/* ✅ أيقونة الاختيار في وضع الاختيار */}
        {isSelectionMode && (
          <View style={styles.selectionIcon}>
            <Ionicons name="ellipse-outline" size={24} color="#ccc" />
          </View>
        )}
        
        <View style={styles.cardIcon}>
          <FontAwesome5 name="map-marker-alt" size={22} color="#C62828" />
        </View>
        
        <View style={styles.cardDetails}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.delivery_zones?.area_name || 'منطقة غير محددة'}
          </Text>
          <Text style={styles.cardSubtitle}>
            {item.delivery_zones?.city}, {item.street_address}
          </Text>
        </View>
        
        {/* ✅ إخفاء زر الحذف في وضع الاختيار */}
        {!isSelectionMode && (
          <TouchableOpacity
            onPress={() => handleDelete(item.id)}
            style={styles.deleteButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={22} color="#E53935" />
          </TouchableOpacity>
        )}
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {loading && addresses.length === 0 ? (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color="#C62828" />
        </View>
      ) : (
        <FlatList
          data={addresses}
          renderItem={renderAddress}
          keyExtractor={(item) => item.id.toString()}
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

      {/* ✅ الهيدر مع زر العودة الذكي */}
      <View style={[styles.header, { top: insets.top }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        {/* ✅ عنوان الهيدر الذكي */}
        <Text style={styles.headerTitle}>
          {isSelectionMode ? 'اختر عنوان التوصيل' : 'عناويني'}
        </Text>
        
        <View style={{ width: 40 }} />
      </View>

      {/* ✅ إخفاء زر الإضافة في وضع الاختيار */}
      {!isSelectionMode && (
        <TouchableOpacity
          style={[styles.fab, { bottom: insets.bottom + 20 }]}
          onPress={() => router.push('/(modal)/address-form')}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={32} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  header: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    zIndex: 10, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    marginTop: 12, 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    backgroundColor: '#F9F9F9' 
  },
  headerTitle: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: '#333' 
  },
  backButton: { 
    padding: 4 
  },
  addressCard: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 16, 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 16, 
    borderWidth: 1, 
    borderColor: '#eee' 
  },
  cardPressed: { 
    transform: [{ scale: 0.98 }], 
    backgroundColor: '#F5F5F5' 
  },
  cardIcon: { 
    width: 45, 
    height: 45, 
    borderRadius: 22.5, 
    backgroundColor: '#FEECEB', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 12 
  },
  cardDetails: { 
    flex: 1, 
    alignItems: 'flex-start' 
  },
  cardTitle: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#333' 
  },
  cardSubtitle: { 
    fontSize: 14, 
    color: '#777', 
    marginTop: 4 
  },
  deleteButton: { 
    padding: 8, 
    marginLeft: 8 
  },
  fab: { 
    position: 'absolute', 
    left: 20, 
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
    shadowOffset: { width: 0, height: 4 } 
  },
  centeredContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20 
  },
  emptyText: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: '#555', 
    marginTop: 20 
  },
  emptySubText: { 
    fontSize: 14, 
    color: '#999', 
    marginTop: 8, 
    textAlign: 'center' 
  },
  selectionIcon: {
    marginLeft: 'auto',
    paddingLeft: 8,
  },
});