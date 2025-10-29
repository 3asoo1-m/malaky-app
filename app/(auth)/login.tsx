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
  useAnimatedProps,
  withSpring,
  runOnJS
} from 'react-native-reanimated';
import { 
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  Crown,
  LogIn,
  Sparkles,
  Star,
  ChevronRight
} from 'lucide-react-native';
import Svg, { Circle, Rect } from 'react-native-svg';

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
  background: '#FFF5F5',
  border: '#E5E7EB',
  blueBackground: '#F0F4FF',
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ✅ تعريف أنواع البيانات
type AuthMethod = 'phone' | 'email';

// ✅ مكون الخلفية المتحركة
const AnimatedBackground = () => {
  const scale1 = useSharedValue(1);
  const scale2 = useSharedValue(1);
  const scale3 = useSharedValue(1);
  const opacity1 = useSharedValue(0.1);
  const opacity2 = useSharedValue(0.1);
  const opacity3 = useSharedValue(0.05);

  const floatAnimation = useSharedValue(0);

  React.useEffect(() => {
    // تحريك الدوائر الخلفية
    scale1.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 4000 }),
        withTiming(1, { duration: 4000 })
      ),
      -1,
      true
    );

    scale2.value = withRepeat(
      withSequence(
        withDelay(1000, withTiming(1.3, { duration: 5000 })),
        withTiming(1, { duration: 5000 })
      ),
      -1,
      true
    );

    scale3.value = withRepeat(
      withSequence(
        withDelay(2000, withTiming(1.1, { duration: 3500 })),
        withTiming(1, { duration: 3500 })
      ),
      -1,
      true
    );

    opacity1.value = withRepeat(
      withSequence(
        withTiming(0.15, { duration: 4000 }),
        withTiming(0.1, { duration: 4000 })
      ),
      -1,
      true
    );

    opacity2.value = withRepeat(
      withSequence(
        withDelay(1000, withTiming(0.15, { duration: 5000 })),
        withTiming(0.1, { duration: 5000 })
      ),
      -1,
      true
    );

    opacity3.value = withRepeat(
      withSequence(
        withDelay(2000, withTiming(0.1, { duration: 3500 })),
        withTiming(0.05, { duration: 3500 })
      ),
      -1,
      true
    );

    // تحريك الأشكال العائمة
    floatAnimation.value = withRepeat(
      withTiming(1, { duration: 6000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const circle1Style = useAnimatedStyle(() => ({
    transform: [{ scale: scale1.value }],
    opacity: opacity1.value,
  }));

  const circle2Style = useAnimatedStyle(() => ({
    transform: [{ scale: scale2.value }],
    opacity: opacity2.value,
  }));

  const circle3Style = useAnimatedStyle(() => ({
    transform: [{ scale: scale3.value }],
    opacity: opacity3.value,
  }));

  const floatingShape1Style = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(floatAnimation.value, [0, 1], [0, -20]) },
      { rotate: interpolate(floatAnimation.value, [0, 1], [0, 5]) + 'deg' }
    ],
  }));

  const floatingShape2Style = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(floatAnimation.value, [0, 1], [0, -20]) },
    ],
  }));

  const floatingShape3Style = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(floatAnimation.value, [0, 1], [0, -20]) },
    ],
  }));

  return (
    <View style={styles.backgroundContainer}>
      {/* Red Circle - Top Right */}
      <Animated.View style={[styles.circle, styles.circleRed, circle1Style]} />
      
      {/* Blue Circle - Bottom Left */}
      <Animated.View style={[styles.circle, styles.circleBlue, circle2Style]} />
      
      {/* Yellow Circle - Middle */}
      <Animated.View style={[styles.circle, styles.circleYellow, circle3Style]} />

      {/* Floating Shapes */}
      <Animated.View style={[styles.floatingShape, styles.floatingShape1, floatingShape1Style]} />
      <Animated.View style={[styles.floatingShape, styles.floatingShape2, floatingShape2Style]} />
      <Animated.View style={[styles.floatingShape, styles.floatingShape3, floatingShape3Style]} />
    </View>
  );
};

