// مسار الملف: app/(tabs)/cart.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCart } from '@/lib/useCart';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';
import { SafeAreaView } from 'react-native-safe-area-context'; // ✅ 1. استيراد SafeAreaView
import { 
  CartItem, 
  OrderType, 
  Address, 
  Branch,
  AddressItemProps,
  BranchItemProps,
  CartItemComponentProps,
  OrderTypeSelectorProps,
  AddressSectionProps,
  BranchSectionProps 
} from '@/lib/types';
import CustomBottomNav from '@/components/CustomBottomNav';

// --- المكونات الفرعية (تبقى كما هي) ---
const AddressItem = React.memo(({ address, isSelected, onSelect }: AddressItemProps) => (
  <TouchableOpacity
    style={[styles.locationOption, isSelected && styles.locationOptionSelected]}
    onPress={onSelect}
  >
    <FontAwesome5 name="map-marker-alt" size={20} color={isSelected ? "#C62828" : "#ccc"} style={{ marginRight: 2 }} />
    <View style={styles.addressTextContainer}>
      <Text style={styles.addressLine1}>{address.delivery_zones?.area_name || 'منطقة غير محددة'}</Text>
      <Text style={styles.addressCity}>{`${address.delivery_zones?.city}, ${address.street_address}`}</Text>
      {address.delivery_zones?.delivery_price !== undefined && (
        <Text style={styles.deliveryPrice}>
          رسوم التوصيل: {address.delivery_zones.delivery_price.toFixed(2)} ₪
        </Text>
      )}
    </View>
  </TouchableOpacity>
));

const BranchItem = React.memo(({ branch, isSelected, onSelect }: BranchItemProps) => (
  <TouchableOpacity
    style={[styles.locationOption, isSelected && styles.locationOptionSelected]}
    onPress={onSelect}
  >
    <Ionicons name={isSelected ? "radio-button-on" : "radio-button-off"} size={22} color={isSelected ? "#C62828" : "#ccc"} />
    <View style={styles.addressTextContainer}>
      <Text style={styles.addressLine1}>{branch.name}</Text>
      <Text style={styles.addressCity}>{branch.address}</Text>
    </View>
  </TouchableOpacity>
));

const CartItemComponent = React.memo(({ item, onUpdate, onRemove, onPress }: CartItemComponentProps) => {
  const optionLabels = Object.entries(item.options).map(([groupId, value]) => {
    const group = item.product.options?.find(g => g.id === groupId);
    const optionValue = group?.values.find(v => v.value === value);
    return optionValue ? optionValue.label : null;
  }).filter(Boolean).join('، ');

  const imageUrl = item.product.images && item.product.images.length > 0
    ? item.product.images[0].image_url
    : 'https://dgplcadvneqpohxqlilg.supabase.co/storage/v1/object/public/menu_image/icon.png';

  return (
    <TouchableOpacity onPress={onPress} style={styles.cartItemContainer}>
      <TouchableOpacity onPress={( ) => onRemove(item.id)} style={styles.deleteButton}>
        <Ionicons name="close-circle" size={24} color="#e22b2bc9" />
      </TouchableOpacity>
      <Image source={{ uri: imageUrl }} style={styles.itemImage} />
      <View style={styles.itemDetails}>
        <Text style={styles.itemName}>{item.product.name}</Text>
        {optionLabels.length > 0 && (<Text style={styles.optionsText}>{optionLabels}</Text>)}
        
        {item.additionalPieces && item.additionalPieces.length > 0 && (
          <View style={styles.additionalPiecesContainer}>
            {item.additionalPieces.map((piece, index) => (
              <View key={index} style={styles.additionalPieceRow}>
                <Text style={styles.additionalPieceText}>
                  + {piece.quantity} × {piece.name}
                </Text>
                <Text style={styles.additionalPiecePrice}>
                  {(piece.price * piece.quantity).toFixed(2)} ₪
                </Text>
              </View>
            ))}
          </View>
        )}
        
        {item.notes && (<Text style={styles.notesText}>ملاحظات: {item.notes}</Text>)}
      </View>
      <View style={styles.quantitySelector}>
        <TouchableOpacity onPress={() => onUpdate(item.id, 1)} style={styles.quantityButton}>
          <Ionicons name="add" size={20} color="#C62828" />
        </TouchableOpacity>
        <Text style={styles.quantityText}>{item.quantity}</Text>
        <TouchableOpacity onPress={() => onUpdate(item.id, -1)} style={styles.quantityButton}>
          <Ionicons name="remove" size={20} color="#C62828" />
        </TouchableOpacity>
      </View>
      <Text style={styles.itemPriceText}>{item.totalPrice.toFixed(2)} ₪</Text>
    </TouchableOpacity>
  );
});

