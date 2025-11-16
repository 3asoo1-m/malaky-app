import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { OrderType, Address, Branch, CartItem } from '@/lib/types';
import { OptimizedImage } from '@/components/OptimizedImage'; // ✅ أضف هذا الاستيراد
import { ImagePresets } from '@/lib/utils'; // ✅ أضف هذا الاستيراد

interface CheckoutReviewProps {
  items: CartItem[];
  orderType: OrderType;
  selectedAddress: Address | null;
  selectedBranch: Branch | null;
  subtotal: number;
  deliveryPrice: number;
  promoCode: string;
  setPromoCode: (code: string) => void;
  promoApplied: boolean;
  setPromoApplied: (applied: boolean) => void;
  orderNotes: string;
  setOrderNotes: (notes: string) => void;
}

export const CheckoutReview: React.FC<CheckoutReviewProps> = ({
  items,
  orderType,
  selectedAddress,
  selectedBranch,
  subtotal,
  deliveryPrice,
  promoCode,
  setPromoCode,
  promoApplied,
  setPromoApplied,
  orderNotes,
  setOrderNotes,
}) => {
  const discount = promoApplied ? subtotal * 0.1 : 0;
  const totalPrice = subtotal + deliveryPrice;
  const finalTotal = totalPrice - discount;

  const handleApplyPromo = () => {
    if (promoCode.toLowerCase() === 'malaky10') {
      setPromoApplied(true);
      Alert.alert('نجاح', 'تم تطبيق كود الخصم بنجاح!');
    } else {
      Alert.alert('خطأ', 'كود الخصم غير صحيح');
    }
  };

  return (
    <View style={styles.stepContent}>
      {/* ملخص الطلب */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>المنتجات ({items.length})</Text>
        </View>
        {items.map((item) => (
          <ReviewItem key={item.id} item={item} />
        ))}
      </View>

      {/* تفاصيل التوصيل */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Ionicons name="time-outline" size={18} color="#C62828" />
          <Text style={styles.sectionTitle}>تفاصيل التوصيل</Text>
        </View>
        <View style={styles.deliveryDetails}>
          <View style={styles.deliveryRow}>
            <Text style={styles.deliveryLabel}>العنوان</Text>
            <View style={styles.deliveryValue}>
              <Text style={styles.deliveryText}>
                {orderType === 'delivery' 
                  ? selectedAddress?.delivery_zones?.area_name 
                  : selectedBranch?.name}
              </Text>
              <Text style={styles.deliverySubtext}>
                {orderType === 'delivery' 
                  ? `${selectedAddress?.delivery_zones?.city}, ${selectedAddress?.street_address}`
                  : selectedBranch?.address}
              </Text>
            </View>
          </View>
          <View style={styles.separator} />
          <View style={styles.deliveryRow}>
            <Text style={styles.deliveryLabel}>الوقت المتوقع</Text>
            <View style={styles.deliveryTime}>
              <Ionicons name="time-outline" size={16} color="#C62828" />
              <Text style={styles.deliveryTimeText}>30-40 دقيقة</Text>
            </View>
          </View>
        </View>
      </View>

      {/* طريقة الدفع */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Ionicons name="card-outline" size={18} color="#C62828" />
          <Text style={styles.sectionTitle}>طريقة الدفع</Text>
        </View>
        <View style={styles.paymentMethod}>
          <View style={styles.paymentIcon}>
            <Ionicons name="wallet-outline" size={24} color="#22c55e" />
          </View>
          <View style={styles.paymentDetails}>
            <Text style={styles.paymentMethodText}>الدفع عند الاستلام</Text>
            <Text style={styles.paymentDescription}>ادفع عند استلام طلبك</Text>
          </View>
        </View>
      </View>

      {/* ملاحظات الطلب */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>ملاحظات إضافية (اختياري)</Text>
        </View>
        <View style={styles.notesInputContainer}>
          <TextInput
            style={styles.notesInput}
            placeholder="أضف أي ملاحظات خاصة لطلبك..."
            value={orderNotes}
            onChangeText={setOrderNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>
      </View>

      {/* كود الخصم */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Ionicons name="pricetag-outline" size={18} color="#C62828" />
          <Text style={styles.sectionTitle}>كود الخصم</Text>
        </View>
        <View style={styles.promoContainer}>
          <TextInput
            style={styles.promoInput}
            placeholder="أدخل كود الخصم"
            value={promoCode}
            onChangeText={setPromoCode}
            editable={!promoApplied}
          />
          <TouchableOpacity
            style={[
              styles.promoButton,
              (promoApplied || !promoCode) && styles.promoButtonDisabled
            ]}
            onPress={handleApplyPromo}
            disabled={promoApplied || !promoCode}
          >
            <Text style={styles.promoButtonText}>
              {promoApplied ? 'مطبق' : 'تطبيق'}
            </Text>
          </TouchableOpacity>
        </View>
        {promoApplied && (
          <View style={styles.promoSuccess}>
            <MaterialIcons name="check-circle" size={16} color="#22c55e" />
            <Text style={styles.promoSuccessText}>تم تطبيق كود الخصم! خصم 10%</Text>
          </View>
        )}
      </View>

      {/* ملخص السعر */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>ملخص الدفع</Text>
        </View>
        <View style={styles.priceSummary}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>المجموع الفرعي</Text>
            <Text style={styles.priceValue}>{subtotal.toFixed(2)} ₪</Text>
          </View>
          
          {promoApplied && (
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, styles.discountText]}>الخصم (10%)</Text>
              <Text style={[styles.priceValue, styles.discountText]}>-{discount.toFixed(2)} ₪</Text>
            </View>
          )}
          
          {orderType === 'delivery' && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>رسوم التوصيل</Text>
              <Text style={styles.priceValue}>{deliveryPrice.toFixed(2)} ₪</Text>
            </View>
          )}
          
          <View style={styles.separator} />
          
          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>المجموع الكلي</Text>
            <Text style={styles.totalPrice}>{finalTotal.toFixed(2)} ₪</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const ReviewItem: React.FC<{ item: CartItem }> = ({ item }) => {
  const imageUrl = item.product.images?.[0]?.image_url || 'https://dgplcadvneqpohxqlilg.supabase.co/storage/v1/object/public/menu_image/icon.png';

  return (
    <View style={styles.reviewItem}>
      {/* ✅ التعديل هنا: استبدال Image بـ OptimizedImage */}
      <OptimizedImage 
        uri={imageUrl}
        width={64}
        height={64}
        borderRadius={8}
        preset="thumbnail" // ✅ استخدام الـ preset المخصص للصور المصغرة
        priority="normal"  // ✅ أولوية عادية لأنها في المراجعة النهائية
        style={styles.reviewItemImage}
      />
      <View style={styles.reviewItemDetails}>
        <Text style={styles.reviewItemName}>{item.product.name}</Text>
        <Text style={styles.reviewItemQuantity}>الكمية: {item.quantity}</Text>
      </View>
      <Text style={styles.reviewItemPrice}>
        {(item.totalPrice).toFixed(2)} ₪
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  stepContent: {
    paddingVertical: 24,
  },
  sectionContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Cairo-Bold',
    color: '#1f2937',
    marginLeft: 8,
  },
  reviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  // ✅ إزالة الخلفية من هنا لأن OptimizedImage يديرها
  reviewItemImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
    marginRight: 12,
  },
  reviewItemDetails: {
    flex: 1,
  },
  reviewItemName: {
    fontSize: 14,
    fontFamily: 'Cairo-SemiBold',
    color: '#1f2937',
    marginBottom: 4,
  },
  reviewItemQuantity: {
    fontSize: 12,
    fontFamily: 'Cairo-Regular',
    color: '#6b7280',
  },
  reviewItemPrice: {
    fontSize: 14,
    fontFamily: 'Cairo-SemiBold',
    color: '#C62828',
  },
  deliveryDetails: {},
  deliveryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  deliveryLabel: {
    fontSize: 14,
    fontFamily: 'Cairo-Regular',
    color: '#6b7280',
    flex: 1,
  },
  deliveryValue: {
    flex: 2,
    alignItems: 'flex-end',
  },
  deliveryText: {
    fontSize: 14,
    fontFamily: 'Cairo-SemiBold',
    color: '#1f2937',
    marginBottom: 2,
  },
  deliverySubtext: {
    fontSize: 12,
    fontFamily: 'Cairo-Regular',
    color: '#6b7280',
  },
  deliveryTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryTimeText: {
    fontSize: 14,
    fontFamily: 'Cairo-SemiBold',
    color: '#C62828',
    marginLeft: 4,
  },
  separator: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 12,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#dcfce7',
  },
  paymentIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentDetails: {
    flex: 1,
  },
  paymentMethodText: {
    fontSize: 16,
    fontFamily: 'Cairo-SemiBold',
    color: '#1f2937',
    marginBottom: 2,
  },
  paymentDescription: {
    fontSize: 12,
    fontFamily: 'Cairo-Regular',
    color: '#6b7280',
  },
  notesInputContainer: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
  },
  notesInput: {
    fontSize: 14,
    fontFamily: 'Cairo-Regular',
    color: '#1f2937',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  promoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  promoInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    fontFamily: 'Cairo-Regular',
    color: '#1f2937',
    backgroundColor: '#fff',
  },
  promoButton: {
    backgroundColor: '#C62828',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  promoButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  promoButtonText: {
    fontSize: 14,
    fontFamily: 'Cairo-Bold',
    color: '#fff',
  },
  promoSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dcfce7',
    marginTop: 8,
  },
  promoSuccessText: {
    fontSize: 12,
    fontFamily: 'Cairo-SemiBold',
    color: '#22c55e',
    marginLeft: 8,
  },
  priceSummary: {},
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 14,
    fontFamily: 'Cairo-Regular',
    color: '#6b7280',
  },
  priceValue: {
    fontSize: 14,
    fontFamily: 'Cairo-SemiBold',
    color: '#374151',
  },
  discountText: {
    color: '#22c55e',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontFamily: 'Cairo-Bold',
    color: '#1f2937',
  },
  totalPrice: {
    fontSize: 18,
    fontFamily: 'Cairo-Bold',
    color: '#C62828',
  },
});