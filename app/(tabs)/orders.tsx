// مسار الملف: app/(tabs)/orders.tsx

import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Animated } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '@/lib/useAuth';
import { supabase } from '@/lib/supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// ✅ استيراد نظام التحليلات
import { trackEvent, AnalyticsEvents } from '@/lib/analytics';

// =================================================================
// ✅ واجهة الطلب والمكونات الفرعية
// =================================================================
interface Order {
  id: number;
  created_at: string;
  total_price: number;
  status: string;
  items_count?: number;
}

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

// ✅ مكون OrderCard مع React.memo
const OrderCard = React.memo(({ item, index }: { item: Order; index: number }) => {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  React.useEffect(() => {
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
  }, [fadeAnim, slideAnim, index]);

  // ✅ useMemo للترجمة والأساليب
  const translateStatus = useCallback((status: string): string => {
    const translations: { [key: string]: string } = {
      'new': 'جديد',
      'processing': 'قيد التحضير',
      'delivered': 'تم التوصيل',
      'ready': 'جاهز',
      'cancelled': 'ملغي',
      'preparing': 'جاري التحضير',
      'on_the_way': 'في الطريق'
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
      case 'preparing':
        return { icon: 'hourglass-outline', color: '#D97706', backgroundColor: '#FEF3C7', borderColor: '#FBBF24' };
      case 'delivered':
        return { icon: 'checkmark-done-circle-outline', color: '#16A34A', backgroundColor: '#DCFCE7', borderColor: '#86EFAC' };
      case 'ready':
        return { icon: 'checkmark-circle-outline', color: '#2563EB', backgroundColor: '#DBEAFE', borderColor: '#93C5FD' };
      case 'on_the_way':
        return { icon: 'bicycle-outline', color: '#7C3AED', backgroundColor: '#F3E8FF', borderColor: '#C4B5FD' };
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
    // ✅ تتبع النقر على الطلب
    trackEvent('order_details_viewed', {
      order_id: item.id,
      order_status: item.status,
      order_total: item.total_price
    });
    
    router.push({ pathname: '/order/[orderId]', params: { orderId: item.id.toString() } });
  }, [router, item.id, item.status, item.total_price]);

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
            {item.items_count && (
              <Text style={styles.itemsCount}>{item.items_count} عنصر</Text>
            )}
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
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ✅ useCallback لـ fetchOrders بدون caching
  const fetchOrders = useCallback(async (isRefreshing = false, isAutoRefresh = false) => {
    if (!user) {
      setLoading(false);
      return;
    }

    // لا تعرض loading في التحديث التلقائي
    if (!isAutoRefresh) {
      setError(null);
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
    }

    try {
      console.log('🌐 Fetching fresh orders data from server');
      
      // ✅ جلب البيانات مع معلومات إضافية
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id, 
          created_at, 
          total_price, 
          status,
          order_items(count)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }
      
      // ✅ معالجة البيانات لإضافة items_count
      const processedOrders: Order[] = (data || []).map(order => ({
        id: order.id,
        created_at: order.created_at,
        total_price: order.total_price,
        status: order.status,
        items_count: order.order_items?.[0]?.count || 0
      }));
      
      setOrders(processedOrders);

      // ✅ تتبع نجاح جلب الطلبات
      if (!isAutoRefresh) {
        trackEvent(AnalyticsEvents.DATA_FETCH_SUCCESS, {
          screen: 'orders',
          orders_count: processedOrders.length,
          is_refreshing: isRefreshing
        });
      }

    } catch (err: any) {
      const errorMessage = "فشل في تحميل الطلبات. تأكد من اتصال الإنترنت.";
      setError(errorMessage);
      console.error('Error fetching orders:', err.message);
      
      // ✅ تتبع الأخطاء
      trackEvent(AnalyticsEvents.ERROR_OCCURRED, {
        screen: 'orders',
        error_type: 'fetch_orders_failed',
        error_message: err.message
      });
    } finally {
      if (!isAutoRefresh) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [user]);

  // ✅ useFocusEffect محسن
  useFocusEffect(
    useCallback(() => {
      // ✅ تتبع فتح شاشة الطلبات
      trackEvent('orders_screen_viewed', {
        user_id: user?.id,
        has_previous_orders: orders.length > 0
      });

      fetchOrders();

      // ✅ بدء التحديث التلقائي كل 30 ثانية للطلبات النشطة
      refreshIntervalRef.current = setInterval(() => {
        const hasActiveOrders = orders.some(order => 
          ['new', 'processing', 'preparing', 'on_the_way'].includes(order.status.toLowerCase())
        );
        
        if (hasActiveOrders) {
          console.log('🔄 Auto-refreshing active orders...');
          fetchOrders(false, true);
        }
      }, 30000); // 30 ثانية

      return () => {
        // ✅ تنظيف الـ interval عند مغادرة الشاشة
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
          refreshIntervalRef.current = null;
        }
      };
    }, [fetchOrders, user, orders.length])
  );

  // ✅ تأثير إضافي للتحديث عند تغيير حالة الطلبات
  useEffect(() => {
    // ✅ تتبع تغيير حالة الطلبات
    const orderStatuses = orders.map(order => order.status);
    console.log('📊 Current orders statuses:', orderStatuses);
    
    // يمكن إضافة تحليلات إضافية هنا
  }, [orders]);

  const handleBack = useCallback(() => {
    router.navigate('/(tabs)/profile');
  }, [router]);

  const handleRefresh = useCallback(() => {
    // ✅ تتبع السحب للتحديث
    trackEvent(AnalyticsEvents.PULL_TO_REFRESH, {
      screen: 'orders',
      current_orders_count: orders.length
    });
    
    fetchOrders(true);
  }, [fetchOrders, orders.length]);

  const handleRetry = useCallback(() => {
    // ✅ تتبع إعادة المحاولة
    trackEvent('orders_retry_attempt', {
      previous_error: error
    });
    
    fetchOrders();
  }, [fetchOrders, error]);

  const handleBrowseMenu = useCallback(() => {
    // ✅ تتبع الانتقال للقائمة
    trackEvent('browse_menu_from_orders', {
      source: 'empty_orders',
      user_id: user?.id
    });
    
    router.push('/');
  }, [router, user]);

  // ✅ useCallback لـ renderItem و keyExtractor
  const renderOrderItem = useCallback(({ item, index }: { item: Order; index: number }) => (
    <OrderCard item={item} index={index} />
  ), []);

  const keyExtractor = useCallback((item: Order) => item.id.toString(), []);

  // ✅ useMemo للبيانات المشتقة
  const hasOrders = useMemo(() => orders.length > 0, [orders.length]);
  
  const activeOrdersCount = useMemo(() => 
    orders.filter(order => 
      ['new', 'processing', 'preparing', 'on_the_way'].includes(order.status.toLowerCase())
    ).length, 
    [orders]
  );

  return (
    <View style={styles.container}>
      {/* ✅ رأس الصفحة المحسن */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>طلباتي</Text>
          {activeOrdersCount > 0 && (
            <View style={styles.activeOrdersBadge}>
              <Text style={styles.activeOrdersText}>{activeOrdersCount} نشط</Text>
            </View>
          )}
        </View>
        <TouchableOpacity 
          onPress={handleRefresh} 
          style={styles.refreshButton}
          disabled={refreshing}
        >
          <Ionicons 
            name="refresh" 
            size={22} 
            color={refreshing ? "#999" : "#C62828"} 
          />
        </TouchableOpacity>
      </View>

      {/* ✅ عرض الخطأ إذا وجد */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={20} color="#D32F2F" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ✅ مؤشر التحديث التلقائي */}
      {refreshing && (
        <View style={styles.autoRefreshIndicator}>
          <ActivityIndicator size="small" color="#C62828" />
          <Text style={styles.autoRefreshText}>جاري تحديث الطلبات...</Text>
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
          maxToRenderPerBatch={8}
          updateCellsBatchingPeriod={100}
          windowSize={7}
          initialNumToRender={6}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={80} color="#E5E7EB" />
              <Text style={styles.emptyText}>لا توجد طلبات سابقة</Text>
              <Text style={styles.emptySubText}>ابدأ أول طلب لك من قائمة الطعام!</Text>
              <TouchableOpacity 
                style={styles.browseButton}
                onPress={handleBrowseMenu}
              >
                <Text style={styles.browseButtonText}>تصفح القائمة</Text>
                <Ionicons name="fast-food-outline" size={18} color="#fff" style={styles.browseIcon} />
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
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Cairo-Bold',
    color: '#1A1A1A',
    marginRight: 8,
  },
  activeOrdersBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FBBF24',
  },
  activeOrdersText: {
    fontSize: 12,
    fontFamily: 'Cairo-SemiBold',
    color: '#D97706',
  },
  refreshButton: {
    padding: 8,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#D32F2F',
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
    fontFamily: 'Cairo-Regular',
    marginRight: 8,
  },
  retryButton: {
    backgroundColor: '#D32F2F',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Cairo-SemiBold',
  },
  autoRefreshIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
  },
  autoRefreshText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Cairo-Regular',
    marginLeft: 8,
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
    alignItems: 'flex-start',
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
  itemsCount: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Cairo-Regular',
    marginTop: 2,
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Cairo-Bold',
  },
  browseIcon: {
    marginRight: 8,
  },
  listFooter: {
    height: 20,
  },
});