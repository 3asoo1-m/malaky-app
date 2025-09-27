// مسار الملف: app/(tabs)/orders.tsx

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '@/lib/useAuth';
import { supabase } from '@/lib/supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

// 1. تعريف واجهة الطلب لتنظيم البيانات
interface Order {
    id: number;
    created_at: string;
    total_price: number;
    status: string;
}

export default function OrdersScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    // 2. جلب الطلبات عند الدخول إلى الشاشة
    useFocusEffect(
        useCallback(() => {
            const fetchOrders = async () => {
                if (!user) {
                    setLoading(false);
                    return;
                }
                setLoading(true);
                const { data, error } = await supabase
                    .from('orders')
                    .select('id, created_at, total_price, status')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false }); // الأحدث أولاً

                if (error) {
                    console.error('Error fetching orders:', error.message);
                } else {
                    setOrders(data);
                }
                setLoading(false);
            };

            fetchOrders();
        }, [user])
    );

    // 3. تصميم بطاقة الطلب
    const renderOrder = ({ item }: { item: Order }) => (
        <TouchableOpacity
            style={styles.orderCard}
            // --- التعديل هنا ---
            onPress={() => router.push({
                pathname: '/order/[orderId]', // <-- استخدم اسم الملف الفعلي كقالب
                params: { orderId: item.id }, // <-- مرر المعلمات هنا
            })}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.orderId}>طلب #{item.id}</Text>
                <Text style={styles.orderDate}>
                    {new Date(item.created_at).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
            </View>
            <View style={styles.cardFooter}>
                <View style={styles.statusContainer}>
                    <Text style={styles.statusText}>{item.status}</Text>
                </View>
                <Text style={styles.orderTotal}>{item.total_price.toFixed(2)} ₪</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <Text style={styles.headerTitle}>طلباتي</Text>

            {loading ? (
                <ActivityIndicator style={{ marginTop: 50 }} size="large" color="#C62828" />
            ) : (
                <FlatList
                    data={orders}
                    renderItem={renderOrder}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContainer}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="receipt-outline" size={80} color="#ccc" />
                            <Text style={styles.emptyText}>لا توجد طلبات سابقة</Text>
                            <Text style={styles.emptySubText}>ابدأ أول طلب لك من قائمة الطعام!</Text>
                            <TouchableOpacity style={styles.browseButton} onPress={() => router.push('/')}>
                                <Text style={styles.browseButtonText}>تصفح القائمة</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}
        </View>
    );
}

// 4. إضافة التنسيقات
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9F9F9' },
    headerTitle: { fontSize: 32, fontWeight: 'bold', textAlign: 'right', margin: 16, color: '#1A1A1A' },
    listContainer: { paddingHorizontal: 16, paddingBottom: 20 },

    orderCard: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#eee',
    },
    cardHeader: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    orderId: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    orderDate: {
        fontSize: 14,
        color: '#888',
    },
    cardFooter: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusContainer: {
        backgroundColor: '#E3F2FD', // لون أزرق فاتح
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusText: {
        color: '#1E88E5', // لون أزرق
        fontWeight: '600',
        fontSize: 13,
    },
    orderTotal: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#C62828',
    },

    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: '20%' },
    emptyText: { fontSize: 20, fontWeight: '600', color: '#555', marginTop: 16 },
    emptySubText: { fontSize: 14, color: '#999', marginTop: 8, textAlign: 'center' },
    browseButton: { marginTop: 24, backgroundColor: '#C62828', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 30 },
    browseButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
