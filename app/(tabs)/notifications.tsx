// مسار الملف: app/notifications.tsx

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator, 
  RefreshControl, 
  TouchableOpacity,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { scale, fontScale } from '@/lib/responsive';

// ✅ تفعيل LayoutAnimation للأندرويد
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ✅ استيراد نظام التحليلات
import { trackEvent, AnalyticsEvents } from '@/lib/analytics';

// =================================================================
// ✅ تعريف نوع بيانات الإشعار المحدث
// =================================================================
type NotificationType = "order" | "delivery" | "promotion" | "system" | "review";

type Notification = {
  id: number;
  title: string;
  body: string;
  created_at: string;
  is_read: boolean;
  data: {
    orderId?: number;
    type?: NotificationType;
    promotionId?: number;
  } | null;
};

// =================================================================
// ✅ مكون البطاقة المخصصة
// =================================================================
const Card = ({ children, style }: { children: React.ReactNode; style?: any }) => (
  <View style={[styles.card, style]}>{children}</View>
);

// =================================================================
// ✅ مكون البادج
// =================================================================
const Badge = ({ text, style, textStyle }: { text: string; style?: any; textStyle?: any }) => (
  <View style={[styles.badge, style]}>
    <Text style={[styles.badgeText, textStyle]}>{text}</Text>
  </View>
);

// =================================================================
// ✅ مكون NotificationCard المحسن
// =================================================================
const NotificationCard = React.memo(({ 
  item, 
  index, 
  onPress, 
  onMarkAsRead, 
  onDelete 
}: { 
  item: Notification; 
  index: number;
  onPress: (notification: Notification) => void;
  onMarkAsRead: (id: number) => void;
  onDelete: (id: number) => void;
}) => {
  const [showActions, setShowActions] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const formattedDate = useMemo(() => {
    return formatDistanceToNow(new Date(item.created_at), { 
      addSuffix: true, 
      locale: ar 
    });
  }, [item.created_at]);

  // ✅ الحصول على الأيقونة واللون بناءً على نوع الإشعار
  const getNotificationConfig = useCallback((notification: Notification) => {
    const type = notification.data?.type || 'system';
    
    switch (type) {
      case 'order':
        return {
          icon: 'cube-outline' as const,
          color: '#3B82F6',
          bgColor: '#EFF6FF',
          iconComponent: MaterialCommunityIcons
        };
      case 'delivery':
        return {
          icon: 'bicycle' as const,
          color: '#F97316',
          bgColor: '#FFF7ED',
          iconComponent: Ionicons
        };
      case 'promotion':
        return {
          icon: 'gift' as const,
          color: '#8B5CF6',
          bgColor: '#FAF5FF',
          iconComponent: FontAwesome5
        };
      case 'review':
        return {
          icon: 'star' as const,
          color: '#EAB308',
          bgColor: '#FEFCE8',
          iconComponent: Ionicons
        };
      default:
        return {
          icon: 'notifications' as const,
          color: '#6B7280',
          bgColor: '#F9FAFB',
          iconComponent: Ionicons
        };
    }
  }, []);

  const config = getNotificationConfig(item);

  useEffect(() => {
    if (showActions) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [showActions, fadeAnim]);

  const handlePress = useCallback(() => {
    if (!item.is_read) {
      onMarkAsRead(item.id);
    }
    onPress(item);
  }, [onPress, onMarkAsRead, item]);

  const handleMorePress = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowActions(!showActions);
  }, [showActions]);

  const handleMarkAsRead = useCallback(() => {
    if (!item.is_read) {
      onMarkAsRead(item.id);
    }
    setShowActions(false);
  }, [onMarkAsRead, item]);

  const handleDelete = useCallback(() => {
    onDelete(item.id);
    setShowActions(false);
  }, [onDelete, item]);

  const IconComponent = config.iconComponent;

  return (
    <Animated.View 
      style={[
        styles.notificationCard,
        { opacity: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1] }) }
      ]}
    >
      <Card style={[
        styles.cardContainer,
        !item.is_read && styles.unreadCard
      ]}>
        {/* ✅ مؤشر غير مقروء */}
        {!item.is_read && (
          <View style={styles.unreadIndicator} />
        )}

        <TouchableOpacity 
          activeOpacity={0.7} 
          onPress={handlePress}
          style={styles.notificationContent}
        >
          {/* ✅ الأيقونة */}
          <View style={[styles.iconContainer, { backgroundColor: config.bgColor }]}>
            <IconComponent name={config.icon} size={scale(20)} color={config.color} />
          </View>

          {/* ✅ المحتوى */}
          <View style={styles.textContainer}>
            <View style={styles.titleRow}>
              <Text style={[styles.notificationTitle, !item.is_read && styles.unreadTitle]}>
                {item.title}
              </Text>
              <TouchableOpacity onPress={handleMorePress} style={styles.moreButton}>
                <Ionicons name="ellipsis-vertical" size={scale(16)} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            <Text style={styles.notificationBody} numberOfLines={2}>
              {item.body}
            </Text>
            <View style={styles.footerRow}>
              <Text style={styles.notificationDate}>{formattedDate}</Text>
              {!item.is_read && (
                <Badge text="جديد" style={styles.newBadge} />
              )}
            </View>
          </View>
        </TouchableOpacity>

        {/* ✅ أزرار الإجراءات */}
        {showActions && (
          <Animated.View 
            style={[styles.actionsContainer, { opacity: fadeAnim }]}
          >
            <View style={styles.actionsRow}>
              {!item.is_read && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.markReadButton]}
                  onPress={handleMarkAsRead}
                >
                  <Ionicons name="checkmark-circle" size={scale(14)} color="#10B981" />
                  <Text style={[styles.actionText, styles.markReadText]}>تعيين كمقروء</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={[styles.actionButton, styles.deleteButton]}
                onPress={handleDelete}
              >
                <Ionicons name="trash-outline" size={scale(14)} color="#DC2626" />
                <Text style={[styles.actionText, styles.deleteText]}>حذف</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </Card>
    </Animated.View>
  );
});

