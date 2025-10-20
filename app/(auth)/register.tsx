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
  Linking 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

// تعريف الألوان المستوحاة من الشعار
const COLORS = {
  primary: '#0033A0',
  secondary: '#E4002B',
  white: '#FFFFFF',
  lightGray: '#F5F5F5',
  gray: '#A9A9A9',
  darkGray: '#333333',
  success: '#22C55E',
  error: '#EF4444',
};

// ✅ تعريف أنواع البيانات
type AuthMethod = 'phone' | 'email';

interface PasswordValidationState {
  minLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasSymbol: boolean;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
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

export default function RegisterScreen() {
  const router = useRouter();
  
  // ✅ حالات التطبيق
  const [authMethod, setAuthMethod] = useState<AuthMethod>('phone');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('+9725');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  const [passwordValidation, setPasswordValidation] = useState<PasswordValidationState>({
    minLength: false,
    hasUpper: false,
    hasLower: false,
    hasSymbol: false,
  });

  // ✅ المراجع
  const scrollViewRef = useRef<ScrollView>(null);
  const firstNameRef = useRef<TextInput>(null);
  const lastNameRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  // ✅ دوال التحقق من الصحة
  const validatePassword = (pass: string) => {
    const minLength = pass.length >= 8;
    const hasUpper = /[A-Z]/.test(pass);
    const hasLower = /[a-z]/.test(pass);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(pass);

    setPasswordValidation({ minLength, hasUpper, hasLower, hasSymbol });
    return minLength && hasUpper && hasLower && hasSymbol;
  };

  const validateField = (field: string, value: string): string => {
    switch (field) {
      case 'firstName':
        if (!value.trim()) return 'الرجاء إدخال الاسم الأول';
        if (value.trim().length < 2) return 'الاسم الأول يجب أن يكون حرفين على الأقل';
        if (!/^[\u0600-\u06FFa-zA-Z\s]+$/.test(value.trim())) return 'الاسم الأول يجب أن يحتوي على حروف فقط';
        return '';

      case 'lastName':
        if (!value.trim()) return 'الرجاء إدخال اسم العائلة';
        if (value.trim().length < 2) return 'اسم العائلة يجب أن يكون حرفين على الأقل';
        if (!/^[\u0600-\u06FFa-zA-Z\s]+$/.test(value.trim())) return 'اسم العائلة يجب أن يحتوي على حروف فقط';
        return '';

      case 'email':
        if (!value.trim()) return 'الرجاء إدخال البريد الإلكتروني';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'الرجاء إدخال بريد إلكتروني صحيح';
        return '';

      case 'phone':
        if (!value.trim()) return 'الرجاء إدخال رقم الهاتف';
        const phoneRegex = /^\+972[5][0-9]{8}$/;
        if (!phoneRegex.test(value)) return 'الرجاء إدخال رقم هاتف فلسطيني صحيح (يبدأ بـ +9725)';
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
      case 'firstName': setFirstName(value); break;
      case 'lastName': setLastName(value); break;
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
      case 'firstName': return firstName;
      case 'lastName': return lastName;
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
    setPhoneNumber('+9725');
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
    const fieldsToValidate = ['firstName', 'lastName', 'password', 'confirmPassword'];
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
      Alert.alert('خطأ', 'الرجاء تصحيح الأخطاء في النموذج');
      return;
    }

    setLoading(true);

    try {
      const credentials = {
        password: password,
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            full_name: `${firstName.trim()} ${lastName.trim()}`,
          },
        },
      };

      let finalCredentials;
      if (authMethod === 'phone') {
        finalCredentials = { ...credentials, phone: phoneNumber };
      } else {
        finalCredentials = { ...credentials, email: email.trim() };
      }

      const { data, error } = await supabase.auth.signUp(finalCredentials);

      if (error) {
        let errorMessage = error.message;
        // تحسين رسائل الخطأ للمستخدم
        if (error.message.includes('already registered')) {
          errorMessage = authMethod === 'email' 
            ? 'هذا البريد الإلكتروني مسجل مسبقاً' 
            : 'رقم الهاتف هذا مسجل مسبقاً';
        }
        Alert.alert('خطأ في إنشاء الحساب', errorMessage);
        return;
      }

      if (data.user) {
        if (authMethod === 'phone') {
          Alert.alert(
            'تم إرسال الرمز', 
            'لقد أرسلنا رمز تحقق إلى رقم هاتفك.',
            [{ text: 'حسناً', onPress: () => {
              router.push({ 
                pathname: '/(auth)/verify-otp', 
                params: { phone: phoneNumber, type: 'signup' } 
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

  // ✅ مكون مبدل طرق التسجيل
  const AuthMethodSwitcher = () => (
    <View style={styles.switcherContainer}>
      <TouchableOpacity
        style={[styles.switcherButton, authMethod === 'phone' && styles.switcherActiveButton]}
        onPress={() => switchAuthMethod('phone')}
      >
        <Ionicons 
          name="call-outline" 
          size={20} 
          color={authMethod === 'phone' ? COLORS.primary : COLORS.gray} 
        />
        <Text style={[styles.switcherText, authMethod === 'phone' && styles.switcherActiveText]}>
          رقم الهاتف
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.switcherButton, authMethod === 'email' && styles.switcherActiveButton]}
        onPress={() => switchAuthMethod('email')}
      >
        <Ionicons 
          name="mail-outline" 
          size={20} 
          color={authMethod === 'email' ? COLORS.primary : COLORS.gray} 
        />
        <Text style={[styles.switcherText, authMethod === 'email' && styles.switcherActiveText]}>
          البريد الإلكتروني
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
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
          <View style={styles.header}>
            <Image source={require('@/assets/images/icon.png')} style={styles.logo} />
          </View>

          <Text style={styles.title}>أنشئ حسابك الآن</Text>
          <Text style={styles.subtitle}>أهلاً بك في عائلة الملكي!</Text>

          <AuthMethodSwitcher />

          {/* ✅ حقول الاسم */}
          <View style={styles.nameContainer}>
            <View style={styles.nameInputWrapper}>
              <TextInput
                ref={lastNameRef}
                style={[
                  styles.nameInput,
                  formErrors.lastName && styles.inputError
                ]}
                placeholder="اسم العائلة"
                value={lastName}
                onChangeText={(value) => handleFieldChange('lastName', value)}
                onBlur={() => handleFieldBlur('lastName')}
                placeholderTextColor={COLORS.gray}
                onFocus={() => handleFocus(lastNameRef)}
                returnKeyType="next"
                onSubmitEditing={() => firstNameRef.current?.focus()}
              />
              <ErrorMessage message={formErrors.lastName} />
            </View>

            <View style={styles.nameInputWrapper}>
              <TextInput
                ref={firstNameRef}
                style={[
                  styles.nameInput,
                  formErrors.firstName && styles.inputError
                ]}
                placeholder="الاسم الأول"
                value={firstName}
                onChangeText={(value) => handleFieldChange('firstName', value)}
                onBlur={() => handleFieldBlur('firstName')}
                placeholderTextColor={COLORS.gray}
                onFocus={() => handleFocus(firstNameRef)}
                returnKeyType="next"
                onSubmitEditing={() => authMethod === 'phone' ? phoneRef.current?.focus() : emailRef.current?.focus()}
              />
              <ErrorMessage message={formErrors.firstName} />
            </View>
          </View>

          {/* ✅ حقل الهاتف أو البريد */}
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
                  placeholder="رقم الهاتف (+9725xxxxxxxx)"
                  value={phoneNumber}
                  onChangeText={(value) => handleFieldChange('phone', value)}
                  onBlur={() => handleFieldBlur('phone')}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  placeholderTextColor={COLORS.gray}
                  onFocus={() => handleFocus(phoneRef)}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
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

          {/* ✅ حقل كلمة المرور */}
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

          {/* ✅ حقل تأكيد كلمة المرور */}
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

          {/* ✅ زر التسجيل */}
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
          </TouchableOpacity>

          {/* ✅ رابط تسجيل الدخول */}
          <TouchableOpacity 
            onPress={() => router.replace('/(auth)/login')}
            style={styles.loginLink}
          >
            <Text style={styles.linkText}>
              لديك حساب بالفعل؟ <Text style={styles.signInLink}>سجل الدخول</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ✅ التنسيقات
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  keyboardAvoidingContainer: { flex: 1 },
  scrollContainer: { 
    flexGrow: 1, 
    justifyContent: 'center', 
    paddingHorizontal: 25, 
    paddingVertical: 20 
  },
  header: { alignItems: 'center', marginBottom: 30 },
  logo: { width: 180, height: 180, resizeMode: 'contain' },
  title: { 
    fontSize: 26, 
    fontWeight: 'bold', 
    color: COLORS.darkGray, 
    textAlign: 'right', 
    marginBottom: 8 
  },
  subtitle: { 
    fontSize: 16, 
    color: COLORS.gray, 
    textAlign: 'right', 
    marginBottom: 20 
  },

  // مبدل طرق التسجيل
  switcherContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.lightGray,
    borderRadius: 30,
    padding: 4,
    marginBottom: 25,
  },
  switcherButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  switcherActiveButton: {
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  switcherText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gray,
  },
  switcherActiveText: {
    color: COLORS.primary,
  },

  // حقول الإدخال
  nameContainer: { 
    flexDirection: 'row-reverse', 
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  nameInputWrapper: {
    width: '48%',
  },
  nameInput: { 
    width: '100%', 
    backgroundColor: COLORS.lightGray, 
    borderRadius: 10, 
    paddingHorizontal: 15, 
    height: 55, 
    fontSize: 16, 
    textAlign: 'right', 
    marginBottom: 5, 
    color: COLORS.darkGray 
  },
  inputWrapper: {
    marginBottom: 15,
  },
  inputContainer: { 
    flexDirection: 'row-reverse', 
    alignItems: 'center', 
    backgroundColor: COLORS.lightGray, 
    borderRadius: 10, 
    paddingHorizontal: 15, 
    height: 55 
  },
  inputContainerError: {
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  inputError: {
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  inputIcon: { marginLeft: 10 },
  inputField: { 
    flex: 1, 
    fontSize: 16, 
    textAlign: 'right', 
    color: COLORS.darkGray 
  },
  visibilityButton: {
    padding: 5,
  },

  // مؤشر قوة كلمة المرور
  validationContainer: {
    paddingHorizontal: 10,
    marginTop: 10,
    backgroundColor: 'rgba(245, 245, 245, 0.8)',
    borderRadius: 8,
    paddingVertical: 8,
  },
  validationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  validationText: {
    fontSize: 12,
    color: COLORS.gray,
    marginLeft: 8,
  },
  validationTextValid: {
    color: COLORS.success,
  },

  // رسائل الخطأ
  errorContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginTop: 5,
    paddingHorizontal: 5,
    gap: 4,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    textAlign: 'right',
  },

  // الأزرار والروابط
  button: { 
    backgroundColor: COLORS.primary, 
    paddingVertical: 15, 
    borderRadius: 10, 
    alignItems: 'center', 
    marginTop: 10, 
    marginBottom: 20, 
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8 
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: { 
    color: COLORS.white, 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  loginLink: {
    alignItems: 'center',
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
});