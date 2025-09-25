// مسار الملف: app/(auth)/login.tsx

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase'; // ✅ 1. استيراد supabase

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        setLoading(true);

        // ✅ 2. استخدام دالة supabase.auth.signInWithPassword
        const { error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        // 3. ✅ معالجة الأخطاء أو النجاح
        if (error) {
            Alert.alert('خطأ في تسجيل الدخول', error.message);
        } else {
            // عند النجاح، سيقوم نظام التوجيه الذي سنبنيه لاحقًا
            // بنقل المستخدم تلقائيًا إلى الشاشة الرئيسية.
            // لا نحتاج لكتابة router.push('/') هنا.
        }

        setLoading(false);
    };

    // ... (بقية الكود يبقى كما هو)
    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>تسجيل الدخول</Text>

            <TextInput
                style={styles.input}
                placeholder="البريد الإلكتروني"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />

            <TextInput
                style={styles.input}
                placeholder="كلمة المرور"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
                <Text style={styles.buttonText}>{loading ? 'جاري التحميل...' : 'دخول'}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/register')}>
                <Text style={styles.linkText}>ليس لديك حساب؟ أنشئ واحدًا</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#F5F5F5' },
    title: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginBottom: 40 },
    input: {
        height: 50,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 15,
        marginBottom: 20,
        backgroundColor: '#fff',
        textAlign: 'right',
    },
    button: {
        backgroundColor: '#C62828',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    linkText: { color: '#C62828', textAlign: 'center', marginTop: 20 },
});
