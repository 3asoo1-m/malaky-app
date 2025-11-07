// مسار الملف: app/order/[orderId].tsx

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity, 
  Image, 
  Animated 
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // ✅ تم التأكد من وجوده
import { Ionicons } from '@expo/vector-icons';
import { MenuItemImage, OptionGroup } from '@/lib/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

// =================================================================
// ✅ دوال الـ Caching (تبقى كما هي)
// =================================================================
const CACHE_KEYS = {
  ORDER_DETAILS: 'order_details'
};
const CACHE_DURATION = 1000 * 60 * 2; // 2 دقائق

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
    if (!cached) return null;
    const cacheItem = JSON.parse(cached);
    const isExpired = Date.now() - cacheItem.timestamp > CACHE_DURATION;
    if (isExpired) {
      await AsyncStorage.removeItem(`${CACHE_KEYS.ORDER_DETAILS}_${orderId}`);
      return null;
    }
    return cacheItem.data;
  } catch (error) {
    console.error('❌ Error getting cached order data:', error);
    return null;
  }
};

// =================================================================
// ✅ واجهات البيانات (تبقى كما هي)
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
      price?: number;
      options: OptionGroup[] | null;
      images: MenuItemImage[] | null;
    } | null;
  }[];
}

// =================================================================
// ✅ مكونات فرعية (تبقى كما هي)
// =================================================================

const Badge = React.memo(({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'secondary' | 'outline'; }) => {
  const getStyle = () => variant === 'secondary' ? styles.badgeSecondary : variant === 'outline' ? styles.badgeOutline : styles.badgeDefault;
  return (
    <View style={[styles.badgeBase, getStyle()]}>
      <Text style={[styles.badgeText, variant === 'default' && styles.badgeTextDefault, variant === 'secondary' && styles.badgeTextSecondary, variant === 'outline' && styles.badgeTextOutline]}>{children}</Text>
    </View>
  );
});

const Card = React.memo(({ children }: { children: React.ReactNode; }) => <View style={styles.card}>{children}</View>);
const Progress = React.memo(({ value }: { value: number; }) => <View style={styles.progressContainer}><View style={[styles.progressBar, { width: `${value}%` }]} /></View>);
const Separator = React.memo(() => <View style={styles.separator} />);

const ImageWithFallback = React.memo(({ src, fallback = 'https://dgplcadvneqpohxqlilg.supabase.co/storage/v1/object/public/menu_image/icon.png', className }: { src: string; className?: any; fallback?: string; } ) => {
  const [imageUri, setImageUri] = useState(src || fallback);
  return <Image source={{ uri: imageUri }} style={className} onError={() => setImageUri(fallback)} resizeMode="cover" />;
});

