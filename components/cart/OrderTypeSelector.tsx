import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OrderType } from '@/lib/types';

interface OrderTypeSelectorProps {
  orderType: OrderType;
  onTypeChange: (type: OrderType) => void;
}

export const OrderTypeSelector: React.FC<OrderTypeSelectorProps> = ({ 
  orderType, 
  onTypeChange 
}) => {
  return (
    <View style={styles.orderTypeContainer}>
      <TouchableOpacity 
        style={[styles.orderTypeButton, orderType === 'pickup' && styles.orderTypeActive]} 
        onPress={() => onTypeChange('pickup')}
      >
        <Text style={[styles.orderTypeText, orderType === 'pickup' && styles.orderTypeTextActive]}>
          استلام
        </Text>
        <Ionicons 
          name="storefront-outline" 
          size={24} 
          color={orderType === 'pickup' ? '#fff' : '#666'} 
        />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.orderTypeButton, orderType === 'delivery' && styles.orderTypeActive]} 
        onPress={() => onTypeChange('delivery')}
      >
        <Text style={[styles.orderTypeText, orderType === 'delivery' && styles.orderTypeTextActive]}>
          توصيل
        </Text>
        <Ionicons 
          name="bicycle-outline" 
          size={24} 
          color={orderType === 'delivery' ? '#fff' : '#666'} 
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  orderTypeContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 4,
    gap: 8,
  },
  orderTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  orderTypeActive: {
    backgroundColor: '#C62828',
    borderColor: '#C62828',
    shadowColor: '#C62828',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  orderTypeText: {
    fontSize: 16,
    fontFamily: 'Cairo-SemiBold',
    marginLeft: 8,
    color: '#6b7280',
  },
  orderTypeTextActive: {
    color: '#fff',
  },
});