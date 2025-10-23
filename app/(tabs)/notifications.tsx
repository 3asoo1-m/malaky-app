// مسار الملف: app/notifications.tsx

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useRouter, useFocusEffect } from 'expo-router';

// ✅ استيراد نظام التحليلات
import { trackEvent, AnalyticsEvents } from '@/lib/analytics';

// =================================================================
// ✅ تعريف نوع بيانات الإشعار
// =================================================================
type Notification = {
  id: number;
  title: string;
  body: string;
  created_at: string;
  is_read: boolean;
  data: {
    orderId?: number;
    type?: string;
    promotionId?: number;
  } | null;
};

// =================================================================
// ✅ مكون NotificationItem مع React.memo
// =================================================================
const NotificationItem = React.memo(({ item, onPress }: { item: Notification; onPress: (notification: Notification) => void }) => {
  const formattedDate = useMemo(() => {
    return formatDistanceToNow(new Date(item.created_at), { 
      addSuffix: true, 
      locale: ar 
    });
  }, [item.created_at]);

  const iconName = useMemo(() => 
    item.is_read ? "notifications-outline" : "notifications", 
    [item.is_read]
  );

  const handlePress = useCallback(() => {
    onPress(item);
  }, [onPress, item]);

  return (
    <TouchableOpacity 
      activeOpacity={0.7} 
      onPress={handlePress}
      style={[styles.notificationItem, !item.is_read && styles.unreadItem]}
    >
      <View style={styles.iconContainer}>
        <Ionicons name={iconName} size={24} color="#c02626ff" />
        {!item.is_read && <View style={styles.unreadDot} />}
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationBody}>{item.body}</Text>
        <Text style={styles.notificationDate}>{formattedDate}</Text>
      </View>
      {(item.data?.orderId || item.data?.promotionId) && (
        <Ionicons name="chevron-forward" size={16} color="#999" style={styles.chevron} />
      )}
    </TouchableOpacity>
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
  const hasFetchedRef = useRef(false); // ✅ منع إعادة التحميل المتكرر

  // ✅ useCallback لـ fetchNotifications بدون caching
  const fetchNotifications = useCallback(async (isRefreshing = false, isAutoRefresh = false) => {
    if (!user) {
      setLoading(false);
      return;
    }

    // ✅ منع إعادة التحميل إذا كانت البيانات موجودة مسبقاً
    if (!isRefreshing && !isAutoRefresh && hasFetchedRef.current) {
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
      console.log('🌐 Fetching fresh notifications data from server');
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const notificationsData = data || [];
      setNotifications(notificationsData);
      hasFetchedRef.current = true; // ✅ وضع علامة أن البيانات تم جلبها

      // ✅ تتبع نجاح جلب الإشعارات
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
      
      // ✅ تتبع الأخطاء
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

  // ✅ useEffect للتحديث التلقائي - منفصل عن useFocusEffect
  useEffect(() => {
    // ✅ بدء التحديث التلقائي كل 30 ثانية فقط إذا كان هناك إشعارات غير مقروءة
    const hasUnreadNotifications = notifications.some(n => !n.is_read);
    
    if (hasUnreadNotifications) {
      refreshIntervalRef.current = setInterval(() => {
        console.log('🔄 Auto-refreshing notifications...');
        fetchNotifications(false, true);
      }, 30000); // 30 ثانية
    }

    return () => {
      // ✅ تنظيف الـ interval عند تغيير notifications
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [notifications, fetchNotifications]); // ✅ يعتمد على notifications الحالية

  // ✅ useFocusEffect مبسط - للتحميل الأولي فقط
  useFocusEffect(
    useCallback(() => {
      // ✅ تتبع فتح شاشة الإشعارات
      trackEvent('notifications_screen_viewed', {
        user_id: user?.id,
        has_unread_notifications: notifications.some(n => !n.is_read)
      });

      // ✅ جلب البيانات فقط إذا لم تكن محملة مسبقاً
      if (!hasFetchedRef.current) {
        fetchNotifications();
      }

      return () => {
        // ✅ لا تقم بتنظيف الـ interval هنا لأنه في useEffect منفصل
      };
    }, [fetchNotifications, user, notifications])
  );

  // ✅ useCallback لـ handleNotificationPress
  const handleNotificationPress = useCallback(async (notification: Notification) => {
    // ✅ تتبع النقر على الإشعار
    trackEvent('notification_tapped', {
      notification_id: notification.id,
      notification_title: notification.title,
      is_read: notification.is_read,
      has_action: !!(notification.data?.orderId || notification.data?.promotionId)
    });

    // ✅ تحديث حالة القراءة محلياً للاستجابة الفورية
    if (!notification.is_read) {
      setNotifications(currentNotifications =>
        currentNotifications.map(n =>
          n.id === notification.id ? { ...n, is_read: true } : n
        )
      );

      // ✅ تحديث قاعدة البيانات في الخلفية
      try {
        const { error } = await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', notification.id);

        if (error) throw error;
        
        console.log(`✅ Notification ${notification.id} marked as read`);
        
        // ✅ تتبع تحديث حالة القراءة
        trackEvent('notification_marked_read', {
          notification_id: notification.id
        });
      } catch (err) {
        console.error("Failed to mark notification as read:", err);
        // ✅ استعادة الحالة في حالة الفشل
        setNotifications(currentNotifications =>
          currentNotifications.map(n =>
            n.id === notification.id ? { ...n, is_read: false } : n
          )
        );
      }
    }

    // ✅ توجيه المستخدم إلى الشاشة المناسبة
    if (notification.data?.orderId) {
      router.push({
        pathname: '/orders/[orderId]',
        params: { orderId: notification.data.orderId.toString() }
      });
    } else if (notification.data?.promotionId || notification.data?.type === 'promotion') {
      // ✅ توجيه كل ما يتعلق بالعروض إلى الصفحة الرئيسية
      router.push('/');
    }
  }, [router]);

  // ✅ useCallback لـ renderItem و keyExtractor
  const renderNotificationItem = useCallback(({ item }: { item: Notification }) => (
    <NotificationItem item={item} onPress={handleNotificationPress} />
  ), [handleNotificationPress]);

  const keyExtractor = useCallback((item: Notification) => item.id.toString(), []);

  const handleRefresh = useCallback(() => {
    // ✅ تتبع السحب للتحديث
    trackEvent(AnalyticsEvents.PULL_TO_REFRESH, {
      screen: 'notifications',
      current_notifications_count: notifications.length
    });
    
    fetchNotifications(true);
  }, [fetchNotifications, notifications.length]);

  const handleRetry = useCallback(() => {
    // ✅ تتبع إعادة المحاولة
    trackEvent('notifications_retry_attempt', {
      previous_error: error
    });
    
    fetchNotifications();
  }, [fetchNotifications, error]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleMarkAllAsRead = useCallback(async () => {
    // ✅ تتبع محاولة تعيين الكل كمقروء
    trackEvent('mark_all_notifications_read', {
      total_notifications: notifications.length,
      unread_count: unreadCount
    });

    try {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      
      if (unreadNotifications.length === 0) return;

      // ✅ تحديث محلي فوري
      setNotifications(currentNotifications =>
        currentNotifications.map(n => ({ ...n, is_read: true }))
      );

      // ✅ تحديث قاعدة البيانات
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user?.id)
        .eq('is_read', false);

      if (error) throw error;

      console.log(`✅ Marked ${unreadNotifications.length} notifications as read`);
      
      // ✅ تتبع النجاح
      trackEvent('all_notifications_marked_read', {
        marked_count: unreadNotifications.length
      });

    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
      // ✅ استعادة الحالة في حالة الفشل
      setNotifications(currentNotifications =>
        currentNotifications.map(n => {
          const original = notifications.find(original => original.id === n.id);
          return original ? { ...n, is_read: original.is_read } : n;
        })
      );
    }
  }, [notifications, user]);

  // ✅ useMemo للبيانات المشتقة
  const unreadCount = useMemo(() => 
    notifications.filter(n => !n.is_read).length, 
    [notifications]
  );

  const hasNotifications = useMemo(() => notifications.length > 0, [notifications.length]);

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#c02626ff" />
        <Text style={styles.loadingText}>جاري تحميل الإشعارات...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ✅ رأس الصفحة المحسن */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>الإشعارات</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.markAllButton}>
              <Text style={styles.markAllText}>تعيين الكل كمقروء</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            onPress={handleRefresh} 
            style={styles.refreshButton}
            disabled={refreshing}
          >
            <Ionicons 
              name="refresh" 
              size={20} 
              color={refreshing ? "#999" : "#c02626ff"} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* ✅ عرض الخطأ إذا وجد */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={20} color="#c02626ff" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ✅ مؤشر التحديث التلقائي */}
      {refreshing && (
        <View style={styles.autoRefreshIndicator}>
          <ActivityIndicator size="small" color="#c02626ff" />
          <Text style={styles.autoRefreshText}>جاري تحديث الإشعارات...</Text>
        </View>
      )}

      <FlatList
        data={notifications}
        keyExtractor={keyExtractor}
        renderItem={renderNotificationItem}
        contentContainerStyle={[
          styles.listContainer,
          !hasNotifications && styles.emptyListContainer
        ]}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh} 
            colors={["#c02626ff"]} 
            tintColor="#c02626ff"
          />
        }
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={12}
        updateCellsBatchingPeriod={100}
        windowSize={9}
        initialNumToRender={8}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={80} color="#E5E7EB" />
            <Text style={styles.emptyText}>لا توجد إشعارات لعرضها</Text>
            <Text style={styles.emptySubText}>سيظهر هنا أي إشعارات جديدة تتلقاها</Text>
          </View>
        }
        ListFooterComponent={hasNotifications ? <View style={styles.listFooter} /> : null}
      />
    </SafeAreaView>
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
  unreadBadge: {
    backgroundColor: '#c02626ff',
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Cairo-Bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  markAllButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
  },
  markAllText: {
    color: '#6B7280',
    fontSize: 12,
    fontFamily: 'Cairo-SemiBold',
  },
  refreshButton: {
    padding: 6,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#c02626ff',
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    color: '#c02626ff',
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
    fontFamily: 'Cairo-Regular',
    marginRight: 8,
  },
  retryButton: {
    backgroundColor: '#c02626ff',
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
  centered: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
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
  notificationItem: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    padding: 16, 
    borderRadius: 12, 
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    alignItems: 'center',
    marginBottom: 10,
  },
  unreadItem: { 
    backgroundColor: '#fff8f8', 
    borderWidth: 1, 
    borderColor: '#ffe0e0' 
  },
  iconContainer: { 
    marginRight: 16, 
    justifyContent: 'center', 
    alignItems: 'center',
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#c02626ff',
  },
  textContainer: { 
    flex: 1, 
    alignItems: 'flex-start' 
  },
  notificationTitle: { 
    fontSize: 16, 
    fontFamily: 'Cairo-Bold', 
    color: '#333',
    marginBottom: 4,
  },
  notificationBody: { 
    fontSize: 14, 
    fontFamily: 'Cairo-Regular', 
    color: '#666', 
    marginBottom: 6,
    lineHeight: 20,
  },
  notificationDate: { 
    fontSize: 12, 
    color: '#999',
    fontFamily: 'Cairo-Regular',
  },
  chevron: {
    marginLeft: 8,
  },
  emptyContainer: { 
    alignItems: 'center', 
    paddingHorizontal: 20,
  },
  emptyText: { 
    marginTop: 16, 
    fontSize: 18, 
    color: '#555',
    fontFamily: 'Cairo-Bold',
    textAlign: 'center',
  },
  emptySubText: { 
    marginTop: 8, 
    fontSize: 14, 
    color: '#999', 
    textAlign: 'center', 
    fontFamily: 'Cairo-Regular',
    lineHeight: 20,
  },
  listFooter: {
    height: 20,
  },
});