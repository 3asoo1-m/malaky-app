import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  View, 
  FlatList, 
  Alert, 
  ActivityIndicator, 
  StyleSheet,
  Text,
} from 'react-native';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCart } from '@/lib/useCart';
import { useAuth } from '@/lib/useAuth';
import { supabase } from '@/lib/supabase';
import { CartItem, Address, Branch,OrderType } from '@/lib/types';

import {
  CheckoutWizard,
  CartItemComponent,
  CartFooter,
  EmptyCart
} from '@/components/cart';
import ScreenHeader from '@/components/ui/ScreenHeader';
import CustomBottomNav from '@/components/CustomBottomNav';

export default function CartScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();

  const {
    items,
    updateQuantity,
    removeFromCart,
    subtotal,
    orderType,
    setOrderType,
    selectedAddress,
    setSelectedAddress,
    selectedBranch,
    setSelectedBranch,
    clearCart,
  } = useCart();

  const [availableAddresses, setAvailableAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [availableBranches, setAvailableBranches] = useState<Branch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [isPlacingOrder, setPlacingOrder] = useState(false);
  const [isCheckoutModalVisible, setCheckoutModalVisible] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');

  const deliveryPrice = orderType === 'delivery' && selectedAddress?.delivery_zones 
    ? selectedAddress.delivery_zones.delivery_price 
    : 0;
  
  const discount = promoApplied ? subtotal * 0.1 : 0;
  const totalPrice = subtotal + deliveryPrice;
  const finalTotal = totalPrice - discount;

  // Fetch addresses
  const fetchAddresses = useCallback(async () => {
    if (!user) return;
    
    setLoadingAddresses(true);
    try {
      const { data: rawData, error } = await supabase
        .from('user_addresses')
        .select(`id, street_address, notes, created_at, is_default, address_name, delivery_zones (city, area_name, delivery_price)`)
        .eq('user_id', user.id)
        .is('deleted_at', null) 
        .order('created_at', { ascending: false });
      
      if (error) { 
        console.error('Error fetching addresses:', error.message);
        Alert.alert('خطأ', 'تعذر تحميل العناوين');
      } else if (rawData) {
        const formattedData: Address[] = rawData.map(addr => {
          const deliveryZone = Array.isArray(addr.delivery_zones) ? addr.delivery_zones[0] || null : addr.delivery_zones;
          
          return {
            id: addr.id,
            street_address: addr.street_address,
            notes: addr.notes,
            created_at: addr.created_at,
            is_default: addr.is_default,
            address_name: addr.address_name,
            delivery_zones: deliveryZone ? {
              city: deliveryZone.city,
              area_name: deliveryZone.area_name,
              delivery_price: deliveryZone.delivery_price
            } : null
          };
        });
        setAvailableAddresses(formattedData);
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('خطأ', 'حدث خطأ غير متوقع');
    } finally {
      setLoadingAddresses(false);
    }
  }, [user]);

  // Fetch branches
  const fetchBranches = useCallback(async () => {
    setLoadingBranches(true);
    try {
      const { data, error } = await supabase.from('branches').select('*').eq('is_active', true);
      if (error) { 
        console.error('Error fetching branches:', error.message);
        Alert.alert('خطأ', 'تعذر تحميل الفروع');
      } else if (data) {
        setAvailableBranches(data);
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('خطأ', 'حدث خطأ غير متوقع');
    } finally {
      setLoadingBranches(false);
    }
  }, []);

  // Focus effect
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

  useFocusEffect(
    useCallback(() => {
      if (orderType === 'delivery') {
        fetchAddresses();
      } else if (orderType === 'pickup') {
        fetchBranches();
      }
    }, [orderType, fetchAddresses, fetchBranches])
  );

  // Handlers
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
    Alert.alert(
      'حذف المنتج',
      'هل أنت متأكد من حذف هذا المنتج من السلة؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'حذف', style: 'destructive', onPress: () => removeFromCart(itemId) }
      ]
    );
  }, [removeFromCart]);

  const handlePlaceOrder = useCallback(async () => {
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
          total_price: finalTotal,
          subtotal: subtotal,
          delivery_price: deliveryPrice,
          discount: discount,
          order_type: orderType,
          user_address_id: orderType === 'delivery' ? selectedAddress?.id : null,
          branch_id: orderType === 'pickup' ? selectedBranch?.id : null,
          notes: orderNotes,
          status: 'pending',
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
      Alert.alert(
        'نجاح!', 
        'تم استلام طلبك بنجاح. سيتم تجهيزه قريباً.',
        [{ text: 'حسناً', onPress: () => {
          clearCart();
          setPromoApplied(false);
          setPromoCode('');
          setOrderNotes('');
          router.push('/');
        }}]
      );

    } catch (error: any) {
      console.error('Error placing order:', error);
      Alert.alert('خطأ فادح', 'حدث خطأ أثناء إرسال طلبك. يرجى المحاولة مرة أخرى.');
    } finally {
      setPlacingOrder(false);
    }
  }, [
    isPlacingOrder, user, items, finalTotal, subtotal, deliveryPrice, 
    discount, orderType, selectedAddress, selectedBranch, orderNotes, 
    clearCart, router
  ]);

  // Render functions
  const renderItem = useCallback(({ item }: { item: CartItem }) => (
    <CartItemComponent
      item={item}
      onUpdate={handleUpdateQuantity}
      onRemove={handleRemoveFromCart}
      onPress={handleItemPress}
    />
  ), [handleUpdateQuantity, handleRemoveFromCart, handleItemPress]);

  const keyExtractor = useCallback((item: CartItem, index: number) => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `cart-${item.id}-${index}-${timestamp}-${random}`;
  }, []);

  const ListHeaderComponent = useMemo(() => {
    if (items.length === 0) return null;
    
    return (
      <View style={styles.cartHeader}>
        <View style={styles.cartTitleRow}>
          <Text style={styles.sectionTitle}>المنتجات</Text>
          <View style={styles.itemsCountBadge}>
            <Text style={styles.itemsCountBadgeText}>
              {items.length} {items.length === 1 ? 'منتج' : 'منتجات'}
            </Text>
          </View>
        </View>
      </View>
    );
  }, [items.length]);

  if (isPlacingOrder) {
    return (
      <View style={styles.fullScreen}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#C62828" />
            <Text style={styles.loadingText}>جاري تأكيد طلبك...</Text>
            <Text style={styles.loadingSubtext}>يرجى الانتظار</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.fullScreen}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScreenHeader title="السلة" />
        
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContentContainer}
          ListHeaderComponent={ListHeaderComponent}
          ListEmptyComponent={<EmptyCart />}
          ListFooterComponent={items.length > 0 ? <View style={{ height: 100 }} /> : null}
          showsVerticalScrollIndicator={false}
        />
        
        {items.length > 0 && (
          <CartFooter 
            subtotal={subtotal}
            orderType={orderType}
            selectedAddress={selectedAddress}
            onCheckout={() => {
              setCheckoutModalVisible(true);
              setCheckoutStep(1);
            }}
          />
        )}

        <CheckoutWizard
          visible={isCheckoutModalVisible}
          onClose={() => setCheckoutModalVisible(false)}
          checkoutStep={checkoutStep}
          setCheckoutStep={setCheckoutStep}
          orderType={orderType}
          onOrderTypeChange={handleOrderTypeChange}
          loadingAddresses={loadingAddresses}
          availableAddresses={availableAddresses}
          selectedAddress={selectedAddress}
          onSelectAddress={handleSelectAddress}
          onAddAddress={handleAddAddress}
          loadingBranches={loadingBranches}
          availableBranches={availableBranches}
          selectedBranch={selectedBranch}
          onSelectBranch={handleSelectBranch}
          items={items}
          subtotal={subtotal}
          deliveryPrice={deliveryPrice}
          promoCode={promoCode}
          setPromoCode={setPromoCode}
          promoApplied={promoApplied}
          setPromoApplied={setPromoApplied}
          orderNotes={orderNotes}
          setOrderNotes={setOrderNotes}
          isPlacingOrder={isPlacingOrder}
          onPlaceOrder={handlePlaceOrder}
        />
      </SafeAreaView>
      
      <CustomBottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  safeArea: {
    flex: 1,
  },
  listContentContainer: {
    padding: 16,
    paddingBottom: 200,
  },
  cartHeader: {
    marginBottom: 16,
  },
  cartTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Cairo-Bold',
    color: '#1f2937',
  },
  itemsCountBadge: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  itemsCountBadgeText: {
    fontSize: 12,
    fontFamily: 'Cairo-SemiBold',
    color: '#6b7280',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    fontFamily: 'Cairo-SemiBold',
    color: '#1f2937',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: 'Cairo-Regular',
    color: '#6b7280',
  },
});