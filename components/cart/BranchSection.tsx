import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OrderType, Branch } from '@/lib/types';
import { BranchItem } from './BranchItem';

interface BranchSectionProps {
  orderType: OrderType;
  loadingBranches: boolean;
  availableBranches: Branch[];
  selectedBranch: Branch | null;
  onSelectBranch: (branch: Branch) => void;
}

export const BranchSection: React.FC<BranchSectionProps> = React.memo(({
  orderType,
  loadingBranches,
  availableBranches,
  selectedBranch,
  onSelectBranch,
}) => {
  if (orderType !== 'pickup') return null;
  
  if (loadingBranches) return <ActivityIndicator style={{ marginVertical: 20 }} color="#C62828" />;
  
  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Ionicons name="business-outline" size={20} color="#C62828" />
        <Text style={styles.sectionTitle}>اختر فرع الاستلام</Text>
      </View>
      
      {!selectedBranch && availableBranches.length > 0 && (
        <View style={styles.selectionWarning}>
          <Ionicons name="warning-outline" size={18} color="#F9A825" />
          <Text style={styles.selectionWarningText}>يجب اختيار فرع الاستلام للمتابعة</Text>
        </View>
      )}
      
      {availableBranches.length === 0 ? (
        <View style={styles.noAddressContainer}>
          <Text style={styles.noAddressText}>لا توجد فروع متاحة للاستلام حاليًا.</Text>
        </View>
      ) : (
        availableBranches.map(branch => (
          <BranchItem
            key={branch.id}
            branch={branch}
            isSelected={selectedBranch?.id === branch.id}
            onSelect={onSelectBranch}
          />
        ))
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
});