// مسار الملف: app/(auth)/verify-otp.tsx

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform, StatusBar, KeyboardAvoidingView, Pressable, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

const COLORS = {
  primary: '#0033A0',
  secondary: '#E4002B',
  white: '#FFFFFF',
  lightGray: '#F5F5F5',
  gray: '#A9A9A9',
  darkGray: '#333333',
};

export default function VerifyOtpScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputsRef = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const handleVerify = async () => {
    const token = otp.join('');
    if (token.length !== 6 || !phone) {
      Alert.alert('خطأ', 'الرجاء إدخال الرمز المكون من 6 أرقام.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      phone: phone,
      token: token,
      type: 'sms',
    });
    setLoading(false);

    if (error) {
      Alert.alert('خطأ في التحقق', error.message);
    } else {
      Alert.alert('نجاح', 'تم تأكيد حسابك بنجاح!');
    }
  };

  const handleInputChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleBackspace = (event: any, index: number) => {
    if (event.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <Pressable style={styles.innerContainer} onPress={Keyboard.dismiss}>
          <View>
            <Text style={styles.title}>التحقق من الرمز</Text>
            <Text style={styles.subtitle}>
              أدخل الرمز المكون من 6 أرقام الذي تم إرساله إلى الرقم <Text style={styles.phoneText}>{phone}</Text>
            </Text>

            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  // --- بداية التصحيح ---
                  ref={ref => {
                    inputsRef.current[index] = ref;
                  }}
                  // --- نهاية التصحيح ---
                  style={[
                    styles.otpInput,
                    // يمكنك إضافة نمط للحقل النشط إذا أردت
                    // { borderColor: inputsRef.current[index]?.isFocused() ? COLORS.primary : COLORS.gray }
                  ]}
                  keyboardType="number-pad"
                  maxLength={1}
                  onChangeText={(text) => handleInputChange(text, index)}
                  onKeyPress={(event) => handleBackspace(event, index)}
                  value={digit}
                />
              ))}
            </View>

            <TouchableOpacity style={styles.button} onPress={handleVerify} disabled={loading}>
              <Text style={styles.buttonText}>{loading ? 'جاري التحقق...' : 'تحقق'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.resendContainer}>
              <Text style={styles.resendText}>
                لم تستلم الرمز؟ <Text style={styles.resendLink}>إعادة الإرسال</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 25,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    textAlign: 'center',
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  phoneText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  otpContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  otpInput: {
    width: 50,
    height: 60,
    borderWidth: 1.5, // زيادة سمك الحدود قليلاً
    borderColor: COLORS.gray,
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.darkGray,
    backgroundColor: COLORS.lightGray,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 25,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  resendContainer: {
    alignItems: 'center',
  },
  resendText: {
    color: COLORS.gray,
    fontSize: 15,
  },
  resendLink: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});
