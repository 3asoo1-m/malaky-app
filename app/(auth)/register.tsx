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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  withDelay,
  Easing,
  interpolate,
  withSpring
} from 'react-native-reanimated';
import { 
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  Crown,
  UserPlus,
  Sparkles,
  Star,
  ChevronRight,
  User,
  Check,
  Gift,
  Utensils
} from 'lucide-react-native';

// الألوان المستوحاة من التصميم الجديد
const COLORS = {
  emailPrimary: '#E31E24',
  emailSecondary: '#c91920',
  phonePrimary: '#2D4A9E',
  phoneSecondary: '#1e3a7a',
  yellow: '#FDB913',
  white: '#FFFFFF',
  lightGray: '#F5F5F5',
  gray: '#6B7280',
  darkGray: '#374151',
  background: '#F8FAFC',
  border: '#E5E7EB',
  success: '#22C55E',
  error: '#EF4444',
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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

// ✅ مكون الخلفية المتحركة
const AnimatedBackground = () => {
  const scale1 = useSharedValue(1);
  const scale2 = useSharedValue(1);
  const scale3 = useSharedValue(1);

  React.useEffect(() => {
    scale1.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 4000 }),
        withTiming(1, { duration: 4000 })
      ),
      -1,
      true
    );

    scale2.value = withRepeat(
      withSequence(
        withDelay(1000, withTiming(1.2, { duration: 5000 })),
        withTiming(1, { duration: 5000 })
      ),
      -1,
      true
    );

    scale3.value = withRepeat(
      withSequence(
        withDelay(2000, withTiming(1.05, { duration: 3500 })),
        withTiming(1, { duration: 3500 })
      ),
      -1,
      true
    );
  }, []);

  const circle1Style = useAnimatedStyle(() => ({
    transform: [{ scale: scale1.value }],
    opacity: 0.03,
  }));

  const circle2Style = useAnimatedStyle(() => ({
    transform: [{ scale: scale2.value }],
    opacity: 0.03,
  }));

  const circle3Style = useAnimatedStyle(() => ({
    transform: [{ scale: scale3.value }],
    opacity: 0.02,
  }));

  return (
    <View style={styles.backgroundContainer}>
      <Animated.View style={[styles.circle, styles.circleRed, circle1Style]} />
      <Animated.View style={[styles.circle, styles.circleBlue, circle2Style]} />
      <Animated.View style={[styles.circle, styles.circleYellow, circle3Style]} />
    </View>
  );
};

// ✅ مكون الشعار المتحرك
const AnimatedLogo = () => {
  const scale = useSharedValue(0);
  const rotate = useSharedValue(-180);
  const sparkleRotate = useSharedValue(0);
  const starRotate = useSharedValue(0);

  React.useEffect(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 120 });
    rotate.value = withSpring(0, { damping: 15, stiffness: 120 });
    
    sparkleRotate.value = withRepeat(
      withTiming(360, { duration: 20000, easing: Easing.linear }),
      -1,
      false
    );
    
    starRotate.value = withRepeat(
      withTiming(-360, { duration: 15000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: rotate.value + 'deg' }],
  }));

  const sparkleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: sparkleRotate.value + 'deg' }],
  }));

  const starStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: starRotate.value + 'deg' }],
  }));

  return (
    <Animated.View style={[styles.logoContainer, logoStyle]}>
      <Image 
        source={require('@/assets/images/malakylogo.png')} 
        style={styles.logoImage} 
      />
      
      <Animated.View style={[styles.sparkleDecoration, styles.sparkleTopRight, sparkleStyle]}>
        <Sparkles size={24} color={COLORS.yellow} fill={COLORS.yellow} />
      </Animated.View>
      
      <Animated.View style={[styles.sparkleDecoration, styles.starBottomLeft, starStyle]}>
        <Star size={20} color={COLORS.emailPrimary} fill={COLORS.emailPrimary} />
      </Animated.View>
    </Animated.View>
  );
};

