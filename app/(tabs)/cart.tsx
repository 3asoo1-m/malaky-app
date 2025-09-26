// مسار الملف: app/(tabs)/cart.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCart, CartItem, OrderType } from '@/lib/useCart';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import CustomBottomNav from '@/components/CustomBottomNav';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase'; // لجلب العناوين
import { useAuth } from '@/lib/useAuth';   // لجلب user.id

// ✅ 1. تعريف نوع العنوان
interface Address {
  id: number;
  address_line1: string;
  city: string;
}

export default function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const {
    items,
    updateQuantity,
    subtotal,
    totalPrice,
    deliveryPrice,
    orderType,
    setOrderType,
  } = useCart();

  // ✅ 2. حالات جديدة للعناوين والعنوان المحدد
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  // ✅ 3. جلب العناوين عند اختيار "توصيل"
  useEffect(() => {
    if (orderType === 'delivery' && user) {
      setLoadingAddresses(true);
      const fetchAddresses = async () => {
        const { data, error } = await supabase
          .from('user_addresses')
          .select('id, address_line1, city')
          .eq('user_id', user.id);
        
        if (data) {
          setAddresses(data);
          // تحديد العنوان الأول كافتراضي
          if (data.length > 0) {
            setSelectedAddress(data[0]);
          }
        }
        setLoadingAddresses(false);
      };
      fetchAddresses();
    }
  }, [orderType, user]);

  // --- مكونات العرض ---
  const renderItem = ({ item }: { item: CartItem }) => (
    // ✅ 4. جعل البطاقة قابلة للضغط
    <TouchableOpacity onPress={() => router.push(`/item/${item.product.id}`)} style={styles.cartItemContainer}>
      <Image source={{ uri: item.product.image_url || '' }} style={styles.itemImage} />
      <View style={styles.itemDetails}>
        <Text style={styles.itemName}>{item.product.name}</Text>
        {/* ... (بقية تفاصيل المنتج) */}
      </View>
      <View style={styles.quantitySelector}>
        <TouchableOpacity onPress={() => updateQuantity(item.id, 1)} style={styles.quantityButton}>
          <Ionicons name="add" size={20} color="#C62828" />
        </TouchableOpacity>
        <Text style={styles.quantityText}>{item.quantity}</Text>
        <TouchableOpacity onPress={() => updateQuantity(item.id, -1)} style={styles.quantityButton}>
          <Ionicons name="remove" size={20} color="#C62828" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // ✅ 5. مكون جديد لاختيار نوع الطلب
  const OrderTypeSelector = () => (
    <View style={styles.orderTypeContainer}>
      <TouchableOpacity
        style={[styles.orderTypeButton, orderType === 'pickup' && styles.orderTypeActive]}
        onPress={() => setOrderType('pickup')}
      >
        <Ionicons name="storefront-outline" size={24} color={orderType === 'pickup' ? '#fff' : '#333'} />
        <Text style={[styles.orderTypeText, orderType === 'pickup' && styles.orderTypeTextActive]}>استلام</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.orderTypeButton, orderType === 'delivery' && styles.orderTypeActive]}
        onPress={() => setOrderType('delivery')}
      >
        <Ionicons name="bicycle-outline" size={24} color={orderType === 'delivery' ? '#fff' : '#333'} />
        <Text style={[styles.orderTypeText, orderType === 'delivery' && styles.orderTypeTextActive]}>توصيل</Text>
      </TouchableOpacity>
    </View>
  );

  // ✅ 6. مكون جديد لعرض واختيار العنوان
  const AddressSection = () => {
    if (orderType !== 'delivery') return null;

    if (loadingAddresses) {
      return <ActivityIndicator style={{ marginVertical: 20 }} />;
    }

    if (addresses.length === 0) {
      return (
        <TouchableOpacity style={styles.noAddressContainer} onPress={() => router.push('/addresses')}>
          <Ionicons name="add-circle-outline" size={24} color="#C62828" />
          <Text style={styles.noAddressText}>لا يوجد عناوين. أضف عنوانًا للتوصيل.</Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.addressSectionContainer}>
        <Text style={styles.sectionTitle}>عنوان التوصيل</Text>
        <TouchableOpacity style={styles.selectedAddress} onPress={() => router.push('/addresses')}>
          <FontAwesome5 name="map-marker-alt" size={20} color="#C62828" />
          <View style={styles.addressTextContainer}>
            <Text style={styles.addressLine1}>{selectedAddress?.address_line1}</Text>
            <Text style={styles.addressCity}>{selectedAddress?.city}</Text>
          </View>
          <Ionicons name="chevron-back-outline" size={20} color="#888" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom + 180 }]}
        ListHeaderComponent={
          <>
            <Text style={styles.headerTitle}>سلتي</Text>
            <OrderTypeSelector />
            <AddressSection />
            {items.length > 0 && <Text style={styles.sectionTitle}>المنتجات</Text>}
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cart-outline" size={80} color="#ccc" />
            <Text style={styles.emptyText}>سلّتك فارغة بعد!</Text>
            <TouchableOpacity style={styles.browseButton} onPress={() => router.push('/')}>
              <Text style={styles.browseButtonText}>تصفح القائمة</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {items.length > 0 && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
          <View style={styles.priceSummary}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>المجموع الفرعي</Text>
              <Text style={styles.priceValue}>{subtotal.toFixed(2)} ₪</Text>
            </View>
            {orderType === 'delivery' && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>سعر التوصيل</Text>
                <Text style={styles.priceValue}>{deliveryPrice.toFixed(2)} ₪</Text>
              </View>
            )}
            <View style={[styles.priceRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>المجموع الكلي</Text>
              <Text style={styles.totalPrice}>{totalPrice.toFixed(2)} ₪</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.checkoutButton}>
            <Text style={styles.checkoutButtonText}>إتمام الطلب</Text>
          </TouchableOpacity>
        </View>
      )}

      <CustomBottomNav />
    </View>
  );
}

