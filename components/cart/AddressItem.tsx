import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Address } from '@/lib/types';

interface AddressItemProps {
  address: Address;
  isSelected: boolean;
  onSelect: (address: Address) => void;
}

const getIconComponent = (label?: string | null) => {
  if (!label) return Ionicons;
  
  switch (label.toLowerCase()) {
    case 'home':
    case 'المنزل':
      return Ionicons;
    case 'work':
    case 'العمل':
      return Ionicons;
    case 'other':
    case 'أخرى':
      return Ionicons;
    default:
      return Ionicons;
  }
};

export const AddressItem: React.FC<AddressItemProps> = React.memo(({ 
  address, 
  isSelected, 
  onSelect 
}) => {
  const IconComponent = getIconComponent(address.address_name);
  
  return (
    <TouchableOpacity
      style={[styles.locationOption, isSelected && styles.locationOptionSelected]}
      onPress={() => onSelect(address)}
    >
      <View style={styles.radioContainer}>
        {isSelected ? (
          <View style={styles.radioSelected}>
            <MaterialIcons name="check" size={16} color="#fff" />
          </View>
        ) : (
          <View style={styles.radioUnselected} />
        )}
      </View>
      
      <View style={styles.addressIconContainer}>
        <IconComponent size={20} color="#C62828" />
      </View>
      
      <View style={styles.addressTextContainer}>
        <View style={styles.addressHeader}>
          <Text style={styles.addressLabel}>{address.delivery_zones?.area_name || 'منطقة غير محددة'}</Text>
        </View>
        <Text style={styles.addressDetails}>{address.delivery_zones?.city}, {address.street_address}</Text>
        <Text style={styles.addressPhone}>+966 50 123 4567</Text>
        
        {address.delivery_zones?.delivery_price !== undefined && (
          <Text style={styles.deliveryPrice}>
            رسوم التوصيل: {address.delivery_zones.delivery_price.toFixed(2)} ₪
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  locationOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#f3f4f6',
    marginBottom: 12,
  },
  locationOptionSelected: {
    borderColor: '#C62828',
    backgroundColor: '#fef2f2',
  },
  radioContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  radioSelected: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#C62828',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioUnselected: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  addressIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addressTextContainer: {
    flex: 1,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  addressLabel: {
    fontSize: 16,
    fontFamily: 'Cairo-SemiBold',
    color: '#1f2937',
  },
  addressDetails: {
    fontSize: 14,
    fontFamily: 'Cairo-Regular',
    color: '#6b7280',
    marginBottom: 2,
    lineHeight: 20,
  },
  addressPhone: {
    fontSize: 14,
    fontFamily: 'Cairo-Regular',
    color: '#6b7280',
    marginBottom: 4,
  },
  deliveryPrice: {
    fontSize: 12,
    fontFamily: 'Cairo-SemiBold',
    color: '#22c55e',
  },
});