// مسار الملف: app/order/[orderId].tsx

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity, Image, Animated } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MenuItemImage, OptionGroup } from '@/lib/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

// =================================================================
// ✅ دوال الـ Caching لتفاصيل الطلب - تم تقليل المدة
// =================================================================
const CACHE_KEYS = {
  ORDER_DETAILS: 'order_details'
};

const CACHE_DURATION = 1000 * 60 * 2; // 2 دقائق فقط بدلاً من 15

const cacheOrderData = async (orderId: string, data: any) => {
  try {
    const cacheItem = { data, timestamp: Date.now() };
    await AsyncStorage.setItem(`${CACHE_KEYS.ORDER_DETAILS}_${orderId}`, JSON.stringify(cacheItem));
    console.log(`✅ Order ${orderId} cached`);
  } catch (error) {
    console.error('❌ Error caching order data:', error);
  }
};

const getCachedOrderData = async (orderId: string) => {
  try {
    const cached = await AsyncStorage.getItem(`${CACHE_KEYS.ORDER_DETAILS}_${orderId}`);
    if (!cached) {
      console.log(`📭 No cache found for order: ${orderId}`);
      return null;
    }
    const cacheItem = JSON.parse(cached);
    const isExpired = Date.now() - cacheItem.timestamp > CACHE_DURATION;
    if (isExpired) {
      console.log(`🕐 Cache expired for order: ${orderId}`);
      await AsyncStorage.removeItem(`${CACHE_KEYS.ORDER_DETAILS}_${orderId}`);
      return null;
    }
    console.log(`✅ Using cached data for order: ${orderId}`);
    return cacheItem.data;
  } catch (error) {
    console.error('❌ Error getting cached order data:', error);
    return null;
  }
};

// =================================================================
// ✅ واجهات البيانات المحدثة
// =================================================================
interface AdditionalPiece {
  type: string;
  name: string;
  quantity: number;
  price: number;
}

interface OrderDetails {
  id: number;
  created_at: string;
  total_price: number;
  subtotal: number;
  delivery_price: number;
  status: string;
  order_type: 'delivery' | 'pickup';
  user_addresses: { street_address: string; delivery_zones: { city: string; area_name: string; } | null; } | null;
  branches: { name: string; address: string; } | null;
  order_items: {
    quantity: number;
    notes: string | null;
    options: Record<string, any>;
    additional_pieces: AdditionalPiece[] | null;
    menu_items: {
      name: string;
      options: OptionGroup[] | null;
      images: MenuItemImage[] | null;
    } | null;
  }[];
}

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

// =================================================================
// ✅ مكونات فرعية مع React.memo
// =================================================================
const StatusTracker = React.memo(({ currentStatus, orderType }: { currentStatus: string; orderType: 'delivery' | 'pickup' }) => {
  const statuses = useMemo(() => 
    orderType === 'delivery' 
      ? ['new', 'processing', 'ready', 'delivered']
      : ['new', 'processing', 'ready', 'collected'],
    [orderType]
  );

  const currentIndex = useMemo(() => 
    statuses.indexOf(currentStatus.toLowerCase()),
    [currentStatus, statuses]
  );

  const getStatusInfo = useCallback((status: string): { label: string; icon: IoniconName } => {
    switch (status) {
      case 'new': return { label: 'جديد', icon: 'receipt-outline' };
      case 'processing': return { label: 'يُحضّر', icon: 'hourglass-outline' };
      case 'ready': return { label: 'جاهز', icon: orderType === 'delivery' ? 'bicycle-outline' : 'storefront-outline' };
      case 'delivered': return { label: 'تم التوصيل', icon: 'checkmark-done-circle-outline' };
      case 'collected': return { label: 'تم الاستلام', icon: 'checkmark-done-circle-outline' };
      default: return { label: 'غير معروف', icon: 'help-circle-outline' };
    }
  }, [orderType]);

  return (
    <View style={styles.trackerContainer}>
      {statuses.map((status, index) => {
        const isActive = index <= currentIndex;
        const info = getStatusInfo(status);
        return (
          <React.Fragment key={status}>
            <View style={styles.stepContainer}>
              <View style={[styles.stepIconContainer, isActive && styles.stepIconActive]}>
                <Ionicons name={info.icon} size={24} color={isActive ? '#fff' : '#9CA3AF'} />
              </View>
              <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]}>{info.label}</Text>
            </View>
            {index < statuses.length - 1 && <View style={[styles.connector, isActive && styles.connectorActive]} />}
          </React.Fragment>
        );
      })}
    </View>
  );
});