// ✅ 7. تحديث التنسيقات بالكامل
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  listContainer: { padding: 16 },
  headerTitle: { fontSize: 32, fontWeight: 'bold', textAlign: 'right', marginBottom: 16, color: '#1A1A1A' },
  sectionTitle: { fontSize: 18, fontWeight: '600', textAlign: 'right', marginBottom: 12, marginTop: 24, color: '#333' },
  
  // Order Type
  orderTypeContainer: { flexDirection: 'row-reverse', backgroundColor: '#EFEFEF', borderRadius: 30, padding: 4 },
  orderTypeButton: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 26 },
  orderTypeActive: { backgroundColor: '#C62828' },
  orderTypeText: { fontSize: 16, fontWeight: '600', color: '#333', marginLeft: 8 },
  orderTypeTextActive: { color: '#fff' },

  // Address Section
  addressSectionContainer: { marginTop: 24 },
  noAddressContainer: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#FFF0F0', padding: 12, borderRadius: 10, marginTop: 10 },
  noAddressText: { color: '#C62828', marginRight: 8, fontWeight: '500' },
  selectedAddress: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#eee' },
  addressTextContainer: { flex: 1, marginRight: 12, alignItems: 'flex-end' },
  addressLine1: { fontSize: 15, fontWeight: '600', color: '#333' },
  addressCity: { fontSize: 13, color: '#777', marginTop: 2 },

  // Cart Item
  cartItemContainer: { backgroundColor: '#fff', borderRadius: 15, padding: 12, flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#eee' },
  itemImage: { width: 70, height: 70, borderRadius: 10 },
  itemDetails: { flex: 1, marginRight: 12, alignItems: 'flex-end' },
  itemName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  quantitySelector: { flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', height: 80 },
  quantityButton: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },
  quantityText: { fontSize: 16, fontWeight: 'bold' },

  // Footer
  footer: { position: 'absolute', bottom: 85, left: 0, right: 0, backgroundColor: '#fff', padding: 16, borderTopWidth: 1, borderTopColor: '#eee', elevation: 10 },
  priceSummary: { marginBottom: 16 },
  priceRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  priceLabel: { fontSize: 15, color: '#666' },
  priceValue: { fontSize: 15, fontWeight: '500', color: '#333' },
  totalRow: { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 8, marginTop: 4 },
  totalLabel: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A' },
  totalPrice: { fontSize: 22, fontWeight: 'bold', color: '#C62828' },
  checkoutButton: { backgroundColor: '#C62828', padding: 16, borderRadius: 15, alignItems: 'center' },
  checkoutButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  // Empty State
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: '20%' },
  emptyText: { fontSize: 20, fontWeight: '600', color: '#555', marginTop: 16 },
  browseButton: { marginTop: 24, backgroundColor: '#C62828', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 30 },
  browseButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
