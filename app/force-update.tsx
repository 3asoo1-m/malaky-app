// مسار الملف: app/force-update.tsx

import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Linking, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase'; // سنحتاجه لجلب الروابط

export default function ForceUpdateScreen() {
  // جلب الرسالة ورقم الإصدار
  const { message, newVersion } = useLocalSearchParams<{ message: string, newVersion: string }>();

  const handleUpdatePress = async () => {
    try {
      // جلب روابط المتجر من قاعدة البيانات
      const { data, error } = await supabase
        .from('app_config')
        .select('store_links')
        .eq('id', 1)
        .single();

      if (error || !data?.store_links) {
        throw new Error("Could not fetch store links.");
      }
      
      const link = Platform.OS === 'android' 
        ? data.store_links.android 
        : data.store_links.ios;

      if (link) {
        // التحقق مما إذا كان يمكن فتح الرابط
        const supported = await Linking.canOpenURL(link);
        if (supported) {
          await Linking.openURL(link);
        } else {
          alert(`لا يمكن فتح الرابط: ${link}`);
        }
      }
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء محاولة فتح المتجر.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Ionicons name="cloud-download-outline" size={80} color="#1E88E5" />
      <Text style={styles.title}>يتوفر تحديث جديد!</Text>
      <Text style={styles.versionText}>الإصدار المطلوب: {newVersion}</Text>
      <Text style={styles.message}>
        {message || 'يرجى تحديث التطبيق إلى أحدث إصدار للاستفادة من آخر الميزات والتحسينات الأمنية.'}
      </Text>
      <TouchableOpacity style={styles.updateButton} onPress={handleUpdatePress}>
        <Text style={styles.updateButtonText}>التحديث الآن</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Cairo-Bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 5,
    textAlign: 'center',
  },
  versionText: {
    fontSize: 16,
    fontFamily: 'Cairo-SemiBold',
    color: '#1E88E5',
    marginBottom: 15,
  },
  message: {
    fontSize: 16,
    fontFamily: 'Cairo-Regular',
    color: '#555',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  updateButton: {
    backgroundColor: '#1E88E5',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
    elevation: 3,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Cairo-Bold',
  },
});
