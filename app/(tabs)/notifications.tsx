// مسار الملف: app/notifications.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native'; // ✅ 1. استيراد TouchableOpacity
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useRouter } from 'expo-router'; // ✅ 2. استيراد useRouter للتوجيه

// تعريف نوع بيانات الإشعار
type Notification = {
  id: number;
  title: string;
  body: string;
  created_at: string;
  is_read: boolean;
  data: { // ✅ 3. إضافة حقل البيانات لتوجيه المستخدم
    orderId?: number;
  } | null;
};

// لا تغيير هنا
const NotificationItem = ({ item }: { item: Notification }) => (
  <View style={[styles.notificationItem, !item.is_read && styles.unreadItem]}>
    <View style={styles.iconContainer}>
      <Ionicons name={item.is_read ? "notifications-outline" : "notifications"} size={24} color="#c02626ff" />
    </View>
    <View style={styles.textContainer}>
      <Text style={styles.notificationTitle}>{item.title}</Text>
      <Text style={styles.notificationBody}>{item.body}</Text>
      <Text style={styles.notificationDate}>
        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ar })}
      </Text>
    </View>
  </View>
);

export default function NotificationsScreen() {
  const { user } = useAuth();
  const router = useRouter(); // ✅ 4. تهيئة useRouter
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*') // جلب كل الأعمدة بما في ذلك 'data'
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  // ✅✅✅ 5. الدالة الجديدة للتعامل مع الضغط على الإشعار ✅✅✅
  const handleNotificationPress = async (notification: Notification) => {
    // الخطوة 1: إذا كان الإشعار غير مقروء، قم بتحديثه
    if (!notification.is_read) {
      // تحديث الحالة محلياً للاستجابة الفورية
      setNotifications(currentNotifications =>
        currentNotifications.map(n =>
          n.id === notification.id ? { ...n, is_read: true } : n
        )
      );

      // تحديث قاعدة البيانات في الخلفية
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notification.id);

      if (error) {
        console.error("Failed to mark notification as read:", error);
        // في حالة الفشل، يمكنك إعادة الحالة إلى ما كانت عليه
        setNotifications(currentNotifications =>
          currentNotifications.map(n =>
            n.id === notification.id ? { ...n, is_read: false } : n
          )
        );
      }
    }

    // الخطوة 2: توجيه المستخدم إلى الشاشة المناسبة (إذا كان هناك بيانات)
    if (notification.data?.orderId) {
      router.push(`/order/${notification.data.orderId}`);
    }
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#c02626ff" /></View>;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.header}>الإشعارات</Text>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        // ✅ 6. تعديل renderItem لجعله قابلاً للضغط
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.7} onPress={() => handleNotificationPress(item)}>
            <NotificationItem item={item} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Ionicons name="archive-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>لا توجد إشعارات لعرضها</Text>
          </View>
        }
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 10 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchNotifications} colors={["#c02626ff"]} />
        }
      />
    </SafeAreaView>
  );
}

// ... (التنسيقات styles تبقى كما هي)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { fontSize: 28, fontFamily: 'Cairo-Bold', textAlign: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { marginTop: 10, fontSize: 16, color: '#aaa' },
  notificationItem: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10, elevation: 1 },
  unreadItem: { backgroundColor: '#fff8f8', borderWidth: 1, borderColor: '#ffe0e0' },
  iconContainer: { marginRight: 15, justifyContent: 'center', alignItems: 'center' },
  textContainer: { flex: 1, alignItems: 'flex-start' },
  notificationTitle: { fontSize: 16, fontFamily: 'Cairo-Bold', color: '#333' },
  notificationBody: { fontSize: 14, fontFamily: 'Cairo-Regular', color: '#666', marginVertical: 4 },
  notificationDate: { fontSize: 12, color: '#999' },
});
