// مسار الملف: app/(tabs)/addresses.tsx

import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';
import { useCart } from '@/lib/useCart';
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Address } from '@/lib/types';
import { scale, fontScale } from '@/lib/responsive';
import ScreenHeader from '@/components/ui/ScreenHeader';

// ✅ مكون البطاقة المخصصة
const Card = ({ children, style }: { children: React.ReactNode; style?: any }) => (
  <View style={[styles.card, style]}>{children}</View>
);

// ✅ مكون البادج
const Badge = ({ text, style, textStyle }: { text: string; style?: any; textStyle?: any }) => (
  <View style={[styles.badge, style]}>
    <Text style={[styles.badgeText, textStyle]}>{text}</Text>
  </View>
);

export default function AddressesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOptions, setShowOptions] = useState<number | null>(null);

  const { setSelectedAddress, selectedAddress } = useCart();
  const params = useLocalSearchParams();
  const isSelectionMode = params.fromCart === 'true';

  useFocusEffect(
    useCallback(() => {
      const fetchAddresses = async () => {
        if (!user) {
          setLoading(false);
          return;
        }
        setLoading(true);
        const { data: rawData, error } = await supabase
          .from('user_addresses')
          .select(`
            id, street_address, notes, created_at, is_default, address_name,
            delivery_zones (city, area_name, delivery_price)
          `)
          .eq('user_id', user.id)
          .is('deleted_at', null) 
          .order('is_default', { ascending: false })
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching addresses:', error);
          Alert.alert('خطأ', 'لم نتمكن من جلب العناوين.');
        } else if (rawData) {
          const formattedData: Address[] = rawData.map(addr => ({
            ...addr,
            delivery_zones: Array.isArray(addr.delivery_zones) ? addr.delivery_zones[0] || null : addr.delivery_zones,
          }));
          setAddresses(formattedData);
        }
        setLoading(false);
      };
      fetchAddresses();
    }, [user])
  );

  const handleDelete = (addressId: number) => {
    Alert.alert('تأكيد الحذف', 'هل أنت متأكد أنك تريد حذف هذا العنوان؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.rpc('delete_user_address', {
            address_id_to_delete: addressId
          });
          if (error) {
            console.error('RPC Error:', error);
            Alert.alert('خطأ', 'لم نتمكن من حذف العنوان.');
          } else {
            setAddresses(prev => prev.filter(addr => addr.id !== addressId));
            Alert.alert('نجاح', 'تم حذف العنوان بنجاح');
          }
        },
      },
    ]);
  };

  const handleSetDefault = async (addressId: number) => {
    try {
      // إلغاء التعيين الافتراضي من جميع العناوين
      await supabase
        .from('user_addresses')
        .update({ is_default: false })
        .eq('user_id', user?.id);

      // تعيين العنوان المحدد كافتراضي
      const { error } = await supabase
        .from('user_addresses')
        .update({ is_default: true })
        .eq('id', addressId);

      if (error) throw error;

      // تحديث الواجهة
      setAddresses(prev => 
        prev.map(addr => ({
          ...addr,
          is_default: addr.id === addressId
        }))
      );

      Alert.alert('نجاح', 'تم تعيين العنوان كافتراضي');
    } catch (error) {
      console.error('Error setting default address:', error);
      Alert.alert('خطأ', 'لم نتمكن من تعيين العنوان كافتراضي');
    }
  };

  const handleAddNewAddress = () => {
    if (isSelectionMode) {
      router.push({
        pathname: '/(modal)/address-form',
        params: { 
          fromCart: isSelectionMode ? 'true' : 'false'
        }
      });
    } else {
      router.push('/(modal)/address-form');
    }
  };

  const handleAddressPress = (item: Address) => {
    if (isSelectionMode) {
      setSelectedAddress(item);
      Alert.alert(
        'تم الاختيار',
        `تم اختيار العنوان: ${getDisplayName(item)}`,
        [{ text: 'موافق', onPress: () => router.navigate('/(tabs)/cart') }]
      );
    } else {
      router.push({
        pathname: '/(modal)/address-form',
        params: { address: JSON.stringify(item) },
      });
    }
  };

  const handleEditAddress = (item: Address) => {
    setShowOptions(null);
    router.push({
      pathname: '/(modal)/address-form',
      params: { address: JSON.stringify(item) },
    });
  };

  // ✅ استخراج اسم العنوان ونوعه من الملاحظات
