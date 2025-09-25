// مسار الملف: app/(auth)/register.tsx

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function RegisterScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('خطأ', 'الرجاء إدخال الاسم الأول واسم العائلة.');
      return;
    }
    
    setLoading(true);
    
    // ✅ تعديل: إرسال كل البيانات في options.data
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          phone_number: phoneNumber.trim() || null, // أرسل null إذا كان فارغًا
        },
      },
    });

    setLoading(false);

    if (error) {
      Alert.alert('خطأ في إنشاء الحساب', error.message);
    } else if (data.user && !data.session) {
      Alert.alert(
        'تحقق من بريدك الإلكتروني',
        'لقد أرسلنا رابط تفعيل إلى بريدك الإلكتروني.'
      );
      router.push('/(auth)/login'); // توجيه المستخدم إلى صفحة تسجيل الدخول بعد إنشاء الحساب
    }
    // لا حاجة لعملية update منفصلة بعد الآن
  };

  // واجهة المستخدم (JSX) تبقى كما هي من المرة السابقة
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>إنشاء حساب جديد</Text>
        
        <View style={styles.nameContainer}>
          <TextInput
            style={[styles.input, styles.nameInput]}
            placeholder="اسم العائلة"
            value={lastName}
            onChangeText={setLastName}
          />
          <TextInput
            style={[styles.input, styles.nameInput]}
            placeholder="الاسم الأول"
            value={firstName}
            onChangeText={setFirstName}
          />
        </View>
        
        <TextInput
          style={styles.input}
          placeholder="البريد الإلكتروني"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="رقم الهاتف (اختياري)"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
        />
        
        <TextInput
          style={styles.input}
          placeholder="كلمة المرور"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'جاري الإنشاء...' : 'إنشاء حساب'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.linkText}>لديك حساب بالفعل؟ تسجيل الدخول</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// التنسيقات تبقى كما هي
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginBottom: 40 },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
    backgroundColor: '#fff',
    textAlign: 'right',
  },
  nameContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  },
  nameInput: {
    width: '48%',
  },
  button: {
    backgroundColor: '#C62828',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  linkText: { color: '#C62828', textAlign: 'center', marginTop: 20 },
});
