import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OrderType, Address } from '@/lib/types';

interface CartFooterProps {
  subtotal: number;
  orderType: OrderType;
  selectedAddress: Address | null;
  onCheckout: () => void;
}

export const CartFooter: React.FC<CartFooterProps> = ({
  subtotal,
  orderType,
  selectedAddress,
  onCheckout,
}) => {
  const deliveryPrice = orderType === 'delivery' && selectedAddress?.delivery_zones 
    ? selectedAddress.delivery_zones.delivery_price 
    : 0;
  
  const totalPrice = subtotal + deliveryPrice;

  return (
    <View style={styles.footer}>
      <View style={styles.footerContent}>
        <View style={styles.priceSummaryFooter}>
          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>المجموع الكلي</Text>
            <Text style={styles.totalPrice}>{totalPrice.toFixed(2)} ₪</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={onCheckout}
        >
          <Text style={styles.checkoutButtonText}>إتمام الطلب</Text>
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    bottom: 85,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  footerContent: {
    padding: 20,
  },
  priceSummaryFooter: {
    marginBottom: 16,
  },
  checkoutButton: {
    backgroundColor: '#C62828',
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    shadowColor: '#C62828',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  checkoutButtonText: {
    fontSize: 16,
    fontFamily: 'Cairo-Bold',
    color: '#fff',
    marginLeft: 6,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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