// مسار الملف: app/notifications.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// =================================================================
// ✅ دوال الـ Caching للإشعارات
// =================================================================
const CACHE_KEYS = {
  NOTIFICATIONS_DATA: 'notifications_data'
};

const CACHE_DURATION = 1000 * 60 * 2; // 2 دقائق للإشعارات

const cacheNotificationsData = async (userId: string, data: any) => {
  try {
    const cacheItem = { data, timestamp: Date.now() };
    await AsyncStorage.setItem(`${CACHE_KEYS.NOTIFICATIONS_DATA}_${userId}`, JSON.stringify(cacheItem));
    console.log(`✅ Notifications cached for user: ${userId}`);
  } catch (error) {
    console.error('❌ Error caching notifications:', error);
  }
};

const getCachedNotificationsData = async (userId: string) => {
  try {
    const cached = await AsyncStorage.getItem(`${CACHE_KEYS.NOTIFICATIONS_DATA}_${userId}`);
    if (!cached) {
      console.log(`📭 No cache found for user notifications: ${userId}`);
      return null;
    }
    const cacheItem = JSON.parse(cached);
    const isExpired = Date.now() - cacheItem.timestamp > CACHE_DURATION;
    if (isExpired) {
      console.log(`🕐 Cache expired for user notifications: ${userId}`);
      await AsyncStorage.removeItem(`${CACHE_KEYS.NOTIFICATIONS_DATA}_${userId}`);
      return null;
    }
    console.log(`✅ Using cached notifications for user: ${userId}`);
    return cacheItem.data;
  } catch (error) {
    console.error('❌ Error getting cached notifications:', error);
    return null;
  }
};

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
  } | null;
};

// =================================================================
// ✅ مكون NotificationItem مع React.memo
// =================================================================
const NotificationItem = React.memo(({ item }: { item: Notification }) => {
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

  return (
    <View style={[styles.notificationItem, !item.is_read && styles.unreadItem]}>
      <View style={styles.iconContainer}>
        <Ionicons name={iconName} size={24} color="#c02626ff" />
        {!item.is_read && <View style={styles.unreadDot} />}
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationBody}>{item.body}</Text>
        <Text style={styles.notificationDate}>{formattedDate}</Text>
      </View>
      {item.data?.orderId && (
        <Ionicons name="chevron-forward" size={16} color="#999" style={styles.chevron} />
      )}
    </View>
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

  // ✅ useCallback لـ fetchNotifications
  const fetchNotifications = useCallback(async (isRefreshing = false) => {
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
      const cachedNotifications = isRefreshing ? null : await getCachedNotificationsData(user.id);
      
      if (cachedNotifications && !isRefreshing) {
        console.log('✅ Using cached notifications data');
        setNotifications(cachedNotifications);
      } else {
        console.log('🌐 Fetching fresh notifications data');
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        const notificationsData = data || [];
        setNotifications(notificationsData);
        
        // ✅ خزن البيانات في الـ cache
        if (notificationsData.length > 0) {
          await cacheNotificationsData(user.id, notificationsData);
        }
      }
    } catch (err: any) {
      const errorMessage = "فشل في تحميل الإشعارات. تأكد من اتصال الإنترنت.";
      setError(errorMessage);
      console.error("Error fetching notifications:", err);
      
      // ✅ fallback إلى البيانات المخزنة
      const cachedNotifications = await getCachedNotificationsData(user.id);
      if (cachedNotifications) {
        setNotifications(cachedNotifications);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  // ✅ useFocusEffect لتحميل البيانات عند التركيز
  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications])
  );

  // ✅ useCallback لـ handleNotificationPress
  const handleNotificationPress = useCallback(async (notification: Notification) => {
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
      router.push(`/order/${notification.data.orderId}`);
    } else if (notification.data?.type === 'promotion') {
      router.push('/');
    }
  }, [router]);

  // ✅ useCallback لـ renderItem و keyExtractor
  const renderNotificationItem = useCallback(({ item }: { item: Notification }) => (
    <TouchableOpacity 
      activeOpacity={0.7} 
      onPress={() => handleNotificationPress(item)}
      style={styles.notificationTouchable}
    >
      <NotificationItem item={item} />
    </TouchableOpacity>
  ), [handleNotificationPress]);

  const keyExtractor = useCallback((item: Notification) => item.id.toString(), []);

  const handleRefresh = useCallback(() => {
    fetchNotifications(true);
  }, [fetchNotifications]);

  const handleRetry = useCallback(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

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
        maxToRenderPerBatch={15}
        updateCellsBatchingPeriod={50}
        windowSize={11}
        initialNumToRender={10}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={80} color="#ccc" />
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
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#c02626ff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: '#c02626ff',
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
    fontFamily: 'Cairo-Regular',
  },
  retryButton: {
    backgroundColor: '#c02626ff',
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
  notificationTouchable: {
    marginBottom: 10,
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
    color: '#666',
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