// ✅ مكون مؤشر قوة كلمة المرور
const PasswordStrengthIndicator = ({ password }: { password: string }) => {
  const calculatePasswordStrength = () => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const getStrengthColor = () => {
    const strength = calculatePasswordStrength();
    if (strength <= 1) return COLORS.error;
    if (strength === 2) return COLORS.yellow;
    if (strength === 3) return COLORS.phonePrimary;
    return COLORS.success;
  };

  const getStrengthText = () => {
    const strength = calculatePasswordStrength();
    if (strength <= 1) return 'ضعيفة';
    if (strength === 2) return 'متوسطة';
    if (strength === 3) return 'جيدة';
    return 'قوية';
  };

  const strength = calculatePasswordStrength();

  return (
    <View style={styles.passwordStrengthContainer}>
      <View style={styles.strengthBars}>
        {[1, 2, 3, 4].map((level) => (
          <View
            key={level}
            style={[
              styles.strengthBar,
              {
                backgroundColor: level <= strength ? getStrengthColor() : COLORS.lightGray,
              },
            ]}
          />
        ))}
      </View>
      <Text style={styles.strengthText}>قوة كلمة المرور: {getStrengthText()}</Text>
    </View>
  );
};

// ✅ مكون التبويبات
const AuthTabs = ({ activeTab, onTabChange }: { activeTab: AuthMethod; onTabChange: (tab: AuthMethod) => void }) => {
  const getTabColors = () => {
    return activeTab === 'email' 
      ? { primary: COLORS.emailPrimary, secondary: COLORS.emailSecondary }
      : { primary: COLORS.phonePrimary, secondary: COLORS.phoneSecondary };
  };

  const colors = getTabColors();

  return (
    <View style={styles.tabsContainer}>
      <TouchableOpacity
        style={[
          styles.tabButton,
          activeTab === 'email' && [styles.tabButtonActive, { backgroundColor: colors.primary }]
        ]}
        onPress={() => onTabChange('email')}
      >
        <Mail size={20} color={activeTab === 'email' ? COLORS.white : COLORS.gray} />
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
          activeTab === 'phone' && [styles.tabButtonActive, { backgroundColor: colors.primary }]
        ]}
        onPress={() => onTabChange('phone')}
      >
        <Phone size={20} color={activeTab === 'phone' ? COLORS.white : COLORS.gray} />
        <Text style={[
          styles.tabText,
          activeTab === 'phone' && styles.tabTextActive
        ]}>
          رقم الجوال
        </Text>
      </TouchableOpacity>
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
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [newsletter, setNewsletter] = useState(true);

  // ✅ المراجع
  const scrollViewRef = useRef<ScrollView>(null);
  const firstNameRef = useRef<TextInput>(null);
  const lastNameRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  // ✅ الحصول على الألوان الحالية بناءً على طريقة المصادقة
  const getCurrentColors = () => {
    return authMethod === 'email' 
      ? { primary: COLORS.emailPrimary, secondary: COLORS.emailSecondary }
      : { primary: COLORS.phonePrimary, secondary: COLORS.phoneSecondary };
  };

  const colors = getCurrentColors();

  // ✅ دوال التحقق من الصحة
  const validatePassword = (pass: string) => {
    const minLength = pass.length >= 8;
    const hasUpper = /[A-Z]/.test(pass);
    const hasLower = /[a-z]/.test(pass);
    const hasSymbol = /[!@#$%^&*(),.?":{}_|<>]/.test(pass);

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
    switch (field) {
      case 'firstName': setFirstName(value); break;
      case 'lastName': setLastName(value); break;
      case 'email': setEmail(value); break;
      case 'phone': setPhoneNumber(value); break;
      case 'password': setPassword(value); break;
      case 'confirmPassword': setConfirmPassword(value); break;
    }

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
    setEmail('');
    setPhoneNumber('05');
    setFormErrors({});
  };

  // ✅ التحقق النهائي من النموذج
  const validateForm = (): boolean => {
    if (!agreeToTerms) {
      Alert.alert('خطأ', 'الرجاء الموافقة على الشروط والأحكام');
      return false;
    }

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
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          full_name: `${firstName.trim()} ${lastName.trim()}`,
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

  // ✅ مكون الشارات المتحركة
  const AnimatedBadge = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
    const opacity = useSharedValue(0);
    const scale = useSharedValue(0.8);

    React.useEffect(() => {
      opacity.value = withDelay(delay, withSpring(1));
      scale.value = withDelay(delay, withSpring(1));
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    }));

    return (
      <Animated.View style={[styles.badge, animatedStyle]}>
        {children}
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} translucent />
      
      {/* الخلفية المتحركة */}
      <AnimatedBackground />

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
            <AnimatedLogo />
            
            <View style={styles.titleContainer}>
              <Text style={styles.title}>انضم إلى عائلة ملكي!</Text>
              <Text style={styles.subtitle}>سجل الآن واستمتع بعروض حصرية وخدمة ملكية</Text>
            </View>

            {/* شارات الفوائد */}
            <View style={styles.badgesContainer}>
              <AnimatedBadge>
                <Gift size={12} color={COLORS.emailPrimary} />
                <Text style={styles.badgeText}>خصم الانضمام</Text>
              </AnimatedBadge>
              
              <AnimatedBadge delay={200}>
                <Utensils size={12} color={COLORS.phonePrimary} />
                <Text style={styles.badgeText}>توصيل مجاني</Text>
              </AnimatedBadge>
              
              <AnimatedBadge delay={400}>
                <Star size={12} color={COLORS.yellow} fill={COLORS.yellow} />
                <Text style={styles.badgeText}>نقاط ولاء</Text>
              </AnimatedBadge>
            </View>
          </View>

          {/* بطاقة التسجيل */}
          <Animated.View style={styles.registerCard}>
            {/* التبويبات */}
            <AuthTabs activeTab={authMethod} onTabChange={switchAuthMethod} />

            {/* النموذج */}
            <View style={styles.formContainer}>
              {/* حقل الاسم الأول واسم العائلة */}
              <View style={styles.nameContainer}>
                <View style={styles.nameInputWrapper}>
                  <View style={[
                    styles.inputContainer,
                    formErrors.firstName && styles.inputContainerError
                  ]}>
                    <User size={20} color={formErrors.firstName ? COLORS.error : COLORS.gray} style={styles.inputIcon} />
                    <TextInput
                      ref={firstNameRef}
                      style={styles.inputField}
                      placeholder="الاسم الأول"
                      value={firstName}
                      onChangeText={(value) => handleFieldChange('firstName', value)}
                      onBlur={() => handleFieldBlur('firstName')}
                      placeholderTextColor={COLORS.gray}
                      onFocus={() => handleFocus(firstNameRef)}
                      returnKeyType="next"
                      onSubmitEditing={() => lastNameRef.current?.focus()}
                    />
                  </View>
                  {formErrors.firstName && (
                    <Text style={styles.errorText}>{formErrors.firstName}</Text>
                  )}
                </View>

                <View style={styles.nameInputWrapper}>
                  <View style={[
                    styles.inputContainer,
                    formErrors.lastName && styles.inputContainerError
                  ]}>
                    <User size={20} color={formErrors.lastName ? COLORS.error : COLORS.gray} style={styles.inputIcon} />
                    <TextInput
                      ref={lastNameRef}
                      style={styles.inputField}
                      placeholder="اسم العائلة"
                      value={lastName}
                      onChangeText={(value) => handleFieldChange('lastName', value)}
                      onBlur={() => handleFieldBlur('lastName')}
                      placeholderTextColor={COLORS.gray}
                      onFocus={() => handleFocus(lastNameRef)}
                      returnKeyType="next"
                      onSubmitEditing={() => authMethod === 'phone' ? phoneRef.current?.focus() : emailRef.current?.focus()}
                    />
                  </View>
                  {formErrors.lastName && (
                    <Text style={styles.errorText}>{formErrors.lastName}</Text>
                  )}
                </View>
              </View>

              {/* حقل الهاتف أو البريد */}
              {authMethod === 'phone' ? (
                <View style={styles.inputWrapper}>
                  <View style={[
                    styles.inputContainer,
                    formErrors.phone && styles.inputContainerError
                  ]}>
                    <Phone size={20} color={formErrors.phone ? COLORS.error : COLORS.gray} style={styles.inputIcon} />
                    <TextInput
                      ref={phoneRef}
                      style={styles.inputField}
                      placeholder="05X XXX XXXX"
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
                  {formErrors.phone && (
                    <Text style={styles.errorText}>{formErrors.phone}</Text>
                  )}
                </View>
              ) : (
                <View style={styles.inputWrapper}>
                  <View style={[
                    styles.inputContainer,
                    formErrors.email && styles.inputContainerError
                  ]}>
                    <Mail size={20} color={formErrors.email ? COLORS.error : COLORS.gray} style={styles.inputIcon} />
                    <TextInput
                      ref={emailRef}
                      style={styles.inputField}
                      placeholder="example@email.com"
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
                  {formErrors.email && (
                    <Text style={styles.errorText}>{formErrors.email}</Text>
                  )}
                </View>
              )}

              {/* حقل كلمة المرور */}
              <View style={styles.inputWrapper}>
                <View style={[
                  styles.inputContainer,
                  formErrors.password && styles.inputContainerError
                ]}>
                  <Lock size={20} color={formErrors.password ? COLORS.error : COLORS.gray} style={styles.inputIcon} />
                  <TextInput
                    ref={passwordRef}
                    style={styles.inputField}
                    placeholder="••••••••"
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
                    {isPasswordVisible ? 
                      <EyeOff size={20} color={COLORS.gray} /> : 
                      <Eye size={20} color={COLORS.gray} />
                    }
                  </TouchableOpacity>
                </View>
                {formErrors.password && (
                  <Text style={styles.errorText}>{formErrors.password}</Text>
                )}
                
                {password.length > 0 && (
                  <PasswordStrengthIndicator password={password} />
                )}
              </View>

              {/* حقل تأكيد كلمة المرور */}
              <View style={styles.inputWrapper}>
                <View style={[
                  styles.inputContainer,
                  formErrors.confirmPassword && styles.inputContainerError
                ]}>
                  <Lock size={20} color={formErrors.confirmPassword ? COLORS.error : COLORS.gray} style={styles.inputIcon} />
                  <TextInput
                    ref={confirmPasswordRef}
                    style={styles.inputField}
                    placeholder="••••••••"
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
                    {isConfirmPasswordVisible ? 
                      <EyeOff size={20} color={COLORS.gray} /> : 
                      <Eye size={20} color={COLORS.gray} />
                    }
                  </TouchableOpacity>
                </View>
                {formErrors.confirmPassword && (
                  <Text style={styles.errorText}>{formErrors.confirmPassword}</Text>
                )}
                
                {/* مؤشر تطابق كلمة المرور */}
                {confirmPassword.length > 0 && password.length > 0 && (
                  <View style={styles.passwordMatchContainer}>
                    {password === confirmPassword ? (
                      <View style={styles.passwordMatch}>
                        <Check size={16} color={COLORS.success} />
                        <Text style={[styles.passwordMatchText, { color: COLORS.success }]}>
                          كلمات المرور متطابقة
                        </Text>
                      </View>
                    ) : (
                      <Text style={[styles.passwordMatchText, { color: COLORS.error }]}>
                        كلمات المرور غير متطابقة
                      </Text>
                    )}
                  </View>
                )}
              </View>

              {/* الشروط والأحكام */}
              <View style={styles.termsContainer}>
                <TouchableOpacity 
                  style={styles.checkboxContainer}
                  onPress={() => setAgreeToTerms(!agreeToTerms)}
                >
                  <View style={[
                    styles.checkbox,
                    agreeToTerms && [styles.checkboxChecked, { backgroundColor: colors.primary }]
                  ]}>
                    {agreeToTerms && (
                      <Check size={14} color={COLORS.white} />
                    )}
                  </View>
                  <Text style={styles.termsText}>
                    أوافق على{' '}
                    <Text style={[styles.termsLink, { color: colors.primary }]}>الشروط والأحكام</Text>
                    {' '}و{' '}
                    <Text style={[styles.termsLink, { color: colors.primary }]}>سياسة الخصوصية</Text>
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.checkboxContainer}
                  onPress={() => setNewsletter(!newsletter)}
                >
                  <View style={[
                    styles.checkbox,
                    newsletter && [styles.checkboxChecked, { backgroundColor: colors.primary }]
                  ]}>
                    {newsletter && (
                      <Check size={14} color={COLORS.white} />
                    )}
                  </View>
                  <Text style={styles.termsText}>
                    أرغب في استلام العروض الحصرية والأخبار عبر البريد الإلكتروني
                  </Text>
                </TouchableOpacity>
              </View>

              {/* زر إنشاء الحساب */}
              <TouchableOpacity 
                style={[
                  styles.button, 
                  { backgroundColor: colors.primary },
                  loading && styles.buttonDisabled
                ]} 
                onPress={handleRegister} 
                disabled={loading}
              >
                <UserPlus size={20} color={COLORS.white} />
                <Text style={styles.buttonText}>
                  {loading ? 'جاري الإنشاء...' : 'إنشاء حساب جديد'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* الفاصل */}
            <View style={styles.separatorContainer}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>أو التسجيل عبر</Text>
              <View style={styles.separatorLine} />
            </View>

            {/* التسجيل الاجتماعي */}
            <View style={styles.socialContainer}>
              <TouchableOpacity style={styles.socialButton}>
                {/* أيقونة Google */}
                <View style={styles.googleIcon}>
                  <Text style={styles.googleIconText}>G</Text>
                </View>
                <Text style={styles.socialText}>Google</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.socialButton}>
                {/* أيقونة Facebook */}
                <View style={styles.facebookIcon}>
                  <Text style={styles.facebookIconText}>f</Text>
                </View>
                <Text style={styles.socialText}>Facebook</Text>
              </TouchableOpacity>
            </View>

            {/* رابط تسجيل الدخول */}
            <View style={styles.loginLinkContainer}>
              <Text style={styles.loginText}>
                لديك حساب بالفعل؟{' '}
              </Text>
              <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
                <View style={styles.loginLink}>
                  <Text style={[styles.loginLinkText, { color: colors.primary }]}>
                    تسجيل الدخول
                  </Text>
                  <ChevronRight size={12} color={colors.primary} />
                </View>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* التذييل */}
          <View style={styles.footer}>
            <View style={styles.footerRow}>
              <Crown size={16} color={COLORS.emailPrimary} />
              <Text style={styles.footerText}>انضم لآلاف العملاء السعداء</Text>
            </View>
            
            <View style={styles.footerBadge}>
              <Sparkles size={12} color={COLORS.yellow} />
              <Text style={styles.footerBadgeText}>عروض حصرية للأعضاء الجدد</Text>
            </View>
            
            <Text style={styles.footerCopyright}>
              © 2025 ملكي بروست تشكن. جميع الحقوق محفوظة
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ✅ التنسيقات
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
    paddingHorizontal: 20, 
    paddingVertical: 20,
  },
  
  // الخلفية المتحركة
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
    borderRadius: 500,
  },
  circleRed: {
    width: 300,
    height: 300,
    backgroundColor: COLORS.emailPrimary,
    top: '10%',
    right: '-10%',
  },
  circleBlue: {
    width: 400,
    height: 400,
    backgroundColor: COLORS.phonePrimary,
    bottom: '-20%',
    left: '-20%',
  },
  circleYellow: {
    width: 200,
    height: 200,
    backgroundColor: COLORS.yellow,
    top: '50%',
    left: '50%',
    marginLeft: -100,
    marginTop: -100,
  },

  // الهيدر
  header: { 
    alignItems: 'center', 
    marginBottom: 24 
  },
  logoContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  logoImage: { 
    width: 96, 
    height: 96, 
    resizeMode: 'contain',
    borderRadius: 48,
  },
  sparkleDecoration: {
    position: 'absolute',
  },
  sparkleTopRight: {
    top: -8,
    right: -8,
  },
  starBottomLeft: {
    bottom: -8,
    left: -8,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 16,
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
  badgesContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    color: COLORS.darkGray,
    fontWeight: '500',
  },

  // بطاقة التسجيل
  registerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },

  // التبويبات
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(243, 244, 246, 0.8)',
    borderRadius: 16,
    padding: 6,
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
    fontSize: 14,
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
  nameContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  nameInputWrapper: {
    flex: 1,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputContainer: { 
    flexDirection: 'row-reverse', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12, 
    paddingHorizontal: 16, 
    height: 56,
    borderWidth: 1,
    borderColor: COLORS.border,
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
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    textAlign: 'right',
    marginTop: 4,
    marginRight: 4,
  },

  // مؤشر قوة كلمة المرور
  passwordStrengthContainer: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 4,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'right',
  },

  // مؤشر تطابق كلمة المرور
  passwordMatchContainer: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  passwordMatch: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  passwordMatchText: {
    fontSize: 12,
    textAlign: 'right',
  },

  // الشروط والأحكام
  termsContainer: {
    marginBottom: 24,
    gap: 12,
  },
  checkboxContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.gray,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    borderColor: 'transparent',
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
    textAlign: 'right',
  },
  termsLink: {
    fontWeight: '600',
  },

  // زر إنشاء الحساب
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
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: { 
    color: COLORS.white, 
    fontSize: 18, 
    fontWeight: 'bold',
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
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    gap: 8,
  },
  socialText: {
    fontSize: 14,
    color: COLORS.darkGray,
    fontWeight: '500',
  },
  googleIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleIconText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  facebookIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#1877F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  facebookIconText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },

  // رابط تسجيل الدخول
  loginLinkContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 4,
  },
  loginText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  loginLink: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 2,
  },
  loginLinkText: {
    fontSize: 14,
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
  footerBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
    marginBottom: 8,
  },
  footerBadgeText: {
    fontSize: 12,
    color: COLORS.darkGray,
    fontWeight: '500',
  },
  footerCopyright: {
    fontSize: 12,
    color: COLORS.gray,
    opacity: 0.7,
  },
});