const extractAddressInfo = (notes: string) => {
  if (!notes) return { name: '', type: 'other' };
  
  const parts = notes.split(' • ');
  const name = parts[0] || '';
  const type = parts[1] || 'other';
  
  return { name, type };
};

// ✅ دالة مساعدة للحصول على اسم العرض
const getDisplayName = (item: Address): string => {
  return item.address_name || 
         extractAddressInfo(item.notes || '').name || 
         item.delivery_zones?.area_name || 
         'عنوان غير مسمى';
};

  // ✅ الحصول على اسم العنوان الافتراضي
  const getDefaultAddressName = (): string => {
    const defaultAddress = addresses.find(a => a.is_default);
    if (!defaultAddress) return 'غير محدد';
    
    return getDisplayName(defaultAddress);
  };

  // ✅ مكون بطاقة العنوان المحسنة
  const AddressCard = ({ item, index }: { item: Address; index: number }) => {
    const isCurrentlySelected = selectedAddress?.id === item.id;
    
    // ✅ استخدام الحقل الجديد address_name أو استخراجه من الملاحظات
    const addressInfo = extractAddressInfo(item.notes || '');
    const displayName = getDisplayName(item);
    const addressType = addressInfo.type;
    
    const getLabelConfig = () => {
      switch (addressType) {
        case 'المنزل':
          return {
            icon: 'home-outline' as const,
            color: '#3B82F6',
            backgroundColor: '#EFF6FF',
            label: 'المنزل'
          };
        case 'العمل':
          return {
            icon: 'business-outline' as const,
            color: '#8B5CF6',
            backgroundColor: '#FAF5FF',
            label: 'العمل'
          };
        default:
          return {
            icon: 'location-outline' as const,
            color: '#F97316',
            backgroundColor: '#FFF7ED',
            label: 'أخرى'
          };
      }
    };

    const labelConfig = getLabelConfig();

    return (
      <View style={styles.addressCardContainer}>
        <Card style={styles.addressCard}>
          {/* ✅ هيدر محسن - إزالة الخلفية المنفصلة */}
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.labelIcon, { backgroundColor: labelConfig.backgroundColor }]}>
                <Ionicons name={labelConfig.icon} size={scale(20)} color={labelConfig.color} />
              </View>
              <View style={styles.cardTitleContainer}>
                <Text style={styles.cardTitle} numberOfLines={1}>{displayName}</Text>
                <Badge 
                  text={labelConfig.label}
                  style={[styles.labelBadge, { borderColor: labelConfig.color }]}
                  textStyle={{ color: labelConfig.color }}
                />
              </View>
            </View>
            
            {/* زر الخيارات */}
            {!isSelectionMode && (
              <View style={styles.optionsContainer}>
                <TouchableOpacity
                  onPress={() => setShowOptions(showOptions === item.id ? null : item.id)}
                  style={styles.optionsButton}
                >
                  <Ionicons name="ellipsis-vertical" size={scale(18)} color="#9CA3AF" />
                </TouchableOpacity>
                
                {/* قائمة الخيارات */}
                {showOptions === item.id && (
                  <View style={styles.optionsMenu}>
                    <TouchableOpacity 
                      style={styles.optionItem}
                      onPress={() => handleEditAddress(item)}
                    >
                      <Ionicons name="create-outline" size={scale(16)} color="#3B82F6" />
                      <Text style={styles.optionText}>تعديل</Text>
                    </TouchableOpacity>
                    <View style={styles.optionSeparator} />
                    <TouchableOpacity 
                      style={styles.optionItem}
                      onPress={() => handleDelete(item.id)}
                    >
                      <Ionicons name="trash-outline" size={scale(16)} color="#DC2626" />
                      <Text style={[styles.optionText, styles.deleteOptionText]}>حذف</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* ✅ تفاصيل العنوان - إزالة المسافات الزائدة */}
          <View style={styles.addressDetails}>
            <Text style={styles.addressLine1} numberOfLines={2}>{item.street_address}</Text>
            <Text style={styles.addressCity}>
              {item.delivery_zones?.city}, {item.delivery_zones?.area_name}
            </Text>
            
            {/* سعر التوصيل */}
            {item.delivery_zones?.delivery_price !== undefined && (
              <Text style={styles.deliveryPrice}>
                رسوم التوصيل: {item.delivery_zones.delivery_price} ₪
              </Text>
            )}
          </View>

          {/* أزرار الإجراءات */}
          <View style={styles.cardActions}>
            {isSelectionMode ? (
              <TouchableOpacity
                style={[
                  styles.deliverButton,
                  isCurrentlySelected && styles.deliverButtonSelected
                ]}
                onPress={() => handleAddressPress(item)}
              >
                <Ionicons 
                  name={isCurrentlySelected ? "checkmark-circle" : "location-outline"} 
                  size={scale(18)} 
                  color="white" 
                />
                <Text style={styles.deliverButtonText}>
                  {isCurrentlySelected ? 'محدد' : 'التوصيل هنا'}
                </Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.deliverButton}
                  onPress={() => handleAddressPress(item)}
                >
                  <Ionicons name="location-outline" size={scale(18)} color="white" />
                  <Text style={styles.deliverButtonText}>التوصيل هنا</Text>
                </TouchableOpacity>
                
                {!item.is_default && (
                  <TouchableOpacity
                    style={styles.setDefaultButton}
                    onPress={() => handleSetDefault(item.id)}
                  >
                    <Ionicons name="star-outline" size={scale(16)} color="#DC2626" />
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>

          {/* علامة العنوان الافتراضي */}
          {item.is_default && (
            <View style={styles.defaultBadge}>
              <Ionicons name="star" size={scale(12)} color="#FFFFFF" />
              <Text style={styles.defaultBadgeText}>افتراضي</Text>
            </View>
          )}
        </Card>
      </View>
    );
  };

  // ✅ مكون الإحصائيات القابل للتمرير
  const StatsSection = () => (
    <View style={styles.statsContainer}>
      <Card style={styles.statsCard}>
        <View style={styles.statsContent}>
          <View style={styles.statsIcon}>
            <MaterialCommunityIcons name="map-marker-radius" size={scale(24)} color="#DC2626" />
          </View>
          <View style={styles.statsInfo}>
            <Text style={styles.statsTitle}>توصيل سريع</Text>
            <Text style={styles.statsSubtitle}>
              {addresses.length} عنوان محفوظ
            </Text>
          </View>
          <View style={styles.statsDefault}>
            <Text style={styles.statsDefaultLabel}>العنوان الافتراضي</Text>
            <Text style={styles.statsDefaultValue} numberOfLines={1}>
              {getDefaultAddressName()}
            </Text>
          </View>
        </View>
      </Card>
    </View>
  );

  // ✅ مكون النصيحة القابل للتمرير
  const TipSection = () => (
    <View style={styles.tipContainer}>
      <Card style={styles.tipCard}>
        <View style={styles.tipContent}>
          <Ionicons name="information-circle-outline" size={scale(18)} color="#1E40AF" />
          <View style={styles.tipTexts}>
            <Text style={styles.tipTitle}>نصيحة سريعة</Text>
            <Text style={styles.tipDescription}>
              قم بتعيين عنوانك الافتراضي لتسريع عملية الدفع. يمكنك تغييره دائمًا أثناء الطلب.
            </Text>
          </View>
        </View>
      </Card>
    </View>
  );

  // ✅ زر الإضافة القابل للتمرير
  const AddAddressSection = () => (
    <View style={styles.addButtonContainer}>
      <TouchableOpacity
        style={styles.addAddressButton}
        onPress={handleAddNewAddress}
      >
        <View style={styles.addButtonContent}>
          <View style={styles.addButtonIcon}>
            <Ionicons name="add" size={scale(20)} color="#DC2626" />
          </View>
          <Text style={styles.addButtonText}>إضافة عنوان جديد</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  // ✅ رأس القائمة - الإحصائيات فقط (بدون الهيدر)
  const ListHeader = () => (
    <View style={styles.listHeader}>
      {/* ✅ إضافة مكون الإحصائيات في الرأس */}
      {!isSelectionMode && addresses.length > 0 && <StatsSection />}
    </View>
  );

  // ✅ تذييل القائمة - جميع المكونات السفلية
  const ListFooter = () => (
    <View style={styles.listFooter}>
      {/* ✅ إضافة النصيحة وزر الإضافة في التذييل */}
      {!isSelectionMode && addresses.length > 0 && (
        <>
          <TipSection />
          <AddAddressSection />
        </>
      )}
      
      {/* ✅ مسافة آمنة في الأسفل */}
      <View style={{ height: insets.bottom + scale(20) }} />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* ✅ الهيدر الثابت */}
<ScreenHeader
  title={isSelectionMode ? 'اختر عنوان التوصيل' : 'عناويني'}
  onBackPress={() => {
    if (isSelectionMode) {
      router.navigate('/(tabs)/cart');
    } else {
      router.navigate('/(tabs)/profile');
    }
  }}
  customButton={
    <TouchableOpacity 
      onPress={handleAddNewAddress}
      style={styles.addButton}
    >
      <Ionicons name="add" size={scale(24)} color="white" />
    </TouchableOpacity>
  }
/>

      {loading ? (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color="#DC2626" />
          <Text style={styles.loadingText}>جاري تحميل العناوين...</Text>
        </View>
      ) : (
        <FlatList
          data={addresses}
          renderItem={({ item, index }) => <AddressCard item={item} index={index} />}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[
            styles.listContainer,
            addresses.length === 0 && styles.emptyListContainer
          ]}
          style={styles.flatList}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={ListFooter}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <MaterialCommunityIcons name="map-marker-off" size={scale(80)} color="#E5E7EB" />
              </View>
              <Text style={styles.emptyText}>لا توجد عناوين محفوظة</Text>
              <Text style={styles.emptySubText}>أضف عنوانك الأول لتسهيل عملية الطلب</Text>
              
              <TouchableOpacity 
                style={styles.addFirstAddressButton}
                onPress={handleAddNewAddress}
              >
                <Ionicons name="add" size={scale(20)} color="white" />
                <Text style={styles.addFirstAddressText}>إضافة عنوان جديد</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

// ✅ الأنماط المحدثة
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8FAFC' 
  },
  // ✅ FlatList مع مساحة للهيدر الثابت
  flatList: {
    flex: 1,
  },
  
  // ✅ رأس القائمة
  listHeader: {
    marginBottom: scale(16),
  },
  addButton: {
    padding: scale(8),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: scale(20),
  },
  // الإحصائيات
  statsContainer: {
    paddingHorizontal: scale(20),
    paddingTop: scale(20),
  },
  statsCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    padding: scale(16),
  },
  statsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
  },
  statsIcon: {
    backgroundColor: '#FEE2E2',
    padding: scale(12),
    borderRadius: scale(12),
  },
  statsInfo: {
    flex: 1,
  },
  statsTitle: {
    textAlign: 'left',
    fontSize: fontScale(16),
    fontWeight: '600',
    color: '#991B1B',
    marginBottom: scale(4),
  },
  statsSubtitle: {
    textAlign: 'left',
    fontSize: fontScale(12),
    color: '#DC2626',
  },
  statsDefault: {
    alignItems: 'center',
    flex: 1,
  },
  statsDefaultLabel: {
    fontSize: fontScale(12),
    color: '#DC2626',
    marginBottom: scale(2),
  },
  statsDefaultValue: {
    fontSize: fontScale(14),
    fontWeight: '600',
    color: '#991B1B',
    textAlign: 'right',
  },

  // القائمة
  listContainer: {
    flexGrow: 1,
    paddingBottom: scale(20),
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },

  // ✅ تذييل القائمة
  listFooter: {
    paddingTop: scale(20),
  },

  // بطاقة العنوان
  addressCardContainer: {
    marginHorizontal: scale(20),
    marginBottom: scale(16),
  },
  addressCard: {
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: scale(16),
    backgroundColor: 'white',
    borderBottomWidth: 0,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: scale(12),
    flex: 1,
  },
  labelIcon: {
    padding: scale(12),
    borderRadius: scale(12),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    textAlign: 'left',
    fontSize: fontScale(16),
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: scale(8),
  },
  labelBadge: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  optionsContainer: {
    position: 'relative',
  },
  optionsButton: {
    padding: scale(4),
  },
  optionsMenu: {
    position: 'absolute',
    top: scale(30),
    left: 0,
    width: scale(120),
    backgroundColor: 'white',
    borderRadius: scale(12),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    zIndex: 10,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    paddingHorizontal: scale(12),
    paddingVertical: scale(10),
  },
  optionText: {
    fontSize: fontScale(14),
    color: '#374151',
  },
  deleteOptionText: {
    color: '#DC2626',
  },
  optionSeparator: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  addressDetails: {
    padding: scale(16),
    paddingTop: 0,
    gap: scale(8),
  },
  addressLine1: {
    textAlign: 'left',
    fontSize: fontScale(14),
    color: '#374151',
    lineHeight: scale(20),
  },
  addressCity: {
    textAlign: 'left',
    fontSize: fontScale(13),
    color: '#6B7280',
  },
  deliveryPrice: {
    fontSize: fontScale(12),
    color: '#059669',
    textAlign: 'left',
    fontWeight: '500',
    marginTop: scale(4),
  },
  cardActions: {
    flexDirection: 'row',
    gap: scale(8),
    padding: scale(16),
    paddingTop: scale(8),
  },
  deliverButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(8),
    backgroundColor: '#DC2626',
    paddingVertical: scale(12),
    paddingHorizontal: scale(16),
    borderRadius: scale(12),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deliverButtonSelected: {
    backgroundColor: '#16A34A',
  },
  deliverButtonText: {
    color: 'white',
    fontSize: fontScale(14),
    fontWeight: '600',
  },
  setDefaultButton: {
    padding: scale(12),
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#FECACA',
    borderRadius: scale(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultBadge: {
    position: 'absolute',
    top: scale(45),
    right: scale(120),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
    backgroundColor: '#DC2626',
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(12),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  defaultBadgeText: {
    color: 'white',
    fontSize: fontScale(10),
    fontWeight: '600',
  },

  // الحالات الفارغة والتحميل
  centeredContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginTop: scale(160), // مراعاة الهيدر الثابت
    padding: scale(40),
  },
  loadingText: {
    marginTop: scale(16),
    fontSize: fontScale(16),
    color: '#6B7280',
  },
  emptyContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: scale(40),
  },
  emptyIcon: {
    backgroundColor: 'white',
    width: scale(120),
    height: scale(120),
    borderRadius: scale(60),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scale(24),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyText: { 
    fontSize: fontScale(20),
    fontWeight: 'bold',
    color: '#374151', 
    marginBottom: scale(8),
    textAlign: 'center',
  },
  emptySubText: { 
    fontSize: fontScale(14), 
    color: '#6B7280', 
    textAlign: 'center',
    lineHeight: scale(20),
  },
  addFirstAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: scale(12),
    paddingHorizontal: scale(24),
    borderRadius: scale(25),
    marginTop: scale(20),
    gap: scale(8),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addFirstAddressText: {
    color: '#fff',
    fontSize: fontScale(16),
    fontWeight: '600',
  },

  // ✅ زر الإضافة المحسن (في الفوتر)
  addButtonContainer: {
    paddingHorizontal: scale(20),
    marginBottom: scale(16),
  },
  addAddressButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#FECACA',
    borderStyle: 'dashed',
    borderRadius: scale(16),
    padding: scale(16),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonContent: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(12),
  },
  addButtonIcon: {
    backgroundColor: '#FEE2E2',
    padding: scale(8),
    borderRadius: scale(20),
  },
  addButtonText: {
    color: '#DC2626',
    fontSize: fontScale(16),
    fontWeight: '600',
  },

  // ✅ بطاقة النصيحة (في الفوتر)
  tipContainer: {
    paddingHorizontal: scale(20),
    marginBottom: scale(16),
  },
  tipCard: {
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    padding: scale(16),
  },
  tipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
  },
  tipTexts: {
    flex: 1,
  },
  tipTitle: {
    fontSize: fontScale(14),
    textAlign: 'left',
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: scale(4),
  },
  tipDescription: {
    fontSize: fontScale(12),
    textAlign: 'left',
    color: '#374151',
    lineHeight: scale(18),
  },

  // المكونات العامة
  card: {
    backgroundColor: 'white',
    borderRadius: scale(16),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  badge: {
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(6),
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: fontScale(10),
    fontWeight: '600',
  },
 
});