// مسار الملف: app/(tabs)/profile.tsx

import React from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '@/lib/useAuth';
import { supabase } from '@/lib/supabase';
import CustomBottomNav from '@/components/CustomBottomNav';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// 1. استيراد دوال التصميم المتجاوب
import { scale, fontScale } from '@/lib/responsive';

// مكون مساعد لإنشاء أزرار القائمة
const ProfileListItem = ({ icon, text, onPress, color = '#333' }: { icon: React.ReactNode; text: string; onPress: () => void; color?: string }) => (
  <TouchableOpacity style={styles.listItem} onPress={onPress}>
    <View style={styles.listItemContent}>
      {icon}
      <Text style={[styles.listItemText, { color }]}>{text}</Text>
    </View>
    {/* 2. جعل حجم أيقونة السهم متجاوبًا */}
    <Ionicons name="chevron-back-outline" size={scale(20)} color="#A0A0A0" />
  </TouchableOpacity>
);

export default function ProfileScreen() {
  const router = useRouter();
  const { user, initialLoading } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (initialLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#C62828" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text>الرجاء تسجيل الدخول لعرض ملفك الشخصي.</Text>
      </View>
    );
  }

  const firstName = user.user_metadata?.first_name || '';
  const lastName = user.user_metadata?.last_name || '';

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* --- معلومات المستخدم --- */}
        <View style={styles.profileHeader}>
          <Text style={styles.userName}>{firstName} {lastName}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
        </View>

        {/* --- بطاقة طلباتي الأخيرة --- */}
        <TouchableOpacity style={styles.mainCard} onPress={() => router.push('/(tabs)/orders')}>
          <View style={styles.mainCardIconContainer}>
            {/* 3. جعل حجم أيقونة البطاقة متجاوبًا */}
            <MaterialCommunityIcons name="receipt-text-clock-outline" size={scale(32)} color="#C62828" />
          </View>
          <View>
            <Text style={styles.mainCardTitle}>طلباتي الأخيرة</Text>
            <Text style={styles.mainCardSubtitle}>تتبع حالة طلباتك الحالية والسابقة</Text>
          </View>
        </TouchableOpacity>

        {/* --- قائمة الخيارات --- */}
        <View style={styles.menuSection}>
          <ProfileListItem
            icon={<Ionicons name="person-outline" size={scale(22)} color="#555" />}
            text="تعديل الملف الشخصي"
            onPress={() => { /* لاحقًا */ }}
          />
          <ProfileListItem
            icon={<Ionicons name="location-outline" size={scale(22)} color="#555" />}
            text="عناويني"
            onPress={() => router.push('/addresses')} />
          <ProfileListItem
            icon={<Ionicons name="heart-outline" size={scale(22)} color="#555" />}
            text="المفضلة"
            onPress={() => router.push('/(tabs)/favorites')}
          />
        </View>

        {/* --- تسجيل الخروج --- */}
        <View style={styles.logoutSection}>
          <ProfileListItem
            icon={<Ionicons name="log-out-outline" size={scale(22)} color="#C62828" />}
            text="تسجيل الخروج"
            onPress={handleLogout}
            color="#C62828"
          />
        </View>
      </ScrollView>
      <CustomBottomNav />
    </View>
  );
}

// 4. تحديث كل التنسيقات لتكون متجاوبة
const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: {
    padding: scale(20),
    paddingBottom: scale(120),
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: scale(30),
  },
  avatar: { // هذا التنسيق لم يكن مستخدمًا في الكود الأصلي، لكن سأجعله متجاوبًا للاحتياط
    width: scale(100),
    height: scale(100),
    borderRadius: scale(50),
    marginBottom: scale(15),
    borderWidth: scale(3),
    borderColor: '#fff',
  },
  userName: {
    marginTop: scale(50),
    fontSize: fontScale(22),
    fontWeight: 'bold',
    color: '#333',
  },
  userEmail: {
    fontSize: fontScale(16),
    color: '#888',
  },
  mainCard: {
    backgroundColor: '#fff',
    borderRadius: scale(16),
    padding: scale(20),
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: scale(30),
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: scale(10),
  },
  mainCardIconContainer: {
    backgroundColor: '#FEE2E2',
    borderRadius: scale(12),
    padding: scale(12),
    marginLeft: scale(15),
  },
  mainCardTitle: {
    fontSize: fontScale(18),
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
  },
  mainCardSubtitle: {
    fontSize: fontScale(14),
    color: '#888',
    textAlign: 'right',
  },
  menuSection: {
    backgroundColor: '#fff',
    borderRadius: scale(16),
    paddingVertical: scale(10),
    marginBottom: scale(30),
  },
  logoutSection: {
    backgroundColor: '#fff',
    borderRadius: scale(16),
    paddingVertical: scale(10),
  },
  listItem: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scale(15),
    paddingHorizontal: scale(20),
  },
  listItemContent: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  listItemText: {
    fontSize: fontScale(16),
    fontWeight: '500',
    marginRight: scale(15),
  },
});