const AdditionalPiecesDisplay = React.memo(({ additionalPieces }: { additionalPieces: AdditionalPiece[] }) => {
  if (!additionalPieces || additionalPieces.length === 0) return null;
  return (
    <View style={styles.additionalPiecesContainer}>
      <Text style={styles.additionalPiecesTitle}><Text style={styles.emoji}>✨ </Text>القطع الإضافية</Text>
      <View style={styles.additionalPiecesList}>
        {additionalPieces.map((piece, index) => (
          <View key={index} style={styles.additionalPieceRow}>
            <Text style={styles.additionalPieceText}>{piece.quantity}x {piece.name}</Text>
            <Text style={styles.additionalPiecePrice}>+₪{(piece.price * piece.quantity).toFixed(2)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
});

const OrderItem = React.memo(({ item }: { item: OrderDetails['order_items'][0] }) => {
  if (!item.menu_items) return null;
  const getItemBasePrice = useCallback(() => item.menu_items?.price || 24.99 + (item.additional_pieces?.reduce((sum, p) => sum + p.price * p.quantity, 0) || 0), [item]);
  const optionLabels = useMemo(() => Object.entries(item.options).map(([groupId, value]) => item.menu_items?.options?.find(g => g.id === groupId)?.values.find(v => v.value === value)?.label).filter(Boolean).join('، '), [item]);
  const imageUrl = useMemo(() => item.menu_items?.images?.[0]?.image_url || 'https://dgplcadvneqpohxqlilg.supabase.co/storage/v1/object/public/menu_image/icon.png', [item] );

  return (
    <View style={styles.orderItemContainer}>
      <View style={styles.orderItemContent}>
        <View style={styles.itemImageContainer}>
          <ImageWithFallback src={imageUrl} className={styles.itemImage} />
          <View style={styles.itemQuantityBadge}><Text style={styles.itemQuantityText}>{item.quantity}</Text></View>
        </View>
        <View style={styles.itemDetails}>
          <Text style={styles.itemName}>{item.menu_items.name}</Text>
          {optionLabels.length > 0 && <View style={styles.optionsContainer}>{optionLabels.split('، ').map((o, i) => <Badge key={i} variant="outline">{o}</Badge>)}</View>}
          <Text style={styles.itemPrice}>₪{(getItemBasePrice() * item.quantity).toFixed(2)}</Text>
          <AdditionalPiecesDisplay additionalPieces={item.additional_pieces || []} />
          {item.notes && <View style={styles.notesContainer}><Text style={styles.notesText}>{item.notes}</Text></View>}
        </View>
      </View>
    </View>
  );
});

const OrderStatusTimeline = React.memo(({ currentStatus, orderType, created_at }: { currentStatus: string; orderType: 'delivery' | 'pickup'; created_at: string; }) => {
  const statuses = useMemo(() => {
    const base = [{ id: 'new', label: 'تم الطلب', icon: 'receipt-outline', time: created_at }, { id: 'processing', label: 'تم التأكيد', icon: 'checkmark-circle-outline' }, { id: 'ready', label: 'يُحضّر', icon: 'restaurant-outline' }];
    return orderType === 'delivery' ? [...base, { id: 'out_for_delivery', label: 'في الطريق', icon: 'bicycle-outline' }, { id: 'delivered', label: 'تم التوصيل', icon: 'home-outline' }] : [...base, { id: 'ready_for_pickup', label: 'جاهز للاستلام', icon: 'bag-check-outline' }, { id: 'collected', label: 'تم الاستلام', icon: 'checkmark-done-circle-outline' }];
  }, [orderType, created_at]);
  const currentIndex = useMemo(() => statuses.findIndex(s => s.id === currentStatus.toLowerCase()), [currentStatus, statuses]);
  const progressPercentage = ((currentIndex + 1) / statuses.length) * 100;
  const formatTime = (date: string) => new Date(date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

  return (
    <Card>
      <View style={styles.timelineHeader}><Text style={styles.timelineTitle}>حالة الطلب</Text><TouchableOpacity style={styles.refreshButton}><Ionicons name="refresh" size={16} color="#DC2626" /><Text style={styles.refreshText}>تحديث</Text></TouchableOpacity></View>
      <View style={styles.progressSection}><Progress value={progressPercentage} /><View style={styles.progressLabels}><Text style={styles.progressLabel}>تم الطلب</Text><Text style={styles.progressLabel}>{currentIndex + 1} من {statuses.length} مراحل</Text></View></View>
      <View style={styles.timelineContainer}>
        {statuses.map((status, index) => {
          const isCompleted = index <= currentIndex, isActive = index === currentIndex, isLast = index === statuses.length - 1;
          return (
            <View key={status.id} style={styles.timelineItem}>
              <View style={styles.timelineIconContainer}>
                <View style={[styles.timelineIcon, isCompleted && styles.timelineIconCompleted, isActive && styles.timelineIconActive]}><Ionicons name={status.icon as any} size={18} color={isCompleted ? '#FFFFFF' : '#9CA3AF'} /></View>
                {!isLast && <View style={[styles.timelineConnector, isCompleted && styles.timelineConnectorCompleted]} />}
              </View>
              <View style={styles.timelineContent}>
                <View style={styles.timelineTextContainer}><Text style={[styles.timelineLabel, isCompleted && styles.timelineLabelCompleted, isActive && styles.timelineLabelActive]}>{status.label}</Text>{status.time && <Text style={styles.timelineTime}>{formatTime(status.time)}</Text>}</View>
                {isActive && <Text style={styles.timelineDescription}>طلبك في الطريق...</Text>}
              </View>
            </View>
          );
        })}
      </View>
    </Card>
  );
});

// =================================================================
// ✅ المكون الرئيسي
// =================================================================
export default function OrderDetailsScreen() {
  const { orderId } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets(); // ✅ تم إضافة الهوك هنا
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
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
        setLoading(false);
        return;
      }
      const { data, error } = await supabase.from('orders').select(`id, created_at, total_price, subtotal, delivery_price, status, order_type, user_addresses(street_address, delivery_zones(city, area_name)), branches(name, address), order_items(quantity, notes, options, additional_pieces, menu_items(name, price, options, images:menu_item_images(image_url, display_order)))`).eq('id', orderId).single();
      if (error) throw error;
      if (data) {
        const orderData = data as unknown as OrderDetails;
        setOrder(orderData);
        await cacheOrderData(orderId as string, orderData);
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      }
    } catch (error: any) {
      setError("فشل في تحميل تفاصيل الطلب. تأكد من اتصال الإنترنت.");
      const cachedOrder = await getCachedOrderData(orderId as string);
      if (cachedOrder) setOrder(cachedOrder);
    } finally {
      setLoading(false);
    }
  }, [orderId, fadeAnim]);

  useEffect(() => {
    if (!orderId) return;
    const channel = supabase.channel(`order:${orderId}`).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` }, async (payload) => {
      setOrder(prev => {
        if (!prev) return null;
        const updatedOrder = { ...prev, ...payload.new };
        cacheOrderData(orderId as string, updatedOrder);
        return updatedOrder;
      });
    }).subscribe();
    return () => { channel.unsubscribe(); };
  }, [orderId]);

  useEffect(() => { fetchOrderDetails(); }, [fetchOrderDetails]);

  const handleBack = useCallback(() => router.navigate('/orders'), [router]);
  const handleRetry = useCallback(() => fetchOrderDetails(), [fetchOrderDetails]);

  const additionalPiecesTotal = useMemo(() => order ? order.order_items.reduce((total, item) => total + (item.additional_pieces?.reduce((sum, piece) => sum + (piece.price * piece.quantity), 0) || 0), 0) : 0, [order]);
  const subtotal = order?.subtotal || 0;
  const deliveryFee = order?.delivery_price || 0;
  const tax = subtotal * 0.08;
  const total = order?.total_price || 0;

  const estimatedTime = useMemo(() => {
    if (!order) return '15-20 دقيقة';
    switch (order.status) {
      case 'new': return '25-30 دقيقة';
      case 'processing': return '20-25 دقيقة';
      case 'ready': return order.order_type === 'delivery' ? '15-20 دقيقة' : 'جاهز للاستلام';
      case 'out_for_delivery': return '10-15 دقيقة';
      default: return '15-20 دقيقة';
    }
  }, [order]);

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#DC2626" /><Text style={styles.loadingText}>جاري تحميل تفاصيل الطلب...</Text></View>;
  }

  if (error && !order) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top, backgroundColor: '#DC2626' }]}><TouchableOpacity onPress={handleBack} style={styles.backButton}><Ionicons name="arrow-back" size={24} color="#FFFFFF" /></TouchableOpacity><Text style={styles.headerTitle}>تفاصيل الطلب</Text><View style={{ width: 40 }} /></View>
        <View style={styles.errorContainer}><Ionicons name="alert-circle-outline" size={60} color="#DC2626" /><Text style={styles.errorText}>{error}</Text><TouchableOpacity style={styles.retryButton} onPress={handleRetry}><Text style={styles.retryButtonText}>إعادة المحاولة</Text></TouchableOpacity></View>
      </View>
    );
  }

  if (!order) {
    return <View style={styles.centered}><Text style={styles.errorText}>لم يتم العثور على الطلب.</Text><TouchableOpacity style={styles.retryButton} onPress={handleBack}><Text style={styles.retryButtonText}>العودة</Text></TouchableOpacity></View>;
  }

  return (
    // ✅ تم التعديل: استخدام View بدلاً من SafeAreaView
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header with Gradient */}
      <LinearGradient
        colors={['#DC2626', '#B91C1C', '#991B1B']}
        // ✅ تم التعديل: تطبيق المساحة الآمنة العلوية هنا
        style={[styles.headerGradient, { paddingTop: insets.top }]}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>تفاصيل الطلب</Text>
            <Text style={styles.headerSubtitle}>طلب #{order.id}</Text>
          </View>
          <Badge variant="default">قيد التوصيل</Badge>
        </View>

        <View style={styles.estimatedTimeContainer}>
          <View style={styles.estimatedTimeContent}>
            <View style={styles.clockIcon}><Ionicons name="time-outline" size={20} color="#DC2626" /></View>
            <View style={styles.estimatedTimeText}>
              <Text style={styles.estimatedTimeLabel}>الوقت المتوقع للوصول</Text>
              <Text style={styles.estimatedTimeValue}>{estimatedTime}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <OrderStatusTimeline currentStatus={order.status} orderType={order.order_type} created_at={order.created_at} />
          <Card>
            <Text style={styles.sectionTitle}>المنتجات</Text>
            <View style={styles.orderItemsList}>{order.order_items.map((item, index) => <OrderItem key={index} item={item} />)}</View>
            <Separator />
            <View style={styles.priceBreakdown}>
              <View style={styles.priceRow}><Text style={styles.priceLabel}>المجموع الفرعي</Text><Text style={styles.priceValue}>₪{subtotal.toFixed(2)}</Text></View>
              {additionalPiecesTotal > 0 && <View style={styles.priceRow}><Text style={styles.priceLabel}>القطع الإضافية</Text><Text style={styles.priceValue}>₪{additionalPiecesTotal.toFixed(2)}</Text></View>}
              {order.order_type === 'delivery' && <View style={styles.priceRow}><Text style={styles.priceLabel}>سعر التوصيل</Text><Text style={styles.priceValue}>₪{deliveryFee.toFixed(2)}</Text></View>}
              <Separator />
              <View style={styles.totalRow}><Text style={styles.totalLabel}>المجموع الكلي</Text><Text style={styles.totalPrice}>₪{total.toFixed(2)}</Text></View>
            </View>
          </Card>
          <Card>
            <View style={styles.sectionHeader}><Ionicons name="location-outline" size={18} color="#DC2626" /><Text style={styles.sectionTitle}>{order.order_type === 'delivery' ? 'عنوان التوصيل' : 'فرع الاستلام'}</Text></View>
            <View style={styles.addressContainer}><Text style={styles.addressTitle}>المنزل</Text><Text style={styles.addressText}>{order.order_type === 'delivery' && order.user_addresses ? `${order.user_addresses.delivery_zones?.city} - ${order.user_addresses.delivery_zones?.area_name}\n${order.user_addresses.street_address}` : order.order_type === 'pickup' && order.branches ? `${order.branches.name}\n${order.branches.address}` : 'غير محدد'}</Text></View>
            <TouchableOpacity style={styles.mapButton}><Ionicons name="map-outline" size={16} color="#DC2626" /><Text style={styles.mapButtonText}>عرض على الخريطة</Text></TouchableOpacity>
          </Card>
          <Card>
            <View style={styles.sectionHeader}><Ionicons name="card-outline" size={18} color="#DC2626" /><Text style={styles.sectionTitle}>طريقة الدفع</Text></View>
            <LinearGradient colors={['#1F2937', '#374151']} style={styles.paymentCard}><View style={styles.paymentHeader}><Text style={styles.paymentType}>بطاقة ائتمان</Text><View style={styles.cardChips}><View style={styles.cardChip} /><View style={styles.cardChip} /></View></View><Text style={styles.cardNumber}>•••• •••• •••• 4532</Text><View style={styles.cardFooter}><Text style={styles.cardLabel}>حامل البطاقة</Text><Text style={styles.cardValue}>محمد أحمد</Text></View></LinearGradient>
            <View style={styles.paymentStatus}><Ionicons name="checkmark-circle" size={16} color="#16A34A" /><Text style={styles.paymentStatusText}>تم الدفع بنجاح</Text></View>
          </Card>
          <Card>
            <Text style={styles.sectionTitle}>هل تحتاج مساعدة؟</Text>
            <View style={styles.helpOptions}>
              <TouchableOpacity style={styles.helpOption}><View style={styles.helpIconContainer}><Ionicons name="warning-outline" size={18} color="#DC2626" /></View><Text style={styles.helpOptionText}>الإبلاغ عن مشكلة</Text><Ionicons name="chevron-forward" size={18} color="#9CA3AF" /></TouchableOpacity>
              <TouchableOpacity style={styles.helpOption}><View style={[styles.helpIconContainer, styles.helpIconBlue]}><Ionicons name="chatbubble-outline" size={18} color="#2563EB" /></View><Text style={styles.helpOptionText}>اتصل بالدعم</Text><Ionicons name="chevron-forward" size={18} color="#9CA3AF" /></TouchableOpacity>
              <TouchableOpacity style={styles.helpOption}><View style={[styles.helpIconContainer, styles.helpIconGreen]}><Ionicons name="refresh-outline" size={18} color="#16A34A" /></View><Text style={styles.helpOptionText}>إعادة الطلب</Text><Ionicons name="chevron-forward" size={18} color="#9CA3AF" /></TouchableOpacity>
            </View>
          </Card>
          <TouchableOpacity style={styles.receiptButton}><Ionicons name="receipt-outline" size={18} color="#374151" /><Text style={styles.receiptButtonText}>تحميل الإيصال</Text></TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

// =================================================================
// ✅ التنسيقات
// =================================================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 20 },
  loadingText: { marginTop: 12, fontSize: 16, color: '#6B7280' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { fontSize: 18, color: '#374151', textAlign: 'center', marginTop: 16, marginBottom: 24 },
  retryButton: { backgroundColor: '#DC2626', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  headerGradient: {
    // paddingTop: 16, // ✅ تم الحذف
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  header: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  backButton: { padding: 8, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 20 },
  headerTitleContainer: { alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 2 },
  headerSubtitle: { fontSize: 14, color: 'rgba(255, 255, 255, 0.8)' },
  estimatedTimeContainer: { backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' },
  estimatedTimeContent: { flexDirection: 'row', alignItems: 'center' },
  clockIcon: { width: 40, height: 40, backgroundColor: '#FFFFFF', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  estimatedTimeText: { flex: 1 },
  estimatedTimeLabel: { fontSize: 14, color: 'rgba(255, 255, 255, 0.8)', marginBottom: 4 },
  estimatedTimeValue: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  scrollContainer: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 16 },
  badgeBase: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, alignSelf: 'flex-start' },
  badgeDefault: { backgroundColor: '#FBBF24' },
  badgeSecondary: { backgroundColor: '#E5E7EB' },
  badgeOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#D1D5DB' },
  badgeText: { fontSize: 12, fontWeight: '600' },
  badgeTextDefault: { color: '#92400E' },
  badgeTextSecondary: { color: '#374151' },
  badgeTextOutline: { color: '#6B7280' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, marginBottom: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#F3F4F6' },
  progressContainer: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: '#16A34A', borderRadius: 4 },
  separator: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 16 },
  timelineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  timelineTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  refreshButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  refreshText: { fontSize: 14, fontWeight: '600', color: '#DC2626' },
  progressSection: { marginBottom: 24 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  progressLabel: { fontSize: 12, color: '#6B7280' },
  timelineContainer: { gap: 0 },
  timelineItem: { flexDirection: 'row', gap: 16 },
  timelineIconContainer: { alignItems: 'center', width: 40 },
  timelineIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' },
  timelineIconCompleted: { backgroundColor: '#16A34A' },
  timelineIconActive: { backgroundColor: '#DC2626' },
  timelineConnector: { width: 2, flex: 1, backgroundColor: '#E5E7EB', marginVertical: 4 },
  timelineConnectorCompleted: { backgroundColor: '#16A34A' },
  timelineContent: { flex: 1, paddingBottom: 24 },
  timelineTextContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  timelineLabel: { fontSize: 16, fontWeight: '600', color: '#9CA3AF' },
  timelineLabelCompleted: { color: '#374151' },
  timelineLabelActive: { color: '#DC2626' },
  timelineTime: { fontSize: 12, color: '#6B7280' },
  timelineDescription: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 16,textAlign: 'left' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  orderItemsList: { gap: 20 },
  orderItemContainer: { opacity: 1 },
  orderItemContent: { flexDirection: 'row', gap: 12 },
  itemImageContainer: { position: 'relative' },
  itemImage: { width: 80, height: 80, borderRadius: 16, backgroundColor: '#F3F4F6' },
  itemQuantityBadge: { position: 'absolute', top: -6, right: -6, width: 24, height: 24, backgroundColor: '#DC2626', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  itemQuantityText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  itemDetails: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 6, textAlign: 'left' },
  optionsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  itemPrice: { fontSize: 16, fontWeight: '600', color: '#DC2626', marginBottom: 8,textAlign: 'left' },
  additionalPiecesContainer: { backgroundColor: '#FEFCE8', borderWidth: 1, borderColor: '#FEF08A', borderRadius: 12, padding: 12, marginTop: 8 },
  additionalPiecesTitle: { fontSize: 12, fontWeight: '600', color: '#92400E', marginBottom: 8,textAlign: 'left' },
  emoji: { fontSize: 14 },
  additionalPiecesList: { gap: 6 },
  additionalPieceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  additionalPieceText: { fontSize: 14, color: '#374151' },
  additionalPiecePrice: { fontSize: 14, fontWeight: '600', color: '#059669' },
  notesContainer: { backgroundColor: '#F3F4F6', borderRadius: 8, padding: 8, marginTop: 8 },
  notesText: { fontSize: 14, color: '#6B7280', fontStyle: 'italic' },
  priceBreakdown: { gap: 8 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
   priceLabel: {
    fontSize: 16,
    fontFamily: 'Cairo-Regular',
    color: '#6B7280',
  },
  priceValue: {
    fontSize: 16,
    fontFamily: 'Cairo-SemiBold',
    color: '#374151',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontFamily: 'Cairo-Bold',
    color: '#111827',
  },
  totalPrice: {
    fontSize: 20,
    fontFamily: 'Cairo-Bold',
    color: '#DC2626',
  },
  // Address Styles
  addressContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  addressTitle: {
    fontSize: 16,
    fontFamily: 'Cairo-SemiBold',
    color: '#374151',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    fontFamily: 'Cairo-Regular',
    color: '#6B7280',
    lineHeight: 20,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
  },
  mapButtonText: {
    fontSize: 14,
    fontFamily: 'Cairo-SemiBold',
    color: '#DC2626',
  },
  // Payment Styles
  paymentCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  paymentType: {
    fontSize: 14,
    fontFamily: 'Cairo-Regular',
    color: '#9CA3AF',
  },
  cardChips: {
    flexDirection: 'row',
    gap: 4,
  },
  cardChip: {
    width: 32,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
  },
  cardNumber: {
    fontSize: 18,
    fontFamily: 'Cairo-Bold',
    color: '#FFFFFF',
    letterSpacing: 2,
    marginBottom: 16,
    textAlign: 'left',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: 12,
    fontFamily: 'Cairo-Regular',
    color: '#9CA3AF',
  },
  cardValue: {
    fontSize: 14,
    fontFamily: 'Cairo-SemiBold',
    color: '#FFFFFF',
  },
  paymentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#DCFCE7',
    padding: 12,
    borderRadius: 8,
  },
  paymentStatusText: {
    fontSize: 14,
    fontFamily: 'Cairo-SemiBold',
    color: '#16A34A',
  },
  // Help Section
  helpOptions: {
    gap: 12,
  },
  helpOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
  },
  helpIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#FEE2E2',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  helpIconBlue: {
    backgroundColor: '#DBEAFE',
  },
  helpIconGreen: {
    backgroundColor: '#DCFCE7',
  },
  helpOptionText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Cairo-SemiBold',
    color: '#374151',
  },
  // Receipt Button
  receiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginTop: 8,
  },
  receiptButtonText: {
    fontSize: 16,
    fontFamily: 'Cairo-SemiBold',
    color: '#374151',
  },
});