// مسار الملف: app/(auth)/register.tsx

import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, StyleSheet, Alert, findNodeHandle, Platform, StatusBar, ScrollView, Image } from 'react-native';
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
};

// ✅ 1. تعريف نوع لطريقة المصادقة
type AuthMethod = 'phone' | 'email';
interface PasswordValidationState {
    minLength: boolean;
    hasUpper: boolean;
    hasLower: boolean;
    hasSymbol: boolean;
}
const PasswordStrengthIndicator = ({ validationState }: { validationState: PasswordValidationState }) => {
    const ValidationItem = ({ text, isValid }: { text: string; isValid: boolean }) => (
        <View style={styles.validationItem}>
            <Ionicons name={isValid ? "checkmark-circle" : "ellipse-outline"} size={20} color={isValid ? '#22C55E' : COLORS.gray} />
            <Text style={[styles.validationText, isValid && styles.validationTextValid]}>{text}</Text>
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

export default function RegisterScreen() {
    const router = useRouter();
    // ✅ 2. إضافة حالة جديدة لطريقة التسجيل وحالة للبريد الإلكتروني
    const [authMethod, setAuthMethod] = useState<AuthMethod>('phone');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('+972');
    
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [loading, setLoading] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

    const [passwordValidation, setPasswordValidation] = useState<PasswordValidationState>({
        minLength: false,
        hasUpper: false,
        hasLower: false,
        hasSymbol: false,
    });

    const validatePassword = (pass: string) => {
        const minLength = pass.length >= 8;
        const hasUpper = /[A-Z]/.test(pass);
        const hasLower = /[a-z]/.test(pass);
        const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(pass);

        setPasswordValidation({ minLength, hasUpper, hasLower, hasSymbol });
        return minLength && hasUpper && hasLower && hasSymbol;
    };

    // ✅ 5. تحديث دالة setPassword لتشمل التحقق
    const handlePasswordChange = (pass: string) => {
        setPassword(pass);
        validatePassword(pass);
    };

    const scrollViewRef = useRef<ScrollView>(null);
    const firstNameRef = useRef<TextInput>(null);
    const lastNameRef = useRef<TextInput>(null);
    const phoneRef = useRef<TextInput>(null);
    const emailRef = useRef<TextInput>(null); // ✅ 3. إضافة ref للبريد الإلكتروني
    const passwordRef = useRef<TextInput>(null);
    const confirmPasswordRef = useRef<TextInput>(null);

    // ✅ 4. تحديث دالة التسجيل لتكون ديناميكية
    const handleRegister = async () => {
        // ✅ 6. إضافة التحقق من قوة كلمة المرور قبل الإرسال
        const isPasswordValid = validatePassword(password);
        if (!isPasswordValid) {
            Alert.alert('كلمة مرور ضعيفة', 'الرجاء التأكد من أن كلمة المرور تحقق جميع الشروط.');
            return;
        }

        // (باقي منطق التحقق والتسجيل يبقى كما هو)
        if (!firstName.trim() || !lastName.trim() || !password) { /* ... */ }
        if (password !== confirmPassword) {
            Alert.alert('خطأ', 'كلمتا المرور غير متطابقتين.');
            return;
        }

        // تحضير بيانات التسجيل
        const credentials = {
            password: password,
            options: {
                data: {
                    first_name: firstName,
                    last_name: lastName,
                    full_name: `${firstName} ${lastName}`,
                },
            },
        };

        let finalCredentials;
        if (authMethod === 'phone') {
            if (!phoneNumber.trim()) {
                Alert.alert('خطأ', 'الرجاء إدخال رقم الهاتف.');
                return;
            }
            finalCredentials = { ...credentials, phone: phoneNumber };
        } else { // authMethod === 'email'
            if (!email.trim()) {
                Alert.alert('خطأ', 'الرجاء إدخال البريد الإلكتروني.');
                return;
            }
            finalCredentials = { ...credentials, email: email };
        }
        
        setLoading(true);
        
        const { data, error } = await supabase.auth.signUp(finalCredentials);

        setLoading(false);

        if (error) {
            Alert.alert('خطأ في إنشاء الحساب', error.message);
        } else if (data.user) {
            if (authMethod === 'phone') {
                Alert.alert('تم إرسال الرمز', `لقد أرسلنا رمز تحقق إلى الرقم ${phoneNumber}.`);
                router.push({ pathname: '/(auth)/verify-otp', params: { phone: phoneNumber } });
            } else { // authMethod === 'email'
                Alert.alert('تحقق من بريدك', `لقد أرسلنا رابط تحقق إلى ${email}. يرجى الضغط عليه لتفعيل حسابك.`);
                router.replace('/(auth)/login'); // أعد المستخدم لشاشة الدخول بعد إرسال الرابط
            }
        }
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

    // ✅ 5. مكون مبدل طرق التسجيل
    const AuthMethodSwitcher = () => (
        <View style={styles.switcherContainer}>
            <TouchableOpacity
                style={[styles.switcherButton, authMethod === 'phone' && styles.switcherActiveButton]}
                onPress={() => setAuthMethod('phone')}
            >
                <Text style={[styles.switcherText, authMethod === 'phone' && styles.switcherActiveText]}>رقم الهاتف</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.switcherButton, authMethod === 'email' && styles.switcherActiveButton]}
                onPress={() => setAuthMethod('email')}
            >
                <Text style={[styles.switcherText, authMethod === 'email' && styles.switcherActiveText]}>البريد الإلكتروني</Text>
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
                >
                    <View style={styles.header}>
                        <Image source={require('@/assets/images/icon.png')} style={styles.logo} />
                    </View>

                    <Text style={styles.title}>أنشئ حسابك الآن</Text>
                    <Text style={styles.subtitle}>أهلاً بك في عائلة الملكي!</Text>

                    {/* ✅ 6. إضافة المبدل إلى الواجهة */}
                    <AuthMethodSwitcher />

                    <View style={styles.nameContainer}>
                        <TextInput
                            ref={lastNameRef}
                            style={styles.nameInput}
                            placeholder="اسم العائلة"
                            value={lastName}
                            onChangeText={setLastName}
                            placeholderTextColor={COLORS.gray}
                            onFocus={() => handleFocus(lastNameRef)}
                        />
                        <TextInput
                            ref={firstNameRef}
                            style={styles.nameInput}
                            placeholder="الاسم الأول"
                            value={firstName}
                            onChangeText={setFirstName}
                            placeholderTextColor={COLORS.gray}
                            onFocus={() => handleFocus(firstNameRef)}
                        />
                    </View>

                    {/* ✅ 7. عرض الحقل المناسب بناءً على طريقة التسجيل */}
                    {authMethod === 'phone' ? (
                        <View style={styles.inputContainer}>
                            <Ionicons name="call-outline" size={22} color={COLORS.gray} style={styles.inputIcon} />
                            <TextInput
                                ref={phoneRef}
                                style={styles.inputField}
                                placeholder="رقم الهاتف"
                                value={phoneNumber}
                                onChangeText={setPhoneNumber}
                                keyboardType="phone-pad"
                                autoCapitalize="none"
                                placeholderTextColor={COLORS.gray}
                                onFocus={() => handleFocus(phoneRef)}
                            />
                        </View>
                    ) : (
                        <View style={styles.inputContainer}>
                            <Ionicons name="mail-outline" size={22} color={COLORS.gray} style={styles.inputIcon} />
                            <TextInput
                                ref={emailRef}
                                style={styles.inputField}
                                placeholder="البريد الإلكتروني"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                placeholderTextColor={COLORS.gray}
                                onFocus={() => handleFocus(emailRef)}
                            />
                        </View>
                    )}

                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={22} color={COLORS.gray} style={styles.inputIcon} />
                        <TextInput
                            ref={passwordRef}
                            style={styles.inputField}
                            placeholder="كلمة المرور"
                            value={password}
                            onChangeText={handlePasswordChange}
                            secureTextEntry={!isPasswordVisible}
                            placeholderTextColor={COLORS.gray}
                            onFocus={() => handleFocus(passwordRef)}
                        />
                        <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                            <Ionicons name={isPasswordVisible ? "eye-off-outline" : "eye-outline"} size={24} color={COLORS.gray} />
                        </TouchableOpacity>
                    </View>
                    
                     {/* ✅ 8. عرض مؤشر قوة كلمة المرور فقط إذا بدأ المستخدم بالكتابة */}
                    {password.length > 0 && (
                        <PasswordStrengthIndicator validationState={passwordValidation} />
                    )}

                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={22} color={COLORS.gray} style={styles.inputIcon} />
                        <TextInput
                            ref={confirmPasswordRef}
                            style={styles.inputField}
                            placeholder="تأكيد كلمة المرور"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!isConfirmPasswordVisible}
                            placeholderTextColor={COLORS.gray}
                            onFocus={() => handleFocus(confirmPasswordRef)}
                        />
                        <TouchableOpacity onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}>
                            <Ionicons name={isConfirmPasswordVisible ? "eye-off-outline" : "eye-outline"} size={24} color={COLORS.gray} />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
                        <Text style={styles.buttonText}>{loading ? 'جاري الإنشاء...' : 'إنشاء حساب'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
                        <Text style={styles.linkText}>
                            لديك حساب بالفعل؟ <Text style={styles.signInLink}>سجل الدخول</Text>
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

// ✅ 8. إضافة تنسيقات المبدل
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.white },
    keyboardAvoidingContainer: { flex: 1 },
    scrollContainer: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 25, paddingVertical: 20 },
    header: { alignItems: 'center', marginBottom: 30 },
    logo: { width: 180, height: 180, resizeMode: 'contain' },
    title: { fontSize: 26, fontWeight: 'bold', color: COLORS.darkGray, textAlign: 'left', marginBottom: 8 },
    subtitle: { fontSize: 16, color: COLORS.gray, textAlign: 'left', marginBottom: 20 },
    
    // --- تنسيقات المبدل ---
    switcherContainer: {
        flexDirection: 'row',
        backgroundColor: COLORS.lightGray,
        borderRadius: 30,
        padding: 4,
        marginBottom: 25,
    },
    switcherButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
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
    },validationContainer: {
        paddingHorizontal: 10,
        marginBottom: 15,
        marginTop: -10, // لتقليل المسافة بعد حقل كلمة المرور
    },
    validationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 4,
    },
    validationText: {
        fontSize: 14,
        color: COLORS.gray,
        marginLeft: 8,
    },
    validationTextValid: {
        color: '#22C55E', // أخضر للنجاح
        // textDecorationLine: 'line-through', // يمكنك إضافة هذا التأثير إذا أردت
    },
    // --- نهاية تنسيقات المبدل ---

    nameContainer: { flexDirection: 'row-reverse', justifyContent: 'space-between' },
    nameInput: { width: '48%', backgroundColor: COLORS.lightGray, borderRadius: 10, paddingHorizontal: 15, height: 55, fontSize: 16, textAlign: 'right', marginBottom: 20, color: COLORS.darkGray },
    inputContainer: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: COLORS.lightGray, borderRadius: 10, paddingHorizontal: 15, marginBottom: 20, height: 55 },
    inputIcon: { marginLeft: 10 },
    inputField: { flex: 1, fontSize: 16, textAlign: 'left', color: COLORS.darkGray },
    button: { backgroundColor: COLORS.primary, paddingVertical: 15, borderRadius: 10, alignItems: 'center', marginTop: 10, marginBottom: 20, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 8 },
    buttonText: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
    linkText: { color: COLORS.gray, textAlign: 'center', fontSize: 15 },
    signInLink: { color: COLORS.primary, fontWeight: 'bold' },
});
