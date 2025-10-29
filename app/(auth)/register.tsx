// مسار الملف: app/(auth)/register.tsx

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
  Linking,
  Dimensions 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

// تعريف الألوان المستوحاة من التصميم الجديد
const COLORS = {
  primary: '#DC2626', // الأحمر الأساسي
  primaryGradient: ['#DC2626', '#EA580C'], // التدرج من الأحمر إلى البرتقالي
  secondary: '#FEF2F2',
  white: '#FFFFFF',
  lightGray: '#F5F5F5',
  gray: '#6B7280',
  darkGray: '#374151',
  success: '#22C55E',
  error: '#EF4444',
  background: '#FEF7ED', // خلفية كريمي فاتح
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ✅ تعريف أنواع البيانات
type AuthMethod = 'phone' | 'email';

interface PasswordValidationState {
  minLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasSymbol: boolean;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
}

// ✅ مكون مؤشر قوة كلمة المرور
const PasswordStrengthIndicator = ({ validationState }: { validationState: PasswordValidationState }) => {
  const ValidationItem = ({ text, isValid }: { text: string; isValid: boolean }) => (
    <View style={styles.validationItem}>
      <Ionicons 
        name={isValid ? "checkmark-circle" : "ellipse-outline"} 
        size={16} 
        color={isValid ? COLORS.success : COLORS.gray} 
      />
      <Text style={[styles.validationText, isValid && styles.validationTextValid]}>
        {text}
      </Text>
    </View>
  );

  return (
    <View style={styles.validationContainer}>
      <ValidationItem text="8 أحرف على الأقل" isValid={validationState.minLength} />
      <ValidationItem text="حرف كبير واحد على الأقل (A-Z)" isValid={validationState.hasUpper} />
      <ValidationItem text="حرف صغير واحد على الأقل (a-z)" isValid={validationState.hasLower} />
      <ValidationItem text="رمز واحد على الأقل (!@#$%)" isValid={validationState.hasSymbol} />
    </View>
  );
};

// ✅ مكون عرض الأخطاء
const ErrorMessage = ({ message }: { message?: string }) => {
  if (!message) return null;
  
  return (
    <View style={styles.errorContainer}>
      <Ionicons name="warning-outline" size={14} color={COLORS.error} />
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
};

// ✅ مكون التبويبات
const AuthTabs = ({ activeTab, onTabChange }: { activeTab: AuthMethod; onTabChange: (tab: AuthMethod) => void }) => (
  <View style={styles.tabsContainer}>
    <TouchableOpacity
      style={[
        styles.tabButton,
        activeTab === 'email' && styles.tabButtonActive
      ]}
      onPress={() => onTabChange('email')}
    >
      <Ionicons 
        name="mail-outline" 
        size={20} 
        color={activeTab === 'email' ? COLORS.white : COLORS.gray} 
      />
      <Text style={[
        styles.tabText,
        activeTab === 'email' && styles.tabTextActive
      ]}>
        البريد الإلكتروني
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={[
        styles.tabButton,
        activeTab === 'phone' && styles.tabButtonActive
      ]}
      onPress={() => onTabChange('phone')}
    >
      <Ionicons 
        name="call-outline" 
        size={20} 
        color={activeTab === 'phone' ? COLORS.white : COLORS.gray} 
      />
      <Text style={[
        styles.tabText,
        activeTab === 'phone' && styles.tabTextActive
      ]}>
        رقم الهاتف
      </Text>
    </TouchableOpacity>
  </View>
);

// ✅ مكون فوائد التسجيل
const BenefitsSection = () => {
  const benefits = [
    "عروض حصرية وخصومات",
    "تجربة دفع سريعة",
    "تتبع طلباتك في الوقت الحقيقي",
    "حفظ العناصر المفضلة لديك"
  ];

  return (
    <View style={styles.benefitsContainer}>
      <Text style={styles.benefitsTitle}>لماذا تنضم إلى الدجاج الملكي؟</Text>
      <View style={styles.benefitsList}>
        {benefits.map((benefit, index) => (
          <View key={index} style={styles.benefitItem}>
            <View style={styles.benefitIcon}>
              <Ionicons name="checkmark" size={16} color={COLORS.primary} />
            </View>
            <Text style={styles.benefitText}>{benefit}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export default function RegisterScreen() {
  const router = useRouter();
  
  // ✅ حالات التطبيق
  const [authMethod, setAuthMethod] = useState<AuthMethod>('phone');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('05');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [passwordValidation, setPasswordValidation] = useState<PasswordValidationState>({
    minLength: false,
    hasUpper: false,
    hasLower: false,
    hasSymbol: false,
  });

  // ✅ المراجع
  const scrollViewRef = useRef<ScrollView>(null);
  const fullNameRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  // ✅ دوال التحقق من الصحة
  const validatePassword = (pass: string) => {
    const minLength = pass.length >= 8;
    const hasUpper = /[A-Z]/.test(pass);
    const hasLower = /[a-z]/.test(pass);
    const hasSymbol = /[!@#$%^&*(),.?":{}_|<>]/.test(pass);

    setPasswordValidation({ minLength, hasUpper, hasLower, hasSymbol });
    return minLength && hasUpper && hasLower && hasSymbol;
  };

  const validateField = (field: string, value: string): string => {
    switch (field) {
      case 'fullName':
        if (!value.trim()) return 'الرجاء إدخال الاسم الكامل';
        if (value.trim().length < 2) return 'الاسم الكامل يجب أن يكون حرفين على الأقل';
        if (!/^[\u0600-\u06FFa-zA-Z\s]+$/.test(value.trim())) return 'الاسم الكامل يجب أن يحتوي على حروف فقط';
        return '';

      case 'email':
        if (!value.trim()) return 'الرجاء إدخال البريد الإلكتروني';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'الرجاء إدخال بريد إلكتروني صحيح';
        return '';

      case 'phone':
        if (!value.trim()) return 'الرجاء إدخال رقم الهاتف';
        const phoneRegex = /^05[0-9]{8}$/;
        if (!phoneRegex.test(value)) return 'الرجاء إدخال رقم هاتف فلسطيني صحيح (يبدأ بـ 05)';
        return '';

      case 'password':
        if (!value) return 'الرجاء إدخال كلمة المرور';
        if (!validatePassword(value)) return 'كلمة المرور لا تلبي الشروط المطلوبة';
        return '';

      case 'confirmPassword':
        if (!value) return 'الرجاء تأكيد كلمة المرور';
        if (value !== password) return 'كلمتا المرور غير متطابقتين';
        return '';

      default:
        return '';
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    // تحديث القيمة
    switch (field) {
      case 'fullName': setFullName(value); break;
      case 'email': setEmail(value); break;
      case 'phone': setPhoneNumber(value); break;
      case 'password': 
        setPassword(value);
        validatePassword(value);
        break;
      case 'confirmPassword': setConfirmPassword(value); break;
    }

    // إذا كان الحقل قد تم لمسه، تحقق من الصحة
    if (touchedFields.has(field)) {
      const error = validateField(field, value);
      setFormErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const handleFieldBlur = (field: string) => {
    setTouchedFields(prev => new Set(prev).add(field));
    const value = getFieldValue(field);
    const error = validateField(field, value);
    setFormErrors(prev => ({ ...prev, [field]: error }));
  };

  const getFieldValue = (field: string): string => {
    switch (field) {
      case 'fullName': return fullName;
      case 'email': return email;
      case 'phone': return phoneNumber;
      case 'password': return password;
      case 'confirmPassword': return confirmPassword;
      default: return '';
    }
  };

  // ✅ تبديل طريقة المصادقة
  const switchAuthMethod = (method: AuthMethod) => {
    setAuthMethod(method);
    // مسح الحقول عند التبديل
    setEmail('');
    setPhoneNumber('05');
    setPassword('');
    setConfirmPassword('');
    setFormErrors({});
    setPasswordValidation({
      minLength: false,
      hasUpper: false,
      hasLower: false,
      hasSymbol: false,
    });
  };

  // ✅ التحقق النهائي من النموذج
  const validateForm = (): boolean => {
    if (!agreedToTerms) {
      Alert.alert('خطأ', 'الرجاء الموافقة على الشروط والأحكام');
      return false;
    }

    const fieldsToValidate = ['fullName', 'password', 'confirmPassword'];
    if (authMethod === 'email') fieldsToValidate.push('email');
    if (authMethod === 'phone') fieldsToValidate.push('phone');

    const newErrors: FormErrors = {};
    let isValid = true;

    fieldsToValidate.forEach(field => {
      const value = getFieldValue(field);
      const error = validateField(field, value);
      if (error) {
        newErrors[field as keyof FormErrors] = error;
        isValid = false;
      }
    });

    setFormErrors(newErrors);
    setTouchedFields(prev => new Set([...prev, ...fieldsToValidate]));
    return isValid;
  };

  // ✅ دالة التسجيل الرئيسية
  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // تقسيم الاسم الكامل إلى اسم أول واسم عائلة
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const credentials = {
        password: password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: fullName.trim(),
          },
        },
      };

      let finalCredentials;
      if (authMethod === 'phone') {
        const internationalPhone = phoneNumber.replace(/^0/, '+972');
        finalCredentials = { ...credentials, phone: internationalPhone };
      } else {
        finalCredentials = { ...credentials, email: email.trim() };
      }

      const { data, error } = await supabase.auth.signUp(finalCredentials);

      if (error) {
        let errorMessage = error.message;
        if (error.message.includes('already registered')) {
          errorMessage = authMethod === 'email' 
            ? 'هذا البريد الإلكتروني مسجل مسبقاً' 
            : 'رقم الهاتف هذا مسجل مسبقاً';
        }
        Alert.alert('خطأ في إنشاء الحساب', errorMessage);
        return;
      }

      if (data.user) {
        const internationalPhone = authMethod === 'phone' ? phoneNumber.replace(/^0/, '+972') : null;

        const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          first_name: firstName,
          last_name: lastName,
          full_name: fullName.trim(),
          phone: authMethod === 'phone' ? internationalPhone : null,
          email: authMethod === 'email' ? email.trim() : null,
        });

      if (profileError) {
        console.error('Error creating profile:', profileError);
      }

        if (authMethod === 'phone') {
          Alert.alert(
            'تم إرسال الرمز', 
            'لقد أرسلنا رمز تحقق إلى رقم هاتفك.',
            [{ text: 'حسناً', onPress: () => {
              router.push({ 
                pathname: '/(auth)/verify-otp', 
                params: { phone: internationalPhone, type: 'signup' } 
              });
            }}]
          );
        } else {
          Alert.alert(
            'تحقق من بريدك', 
            'لقد أرسلنا رابط تحقق إلى بريدك الإلكتروني.',
            [
              { 
                text: 'فتح البريد', 
                onPress: () => Linking.openURL('message://') 
              },
              { 
                text: 'حسناً', 
                onPress: () => router.replace('/(auth)/login') 
              }
            ]
          );
        }
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ غير متوقع. الرجاء المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ دوال المساعدة للـ Scroll
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
              <Ionicons name="sparkles" size={32} color={COLORS.white} />
            </View>
            <Text style={styles.title}>أنشئ حسابك</Text>
            <Text style={styles.subtitle}>انضم إلينا واستمتع بوجبات لذيذة</Text>
          </View>

          {/* التبويبات */}
          <AuthTabs activeTab={authMethod} onTabChange={switchAuthMethod} />

          {/* النموذج */}
          <View style={styles.formContainer}>
            {/* حقل الاسم الكامل */}
            <View style={styles.inputWrapper}>
              <View style={[
                styles.inputContainer,
                formErrors.fullName && styles.inputContainerError
              ]}>
                <Ionicons name="person-outline" size={22} color={formErrors.fullName ? COLORS.error : COLORS.gray} style={styles.inputIcon} />
                <TextInput
                  ref={fullNameRef}
                  style={styles.inputField}
                  placeholder="الاسم الكامل"
                  value={fullName}
                  onChangeText={(value) => handleFieldChange('fullName', value)}
                  onBlur={() => handleFieldBlur('fullName')}
                  placeholderTextColor={COLORS.gray}
                  onFocus={() => handleFocus(fullNameRef)}
                  returnKeyType="next"
                  onSubmitEditing={() => authMethod === 'phone' ? phoneRef.current?.focus() : emailRef.current?.focus()}
                />
              </View>
              <ErrorMessage message={formErrors.fullName} />
            </View>

            {/* حقل الهاتف أو البريد */}
            {authMethod === 'phone' ? (
              <View style={styles.inputWrapper}>
                <View style={[
                  styles.inputContainer,
                  formErrors.phone && styles.inputContainerError
                ]}>
                  <Ionicons name="call-outline" size={22} color={formErrors.phone ? COLORS.error : COLORS.gray} style={styles.inputIcon} />
                  <TextInput
                    ref={phoneRef}
                    style={styles.inputField}
                    placeholder="رقم الهاتف (05)"
                    value={phoneNumber}
                    onChangeText={(value) => handleFieldChange('phone', value)}
                    onBlur={() => handleFieldBlur('phone')}
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                    placeholderTextColor={COLORS.gray}
                    onFocus={() => handleFocus(phoneRef)}
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    maxLength={10} 
                  />
                </View>
                <ErrorMessage message={formErrors.phone} />
              </View>
            ) : (
              <View style={styles.inputWrapper}>
                <View style={[
                  styles.inputContainer,
                  formErrors.email && styles.inputContainerError
                ]}>
                  <Ionicons name="mail-outline" size={22} color={formErrors.email ? COLORS.error : COLORS.gray} style={styles.inputIcon} />
                  <TextInput
                    ref={emailRef}
                    style={styles.inputField}
                    placeholder="البريد الإلكتروني"
                    value={email}
                    onChangeText={(value) => handleFieldChange('email', value)}
                    onBlur={() => handleFieldBlur('email')}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor={COLORS.gray}
                    onFocus={() => handleFocus(emailRef)}
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                  />
                </View>
                <ErrorMessage message={formErrors.email} />
              </View>
            )}

            {/* حقل كلمة المرور */}
            <View style={styles.inputWrapper}>
              <View style={[
                styles.inputContainer,
                formErrors.password && styles.inputContainerError
              ]}>
                <Ionicons name="lock-closed-outline" size={22} color={formErrors.password ? COLORS.error : COLORS.gray} style={styles.inputIcon} />
                <TextInput
                  ref={passwordRef}
                  style={styles.inputField}
                  placeholder="كلمة المرور"
                  value={password}
                  onChangeText={(value) => handleFieldChange('password', value)}
                  onBlur={() => handleFieldBlur('password')}
                  secureTextEntry={!isPasswordVisible}
                  placeholderTextColor={COLORS.gray}
                  onFocus={() => handleFocus(passwordRef)}
                  returnKeyType="next"
                  onSubmitEditing={() => confirmPasswordRef.current?.focus()}
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
              <ErrorMessage message={formErrors.password} />
              
              {password.length > 0 && (
                <PasswordStrengthIndicator validationState={passwordValidation} />
              )}
            </View>

            {/* حقل تأكيد كلمة المرور */}
            <View style={styles.inputWrapper}>
              <View style={[
                styles.inputContainer,
                formErrors.confirmPassword && styles.inputContainerError
              ]}>
                <Ionicons name="lock-closed-outline" size={22} color={formErrors.confirmPassword ? COLORS.error : COLORS.gray} style={styles.inputIcon} />
                <TextInput
                  ref={confirmPasswordRef}
                  style={styles.inputField}
                  placeholder="تأكيد كلمة المرور"
                  value={confirmPassword}
                  onChangeText={(value) => handleFieldChange('confirmPassword', value)}
                  onBlur={() => handleFieldBlur('confirmPassword')}
                  secureTextEntry={!isConfirmPasswordVisible}
                  placeholderTextColor={COLORS.gray}
                  onFocus={() => handleFocus(confirmPasswordRef)}
                  returnKeyType="done"
                  onSubmitEditing={handleRegister}
                />
                <TouchableOpacity 
                  onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                  style={styles.visibilityButton}
                >
                  <Ionicons 
                    name={isConfirmPasswordVisible ? "eye-off-outline" : "eye-outline"} 
                    size={24} 
                    color={COLORS.gray} 
                  />
                </TouchableOpacity>
              </View>
              <ErrorMessage message={formErrors.confirmPassword} />
            </View>

            {/* شروط الاستخدام */}
            <TouchableOpacity 
              style={styles.termsContainer}
              onPress={() => setAgreedToTerms(!agreedToTerms)}
            >
              <View style={[
                styles.checkbox,
                agreedToTerms && styles.checkboxChecked
              ]}>
                {agreedToTerms && (
                  <Ionicons name="checkmark" size={16} color={COLORS.white} />
                )}
              </View>
              <Text style={styles.termsText}>
                أوافق على{' '}
                <Text style={styles.termsLink}>الشروط والأحكام</Text>
                {' '}و{' '}
                <Text style={styles.termsLink}>سياسة الخصوصية</Text>
              </Text>
            </TouchableOpacity>

            {/* زر التسجيل */}
            <TouchableOpacity 
              style={[
                styles.button, 
                loading && styles.buttonDisabled
              ]} 
              onPress={handleRegister} 
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'جاري الإنشاء...' : 'إنشاء حساب'}
              </Text>
              <Ionicons name="arrow-forward" size={20} color={COLORS.white} style={styles.buttonIcon} />
            </TouchableOpacity>
          </View>

          {/* رابط تسجيل الدخول */}
          <TouchableOpacity 
            onPress={() => router.replace('/(auth)/login')}
            style={styles.loginLink}
          >
            <Text style={styles.linkText}>
              لديك حساب بالفعل؟ <Text style={styles.signInLink}>سجل الدخول</Text>
            </Text>
          </TouchableOpacity>

          {/* قسم الفوائد */}
          <BenefitsSection />
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
    paddingVertical: 20 
  },
  
  // الهيدر
  header: { 
    alignItems: 'center', 
    marginBottom: 30 
  },
  logoContainer: {
    width: 64,
    height: 64,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: COLORS.darkGray, 
    marginBottom: 8 
  },
  subtitle: { 
    fontSize: 16, 
    color: COLORS.gray, 
    textAlign: 'center' 
  },

  // التبويبات
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.lightGray,
    borderRadius: 16,
    padding: 4,
    marginBottom: 25,
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
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
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
    borderColor: COLORS.lightGray,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  inputContainerError: {
    borderColor: COLORS.error,
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

  // شروط الاستخدام
  termsContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.gray,
    marginLeft: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
    textAlign: 'right',
  },
  termsLink: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  // زر التسجيل
  button: { 
    flexDirection: 'row-reverse',
    backgroundColor: COLORS.primary, 
    paddingVertical: 16, 
    borderRadius: 16, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginBottom: 20, 
    shadowColor: COLORS.primary,
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
    fontWeight: 'bold' 
  },
  buttonIcon: {
    marginRight: 8,
  },

  // رابط تسجيل الدخول
  loginLink: {
    alignItems: 'center',
    marginBottom: 30,
  },
  linkText: { 
    color: COLORS.gray, 
    textAlign: 'center', 
    fontSize: 15 
  },
  signInLink: { 
    color: COLORS.primary, 
    fontWeight: 'bold' 
  },

  // قسم الفوائد
  benefitsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginBottom: 16,
    textAlign: 'right',
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  benefitIcon: {
    width: 24,
    height: 24,
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.darkGray,
    textAlign: 'right',
  },

  // مؤشر قوة كلمة المرور
  validationContainer: {
    paddingHorizontal: 12,
    marginTop: 10,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    paddingVertical: 8,
  },
  validationItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginVertical: 2,
  },
  validationText: {
    fontSize: 12,
    color: COLORS.gray,
    marginRight: 8,
  },
  validationTextValid: {
    color: COLORS.success,
  },

  // رسائل الخطأ
  errorContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 4,
    gap: 4,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    textAlign: 'right',
  },
});