// مسار الملف: app/(tabs)/orders.tsx

import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  TouchableOpacity, 
  Animated,
  Image,
  ScrollView
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '@/lib/useAuth';
import { supabase } from '@/lib/supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

// ✅ استيراد نظام التحليلات
import { trackEvent, AnalyticsEvents } from '@/lib/analytics';
import { scale, fontScale } from '@/lib/responsive';

// =================================================================
// ✅ واجهة الطلب والمكونات الفرعية
// =================================================================
interface Order {
  id: number;
  created_at: string;
  total_price: number;
  status: string;
  items_count?: number;
  delivery_address?: string;
  order_type: string;
  subtotal: number;
  delivery_price: number;
  user_address_id?: number;
  branch_id?: number;
  user_address?: {
    street_address: string;
    delivery_zones?: {
      area_name: string;
      city: string;
    } | null;
  } | null;
}

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

// ✅ مكون البطاقة المخصصة
const Card = ({ children, style }: { children: React.ReactNode; style?: any }) => (
  <View style={[styles.card, style]}>{children}</View>
);

// ✅ مكون البادج
const Badge = ({ text, style, textStyle }: { text: string; style?: any; textStyle?: any }) => (
  <View style={[styles.badge, style]}>
    <Text style={[styles.badgeText, textStyle]}>{text}</Text>
  </View>
);

