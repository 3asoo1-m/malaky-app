// مسار الملف: app/(tabs)/profile.tsx

import React from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '@/lib/useAuth'; // ✅ المصدر الوحيد للبيانات
import { supabase } from '@/lib/supabase';
import CustomBottomNav from '@/components/CustomBottomNav';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// مكون مساعد لإنشاء أزرار القائمة
const ProfileListItem = ({ icon, text, onPress, color = '#333' }: { icon: React.ReactNode; text: string; onPress: () => void; color?: string }) => (
  <TouchableOpacity style={styles.listItem} onPress={onPress}>
    <View style={styles.listItemContent}>
      {icon}
      <Text style={[styles.listItemText, { color }]}>{text}</Text>
    </View>
    <Ionicons name="chevron-back-outline" size={20} color="#A0A0A0" />
  </TouchableOpacity>
);

export default function ProfileScreen() {
  const router = useRouter();
  const { user, initialLoading } = useAuth(); // ✅ نستخدم loading من useAuth مباشرة

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // ✅ لا حاجة لـ useEffect لجلب البيانات، كل شيء موجود في 'user'

  if (initialLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#C62828" />
      </View>
    );
  }

  if (!user) {
    // يجب ألا يصل المستخدم إلى هنا إذا كان AuthProvider يعمل بشكل صحيح،
    // ولكنها حماية إضافية.
    return (
      <View style={styles.centered}>
        <Text>الرجاء تسجيل الدخول لعرض ملفك الشخصي.</Text>
      </View>
    );
  }

  // ✅ قراءة البيانات مباشرة من user_metadata
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
            <MaterialCommunityIcons name="receipt-text-clock-outline" size={32} color="#C62828" />
          </View>
          <View>
            <Text style={styles.mainCardTitle}>طلباتي الأخيرة</Text>
            <Text style={styles.mainCardSubtitle}>تتبع حالة طلباتك الحالية والسابقة</Text>
          </View>
        </TouchableOpacity>

        {/* --- قائمة الخيارات --- */}
        <View style={styles.menuSection}>
          <ProfileListItem
            icon={<Ionicons name="person-outline" size={22} color="#555" />}
            text="تعديل الملف الشخصي"
            onPress={() => { /* لاحقًا: سننشئ شاشة تعديل الملف الشخصي */ }}
          />
          <ProfileListItem
            icon={<Ionicons name="location-outline" size={22} color="#555" />}
            text="عناويني"
            onPress={() => router.push('/addresses')} />
          <ProfileListItem
            icon={<Ionicons name="heart-outline" size={22} color="#555" />}
            text="المفضلة"
            onPress={() => router.push('/(tabs)/favorites')}
          />
        </View>

        {/* --- تسجيل الخروج --- */}
        <View style={styles.logoutSection}>
          <ProfileListItem
            icon={<Ionicons name="log-out-outline" size={22} color="#C62828" />}
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

// التنسيقات تبقى كما هي من المرة السابقة
const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: {
    padding: 20,
    paddingBottom: 120,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#fff',
  },
  userName: {
    marginTop: 50,
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  userEmail: {
    fontSize: 16,
    color: '#888',
  },
  mainCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 30,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  mainCardIconContainer: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 12,
    marginLeft: 15,
  },
  mainCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
  },
  mainCardSubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'right',
  },
  menuSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 10,
    marginBottom: 30,
  },
  logoutSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 10,
  },
  listItem: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  listItemContent: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  listItemText: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 15,
  },
});
