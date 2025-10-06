// مسار الملف: app/(auth)/register.tsx

import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity,KeyboardAvoidingView, StyleSheet, Alert, findNodeHandle, Platform, StatusBar, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

// تعريف الألوان المستوحاة من الشعار
const COLORS = {
  primary: '#0033A0', // الأزرق الداكن من كلمة "Malaky"
  secondary: '#E4002B', // الأحمر من الديك
  white: '#FFFFFF',
  lightGray: '#F5F5F5',
  gray: '#A9A9A9',
  darkGray: '#333333',
};

export default function RegisterScreen() {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('+972');
    const [loading, setLoading] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

    const scrollViewRef = useRef<ScrollView>(null);

    const firstNameRef = useRef<TextInput>(null);
    const lastNameRef = useRef<TextInput>(null);
    const phoneRef = useRef<TextInput>(null);
    const passwordRef = useRef<TextInput>(null);
    const confirmPasswordRef = useRef<TextInput>(null);

    const handleRegister = async () => {
        if (!firstName.trim() || !lastName.trim() || !phoneNumber.trim() || !password) {
            Alert.alert('خطأ', 'الرجاء ملء جميع الحقول.');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('خطأ', 'كلمتا المرور غير متطابقتين.');
            return;
        }
        
        setLoading(true);
        
        const { data, error } = await supabase.auth.signUp({
            phone: phoneNumber,
            password: password,
            options: {
                data: {
                    first_name: firstName,
                    last_name: lastName,
                    full_name: `${firstName} ${lastName}`,
                },
            },
        });

        setLoading(false);

        if (error) {
            Alert.alert('خطأ في إنشاء الحساب', error.message);
        } else if (data.user) {
            Alert.alert(
                'تم إرسال الرمز',
                `لقد أرسلنا رمز تحقق إلى الرقم ${phoneNumber}.`
            );
            router.push({ pathname: '/(auth)/verify-otp', params: { phone: phoneNumber } });
        }
    };

    const handleFocus = (ref: React.RefObject<TextInput | null>) => {
        if (ref.current && scrollViewRef.current) {
            // نستخدم findNodeHandle للحصول على "مقبض" المكون
            const node = findNodeHandle(ref.current);
            if (node) {
                // ثم نستخدم measureInWindow للحصول على الموضع بالنسبة للشاشة
                ref.current.measureInWindow((x, y) => {
                    // y هو بعد المكون عن أعلى الشاشة
                    // نطرح قيمة لضمان وجود مسافة كافية فوق الحقل
                    const scrollToY = y - 100; // يمكنك تعديل هذا الرقم
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
                {/* --- بداية التعديل: ربط الـ ref بالـ ScrollView --- */}
                <ScrollView
                    ref={scrollViewRef}
                    contentContainerStyle={styles.scrollContainer}
                    keyboardShouldPersistTaps="handled" // لتحسين التفاعل مع اللمس عند ظهور الكيبورد
                >
                    <View style={styles.header}>
                        <Image source={require('@/assets/images/icon.png')} style={styles.logo} />
                    </View>

                    <Text style={styles.title}>أنشئ حسابك الآن</Text>
                    <Text style={styles.subtitle}>أهلاً بك في عائلة الملكي!</Text>

                    {/* --- بداية التعديل: إضافة onFocus للحقول --- */}
                    <View style={styles.nameContainer}>
                        <TextInput
                            ref={lastNameRef} // ربط الـ ref
                            style={styles.nameInput}
                            placeholder="اسم العائلة"
                            value={lastName}
                            onChangeText={setLastName}
                            placeholderTextColor={COLORS.gray}
                            onFocus={() => handleFocus(lastNameRef)} // استدعاء handleFocus مع الـ ref
                        />
                        <TextInput
                            ref={firstNameRef} // ربط الـ ref
                            style={styles.nameInput}
                            placeholder="الاسم الأول"
                            value={firstName}
                            onChangeText={setFirstName}
                            placeholderTextColor={COLORS.gray}
                            onFocus={() => handleFocus(firstNameRef)} // استدعاء handleFocus مع الـ ref
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Ionicons name="call-outline" size={22} color={COLORS.gray} style={styles.inputIcon} />
                        <TextInput
                            ref={phoneRef} // ربط الـ ref
                            style={styles.inputField}
                            placeholder="رقم الهاتف"
                            value={phoneNumber}
                            onChangeText={setPhoneNumber}
                            keyboardType="phone-pad"
                            autoCapitalize="none"
                            placeholderTextColor={COLORS.gray}
                            onFocus={() => handleFocus(phoneRef)} // استدعاء handleFocus مع الـ ref
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={22} color={COLORS.gray} style={styles.inputIcon} />
                        <TextInput
                            ref={passwordRef} // ربط الـ ref
                            style={styles.inputField}
                            placeholder="كلمة المرور"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!isPasswordVisible}
                            placeholderTextColor={COLORS.gray}
                            onFocus={() => handleFocus(passwordRef)} // استدعاء handleFocus مع الـ ref
                        />
                        <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                            <Ionicons name={isPasswordVisible ? "eye-off-outline" : "eye-outline"} size={24} color={COLORS.gray} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={22} color={COLORS.gray} style={styles.inputIcon} />
                        <TextInput
                            ref={confirmPasswordRef} // ربط الـ ref
                            style={styles.inputField}
                            placeholder="تأكيد كلمة المرور"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!isConfirmPasswordVisible}
                            placeholderTextColor={COLORS.gray}
                            onFocus={() => handleFocus(confirmPasswordRef)} // استدعاء handleFocus مع الـ ref
                        />
                        <TouchableOpacity onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}>
                            <Ionicons name={isConfirmPasswordVisible ? "eye-off-outline" : "eye-outline"} size={24} color={COLORS.gray} />
                        </TouchableOpacity>
                    </View>
                    {/* --- نهاية التعديل --- */}

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
    nameContainer: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
    },
    nameInput: {
        width: '48%',
        backgroundColor: COLORS.lightGray,
        borderRadius: 10,
        paddingHorizontal: 15,
        height: 55,
        fontSize: 16,
        textAlign: 'right',
        marginBottom: 20,
        color: COLORS.darkGray,
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
    signInLink: {
        color: COLORS.primary,
        fontWeight: 'bold',
    },
});
