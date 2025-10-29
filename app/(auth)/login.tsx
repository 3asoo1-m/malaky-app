// مسار الملف: app/(auth)/login.tsx

import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  StyleSheet, 
  Alert, 
  findNodeHandle, 
  Platform, 
  StatusBar, 
  ScrollView, 
  Image,
  Dimensions 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

// الألوان المستوحاة من التصميم الجديد
const COLORS = {
  emailPrimary: '#E31E24',
  emailSecondary: '#c91920',
  phonePrimary: '#2D4A9E',
  phoneSecondary: '#1e3a7a',
  white: '#FFFFFF',
  lightGray: '#F5F5F5',
  gray: '#6B7280',
  darkGray: '#374151',
  background: '#FEF7ED',
  border: '#E5E7EB',
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ✅ تعريف أنواع البيانات
type AuthMethod = 'phone' | 'email';

export default function LoginScreen() {
  const router = useRouter();
  
  // ✅ حالات التطبيق
  const [authMethod, setAuthMethod] = useState<AuthMethod>('phone');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('05');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  // ✅ المراجع
  const scrollViewRef = useRef<ScrollView>(null);
  const phoneRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  // ✅ دالة تسجيل الدخول
  const handleLogin = async () => {
    setErrorText(null);

    let credentials;
    if (authMethod === 'phone') {
      if (!phone || !password) {
        setErrorText('يرجى إدخال رقم الهاتف وكلمة المرور.');
        return;
      }

      const phoneRegex = /^05[0-9]{8}$/;
      if (!phoneRegex.test(phone)) {
        setErrorText('الرجاء إدخال رقم هاتف صحيح (يبدأ بـ 05 ويتكون من 10 أرقام)');
        return;
      }

      const internationalPhone = phone.replace(/^0/, '+972');
      credentials = { phone: internationalPhone, password };
    } else {
      if (!email || !password) {
        setErrorText('يرجى إدخال البريد الإلكتروني وكلمة المرور.');
        return;
      }
      credentials = { email, password };
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(credentials);
    setLoading(false);

    if (error) {
      if (error.message === 'Invalid login credentials') {
        setErrorText('رقم الهاتف/البريد الإلكتروني أو كلمة المرور غير صحيحة.');
      } else {
        setErrorText(error.message);
      }
    }
  };

  // ✅ دوال إخفاء الخطأ عند الكتابة
  const handleEmailChange = (text: string) => {
    if (errorText) setErrorText(null);
    setEmail(text);
  };

  const handlePhoneChange = (text: string) => {
    if (errorText) setErrorText(null);
    setPhone(text);
  };

  const handlePasswordChange = (text: string) => {
    if (errorText) setErrorText(null);
    setPassword(text);
  };

  // ✅ دالة التركيز والتمرير
  const handleFocus = (ref: React.RefObject<TextInput | null>) => {
    if (ref.current && scrollViewRef.current) {
      const node = findNodeHandle(ref.current);
      if (node) {
        ref.current.measureInWindow((x, y) => {
          const scrollToY = y - 100;
          scrollViewRef.current?.scrollTo({ y: scrollToY, animated: true });
        });
      }
    }
  };

  // ✅ مكون التبويبات
  const AuthTabs = () => {
    const getTabColors = () => {
      return authMethod === 'email' 
        ? { primary: COLORS.emailPrimary, secondary: COLORS.emailSecondary }
        : { primary: COLORS.phonePrimary, secondary: COLORS.phoneSecondary };
    };

    const colors = getTabColors();

    return (
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            authMethod === 'email' && [styles.tabButtonActive, { backgroundColor: colors.primary }]
          ]}
          onPress={() => setAuthMethod('email')}
        >
          <Ionicons 
            name="mail-outline" 
            size={20} 
            color={authMethod === 'email' ? COLORS.white : COLORS.gray} 
          />
          <Text style={[
            styles.tabText,
            authMethod === 'email' && styles.tabTextActive
          ]}>
            البريد الإلكتروني
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            authMethod === 'phone' && [styles.tabButtonActive, { backgroundColor: colors.primary }]
          ]}
          onPress={() => setAuthMethod('phone')}
        >
          <Ionicons 
            name="call-outline" 
            size={20} 
            color={authMethod === 'phone' ? COLORS.white : COLORS.gray} 
          />
          <Text style={[
            styles.tabText,
            authMethod === 'phone' && styles.tabTextActive
          ]}>
            رقم الهاتف
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // ✅ الحصول على الألوان الحالية بناءً على طريقة المصادقة
  const getCurrentColors = () => {
    return authMethod === 'email' 
      ? { primary: COLORS.emailPrimary, secondary: COLORS.emailSecondary }
      : { primary: COLORS.phonePrimary, secondary: COLORS.phoneSecondary };
  };

  const colors = getCurrentColors();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingContainer}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* الهيدر */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image 
                source={require('@/assets/images/malakylogo.png')} 
                style={styles.logo} 
              />
            </View>
            <Text style={styles.title}>أهلاً بعودتك!</Text>
            <Text style={styles.subtitle}>سجل الدخول للاستمتاع بوجبات الدجاج الملكي اللذيذة</Text>
          </View>

          {/* البطاقة الرئيسية */}
          <View style={styles.card}>
            {/* التبويبات */}
            <AuthTabs />

            {/* النموذج */}
            <View style={styles.formContainer}>
              {/* حقل البريد الإلكتروني أو الهاتف */}
              {authMethod === 'phone' ? (
                <View style={styles.inputWrapper}>
                  <View style={[
                    styles.inputContainer,
                    errorText && styles.inputContainerError
                  ]}>
                    <Ionicons 
                      name="call-outline" 
                      size={22} 
                      color={errorText ? COLORS.emailPrimary : COLORS.gray} 
                      style={styles.inputIcon} 
                    />
                    <TextInput
                      ref={phoneRef}
                      style={styles.inputField}
                      placeholder="رقم الهاتف (05)"
                      value={phone}
                      onChangeText={handlePhoneChange}
                      keyboardType="phone-pad"
                      autoCapitalize="none"
                      placeholderTextColor={COLORS.gray}
                      onFocus={() => handleFocus(phoneRef)}
                      maxLength={10}
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.inputWrapper}>
                  <View style={[
                    styles.inputContainer,
                    errorText && styles.inputContainerError
                  ]}>
                    <Ionicons 
                      name="mail-outline" 
                      size={22} 
                      color={errorText ? COLORS.emailPrimary : COLORS.gray} 
                      style={styles.inputIcon} 
                    />
                    <TextInput
                      ref={emailRef}
                      style={styles.inputField}
                      placeholder="البريد الإلكتروني"
                      value={email}
                      onChangeText={handleEmailChange}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      placeholderTextColor={COLORS.gray}
                      onFocus={() => handleFocus(emailRef)}
                    />
                  </View>
                </View>
              )}

              {/* حقل كلمة المرور */}
              <View style={styles.inputWrapper}>
                <View style={[
                  styles.inputContainer,
                  errorText && styles.inputContainerError
                ]}>
                  <Ionicons 
                    name="lock-closed-outline" 
                    size={22} 
                    color={errorText ? colors.primary : COLORS.gray} 
                    style={styles.inputIcon} 
                  />
                  <TextInput
                    ref={passwordRef}
                    style={styles.inputField}
                    placeholder="كلمة المرور"
                    value={password}
                    onChangeText={handlePasswordChange}
                    secureTextEntry={!isPasswordVisible}
                    placeholderTextColor={COLORS.gray}
                    onFocus={() => handleFocus(passwordRef)}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                  />
                  <TouchableOpacity 
                    onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                    style={styles.visibilityButton}
                  >
                    <Ionicons 
                      name={isPasswordVisible ? "eye-off-outline" : "eye-outline"} 
                      size={24} 
                      color={COLORS.gray} 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* رسالة الخطأ */}
              {errorText && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle-outline" size={20} color={colors.primary} />
                  <Text style={styles.errorText}>{errorText}</Text>
                </View>
              )}

              {/* تذكرني ونسيت كلمة المرور */}
              <View style={styles.optionsContainer}>
                <TouchableOpacity 
                  style={styles.rememberMeContainer}
                  onPress={() => setRememberMe(!rememberMe)}
                >
                  <View style={[
                    styles.checkbox,
                    rememberMe && [styles.checkboxChecked, { backgroundColor: colors.primary }]
                  ]}>
                    {rememberMe && (
                      <Ionicons name="checkmark" size={16} color={COLORS.white} />
                    )}
                  </View>
                  <Text style={styles.rememberMeText}>تذكرني</Text>
                </TouchableOpacity>

                <TouchableOpacity>
                  <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>
                    نسيت كلمة المرور؟
                  </Text>
                </TouchableOpacity>
              </View>

              {/* زر تسجيل الدخول */}
              <TouchableOpacity 
                style={[
                  styles.button, 
                  { backgroundColor: colors.primary },
                  loading && styles.buttonDisabled
                ]} 
                onPress={handleLogin} 
                disabled={loading}
              >
                <Ionicons name="log-in-outline" size={20} color={COLORS.white} style={styles.buttonIcon} />
                <Text style={styles.buttonText}>
                  {loading ? 'جاري التسجيل...' : 'تسجيل الدخول'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* الفاصل */}
            <View style={styles.separatorContainer}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>أو تابع باستخدام</Text>
              <View style={styles.separatorLine} />
            </View>

            {/* تسجيل الدخول الاجتماعي */}
            <View style={styles.socialContainer}>
              <TouchableOpacity style={styles.socialButton}>
                <Ionicons name="logo-google" size={20} color="#DB4437" />
                <Text style={styles.socialText}>Google</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.socialButton}>
                <Ionicons name="logo-facebook" size={20} color="#1877F2" />
                <Text style={styles.socialText}>Facebook</Text>
              </TouchableOpacity>
            </View>

            {/* رابط إنشاء حساب */}
            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>
                ليس لديك حساب؟{' '}
                <Text 
                  style={[styles.signupLink, { color: colors.primary }]}
                  onPress={() => router.replace('/(auth)/register')}
                >
                  أنشئ حساباً
                </Text>
              </Text>
            </View>
          </View>

          {/* التذييل */}
          <View style={styles.footer}>
            <View style={styles.footerRow}>
              <Ionicons name="sparkles" size={16} color={COLORS.emailPrimary} />
              <Text style={styles.footerText}>دجاج بروست بجودة ممتازة</Text>
            </View>
            <Text style={styles.footerCopyright}>
              © 2025 الدجاج الملكي. جميع الحقوق محفوظة.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ✅ التنسيقات الجديدة
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  keyboardAvoidingContainer: { 
    flex: 1 
  },
  scrollContainer: { 
    flexGrow: 1, 
    paddingHorizontal: 25, 
    paddingVertical: 20,
    justifyContent: 'center',
  },
  
  // الهيدر
  header: { 
    alignItems: 'center', 
    marginBottom: 30 
  },
  logoContainer: {
    marginBottom: 16,
  },
  logo: { 
    width: 80, 
    height: 80, 
    resizeMode: 'contain' 
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: COLORS.darkGray, 
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: { 
    fontSize: 16, 
    color: COLORS.gray, 
    textAlign: 'center',
  },

  // البطاقة الرئيسية
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  // التبويبات
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.lightGray,
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  tabButtonActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gray,
  },
  tabTextActive: {
    color: COLORS.white,
  },

  // النموذج
  formContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputContainer: { 
    flexDirection: 'row-reverse', 
    alignItems: 'center', 
    backgroundColor: COLORS.white, 
    borderRadius: 12, 
    paddingHorizontal: 16, 
    height: 56,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  inputContainerError: {
    borderColor: COLORS.emailPrimary,
  },
  inputIcon: { 
    marginLeft: 12 
  },
  inputField: { 
    flex: 1, 
    fontSize: 16, 
    textAlign: 'right', 
    color: COLORS.darkGray 
  },
  visibilityButton: {
    padding: 4,
  },

  // رسائل الخطأ
  errorContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.emailPrimary,
    textAlign: 'right',
    fontWeight: '500',
  },

  // الخيارات
  optionsContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  rememberMeContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.gray,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    borderColor: 'transparent',
  },
  rememberMeText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // زر تسجيل الدخول
  button: { 
    flexDirection: 'row-reverse',
    paddingVertical: 16, 
    borderRadius: 16, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: { 
    color: COLORS.white, 
    fontSize: 18, 
    fontWeight: 'bold',
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 8,
  },

  // الفاصل
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  separatorText: {
    fontSize: 14,
    color: COLORS.gray,
    marginHorizontal: 12,
    backgroundColor: COLORS.white,
    paddingHorizontal: 8,
  },

  // التسجيل الاجتماعي
  socialContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    gap: 8,
  },
  socialText: {
    fontSize: 14,
    color: COLORS.darkGray,
    fontWeight: '500',
  },

  // رابط إنشاء حساب
  signupContainer: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  signupText: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
  },
  signupLink: {
    fontWeight: 'bold',
  },

  // التذييل
  footer: {
    alignItems: 'center',
  },
  footerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  footerText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  footerCopyright: {
    fontSize: 12,
    color: COLORS.gray,
    opacity: 0.7,
  },
});