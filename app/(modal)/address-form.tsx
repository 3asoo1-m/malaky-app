// مسار الملف: app/(modal)/address-form.tsx

import React, { useState } from 'react';
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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';
import { Ionicons } from '@expo/vector-icons';
// ✅ 1. استيراد الهوك
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ... (مكون FormInput يبقى كما هو)
const FormInput = ({ icon, label, value, onChangeText, placeholder, error, multiline = false }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value: string; onChangeText: (text: string) => void; placeholder: string; error?: string; multiline?: boolean; }) => (
  <View style={styles.inputContainer}>
    <Text style={styles.label}>{label}</Text>
    <View style={[styles.inputWrapper, error ? styles.inputWrapperError : null]}>
      <Ionicons name={icon} size={22} color={error ? '#E53935' : '#888'} style={styles.inputIcon} />
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#aaa" style={[styles.input, multiline && styles.multilineInput]} multiline={multiline} />
    </View>
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);


export default function AddressFormScreen() {
  const router = useRouter();
  const { user } = useAuth();
  // ✅ 2. استدعاء الهوك للحصول على قيم الحواف
  const insets = useSafeAreaInsets();

  const { address: addressString } = useLocalSearchParams<{ address?: string }>();
  const existingAddress = addressString ? JSON.parse(addressString) : null;
  const isEditing = !!existingAddress;

  // ... (بقية الحالات والدوال تبقى كما هي)
  const [addressLine1, setAddressLine1] = useState(existingAddress?.address_line1 || '');
  const [addressLine2, setAddressLine2] = useState(existingAddress?.address_line2 || '');
  const [city, setCity] = useState(existingAddress?.city || '');
  const [notes, setNotes] = useState(existingAddress?.notes || '');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!addressLine1) newErrors.addressLine1 = 'اسم الشارع مطلوب';
    if (!city) newErrors.city = 'المدينة مطلوبة';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async () => {
    if (!validate() || !user) return;
    setLoading(true);
    const addressData = { user_id: user.id, addressLine1, addressLine2, city, notes };
    const { error } = isEditing
      ? await supabase.from('user_addresses').update(addressData).eq('id', existingAddress.id)
      : await supabase.from('user_addresses').insert(addressData);
    if (error) alert(error.message);
    else router.back();
    setLoading(false);
  };


  return (
    // ✅ 3. تطبيق الحواف الآمنة كـ padding على الحاوية الرئيسية
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{isEditing ? 'تعديل العنوان' : 'إضافة عنوان جديد'}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={28} color="#333" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >      
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* ... (مكونات FormInput تبقى كما هي) */}
          <FormInput icon="map-outline" label="الشارع / المنطقة" value={addressLine1} onChangeText={setAddressLine1} placeholder="مثال: شارع القدس" error={errors.addressLine1} />
          <FormInput icon="business-outline" label="رقم المبنى / الشقة (اختياري)" value={addressLine2} onChangeText={setAddressLine2} placeholder="مثال: بناية الزهراء، شقة 5" />
          <FormInput icon="location-outline" label="المدينة" value={city} onChangeText={setCity} placeholder="مثال: رام الله" error={errors.city} />
          <FormInput icon="chatbubble-ellipses-outline" label="ملاحظات للسائق (اختياري)" value={notes} onChangeText={setNotes} placeholder="مثال: المدخل بجانب السوبر ماركت" multiline />

          <TouchableOpacity style={styles.button} onPress={onSubmit} disabled={loading} activeOpacity={0.8}>
            {loading ? <ActivityIndicator color="#fff" /> : (
              <>
                <Ionicons name="save-outline" size={22} color="#fff" />
                <Text style={styles.buttonText}>{isEditing ? 'حفظ التعديلات' : 'إضافة العنوان'}</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ✅ 4. تعديل التنسيقات
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    position: 'relative',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    position: 'absolute',
    left: 16,
  },
  scrollContainer: {
    padding: 24,
    paddingBottom: 50,
  },
  // ... (بقية التنسيقات تبقى كما هي)
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
    textAlign: 'right',
  },
  inputWrapper: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 12,
  },
  inputWrapperError: {
    borderColor: '#E53935',
  },
  inputIcon: {
    marginLeft: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    textAlign: 'right',
    color: '#333',
  },
  multilineInput: {
    minHeight: 120,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  button: {
    backgroundColor: '#C62828',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row-reverse',
    marginTop: 16,
    elevation: 3,
    shadowColor: '#C62828',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  errorText: {
    color: '#E53935',
    marginTop: 6,
    textAlign: 'right',
    fontSize: 13,
  },
});
