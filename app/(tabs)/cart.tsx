// مسار الملف: app/(tabs)/cart.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCart, CartItem, OrderType, Address, Branch } from '@/lib/useCart';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import CustomBottomNav from '@/components/CustomBottomNav';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';
//start working on cart.tsx
export default function CartScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const {
    items, updateQuantity, removeFromCart, subtotal, totalPrice, deliveryPrice,
    orderType, setOrderType, setDeliveryPrice, selectedAddress, setSelectedAddress,
    selectedBranch, setSelectedBranch, clearCart,
  } = useCart();

  const [availableAddresses, setAvailableAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [availableBranches, setAvailableBranches] = useState<Branch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [isBranchPickerVisible, setBranchPickerVisible] = useState(false);
  const [isPlacingOrder, setPlacingOrder] = useState(false);

  const fetchAddresses = useCallback(async () => {
    if (!user) return;
    setLoadingAddresses(true);
    const { data: rawData, error } = await supabase.from('user_addresses').select(`id, street_address, notes, created_at, delivery_zones (city, area_name, delivery_price)`).eq('user_id', user.id).order('created_at', { ascending: false });
    if (error) { console.error('Error fetching addresses:', error.message); }
    else if (rawData) {
      const formattedData: Address[] = rawData.map(addr => ({ ...addr, delivery_zones: Array.isArray(addr.delivery_zones) ? addr.delivery_zones[0] || null : addr.delivery_zones }));
      setAvailableAddresses(formattedData);
      if (formattedData.length > 0 && !selectedAddress) { setSelectedAddress(formattedData[0]); }
      else if (formattedData.length === 0) { setSelectedAddress(null); }
    }
    setLoadingAddresses(false);
  }, [user, selectedAddress, setSelectedAddress]);

  const fetchBranches = useCallback(async () => {
    setLoadingBranches(true);
    const { data, error } = await supabase.from('branches').select('*').eq('is_active', true);
    if (error) { console.error('Error fetching branches:', error.message); }
    else if (data) {
      setAvailableBranches(data);
      if (data.length > 0 && !selectedBranch) { setSelectedBranch(data[0]); }
    }
    setLoadingBranches(false);
  }, [selectedBranch, setSelectedBranch]);

  useFocusEffect(useCallback(() => {
    if (orderType === 'delivery') { fetchAddresses(); }
    else if (orderType === 'pickup') { fetchBranches(); }
  }, [orderType, fetchAddresses, fetchBranches]));

  useEffect(() => {
    if (orderType === 'delivery' && selectedAddress?.delivery_zones) { setDeliveryPrice(selectedAddress.delivery_zones.delivery_price); }
    else { setDeliveryPrice(0); }
  }, [selectedAddress, orderType, setDeliveryPrice]);

  const handleSelectBranch = (branch: Branch) => {
    setSelectedBranch(branch);
    setBranchPickerVisible(false);
  };

  const handleCheckout = async () => {
    if (!user) {
      Alert.alert('خطأ', 'يجب عليك تسجيل الدخول أولاً لإتمام الطلب.');
      return;
    }
    if (items.length === 0) {
      Alert.alert('خطأ', 'سلتك فارغة!');
      return;
    }

    setPlacingOrder(true);

    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_price: totalPrice,
          subtotal: subtotal,
          delivery_price: deliveryPrice,
          order_type: orderType,
          user_address_id: orderType === 'delivery' ? selectedAddress?.id : null,
          branch_id: orderType === 'pickup' ? selectedBranch?.id : null,
        })
        .select('id')
        .single();

      if (orderError) throw orderError;

      const orderId = orderData.id;

      const orderItems = items.map(cartItem => ({
        order_id: orderId,
        menu_item_id: cartItem.product.id,
        quantity: cartItem.quantity,
        unit_price: cartItem.product.price,
        options: cartItem.options,
        notes: cartItem.notes,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

      if (itemsError) throw itemsError;

      Alert.alert('نجاح!', 'تم استلام طلبك بنجاح.');
      clearCart();
      router.push('/');

    } catch (error: any) {
      console.error('Error placing order:', error);
      Alert.alert('خطأ فادح', 'حدث خطأ أثناء إرسال طلبك. يرجى المحاولة مرة أخرى.');
    } finally {
      setPlacingOrder(false);
    }
  };

  const renderItem = ({ item }: { item: CartItem }) => {
    const optionLabels = Object.entries(item.options).map(([groupId, value]) => {
      const group = item.product.options?.find(g => g.id === groupId);
      const optionValue = group?.values.find(v => v.value === value);
      return optionValue ? optionValue.label : null;
    }).filter(Boolean).join('، ');

    // ✅✅✅ التعديل الوحيد هنا ✅✅✅
    // جلب الصورة من مصفوفة 'images' مع توفير صورة افتراضية
    const imageUrl = item.product.images && item.product.images.length > 0
      ? item.product.images[0].image_url
      : 'https://dgplcadvneqpohxqlilg.supabase.co/storage/v1/object/public/menu_image/icon.png'; // رابط صورة افتراضية مؤقت

    return (
      <TouchableOpacity onPress={( ) => router.push(`/item/${item.product.id}`)} style={styles.cartItemContainer}>
        <TouchableOpacity onPress={() => removeFromCart(item.id)} style={styles.deleteButton}><Ionicons name="close-circle" size={24} color="#999" /></TouchableOpacity>
        <Image source={{ uri: imageUrl }} style={styles.itemImage} />
        <View style={styles.itemDetails}>
          <Text style={styles.itemName}>{item.product.name}</Text>
          {optionLabels.length > 0 && (<Text style={styles.optionsText}>{optionLabels}</Text>)}
          {item.notes && (<Text style={styles.notesText}>ملاحظات: {item.notes}</Text>)}
        </View>
        <View style={styles.quantitySelector}>
          <TouchableOpacity onPress={() => updateQuantity(item.id, 1)} style={styles.quantityButton}><Ionicons name="add" size={20} color="#C62828" /></TouchableOpacity>
          <Text style={styles.quantityText}>{item.quantity}</Text>
          <TouchableOpacity onPress={() => updateQuantity(item.id, -1)} style={styles.quantityButton}><Ionicons name="remove" size={20} color="#C62828" /></TouchableOpacity>
        </View>
        <Text style={styles.itemPriceText}>{item.totalPrice.toFixed(2)} ₪</Text>
      </TouchableOpacity>
    );
  };

  const OrderTypeSelector = () => (
    <View style={styles.orderTypeContainer}>
      <TouchableOpacity style={[styles.orderTypeButton, orderType === 'pickup' && styles.orderTypeActive]} onPress={() => setOrderType('pickup')}><Ionicons name="storefront-outline" size={24} color={orderType === 'pickup' ? '#fff' : '#333'} /><Text style={[styles.orderTypeText, orderType === 'pickup' && styles.orderTypeTextActive]}>استلام</Text></TouchableOpacity>
      <TouchableOpacity style={[styles.orderTypeButton, orderType === 'delivery' && styles.orderTypeActive]} onPress={() => setOrderType('delivery')}><Ionicons name="bicycle-outline" size={24} color={orderType === 'delivery' ? '#fff' : '#333'} /><Text style={[styles.orderTypeText, orderType === 'delivery' && styles.orderTypeTextActive]}>توصيل</Text></TouchableOpacity>
    </View>
  );

  const AddressSection = () => {
    if (orderType !== 'delivery') return null;
    if (loadingAddresses) return <ActivityIndicator style={{ marginVertical: 20 }} color="#C62828" />;
    if (availableAddresses.length === 0) {
      return (<TouchableOpacity style={styles.noAddressContainer} onPress={() => router.push({ pathname: '/addresses', params: { fromCart: 'true' } })}><Ionicons name="add-circle-outline" size={24} color="#C62828" /><Text style={styles.noAddressText}>لا يوجد عناوين. أضف عنوانًا للتوصيل.</Text></TouchableOpacity>);
    }
    return (
      <View style={styles.addressSectionContainer}>
        <Text style={styles.sectionTitle}>عنوان التوصيل</Text>
        <TouchableOpacity style={styles.selectedAddress} onPress={() => router.push({ pathname: '/addresses', params: { fromCart: 'true' } })}>
          <FontAwesome5 name="map-marker-alt" size={20} color="#C62828" />
          <View style={styles.addressTextContainer}><Text style={styles.addressLine1}>{selectedAddress?.delivery_zones?.area_name || 'اختر عنوان'}</Text><Text style={styles.addressCity}>{selectedAddress ? `${selectedAddress.delivery_zones?.city}, ${selectedAddress.street_address}` : ''}</Text></View>
          <Ionicons name="chevron-forward-outline" size={20} color="#888" />
        </TouchableOpacity>
      </View>
    );
  };

  const BranchSection = () => {
    if (orderType !== 'pickup') return null;
    if (loadingBranches) return <ActivityIndicator style={{ marginVertical: 20 }} color="#C62828" />;
    if (availableBranches.length === 0) {
      return (<View style={styles.noAddressContainer}><Text style={styles.noAddressText}>لا توجد فروع متاحة للاستلام حاليًا.</Text></View>);
    }
    return (
      <View style={styles.addressSectionContainer}>
        <Text style={styles.sectionTitle}>فرع الاستلام</Text>
        <TouchableOpacity style={styles.selectedAddress} onPress={() => setBranchPickerVisible(true)}>
          <Ionicons name="storefront-outline" size={20} color="#C62828" />
          <View style={styles.addressTextContainer}>
            <Text style={styles.addressLine1}>{selectedBranch?.name || 'اختر فرعًا'}</Text>
            <Text style={styles.addressCity}>{selectedBranch?.address}</Text>
          </View>
          <Ionicons name="chevron-down-outline" size={20} color="#888" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Modal
        animationType="fade"
        transparent={true}
        visible={isBranchPickerVisible}
        onRequestClose={() => setBranchPickerVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setBranchPickerVisible(false)}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>اختر فرع الاستلام</Text>
            {availableBranches.map((branch) => (
              <TouchableOpacity
                key={branch.id}
                style={styles.branchOption}
                onPress={() => handleSelectBranch(branch)}
              >
                <Text style={styles.branchName}>{branch.name}</Text>
                <Text style={styles.branchAddress}>{branch.address}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 280 }}
        ListHeaderComponent={
          <>
            <Text style={styles.headerTitle}>سلتي</Text>
            <OrderTypeSelector />
            <AddressSection />
            <BranchSection />
            {items.length > 0 && <Text style={styles.sectionTitle}>المنتجات</Text>}
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}><Ionicons name="cart-outline" size={80} color="#ccc" /><Text style={styles.emptyText}>سلّتك فارغة بعد!</Text><TouchableOpacity style={styles.browseButton} onPress={() => router.push('/')}><Text style={styles.browseButtonText}>تصفح القائمة</Text></TouchableOpacity></View>
        }
      />
      {items.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.priceSummary}>
            <View style={styles.priceRow}><Text style={styles.priceLabel}>المجموع الفرعي</Text><Text style={styles.priceValue}>{subtotal.toFixed(2)} ₪</Text></View>
            {orderType === 'delivery' && (<View style={styles.priceRow}><Text style={styles.priceLabel}>سعر التوصيل</Text><Text style={styles.priceValue}>{deliveryPrice.toFixed(2)} ₪</Text></View>)}
            <View style={[styles.priceRow, styles.totalRow]}><Text style={styles.totalLabel}>المجموع الكلي</Text><Text style={styles.totalPrice}>{totalPrice.toFixed(2)} ₪</Text></View>
          </View>
          <TouchableOpacity
            style={[
              styles.checkoutButton,
              (orderType === 'delivery' && !selectedAddress || orderType === 'pickup' && !selectedBranch || isPlacingOrder) && styles.disabledButton
            ]}
            disabled={orderType === 'delivery' && !selectedAddress || orderType === 'pickup' && !selectedBranch || isPlacingOrder}
            onPress={handleCheckout}
          >
            {isPlacingOrder ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.checkoutButtonText}>إتمام الطلب</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
      <CustomBottomNav />
    </View>
  );
}

// التنسيقات تبقى كما هي بدون أي تغيير
const styles = StyleSheet.create({
  disabledButton: { backgroundColor: '#BDBDBD' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { backgroundColor: '#fff', borderRadius: 15, padding: 20, width: '90%', maxHeight: '80%', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'left', marginBottom: 20, color: '#333' },
  branchOption: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee', alignItems: 'flex-start' },
  branchName: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  branchAddress: { fontSize: 14, color: '#777', marginTop: 4 },
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  headerTitle: { fontSize: 32, fontWeight: 'bold', textAlign: 'left', marginBottom: 16, color: '#1A1A1A', marginTop: 16, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', textAlign: 'left', marginBottom: 12, marginTop: 24, color: '#333' },
  orderTypeContainer: { flexDirection: 'row', backgroundColor: '#EFEFEF', borderRadius: 30, padding: 4 },
  orderTypeButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 26 },
  orderTypeActive: { backgroundColor: '#C62828' },
  orderTypeText: { fontSize: 16, fontWeight: '600', color: '#333', marginLeft: 8 },
  orderTypeTextActive: { color: '#fff' },
  addressSectionContainer: { marginTop: 24 },
  noAddressContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBEB', padding: 12, borderRadius: 10, marginTop: 10 },
  noAddressText: { color: '#F9A825', marginLeft: 8, fontWeight: '500' },
  selectedAddress: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#eee' },
  addressTextContainer: { flex: 1, marginLeft: 12, alignItems: 'flex-start' },
  addressLine1: { fontSize: 15, fontWeight: '600', color: '#333', textAlign: 'left' },
  addressCity: { fontSize: 13, color: '#777', marginTop: 2, textAlign: 'left' },
  cartItemContainer: { backgroundColor: '#fff', borderRadius: 15, padding: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#eee' },
  itemImage: { width: 70, height: 70, borderRadius: 10 },
  itemDetails: { flex: 1, marginRight: 12, alignItems: 'flex-start' },
  itemName: { fontSize: 16, fontWeight: 'bold', color: '#333', textAlign: 'left', marginBottom: 4 },
  quantitySelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', marginRight: 'auto', paddingLeft: 8 },
  quantityButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FEECEB', justifyContent: 'center', alignItems: 'center' },
  quantityText: { fontSize: 16, fontWeight: 'bold', marginHorizontal: 12 },
  itemPriceText: { fontSize: 15, fontWeight: 'bold', color: '#C62828', position: 'absolute', bottom: 7, right: 28 },
  footer: { position: 'absolute', bottom: 85, left: 0, right: 0, backgroundColor: '#fff', padding: 16, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#eee', elevation: 10 },
  priceSummary: { marginBottom: 16 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  priceLabel: { fontSize: 15, color: '#666' },
  priceValue: { fontSize: 15, fontWeight: '500', color: '#333' },
  totalRow: { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10, marginTop: 6 },
  totalLabel: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A' },
  totalPrice: { fontSize: 22, fontWeight: 'bold', color: '#C62828' },
  checkoutButton: { backgroundColor: '#C62828', padding: 16, borderRadius: 15, alignItems: 'center' },
  checkoutButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: '20%' },
  emptyText: { fontSize: 20, fontWeight: '600', color: '#555', marginTop: 16 },
  browseButton: { marginTop: 24, backgroundColor: '#C62828', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 30 },
  browseButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  deleteButton: { position: 'absolute', top: 8, left: 8, zIndex: 1 },
  optionsText: { fontSize: 13, color: '#666', textAlign: 'left', marginTop: 2 },
  notesText: { fontSize: 13, color: '#888', fontStyle: 'italic', textAlign: 'left', marginTop: 4 },
});
