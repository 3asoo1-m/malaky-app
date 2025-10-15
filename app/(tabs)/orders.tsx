// مسار الملف: app/(tabs)/orders.tsx

import React, { useState, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Animated } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '@/lib/useAuth';
import { supabase } from '@/lib/supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// =================================================================
// ✅ دوال الـ Caching للطلبات
// =================================================================
const CACHE_KEYS = {
  ORDERS_DATA: 'orders_data'
};

const CACHE_DURATION = 1000 * 60 * 5; // 5 دقائق للطلبات

const cacheOrdersData = async (userId: string, data: any) => {
  try {
    const cacheItem = { data, timestamp: Date.now() };
    await AsyncStorage.setItem(`${CACHE_KEYS.ORDERS_DATA}_${userId}`, JSON.stringify(cacheItem));
    console.log(`✅ Orders cached for user: ${userId}`);
  } catch (error) {
    console.error('❌ Error caching orders:', error);
  }
};

const getCachedOrdersData = async (userId: string) => {
  try {
    const cached = await AsyncStorage.getItem(`${CACHE_KEYS.ORDERS_DATA}_${userId}`);
    if (!cached) {
      console.log(`📭 No cache found for user orders: ${userId}`);
      return null;
    }
    const cacheItem = JSON.parse(cached);
    const isExpired = Date.now() - cacheItem.timestamp > CACHE_DURATION;
    if (isExpired) {
      console.log(`🕐 Cache expired for user orders: ${userId}`);
      await AsyncStorage.removeItem(`${CACHE_KEYS.ORDERS_DATA}_${userId}`);
      return null;
    }
    console.log(`✅ Using cached orders for user: ${userId}`);
    return cacheItem.data;
  } catch (error) {
    console.error('❌ Error getting cached orders:', error);
    return null;
  }
};

// =================================================================
// ✅ واجهة الطلب والمكونات الفرعية
// =================================================================
interface Order {
  id: number;
  created_at: string;
  total_price: number;
  status: string;
}

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

