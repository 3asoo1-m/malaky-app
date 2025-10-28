// مسار الملف: app/(modal)/address-form.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RNPickerSelect from 'react-native-picker-select';
import { scale, fontScale } from '@/lib/responsive';

// ✅ مكون البطاقة المخصصة
const Card = ({ children, style }: { children: React.ReactNode; style?: any }) => (
  <View style={[styles.card, style]}>{children}</View>
);

// ✅ مكون التبديل
const Switch = ({ value, onValueChange }: { value: boolean; onValueChange: (value: boolean) => void }) => (
  <TouchableOpacity
    style={[styles.switch, value && styles.switchActive]}
    onPress={() => onValueChange(!value)}
    activeOpacity={0.8}
  >
    <View style={[styles.switchThumb, value && styles.switchThumbActive]} />
  </TouchableOpacity>
);

// ✅ مكون زر الراديو المعدل والمحسن
const RadioButton = ({ 
  selected, 
  onPress, 
  icon, 
  label, 
  backgroundColor 
}: { 
  selected: boolean; 
  onPress: () => void; 
  icon: React.ReactNode; 
  label: string; 
  backgroundColor: string;
}) => (
  <TouchableOpacity
    style={[
      styles.radioButton,
      selected && styles.radioButtonSelected,
      { borderColor: selected ? '#DC2626' : '#E5E7EB' }
    ]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View style={styles.radioContent}>
      <View style={[styles.radioIconContainer, { backgroundColor }]}>
        {icon}
      </View>
      <Text style={[
        styles.radioLabel,
        selected && styles.radioLabelSelected
      ]}>
        {label}
      </Text>
    </View>
    <View style={[
      styles.radioOuter,
      selected && styles.radioOuterSelected
    ]}>
      {selected && <View style={styles.radioInner} />}
    </View>
  </TouchableOpacity>
);

interface Zone {
  id: number;
  city: string;
  area_name: string;
}

export default function AddressFormScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const params = useLocalSearchParams();
  const addressString = params.address as string;
  const returnTo = params.returnTo as string;
  const fromCart = params.fromCart === 'true';
  
  const existingAddress = addressString ? JSON.parse(addressString) : null;
  const isEditing = !!existingAddress;

  // --- حالات النموذج ---
  const [addressName, setAddressName] = useState(existingAddress?.address_name || '');
  const [streetAddress, setStreetAddress] = useState(existingAddress?.street_address || '');
  const [notes, setNotes] = useState(existingAddress?.notes || '');
  const [addressLabel, setAddressLabel] = useState<'home' | 'work' | 'other'>('home');
  const [isDefault, setIsDefault] = useState(existingAddress?.is_default || false);
  
  const [allZones, setAllZones] = useState<Zone[]>([]);
  const [cities, setCities] = useState<{ label: string; value: string }[]>([]);
  const [areas, setAreas] = useState<{ label: string; value: number }[]>([]);
  
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(existingAddress?.delivery_zone_id || null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ✅ أنواع العناوين
  const addressTypes = [
    { 
      value: 'home' as const, 
      label: 'المنزل', 
      icon: <Ionicons name="home-outline" size={scale(20)} color="#3B82F6" />,
      backgroundColor: '#EFF6FF'
    },
    { 
      value: 'work' as const, 
      label: 'العمل', 
      icon: <Ionicons name="business-outline" size={scale(20)} color="#8B5CF6" />,
      backgroundColor: '#FAF5FF'
    },
    { 
      value: 'other' as const, 
      label: 'أخرى', 
      icon: <Ionicons name="location-outline" size={scale(20)} color="#F97316" />,
      backgroundColor: '#FFF7ED'
    },
  ];

  // ✅ دالة محسنة للعودة
  const handleBack = () => {
    if (fromCart || returnTo === 'cart') {
      router.navigate('/(tabs)/cart');
    } else {
      router.navigate('/(tabs)/addresses');
    }
  };

  // ✅ دالة محسنة للحفظ الناجح
  const handleSaveSuccess = () => {
    if (fromCart) {
      router.navigate({
        pathname: '/(tabs)/cart',
        params: { reopenWizard: 'true' }
      });
    } else {
      router.navigate('/(tabs)/addresses');
    }
  };

  // جلب جميع المناطق عند تحميل الشاشة
  useEffect(() => {
    const fetchZones = async () => {
      const { data, error } = await supabase
        .from('delivery_zones')
        .select('id, city, area_name')
        .eq('is_active', true);

      if (data) {
        setAllZones(data);
        // استخراج المدن الفريدة
        const uniqueCities = [...new Set(data.map(zone => zone.city))];
        setCities(uniqueCities.map(city => ({ label: city, value: city })));
        
        // إذا كنا نعدل عنوانًا، قم بتعيين المدينة والمناطق
        if (isEditing && existingAddress) {
          const zone = data.find(z => z.id === existingAddress.delivery_zone_id);
          if (zone) {
            setSelectedCity(zone.city);
            // تحديث قائمة المناطق بناءً على المدينة المحددة
            const filteredAreas = data
              .filter(z => z.city === zone.city)
              .map(z => ({ label: z.area_name, value: z.id }));
            setAreas(filteredAreas);
            
            // استخراج اسم العنوان من الملاحظات إذا كان موجوداً
            if (existingAddress.notes) {
              const nameMatch = existingAddress.notes.match(/^(.*?)(?:\s•|$)/);
              if (nameMatch && nameMatch[1]) {
                setAddressName(nameMatch[1]);
              }
            }
            
            // تحديد نوع العنوان بناءً على الملاحظات
            if (existingAddress.notes?.includes('عمل') || existingAddress.notes?.includes('مكتب')) {
              setAddressLabel('work');
            } else if (existingAddress.notes?.includes('منزل') || existingAddress.notes?.includes('بيت')) {
              setAddressLabel('home');
            } else {
              setAddressLabel('other');
            }
          }
        }
      }
      setLoading(false);
    };
    fetchZones();
  }, []);

  // تحديث قائمة المناطق عند تغيير المدينة
  useEffect(() => {
    if (selectedCity) {
      const filteredAreas = allZones
        .filter(zone => zone.city === selectedCity)
        .map(zone => ({ label: zone.area_name, value: zone.id }));
      setAreas(filteredAreas);
      // إعادة تعيين المنطقة المختارة عند تغيير المدينة
      if (!isEditing || selectedCity !== allZones.find(z => z.id === selectedZoneId)?.city) {
        setSelectedZoneId(null);
      }
    } else {
      setAreas([]);
    }
  }, [selectedCity, allZones]);

  // --- دوال التحقق والحفظ ---
  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!addressName.trim()) newErrors.name = 'الرجاء إدخال اسم العنوان';
    if (!selectedCity) newErrors.city = 'الرجاء اختيار المدينة';
    if (!selectedZoneId) newErrors.area = 'الرجاء اختيار المنطقة';
    if (!streetAddress.trim()) newErrors.street = 'الرجاء إدخال اسم الشارع';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async () => {
    if (!validate() || !user) return;
    setSaving(true);
    
    // دمج اسم العنوان ونوع العنوان في الملاحظات
    const addressNotes = `${addressName} • ${addressTypes.find(type => type.value === addressLabel)?.label}${notes ? ` • ${notes}` : ''}`;
    
    const addressData = {
      user_id: user.id,
      delivery_zone_id: selectedZoneId,
      street_address: streetAddress,
      notes: addressNotes,
      is_default: isDefault,
      address_name: addressName, // ✅ حقل جديد
    };

    try {
      let error;
      
      if (isEditing) {
        // في حالة التعديل
        ({ error } = await supabase
          .from('user_addresses')
          .update(addressData)
          .eq('id', existingAddress.id));
      } else {
        // في حالة الإضافة
        if (isDefault) {
          // إلغاء التعيين الافتراضي من جميع العناوين
          await supabase
            .from('user_addresses')
            .update({ is_default: false })
            .eq('user_id', user.id);
        }
        
        ({ error } = await supabase
          .from('user_addresses')
          .insert(addressData));
      }

      if (error) {
        Alert.alert('خطأ', error.message);
      } else {
        Alert.alert(
          'نجاح',
          isEditing ? 'تم تحديث العنوان بنجاح' : 'تم إضافة العنوان بنجاح',
          [
            {
              text: 'موافق',
              onPress: handleSaveSuccess
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء حفظ العنوان');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* ✅ الهيدر الجديد مع التدرج اللوني */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerBackground} />
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={scale(24)} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {isEditing ? 'تعديل العنوان' : 'إضافة عنوان جديد'}
            </Text>
            <View style={styles.headerSpacer} />
          </View>
        </View>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={[
            styles.scrollContainer,
            { paddingBottom: insets.bottom + scale(20) }
          ]}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#DC2626" />
              <Text style={styles.loadingText}>جاري تحميل البيانات...</Text>
            </View>
          ) : (
            <>
              {/* ✅ مؤشر إذا أتى من السلة */}
              {(fromCart || returnTo === 'cart') && (
                <Card style={styles.infoCard}>
                  <View style={styles.infoContent}>
                    <Ionicons name="information-circle-outline" size={scale(20)} color="#1E40AF" />
                    <Text style={styles.infoText}>
                      سيتم إرجاعك تلقائيًا لاستكمال الطلب بعد إضافة العنوان
                    </Text>
                  </View>
                </Card>
              )}

              {/* ✅ اختيار نوع العنوان مع تحسين المسافات */}
              <Card style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons name="tag-outline" size={scale(20)} color="#DC2626" />
                  <Text style={styles.sectionTitle}>نوع العنوان</Text>
                </View>
                <Text style={styles.sectionDescription}>
                  اختر النوع الذي يناسب عنوانك لتسهيل التعرف عليه
                </Text>
                <View style={styles.radioGroup}>
                  {addressTypes.map((type) => (
                    <RadioButton
                      key={type.value}
                      selected={addressLabel === type.value}
                      onPress={() => setAddressLabel(type.value)}
                      icon={type.icon}
                      label={type.label}
                      backgroundColor={type.backgroundColor}
                    />
                  ))}
                </View>
              </Card>

              {/* ✅ تفاصيل العنوان */}
              <Card style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons name="map-marker-radius" size={scale(20)} color="#DC2626" />
                  <Text style={styles.sectionTitle}>تفاصيل العنوان</Text>
                </View>

                <View style={styles.formFields}>
                  {/* ✅ اسم العنوان الجديد */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>
                      اسم العنوان <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                      value={addressName}
                      onChangeText={setAddressName}
                      placeholder="مثال: المنزل، العمل، بيت الوالدة"
                      style={styles.input}
                      placeholderTextColor="#9CA3AF"
                    />
                    {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                  </View>

                  {/* المدينة */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>
                      المدينة <Text style={styles.required}>*</Text>
                    </Text>
                    <RNPickerSelect
                      onValueChange={(value) => setSelectedCity(value)}
                      items={cities}
                      value={selectedCity}
                      placeholder={{ label: 'اختر مدينتك...', value: null }}
                      style={pickerSelectStyles}
                      useNativeAndroidPickerStyle={false}
                      Icon={() => <Ionicons name="chevron-down" size={scale(20)} color="#6B7280" />}
                    />
                    {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
                  </View>

                  {/* المنطقة */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>
                      المنطقة <Text style={styles.required}>*</Text>
                    </Text>
                    <RNPickerSelect
                      onValueChange={(value) => setSelectedZoneId(value)}
                      items={areas}
                      value={selectedZoneId}
                      placeholder={{ 
                        label: selectedCity ? 'اختر منطقتك...' : 'اختر المدينة أولاً...', 
                        value: null 
                      }}
                      style={pickerSelectStyles}
                      disabled={!selectedCity}
                      useNativeAndroidPickerStyle={false}
                      Icon={() => <Ionicons name="chevron-down" size={scale(20)} color="#6B7280" />}
                    />
                    {errors.area && <Text style={styles.errorText}>{errors.area}</Text>}
                  </View>

                  {/* اسم الشارع */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>
                      اسم الشارع ورقم المبنى <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                      value={streetAddress}
                      onChangeText={setStreetAddress}
                      placeholder="مثال: شارع الإرسال، عمارة النجمة"
                      style={styles.input}
                      placeholderTextColor="#9CA3AF"
                    />
                    {errors.street && <Text style={styles.errorText}>{errors.street}</Text>}
                  </View>

                  {/* ملاحظات إضافية */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>ملاحظات إضافية (اختياري)</Text>
                    <TextInput
                      value={notes}
                      onChangeText={setNotes}
                      placeholder="مثال: المدخل خلفي، الطابق الثالث"
                      style={[styles.input, styles.textArea]}
                      multiline
                      numberOfLines={3}
                      placeholderTextColor="#9CA3AF"
                      textAlignVertical="top"
                    />
                  </View>
                </View>
              </Card>

              {/* ✅ الخيارات الإضافية */}
              <Card style={styles.sectionCard}>
                <View style={styles.switchContainer}>
                  <View style={styles.switchContent}>
                    <Text style={styles.switchLabel}>تعيين كعنوان افتراضي</Text>
                    <Text style={styles.switchDescription}>
                      استخدام هذا العنوان لجميع الطلبات المستقبلية
                    </Text>
                  </View>
                  <Switch value={isDefault} onValueChange={setIsDefault} />
                </View>
              </Card>

              {/* ✅ بطاقة النصيحة */}
              <Card style={styles.tipCard}>
                <View style={styles.tipContent}>
                  <MaterialCommunityIcons name="map-marker-check" size={scale(18)} color="#1E40AF" />
                  <View style={styles.tipTexts}>
                    <Text style={styles.tipTitle}>ملاحظة هامة</Text>
                    <Text style={styles.tipDescription}>
                      تأكد من صحة ودقة عنوانك لتجربة توصيل سلسة
                    </Text>
                  </View>
                </View>
              </Card>

              {/* ✅ أزرار الإجراء */}
              <View style={styles.actionsContainer}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={handleBack}
                  disabled={saving}
                >
                  <Text style={styles.cancelButtonText}>إلغاء</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.submitButton, saving && styles.submitButtonDisabled]} 
                  onPress={onSubmit} 
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle-outline" size={scale(20)} color="white" />
                      <Text style={styles.submitButtonText}>
                        {isEditing ? 'حفظ التعديلات' : 'حفظ العنوان'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// --- التنسيقات المحدثة ---
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8FAFC' 
  },
  
  // الهيدر
  header: {
    height: scale(160),
    position: 'relative',
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#DC2626',
    borderBottomLeftRadius: scale(30),
    borderBottomRightRadius: scale(30),
  },
  headerContent: {
    paddingHorizontal: scale(20),
    paddingTop: scale(50),
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: scale(8),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: scale(20),
  },
  headerTitle: {
    fontSize: fontScale(24),
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    flex: 1,
  },
  headerSpacer: {
    width: scale(40),
  },

  // المحتوى
  scrollContainer: {
    paddingHorizontal: scale(20),
    paddingTop: scale(20),
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: scale(40),
  },
  loadingText: {
    marginTop: scale(16),
    fontSize: fontScale(16),
    color: '#6B7280',
  },

  // البطاقات
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
  infoCard: {
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    padding: scale(16),
    marginBottom: scale(16),
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
  },
  infoText: {
    color: '#1E40AF',
    fontSize: fontScale(14),
    flex: 1,
    lineHeight: scale(20),
  },
  sectionCard: {
    padding: scale(20),
    marginBottom: scale(16),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    marginBottom: scale(8), // تقليل المسافة
  },
  sectionTitle: {
    fontSize: fontScale(18),
    fontWeight: 'bold',
    color: '#1F2937',
  },
  sectionDescription: {
    fontSize: fontScale(14),
    color: '#6B7280',
    marginBottom: scale(16),
    lineHeight: scale(20),
  },

  // مجموعة الأزرار الراديوية - معدلة ومحسنة
  radioGroup: {
    flexDirection: 'row',
    gap: scale(8),
    justifyContent: 'space-between',
  },
  radioButton: {
    flex: 1,
    minHeight: scale(90), // زيادة الارتفاع
    padding: scale(16), // زيادة المساحة الداخلية
    borderRadius: scale(12),
    borderWidth: 2,
    backgroundColor: 'white',
    justifyContent: 'space-between',
  },
  radioButtonSelected: {
    backgroundColor: '#FEF2F2',
  },
  radioContent: {
    alignItems: 'center',
    gap: scale(12), // زيادة المسافة بين الأيقونة والنص
    marginBottom: scale(12),
  },
  radioIconContainer: {
    padding: scale(12), // زيادة حجم الأيقونة
    borderRadius: scale(12),
    width: scale(48),
    height: scale(48),
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioLabel: {
    fontSize: fontScale(14), // زيادة حجم النص
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  radioLabelSelected: {
    color: '#1F2937',
    fontWeight: '600',
  },
  radioOuter: {
    width: scale(20),
    height: scale(20),
    borderRadius: scale(10),
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  radioOuterSelected: {
    borderColor: '#DC2626',
  },
  radioInner: {
    width: scale(10),
    height: scale(10),
    borderRadius: scale(5),
    backgroundColor: '#DC2626',
  },

  // حقول النموذج
  formFields: {
    gap: scale(16),
  },
  inputGroup: {
    gap: scale(8),
  },
  label: {
    fontSize: fontScale(14),
    fontWeight: '600',
    color: '#374151',
  },
  required: {
    color: '#DC2626',
  },
  input: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: scale(16),
    paddingVertical: scale(12),
    borderRadius: scale(12),
    fontSize: fontScale(16),
    textAlign: 'right',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    color: '#1F2937',
  },
  textArea: {
    height: scale(80),
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#DC2626',
    fontSize: fontScale(12),
    marginTop: scale(-4),
  },

  // التبديل
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchContent: {
    flex: 1,
  },
  switchLabel: {
    fontSize: fontScale(16),
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: scale(4),
  },
  switchDescription: {
    fontSize: fontScale(12),
    color: '#6B7280',
    lineHeight: scale(16),
  },
  switch: {
    width: scale(51),
    height: scale(31),
    borderRadius: scale(15.5),
    backgroundColor: '#E5E7EB',
    padding: scale(2),
    justifyContent: 'center',
  },
  switchActive: {
    backgroundColor: '#DC2626',
  },
  switchThumb: {
    width: scale(27),
    height: scale(27),
    borderRadius: scale(13.5),
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  switchThumbActive: {
    transform: [{ translateX: scale(20) }],
  },

  // بطاقة النصيحة
  tipCard: {
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    padding: scale(16),
    marginBottom: scale(20),
  },
  tipContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: scale(12),
  },
  tipTexts: {
    flex: 1,
  },
  tipTitle: {
    fontSize: fontScale(14),
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: scale(4),
  },
  tipDescription: {
    fontSize: fontScale(12),
    color: '#374151',
    lineHeight: scale(16),
  },

  // أزرار الإجراء
  actionsContainer: {
    flexDirection: 'row',
    gap: scale(12),
    marginBottom: scale(20),
  },
  cancelButton: {
    flex: 1,
    paddingVertical: scale(16),
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: scale(12),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelButtonText: {
    fontSize: fontScale(16),
    fontWeight: '600',
    color: '#6B7280',
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(8),
    paddingVertical: scale(16),
    backgroundColor: '#DC2626',
    borderRadius: scale(12),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    fontSize: fontScale(16),
    fontWeight: 'bold',
    color: 'white',
  },
});

// تنسيقات خاصة بمكتبة RNPickerSelect
const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: fontScale(16),
    paddingVertical: scale(12),
    paddingHorizontal: scale(16),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: scale(12),
    color: '#1F2937',
    paddingRight: scale(30),
    backgroundColor: '#F9FAFB',
    textAlign: 'right',
  },
  inputAndroid: {
    fontSize: fontScale(16),
    paddingHorizontal: scale(16),
    paddingVertical: scale(12),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: scale(12),
    color: '#1F2937',
    paddingRight: scale(30),
    backgroundColor: '#F9FAFB',
    textAlign: 'right',
  },
  iconContainer: {
    top: scale(15),
    right: scale(15),
  },
  placeholder: {
    color: '#9CA3AF',
    textAlign: 'right',
  },
});