// ✅ مكون الشعار المتحرك
const AnimatedLogo = () => {
  const scale = useSharedValue(0);
  const rotate = useSharedValue(-180);
  const sparkleRotate = useSharedValue(0);
  const starRotate = useSharedValue(0);
  const sparkleScale = useSharedValue(1);
  const starScale = useSharedValue(1);

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

    sparkleScale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 2000 }),
        withTiming(1, { duration: 2000 })
      ),
      -1,
      true
    );

    starScale.value = withRepeat(
      withSequence(
        withDelay(500, withTiming(1.2, { duration: 2500 })),
        withTiming(1, { duration: 2500 })
      ),
      -1,
      true
    );
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: rotate.value + 'deg' }],
  }));

  const sparkleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: sparkleRotate.value + 'deg' }, { scale: sparkleScale.value }],
  }));

  const starStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: starRotate.value + 'deg' }, { scale: starScale.value }],
  }));

  return (
    <Animated.View style={[styles.logoContainer, logoStyle]}>
      <Image 
        source={require('@/assets/images/malakylogo.png')} 
        style={styles.logoImage} 
      />
      
      {/* Sparkle decoration */}
      <Animated.View style={[styles.sparkleDecoration, styles.sparkleTopRight, sparkleStyle]}>
        <Sparkles size={24} color={COLORS.yellow} fill={COLORS.yellow} />
      </Animated.View>
      
      {/* Star decoration */}
      <Animated.View style={[styles.sparkleDecoration, styles.starBottomLeft, starStyle]}>
        <Star size={20} color={COLORS.emailPrimary} fill={COLORS.emailPrimary} />
      </Animated.View>
    </Animated.View>
  );
};

