// مسار الملف: app/maintenance.tsx

import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function MaintenanceScreen() {
  // جلب الرسالة التي أرسلناها من SplashScreen
  const { message } = useLocalSearchParams<{ message: string }>();

  return (
    <SafeAreaView style={styles.container}>
      <Ionicons name="construct-outline" size={80} color="#FFA000" />
      <Text style={styles.title}>التطبيق تحت الصيانة</Text>
      <Text style={styles.message}>
        {message || 'نحن نقوم ببعض التحسينات حاليًا. شكرًا لصبركم، سنعود قريبًا!'}
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Cairo-Bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    fontFamily: 'Cairo-Regular',
    color: '#555',
    textAlign: 'center',
    lineHeight: 24,
  },
});
