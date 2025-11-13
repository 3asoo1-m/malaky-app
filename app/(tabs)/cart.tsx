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
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCart } from '@/lib/useCart';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
import ScreenHeader from '@/components/ui/ScreenHeader';
import CustomBottomNav from '@/components/CustomBottomNav';

interface WizardStepProps {
  onNext: (data: any) => void;
  onBack?: () => void;
  onCancel?: () => void; // ✅ أضف خاصية onCancel
  data: any;
}

// --- المكونات الفرعية المحدثة ---
const AddressItem = React.memo(({ address, isSelected, onSelect }: AddressItemProps) => {
  const IconComponent = getIconComponent(address.address_name);
  
  return (
    <TouchableOpacity
      style={[styles.locationOption, isSelected && styles.locationOptionSelected]}
  onPress={() => onSelect(address)} // <--- هكذا هو الحل
    >
      <View style={styles.radioContainer}>
        {isSelected ? (
          <View style={styles.radioSelected}>
            <MaterialIcons name="check" size={16} color="#fff" />
          </View>
        ) : (
          <View style={styles.radioUnselected} />
        )}
      </View>
      
      <View style={styles.addressIconContainer}>
        <IconComponent size={20} color="#C62828" />
      </View>
      
      <View style={styles.addressTextContainer}>
        <View style={styles.addressHeader}>
          <Text style={styles.addressLabel}>{address.delivery_zones?.area_name || 'منطقة غير محددة'}</Text>
        </View>
        <Text style={styles.addressDetails}>{address.delivery_zones?.city}, {address.street_address}</Text>
        <Text style={styles.addressPhone}>+966 50 123 4567</Text>
        
        {address.delivery_zones?.delivery_price !== undefined && (
          <Text style={styles.deliveryPrice}>
            رسوم التوصيل: {address.delivery_zones.delivery_price.toFixed(2)} ₪
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
});

const BranchItem = React.memo(({ branch, isSelected, onSelect }: BranchItemProps) => (
  <TouchableOpacity
    style={[styles.locationOption, isSelected && styles.locationOptionSelected]}
  onPress={() => onSelect(branch)} // <--- هكذا هو الحل
  >
    <View style={styles.radioContainer}>
      {isSelected ? (
        <View style={styles.radioSelected}>
          <MaterialIcons name="check" size={16} color="#fff" />
        </View>
      ) : (
        <View style={styles.radioUnselected} />
      )}
    </View>
    
    <View style={[styles.branchIconContainer, styles.pickupIcon]}>
      <Ionicons name="storefront-outline" size={20} color="#C62828" />
    </View>
    
    <View style={styles.addressTextContainer}>
      <Text style={styles.addressLabel}>{branch.name}</Text>
      <Text style={styles.addressDetails}>{branch.address}</Text>
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
    <View style={styles.cartItemContainer}>
      <TouchableOpacity onPress={() => onRemove(item.id)} style={styles.deleteButton}>
        <Ionicons name="trash-outline" size={20} color="#C62828" />
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => onPress(item)}> 
        <Image source={{ uri: imageUrl }} style={styles.itemImage} />
      </TouchableOpacity>
      
      <View style={styles.itemDetails}>
          <TouchableOpacity onPress={() => onPress(item)}> 
            <Text style={styles.itemName}>{item.product.name}</Text>
           </TouchableOpacity>
        
        {optionLabels.length > 0 && (
          <View style={styles.optionsContainer}>
            {optionLabels.split('، ').map((option, index) => (
              <View key={index} style={styles.optionBadge}>
                <Text style={styles.optionText}>{option}</Text>
              </View>
            ))}
          </View>
        )}
        
{/* Additional Pieces - تصميم Figma الجديد */}
{item.additionalPieces && item.additionalPieces.length > 0 && (
  <View style={styles.additionalPiecesContainer}>
    <View style={styles.additionalPiecesHeader}>
      <Text style={styles.additionalPiecesTitle}>قطع إضافية ✨</Text>
    </View>
    
    {/* حاوية البطاقات المرنة */}
    <View>
      {item.additionalPieces.map((piece, index) => (
        <View key={index}>
          <Text style={styles.additionalPieceText} numberOfLines={1}>
            {piece.quantity}x {piece.name}
          </Text>
          <Text style={styles.additionalPiecePrice}>
            +{(piece.price * piece.quantity).toFixed(2)} ₪
          </Text>
        </View>
      ))}
    </View>
  </View>
)}

        
        {item.notes && (
          <Text style={styles.notesText}>ملاحظات: {item.notes}</Text>
        )}
      </View>
      
      <View style={styles.itemActions}>
        <View style={styles.quantitySelector}>
          <TouchableOpacity 
            onPress={() => onUpdate(item.id, 1)} 
            style={[styles.quantityButton, styles.quantityButtonPlus]}
          >
            <Ionicons name="add" size={16} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.quantityText}>{item.quantity}</Text>
          <TouchableOpacity 
            onPress={() => onUpdate(item.id, -1)} 
            style={styles.quantityButton}
            disabled={item.quantity === 1} // تعطيل الزر عند كمية 1
          >
            <Ionicons name="remove" size={16} color={item.quantity === 1 ? '#9ca3af' : '#C62828'} />
          </TouchableOpacity>
        </View>
        <Text style={styles.itemPriceText}>{(item.totalPrice).toFixed(2)} ₪</Text>
      </View>
    </View>
  );
});

