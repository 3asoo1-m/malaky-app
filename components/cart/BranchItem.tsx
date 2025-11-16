import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Branch } from '@/lib/types';

interface BranchItemProps {
  branch: Branch;
  isSelected: boolean;
  onSelect: (branch: Branch) => void;
}

export const BranchItem: React.FC<BranchItemProps> = React.memo(({ 
  branch, 
  isSelected, 
  onSelect 
}) => (
  <TouchableOpacity
    style={[styles.locationOption, isSelected && styles.locationOptionSelected]}
    onPress={() => onSelect(branch)}
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
    
    <View style={[styles.branchIconContainer, styles.pickupIcon]}>
      <Ionicons name="storefront-outline" size={20} color="#C62828" />
    </View>
    
    <View style={styles.addressTextContainer}>
      <Text style={styles.addressLabel}>{branch.name}</Text>
      <Text style={styles.addressDetails}>{branch.address}</Text>
    </View>
  </TouchableOpacity>
));

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
  branchIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pickupIcon: {
    backgroundColor: '#f0f9ff',
  },
  addressTextContainer: {
    flex: 1,
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
});