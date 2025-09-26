// مسار الملف: app/addresses.tsx

// ✅ 1. استيراد useFocusEffect
import { Stack, useRouter, useFocusEffect } from 'expo-router'; 
import React, { useCallback, useState } from 'react'; // ✅ استيراد useCallback
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';

// ... (interface Address يبقى كما هو)
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
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ 2. استبدال useEffect بـ useFocusEffect
  useFocusEffect(
    // useCallback ضروري لمنع إعادة إنشاء الدالة في كل مرة يتم فيها إعادة العرض
    useCallback(() => {
      const fetchAddresses = async () => {
        if (!user) {
          setLoading(false);
          return;
        }
        setLoading(true);
        const { data, error } = await supabase
          .from('user_addresses')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          Alert.alert('خطأ', 'لم نتمكن من جلب العناوين.');
        } else {
          setAddresses(data);
        }
        setLoading(false);
      };

      fetchAddresses();
    }, [user]) // يعتمد على user فقط
  );

  // ... (بقية الدوال renderAddress, handleDelete تبقى كما هي)
  const handleDelete = (addressId: number) => {
    Alert.alert(
      'تأكيد الحذف',
      'هل أنت متأكد أنك تريد حذف هذا العنوان؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('user_addresses').delete().eq('id', addressId);
            if (error) Alert.alert('خطأ', 'لم نتمكن من حذف العنوان.');
            else setAddresses(prev => prev.filter(addr => addr.id !== addressId));
          },
        },
      ]
    );
  };

  const renderAddress = ({ item }: { item: Address }) => (
    <View style={styles.addressCard}>
      <View style={styles.addressIcon}>
        <FontAwesome5 name="map-marker-alt" size={24} color="#C62828" />
      </View>
      <View style={styles.addressDetails}>
        <Text style={styles.addressLine1}>{item.address_line1}</Text>
        <Text style={styles.addressCity}>{item.city}</Text>
        {item.address_line2 && <Text style={styles.addressSub}>{item.address_line2}</Text>}
      </View>
      <View style={styles.addressActions}>
        <TouchableOpacity onPress={() => handleDelete(item.id)}>
          <Ionicons name="trash-outline" size={22} color="#E53935" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={{ marginLeft: 15 }}
          onPress={() => router.push({
            pathname: '/(modal)/address-form',
            params: { address: JSON.stringify(item) }
          })}
        >
          <Ionicons name="pencil-outline" size={22} color="#333" />
        </TouchableOpacity>
      </View>
    </View>
  );
  
  // ... (بقية واجهة المستخدم تبقى كما هي)
  return (
    <SafeAreaView style={styles.container}>
      
      {loading && addresses.length === 0 ? ( // ✅ تحسين شرط التحميل
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          data={addresses}
          renderItem={renderAddress}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.centeredContainer}>
              <FontAwesome5 name="map-marked-alt" size={64} color="#ccc" />
              <Text style={styles.emptyText}>لا توجد عناوين محفوظة بعد</Text>
              <Text style={styles.emptySubText}>أضف عنوانك الأول لتبدأ</Text>
            </View>
          }
          ListFooterComponent={
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/(modal)/address-form')}
            >
              <Ionicons name="add" size={24} color="#fff" />
              <Text style={styles.addButtonText}>إضافة عنوان جديد</Text>
            </TouchableOpacity>
          }
        />
      )}
    </SafeAreaView>
  );
}

// ... (التنسيقات تبقى كما هي)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  listContainer: {
    padding: 20,
    flexGrow: 1,
  },
  addressCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  addressIcon: {
    marginRight: 15,
  },
  addressDetails: {
    flex: 1,
    alignItems: 'flex-end',
  },
  addressLine1: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  addressCity: {
    fontSize: 14,
    color: '#555',
  },
  addressSub: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
  addressActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#C62828',
    borderRadius: 15,
    padding: 15,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#555',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
  },
});