const OrderTypeSelector = React.memo(({ orderType, onTypeChange }: OrderTypeSelectorProps) => (
  <View style={styles.orderTypeContainer}>
    <TouchableOpacity 
      style={[styles.orderTypeButton, orderType === 'pickup' && styles.orderTypeActive]} 
      onPress={() => onTypeChange('pickup')}
    >
      <Ionicons 
        name="storefront-outline" 
        size={24} 
        color={orderType === 'pickup' ? '#fff' : '#666'} 
      />
      <Text style={[styles.orderTypeText, orderType === 'pickup' && styles.orderTypeTextActive]}>
        استلام
      </Text>
    </TouchableOpacity>
    
    <TouchableOpacity 
      style={[styles.orderTypeButton, orderType === 'delivery' && styles.orderTypeActive]} 
      onPress={() => onTypeChange('delivery')}
    >
      <Ionicons 
        name="bicycle-outline" 
        size={24} 
        color={orderType === 'delivery' ? '#fff' : '#666'} 
      />
      <Text style={[styles.orderTypeText, orderType === 'delivery' && styles.orderTypeTextActive]}>
        توصيل
      </Text>
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
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Ionicons name="location-outline" size={20} color="#C62828" />
        <Text style={styles.sectionTitle}>اختر عنوان التوصيل</Text>
      </View>
      
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
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Ionicons name="business-outline" size={20} color="#C62828" />
        <Text style={styles.sectionTitle}>اختر فرع الاستلام</Text>
      </View>
      
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

// دالة مساعدة للحصول على الأيقونة المناسبة
const getIconComponent = (label?: string | null) => {
  if (!label) return Ionicons;
  
  switch (label.toLowerCase()) {
    case 'home':
    case 'المنزل':
      return Ionicons;
    case 'work':
    case 'العمل':
      return Ionicons;
    case 'other':
    case 'أخرى':
      return Ionicons;
    default:
      return Ionicons;
  }
};

// --- المكون الرئيسي المحدث (CartScreen) ---
export default function CartScreen() {
  const insets = useSafeAreaInsets(); // <-- أضف هذا السطر
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
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');

  const discount = promoApplied ? subtotal * 0.1 : 0;
  const finalTotal = totalPrice - discount;

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

  useFocusEffect(
    useCallback(() => {
      if (orderType === 'delivery') {
        fetchAddresses();
      } else if (orderType === 'pickup') {
        fetchBranches();
      }
    }, [orderType, fetchAddresses, fetchBranches])
  );

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

  const handleApplyPromo = useCallback(() => {
    if (promoCode.toLowerCase() === 'malaky10') {
      setPromoApplied(true);
      Alert.alert('نجاح', 'تم تطبيق كود الخصم بنجاح!');
    } else {
      Alert.alert('خطأ', 'كود الخصم غير صحيح');
    }
  }, [promoCode]);

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

  const renderItem = useCallback(({ item }: { item: CartItem }) => (
    <CartItemComponent
      item={item}
      onUpdate={handleUpdateQuantity}
      onRemove={handleRemoveFromCart}
    onPress={handleItemPress} // <--- هكذا هو الحل الصحيح
    />
  ), [handleUpdateQuantity, handleRemoveFromCart, handleItemPress]);

  const keyExtractor = useCallback((item: CartItem) => item.id, []);

  const listEmptyComponent = useMemo(() => (
    <View style={styles.emptyContainer}>
      <Ionicons name="cart-outline" size={80} color="#e5e7eb" />
      <Text style={styles.emptyText}>سلّتك فارغة!</Text>
      <Text style={styles.emptySubtext}>أضف بعض المنتجات اللذيذة لتبدأ</Text>
      <TouchableOpacity style={styles.browseButton} onPress={() => router.push('/')}>
        <Ionicons name="restaurant-outline" size={16} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.browseButtonText}>تصفح القائمة</Text>
      </TouchableOpacity>
    </View>
  ), [router]);

  // إصلاح ListHeaderComponent
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

const renderStepIndicator = () => {
  const steps = [
    { id: 1, label: 'نوع الطلب' },
    { id: 2, label: orderType === 'delivery' ? 'العنوان' : 'الفرع' },
    { id: 3, label: 'الدفع' },
    { id: 4, label: 'التأكيد' }
  ];

  return (
    <View style={styles.stepIndicator}>
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          {/* حاوية الخطوة (الدائرة والنص) */}
          <View style={styles.stepItem}>
            <View style={[
              styles.stepCircle,
              checkoutStep >= step.id ? styles.stepCircleActive : styles.stepCircleInactive
            ]}>
              {checkoutStep > step.id ? (
                <MaterialIcons name="check" size={18} color="#fff" />
              ) : (
                <Text style={[
                  styles.stepNumber,
                  checkoutStep >= step.id ? styles.stepNumberActive : styles.stepNumberInactive
                ]}>
                  {step.id}
                </Text>
              )}
            </View>
            <Text style={[
              styles.stepLabel,
              checkoutStep >= step.id ? styles.stepLabelActive : styles.stepLabelInactive
            ]}>
              {step.label}
            </Text>
          </View>

          {/* عرض الخط الفاصل بين الخطوات */}
          {index < steps.length - 1 && (
            <View style={[
              styles.stepLine,
              checkoutStep > index + 1 ? styles.stepLineActive : styles.stepLineInactive
            ]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );
};


  // حالة التحميل أثناء الطلب
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
          <ScreenHeader
          title="السلة"
            />
        {/* Modal الخطوات */}
        {isCheckoutModalVisible && (
  <Modal
    animationType="slide"
    transparent={true}
    visible={true}
    onRequestClose={() => setCheckoutModalVisible(false)}
  >
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <View style={styles.modalHeaderContent}>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => {
                Alert.alert(
                  'إلغاء الطلب',
                  'هل تريد إلغاء الطلب والخروج؟',
                  [
                    {
                      text: 'متابعة الطلب',
                      style: 'cancel',
                    },
                    {
                      text: 'نعم، إلغاء',
                      style: 'destructive',
                      onPress: () => setCheckoutModalVisible(false),
                    },
                  ]
                );
              }}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>
              {checkoutStep === 1 ? 'نوع الطلب' : 
               checkoutStep === 2 ? (orderType === 'delivery' ? 'عنوان التوصيل' : 'فرع الاستلام') : 
               'تفاصيل الطلب'}
            </Text>
            
            <View style={{ width: 40 }} />
          </View>
        </View>
                {/* Step Indicator */}
                {checkoutStep < 4 && renderStepIndicator()}

                <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                  {/* الخطوة 1: نوع الطلب */}
                  {checkoutStep === 1 && (
                    <View style={styles.stepContent}>
                      <View style={styles.sectionContainer}>
                        <Text style={styles.stepTitle}>اختر نوع الطلب</Text>
                        <OrderTypeSelector 
                          orderType={orderType} 
                          onTypeChange={handleOrderTypeChange} 
                        />
                      </View>
                    </View>
                  )}

                  {/* الخطوة 2: العنوان أو الفرع */}
                  {checkoutStep === 2 && (
                    <View style={styles.stepContent}>
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
                    </View>
                  )}

                  {/* الخطوة 3: الدفع والتأكيد */}
                  {checkoutStep === 3 && (
                    <View style={styles.stepContent}>
                      {/* ملخص الطلب */}
                      <View style={styles.sectionContainer}>
                        <View style={styles.sectionHeader}>
                          <Text style={styles.sectionTitle}>المنتجات ({items.length})</Text>
                        </View>
                        {items.map((item) => (
                          <View key={item.id} style={styles.reviewItem}>
                            <Image 
                              source={{ uri: item.product.images?.[0]?.image_url || 'https://dgplcadvneqpohxqlilg.supabase.co/storage/v1/object/public/menu_image/icon.png' }} 
                              style={styles.reviewItemImage} 
                            />
                            <View style={styles.reviewItemDetails}>
                              <Text style={styles.reviewItemName}>{item.product.name}</Text>
                              <Text style={styles.reviewItemQuantity}>الكمية: {item.quantity}</Text>
                            </View>
                            <Text style={styles.reviewItemPrice}>
                              {(item.totalPrice).toFixed(2)} ₪
                            </Text>
                          </View>
                        ))}
                      </View>

                      {/* تفاصيل التوصيل */}
                      <View style={styles.sectionContainer}>
                        <View style={styles.sectionHeader}>
                          <Ionicons name="time-outline" size={18} color="#C62828" />
                          <Text style={styles.sectionTitle}>تفاصيل التوصيل</Text>
                        </View>
                        <View style={styles.deliveryDetails}>
                          <View style={styles.deliveryRow}>
                            <Text style={styles.deliveryLabel}>العنوان</Text>
                            <View style={styles.deliveryValue}>
                              <Text style={styles.deliveryText}>
                                {orderType === 'delivery' 
                                  ? selectedAddress?.delivery_zones?.area_name 
                                  : selectedBranch?.name}
                              </Text>
                              <Text style={styles.deliverySubtext}>
                                {orderType === 'delivery' 
                                  ? `${selectedAddress?.delivery_zones?.city}, ${selectedAddress?.street_address}`
                                  : selectedBranch?.address}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.separator} />
                          <View style={styles.deliveryRow}>
                            <Text style={styles.deliveryLabel}>الوقت المتوقع</Text>
                            <View style={styles.deliveryTime}>
                              <Ionicons name="time-outline" size={16} color="#C62828" />
                              <Text style={styles.deliveryTimeText}>30-40 دقيقة</Text>
                            </View>
                          </View>
                        </View>
                      </View>

                      {/* طريقة الدفع */}
                      <View style={styles.sectionContainer}>
                        <View style={styles.sectionHeader}>
                          <Ionicons name="card-outline" size={18} color="#C62828" />
                          <Text style={styles.sectionTitle}>طريقة الدفع</Text>
                        </View>
                        <View style={styles.paymentMethod}>
                          <View style={styles.paymentIcon}>
                            <Ionicons name="wallet-outline" size={24} color="#22c55e" />
                          </View>
                          <View style={styles.paymentDetails}>
                            <Text style={styles.paymentMethodText}>الدفع عند الاستلام</Text>
                            <Text style={styles.paymentDescription}>ادفع عند استلام طلبك</Text>
                          </View>
                        </View>
                      </View>

                      {/* ملاحظات الطلب */}
                      <View style={styles.sectionContainer}>
                        <View style={styles.sectionHeader}>
                          <Text style={styles.sectionTitle}>ملاحظات إضافية (اختياري)</Text>
                        </View>
                        <View style={styles.notesInputContainer}>
                          <TextInput
                            style={styles.notesInput}
                            placeholder="أضف أي ملاحظات خاصة لطلبك..."
                            value={orderNotes}
                            onChangeText={setOrderNotes}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                          />
                        </View>
                      </View>

                      {/* كود الخصم */}
                      <View style={styles.sectionContainer}>
                        <View style={styles.sectionHeader}>
                          <Ionicons name="pricetag-outline" size={18} color="#C62828" />
                          <Text style={styles.sectionTitle}>كود الخصم</Text>
                        </View>
                        <View style={styles.promoContainer}>
                          <TextInput
                            style={styles.promoInput}
                            placeholder="أدخل كود الخصم"
                            value={promoCode}
                            onChangeText={setPromoCode}
                            editable={!promoApplied}
                          />
                          <TouchableOpacity
                            style={[
                              styles.promoButton,
                              (promoApplied || !promoCode) && styles.promoButtonDisabled
                            ]}
                            onPress={handleApplyPromo}
                            disabled={promoApplied || !promoCode}
                          >
                            <Text style={styles.promoButtonText}>
                              {promoApplied ? 'مطبق' : 'تطبيق'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                        {promoApplied && (
                          <View style={styles.promoSuccess}>
                            <MaterialIcons name="check-circle" size={16} color="#22c55e" />
                            <Text style={styles.promoSuccessText}>تم تطبيق كود الخصم! خصم 10%</Text>
                          </View>
                        )}
                      </View>

                      {/* ملخص السعر */}
                      <View style={styles.sectionContainer}>
                        <View style={styles.sectionHeader}>
                          <Text style={styles.sectionTitle}>ملخص الدفع</Text>
                        </View>
                        <View style={styles.priceSummary}>
                          <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>المجموع الفرعي</Text>
                            <Text style={styles.priceValue}>{subtotal.toFixed(2)} ₪</Text>
                          </View>
                          
                          {promoApplied && (
                            <View style={styles.priceRow}>
                              <Text style={[styles.priceLabel, styles.discountText]}>الخصم (10%)</Text>
                              <Text style={[styles.priceValue, styles.discountText]}>-{discount.toFixed(2)} ₪</Text>
                            </View>
                          )}
                          
                          {orderType === 'delivery' && (
                            <View style={styles.priceRow}>
                              <Text style={styles.priceLabel}>رسوم التوصيل</Text>
                              <Text style={styles.priceValue}>{deliveryPrice.toFixed(2)} ₪</Text>
                            </View>
                          )}
                          
                          <View style={styles.separator} />
                          
                          <View style={[styles.priceRow, styles.totalRow]}>
                            <Text style={styles.totalLabel}>المجموع الكلي</Text>
                            <Text style={styles.totalPrice}>{finalTotal.toFixed(2)} ₪</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  )}
                </ScrollView>

<View style={styles.modalActions}>
  <View style={styles.navigationButtons}>
    {checkoutStep > 1 && (
      <TouchableOpacity
        style={styles.backButtonModal}
        onPress={() => setCheckoutStep(checkoutStep - 1)}
      >
        <Text style={styles.backButtonText}>رجوع</Text>
      </TouchableOpacity>
    )}

    <TouchableOpacity
      style={[
        styles.continueButton,
        // إذا لم يكن هناك زر رجوع، اجعل هذا الزر يملأ المساحة
        checkoutStep === 1 && { flex: 1 }, 
        // شروط تعطيل الزر
        (checkoutStep === 1 && !orderType) && styles.continueButtonDisabled,
        (checkoutStep === 2 && orderType === 'delivery' && !selectedAddress) && styles.continueButtonDisabled,
        (checkoutStep === 2 && orderType === 'pickup' && !selectedBranch) && styles.continueButtonDisabled,
      ]}
      disabled={
        (checkoutStep === 1 && !orderType) ||
        (checkoutStep === 2 && orderType === 'delivery' && !selectedAddress) ||
        (checkoutStep === 2 && orderType === 'pickup' && !selectedBranch)
      }
      onPress={() => {
        if (checkoutStep < 3) {
          setCheckoutStep(checkoutStep + 1);
        } else {
          handleCheckout();
        }
      }}
    >
      {checkoutStep === 3 ? (
        isPlacingOrder ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <View style={styles.placeOrderContent}>
            <Ionicons name="receipt-outline" size={20} color="#fff" />
            <Text style={styles.placeOrderText}>تأكيد الطلب</Text>
          </View>
        )
      ) : (
        <View style={styles.continueContent}>
          <Text style={styles.continueText}>متابعة</Text>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </View>
      )}
    </TouchableOpacity>
  </View>
</View>

              </View>
            </View>
          </Modal>
        )}

        {/* المحتوى الرئيسي */}
        {!isCheckoutModalVisible && (
          <>
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
              ListHeaderComponent={ListHeaderComponent}
              ListEmptyComponent={listEmptyComponent}
              ListFooterComponent={items.length > 0 ? <View style={{ height: 100 }} /> : null}
              showsVerticalScrollIndicator={false}
            />
            
            {items.length > 0 && (
              <View style={styles.footer}>
                <View style={styles.footerContent}>
                  <View style={styles.priceSummaryFooter}>
                    <View style={[styles.priceRow, styles.totalRow]}>
                      <Text style={styles.totalLabel}>المجموع الكلي</Text>
                      <Text style={styles.totalPrice}>{finalTotal.toFixed(2)} ₪</Text>
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
                    <Ionicons name="chevron-forward" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}
      </SafeAreaView>
      <CustomBottomNav />
    </View>
  );
}


const styles = StyleSheet.create({
  // --- الأنماط العامة ---
  fullScreen: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  safeArea: {
    flex: 1,
  },
  separator: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 12,
  },

  // --- الهيدر الرئيسي ---
  header: {
    // لا نحدد ارتفاعاً هنا، سنجعله يعتمد على المحتوى
    position: 'relative',
    backgroundColor: '#C62828', // لون هيدر السلة
    borderBottomLeftRadius: 30, // يمكنك استخدام scale(40) إذا قمت باستيرادها
    borderBottomRightRadius: 30,
  },
  headerContent: {
    paddingHorizontal: 16,
    paddingBottom: 20, // حشوة سفلية معقولة
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
  },
  headerText: {
    // هذا الجزء سيتم وضعه في المنتصف
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center', // لتوسيط المحتوى الداخلي
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Cairo-Bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Cairo-Regular',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  stepBadge: {
    backgroundColor: '#fbbf24',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  stepBadgeText: {
    fontSize: 12,
    fontFamily: 'Cairo-Bold',
    color: '#92400e',
  },

  // --- النافذة المنبثقة (Modal / Wizard) ---
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#f8fafc',
    marginTop: 50,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalScrollView: {
    flex: 1,
  },

  // --- مؤشر الخطوات (Step Indicator) - تصميم جديد ---
 stepIndicator: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center', // ✨ إصلاح: التوسيط بدلاً من التوزيع
  paddingHorizontal: 20,
  paddingVertical: 24,
  backgroundColor: '#fff',
},
stepItem: {
  alignItems: 'center', // ✨ إصلاح: لا يحتاج إلى flex: 1
},
  stepContent: {
  paddingVertical: 24, // ✨ إصلاح: يضيف مساحة عمودية فقط
  
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    marginBottom: 8,
  },
  stepCircleActive: {
    backgroundColor: '#C62828',
    borderColor: '#C62828',
  },
  stepCircleInactive: {
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
  },
  stepNumber: {
    fontSize: 16,
    fontFamily: 'Cairo-Bold',
  },
  stepNumberActive: {
    color: '#fff',
  },
  stepNumberInactive: {
    color: '#9ca3af',
  },
  stepLabel: {
    fontSize: 12,
    fontFamily: 'Cairo-SemiBold',
    marginTop: 4,
  },
  stepLabelActive: {
    color: '#1f2937',
  },
  stepLabelInactive: {
    color: '#9ca3af',
  },
  stepLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 8,
    marginTop: -25,
  },
  stepLineActive: {
    backgroundColor: '#C62828',
  },
  stepLineInactive: {
    backgroundColor: '#e5e7eb',
  },

  // --- الأقسام داخل النافذة ---
  stepContentContainer: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 20,
    fontFamily: 'Cairo-Bold',
    color: '#1f2937',
    marginBottom: 20,
  },
  sectionContainer: {
  backgroundColor: '#fff',
  borderRadius: 16,
  padding: 20,
  marginBottom: 16,
  marginHorizontal: 16, // ✨ إصلاح: إضافة هوامش أفقية للتحكم بالعرض
  shadowColor: '#000',
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 4,
  borderWidth: 0,
},

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Cairo-Bold',
    color: '#1f2937',
    marginLeft: 8,
  },

  // --- اختيار نوع الطلب - تصميم جديد ---
  orderTypeContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 4,
    gap: 8,
  },
  orderTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  orderTypeActive: {
    backgroundColor: '#C62828',
    borderColor: '#C62828',
    shadowColor: '#C62828',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  orderTypeText: {
    fontSize: 16,
    fontFamily: 'Cairo-SemiBold',
    marginLeft: 8,
    color: '#6b7280',
  },
  orderTypeTextActive: {
    color: '#fff',
  },

  // --- اختيار العنوان/الفرع - تصميم جديد ---
  locationOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#f3f4f6',
    marginBottom: 12,
  },
  locationOptionSelected: {
    borderColor: '#C62828',
    backgroundColor: '#fef2f2',
  },
  radioContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  radioSelected: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#C62828',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioUnselected: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  addressIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  branchIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pickupIcon: {
    backgroundColor: '#f0f9ff',
  },
  addressTextContainer: {
    flex: 1,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  addressLabel: {
    fontSize: 16,
    fontFamily: 'Cairo-SemiBold',
    color: '#1f2937',
  },
  addressDetails: {
    fontSize: 14,
    fontFamily: 'Cairo-Regular',
    color: '#6b7280',
    marginBottom: 2,
    lineHeight: 20,
  },
  addressPhone: {
    fontSize: 14,
    fontFamily: 'Cairo-Regular',
    color: '#6b7280',
    marginBottom: 4,
  },
  deliveryPrice: {
    fontSize: 12,
    fontFamily: 'Cairo-SemiBold',
    color: '#22c55e',
  },
  selectionWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f59e0b',
    marginBottom: 16,
  },
  selectionWarningText: {
    fontSize: 14,
    fontFamily: 'Cairo-SemiBold',
    color: '#d97706',
    marginLeft: 8,
  },
  noAddressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderStyle: 'dashed',
  },
  noAddressText: {
    fontSize: 14,
    fontFamily: 'Cairo-SemiBold',
    color: '#d97706',
    marginLeft: 8,
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#C62828',
    borderStyle: 'dashed',
    backgroundColor: '#fef2f2',
  },
  addAddressText: {
    fontSize: 16,
    fontFamily: 'Cairo-SemiBold',
    color: '#C62828',
    marginLeft: 8,
  },

  // --- أنماط عناصر السلة - تصميم جديد ---