// ✅ مكون الزر المتحرك
const AnimatedButton = ({ 
  children, 
  onPress, 
  colors, 
  disabled = false 
}: { 
  children: React.ReactNode; 
  onPress: () => void; 
  colors: { primary: string; secondary: string };
  disabled?: boolean;
}) => {
  const scale = useSharedValue(1);
  const pressProgress = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(pressProgress.value, [0, 1], [-200, 200]) }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Animated.View style={[styles.animatedButton, { backgroundColor: colors.primary }, animatedStyle]}>
        <Animated.View 
          style={[
            styles.buttonShimmer, 
            { backgroundColor: 'rgba(255,255,255,0.2)' },
            shimmerStyle
          ]} 
        />
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

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

  // ✅ الحصول على الألوان الحالية بناءً على طريقة المصادقة
  const getCurrentColors = () => {
    return authMethod === 'email' 
      ? { primary: COLORS.emailPrimary, secondary: COLORS.emailSecondary }
      : { primary: COLORS.phonePrimary, secondary: COLORS.phoneSecondary };
  };

  const colors = getCurrentColors();

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
    return (
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            authMethod === 'email' && [styles.tabButtonActive, { backgroundColor: COLORS.emailPrimary }]
          ]}
          onPress={() => setAuthMethod('email')}
        >
          <Mail size={20} color={authMethod === 'email' ? COLORS.white : COLORS.gray} />
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
            authMethod === 'phone' && [styles.tabButtonActive, { backgroundColor: COLORS.phonePrimary }]
          ]}
          onPress={() => setAuthMethod('phone')}
        >
          <Phone size={20} color={authMethod === 'phone' ? COLORS.white : COLORS.gray} />
          <Text style={[
            styles.tabText,
            authMethod === 'phone' && styles.tabTextActive
          ]}>
            رقم الجوال
          </Text>
        </TouchableOpacity>
      </View>
    );
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
              <Text style={styles.title}>مرحباً بك!</Text>
              <Text style={styles.subtitle}>سجل دخولك للاستمتاع بالذ الوجبات الملكية !</Text>
            </View>

            {/* الشارات الإحصائية */}
            <View style={styles.badgesContainer}>
              <AnimatedBadge delay={200}>
                <Star size={12} color={COLORS.yellow} fill={COLORS.yellow} />
                <Text style={styles.badgeText}>نكهة أبدية</Text>
              </AnimatedBadge>
              <AnimatedBadge>
                <Crown size={12} color={COLORS.emailPrimary} />
                <Text style={styles.badgeText}>جودة ملكية</Text>
              </AnimatedBadge>
              
            </View>
          </View>

          {/* بطاقة تسجيل الدخول */}
          <Animated.View style={styles.loginCard}>
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
                    <Phone size={20} color={errorText ? colors.primary : COLORS.gray} style={styles.inputIcon} />
                    <TextInput
                      ref={phoneRef}
                      style={styles.inputField}
                      placeholder="05X XXX XXXX"
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
                    <Mail size={20} color={errorText ? colors.primary : COLORS.gray} style={styles.inputIcon} />
                    <TextInput
                      ref={emailRef}
                      style={styles.inputField}
                      placeholder="example@email.com"
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
                  <Lock size={20} color={errorText ? colors.primary : COLORS.gray} style={styles.inputIcon} />
                  <TextInput
                    ref={passwordRef}
                    style={styles.inputField}
                    placeholder="••••••••"
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
                    {isPasswordVisible ? 
                      <EyeOff size={20} color={COLORS.gray} /> : 
                      <Eye size={20} color={COLORS.gray} />
                    }
                  </TouchableOpacity>
                </View>
              </View>

              {/* رسالة الخطأ */}
              {errorText && (
                <View style={styles.errorContainer}>
                  <Text style={[styles.errorText, { color: colors.primary }]}>{errorText}</Text>
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
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                  <Text style={styles.rememberMeText}>تذكرني</Text>
                </TouchableOpacity>

                <TouchableOpacity>
                  <View style={styles.forgotPasswordContainer}>
                    <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>
                      نسيت كلمة المرور؟
                    </Text>
                    <ChevronRight size={12} color={colors.primary} />
                  </View>
                </TouchableOpacity>
              </View>

              {/* زر تسجيل الدخول */}
              <AnimatedButton 
                onPress={handleLogin} 
                colors={colors}
                disabled={loading}
              >
                <LogIn size={20} color={COLORS.white} />
                <Text style={styles.buttonText}>
                  {loading ? 'جاري التسجيل...' : 'تسجيل الدخول'}
                </Text>
              </AnimatedButton>
            </View>

            {/* الفاصل */}
            <View style={styles.separatorContainer}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>أو تسجيل الدخول عبر</Text>
              <View style={styles.separatorLine} />
            </View>

            {/* تسجيل الدخول الاجتماعي */}
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

            {/* رابط إنشاء حساب */}
            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>
                ليس لديك حساب؟{' '}
              </Text>
              <TouchableOpacity onPress={() => router.replace('/(auth)/register')}>
                <View style={styles.signupLinkContainer}>
                  <Text style={[styles.signupLink, { color: colors.primary }]}>
                    إنشاء حساب جديد
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
              <Text style={styles.footerText}>دجاج بروستد بجودة ملكية</Text>
            </View>
            
            <View style={styles.footerBadge}>
              <Sparkles size={12} color={COLORS.yellow} />
              <Text style={styles.footerBadgeText}>طعم لا يُنسى منذ سنوات</Text>
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
    justifyContent: 'center',
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
    opacity: 0.1,
  },
  circleRed: {
    width: 384,
    height: 384,
    backgroundColor: COLORS.emailPrimary,
    top: -80,
    right: -80,
  },
  circleBlue: {
    width: 384,
    height: 384,
    backgroundColor: COLORS.phonePrimary,
    bottom: -128,
    left: -128,
  },
  circleYellow: {
    width: 384,
    height: 384,
    backgroundColor: COLORS.yellow,
    top: '50%',
    left: '50%',
    marginLeft: -192,
    marginTop: -192,
  },
  floatingShape: {
    position: 'absolute',
  },
  floatingShape1: {
    width: 64,
    height: 64,
    borderWidth: 4,
    borderColor: 'rgba(227, 30, 36, 0.2)',
    borderRadius: 16,
    top: 80,
    right: 160,
  },
  floatingShape2: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(45, 74, 158, 0.1)',
    borderRadius: 24,
    bottom: 128,
    left: 128,
  },
  floatingShape3: {
    width: 32,
    height: 32,
    backgroundColor: 'rgba(253, 185, 19, 0.2)',
    borderRadius: 8,
    top: 160,
    left: 80,
    transform: [{ rotate: '45deg' }],
  },

  // الهيدر
  header: { 
    alignItems: 'center', 
    marginBottom: 30 
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

  // بطاقة تسجيل الدخول
  loginCard: {
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
    overflow: 'hidden',
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
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  errorText: {
    fontSize: 14,
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
  checkmark: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  rememberMeText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  forgotPasswordContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // زر تسجيل الدخول
  animatedButton: {
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
    overflow: 'hidden',
    gap: 8,
  },
  buttonText: { 
    color: COLORS.white, 
    fontSize: 18, 
    fontWeight: 'bold',
  },
  buttonShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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

  // رابط إنشاء حساب
  signupContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 4,
  },
  signupText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  signupLinkContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 2,
  },
  signupLink: {
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