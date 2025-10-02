// مسار الملف: app/(tabs)/orders.tsx

import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Animated } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '@/lib/useAuth';
import { supabase } from '@/lib/supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
// واجهة الطلب
interface Order {
    id: number;
    created_at: string;
    total_price: number;
    status: string;
}
// ... (واجهة Order و مكون OrderCard يبقيان كما هما تماماً)
interface Order { /* ... */ }
type IoniconName = React.ComponentProps<typeof Ionicons>['name'];
const OrderCard = ({ item, index }: { item: Order; index: number }) => {
    const router = useRouter();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useFocusEffect(
        useCallback(() => {
            Animated.timing(fadeAnim, { toValue: 1, duration: 500, delay: index * 100, useNativeDriver: true }).start();
            Animated.timing(slideAnim, { toValue: 0, duration: 500, delay: index * 100, useNativeDriver: true }).start();
        }, [fadeAnim, slideAnim, index])
    );

    const translateStatus = (status: string): string => {
        const translations: { [key: string]: string } = {
            'new': 'جديد',
            'processing': 'قيد التحضير',
            'delivered': 'تم التوصيل',
            'ready': 'جاهز',
            'cancelled': 'ملغي'
        };
        return translations[status.toLowerCase()] || status;
    };

    const getStatusStyle = (status: string): { icon: IoniconName; color: string; backgroundColor: string; borderColor: string } => {
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
    };

    const statusStyle = getStatusStyle(item.status);

    return (
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <TouchableOpacity
                style={styles.orderCard}
                onPress={() => router.push({ pathname: '/order/[orderId]', params: { orderId: item.id } })}
            >
                <View style={styles.cardTopSection}>
                    <View style={styles.orderInfo}>
                        <Text style={styles.orderId}>طلب #{item.id}</Text>
                        <Text style={styles.orderDate}>
                            {new Date(item.created_at).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>
                    <View style={[styles.statusContainer, { backgroundColor: statusStyle.backgroundColor, borderColor: statusStyle.borderColor }]}>
                        <Ionicons name={statusStyle.icon} size={16} color={statusStyle.color} />
                        <Text style={[styles.statusText, { color: statusStyle.color }]}>{translateStatus(item.status)}</Text>
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
};


// =================================================================
// ✅ التعديل الرئيسي هنا في المكون الأساسي
// =================================================================
export default function OrdersScreen() {
    const router = useRouter(); // استدعاء useRouter
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            const fetchOrders = async () => {
                if (!user) { setLoading(false); return; }
                setLoading(true);
                const { data, error } = await supabase
                    .from('orders')
                    .select('id, created_at, total_price, status')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) { console.error('Error fetching orders:', error.message); }
                else { setOrders(data); }
                setLoading(false);
            };
            fetchOrders();
        }, [user])
    );

    return (
        <View style={styles.container}>
            {/* 1. إضافة رأس الصفحة الجديد */}
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>طلباتي</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <ActivityIndicator style={{ flex: 1 }} size="large" color="#C62828" />
            ) : (
                <FlatList
                    data={orders}
                    renderItem={({ item, index }) => <OrderCard item={item} index={index} />}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContainer}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="receipt-outline" size={80} color="#ccc" />
                            <Text style={styles.emptyText}>لا توجد طلبات سابقة</Text>
                            <Text style={styles.emptySubText}>ابدأ أول طلب لك من قائمة الطعام!</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

// =================================================================
// ✅ تحديث التنسيقات لإضافة رأس الصفحة الجديد
// =================================================================
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F5F5' },

    // --- تنسيقات رأس الصفحة الجديدة ---
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 22,
        fontFamily: 'Cairo-Bold',
        color: '#1A1A1A',
    },
    // --------------------------------

    listContainer: { paddingHorizontal: 16, paddingBottom: 20, paddingTop: 16 },

    // ... (باقي التنسيقات تبقى كما هي تماماً)
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
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: '20%' },
    emptyText: { fontSize: 20, fontFamily: 'Cairo-Bold', color: '#555', marginTop: 16 },
    emptySubText: { fontSize: 14, color: '#999', marginTop: 8, textAlign: 'center', fontFamily: 'Cairo-Regular' },
});