// ✅ مكون جديد لعرض القطع الإضافية
const AdditionalPiecesDisplay = React.memo(({ additionalPieces }: { additionalPieces: AdditionalPiece[] }) => {
  if (!additionalPieces || additionalPieces.length === 0) {
    return null;
  }

  return (
    <View style={styles.additionalPiecesContainer}>
      <Text style={styles.additionalPiecesTitle}>القطع الإضافية:</Text>
      {additionalPieces.map((piece, index) => (
        <View key={index} style={styles.additionalPieceRow}>
          <Text style={styles.additionalPieceText}>
            + {piece.quantity} × {piece.name}
          </Text>
          <Text style={styles.additionalPiecePrice}>
            ₪{(piece.price * piece.quantity).toFixed(2)}
          </Text>
        </View>
      ))}
    </View>
  );
});

const OrderItem = React.memo(({ item }: { item: OrderDetails['order_items'][0] }) => {
  if (!item.menu_items) return null;

  const optionLabels = useMemo(() => {
    if (!item.menu_items?.options || !Array.isArray(item.menu_items.options)) {
      return '';
    }

    return Object.entries(item.options).map(([groupId, value]) => {
      const group = item.menu_items!.options!.find(g => g.id === groupId);
      const optionValue = group?.values.find(v => v.value === value);
      return optionValue ? optionValue.label : null;
    }).filter(Boolean).join('، ');
  }, [item.options, item.menu_items?.options]);

  const imageUrl = useMemo(() => 
    item.menu_items?.images && item.menu_items.images.length > 0
      ? item.menu_items.images[0].image_url
      : 'https://dgplcadvneqpohxqlilg.supabase.co/storage/v1/object/public/menu_image/icon.png',
    [item.menu_items?.images]
  );

  return (
    <View style={styles.itemContainer}>
      <Image source={{ uri: imageUrl }} style={styles.itemImage} />
      <View style={styles.itemDetails}>
        <Text style={styles.itemName}>{item.quantity}x {item.menu_items.name}</Text>
        {optionLabels.length > 0 && <Text style={styles.optionsText}>{optionLabels}</Text>}
        
        {/* ✅ إضافة عرض القطع الإضافية */}
        <AdditionalPiecesDisplay additionalPieces={item.additional_pieces || []} />
        
        {item.notes && <Text style={styles.notesText}>ملاحظات: {item.notes}</Text>}
      </View>
    </View>
  );
});

