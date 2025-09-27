// مسار الملف: app/order/[orderId].tsx

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// 1. تعريف الواجهات للبيانات التي سنجلبها
interface OrderDetails {
    id: number;
    created_at: string;
    total_price: number;
    subtotal: number;
    delivery_price: number;
    status: string;
    order_type: string;
    user_addresses: {
        street_address: string;
        delivery_zones: {
            city: string;
            area_name: string;
        } | null;
    } | null;
    branches: {
        name: string;
        address: string;
    } | null;
    order_items: {
        quantity: number;
        notes: string | null;
        options: any;
        menu_items: {
            name: string;
            image_url: string;
        } | null;
    }[];
}

export default function OrderDetailsScreen() {
    const { orderId } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [order, setOrder] = useState<OrderDetails | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrderDetails = async () => {
            if (!orderId) return;

            setLoading(true);
            const { data: rawData, error } = await supabase // <-- 1. غيرنا اسم المتغير إلى rawData
                .from('orders')
                .select(`
        id, created_at, total_price, subtotal, delivery_price, status, order_type,
        user_addresses ( street_address, delivery_zones ( city, area_name ) ),
        branches ( name, address ),
        order_items ( quantity, notes, options, menu_items ( name, image_url ) )
      `)
                .eq('id', orderId)
                .single();

            if (error) {
                console.error('Error fetching order details:', error);
                Alert.alert('خطأ', 'لم نتمكن من العثور على تفاصيل هذا الطلب.');
                setLoading(false); // لا تنس إيقاف التحميل هنا أيضًا
                return;
            }

            if (rawData) {
                // --- 2. هذا هو الجزء الأهم: تنسيق البيانات ---
                const formattedOrder: OrderDetails = {
                    ...rawData,
                    // إذا كان user_addresses مصفوفة، خذ العنصر الأول، وإلا اتركه كما هو (null)
                    user_addresses: Array.isArray(rawData.user_addresses)
                        ? {
                            ...rawData.user_addresses[0],
                            // قم بنفس العملية لـ delivery_zones المتداخلة
                            delivery_zones: Array.isArray(rawData.user_addresses[0]?.delivery_zones)
                                ? rawData.user_addresses[0].delivery_zones[0] || null
                                : rawData.user_addresses[0]?.delivery_zones,
                        }
                        : rawData.user_addresses,

                    // نفس المنطق لـ branches
                    branches: Array.isArray(rawData.branches)
                        ? rawData.branches[0] || null
                        : rawData.branches,
                    order_items: rawData.order_items.map(item => ({
                        ...item,
                        // وقم بتصحيح menu_items بداخله
                        menu_items: Array.isArray(item.menu_items)
                            ? item.menu_items[0] || null
                            : item.menu_items,
                    })),
                };
                // --- نهاية جزء التنسيق ---

                setOrder(formattedOrder); // <-- 3. الآن البيانات متوافقة تمامًا
            }
            setLoading(false);
        };

        fetchOrderDetails();
    }, [orderId]);

    if (loading) {
        return <ActivityIndicator style={{ flex: 1 }} size="large" color="#C62828" />;
    }

    if (!order) {
        return <View style={styles.container}><Text style={styles.errorText}>لم يتم العثور على الطلب.</Text></View>;
    }

    // --- مكونات العرض الفرعية ---
    const renderAddress = () => (
        <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>
                {order.order_type === 'delivery' ? 'عنوان التوصيل' : 'فرع الاستلام'}
            </Text>
            <View style={styles.infoBox}>
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
                ) : (
                    <Text style={styles.infoText}>غير محدد</Text>
                )}
            </View>
        </View>
    );

    const renderItems = () => (
        <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>المنتجات</Text>
            {order.order_items.map((item, index) => (
                <View key={index} style={styles.itemBox}>
                    <Text style={styles.itemQuantity}>{item.quantity}x</Text>
                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                        <Text style={styles.infoTextBold}>{item.menu_items?.name}</Text>
                        {/* يمكنك إضافة منطق لعرض الخيارات هنا بنفس طريقة السلة */}
                    </View>
                </View>
            ))}
        </View>
    );

    const renderSummary = () => (
        <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>ملخص السعر</Text>
            <View style={styles.infoBox}>
                <View style={styles.priceRow}><Text style={styles.priceLabel}>المجموع الفرعي</Text><Text style={styles.priceValue}>{order.subtotal.toFixed(2)} ₪</Text></View>
                {order.order_type === 'delivery' && (
                    <View style={styles.priceRow}><Text style={styles.priceLabel}>سعر التوصيل</Text><Text style={styles.priceValue}>{order.delivery_price.toFixed(2)} ₪</Text></View>
                )}
                <View style={[styles.priceRow, styles.totalRow]}><Text style={styles.totalLabel}>المجموع الكلي</Text><Text style={styles.totalPrice}>{order.total_price.toFixed(2)} ₪</Text></View>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>تفاصيل طلب #{order.id}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContainer}>
                {renderAddress()}
                {renderItems()}
                {renderSummary()}
            </ScrollView>
        </View>
    );
}

// 3. إضافة التنسيقات
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9F9F9' },
    scrollContainer: { padding: 16 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    backButton: { padding: 4 },
    errorText: { textAlign: 'center', marginTop: 50, fontSize: 18, color: '#888' },

    infoSection: { marginBottom: 24 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'right', marginBottom: 12, color: '#1A1A1A' },
    infoBox: { backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'flex-end' },
    infoText: { fontSize: 16, color: '#555', textAlign: 'right' },
    infoTextBold: { fontSize: 16, fontWeight: '600', color: '#333', textAlign: 'right', marginBottom: 4 },

    itemBox: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 8 },
    itemQuantity: { fontSize: 16, fontWeight: 'bold', color: '#C62828', marginLeft: 12 },

    priceRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    priceLabel: { fontSize: 16, color: '#666' },
    priceValue: { fontSize: 16, fontWeight: '500', color: '#333' },
    totalRow: { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10, marginTop: 6 },
    totalLabel: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A' },
    totalPrice: { fontSize: 20, fontWeight: 'bold', color: '#C62828' },
});
