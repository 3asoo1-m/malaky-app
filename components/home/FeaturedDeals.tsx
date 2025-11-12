// components/home/FeaturedDeals.tsx
import React from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ColorValue } from 'react-native'; // ✅ 1. استيراد ColorValue
import { LinearGradient } from 'expo-linear-gradient';
import { ShoppingCart, Flame } from 'lucide-react-native';
import { Colors } from '@/styles';

// تعريف نوع البيانات للعرض المميز
interface Deal {
  id: number;
  title: string;
  subtitle: string;
  price: string;
  savings: string;
  image: any;
  // ✅ 2. تعديل نوع الـ gradient
  gradient: readonly [ColorValue, ColorValue, ...ColorValue[]];
}

interface FeaturedDealsProps {
  deals: Deal[];
}

const FeaturedDeals: React.FC<FeaturedDealsProps> = ({ deals }) => {
  const renderDeal = ({ item }: { item: Deal }) => (
    <TouchableOpacity style={styles.dealCard}>
      <LinearGradient colors={item.gradient} style={styles.gradientHeader}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.savings}</Text>
        </View>
        <Text style={styles.dealTitle}>{item.title}</Text>
        <Text style={styles.dealSubtitle}>{item.subtitle}</Text>
      </LinearGradient>
      <View style={styles.dealContent}>
        <View style={styles.dealInfo}>
          <View>
            <Text style={styles.priceLabel}>ابتداءً من</Text>
            <Text style={styles.priceText}>{item.price} شيكل</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.cartButton}>
          <ShoppingCart color="white" size={20} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Flame color={Colors.primary} size={24} />
          <Text style={styles.headerTitle}>عروض مميزة</Text>
        </View>
        <TouchableOpacity>
          <Text style={styles.seeAllButton}>عرض الكل</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={deals}
        renderItem={renderDeal}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        inverted // لعرض القائمة من اليمين لليسار
      />
    </View>
  );
};

// ... باقي الأنماط (styles) تبقى كما هي

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  seeAllButton: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  dealCard: {
    width: 288, // 72 * 4
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
    overflow: 'hidden',
  },
  gradientHeader: {
    padding: 16,
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  dealTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'left',
  },
  dealSubtitle: {
    color: 'white',
    opacity: 0.9,
    fontSize: 14,
    textAlign: 'left',
  },
  dealContent: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  dealInfo: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  dealImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
  },
  priceLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'left',
  },
  priceText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'left',
  },
  cartButton: {
    backgroundColor: Colors.primary,
    padding: 10,
    borderRadius: 99,
  },
});

export default FeaturedDeals;
