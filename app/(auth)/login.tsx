// مسار الملف: app/(auth)/login.tsx

import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, StyleSheet, Alert, findNodeHandle, Platform, StatusBar, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

// (الألوان تبقى كما هي)
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

export default function LoginScreen() {
    const router = useRouter();
    // ✅ 2. إضافة حالة جديدة لطريقة التسجيل وحالة للبريد الإلكتروني
    const [authMethod, setAuthMethod] = useState<AuthMethod>('phone');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('05');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const [errorText, setErrorText] = useState<string | null>(null);
    // (Refs تبقى كما هي)
    const scrollViewRef = useRef<ScrollView>(null);
    const phoneRef = useRef<TextInput>(null);
    const emailRef = useRef<TextInput>(null); // ✅ 3. إضافة ref للبريد الإلكتروني
    const passwordRef = useRef<TextInput>(null);

    const handleLogin = async () => {
        setErrorText(null); // إخفاء أي خطأ سابق عند بدء المحاولة
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
            // ✅ 3. ترجمة رسالة الخطأ وعرضها في الواجهة
            if (error.message === 'Invalid login credentials') {
                setErrorText('رقم الهاتف/البريد الإلكتروني أو كلمة المرور غير صحيحة.');
            } else {
                setErrorText(error.message); // عرض رسائل الأخطاء الأخرى كما هي
            }
        }
        // عند النجاح، المستمع سيتولى التوجيه
    };

    // ✅ 4. دوال لإخفاء الخطأ عند بدء الكتابة
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

    // (دالة handleFocus تبقى كما هي)
    const handleFocus = (ref: React.RefObject<TextInput | null>) => { /* ... */ };

    // ✅ 5. مكون مبدل طرق التسجيل (نفس المكون من شاشة التسجيل)
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

                    <Text style={styles.title}>أهلاً بعودتك!</Text>
                    <Text style={styles.subtitle}>سجل الدخول للمتابعة</Text>

                    {/* ✅ 6. إضافة المبدل إلى الواجهة */}
                    <AuthMethodSwitcher />

                    {/* ✅ 7. عرض الحقل المناسب بناءً على طريقة التسجيل */}
                    {authMethod === 'phone' ? (
                        <View style={styles.inputContainer}>
                            <Ionicons name="call-outline" size={22} color={COLORS.gray} style={styles.inputIcon} />
                            <TextInput
                                ref={phoneRef}
                                style={styles.inputField}
                                placeholder="رقم الهاتف"
                                value={phone}
                                onChangeText={handlePhoneChange}
                                keyboardType="phone-pad"
                                autoCapitalize="none"
                                placeholderTextColor={COLORS.gray}
                                onFocus={() => handleFocus(phoneRef)}
                                maxLength={10}
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
                                onChangeText={handleEmailChange}
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

                    {/* ✅ 6. عرض رسالة الخطأ هنا */}
                    {errorText && (
                        <View style={styles.errorContainer}>
                            <Ionicons name="alert-circle-outline" size={20} color={COLORS.secondary} />
                            <Text style={styles.errorText}>{errorText}</Text>
                        </View>
                    )}

                    <TouchableOpacity style={styles.forgotPasswordContainer}>
                        <Text style={styles.forgotPasswordText}>نسيت كلمة المرور؟</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
                        <Text style={styles.buttonText}>{loading ? 'جاري التحميل...' : 'تسجيل الدخول'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => router.replace('/(auth)/register')}>
                        <Text style={styles.linkText}>
                            ليس لديك حساب؟ <Text style={styles.signUpLink}>أنشئ واحدًا</Text>
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

// ✅ 8. إضافة تنسيقات المبدل (نفس التنسيقات من شاشة التسجيل)
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
    },errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        marginTop: -10,
        paddingHorizontal: 10,
    },
    errorText: {
        color: COLORS.secondary, // اللون الأحمر
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 8,
    },
    // --- نهاية تنسيقات المبدل ---

    inputContainer: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: COLORS.lightGray, borderRadius: 10, paddingHorizontal: 15, marginBottom: 20, height: 55 },
    inputIcon: { marginRight: 10 },
    inputField: { flex: 1, fontSize: 16, textAlign: 'left', color: COLORS.darkGray },
    forgotPasswordContainer: { alignItems: 'center', marginBottom: 25 },
    forgotPasswordText: { color: COLORS.primary, fontWeight: '600', fontSize: 15 },
    button: { backgroundColor: COLORS.primary, paddingVertical: 15, borderRadius: 10, alignItems: 'center', marginBottom: 25, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 8 },
    buttonText: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
    linkText: { color: COLORS.gray, textAlign: 'center', fontSize: 15 },
    signUpLink: { color: COLORS.primary, fontWeight: 'bold' },
});
