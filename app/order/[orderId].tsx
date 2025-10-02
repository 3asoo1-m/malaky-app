// مسار الملف: app/order/[orderId].tsx

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity, Image, Animated } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// --- واجهات البيانات (تبقى كما هي) ---
interface OrderDetails {
    id: number;
    created_at: string;
    total_price: number;
    subtotal: number;
    delivery_price: number;
    status: string;
    order_type: string;
    user_addresses: { street_address: string; delivery_zones: { city: string; area_name: string; } | null; } | null;
    branches: { name: string; address: string; } | null;
    order_items: {
        quantity: number;
        notes: string | null;
        options: any;
        menu_items: { name: string; image_url: string; options: any; } | null;
    }[];
}
type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

// =================================================================
// ✅ 1. مكون شريط تتبع الحالة (Status Tracker)
// =================================================================
const StatusTracker = ({ currentStatus }: { currentStatus: string }) => {
    const statuses = ['new', 'processing', 'ready', 'delivered'];
    const currentIndex = statuses.indexOf(currentStatus.toLowerCase());

    const getStatusInfo = (status: string): { label: string; icon: IoniconName } => {
        switch (status) {
            case 'new': return { label: 'جديد', icon: 'receipt-outline' };
            case 'processing': return { label: 'يُحضّر', icon: 'hourglass-outline' };
            case 'ready': return { label: 'جاهز', icon: 'bicycle-outline' };
            case 'delivered': return { label: 'تم التوصيل', icon: 'checkmark-done-circle-outline' };
            default: return { label: 'غير معروف', icon: 'help-circle-outline' };
        }
    };

    return (
        <View style={styles.trackerContainer}>
            {statuses.map((status, index) => {
                const isActive = index <= currentIndex;
                const info = getStatusInfo(status);
                return (
                    <React.Fragment key={status}>
                        <View style={styles.stepContainer}>
                            <View style={[styles.stepIconContainer, isActive && styles.stepIconActive]}>
                                <Ionicons name={info.icon} size={24} color={isActive ? '#fff' : '#9CA3AF'} />
                            </View>
                            <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]}>{info.label}</Text>
                        </View>
                        {index < statuses.length - 1 && <View style={[styles.connector, isActive && styles.connectorActive]} />}
                    </React.Fragment>
                );
            })}
        </View>
    );
};

export default function OrderDetailsScreen() {
    const { orderId } = useLocalSearchParams();
    const router = useRouter();
    const [order, setOrder] = useState<OrderDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const fetchOrderDetails = async () => {
            if (!orderId) return;
            setLoading(true);
            const { data, error } = await supabase
                .from('orders')
                .select(`id, created_at, total_price, subtotal, delivery_price, status, order_type, user_addresses(street_address, delivery_zones(city, area_name)), branches(name, address), order_items(quantity, notes, options, menu_items(name, image_url, options))`)
                .eq('id', orderId)
                .single();

            if (error) {
                console.error('Error fetching order details:', error);
                Alert.alert('خطأ', 'لم نتمكن من العثور على تفاصيل هذا الطلب.');
                setLoading(false);
                return;
            }
            if (data) {
                setOrder(data as unknown as OrderDetails);
                Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
            }
            setLoading(false);
        };
        fetchOrderDetails();
    }, [orderId]);

    if (loading) {
        return <View style={styles.centered}><ActivityIndicator size="large" color="#C62828" /></View>;
    }
    if (!order) {
        return <View style={styles.centered}><Text style={styles.errorText}>لم يتم العثور على الطلب.</Text></View>;
    }

    const renderAddress = () => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Ionicons name={order.order_type === 'delivery' ? 'location-outline' : 'storefront-outline'} size={22} color="#C62828" />
                <Text style={styles.cardTitle}>
                    {order.order_type === 'delivery' ? 'عنوان التوصيل' : 'فرع الاستلام'}
                </Text>
            </View>
            <View style={styles.cardContent}>
                {order.order_type === 'delivery' && order.user_addresses ? (
                    <>
                        <Text style={styles.infoTextBold}>{order.user_addresses.delivery_zones?.area_name}</Text>
                        <Text style={styles.infoText}>{order.user_addresses.delivery_zones?.city}, {order.user_addresses.street_address}</Text>
                    </>
                ) : order.order_type === 'pickup' && order.branches ? (
                    <>
                        <Text style={styles.infoTextBold}>{order.branches.name}</Text>
                        <Text style={styles.infoText}>{order.branches.address}</Text>
                    </>
                ) : <Text style={styles.infoText}>غير محدد</Text>}
            </View>
        </View>
    );

    const renderItems = () => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Ionicons name="fast-food-outline" size={22} color="#C62828" />
                <Text style={styles.cardTitle}>المنتجات</Text>
            </View>
            <View style={styles.cardContent}>
                {order.order_items.map((item, index) => {
                    const optionLabels = item.options ? Object.entries(item.options).map(([groupId, value]) => {
                        const group = item.menu_items?.options?.find((g: any) => g.id === groupId);
                        const optionValue = group?.values.find((v: any) => v.value === value);
                        return optionValue ? optionValue.label : null;
                    }).filter(Boolean).join('، ') : '';

                    return (
                        <View key={index} style={styles.itemContainer}>
                            <Image source={{ uri: item.menu_items?.image_url || 'https://placehold.co/100' }} style={styles.itemImage} />
                            <View style={styles.itemDetails}>
                                <Text style={styles.itemName}>{item.quantity}x {item.menu_items?.name}</Text>
                                {optionLabels.length > 0 && <Text style={styles.optionsText}>{optionLabels}</Text>}
                                {item.notes && <Text style={styles.notesText}>ملاحظات: {item.notes}</Text>}
                            </View>
                        </View>
                    );
                })}
            </View>
        </View>
    );

    const renderSummary = () => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Ionicons name="wallet-outline" size={22} color="#C62828" />
                <Text style={styles.cardTitle}>ملخص السعر</Text>
            </View>
            <View style={styles.cardContent}>
                <View style={styles.priceRow}><Text style={styles.priceLabel}>المجموع الفرعي</Text><Text style={styles.priceValue}>{order.subtotal.toFixed(2)} ₪</Text></View>
                {order.order_type === 'delivery' && <View style={styles.priceRow}><Text style={styles.priceLabel}>سعر التوصيل</Text><Text style={styles.priceValue}>{order.delivery_price.toFixed(2)} ₪</Text></View>}
                <View style={styles.totalRow}><Text style={styles.totalLabel}>المجموع الكلي</Text><Text style={styles.totalPrice}>{order.total_price.toFixed(2)} ₪</Text></View>
            </View>
        </View>
    );

    return (
        // 1. استخدام SafeAreaView ليشمل كل شيء
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* 2. إضافة رأس صفحة ثابت */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>تفاصيل الطلب</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* 3. جعل ScrollView يأخذ المساحة المتبقية */}
            <Animated.ScrollView
                contentContainerStyle={styles.scrollContainer}
                style={{ opacity: fadeAnim }}
            >
                {/* رأس الصفحة المتحرك (داخل ScrollView) */}
                <View style={styles.scrollHeader}>
                    <Text style={styles.scrollHeaderTitle}>طلب #{order.id}</Text>
                    <Text style={styles.scrollHeaderSubtitle}>
                        {new Date(order.created_at).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>

                <StatusTracker currentStatus={order.status} />
                {renderAddress()}
                {renderItems()}
                {renderSummary()}
            </Animated.ScrollView>
        </SafeAreaView>
    );
}