// ✅ مكون OrderCard مع React.memo
const OrderCard = React.memo(({ item, index }: { item: Order; index: number }) => {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useFocusEffect(
    useCallback(() => {
      Animated.timing(fadeAnim, { 
        toValue: 1, 
        duration: 500, 
        delay: index * 100, 
        useNativeDriver: true 
      }).start();
      Animated.timing(slideAnim, { 
        toValue: 0, 
        duration: 500, 
        delay: index * 100, 
        useNativeDriver: true 
      }).start();
    }, [fadeAnim, slideAnim, index])
  );

  // ✅ useMemo للترجمة والأساليب
  const translateStatus = useCallback((status: string): string => {
    const translations: { [key: string]: string } = {
      'new': 'جديد',
      'processing': 'قيد التحضير',
      'delivered': 'تم التوصيل',
      'ready': 'جاهز',
      'cancelled': 'ملغي'
    };
    return translations[status.toLowerCase()] || status;
  }, []);

  const getStatusStyle = useCallback((status: string): { 
    icon: IoniconName; 
    color: string; 
    backgroundColor: string; 
    borderColor: string 
  } => {
    switch (status.toLowerCase()) {
      case 'processing':
        return { icon: 'hourglass-outline', color: '#D97706', backgroundColor: '#FEF3C7', borderColor: '#FBBF24' };
      case 'delivered':
        return { icon: 'bicycle-outline', color: '#2563EB', backgroundColor: '#DBEAFE', borderColor: '#93C5FD' };
      case 'ready':
        return { icon: 'checkmark-circle-outline', color: '#16A34A', backgroundColor: '#DCFCE7', borderColor: '#86EFAC' };
      case 'cancelled':
        return { icon: 'close-circle-outline', color: '#DC2626', backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' };
      case 'new':
      default:
        return { icon: 'receipt-outline', color: '#4B5563', backgroundColor: '#F3F4F6', borderColor: '#D1D5DB' };
    }
  }, []);

  const statusStyle = useMemo(() => getStatusStyle(item.status), [item.status, getStatusStyle]);
  const translatedStatus = useMemo(() => translateStatus(item.status), [item.status, translateStatus]);

  const handlePress = useCallback(() => {
    router.push({ pathname: '/order/[orderId]', params: { orderId: item.id.toString() } });
  }, [router, item.id]);

  const formattedDate = useMemo(() => {
    return new Date(item.created_at).toLocaleDateString('ar-EG', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }, [item.created_at]);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity
        style={styles.orderCard}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <View style={styles.cardTopSection}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderId}>طلب #{item.id}</Text>
            <Text style={styles.orderDate}>{formattedDate}</Text>
          </View>
          <View style={[
            styles.statusContainer, 
            { 
              backgroundColor: statusStyle.backgroundColor, 
              borderColor: statusStyle.borderColor 
            }
          ]}>
            <Ionicons name={statusStyle.icon} size={16} color={statusStyle.color} />
            <Text style={[styles.statusText, { color: statusStyle.color }]}>
              {translatedStatus}
            </Text>
          </View>
        </View>
        <View style={styles.separator} />
        <View style={styles.cardBottomSection}>
          <Text style={styles.orderTotal}>{item.total_price.toFixed(2)} ₪</Text>
          <View style={styles.detailsButton}>
            <Text style={styles.detailsButtonText}>عرض التفاصيل</Text>
            <Ionicons name="chevron-forward-outline" size={16} color="#C62828" />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

// =================================================================
// ✅ المكون الرئيسي المحسن
// =================================================================
export default function OrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ useCallback لـ fetchOrders
  const fetchOrders = useCallback(async (isRefreshing = false) => {
    if (!user) {
      setLoading(false);
      return;
    }

    setError(null);
    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      // ✅ تحقق من الـ cache أولاً
      const cachedOrders = isRefreshing ? null : await getCachedOrdersData(user.id);
      
      if (cachedOrders && !isRefreshing) {
        console.log('✅ Using cached orders data');
        setOrders(cachedOrders);
      } else {
        console.log('🌐 Fetching fresh orders data');
        const { data, error } = await supabase
          .from('orders')
          .select('id, created_at, total_price, status')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          throw new Error(error.message);
        }
        
        setOrders(data || []);
        
        // ✅ خزن البيانات في الـ cache
        if (data && data.length > 0) {
          await cacheOrdersData(user.id, data);
        }
      }
    } catch (err: any) {
      const errorMessage = "فشل في تحميل الطلبات. تأكد من اتصال الإنترنت.";
      setError(errorMessage);
      console.error('Error fetching orders:', err.message);
      
      // ✅ fallback إلى البيانات المخزنة
      const cachedOrders = await getCachedOrdersData(user.id);
      if (cachedOrders) {
        setOrders(cachedOrders);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  // ✅ useFocusEffect محسن
  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [fetchOrders])
  );

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleRefresh = useCallback(() => {
    fetchOrders(true);
  }, [fetchOrders]);

  const handleRetry = useCallback(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ✅ useCallback لـ renderItem و keyExtractor
  const renderOrderItem = useCallback(({ item, index }: { item: Order; index: number }) => (
    <OrderCard item={item} index={index} />
  ), []);

  const keyExtractor = useCallback((item: Order) => item.id.toString(), []);

  // ✅ useMemo للبيانات المشتقة
  const hasOrders = useMemo(() => orders.length > 0, [orders.length]);

  return (
    <View style={styles.container}>
      {/* ✅ رأس الصفحة المحسن */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>طلباتي</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* ✅ عرض الخطأ إذا وجد */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#C62828" />
          <Text style={styles.loadingText}>جاري تحميل الطلبات...</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={[
            styles.listContainer,
            !hasOrders && styles.emptyListContainer
          ]}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          windowSize={11}
          initialNumToRender={10}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={80} color="#ccc" />
              <Text style={styles.emptyText}>لا توجد طلبات سابقة</Text>
              <Text style={styles.emptySubText}>ابدأ أول طلب لك من قائمة الطعام!</Text>
              <TouchableOpacity 
                style={styles.browseButton}
                onPress={() => router.push('/')}
              >
                <Text style={styles.browseButtonText}>تصفح القائمة</Text>
              </TouchableOpacity>
            </View>
          }
          ListFooterComponent={hasOrders ? <View style={styles.listFooter} /> : null}
        />
      )}
    </View>
  );
}

// =================================================================
// ✅ التنسيقات المحدثة
// =================================================================
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F5F5F5' 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Cairo-Bold',
    color: '#1A1A1A',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#D32F2F',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
    fontFamily: 'Cairo-Regular',
  },
  retryButton: {
    backgroundColor: '#D32F2F',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Cairo-SemiBold',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    fontFamily: 'Cairo-Regular',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 16,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    overflow: 'hidden',
  },
  cardTopSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  orderInfo: {
    alignItems: 'flex-start',
    flex: 1,
  },
  orderId: {
    fontSize: 16,
    fontFamily: 'Cairo-Bold',
    color: '#333',
  },
  orderDate: {
    fontSize: 13,
    color: '#888',
    fontFamily: 'Cairo-Regular',
    marginTop: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    minWidth: 100,
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  statusText: {
    fontFamily: 'Cairo-SemiBold',
    fontSize: 12,
    marginStart: 6,
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  cardBottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    padding: 16,
  },
  orderTotal: {
    fontSize: 18,
    fontFamily: 'Cairo-Bold',
    color: '#C62828',
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsButtonText: {
    color: '#333',
    fontFamily: 'Cairo-SemiBold',
    fontSize: 14,
    marginEnd: 4,
  },
  emptyContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingTop: '20%' 
  },
  emptyText: { 
    fontSize: 20, 
    fontFamily: 'Cairo-Bold', 
    color: '#555', 
    marginTop: 16 
  },
  emptySubText: { 
    fontSize: 14, 
    color: '#999', 
    marginTop: 8, 
    textAlign: 'center', 
    fontFamily: 'Cairo-Regular' 
  },
  browseButton: {
    marginTop: 20,
    backgroundColor: '#C62828',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Cairo-Bold',
  },
  listFooter: {
    height: 20,
  },
});