// =================================================================
// ✅ المكون الرئيسي المحسن مع Real-time Updates
// =================================================================
export default function OrderDetailsScreen() {
  const { orderId } = useLocalSearchParams();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchOrderDetails = useCallback(async () => {
    if (!orderId) return;
    
    setLoading(true);
    setError(null);

    try {
      const cachedOrder = await getCachedOrderData(orderId as string);
      
      if (cachedOrder) {
        setOrder(cachedOrder);
        Animated.timing(fadeAnim, { 
          toValue: 1, 
          duration: 500, 
          useNativeDriver: true 
        }).start();
        setLoading(false);
        return;
      }

      // ✅ تحديث الاستعلام ليشمل additional_pieces
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id, created_at, total_price, subtotal, delivery_price, status, order_type,
          user_addresses(street_address, delivery_zones(city, area_name)),
          branches(name, address),
          order_items(
            quantity, notes, options, additional_pieces,
            menu_items(name, options, images:menu_item_images(image_url, display_order))
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;

      if (data) {
        const orderData = data as unknown as OrderDetails;
        setOrder(orderData);
        
        await cacheOrderData(orderId as string, orderData);
        
        Animated.timing(fadeAnim, { 
          toValue: 1, 
          duration: 500, 
          useNativeDriver: true 
        }).start();
      }
    } catch (error: any) {
      const errorMessage = "فشل في تحميل تفاصيل الطلب. تأكد من اتصال الإنترنت.";
      setError(errorMessage);
      console.error('Error fetching order details:', error.message);
      
      const cachedOrder = await getCachedOrderData(orderId as string);
      if (cachedOrder) {
        setOrder(cachedOrder);
      }
    } finally {
      setLoading(false);
    }
  }, [orderId, fadeAnim]);

  // ✅ Real-time Subscription للتحديثات التلقائية
  useEffect(() => {
    if (!orderId) return;

    console.log('🔔 Setting up real-time subscription for order:', orderId);

    const channel = supabase
      .channel(`order:${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`
        },
        async (payload) => {
          console.log('🔄 Real-time update received:', payload.new);
          
          // تحديث حالة الطلب فوراً
          setOrder(prev => {
            if (!prev) return null;
            
            const updatedOrder = {
              ...prev,
              ...payload.new
            };
            
            // تحديثثث الكاش بالبيانات الجديدة
            cacheOrderData(orderId as string, updatedOrder);
            
            return updatedOrder;
          });
        }
      )
      .subscribe((status) => {
        console.log('📡 Subscription status:', status);
      });

    return () => {
      console.log('🧹 Cleaning up real-time subscription');
      channel.unsubscribe();
    };
  }, [orderId]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  const handleBack = useCallback(() => {
    router.navigate('/(tabs)/orders');
  }, [router]);

  const handleRetry = useCallback(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  const formattedDate = useMemo(() => {
    if (!order) return '';
    return new Date(order.created_at).toLocaleDateString('ar-EG', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }, [order?.created_at]);

  // ✅ دالة مساعدة لحساب مجموع القطع الإضافية
  const calculateAdditionalPiecesTotal = useCallback((orderItems: OrderDetails['order_items']) => {
    return orderItems.reduce((total, item) => {
      if (item.additional_pieces) {
        return total + item.additional_pieces.reduce((sum, piece) => 
          sum + (piece.price * piece.quantity), 0
        );
      }
      return total;
    }, 0);
  }, []);

  const additionalPiecesTotal = useMemo(() => 
    order ? calculateAdditionalPiecesTotal(order.order_items) : 0,
    [order, calculateAdditionalPiecesTotal]
  );

  const renderAddress = useCallback(() => {
    if (!order) return null;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons 
            name={order.order_type === 'delivery' ? 'location-outline' : 'storefront-outline'} 
            size={22} 
            color="#C62828" 
          />
          <Text style={styles.cardTitle}>
            {order.order_type === 'delivery' ? 'عنوان التوصيل' : 'فرع الاستلام'}
          </Text>
        </View>
        <View style={styles.cardContent}>
          {order.order_type === 'delivery' && order.user_addresses ? (
            <>
              <Text style={styles.infoTextBold}>
                {`${order.user_addresses.delivery_zones?.city} - ${order.user_addresses.delivery_zones?.area_name}`}
              </Text>
              <Text style={styles.infoText}>
                {order.user_addresses.street_address}
              </Text>
            </>
          ) : order.order_type === 'pickup' && order.branches ? (
            <>
              <Text style={styles.infoTextBold}>{order.branches.name}</Text>
              <Text style={styles.infoText}>{order.branches.address}</Text>
            </>
          ) : <Text style={styles.infoText}>غير محدد</Text>}
        </View>
      </View>
    );
  }, [order]);

  const renderItems = useCallback(() => {
    if (!order) return null;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="fast-food-outline" size={22} color="#C62828" />
          <Text style={styles.cardTitle}>المنتجات</Text>
        </View>
        <View style={styles.cardContent}>
          {order.order_items.map((item, index) => (
            <OrderItem key={index} item={item} />
          ))}
        </View>
      </View>
    );
  }, [order]);

  const renderSummary = useCallback(() => {
    if (!order) return null;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="wallet-outline" size={22} color="#C62828" />
          <Text style={styles.cardTitle}>ملخص السعر</Text>
        </View>
        <View style={styles.cardContent}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>المجموع الفرعي</Text>
            <Text style={styles.priceValue}>{order.subtotal.toFixed(2)} ₪</Text>
          </View>
          
          {/* ✅ عرض مجموع القطع الإضافية إذا كان أكبر من صفر */}
          {additionalPiecesTotal > 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>القطع الإضافية</Text>
              <Text style={styles.priceValue}>{additionalPiecesTotal.toFixed(2)} ₪</Text>
            </View>
          )}
          
          {order.order_type === 'delivery' && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>سعر التوصيل</Text>
              <Text style={styles.priceValue}>{order.delivery_price.toFixed(2)} ₪</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>المجموع الكلي</Text>
            <Text style={styles.totalPrice}>{order.total_price.toFixed(2)} ₪</Text>
          </View>
        </View>
      </View>
    );
  }, [order, additionalPiecesTotal]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#C62828" />
        <Text style={styles.loadingText}>جاري تحميل تفاصيل الطلب...</Text>
      </View>
    );
  }

  if (error && !order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>تفاصيل الطلب</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#C62828" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>لم يتم العثور على الطلب.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleBack}>
          <Text style={styles.retryButtonText}>العودة</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تفاصيل الطلب</Text>
        <View style={{ width: 40 }} />
      </View>

      <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.scrollHeader}>
            <Text style={styles.scrollHeaderTitle}>طلب #{order.id}</Text>
            <Text style={styles.scrollHeaderSubtitle}>{formattedDate}</Text>
          </View>

          <StatusTracker currentStatus={order.status} orderType={order.order_type} />
          {renderAddress()}
          {renderItems()}
          {renderSummary()}
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