cartItemContainer: {
  backgroundColor: '#fff',
  borderRadius: 20,
  padding: 16,
  marginBottom: 14,
  flexDirection: 'row',
  alignItems: 'flex-start',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.08,
  shadowRadius: 6,
  elevation: 3,
},
  deleteButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
itemImage: {
  width: 70,
  height: 70,
  borderRadius: 12,
  marginRight: 12,
  backgroundColor: '#f3f4f6',
},
itemDetails: {
  flex: 1,
  justifyContent: 'flex-start',
},
itemName: {
  fontSize: 15,
  fontFamily: 'Cairo-Bold',
  color: '#1f2937',
  marginBottom: 4,
},
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    gap: 4,
  },
optionBadge: {
  backgroundColor: '#f3f4f6',
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 6,
  marginRight: 6,
},
  optionText: {
    fontSize: 12,
    fontFamily: 'Cairo-Regular',
    color: '#6b7280',
  },
additionalPiecesContainer: {
  backgroundColor: '#FFFBEB', // لون أصفر فاتح جدًا
  borderRadius: 12,
  borderWidth: 1,
  borderColor: '#FEF3C7', // حدود صفراء باهتة
  padding: 12,
  marginTop: 12, // مسافة فوق الحاوية
  alignSelf: 'stretch', // تأكد من أنها تمتد
},
additionalPiecesHeader: {
  flexDirection: 'row-reverse', // أيقونة يمين، نص يسار
  alignItems: 'center',
  marginBottom: 10,
},
additionalPiecesTitle: {
    fontSize: 12,
    fontFamily: 'Cairo-SemiBold',
    color: '#854d0e',
    marginLeft: 4,
  },
 additionalPiecesFlexRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  additionalPieceFlexCard: {
    backgroundColor: '#fef9c3',
    borderWidth: 1,
    borderColor: '#fde047',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    // القيم الافتراضية
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 'auto',
  },

  additionalPieceText: {
    fontSize: 12,
    fontFamily: 'Cairo-Regular',
    color: '#854d0e',
  },
  additionalPiecePrice: {
    fontSize: 12,
    fontFamily: 'Cairo-SemiBold',
    color: '#22c55e',
  },
  //-----------------
  
  //-----------------
  notesText: {
    fontSize: 12,
    fontFamily: 'Cairo-Regular',
    color: '#6b7280',
    fontStyle: 'italic',
  },