const OrderTypeSelector = React.memo(({ orderType, onTypeChange }: OrderTypeSelectorProps) => (
  <View style={styles.orderTypeContainer}>
    <TouchableOpacity 
      style={[styles.orderTypeButton, orderType === 'pickup' && styles.orderTypeActive]} 
      onPress={() => onTypeChange('pickup')}
    >
      <Ionicons name="storefront-outline" size={24} color={orderType === 'pickup' ? '#fff' : '#333'} />
      <Text style={[styles.orderTypeText, orderType === 'pickup' && styles.orderTypeTextActive]}>استلام</Text>
    </TouchableOpacity>
    <TouchableOpacity 
      style={[styles.orderTypeButton, orderType === 'delivery' && styles.orderTypeActive]} 
      onPress={() => onTypeChange('delivery')}
    >
      <Ionicons name="bicycle-outline" size={24} color={orderType === 'delivery' ? '#fff' : '#333'} />
      <Text style={[styles.orderTypeText, orderType === 'delivery' && styles.orderTypeTextActive]}>توصيل</Text>
    </TouchableOpacity>
  </View>
));

const AddressSection = React.memo(({ 
  orderType, 
  loadingAddresses, 
  availableAddresses, 
  selectedAddress, 
  onSelectAddress,
  onAddAddress 
}: AddressSectionProps) => {
  if (orderType !== 'delivery') return null;
  
  if (loadingAddresses) return <ActivityIndicator style={{ marginVertical: 20 }} color="#C62828" />;
  
  return (
    <View style={styles.addressSectionContainer}>
      <Text style={styles.sectionTitle}>اختر عنوان التوصيل</Text>
      
      {!selectedAddress && availableAddresses.length > 0 && (
        <View style={styles.selectionWarning}>
          <Ionicons name="warning-outline" size={18} color="#F9A825" />
          <Text style={styles.selectionWarningText}>يجب اختيار عنوان التوصيل للمتابعة</Text>
        </View>
      )}
      
      {availableAddresses.length === 0 ? (
        <TouchableOpacity style={styles.noAddressContainer} onPress={onAddAddress}>
          <Ionicons name="add-circle-outline" size={24} color="#C62828" />
          <Text style={styles.noAddressText}>لا يوجد عناوين. أضف عنوانًا للتوصيل.</Text>
        </TouchableOpacity>
      ) : (
        <>
          {availableAddresses.map(address => (
            <AddressItem
              key={address.id}
              address={address}
              isSelected={selectedAddress?.id === address.id}
              onSelect={() => onSelectAddress(address)}
            />
          ))}
          <TouchableOpacity style={styles.addAddressButton} onPress={onAddAddress}>
            <Ionicons name="add" size={20} color="#C62828" />
            <Text style={styles.addAddressText}>إضافة عنوان جديد</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
});

const BranchSection = React.memo(({ 
  orderType, 
  loadingBranches, 
  availableBranches, 
  selectedBranch, 
  onSelectBranch 
}: BranchSectionProps) => {
  if (orderType !== 'pickup') return null;
  
  if (loadingBranches) return <ActivityIndicator style={{ marginVertical: 20 }} color="#C62828" />;
  
  return (
    <View style={styles.addressSectionContainer}>
      <Text style={styles.sectionTitle}>اختر فرع الاستلام</Text>
      
      {!selectedBranch && availableBranches.length > 0 && (
        <View style={styles.selectionWarning}>
          <Ionicons name="warning-outline" size={18} color="#F9A825" />
          <Text style={styles.selectionWarningText}>يجب اختيار فرع الاستلام للمتابعة</Text>
        </View>
      )}
      
      {availableBranches.length === 0 ? (
        <View style={styles.noAddressContainer}>
          <Text style={styles.noAddressText}>لا توجد فروع متاحة للاستلام حاليًا.</Text>
        </View>
      ) : (
        availableBranches.map(branch => (
          <BranchItem
            key={branch.id}
            branch={branch}
            isSelected={selectedBranch?.id === branch.id}
            onSelect={() => onSelectBranch(branch)}
          />
        ))
      )}
    </View>
  );
});


// --- المكون الرئيسي (CartScreen) ---
export default function CartScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();

  const {
    items, updateQuantity, removeFromCart, subtotal,
    orderType, setOrderType, selectedAddress, setSelectedAddress,
    selectedBranch, setSelectedBranch, clearCart,
  } = useCart();

  const deliveryPrice = orderType === 'delivery' && selectedAddress?.delivery_zones 
    ? selectedAddress.delivery_zones.delivery_price 
    : 0;
  
  const totalPrice = subtotal + deliveryPrice;

  const [availableAddresses, setAvailableAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [availableBranches, setAvailableBranches] = useState<Branch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [isPlacingOrder, setPlacingOrder] = useState(false);
  const [isCheckoutModalVisible, setCheckoutModalVisible] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1);

  useFocusEffect(
    useCallback(() => {
      if (params.reopenWizard === 'true' && items.length > 0 && !isCheckoutModalVisible) {
        const timer = setTimeout(() => {
          setCheckoutModalVisible(true);
          setCheckoutStep(2);
          router.setParams({ reopenWizard: 'false' }); 
        }, 300);
        return () => clearTimeout(timer);
      }
    }, [params.reopenWizard, items.length, isCheckoutModalVisible])
  );

  const fetchAddresses = useCallback(async () => {
    if (!user) return;
    setLoadingAddresses(true);
    const { data: rawData, error } = await supabase
      .from('user_addresses')
      .select(`id, street_address, notes, created_at, delivery_zones (city, area_name, delivery_price)`)
      .eq('user_id', user.id)
      .is('deleted_at', null) 
      .order('created_at', { ascending: false });
    
    if (error) { 
      console.error('Error fetching addresses:', error.message); 
    } else if (rawData) {
      const formattedData: Address[] = rawData.map(addr => ({ 
        ...addr, 
        delivery_zones: Array.isArray(addr.delivery_zones) ? addr.delivery_zones[0] || null : addr.delivery_zones 
      }));
      setAvailableAddresses(formattedData);
    }
    setLoadingAddresses(false);
  }, [user]);

  const fetchBranches = useCallback(async () => {
    setLoadingBranches(true);
    const { data, error } = await supabase.from('branches').select('*').eq('is_active', true);
    if (error) { 
      console.error('Error fetching branches:', error.message); 
    } else if (data) {
      setAvailableBranches(data);
    }
    setLoadingBranches(false);
  }, []);

  useFocusEffect(useCallback(() => {
    if (orderType === 'delivery') {
      fetchAddresses();
    } else if (orderType === 'pickup') {
      fetchBranches();
    }
  }, [orderType, fetchAddresses, fetchBranches]));

  const handleSelectAddress = useCallback((address: Address) => {
    setSelectedAddress(address);
  }, [setSelectedAddress]);

  const handleSelectBranch = useCallback((branch: Branch) => {
    setSelectedBranch(branch);
  }, [setSelectedBranch]);

  const handleOrderTypeChange = useCallback((type: OrderType) => {
    setOrderType(type);
    if (type === 'pickup') {
      setSelectedAddress(null);
    } else {
      setSelectedBranch(null);
    }
  }, [setOrderType, setSelectedAddress, setSelectedBranch]);

  const handleAddAddress = useCallback(() => {
    setCheckoutModalVisible(false);
    router.push({ 
      pathname: '/(tabs)/addresses',
      params: { fromCart: 'true' }
    });
  }, [router]);

  const handleItemPress = useCallback((item: CartItem) => {
    router.push(`/item/${item.product.id}`);
  }, [router]);

  const handleUpdateQuantity = useCallback((itemId: string, change: 1 | -1) => {
    updateQuantity(itemId, change);
  }, [updateQuantity]);

  const handleRemoveFromCart = useCallback((itemId: string) => {
    removeFromCart(itemId);
  }, [removeFromCart]);

  const handleCheckout = useCallback(async () => {
    if (isPlacingOrder) return;
    
    if (!user) {
      Alert.alert('خطأ', 'يجب عليك تسجيل الدخول أولاً لإتمام الطلب.');
      return;
    }
    
    if (items.length === 0) {
      Alert.alert('خطأ', 'سلتك فارغة!');
      return;
    }

    if (orderType === 'delivery' && !selectedAddress) {
      Alert.alert('خطأ', 'يجب اختيار عنوان التوصيل أولاً.');
      return;
    }

    if (orderType === 'pickup' && !selectedBranch) {
      Alert.alert('خطأ', 'يجب اختيار فرع الاستلام أولاً.');
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
        additional_pieces: cartItem.additionalPieces && cartItem.additionalPieces.length > 0 
          ? cartItem.additionalPieces 
          : null,
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
  }, [isPlacingOrder, user, items, totalPrice, subtotal, deliveryPrice, orderType, selectedAddress, selectedBranch, clearCart, router]);

  const renderItem = useCallback(({ item }: { item: CartItem }) => (
    <CartItemComponent
      item={item}
      onUpdate={handleUpdateQuantity}
      onRemove={handleRemoveFromCart}
      onPress={() => handleItemPress(item)}
    />
  ), [handleUpdateQuantity, handleRemoveFromCart, handleItemPress]);

  const keyExtractor = useCallback((item: CartItem) => item.id, []);

  const listEmptyComponent = useMemo(() => (
    <View style={styles.emptyContainer}>
      <Ionicons name="cart-outline" size={80} color="#ccc" />
      <Text style={styles.emptyText}>سلّتك فارغة بعد!</Text>
      <TouchableOpacity style={styles.browseButton} onPress={() => router.push('/')}>
        <Text style={styles.browseButtonText}>تصفح القائمة</Text>
      </TouchableOpacity>
    </View>
  ), [router]);

  return (
    <View style={styles.fullScreen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
            <Text style={styles.headerTitle}>سلتي</Text>
            {items.length > 0 && <Text style={styles.itemsCount}>{items.length} منتجات</Text>}
        </View>

        // في جزء الـ Modal داخل return
{isCheckoutModalVisible && (
  <Modal
    animationType="slide"
    transparent={true}
    visible={true}
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
        
        {/* المحتوى قابل للتمرير */}
        <FlatList
          data={[]}
          renderItem={null}
          contentContainerStyle={styles.wizardContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View>
              {checkoutStep === 1 && (
                <View>
                  <OrderTypeSelector orderType={orderType} onTypeChange={handleOrderTypeChange} />
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
                  {orderType === 'delivery' ? (
                    <AddressSection
                      orderType={orderType}
                      loadingAddresses={loadingAddresses}
                      availableAddresses={availableAddresses}
                      selectedAddress={selectedAddress}
                      onSelectAddress={handleSelectAddress}
                      onAddAddress={handleAddAddress}
                    />
                  ) : (
                    <BranchSection
                      orderType={orderType}
                      loadingBranches={loadingBranches}
                      availableBranches={availableBranches}
                      selectedBranch={selectedBranch}
                      onSelectBranch={handleSelectBranch}
                    />
                  )}
                  <TouchableOpacity
                    style={[
                      styles.wizardButton,
                      (orderType === 'delivery' && !selectedAddress) || (orderType === 'pickup' && !selectedBranch) ? styles.disabledButton : null
                    ]}
                    disabled={(orderType === 'delivery' && !selectedAddress) || (orderType === 'pickup' && !selectedBranch)}
                    onPress={() => setCheckoutStep(3)}
                  >
                    <Text style={styles.checkoutButtonText}>التالي</Text>
                  </TouchableOpacity>
                </View>
              )}
              {checkoutStep === 3 && (
                <View>
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
          }
        />
      </Pressable>
    </Pressable>
  </Modal>
)}

        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          removeClippedSubviews={true}
          maxToRenderPerBatch={5}
          updateCellsBatchingPeriod={50}
          initialNumToRender={7}
          windowSize={5}
          contentContainerStyle={styles.listContentContainer}
          ListHeaderComponent={
            items.length > 0 ? <Text style={styles.sectionTitle}>المنتجات</Text> : null
          }
          ListEmptyComponent={listEmptyComponent}
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
      </SafeAreaView>
       <CustomBottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Cairo-Bold',
    color: '#1A1A1A',
  },
  itemsCount: {
    fontSize: 14,
    fontFamily: 'Cairo-Regular',
    color: '#666',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    textAlign: 'left', 
    marginBottom: 12, 
    marginTop: 10,
    color: '#333',
    paddingHorizontal: 10,
  },
  listContentContainer: {
    paddingHorizontal: 16, 
    paddingBottom: 200,
  },
  disabledButton: { backgroundColor: '#BDBDBD' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  orderTypeContainer: { flexDirection: 'row', backgroundColor: '#EFEFEF', borderRadius: 30, padding: 4 },
  orderTypeButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 26 },
  orderTypeActive: { backgroundColor: '#C62828' },
  orderTypeText: { fontSize: 16, fontWeight: '600', color: '#333', marginLeft: 8 },
  orderTypeTextActive: { color: '#fff' },
  addressSectionContainer: { marginTop: 16, marginBottom: 16 },
  noAddressContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFFBEB', 
    padding: 16, 
    borderRadius: 12, 
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#F9A825',
    borderStyle: 'dashed',
  },
  noAddressText: { color: '#F9A825', marginLeft: 8, fontWeight: '500' },
  cartItemContainer: { backgroundColor: '#fff', borderRadius: 15, padding: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#eee' },
  itemImage: { width: 70, height: 70, borderRadius: 10 },
  itemDetails: { flex: 1, marginRight: 12, alignItems: 'flex-start' },
  itemName: { fontSize: 16, fontWeight: 'bold', color: '#333', textAlign: 'left', marginBottom: 4 },
  quantitySelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', marginRight: 'auto', paddingLeft: 8 },
  quantityButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FEECEB', justifyContent: 'center', alignItems: 'center' },
  quantityText: { fontSize: 16, fontWeight: 'bold', marginHorizontal: 12 },
  itemPriceText: { fontSize: 15, fontWeight: 'bold', color: '#C62828', position: 'absolute', bottom: 7, right: 28 },
  footer: { 
    position: 'absolute', 
    bottom: 85, 
    left: 0, 
    right: 0, 
    backgroundColor: '#fff', 
    padding: 16, 
    paddingTop: 20, 
    borderTopWidth: 1, 
    borderTopColor: '#eee', 
    elevation: 10 
  },
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
  deleteButton: { position: 'absolute', top: 6, left: 6, zIndex: 1 },
  optionsText: { fontSize: 13, color: '#666', textAlign: 'left', marginTop: 2 },
  notesText: { fontSize: 13, color: '#888', fontStyle: 'italic', textAlign: 'left', marginTop: 4 },
  additionalPiecesContainer: { marginTop: 6, marginBottom: 4, width: '100%', },
  additionalPieceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2, width: '100%', },
  additionalPieceText: { fontSize: 12, color: '#4CAF50', fontWeight: '500', },
  additionalPiecePrice: { fontSize: 11, color: '#4CAF50', fontWeight: 'bold', },
 wizardModalContainer: { 
    width: '100%', 
    backgroundColor: '#F9F9F9', 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20, 
    maxHeight: '90%', // ✅ تحديد أقصى ارتفاع
  },
 wizardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20,
    paddingBottom: 15,
    borderBottomWidth: 1, 
    borderBottomColor: '#eee',
    // التأكد من أن الهيدر ثابت في الأعلى اوككيي
  },
    wizardTitle: { fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center'},
wizardContent: { 
    padding: 20,
    paddingTop: 0,
    paddingBottom: 30, // مسافة إضافية في الأسفل
  },
    wizardButton: { backgroundColor: '#C62828', padding: 16, borderRadius: 15, alignItems: 'center', marginTop: 20, },
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
    backgroundColor: '#FFF8F8',
  },
  addAddressText: {
    color: '#C62828',
    fontWeight: '600',
    marginLeft: 8,
  },
  addressTextContainer: { flex: 1, marginLeft: 12, alignItems: 'flex-start' },
  addressLine1: { fontSize: 15, fontWeight: '600', color: '#333', textAlign: 'left' },
  addressCity: { fontSize: 13, color: '#777', marginTop: 2, textAlign: 'left' },
  deliveryPrice: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 4,
    fontWeight: '500',
  },
  selectionWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F9A825',
    marginBottom: 12,
  },
  selectionWarningText: {
    color: '#F9A825',
    fontWeight: '500',
    marginLeft: 8,
    fontSize: 14,
  },
});