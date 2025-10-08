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
import RNPickerSelect from 'react-native-picker-select'; // ✅ 1. استيراد المكتبة

// ✅ 2. تعريف أنواع البيانات التي سنجلبها
interface Zone {
  id: number;
  city: string;
  area_name: string;
}

export default function AddressFormScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const { address: addressString } = useLocalSearchParams<{ address?: string }>();
  const existingAddress = addressString ? JSON.parse(addressString) : null;
  const isEditing = !!existingAddress;

  // --- حالات النموذج ---
  const [streetAddress, setStreetAddress] = useState(existingAddress?.street_address || '');
  const [notes, setNotes] = useState(existingAddress?.notes || '');
  
  // ✅ 3. حالات جديدة للقوائم المنسدلة
  const [allZones, setAllZones] = useState<Zone[]>([]);
  const [cities, setCities] = useState<{ label: string; value: string }[]>([]);
  const [areas, setAreas] = useState<{ label: string; value: number }[]>([]);
  
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(existingAddress?.delivery_zone_id || null);

  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ✅ 4. جلب جميع المناطق عند تحميل الشاشة
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

  // ✅ 5. تحديث قائمة المناطق عند تغيير المدينة
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
    setLoading(true);
    const addressData = {
      user_id: user.id,
      delivery_zone_id: selectedZoneId,
      street_address: streetAddress,
      notes: notes,
    };

    const { error } = isEditing
      ? await supabase.from('user_addresses').update(addressData).eq('id', existingAddress.id)
      : await supabase.from('user_addresses').insert(addressData);

    if (error) {
      Alert.alert('خطأ', error.message);
    } else {
      router.back();
    }
    setLoading(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{isEditing ? 'تعديل العنوان' : 'إضافة عنوان جديد'}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={28} color="#333" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {loading ? (
            <ActivityIndicator size="large" />
          ) : (
            <>
              {/* ✅ 6. استخدام RNPickerSelect للمدينة */}
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

              {/* ✅ 7. استخدام RNPickerSelect للمنطقة */}
              <Text style={styles.label}>المنطقة</Text>
              <RNPickerSelect
                onValueChange={(value) => setSelectedZoneId(value)}
                items={areas}
                value={selectedZoneId}
                placeholder={{ label: 'اختر منطقتك...', value: null }}
                style={pickerSelectStyles}
                disabled={!selectedCity} // تعطيل حتى يتم اختيار مدينة
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
                style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                multiline
              />

              <TouchableOpacity style={styles.button} onPress={onSubmit} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{isEditing ? 'حفظ التعديلات' : 'إضافة العنوان'}</Text>}
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
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', backgroundColor: '#fff' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  closeButton: { position: 'absolute', left: 16 },
  scrollContainer: { padding: 24, paddingBottom: 50 },
  label: { fontSize: 15, fontWeight: '600', color: '#555', marginBottom: 8, textAlign: 'left' },
  input: { backgroundColor: '#fff', padding: 15, borderRadius: 10, fontSize: 16, textAlign: 'right', borderWidth: 1, borderColor: '#ddd', marginBottom: 20 },
  button: { backgroundColor: '#C62828', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  errorText: { color: '#E53935', marginTop: -10, marginBottom: 10, textAlign: 'left', fontSize: 13 },
});

// ✅ 8. تنسيقات خاصة بمكتبة RNPickerSelect
const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    color: 'black',
    paddingRight: 30, // to ensure the text is never behind the icon
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
    paddingRight: 30, // to ensure the text is never behind the icon
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