itemActions: {
  alignItems: 'center', // ✨ إصلاح: محاذاة الكمية والسعر للمركز
  justifyContent: 'space-between', // ✨ إصلاح: توزيع المسافة بين الكمية والسعر
  alignSelf: 'stretch', // ✨ إصلاح: اجعله يمتد عمودياً
  paddingRight: 8, // ✨ إصلاح: إضافة مسافة على اليسار
},
quantitySelector: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#f3f4f6',
  borderRadius: 20,
  paddingHorizontal: 6,
  paddingVertical: 4,
  alignSelf: 'center',
},
quantityButton: {
  width: 28,
  height: 28,
  borderRadius: 14,
  justifyContent: 'center',
  alignItems: 'center',
},
quantityButtonPlus: {
  backgroundColor: '#C62828',
},
quantityText: {
  fontSize: 14,
  fontFamily: 'Cairo-Bold',
  color: '#1f2937',
  marginHorizontal: 10,
},
itemPriceText: {
  fontSize: 15,
  fontFamily: 'Cairo-Bold',
  color: '#C62828',
  marginTop: 8,
  textAlign: 'center',
},


  // --- أنماط القائمة ---
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: '30%',
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Cairo-SemiBold',
    color: '#9ca3af',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Cairo-Regular',
    color: '#9ca3af',
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: '#C62828',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
  },
  browseButtonText: {
    fontSize: 16,
    fontFamily: 'Cairo-Bold',
    color: '#fff',
  },

  // --- الفوتر الرئيسي ---
  footer: {
    position: 'absolute',
    bottom: 85,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  footerContent: {
    padding: 20,
  },
  priceSummaryFooter: {
    marginBottom: 16,
  },
checkoutButton: {
  backgroundColor: '#C62828',
  paddingVertical: 14,
  borderRadius: 12,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  marginHorizontal: 16,
  marginTop: 12,
  shadowColor: '#C62828',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.25,
  shadowRadius: 8,
  elevation: 6,
},

checkoutButtonText: {
  fontSize: 16,
  fontFamily: 'Cairo-Bold',
  color: '#fff',
  marginLeft: 6,
},

  // --- أزرار التنقل في النافذة - تصميم جديد ---
modalActions: {
  padding: 16, // ✨ تحسين: توحيد الحشوة الأفقية مع باقي الأقسام
  paddingBottom: Platform.OS === 'ios' ? 34 : 20, // ✨ تحسين: زيادة المساحة الآمنة للأسفل
  borderTopWidth: 1,
  borderTopColor: '#f3f4f6', // ✨ تحسين: لون أفتح للخط الفاصل
  backgroundColor: '#fff',
},

  navigationButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  backButtonModal: {
  flex: 1,
  paddingVertical: 16, // ✨ تحسين: استخدام padding عمودي فقط
  borderRadius: 16, // ✨ تحسين: زيادة انحناء الزوايا
  backgroundColor: '#f3f4f6', // ✨ تحسين: لون خلفية مميز ومحايد
  alignItems: 'center',
  borderWidth: 0, // ✨ تحسين: إزالة الحدود
},
backButtonText: {
  fontSize: 16,
  fontFamily: 'Cairo-Bold',
  color: '#4b5563', // ✨ تحسين: لون أغمق قليلاً للوضوح
},

continueButton: {
  flex: 2.5, // ✨ تحسين: جعله أكبر نسبةً لزر الرجوع
  paddingVertical: 16, // ✨ تحسين: استخدام padding عمودي
  borderRadius: 16, // ✨ تحسين: زيادة انحناء الزوايا ليتطابق مع زر الرجوع
  backgroundColor: '#C62828',
  alignItems: 'center',
  // الظل يبقى كما هو، فهو ممتاز
  shadowColor: '#C62828',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 6,
},
  continueButtonDisabled: {
    backgroundColor: '#d1d5db',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
continueText: {
  fontSize: 17, // ✨ تحسين: تكبير الخط قليلاً
  fontFamily: 'Cairo-Bold',
  color: '#fff',
  marginRight: 8,
},
  placeOrderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  placeOrderText: {
    fontSize: 16,
    fontFamily: 'Cairo-Bold',
    color: '#fff',
    marginLeft: 8,
  },

  // --- أنماط الخطوة 3 (المراجعة والدفع) - تصميم جديد ---
  reviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  reviewItemImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
    marginRight: 12,
  },
  reviewItemDetails: {
    flex: 1,
  },
  reviewItemName: {
    fontSize: 14,
    fontFamily: 'Cairo-SemiBold',
    color: '#1f2937',
    marginBottom: 4,
  },
  reviewItemQuantity: {
    fontSize: 12,
    fontFamily: 'Cairo-Regular',
    color: '#6b7280',
  },
  reviewItemPrice: {
    fontSize: 14,
    fontFamily: 'Cairo-SemiBold',
    color: '#C62828',
  },
  deliveryDetails: {},
  deliveryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  deliveryLabel: {
    fontSize: 14,
    fontFamily: 'Cairo-Regular',
    color: '#6b7280',
    flex: 1,
  },
  deliveryValue: {
    flex: 2,
    alignItems: 'flex-end',
  },
  deliveryText: {
    fontSize: 14,
    fontFamily: 'Cairo-SemiBold',
    color: '#1f2937',
    marginBottom: 2,
  },
  deliverySubtext: {
    fontSize: 12,
    fontFamily: 'Cairo-Regular',
    color: '#6b7280',
  },
  deliveryTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryTimeText: {
    fontSize: 14,
    fontFamily: 'Cairo-SemiBold',
    color: '#C62828',
    marginLeft: 4,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#dcfce7',
  },
  paymentIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentDetails: {
    flex: 1,
  },
  paymentMethodText: {
    fontSize: 16,
    fontFamily: 'Cairo-SemiBold',
    color: '#1f2937',
    marginBottom: 2,
  },
  paymentDescription: {
    fontSize: 12,
    fontFamily: 'Cairo-Regular',
    color: '#6b7280',
  },
  notesInputContainer: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
  },
  notesInput: {
    fontSize: 14,
    fontFamily: 'Cairo-Regular',
    color: '#1f2937',
    textAlignVertical: 'top',
    minHeight: 80,
  },
