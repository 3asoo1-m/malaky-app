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
  ChevronRight,
  Hamburger,
  Pizza,
  Ham,
  Drumstick,
  Donut,
  CupSoda,
  LogOut,
  ChevronLeft,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';


// استيراد ionicons
import { Ionicons } from '@expo/vector-icons';

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

// ✅ تعريف أنواع الأيقونات المختلطة
const FOOD_ICONS = [
  // أيقونات Lucide
  { type: 'lucide', component: Hamburger, name: 'hamburger' },
  { type: 'lucide', component: Pizza, name: 'pizza' },
  { type: 'lucide', component: Ham, name: 'ham' },
  { type: 'lucide', component: Drumstick, name: 'drumstick' },
  { type: 'lucide', component: Donut, name: 'donut' },
  { type: 'lucide', component: CupSoda, name: 'cup-soda' },
  
  // أيقونات Ionicons
  { type: 'ionicon', component: 'fast-food', name: 'fast-food' },
  { type: 'ionicon', component: 'ice-cream', name: 'ice-cream' },
  { type: 'ionicon', component: 'cafe', name: 'cafe' },
  { type: 'ionicon', component: 'wine', name: 'wine' },
  { type: 'ionicon', component: 'fish', name: 'fish' },
  { type: 'ionicon', component: 'nutrition', name: 'nutrition' },
  { type: 'ionicon', component: 'restaurant', name: 'restaurant' },
  { type: 'ionicon', component: 'pizza', name: 'pizza-ionicon' },
  { type: 'ionicon', component: 'beer', name: 'beer' },
  { type: 'ionicon', component: 'water', name: 'water' },
];

// ✅ تعريف أنواع البيانات
type AuthMethod = 'phone' | 'email';

// ✅ مكون أيقونة الطعام العائمة المحسنة
const FloatingFoodIcon = ({ 
  icon, 
  size, 
  delay, 
  duration, 
  startX 
}: { 
  icon: any;
  size: number;
  delay: number;
  duration: number;
  startX: number;
}) => {
  const translateY = useSharedValue(-size);
  const opacity = useSharedValue(0);
  const rotate = useSharedValue(Math.random() * 360);
  const scale = useSharedValue(0.8 + Math.random() * 0.4);
  const translateX = useSharedValue(startX);

  React.useEffect(() => {
    const startAnimation = () => {
      translateY.value = withDelay(
        delay,
        withRepeat(
          withTiming(SCREEN_HEIGHT + size, { 
            duration: duration,
            easing: Easing.linear 
          }),
          -1,
          false
        )
      );

      opacity.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(0.7, { duration: 800 }),
            withTiming(0.7, { duration: duration - 2000 }),
            withTiming(0, { duration: 1200 })
          ),
          -1,
          false
        )
      );

      rotate.value = withDelay(
        delay,
        withRepeat(
          withTiming(rotate.value + 720, {
            duration: duration * 0.8, 
            easing: Easing.linear 
          }),
          -1,
          false
        )
      );

      const swingDuration = duration / 4;
      translateX.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(startX + 15, { duration: swingDuration, easing: Easing.inOut(Easing.sin) }),
            withTiming(startX - 10, { duration: swingDuration * 2, easing: Easing.inOut(Easing.sin) }),
            withTiming(startX + 5, { duration: swingDuration, easing: Easing.inOut(Easing.sin) })
          ),
          -1,
          true
        )
      );

      scale.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(scale.value * 1.15, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
            withTiming(scale.value, { duration: 2000, easing: Easing.inOut(Easing.sin) })
          ),
          -1,
          true
        )
      );
    };

    startAnimation();
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: rotate.value + 'deg' },
      { scale: scale.value }
    ],
    opacity: opacity.value,
  }));

  const iconColors = [
    COLORS.emailPrimary,
    COLORS.phonePrimary,
    COLORS.yellow,
    '#4CAF50',
    '#FF9800',
    '#9C27B0',
    '#795548',
    '#607D8B',
    '#E91E63',
    '#00BCD4',
  ];
  
  const randomColor = iconColors[Math.floor(Math.random() * iconColors.length)];

  return (
    <Animated.View style={[styles.floatingFoodIcon, animatedStyle]}>
      {icon.type === 'lucide' ? (
        <icon.component 
          size={size} 
          color={randomColor} 
          fill={randomColor}
          opacity={0.6}
        />
      ) : (
        <Ionicons 
          name={icon.name}
          size={size}
          color={randomColor}
          style={{ opacity: 0.6 }}
        />
      )}
    </Animated.View>
  );
};

