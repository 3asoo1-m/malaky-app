import React, { useState, useEffect } from 'react';
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
import { unregisterForPushNotificationsAsync } from '@/lib/notifications';
import { scale, fontScale } from '@/lib/responsive';

// تعريف نوع Profile
interface UserProfile {
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
}

// مكون مساعد لإنشاء أزرار القائمة
const ProfileListItem = ({ icon, text, onPress, color = '#333' }: { icon: React.ReactNode; text: string; onPress: () => void; color?: string }) => (
  <TouchableOpacity style={styles.listItem} onPress={onPress}>
    <View style={styles.listItemContent}>
      {icon}
      <Text style={[styles.listItemText, { color }]}>{text}</Text>
    </View>
    <Ionicons name="chevron-forward-outline" size={scale(20)} color="#A0A0A0" />
  </TouchableOpacity>
);

export default function ProfileScreen() {
  const router = useRouter();
  const { user, initialLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // ✅ جلب بيانات المستخدم من جدول profiles
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        setLoadingProfile(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, last_name, phone')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user profile:', error);
          // استخدام البيانات من user_metadata كبديل
          setProfile({
            first_name: user.user_metadata?.first_name || '',
            last_name: user.user_metadata?.last_name || '',
            phone: user.user_metadata?.phone || '',
            email: user.email || ''
          });
        } else if (data) {
          setProfile(data);
        }
      } catch (error) {
        console.error('Error in fetchUserProfile:', error);
        // استخدام البيانات من user_metadata كبديل
        setProfile({
          first_name: user.user_metadata?.first_name || '',
          last_name: user.user_metadata?.last_name || '',
          phone: user.user_metadata?.phone || '',
          email: user.email || ''
        });
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  const handleLogout = async () => {
    console.log("Logging out and unregistering push token...");
    
    await unregisterForPushNotificationsAsync();
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error("Error signing out:", error);
      alert('حدث خطأ أثناء تسجيل الخروج.');
    }
  };

  if (initialLoading || loadingProfile) {
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

  const fullName = profile ? `${profile.first_name} ${profile.last_name}`.trim() : 'مستخدم';
  const displayPhone = profile?.phone ? 
  profile.phone.replace(/^\+972/, '0') : // تحويل الرقم الدولي إلى محلي للعرض
    'لا يوجد رقم هاتف';

  
  return (
    <View style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* --- معلومات المستخدم --- */}
        <View style={styles.profileHeader}>
          <Text style={styles.userName}>{fullName}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          {profile?.phone && (
            <Text style={styles.userPhone}>{displayPhone}</Text>
          )}
          
        </View>

        {/* --- بطاقة طلباتي الأخيرة --- */}
        <TouchableOpacity style={styles.mainCard} onPress={() => router.push('/(tabs)/orders')}>
          <View style={styles.mainCardIconContainer}>
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
            onPress={() => router.push('/(modal)/edit-profile')}
          />
          <ProfileListItem
            icon={<Ionicons name="location-outline" size={scale(22)} color="#555" />}
            text="عناويني"
            onPress={() => router.push({
              pathname: '/(tabs)/addresses',
              params: { from: 'profile' }
            })}
          />
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

// --- التنسيقات بعد التعديل ---
const styles = StyleSheet.create({
  centered: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  container: {
    padding: scale(20),
    paddingBottom: scale(120),
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: scale(30),
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
    marginTop: scale(5),
  },
  userPhone: {
    fontSize: fontScale(14),
    color: '#666',
    marginTop: scale(3),
  },
  mainCard: {
    backgroundColor: '#fff',
    borderRadius: scale(16),
    padding: scale(20),
    flexDirection: 'row',
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
    marginEnd: scale(15),
  },
  mainCardTitle: {
    fontSize: fontScale(18),
    fontWeight: 'bold',
    color: '#333',
  },
  mainCardSubtitle: {
    fontSize: fontScale(14),
    color: '#888',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scale(15),
    paddingHorizontal: scale(20),
  },
  listItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listItemText: {
    fontSize: fontScale(16),
    fontWeight: '500',
    marginStart: scale(15),
  },
});