promoContainer: {
  backgroundColor: '#fff',
  borderRadius: 16,
  padding: 16,
  marginHorizontal: 16,
  marginTop: 10,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
},
promoInput: {
  flex: 1,
  borderWidth: 1,
  borderColor: '#e5e7eb',
  borderRadius: 12,
  padding: 12,
  fontSize: 14,
  fontFamily: 'Cairo-Regular',
  color: '#1f2937',
  backgroundColor: '#fff',
},
promoButton: {
  backgroundColor: '#C62828',
  paddingHorizontal: 16,
  borderRadius: 10,
  justifyContent: 'center',
  alignItems: 'center',
},
  promoButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
promoButtonText: {
  fontSize: 14,
  fontFamily: 'Cairo-Bold',
  color: '#fff',
},
  promoSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dcfce7',
    marginTop: 8,
  },
  promoSuccessText: {
    fontSize: 12,
    fontFamily: 'Cairo-SemiBold',
    color: '#22c55e',
    marginLeft: 8,
  },
  priceSummary: {
  backgroundColor: '#fff',
  borderRadius: 16,
  padding: 16,
  marginHorizontal: 16,
  marginTop: 12,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 3,
},
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 14,
    fontFamily: 'Cairo-Regular',
    color: '#6b7280',
  },
  priceValue: {
    fontSize: 14,
    fontFamily: 'Cairo-SemiBold',
    color: '#374151',
  },
  discountText: {
    color: '#22c55e',
  },

totalRow: {
  borderTopWidth: 1,
  borderTopColor: '#f3f4f6',
  paddingTop: 12,
  marginTop: 8,
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
},
totalLabel: {
  fontSize: 16,
  fontFamily: 'Cairo-Bold',
  color: '#1f2937',
},
totalPrice: {
  fontSize: 18,
  fontFamily: 'Cairo-Bold',
  color: '#C62828',
},

  // --- شاشة التحميل ---
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

  // --- أنماط إضافية جديدة ---
  stepContentWrapper: {
    padding: 20,
  },
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  gradientButton: {
    backgroundColor: '#C62828',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  }, modalHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFF',
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Cairo-Bold',
    color: '#1F2937',
    textAlign: 'center',
  },
});