// =================================================================
// ✅ التنسيقات المحدثة مع إضافة تنسيقات القطع الإضافية
// =================================================================
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F5F5F5' 
  },
  centered: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    fontFamily: 'Cairo-Regular',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: { 
    fontSize: 18, 
    color: '#666', 
    fontFamily: 'Cairo-Regular',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#C62828',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Cairo-Bold',
  },
  scrollContainer: { 
    paddingHorizontal: 16, 
    paddingBottom: 40 
  },
  backButton: { 
    padding: 8 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    backgroundColor: '#fff', 
    borderBottomWidth: 1, 
    borderBottomColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerTitle: { 
    fontSize: 20, 
    fontFamily: 'Cairo-Bold', 
    color: '#1A1A1A' 
  },
  scrollHeader: { 
    paddingVertical: 20, 
    alignItems: 'center' 
  },
  scrollHeaderTitle: { 
    fontSize: 28, 
    fontFamily: 'Cairo-Bold', 
    color: '#1F2937' 
  },
  scrollHeaderSubtitle: { 
    fontSize: 16, 
    fontFamily: 'Cairo-Regular', 
    color: '#6B7280', 
    marginTop: 4 
  },
  trackerContainer: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    justifyContent: 'space-between', 
    marginBottom: 24 
  },
  stepContainer: { 
    alignItems: 'center', 
    flex: 1 
  },
  stepIconContainer: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    backgroundColor: '#E5E7EB', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  stepIconActive: { 
    backgroundColor: '#16A34A' 
  },
  stepLabel: { 
    marginTop: 8, 
    fontSize: 12, 
    fontFamily: 'Cairo-SemiBold', 
    color: '#9CA3AF', 
    textAlign: 'center' 
  },
  stepLabelActive: { 
    color: '#16A34A' 
  },
  connector: { 
    flex: 1, 
    height: 4, 
    backgroundColor: '#E5E7EB', 
    marginTop: 22 
  },
  connectorActive: { 
    backgroundColor: '#16A34A' 
  },
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    marginBottom: 16, 
    overflow: 'hidden', 
    elevation: 2, 
    shadowColor: '#000', 
    shadowOpacity: 0.08, 
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: { 
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F3F4F6' 
  },
  cardTitle: { 
    fontSize: 18, 
    fontFamily: 'Cairo-Bold', 
    color: '#1F2937', 
    marginStart: 8 
  },
  cardContent: { 
    padding: 16 
  },
  infoTextBold: { 
    fontSize: 16, 
    fontFamily: 'Cairo-SemiBold', 
    color: '#374151', 
    textAlign: 'right' 
  },
  infoText: { 
    fontSize: 14, 
    fontFamily: 'Cairo-Regular', 
    color: '#6B7280', 
    marginTop: 4, 
    textAlign: 'right' 
  },
  itemContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  itemImage: { 
    width: 60, 
    height: 60, 
    borderRadius: 12, 
    backgroundColor: '#F3F4F6' 
  },
  itemDetails: { 
    flex: 1, 
    marginStart: 12, 
    alignItems: 'flex-start' 
  },
  itemName: { 
    fontSize: 16, 
    fontFamily: 'Cairo-SemiBold', 
    color: '#374151' 
  },
  optionsText: { 
    fontSize: 13, 
    fontFamily: 'Cairo-Regular', 
    color: '#6B7280', 
    marginTop: 2, 
    textAlign: 'right' 
  },
  notesText: { 
    fontSize: 13, 
    fontFamily: 'Cairo-Regular', 
    color: '#9CA3AF', 
    fontStyle: 'italic', 
    marginTop: 2, 
    textAlign: 'right' 
  },
  // ✅ تنسيقات جديدة للقطع الإضافية
  additionalPiecesContainer: {
    marginTop: 8,
    paddingStart: 8,
    borderStartWidth: 2,
    borderStartColor: '#10B981',
  },
  additionalPiecesTitle: {
    fontSize: 12,
    fontFamily: 'Cairo-SemiBold',
    color: '#10B981',
    marginBottom: 4,
  },
  additionalPieceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  additionalPieceText: {
    fontSize: 12,
    fontFamily: 'Cairo-Regular',
    color: '#059669',
  },
  additionalPiecePrice: {
    fontSize: 11,
    fontFamily: 'Cairo-SemiBold',
    color: '#059669',
  },
  priceRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 8 
  },
  priceLabel: { 
    fontSize: 16, 
    fontFamily: 'Cairo-Regular', 
    color: '#4B5563' 
  },
  priceValue: { 
    fontSize: 16, 
    fontFamily: 'Cairo-SemiBold', 
    color: '#1F2937' 
  },
  totalRow: { 
    borderTopWidth: 1, 
    borderTopColor: '#F3F4F6', 
    marginTop: 8, 
    paddingTop: 14 
  },
  totalLabel: { 
    fontSize: 18, 
    fontFamily: 'Cairo-Bold', 
    color: '#111827' 
  },
  totalPrice: { 
    fontSize: 22, 
    fontFamily: 'Cairo-Bold', 
    color: '#C62828' 
  },
});