// =================================================================
// ✅ المكون الرئيسي المحسن
// =================================================================
export default function NotificationsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasFetchedRef = useRef(false);

  // ✅ useCallback لـ fetchNotifications
  const fetchNotifications = useCallback(async (isRefreshing = false, isAutoRefresh = false) => {
    if (!user) {
      setLoading(false);
      return;
    }

    if (!isRefreshing && !isAutoRefresh && hasFetchedRef.current) {
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
      console.log('🌐 Fetching fresh notifications data from server');
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const notificationsData = data || [];
      setNotifications(notificationsData);
      hasFetchedRef.current = true;

      if (!isAutoRefresh) {
        trackEvent('notifications_fetched', {
          notifications_count: notificationsData.length,
          unread_count: notificationsData.filter(n => !n.is_read).length,
          is_refreshing: isRefreshing
        });
      }

    } catch (err: any) {
      const errorMessage = "فشل في تحميل الإشعارات. تأكد من اتصال الإنترنت.";
      setError(errorMessage);
      console.error("Error fetching notifications:", err);
      
      trackEvent(AnalyticsEvents.ERROR_OCCURRED, {
        screen: 'notifications',
        error_type: 'fetch_notifications_failed',
        error_message: err.message
      });
    } finally {
      if (!isAutoRefresh) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [user]);

  // ✅ useEffect للتحديث التلقائي
  useEffect(() => {
    const hasUnreadNotifications = notifications.some(n => !n.is_read);
    
    if (hasUnreadNotifications) {
      refreshIntervalRef.current = setInterval(() => {
        console.log('🔄 Auto-refreshing notifications...');
        fetchNotifications(false, true);
      }, 30000);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [notifications, fetchNotifications]);

  // ✅ useFocusEffect للتحميل الأولي
  useFocusEffect(
    useCallback(() => {
      trackEvent('notifications_screen_viewed', {
        user_id: user?.id,
        has_unread_notifications: notifications.some(n => !n.is_read)
      });

      if (!hasFetchedRef.current) {
        fetchNotifications();
      }

      return () => {};
    }, [fetchNotifications, user, notifications])
  );

  // ✅ useCallback لـ handleNotificationPress
  const handleNotificationPress = useCallback(async (notification: Notification) => {
    trackEvent('notification_tapped', {
      notification_id: notification.id,
      notification_title: notification.title,
      is_read: notification.is_read,
      has_action: !!(notification.data?.orderId || notification.data?.promotionId)
    });

    if (notification.data?.orderId) {
      router.push({
        pathname: '/order/[orderId]',
        params: { orderId: notification.data.orderId.toString() }
      });
    } else if (notification.data?.promotionId || notification.data?.type === 'promotion') {
      router.push('/');
    }
  }, [router]);

  // ✅ useCallback لـ handleMarkAsRead
  const handleMarkAsRead = useCallback(async (id: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    setNotifications(currentNotifications =>
      currentNotifications.map(n =>
        n.id === id ? { ...n, is_read: true } : n
      )
    );

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;
      
      console.log(`✅ Notification ${id} marked as read`);
      
      trackEvent('notification_marked_read', {
        notification_id: id
      });
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
      setNotifications(currentNotifications =>
        currentNotifications.map(n =>
          n.id === id ? { ...n, is_read: false } : n
        )
      );
    }
  }, []);

  // ✅ useCallback لـ handleDelete
  const handleDelete = useCallback(async (id: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    const notificationToDelete = notifications.find(n => n.id === id);
    setNotifications(currentNotifications =>
      currentNotifications.filter(n => n.id !== id)
    );

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      console.log(`🗑️ Notification ${id} deleted`);
      
      trackEvent('notification_deleted', {
        notification_id: id
      });
    } catch (err) {
      console.error("Failed to delete notification:", err);
      if (notificationToDelete) {
        setNotifications(currentNotifications => [...currentNotifications, notificationToDelete]);
      }
    }
  }, [notifications]);

  // ✅ useCallback لـ handleMarkAllAsRead
  const handleMarkAllAsRead = useCallback(async () => {
    trackEvent('mark_all_notifications_read', {
      total_notifications: notifications.length,
      unread_count: unreadCount
    });

    try {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      
      if (unreadNotifications.length === 0) return;

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      
      setNotifications(currentNotifications =>
        currentNotifications.map(n => ({ ...n, is_read: true }))
      );

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user?.id)
        .eq('is_read', false);

      if (error) throw error;

      console.log(`✅ Marked ${unreadNotifications.length} notifications as read`);
      
      trackEvent('all_notifications_marked_read', {
        marked_count: unreadNotifications.length
      });

    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
      setNotifications(currentNotifications =>
        currentNotifications.map(n => {
          const original = notifications.find(original => original.id === n.id);
          return original ? { ...n, is_read: original.is_read } : n;
        })
      );
    }
  }, [notifications, user]);

  // ✅ useCallback لـ renderItem و keyExtractor
  const renderNotificationItem = useCallback(({ item, index }: { item: Notification; index: number }) => (
    <NotificationCard 
      item={item} 
      index={index}
      onPress={handleNotificationPress}
      onMarkAsRead={handleMarkAsRead}
      onDelete={handleDelete}
    />
  ), [handleNotificationPress, handleMarkAsRead, handleDelete]);

  const keyExtractor = useCallback((item: Notification) => item.id.toString(), []);

  const handleRefresh = useCallback(() => {
    trackEvent(AnalyticsEvents.PULL_TO_REFRESH, {
      screen: 'notifications',
      current_notifications_count: notifications.length
    });
    
    fetchNotifications(true);
  }, [fetchNotifications, notifications.length]);

  const handleRetry = useCallback(() => {
    trackEvent('notifications_retry_attempt', {
      previous_error: error
    });
    
    fetchNotifications();
  }, [fetchNotifications, error]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  // ✅ useMemo للبيانات المشتقة
  const unreadCount = useMemo(() => 
    notifications.filter(n => !n.is_read).length, 
    [notifications]
  );

  const hasNotifications = useMemo(() => notifications.length > 0, [notifications.length]);

  // ✅ تجميع الإشعارات حسب الوقت
  const groupedNotifications = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    return {
      today: notifications.filter(n => new Date(n.created_at) >= today),
      yesterday: notifications.filter(n => {
        const notificationDate = new Date(n.created_at);
        return notificationDate >= yesterday && notificationDate < today;
      }),
      earlier: notifications.filter(n => new Date(n.created_at) < yesterday)
    };
  }, [notifications]);

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#DC2626" />
        <Text style={styles.loadingText}>جاري تحميل الإشعارات...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ✅ الهيدر الجديد مع التدرج اللوني */}
      <LinearGradient
        colors={['#DC2626', '#DC2626', '#B91C1C']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* ✅ العناصر الزخرفية */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
        
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={scale(20)} color="white" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>الإشعارات</Text>
              {unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{unreadCount} جديد</Text>
                </View>
              )}
            </View>
          </View>

          {/* ✅ زر تعيين الكل كمقروء */}
          {unreadCount > 0 && (
            <TouchableOpacity 
              style={styles.markAllButton}
              onPress={handleMarkAllAsRead}
            >
              <Ionicons name="checkmark-circle" size={scale(16)} color="white" />
              <Text style={styles.markAllText}>تعيين الكل كمقروء</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
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

        {/* ✅ مؤشر التحديث */}
        {refreshing && (
          <View style={styles.refreshIndicator}>
            <ActivityIndicator size="small" color="#DC2626" />
            <Text style={styles.refreshText}>جاري تحديث الإشعارات...</Text>
          </View>
        )}

        <FlatList
          data={[
            ...groupedNotifications.today.map(n => ({ ...n, _section: 'today' })),
            ...groupedNotifications.yesterday.map(n => ({ ...n, _section: 'yesterday' })),
            ...groupedNotifications.earlier.map(n => ({ ...n, _section: 'earlier' }))
          ]}
          keyExtractor={keyExtractor}
          renderItem={renderNotificationItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={handleRefresh} 
              colors={["#DC2626"]} 
              tintColor="#DC2626"
            />
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Ionicons name="notifications-off-outline" size={scale(80)} color="#E5E7EB" />
              </View>
              <Text style={styles.emptyText}>لا توجد إشعارات</Text>
              <Text style={styles.emptySubText}>أنت على اطلاع بكل شيء!</Text>
            </View>
          }
          ListFooterComponent={<View style={styles.listFooter} />}
        />
      </SafeAreaView>
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
  safeArea: {
    flex: 1,
  },
  
  // ✅ الهيدر الجديد
  headerGradient: {
    height: scale(180),
    borderBottomLeftRadius: scale(30),
    borderBottomRightRadius: scale(30),
    overflow: 'hidden',
    position: 'relative',
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -scale(80),
    right: -scale(80),
    width: scale(200),
    height: scale(200),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: scale(100),
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -scale(60),
    left: -scale(60),
    width: scale(150),
    height: scale(150),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: scale(75),
  },
  headerContent: {
    paddingHorizontal: scale(20),
    paddingTop: scale(90),
  },
  headerTop: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: scale(16),
  },
  backButton: {
    padding: scale(8),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: scale(20),
    marginLeft: scale(12),
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: fontScale(24),
    fontWeight: 'bold',
    color: 'white',
    marginRight: scale(12),
  },
  unreadBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: scale(12),
    paddingHorizontal: scale(12),
    paddingVertical: scale(4),
    backdropFilter: 'blur(10px)',
  },
  unreadBadgeText: {
    color: 'white',
    fontSize: fontScale(12),
    fontWeight: '600',
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: scale(8),
  },
  markAllText: {
    color: 'white',
    fontSize: fontScale(14),
    opacity: 0.9,
  },

  // ✅ عرض الخطأ
  errorContainer: {
    backgroundColor: '#FEF2F2',
    padding: scale(16),
    margin: scale(16),
    borderRadius: scale(12),
    borderLeftWidth: scale(4),
    borderLeftColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    color: '#DC2626',
    fontSize: fontScale(14),
    flex: 1,
    textAlign: 'right',
    marginRight: scale(8),
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
    fontWeight: '600',
  },

  // ✅ مؤشر التحديث
  refreshIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: scale(8),
  },
  refreshText: {
    fontSize: fontScale(12),
    color: '#6B7280',
    marginLeft: scale(8),
  },

  // ✅ القائمة
  listContainer: {
    paddingHorizontal: scale(16),
    paddingTop: scale(20),
    paddingBottom: scale(20),
  },

  // ✅ بطاقة الإشعار
  notificationCard: {
    marginBottom: scale(12),
  },
  cardContainer: {
    borderRadius: scale(16),
    backgroundColor: 'white',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  unreadCard: {
    backgroundColor: '#FFFFFF',
  },
  unreadIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: scale(4),
    backgroundColor: '#DC2626',
  },
  notificationContent: {
    flexDirection: 'row',
    padding: scale(16),
  },
  iconContainer: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(12),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: scale(4),
  },
  notificationTitle: {
    fontSize: fontScale(16),
    fontWeight: '600',
    color: '#6B7280',
    flex: 1,
    marginRight: scale(8),
  },
  unreadTitle: {
    color: '#1F2937',
  },
  moreButton: {
    padding: scale(4),
  },
  notificationBody: {
    fontSize: fontScale(14),
    color: '#6B7280',
    lineHeight: scale(20),
    marginBottom: scale(8),
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  notificationDate: {
    fontSize: fontScale(12),
    color: '#9CA3AF',
  },
  newBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: scale(8),
    paddingVertical: scale(2),
  },

  // ✅ أزرار الإجراءات
  actionsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    padding: scale(12),
  },
  actionsRow: {
    flexDirection: 'row',
    gap: scale(8),
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(6),
    paddingVertical: scale(10),
    borderRadius: scale(8),
  },
  markReadButton: {
    backgroundColor: '#ECFDF5',
  },
  deleteButton: {
    backgroundColor: '#FEF2F2',
  },
  actionText: {
    fontSize: fontScale(12),
    fontWeight: '600',
  },
  markReadText: {
    color: '#10B981',
  },
  deleteText: {
    color: '#DC2626',
  },

  // ✅ الحالات الفارغة والتحميل
  centered: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: scale(16),
    fontSize: fontScale(16),
    color: '#6B7280',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: scale(80),
    paddingHorizontal: scale(20),
  },
  emptyIcon: {
    width: scale(100),
    height: scale(100),
    borderRadius: scale(50),
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scale(16),
  },
  emptyText: {
    fontSize: fontScale(18),
    fontWeight: '600',
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
  listFooter: {
    height: scale(20),
  },

  // ✅ المكونات العامة
  card: {
    backgroundColor: 'white',
    borderRadius: scale(12),
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
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(12),
    backgroundColor: '#DC2626',
  },
  badgeText: {
    fontSize: fontScale(12),
    fontWeight: '600',
    color: 'white',
  },
});