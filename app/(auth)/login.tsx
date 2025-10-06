// مسار الملف: app/(auth)/login.tsx

import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, StyleSheet, Alert, findNodeHandle, Platform, StatusBar, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

// تعريف الألوان المستوحاة من الشعار (نفس الألوان المستخدمة في شاشة التسجيل)
const COLORS = {
  primary: '#0033A0', // الأزرق الداكن
  secondary: '#E4002B', // الأحمر
  white: '#FFFFFF',
  lightGray: '#F5F5F5',
  gray: '#A9A9A9',
  darkGray: '#333333',
};

export default function LoginScreen() {
    const router = useRouter();
    const [phone, setPhone] = useState('+972');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    // إنشاء refs للتحكم بالتمرير والحقول
    const scrollViewRef = useRef<ScrollView>(null);
    const phoneRef = useRef<TextInput>(null);
    const passwordRef = useRef<TextInput>(null);

    const handleLogin = async () => {
        if (!phone || !password) {
            Alert.alert('خطأ', 'يرجى إدخال رقم الهاتف وكلمة المرور.');
            return;
        }
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            phone: phone,
            password: password,
        });
        setLoading(false);

        if (error) {
            Alert.alert('خطأ في تسجيل الدخول', error.message);
        }
        // عند النجاح، سيقوم المستمع (listener) الخاص بـ Supabase بالتوجيه التلقائي
    };

    // دالة التمرير التلقائي عند التركيز على الحقل
    const handleFocus = (ref: React.RefObject<TextInput | null>) => {
        if (ref.current && scrollViewRef.current) {
            const node = findNodeHandle(ref.current);
            if (node) {
                ref.current.measureInWindow((x, y) => {
                    const scrollToY = y - 150; // يمكنك تعديل هذا الرقم
                    scrollViewRef.current?.scrollTo({ y: scrollToY, animated: true });
                });
            }
        }
    };

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

                    <View style={styles.inputContainer}>
                        <Ionicons name="call-outline" size={22} color={COLORS.gray} style={styles.inputIcon} />
                        <TextInput
                            ref={phoneRef}
                            style={styles.inputField}
                            placeholder="رقم الهاتف"
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                            autoCapitalize="none"
                            placeholderTextColor={COLORS.gray}
                            onFocus={() => handleFocus(phoneRef)}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={22} color={COLORS.gray} style={styles.inputIcon} />
                        <TextInput
                            ref={passwordRef}
                            style={styles.inputField}
                            placeholder="كلمة المرور"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!isPasswordVisible}
                            placeholderTextColor={COLORS.gray}
                            onFocus={() => handleFocus(passwordRef)}
                        />
                        <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                            <Ionicons name={isPasswordVisible ? "eye-off-outline" : "eye-outline"} size={24} color={COLORS.gray} />
                        </TouchableOpacity>
                    </View>

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

// الأنماط متطابقة مع شاشة إنشاء الحساب لتحقيق التناسق
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    keyboardAvoidingContainer: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 25,
        paddingVertical: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
    },
    logo: {
        width: 180,
        height: 180,
        resizeMode: 'contain',
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: COLORS.darkGray,
        textAlign: 'right',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.gray,
        textAlign: 'right',
        marginBottom: 30,
    },
    inputContainer: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        backgroundColor: COLORS.lightGray,
        borderRadius: 10,
        paddingHorizontal: 15,
        marginBottom: 20,
        height: 55,
    },
    inputIcon: {
        marginLeft: 10,
    },
    inputField: {
        flex: 1,
        fontSize: 16,
        textAlign: 'right',
        color: COLORS.darkGray,
    },
    forgotPasswordContainer: {
        alignItems: 'flex-start', // لجعله على اليسار في واجهة RTL
        marginBottom: 25,
    },
    forgotPasswordText: {
        color: COLORS.primary,
        fontWeight: '600',
        fontSize: 15,
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
    linkText: {
        color: COLORS.gray,
        textAlign: 'center',
        fontSize: 15,
    },
    signUpLink: {
        color: COLORS.primary,
        fontWeight: 'bold',
    },
});