// ✅ مكون الخلفية المتحركة المحسنة
const AnimatedBackground = () => {
  const [foodIcons, setFoodIcons] = useState<React.ReactNode[]>([]);

  React.useEffect(() => {
    const createIcons = () => {
      const icons = [];
      const totalIcons = 20;
      
      const columns = 6;
      const columnWidth = SCREEN_WIDTH / columns;
      
      for (let i = 0; i < totalIcons; i++) {
        const randomIcon = FOOD_ICONS[Math.floor(Math.random() * FOOD_ICONS.length)];
        const size = Math.random() * 18 + 22;
        
        const column = i % columns;
        const baseX = column * columnWidth;
        const startX = baseX + Math.random() * (columnWidth - size);
        
        const delay = Math.random() * 15000;
        const duration = Math.random() * 10000 + 20000;
        
        icons.push(
          <FloatingFoodIcon
            key={i}
            icon={randomIcon}
            size={size}
            delay={delay}
            duration={duration}
            startX={startX}
          />
        );
      }
      
      return icons;
    };
    
    setFoodIcons(createIcons());

    const interval = setInterval(() => {
      setFoodIcons(createIcons());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.backgroundContainer}>
      <Animated.View style={[styles.circle, styles.circleRed]} />
      <Animated.View style={[styles.circle, styles.circleBlue]} />
      <Animated.View style={[styles.circle, styles.circleYellow]} />
      {foodIcons}
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
      
      <Animated.View style={[styles.sparkleDecoration, styles.sparkleTopRight, sparkleStyle]}>
        <Sparkles size={24} color={COLORS.yellow} fill={COLORS.yellow} />
      </Animated.View>
      
      <Animated.View style={[styles.sparkleDecoration, styles.starBottomLeft, starStyle]}>
        <Star size={20} color={COLORS.emailPrimary} fill={COLORS.emailPrimary} />
      </Animated.View>
    </Animated.View>
  );
};

// ✅ مكون الزر المتحرك مع تأثير اللمعان الخفيف
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
  const shimmerTranslate = useSharedValue(-500);

  React.useEffect(() => {
    // لمعان خفيف جداً يظهر كل 4 ثواني
    shimmerTranslate.value = withRepeat(
      withSequence(
        withTiming(-500, { duration: 0 }),
        withDelay(4000, withTiming(-500, { duration: 0 })),
        withTiming(500, {
          duration: 4000,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: shimmerTranslate.value },
      { skewX: '-20deg' }
    ],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  return (
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Animated.View
        style={[
          styles.animatedButton,
          { backgroundColor: colors.primary },
          animatedStyle,
        ]}
      >
        {/* طبقة اللمعان الخفيف جداً */}
        <Animated.View style={[styles.buttonShimmer, shimmerStyle]}>
          <LinearGradient
            colors={[
              'transparent',
              'rgba(255,255,255,0.15)',
              'rgba(255,255,255,0.3)',
              'rgba(255,255,255,0.15)',
              'transparent'
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.shimmerGradient}
          />
        </Animated.View>

        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};


export default function LoginScreen() {
  const router = useRouter();
  
  const [authMethod, setAuthMethod] = useState<AuthMethod>('phone');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('05');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);
  const phoneRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const getCurrentColors = () => {
    return authMethod === 'email' 
      ? { primary: COLORS.emailPrimary, secondary: COLORS.emailSecondary }
      : { primary: COLORS.phonePrimary, secondary: COLORS.phoneSecondary };
  };

  const colors = getCurrentColors();

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
          <View style={styles.header}>
            <AnimatedLogo />
            
            <View style={styles.titleContainer}>
              <Text style={styles.title}>مرحباً بك!</Text>
              <Text style={styles.subtitle}>سجل دخولك للاستمتاع بالذ الوجبات الملكية !</Text>
            </View>

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

          <Animated.View style={styles.loginCard}>
            <AuthTabs />

            <View style={styles.formContainer}>
              {authMethod === 'phone' ? (
                <View style={styles.inputWrapper}>
                  <View style={[
                    styles.inputContainer,
                    errorText && styles.inputContainerError
                  ]}>
                    <Phone size={20} color={errorText ? colors.primary : COLORS.gray} style={styles.inputIcon} />
                    <TextInput
                      ref={phoneRef}
                      style={styles.emailphoneinputField}
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
                      style={styles.emailphoneinputField}
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

              {errorText && (
                <View style={styles.errorContainer}>
                  <Text style={[styles.errorText, { color: colors.primary }]}>{errorText}</Text>
                </View>
              )}

              <View style={styles.optionsContainer}>
                <TouchableOpacity>
                  <View style={styles.forgotPasswordContainer}>
                    <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>
                      نسيت كلمة المرور؟
                    </Text>
                    <ChevronLeft size={12} color={colors.primary} />
                  </View>
                </TouchableOpacity>
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
              </View>

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

            <View style={styles.separatorContainer}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>أو تسجيل الدخول عبر</Text>
              <View style={styles.separatorLine} />
            </View>

            <View style={styles.socialContainer}>
              <TouchableOpacity style={styles.socialButton}>
                <View style={styles.googleIcon}>
                  <Text style={styles.googleIconText}>G</Text>
                </View>
                <Text style={styles.socialText}>Google</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.socialButton}>
                <View style={styles.facebookIcon}>
                  <Text style={styles.facebookIconText}>f</Text>
                </View>
                <Text style={styles.socialText}>Facebook</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>
                ليس لديك حساب؟{' '}
              </Text>
              <TouchableOpacity onPress={() => router.replace('/(auth)/register')}>
                <View style={styles.signupLinkContainer}>
                  <Text style={[styles.signupLink, { color: colors.primary }]}>
                    إنشاء حساب جديد
                  </Text>
                  <ChevronLeft size={12} color={colors.primary} />
                </View>
              </TouchableOpacity>
            </View>
          </Animated.View>

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
  floatingFoodIcon: {
    position: 'absolute',
    top: 0,
  },

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
  emailphoneinputField:{
    flex: 1, 
    fontSize: 16, 
    textAlign: 'left', 
    color: COLORS.darkGray 
  },
  visibilityButton: {
    padding: 4,
  },

  errorContainer: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'right',
    fontWeight: '500',
  },

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

  animatedButton: {
    flexDirection: 'row',
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
    top: -50,
    left: -50,
    right: -50,
    bottom: -50,
  },
  shimmerGradient: {
    flex: 1,
    width: 150,
  },

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
    backgroundColor: '#ff3030ff',
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