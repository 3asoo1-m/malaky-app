import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export const EmptyCart: React.FC = () => {
  const router = useRouter();

  return (
    <View style={styles.emptyContainer}>
      <Ionicons name="cart-outline" size={80} color="#e5e7eb" />
      <Text style={styles.emptyText}>سلّتك فارغة!</Text>
      <Text style={styles.emptySubtext}>أضف بعض المنتجات اللذيذة لتبدأ</Text>
      <TouchableOpacity style={styles.browseButton} onPress={() => router.push('/')}>
        <Ionicons name="restaurant-outline" size={16} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.browseButtonText}>تصفح القائمة</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: '30%',
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Cairo-SemiBold',
    color: '#9ca3af',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Cairo-Regular',
    color: '#9ca3af',
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: '#C62828',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
  },
  browseButtonText: {
    fontSize: 16,
    fontFamily: 'Cairo-Bold',
    color: '#fff',
  },
});