// =================================================================
// ✅ 2. التنسيقات الجديدة بالكامل
// =================================================================
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F5F5' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' },
    scrollContainer: { paddingHorizontal: 16, paddingBottom: 40 },
    errorText: { fontSize: 18, color: '#888', fontFamily: 'Cairo-Regular' },

    backButton: {
        padding: 8,
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
    },
    headerTitle: {
        fontSize: 20,
        fontFamily: 'Cairo-Bold',
        color: '#1A1A1A',
    }, headerSubtitle: { fontSize: 16, fontFamily: 'Cairo-Regular', color: '#6B7280', marginTop: 4 },
    scrollHeader: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    scrollHeaderTitle: {
        fontSize: 28,
        fontFamily: 'Cairo-Bold',
        color: '#1F2937',
    },
    scrollHeaderSubtitle: {
        fontSize: 16,
        fontFamily: 'Cairo-Regular',
        color: '#6B7280',
        marginTop: 4,
    },
    // --- تنسيقات شريط تتبع الحالة ---
    trackerContainer: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 },
    stepContainer: { alignItems: 'center', flex: 1 },
    stepIconContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' },
    stepIconActive: { backgroundColor: '#16A34A' },
    stepLabel: { marginTop: 8, fontSize: 12, fontFamily: 'Cairo-SemiBold', color: '#9CA3AF', textAlign: 'center' },
    stepLabelActive: { color: '#16A34A' },
    connector: { flex: 1, height: 4, backgroundColor: '#E5E7EB', marginTop: 22 },
    connectorActive: { backgroundColor: '#16A34A' },

    // --- تنسيقات البطاقات العامة ---
    card: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 16, overflow: 'hidden', elevation: 1, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    cardTitle: { fontSize: 18, fontFamily: 'Cairo-Bold', color: '#1F2937', marginStart: 8 },
    cardContent: { padding: 16 },

    // --- تنسيقات بطاقة العنوان ---
    infoTextBold: { fontSize: 16, fontFamily: 'Cairo-SemiBold', color: '#374151' },
    infoText: { fontSize: 14, fontFamily: 'Cairo-Regular', color: '#6B7280', marginTop: 4 },

    // --- تنسيقات بطاقة المنتجات ---
    itemContainer: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
    itemImage: { width: 60, height: 60, borderRadius: 12, backgroundColor: '#F3F4F6' },
    itemDetails: { flex: 1, marginStart: 12 },
    itemName: { fontSize: 16, fontFamily: 'Cairo-SemiBold', color: '#374151' },
    optionsText: { fontSize: 13, fontFamily: 'Cairo-Regular', color: '#6B7280', marginTop: 2 },
    notesText: { fontSize: 13, fontFamily: 'Cairo-Regular', color: '#9CA3AF', fontStyle: 'italic', marginTop: 2 },

    // --- تنسيقات بطاقة ملخص السعر ---
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
    priceLabel: { fontSize: 16, fontFamily: 'Cairo-Regular', color: '#4B5563' },
    priceValue: { fontSize: 16, fontFamily: 'Cairo-SemiBold', color: '#1F2937' },
    totalRow: { borderTopWidth: 1, borderTopColor: '#F3F4F6', marginTop: 8, paddingTop: 14 },
    totalLabel: { fontSize: 18, fontFamily: 'Cairo-Bold', color: '#111827' },
    totalPrice: { fontSize: 22, fontFamily: 'Cairo-Bold', color: '#C62828' },
});