// ✅ مكون التبويبات
const TabButton = ({ 
  title, 
  isActive, 
  onPress,
  count 
}: { 
  title: string; 
  isActive: boolean; 
  onPress: () => void;
  count?: number;
}) => (
  <TouchableOpacity
    style={[styles.tabButton, isActive && styles.tabButtonActive]}
    onPress={onPress}
  >
    <Text style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}>
      {title}
      {count !== undefined && count > 0 && (
        <Text style={styles.tabCount}> ({count})</Text>
      )}
    </Text>
  </TouchableOpacity>
);

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

  // ✅ إصلاح الأيقونة لـ 'ready'
  const getStatusConfig = useCallback((status: string): { 
    icon: IoniconName; 
    color: string; 
    backgroundColor: string; 
    borderColor: string;
    label: string;
  } => {
    switch (status.toLowerCase()) {
      case 'processing':
      case 'preparing':
        return { 
          icon: 'time-outline', 
          color: '#F97316', 
          backgroundColor: '#FFF7ED', 
          borderColor: '#FDBA74',
          label: 'قيد التحضير'
        };
      case 'delivered':
        return { 
          icon: 'checkmark-done-circle-outline', 
          color: '#16A34A', 
          backgroundColor: '#F0FDF4', 
          borderColor: '#86EFAC',
          label: 'تم التوصيل'
        };
      case 'ready':
        return { 
          icon: 'checkmark-circle-outline', 
          color: '#2563EB', 
          backgroundColor: '#EFF6FF', 
          borderColor: '#93C5FD',
          label: 'جاهز'
        };
      case 'on_the_way':
        return { 
          icon: 'bicycle-outline', 
          color: '#7C3AED', 
          backgroundColor: '#FAF5FF', 
          borderColor: '#C4B5FD',
          label: 'في الطريق'
        };
      case 'cancelled':
        return { 
          icon: 'close-circle-outline', 
          color: '#DC2626', 
          backgroundColor: '#FEF2F2', 
          borderColor: '#FCA5A5',
          label: 'ملغي'
        };
      case 'new':
      default:
        return { 
          icon: 'receipt-outline', 
          color: '#6B7280', 
          backgroundColor: '#F9FAFB', 
          borderColor: '#D1D5DB',
          label: 'جديد'
        };
    }
  }, []);

  const statusConfig = useMemo(() => getStatusConfig(item.status), [item.status, getStatusConfig]);
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

  // ✅ الحصول على العنوان من الجدول المرتبط
  const deliveryAddress = useMemo(() => {
    if (item.user_address) {
      const zoneInfo = item.user_address.delivery_zones 
        ? `${item.user_address.delivery_zones.area_name}, ${item.user_address.delivery_zones.city}`
        : '';
      return `${item.user_address.street_address} ${zoneInfo}`.trim();
    }
    return 'لم يتم تحديد العنوان';
  }, [item.user_address]);

  // الوقت المقدر للتوصيل (محاكاة)
  const getEstimatedTime = useCallback(() => {
    switch (item.status.toLowerCase()) {
      case 'processing':
      case 'preparing':
        return '20-25 دقيقة';
      case 'on_the_way':
        return '10-15 دقيقة';
      default:
        return null;
    }
  }, [item.status]);

  const estimatedTime = useMemo(() => getEstimatedTime(), [getEstimatedTime]);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <Card style={styles.orderCard}>
        {/* الهيدر مع التدرج اللوني */}
        <View style={styles.orderHeader}>
          <View style={styles.orderNumberContainer}>
            <MaterialCommunityIcons name="package-variant" size={scale(18)} color="#DC2626" />
            <Text style={styles.orderNumber}>طلب #{item.id}</Text>
          </View>
          <Badge 
            text={statusConfig.label}
            style={{
              backgroundColor: statusConfig.backgroundColor,
              borderColor: statusConfig.borderColor,
            }}
            textStyle={{ color: statusConfig.color }}
          />
        </View>

        {/* معلومات التاريخ والوقت */}
        <View style={styles.orderMeta}>
          <Text style={styles.orderDate}>{formattedDate}</Text>
          <Text style={styles.orderType}>
            {item.order_type === 'delivery' ? 'توصيل' : 'استلام من الفرع'}
          </Text>
        </View>

        {/* معلومات العناصر */}
        <View style={styles.orderItems}>
          <View style={styles.itemsCount}>
            <Ionicons name="fast-food-outline" size={scale(16)} color="#6B7280" />
            <Text style={styles.itemsCountText}>{item.items_count || 0} عنصر</Text>
          </View>
          <Text style={styles.orderTotal}>{item.total_price.toFixed(2)} ₪</Text>
        </View>

        {/* العنوان - فقط للطلبات التوصيل */}
        {item.order_type === 'delivery' && (
          <View style={styles.addressContainer}>
            <Ionicons name="location-outline" size={scale(16)} color="#9CA3AF" />
            <Text style={styles.addressText} numberOfLines={2}>
              {deliveryAddress}
            </Text>
          </View>
        )}

        {/* الوقت المقدر للطلبات النشطة */}
        {estimatedTime && (
          <View style={styles.estimatedTimeContainer}>
            <View style={styles.estimatedTimeContent}>
              <Ionicons name="time-outline" size={scale(16)} color="#F97316" />
              <View style={styles.estimatedTimeTexts}>
                <Text style={styles.estimatedTimeLabel}>الوقت المقدر للتوصيل</Text>
                <Text style={styles.estimatedTimeValue}>{estimatedTime}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.callButton}>
              <Ionicons name="call-outline" size={scale(16)} color="#F97316" />
            </TouchableOpacity>
          </View>
        )}

        {/* الفوتر مع زر التفاصيل */}
        <View style={styles.orderFooter}>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>المبلغ الإجمالي</Text>
            <Text style={styles.totalAmount}>{item.total_price.toFixed(2)} ₪</Text>
          </View>
          <TouchableOpacity 
            style={styles.detailsButton}
            onPress={handlePress}
          >
            <MaterialCommunityIcons name="receipt-text-outline" size={scale(16)} color="white" />
            <Text style={styles.detailsButtonText}>عرض التفاصيل</Text>
            <Ionicons name="chevron-forward-outline" size={scale(16)} color="white" />
          </TouchableOpacity>
        </View>
      </Card>
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
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ✅ useCallback لـ fetchOrders - تم التحديث ليتناسب مع هيكل الجدول
  const fetchOrders = useCallback(async (isRefreshing = false, isAutoRefresh = false) => {
    if (!user) {
      setLoading(false);
      return;
    }

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
      
      // ✅ استعلام محدث ليناسب هيكل الجدول
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id, 
          created_at, 
          total_price, 
          status,
          order_type,
          subtotal,
          delivery_price,
          user_address_id,
          branch_id,
          user_addresses (
            street_address,
            delivery_zones (
              area_name,
              city
            )
          ),
          order_items (
            id,
            quantity
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }
      
      // ✅ معالجة البيانات لتناسب الواجهة
      const processedOrders: Order[] = (data || []).map(order => ({
        id: order.id,
        created_at: order.created_at,
        total_price: order.total_price,
        status: order.status,
        order_type: order.order_type,
        subtotal: order.subtotal,
        delivery_price: order.delivery_price,
        user_address_id: order.user_address_id,
        branch_id: order.branch_id,
        items_count: Array.isArray(order.order_items) 
          ? order.order_items.reduce((total, item) => total + (item.quantity || 1), 0)
          : 0,
        user_address: Array.isArray(order.user_addresses) 
          ? order.user_addresses[0] || null
          : order.user_addresses || null
      }));
      
      setOrders(processedOrders);

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
      trackEvent('orders_screen_viewed', {
        user_id: user?.id,
        has_previous_orders: orders.length > 0
      });

      fetchOrders();

      refreshIntervalRef.current = setInterval(() => {
        const hasActiveOrders = orders.some(order => 
          ['new', 'processing', 'preparing', 'on_the_way'].includes(order.status.toLowerCase())
        );
        
        if (hasActiveOrders) {
          console.log('🔄 Auto-refreshing active orders...');
          fetchOrders(false, true);
        }
      }, 30000);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
          refreshIntervalRef.current = null;
        }
      };
    }, [fetchOrders, user, orders.length])
  );

  const handleBack = useCallback(() => {
    router.navigate('/(tabs)/profile');
  }, [router]);

  const handleRefresh = useCallback(() => {
    trackEvent(AnalyticsEvents.PULL_TO_REFRESH, {
      screen: 'orders',
      current_orders_count: orders.length
    });
    
    fetchOrders(true);
  }, [fetchOrders, orders.length]);

  const handleRetry = useCallback(() => {
    trackEvent('orders_retry_attempt', {
      previous_error: error
    });
    
    fetchOrders();
  }, [fetchOrders, error]);

  const handleBrowseMenu = useCallback(() => {
    trackEvent('browse_menu_from_orders', {
      source: 'empty_orders',
      user_id: user?.id
    });
    
    router.push('/');
  }, [router, user]);

  // ✅ تصفية الطلبات حسب التبويب
  const filteredOrders = useMemo(() => {
    switch (activeTab) {
      case 'active':
        return orders.filter(order => 
          ['new', 'processing', 'preparing', 'on_the_way'].includes(order.status.toLowerCase())
        );
      case 'completed':
        return orders.filter(order => 
          ['delivered', 'ready'].includes(order.status.toLowerCase())
        );
      case 'cancelled':
        return orders.filter(order => 
          order.status.toLowerCase() === 'cancelled'
        );
      default:
        return orders;
    }
  }, [orders, activeTab]);

  // ✅ إحصائيات التبويبات
  const tabStats = useMemo(() => ({
    all: orders.length,
    active: orders.filter(order => 
      ['new', 'processing', 'preparing', 'on_the_way'].includes(order.status.toLowerCase())
    ).length,
    completed: orders.filter(order => 
      ['delivered', 'ready'].includes(order.status.toLowerCase())
    ).length,
    cancelled: orders.filter(order => 
      order.status.toLowerCase() === 'cancelled'
    ).length,
  }), [orders]);

  const renderOrderItem = useCallback(({ item, index }: { item: Order; index: number }) => (
    <OrderCard item={item} index={index} />
  ), []);

  const keyExtractor = useCallback((item: Order) => item.id.toString(), []);

  return (
    <View style={styles.container}>
      {/* ✅ الهيدر الجديد مع التدرج اللوني */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerBackground} />
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={scale(24)} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>طلباتي</Text>
            <TouchableOpacity 
              onPress={handleRefresh} 
              style={styles.refreshButton}
              disabled={refreshing}
            >
              <Ionicons 
                name="refresh" 
                size={scale(22)} 
                color={refreshing ? "rgba(255,255,255,0.5)" : "white"} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ✅ تبويبات التصفية */}
      <View style={styles.tabsContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}
        >
          <TabButton
            title="الكل"
            isActive={activeTab === 'all'}
            onPress={() => setActiveTab('all')}
            count={tabStats.all}
          />
          <TabButton
            title="نشطة"
            isActive={activeTab === 'active'}
            onPress={() => setActiveTab('active')}
            count={tabStats.active}
          />
          <TabButton
            title="مكتملة"
            isActive={activeTab === 'completed'}
            onPress={() => setActiveTab('completed')}
            count={tabStats.completed}
          />
          <TabButton
            title="ملغاة"
            isActive={activeTab === 'cancelled'}
            onPress={() => setActiveTab('cancelled')}
            count={tabStats.cancelled}
          />
        </ScrollView>
      </View>

      {/* ✅ عرض الخطأ إذا وجد */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={scale(20)} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ✅ مؤشر التحديث التلقائي */}
      {refreshing && (
        <View style={styles.autoRefreshIndicator}>
          <ActivityIndicator size="small" color="#DC2626" />
          <Text style={styles.autoRefreshText}>جاري تحديث الطلبات...</Text>
        </View>
      )}

      {loading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#DC2626" />
          <Text style={styles.loadingText}>جاري تحميل الطلبات...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={renderOrderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={[
            styles.listContainer,
            filteredOrders.length === 0 && styles.emptyListContainer
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
              <View style={styles.emptyIcon}>
                <MaterialCommunityIcons name="package-variant" size={scale(80)} color="#E5E7EB" />
              </View>
              <Text style={styles.emptyText}>
                {activeTab === 'all' ? 'لا توجد طلبات سابقة' : 
                 activeTab === 'active' ? 'لا توجد طلبات نشطة' :
                 activeTab === 'completed' ? 'لا توجد طلبات مكتملة' : 'لا توجد طلبات ملغاة'}
              </Text>
              <Text style={styles.emptySubText}>
                {activeTab === 'all' ? 'ابدأ أول طلب لك من قائمة الطعام!' :
                 activeTab === 'active' ? 'الطلبات النشطة ستظهر هنا' :
                 activeTab === 'completed' ? 'الطلبات المكتملة ستظهر هنا' : 'الطلبات الملغاة ستظهر هنا'}
              </Text>
              {activeTab === 'all' && (
                <TouchableOpacity 
                  style={styles.browseButton}
                  onPress={handleBrowseMenu}
                >
                  <Text style={styles.browseButtonText}>تصفح القائمة</Text>
                  <Ionicons name="fast-food-outline" size={scale(18)} color="#fff" style={styles.browseIcon} />
                </TouchableOpacity>
              )}
            </View>
          }
          ListFooterComponent={filteredOrders.length > 0 ? <View style={styles.listFooter} /> : null}
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
    backgroundColor: '#F8FAFC' 
  },
  
  // الهيدر
  header: {
    height: scale(160),
    position: 'relative',
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#DC2626',
    borderBottomLeftRadius: scale(30),
    borderBottomRightRadius: scale(30),
  },
  headerContent: {
    paddingHorizontal: scale(20),
    paddingTop: scale(50),
  },
  headerTop: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: scale(8),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: scale(20),
  },
  headerTitle: {
    fontSize: fontScale(24),
    fontWeight: 'bold',
    color: 'white',
  },
  refreshButton: {
    padding: scale(8),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: scale(20),
  },

  // التبويبات
  tabsContainer: {
    backgroundColor: 'white',
    paddingHorizontal: scale(20),
    paddingVertical: scale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tabsScrollContent: {
    flexDirection: 'row',
    gap: scale(8),
  },
  tabButton: {
    paddingHorizontal: scale(16),
    paddingVertical: scale(8),
    borderRadius: scale(20),
    backgroundColor: '#F9FAFB',
    minWidth: scale(80),
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#DC2626',
  },
  tabButtonText: {
    fontSize: fontScale(14),
    fontWeight: '600',
    color: '#6B7280',
  },
  tabButtonTextActive: {
    color: 'white',
  },
  tabCount: {
    fontSize: fontScale(12),
    opacity: 0.8,
  },

  // البطاقات والمكونات
  card: {
    backgroundColor: 'white',
    borderRadius: scale(16),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  badge: {
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    borderRadius: scale(12),
    borderWidth: 1,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: fontScale(12),
    fontWeight: '600',
  },

  // بطاقة الطلب
  orderCard: {
    marginHorizontal: scale(20),
    marginBottom: scale(16),
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: scale(16),
    backgroundColor: '#FEF2F2',
    borderBottomWidth: 1,
    borderBottomColor: '#FECACA',
  },
  orderNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  orderNumber: {
    fontSize: fontScale(16),
    fontWeight: '600',
    color: '#374151',
  },
  orderMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingTop: scale(12),
  },
  orderDate: {
    fontSize: fontScale(14),
    color: '#6B7280',
  },
  orderType: {
    fontSize: fontScale(12),
    color: '#DC2626',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(6),
  },
  orderItems: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: scale(16),
  },
  itemsCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  itemsCountText: {
    fontSize: fontScale(14),
    color: '#6B7280',
  },
  orderTotal: {
    fontSize: fontScale(16),
    fontWeight: '600',
    color: '#374151',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: scale(8),
    paddingHorizontal: scale(16),
    paddingBottom: scale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  addressText: {
    flex: 1,
    fontSize: fontScale(14),
    color: '#6B7280',
    lineHeight: scale(20),
  },
  estimatedTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: scale(16),
    backgroundColor: '#FFF7ED',
    borderRadius: scale(12),
    margin: scale(16),
    borderWidth: 1,
    borderColor: '#FDBA74',
  },
  estimatedTimeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    flex: 1,
  },
  estimatedTimeTexts: {
    flex: 1,
  },
  estimatedTimeLabel: {
    fontSize: fontScale(14),
    color: '#9A3412',
    fontWeight: '500',
  },
  estimatedTimeValue: {
    fontSize: fontScale(12),
    color: '#EA580C',
  },
  callButton: {
    padding: scale(8),
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    borderRadius: scale(20),
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: scale(16),
    backgroundColor: '#F9FAFB',
  },
  totalContainer: {
    flex: 1,
  },
  totalLabel: {
    fontSize: fontScale(12),
    color: '#6B7280',
    marginBottom: scale(4),
  },
  totalAmount: {
    fontSize: fontScale(18),
    fontWeight: 'bold',
    color: '#DC2626',
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    backgroundColor: '#DC2626',
    paddingHorizontal: scale(16),
    paddingVertical: scale(10),
    borderRadius: scale(12),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailsButtonText: {
    color: 'white',
    fontSize: fontScale(14),
    fontWeight: '600',
  },

  // حالات التحميل والخطأ
  errorContainer: {
    backgroundColor: '#FEF2F2',
    padding: scale(16),
    margin: scale(20),
    borderRadius: scale(12),
    borderLeftWidth: scale(4),
    borderLeftColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
  },
  errorText: {
    color: '#DC2626',
    fontSize: fontScale(14),
    flex: 1,
    textAlign: 'right',
  },
  retryButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: scale(16),
    paddingVertical: scale(8),
    borderRadius: scale(8),
  },
  retryButtonText: {
    color: '#fff',
    fontSize: fontScale(14),
    fontWeight: 'bold',
  },
  autoRefreshIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: scale(8),
    gap: scale(8),
  },
  autoRefreshText: {
    fontSize: fontScale(12),
    color: '#6B7280',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: scale(16),
  },
  loadingText: {
    fontSize: fontScale(16),
    color: '#6B7280',
  },
  listContainer: {
    paddingTop: scale(16),
    paddingBottom: scale(20),
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingTop: '20%',
    paddingHorizontal: scale(40),
  },
  emptyIcon: {
    backgroundColor: 'white',
    width: scale(120),
    height: scale(120),
    borderRadius: scale(60),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scale(24),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyText: { 
    fontSize: fontScale(20),
    fontWeight: 'bold',
    color: '#374151', 
    marginBottom: scale(8),
    textAlign: 'center',
  },
  emptySubText: { 
    fontSize: fontScale(14), 
    color: '#6B7280', 
    textAlign: 'center',
    lineHeight: scale(20),
  },
  browseButton: {
    marginTop: scale(24),
    backgroundColor: '#DC2626',
    paddingVertical: scale(12),
    paddingHorizontal: scale(24),
    borderRadius: scale(25),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: fontScale(16),
    fontWeight: 'bold',
  },
  browseIcon: {
    marginRight: scale(8),
  },
  listFooter: {
    height: scale(20),
  },
});