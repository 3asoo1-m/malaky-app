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
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RNPickerSelect from 'react-native-picker-select';

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
  const [streetAddress, setStreetAddress] = useState(existingAddress?.street_address || '');
  const [notes, setNotes] = useState(existingAddress?.notes || '');
  
  const [allZones, setAllZones] = useState<Zone[]>([]);
  const [cities, setCities] = useState<{ label: string; value: string }[]>([]);
  const [areas, setAreas] = useState<{ label: string; value: number }[]>([]);
  
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(existingAddress?.delivery_zone_id || null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ✅ 1. دالة محسنة للعودة - تأخذ في الاعتبار مصدر الدخول
  const handleBack = () => {
    if (fromCart || returnTo === 'cart') {
      // ✅ إذا أتى من السلة، ارجع مباشرة للسلة
      router.navigate('/(tabs)/cart');
    } else {
      // ✅ وإلا ارجع للشاشة السابقة (العناوين)
      router.back();
    }
  };

  // ✅ 2. دالة محسنة للحفظ الناجح
  const handleSaveSuccess = () => {
    if (fromCart) {
      // ✅ 6. عند العودة للسلة، أضف المعلمة الجديدة
      router.navigate({
        pathname: '/(tabs)/cart',
        params: { reopenWizard: 'true' }
      });
    } else {
      router.back();
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
      // إعادة تعيين المنطقة المختارة عند تغيير المدينة (إلا إذا كنا في وضع التعديل لأول مرة)
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
    if (!selectedCity) newErrors.city = 'الرجاء اختيار المدينة';
    if (!selectedZoneId) newErrors.area = 'الرجاء اختيار المنطقة';
    if (!streetAddress) newErrors.street = 'الرجاء إدخال اسم الشارع';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async () => {
    if (!validate() || !user) return;
    setSaving(true);
    
    const addressData = {
      user_id: user.id,
      delivery_zone_id: selectedZoneId,
      street_address: streetAddress,
      notes: notes,
    };

    try {
      const { error } = isEditing
        ? await supabase.from('user_addresses').update(addressData).eq('id', existingAddress.id)
        : await supabase.from('user_addresses').insert(addressData);

      if (error) {
        Alert.alert('خطأ', error.message);
      } else {
        Alert.alert(
          'نجاح',
          isEditing ? 'تم تحديث العنوان بنجاح' : 'تم إضافة العنوان بنجاح',
          [
            {
              text: 'موافق',
              onPress: handleSaveSuccess // ✅ استخدام الدالة المحسنة
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
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* ✅ 3. تحديث الهيدر لاستخدام دالة handleBack المحسنة */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? 'تعديل العنوان' : 'إضافة عنوان جديد'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#C62828" />
              <Text style={styles.loadingText}>جاري تحميل البيانات...</Text>
            </View>
          ) : (
            <>
              {/* ✅ 4. إضافة مؤشر إذا أتى من السلة */}
              {(fromCart || returnTo === 'cart') && (
                <View style={styles.infoBox}>
                  <Ionicons name="information-circle-outline" size={20} color="#1976D2" />
                  <Text style={styles.infoText}>
                    سيتم إرجاعك تلقائيًا لاستكمال الطلب بعد إضافة العنوان
                  </Text>
                </View>
              )}

              <Text style={styles.label}>المدينة</Text>
              <RNPickerSelect
                onValueChange={(value) => setSelectedCity(value)}
                items={cities}
                value={selectedCity}
                placeholder={{ label: 'اختر مدينتك...', value: null }}
                style={pickerSelectStyles}
                useNativeAndroidPickerStyle={false}
                Icon={() => <Ionicons name="chevron-down" size={20} color="#888" />}
              />
              {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}

              <Text style={styles.label}>المنطقة</Text>
              <RNPickerSelect
                onValueChange={(value) => setSelectedZoneId(value)}
                items={areas}
                value={selectedZoneId}
                placeholder={{ label: 'اختر منطقتك...', value: null }}
                style={pickerSelectStyles}
                disabled={!selectedCity}
                useNativeAndroidPickerStyle={false}
                Icon={() => <Ionicons name="chevron-down" size={20} color="#888" />}
              />
              {errors.area && <Text style={styles.errorText}>{errors.area}</Text>}

              <Text style={styles.label}>اسم الشارع ورقم المبنى</Text>
              <TextInput
                value={streetAddress}
                onChangeText={setStreetAddress}
                placeholder="مثال: شارع الإرسال، عمارة النجمة"
                style={styles.input}
              />
              {errors.street && <Text style={styles.errorText}>{errors.street}</Text>}

              <Text style={styles.label}>ملاحظات للسائق (اختياري)</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="مثال: المدخل خلفي، الطابق الثالث"
                style={[styles.input, styles.textArea]}
                multiline
                numberOfLines={4}
              />

              <TouchableOpacity 
                style={[styles.button, saving && styles.buttonDisabled]} 
                onPress={onSubmit} 
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>
                    {isEditing ? 'حفظ التعديلات' : 'إضافة العنوان'}
                  </Text>
                )}
              </TouchableOpacity>

              {/* ✅ 5. زر إلغاء محسن */}
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={handleBack}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>إلغاء</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// --- التنسيقات ---
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F9F9F9' 
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F0F0F0', 
    backgroundColor: '#fff' 
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#333' 
  },
  backButton: { 
    padding: 4 
  },
  scrollContainer: { 
    padding: 24, 
    paddingBottom: 50 
  },
  label: { 
    fontSize: 15, 
    fontWeight: '600', 
    color: '#555', 
    marginBottom: 8, 
    textAlign: 'left' 
  },
  input: { 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 10, 
    fontSize: 16, 
    textAlign: 'right', 
    borderWidth: 1, 
    borderColor: '#ddd', 
    marginBottom: 20 
  },
  textArea: {
    height: 100, 
    textAlignVertical: 'top'
  },
  button: { 
    backgroundColor: '#C62828', 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginTop: 16 
  },
  buttonDisabled: {
    backgroundColor: '#BDBDBD'
  },
  buttonText: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
    marginTop: 12
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500'
  },
  errorText: { 
    color: '#E53935', 
    marginTop: -10, 
    marginBottom: 10, 
    textAlign: 'left', 
    fontSize: 13 
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 16
  },
  // ✅ 6. تنسيقات جديدة للمربع المعلوماتي
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBDEFB',
    marginBottom: 20
  },
  infoText: {
    color: '#1976D2',
    marginLeft: 8,
    fontSize: 14,
    flex: 1
  }
});

// تنسيقات خاصة بمكتبة RNPickerSelect
const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    color: 'black',
    paddingRight: 30,
    backgroundColor: '#fff',
    marginBottom: 20,
    textAlign: 'right',
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    color: 'black',
    paddingRight: 30,
    backgroundColor: '#fff',
    marginBottom: 20,
    textAlign: 'right',
  },
  iconContainer: {
    top: 15,
    right: 15,
  },
  placeholder: {
    color: '#9EA0A4',
    textAlign: 'right',
  },
});