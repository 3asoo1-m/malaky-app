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
  const [isPlacingOrder, setPlacingOrder] = useState(false);

  const [isCheckoutModalVisible, setCheckoutModalVisible] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1);

  const fetchAddresses = useCallback(async () => {
    if (!user) return;
    setLoadingAddresses(true);
    const { data: rawData, error } = await supabase.from('user_addresses').select(`id, street_address, notes, created_at, delivery_zones (city, area_name, delivery_price)`).eq('user_id', user.id).order('created_at', { ascending: false });
    if (error) { console.error('Error fetching addresses:', error.message); }
    else if (rawData) {
      const formattedData: Address[] = rawData.map(addr => ({ ...addr, delivery_zones: Array.isArray(addr.delivery_zones) ? addr.delivery_zones[0] || null : addr.delivery_zones }));
      setAvailableAddresses(formattedData);
      // ✅ تم إلغاء الاختيار الافتراضي
      if (formattedData.length === 0) { setSelectedAddress(null); }
    }
    setLoadingAddresses(false);
  }, [user, setSelectedAddress]);

  const fetchBranches = useCallback(async () => {
    setLoadingBranches(true);
    const { data, error } = await supabase.from('branches').select('*').eq('is_active', true);
    if (error) { console.error('Error fetching branches:', error.message); }
    else if (data) {
      setAvailableBranches(data);
      // ✅ تم إلغاء الاختيار الافتراضي
    }
    setLoadingBranches(false);
  }, []);

  useFocusEffect(useCallback(() => {
    if (orderType === 'delivery') { fetchAddresses(); }
    else if (orderType === 'pickup') { fetchBranches(); }
  }, [orderType, fetchAddresses, fetchBranches]));

  useEffect(() => {
    if (orderType === 'delivery' && selectedAddress?.delivery_zones) { setDeliveryPrice(selectedAddress.delivery_zones.delivery_price); }
    else { setDeliveryPrice(0); }
  }, [selectedAddress, orderType, setDeliveryPrice]);

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

      setCheckoutModalVisible(false);
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

    const imageUrl = item.product.images && item.product.images.length > 0
      ? item.product.images[0].image_url
      : 'https://dgplcadvneqpohxqlilg.supabase.co/storage/v1/object/public/menu_image/icon.png';

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
      <TouchableOpacity style={[styles.orderTypeButton, orderType === 'pickup' && styles.orderTypeActive]} onPress={() => { setOrderType('pickup'); setSelectedAddress(null); }}>
        <Ionicons name="storefront-outline" size={24} color={orderType === 'pickup' ? '#fff' : '#333'} />
        <Text style={[styles.orderTypeText, orderType === 'pickup' && styles.orderTypeTextActive]}>استلام</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.orderTypeButton, orderType === 'delivery' && styles.orderTypeActive]} onPress={() => { setOrderType('delivery'); setSelectedBranch(null); }}>
        <Ionicons name="bicycle-outline" size={24} color={orderType === 'delivery' ? '#fff' : '#333'} />
        <Text style={[styles.orderTypeText, orderType === 'delivery' && styles.orderTypeTextActive]}>توصيل</Text>
      </TouchableOpacity>
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
        <Text style={styles.sectionTitle}>اختر عنوان التوصيل</Text>
        {availableAddresses.map(address => (
          <TouchableOpacity
            key={address.id}
            style={[styles.locationOption, selectedAddress?.id === address.id && styles.locationOptionSelected]}
            onPress={() => setSelectedAddress(address)}
          >
            <FontAwesome5 name="map-marker-alt" size={20} color={selectedAddress?.id === address.id ? "#C62828" : "#ccc"} style={{ marginRight: 2 }} />
            <View style={styles.addressTextContainer}>
              <Text style={styles.addressLine1}>{address.delivery_zones?.area_name || 'منطقة غير محددة'}</Text>
              <Text style={styles.addressCity}>{`${address.delivery_zones?.city}, ${address.street_address}`}</Text>
            </View>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.addAddressButton} onPress={() => router.push({ pathname: '/addresses', params: { fromCart: 'true' } })}>
          <Ionicons name="add" size={20} color="#C62828" />
          <Text style={styles.addAddressText}>إضافة أو تعديل عنوان</Text>
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
        <Text style={styles.sectionTitle}>اختر فرع الاستلام</Text>
        {availableBranches.map(branch => (
          <TouchableOpacity
            key={branch.id}
            style={[styles.locationOption, selectedBranch?.id === branch.id && styles.locationOptionSelected]}
            onPress={() => setSelectedBranch(branch)}
          >
            <Ionicons name={selectedBranch?.id === branch.id ? "radio-button-on" : "radio-button-off"} size={22} color={selectedBranch?.id === branch.id ? "#C62828" : "#ccc"} />
            <View style={styles.addressTextContainer}>
              <Text style={styles.addressLine1}>{branch.name}</Text>
              <Text style={styles.addressCity}>{branch.address}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Modal
        animationType="slide"
        transparent={true}
        visible={isCheckoutModalVisible}
        onRequestClose={() => setCheckoutModalVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setCheckoutModalVisible(false)}>
          <Pressable style={styles.wizardModalContainer} onPress={(e) => e.stopPropagation()}>
            <View style={styles.wizardHeader}>
              <TouchableOpacity onPress={() => {
                if (checkoutStep > 1) setCheckoutStep(checkoutStep - 1);
                else setCheckoutModalVisible(false);
              }}>
                <Ionicons name="arrow-back" size={24} color="#333" />
              </TouchableOpacity>
              <Text style={styles.wizardTitle}>
                {checkoutStep === 1 && 'اختر نوع الطلب'}
                {checkoutStep === 2 && (orderType === 'delivery' ? 'اختر عنوان التوصيل' : 'اختر فرع الاستلام')}
                {checkoutStep === 3 && 'تأكيد الطلب'}
              </Text>
              <View style={{ width: 24 }} />
            </View>

            <View style={styles.wizardContent}>
              {checkoutStep === 1 && (
                <View>
                  <OrderTypeSelector />
                  <TouchableOpacity
                    style={[styles.wizardButton, !orderType && styles.disabledButton]}
                    disabled={!orderType}
                    onPress={() => setCheckoutStep(2)}
                  >
                    <Text style={styles.checkoutButtonText}>التالي</Text>
                  </TouchableOpacity>
                </View>
              )}

              {checkoutStep === 2 && (
                <View>
                  {orderType === 'delivery' ? <AddressSection /> : <BranchSection />}
                  <TouchableOpacity
                    style={[
                      styles.wizardButton,
                      (orderType === 'delivery' && !selectedAddress || orderType === 'pickup' && !selectedBranch) && styles.disabledButton
                    ]}
                    disabled={orderType === 'delivery' && !selectedAddress || orderType === 'pickup' && !selectedBranch}
                    onPress={() => setCheckoutStep(3)}
                  >
                    <Text style={styles.checkoutButtonText}>التالي</Text>
                  </TouchableOpacity>
                </View>
              )}

              {checkoutStep === 3 && (
                <View>
                  <View style={styles.priceSummary}>
                    <View style={styles.priceRow}><Text style={styles.priceLabel}>المجموع الفرعي</Text><Text style={styles.priceValue}>{subtotal.toFixed(2)} ₪</Text></View>
                    {orderType === 'delivery' && (<View style={styles.priceRow}><Text style={styles.priceLabel}>سعر التوصيل</Text><Text style={styles.priceValue}>{deliveryPrice.toFixed(2)} ₪</Text></View>)}
                    <View style={[styles.priceRow, styles.totalRow]}><Text style={styles.totalLabel}>المجموع الكلي</Text><Text style={styles.totalPrice}>{totalPrice.toFixed(2)} ₪</Text></View>
                  </View>
                  <TouchableOpacity
                    style={[styles.wizardButton, isPlacingOrder && styles.disabledButton]}
                    disabled={isPlacingOrder}
                    onPress={handleCheckout}
                  >
                    {isPlacingOrder ? <ActivityIndicator color="#fff" /> : <Text style={styles.checkoutButtonText}>تأكيد الطلب الآن</Text>}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 180 }}
        ListHeaderComponent={
          <>
            <Text style={styles.headerTitle}>سلتي</Text>
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
            <View style={[styles.priceRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>المجموع الكلي</Text>
              <Text style={styles.totalPrice}>{totalPrice.toFixed(2)} ₪</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.checkoutButton}
            onPress={() => {
              setCheckoutModalVisible(true);
              setCheckoutStep(1);
            }}
          >
            <Text style={styles.checkoutButtonText}>إتمام الطلب</Text>
          </TouchableOpacity>
        </View>
      )}
      <CustomBottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  disabledButton: { backgroundColor: '#BDBDBD' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  headerTitle: { fontSize: 32, fontWeight: 'bold', textAlign: 'left', marginBottom: 16, color: '#1A1A1A', marginTop: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', textAlign: 'left', marginBottom: 12, marginTop: 24, color: '#333' },
  orderTypeContainer: { flexDirection: 'row', backgroundColor: '#EFEFEF', borderRadius: 30, padding: 4 },
  orderTypeButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 26 },
  orderTypeActive: { backgroundColor: '#C62828' },
  orderTypeText: { fontSize: 16, fontWeight: '600', color: '#333', marginLeft: 8 },
  orderTypeTextActive: { color: '#fff' },
  addressSectionContainer: { marginTop: 16, marginBottom: 16 },
  noAddressContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBEB', padding: 12, borderRadius: 10, marginTop: 10 },
  noAddressText: { color: '#F9A825', marginLeft: 8, fontWeight: '500' },
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
  wizardModalContainer: {
    width: '100%',
    backgroundColor: '#F9F9F9',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    position: 'absolute',
    bottom: 0,
  },
  wizardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  wizardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  wizardContent: {
    paddingVertical: 20,
  },
  wizardButton: {
    backgroundColor: '#C62828',
    padding: 16,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  // ✅ تنسيقات جديدة مضافة
  locationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#eee',
    marginBottom: 12,
  },
  locationOptionSelected: {
    borderColor: '#C62828',
    backgroundColor: '#FFF8F8',
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C62828',
    borderStyle: 'dashed',
    marginTop: 8,
  },
  addAddressText: {
    color: '#C62828',
    fontWeight: '600',
    marginLeft: 8,
  },
  addressTextContainer: { flex: 1, marginLeft: 12, alignItems: 'flex-start' },
  addressLine1: { fontSize: 15, fontWeight: '600', color: '#333', textAlign: 'left' },
  addressCity: { fontSize: 13, color: '#777', marginTop: 2, textAlign: 'left' },
});
