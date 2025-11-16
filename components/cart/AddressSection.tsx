import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { OrderType, Address } from '@/lib/types';
import { AddressItem } from './AddressItem';

interface AddressSectionProps {
  orderType: OrderType;
  loadingAddresses: boolean;
  availableAddresses: Address[];
  selectedAddress: Address | null;
  onSelectAddress: (address: Address) => void;
  onAddAddress: () => void;
}

export const AddressSection: React.FC<AddressSectionProps> = React.memo(({
  orderType,
  loadingAddresses,
  availableAddresses,
  selectedAddress,
  onSelectAddress,
  onAddAddress,
}) => {
  if (orderType !== 'delivery') return null;
  
  if (loadingAddresses) return <ActivityIndicator style={{ marginVertical: 20 }} color="#C62828" />;
  
  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Ionicons name="location-outline" size={20} color="#C62828" />
        <Text style={styles.sectionTitle}>اختر عنوان التوصيل</Text>
      </View>
      
      {!selectedAddress && availableAddresses.length > 0 && (
        <View style={styles.selectionWarning}>
          <Ionicons name="warning-outline" size={18} color="#F9A825" />
          <Text style={styles.selectionWarningText}>يجب اختيار عنوان التوصيل للمتابعة</Text>
        </View>
      )}
      
      {availableAddresses.length === 0 ? (
        <TouchableOpacity style={styles.noAddressContainer} onPress={onAddAddress}>
          <Ionicons name="add-circle-outline" size={24} color="#C62828" />
          <Text style={styles.noAddressText}>لا يوجد عناوين. أضف عنوانًا للتوصيل.</Text>
        </TouchableOpacity>
      ) : (
        <>
          {availableAddresses.map(address => (
            <AddressItem
              key={address.id}
              address={address}
              isSelected={selectedAddress?.id === address.id}
              onSelect={onSelectAddress}
            />
          ))}
          <TouchableOpacity style={styles.addAddressButton} onPress={onAddAddress}>
            <Ionicons name="add" size={20} color="#C62828" />
            <Text style={styles.addAddressText}>إضافة عنوان جديد</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
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
  selectionWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f59e0b',
    marginBottom: 16,
  },
  selectionWarningText: {
    fontSize: 14,
    fontFamily: 'Cairo-SemiBold',
    color: '#d97706',
    marginLeft: 8,
  },
  noAddressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderStyle: 'dashed',
  },
  noAddressText: {
    fontSize: 14,
    fontFamily: 'Cairo-SemiBold',
    color: '#d97706',
    marginLeft: 8,
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#C62828',
    borderStyle: 'dashed',
    backgroundColor: '#fef2f2',
  },
  addAddressText: {
    fontSize: 16,
    fontFamily: 'Cairo-SemiBold',
    color: '#C62828',
    marginLeft: 8,
  },
});