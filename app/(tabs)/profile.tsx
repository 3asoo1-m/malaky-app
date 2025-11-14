// مسار الملف: app/(tabs)/profile.tsx

import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  ImageBackground,
} from 'react-native';
import { useAuth } from '@/lib/useAuth';
import { supabase } from '@/lib/supabase';
import CustomBottomNav from '@/components/CustomBottomNav';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { unregisterForPushNotificationsAsync } from '@/lib/notifications';
import { scale, fontScale } from '@/lib/responsive';

// ✅ تحديث واجهة Profile لتشمل بيانات الولاء والإحصائيات
interface UserProfile {
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  avatar_url?: string;
  points: number;
  loyalty_level: 'bronze' | 'silver' | 'gold' | 'platinum';
  orders_count: number;
  favorites_count: number;
}

interface UserStats {
  orders_count: number;
  favorites_count: number;
}

// مكون البطاقة المخصصة
const Card = ({ children, style }: { children: React.ReactNode; style?: any }) => (
  <View style={[styles.card, style]}>{children}</View>
);

// مكون شريط التقدم
const ProgressBar = ({ progress }: { progress: number }) => (
  <View style={styles.progressContainer}>
    <View style={[styles.progressBar, { width: `${progress}%` }]} />
  </View>
);

// مكون البادج
const Badge = ({ text, style }: { text: string; style?: any }) => (
  <View style={[styles.badge, style]}>
    <Text style={styles.badgeText}>{text}</Text>
  </View>
);

// ✅ مكون مساعد لإنشاء أزرار القائمة مع دعم علامة "قريباً" - تعريف واحد فقط
const ProfileListItem = ({ 
  icon, 
  text, 
  onPress, 
  color = '#333', 
  badge, 
  iconBgColor = '#f8f9fa',
  comingSoon = false
}: { 
  icon: React.ReactNode; 
  text: string; 
  onPress: () => void; 
  color?: string; 
  badge?: string; 
  iconBgColor?: string;
  comingSoon?: boolean;
}) => (
  <TouchableOpacity 
    style={[styles.listItem, comingSoon && styles.comingSoonItem]} 
    onPress={comingSoon ? () => {} : onPress}
    disabled={comingSoon}
  >
    <View style={styles.listItemContent}>
      <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
        {icon}
      </View>
      <Text style={[styles.listItemText, { color }, comingSoon && styles.comingSoonText]}>{text}</Text>
    </View>
    <View style={styles.listItemRight}>
      {comingSoon ? (
        <Badge text="قريباً" style={styles.comingSoonBadge} />
      ) : (
        <>
          {badge && <Badge text={badge} style={styles.listItemBadge} />}
          <Ionicons name="chevron-back-outline" size={scale(18)} color="#A0A0A0" />
        </>
      )}
    </View>
  </TouchableOpacity>
);

export default function ProfileScreen() {
  const router = useRouter();
  const { user, initialLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

// ✅ دالة محسنة لجلب الإحصائيات الحقيقية بطلب واحد
const fetchUserStats = async (userId: string): Promise<UserStats> => {
  try {
    // استخدام الدالة الشاملة التي ترجع كل الإحصائيات في طلب واحد
    const { data, error } = await supabase
      .rpc('get_user_stats', { user_id: userId })
      .single(); // ⬅️ مهم لأن الدالة ترجع row واحدة

    if (error) {
      console.log('استخدام الاستعلامات المباشرة بدلاً من RPC...', error);
      
      // استعلامات احتياطية إذا فشلت الدالة الشاملة
      const { count: ordersCount, error: ordersError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      const { count: favoritesCount, error: favoritesError } = await supabase
        .from('user_favorites')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      return {
        orders_count: ordersCount || 0,
        favorites_count: favoritesCount || 0
      };
    }

    // البيانات من الدالة الشاملة مع Type Assertion
    const stats = data as UserStats;
    
    return {
      orders_count: stats?.orders_count || 0,
      favorites_count: stats?.favorites_count || 0
    };
  } catch (error) {
    console.error('Error in fetchUserStats:', error);
    return {
      orders_count: 0,
      favorites_count: 0
    };
  }
};

  // ✅ جلب بيانات المستخدم الكاملة من جدول profiles
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        setLoadingProfile(false);
        return;
      }

      try {
        // جلب البيانات الأساسية أولاً
        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, last_name, phone, avatar_url, points, loyalty_level')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        
        if (data) {
          // ✅ جلب الإحصائيات الحقيقية واستبدال البيانات الوهمية
          const userStats = await fetchUserStats(user.id);
          
          setProfile({
            ...data,
            email: user.email,
            orders_count: userStats.orders_count, // ✅ بيانات حقيقية
            favorites_count: userStats.favorites_count, // ✅ بيانات حقيقية
          });
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // استخدام البيانات من user_metadata كبديل
        const userStats = await fetchUserStats(user.id);
        
        setProfile({
          first_name: user.user_metadata?.first_name || '',
          last_name: user.user_metadata?.last_name || '',
          phone: user.user_metadata?.phone || '',
          email: user.email || '',
          avatar_url: user.user_metadata?.avatar_url || undefined,
          points: 0,
          loyalty_level: 'bronze',
          orders_count: userStats.orders_count, // ✅ بيانات حقيقية
          favorites_count: userStats.favorites_count, // ✅ بيانات حقيقية
        });
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  const handleLogout = async () => {
    await unregisterForPushNotificationsAsync();
    await supabase.auth.signOut();
  };

  // ✅ إعدادات مستويات الولاء مع TypeScript آمن
  interface LoyaltyTier {
    name: string;
    next: string | null;
    goal: number;
    color: string;
  }

  interface LoyaltyTiers {
    bronze: LoyaltyTier;
    silver: LoyaltyTier;
    gold: LoyaltyTier;
    platinum: LoyaltyTier;
  }

  const loyaltyTiers: LoyaltyTiers = {
    bronze: { name: 'برونزي', next: 'silver', goal: 100, color: '#CD7F32' },
    silver: { name: 'فضي', next: 'gold', goal: 500, color: '#C0C0C0' },
    gold: { name: 'ذهبي', next: 'platinum', goal: 1000, color: '#FFD700' },
    platinum: { name: 'بلاتيني', next: null, goal: Infinity, color: '#E5E4E2' },
  };

  // ✅ الحصول على التيار الحالي بطريقة آمنة
  const currentTier = profile ? loyaltyTiers[profile.loyalty_level as keyof LoyaltyTiers] : loyaltyTiers.bronze;
  const nextTier = currentTier.next ? loyaltyTiers[currentTier.next as keyof LoyaltyTiers] : null;
  const loyaltyProgress = profile ? (profile.points / currentTier.goal) * 100 : 0;

  if (initialLoading || loadingProfile) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#C62828" /></View>;
  }

  if (!user || !profile) {
    return (
      <View style={styles.centered}>
        <Text>الرجاء تسجيل الدخول لعرض ملفك الشخصي.</Text>
      </View>
    );
  }

  const fullName = `${profile.first_name} ${profile.last_name}`.trim();
  const displayPhone = profile.phone ? profile.phone.replace(/^\+972/, '0') : 'لا يوجد رقم هاتف';
  const initials = (profile.first_name?.[0] || '') + (profile.last_name?.[0] || '');

  const showComingSoonAlert = (featureName: string) => {
    alert(`🚧 ${featureName} - قريباً!\n\nهذه الميزة قيد التطوير وسيتم إضافتها قريباً.`);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* الهيدر */}
        <View style={styles.header}>
          <View style={styles.headerBackground} />
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <Text style={styles.headerTitle}>الملف الشخصي</Text>
              <View style={styles.headerIcons}>
                <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/(tabs)/notifications')}>
                  <Ionicons name="notifications-outline" size={scale(20)} color="white" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/(modal)/edit-profile')}>
                  <Ionicons name="settings-outline" size={scale(20)} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.profileCardContainer}>
          <Card style={styles.profileCard}>
            <View style={styles.profileInfo}>
              <View style={styles.avatarContainer}>
                {profile.avatar_url ? (
                  <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initials.toUpperCase()}</Text>
                  </View>
                )}
              </View>
              <View style={styles.profileDetails}>
                <View style={styles.nameContainer}>
                  <Text style={styles.userName}>{fullName}</Text>
                  <FontAwesome5 name="crown" size={scale(16)} color={currentTier.color} />
                </View>
                <Text style={styles.userPhone}>{displayPhone}</Text>
                <Text style={styles.userEmail}>{profile.email}</Text>
              </View>
            </View>

            {/* ✅ بطاقة الولاء الديناميكية */}
            <View style={styles.loyaltyCard}>
              <View style={styles.loyaltyHeader}>
                <View style={styles.loyaltyIcon}>
                  <FontAwesome5 name="award" size={scale(16)} color="white" />
                </View>
                <View style={styles.loyaltyInfo}>
                  <View style={styles.loyaltyTitle}>
                    <Text style={styles.loyaltyText}>عضو {currentTier.name}</Text>
                    <FontAwesome5 name="star" size={scale(12)} color={currentTier.color} />
                  </View>
                  {nextTier ? (
                    <Text style={styles.loyaltySubtext}>
                      {profile.points} / {currentTier.goal} نقطة للمستوى {nextTier.name}
                    </Text>
                  ) : (
                    <Text style={styles.loyaltySubtext}>لقد وصلت لأعلى مستوى!</Text>
                  )}
                </View>
              </View>
              <ProgressBar progress={loyaltyProgress} />
            </View>
          </Card>
        </View>

        {/* ✅ الإحصائيات الديناميكية الحقيقية */}
        <View style={styles.statsContainer}>
          <Card style={[styles.statCard, styles.statCard1]}>
            <Text style={[styles.statNumber, styles.statNumber1]}>
              {profile.orders_count}
            </Text>
            <Text style={styles.statLabel}>الطلبات</Text>
          </Card>
          <Card style={[styles.statCard, styles.statCard3]}>
            <Text style={[styles.statNumber, styles.statNumber3]}>
              {profile.favorites_count}
            </Text>
            <Text style={styles.statLabel}>المفضلة</Text>
          </Card>
        </View>

        {/* بقية المكونات */}
        <View style={styles.promoContainer}>
          <ImageBackground
            source={{ uri: 'https://dgplcadvneqpohxqlilg.supabase.co/storage/v1/object/public/menu_image/prom.png' }}
            style={styles.promoImage}
            imageStyle={styles.promoImageStyle}
          >
            <View style={styles.promoOverlay}>
              <Badge text="عرض خاص" style={styles.promoBadge} />
              <Text style={styles.promoTitle}>احصل على خصم 20%</Text>
              <Text style={styles.promoSubtitle}>على طلبك القادم من البروست!</Text>
            </View>
          </ImageBackground>
        </View>

        <View style={styles.menuSection}>
          <Card style={styles.menuCard}>
            <ProfileListItem
              icon={<Ionicons name="person-outline" size={scale(20)} color="#6B7280" />}
              text="ملفي الشخصي" 
              onPress={() => router.push('/(modal)/edit-profile')} 
              iconBgColor="#F9FAFB"
            />
            <ProfileListItem
              icon={<MaterialCommunityIcons name="receipt-text-outline" size={scale(20)} color="#F97316" />}
              text="طلباتي" 
              onPress={() => router.push('/(tabs)/orders')}
              badge={profile.orders_count > 0 ? profile.orders_count.toString() : undefined}
              iconBgColor="#FFF7ED"
            />
            <View style={styles.separator} />
            <ProfileListItem
              icon={<Ionicons name="heart-outline" size={scale(20)} color="#EC4899" />}
              text="المفضلة" 
              onPress={() => router.push('/(tabs)/favorites')} 
              iconBgColor="#FDF2F8"
            />
            <View style={styles.separator} />
            <ProfileListItem
              icon={<Ionicons name="location-outline" size={scale(20)} color="#10B981" />}
              text="عناويني" 
              onPress={() => router.push({ pathname: '/(tabs)/addresses', params: { from: 'profile' } })} 
              iconBgColor="#ECFDF5"
            />
            <View style={styles.separator} />
            <ProfileListItem
              icon={<Ionicons name="card-outline" size={scale(20)} color="#3B82F6" />}
              text="طرق الدفع" 
              onPress={() => showComingSoonAlert('طرق الدفع')} 
              iconBgColor="#EFF6FF"
              comingSoon={true}
            />
            <View style={styles.separator} />
            <ProfileListItem
              icon={<FontAwesome5 name="gift" size={scale(18)} color="#8B5CF6" />}
              text="المكافآت والعروض" 
              onPress={() => showComingSoonAlert('المكافآت والعروض')}
              badge="2" 
              iconBgColor="#FAF5FF"
              comingSoon={true}
            />
            <View style={styles.separator} />
            <ProfileListItem
              icon={<Ionicons name="help-circle-outline" size={scale(20)} color="#14B8A6" />}
              text="المساعدة والدعم" 
              onPress={() => router.push('/(modal)/support')} 
              iconBgColor="#F0FDFA"
            />
          </Card>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>تسجيل الخروج</Text>
          <Ionicons name="log-out-outline" size={scale(20)} color="#DC2626" />
        </TouchableOpacity>

        <View style={styles.versionInfo}>
          <Text style={styles.versionText}>تطبيق الدجاج الملكي بروست • الإصدار 1.0.0</Text>
        </View>
      </ScrollView>
      <CustomBottomNav />
    </View>
  );
}

// ✅ إضافة تنسيق لصورة الأفاتار
const styles = StyleSheet.create({
  avatarImage: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    borderWidth: scale(4),
    borderColor: 'white',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingBottom: scale(120),
  },
  centered: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  
  // الهيدر
  header: {
    height: scale(180),
    position: 'relative',
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#DC2626',
    borderBottomLeftRadius: scale(30),
    borderBottomRightRadius: scale(30),
  },
  headerContent: {
    paddingHorizontal: scale(20),
    paddingTop: scale(50),
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fontScale(24),
    fontWeight: 'bold',
    color: 'white',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: scale(10),
  },
  iconButton: {
    padding: scale(8),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: scale(20),
  },

  // بطاقة الملف الشخصي
  profileCardContainer: {
    paddingHorizontal: scale(20),
    marginTop: scale(-60),
  },
  profileCard: {
    padding: scale(20),
    borderRadius: scale(20),
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(20),
  },
  avatarContainer: {
    marginLeft: scale(15),
  },
  avatar: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: scale(4),
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    fontSize: fontScale(24),
    fontWeight: 'bold',
    color: 'white',
  },
  profileDetails: {
    flex: 1,
    alignItems: 'flex-start', // ✅ يضبط المحاذاة للنصوص لليمين
  },
  nameContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: scale(8),
    marginBottom: scale(4),
  },
  userName: {
    fontSize: fontScale(20),
    fontWeight: 'bold',
    color: '#1F2937',
  },
  userPhone: {
    fontSize: fontScale(14),
    color: '#6B7280',
    marginBottom: scale(2),
    alignItems: 'center',
  },
  userEmail: {
    fontSize: fontScale(12),
    alignItems: 'center',
    color: '#9CA3AF',
  },

  // بطاقة الولاء
  loyaltyCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: scale(12),
    padding: scale(16),
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  loyaltyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(12),
  },
  loyaltyIcon: {
    backgroundColor: '#DC2626',
    padding: scale(8),
    borderRadius: scale(8),
    marginRight: scale(12),
  },
  loyaltyInfo: {
    flex: 1,
    alignItems: 'flex-start', // ✅ يضبط المحاذاة للنصوص لليمين

  },
  loyaltyTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
    marginBottom: scale(4),
  },
  loyaltyText: {
    fontSize: fontScale(14),
    fontWeight: '600',
    color: '#991B1B',
    marginRight: scale(12),

  },
  loyaltySubtext: {
    fontSize: fontScale(12),
    marginRight: scale(12),
    color: '#DC2626',
  },
  progressContainer: {
    height: scale(8),
    backgroundColor: '#FECACA',
    borderRadius: scale(4),
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#DC2626',
    borderRadius: scale(4),
  },

  // الإحصائيات
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: scale(20),
    marginTop: scale(20),
    gap: scale(10),
  },
  statCard: {
    flex: 1,
    padding: scale(16),
    borderRadius: scale(16),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statCard1: {
    backgroundColor: 'white',
  },
  statCard2: {
    backgroundColor: 'white',
  },
  statCard3: {
    backgroundColor: 'white',
  },
  statNumber: {
    fontSize: fontScale(24),
    fontWeight: 'bold',
    marginBottom: scale(4),
  },
  statNumber1: {
    color: '#DC2626',
  },
  statNumber2: {
    color: '#EA580C',
  },
  statNumber3: {
    color: '#DB2777',
  },
  statLabel: {
    fontSize: fontScale(12),
    color: '#6B7280',
  },

  // العرض الترويجي
  promoContainer: {
    paddingHorizontal: scale(20),
    marginTop: scale(20),
  },
  promoImage: {
    height: scale(120),
    borderRadius: scale(16),
    overflow: 'hidden',
  },
  promoImageStyle: {
    borderRadius: scale(16),
  },
  promoOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: scale(20),
    justifyContent: 'center',
  },
  promoBadge: {
    backgroundColor: '#DC2626',
    alignSelf: 'flex-end',
    marginBottom: scale(8),
  },
  promoTitle: {
    fontSize: fontScale(18),
    alignSelf: 'flex-start',
    fontWeight: 'bold',
    color: 'white',
    marginBottom: scale(4),
  },
  promoSubtitle: {
    alignSelf: 'flex-start',
    fontSize: fontScale(14),
    color: 'rgba(255, 255, 255, 0.9)',
  },

  // القائمة
  menuSection: {
    paddingHorizontal: scale(20),
    marginTop: scale(20),
  },
  menuCard: {
    borderRadius: scale(16),
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scale(16),
    paddingHorizontal: scale(20),
  },
  listItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    padding: scale(10),
    borderRadius: scale(12),
    marginLeft: scale(12),
  },
  listItemText: {
    fontSize: fontScale(16),
    fontWeight: '500',
    color: '#374151',
  },
  listItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  listItemBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: scale(8),
    paddingVertical: scale(2),
  },
  separator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: scale(20),
  },

  // زر تسجيل الخروج
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(8),
    marginHorizontal: scale(20),
    marginTop: scale(20),
    padding: scale(16),
    backgroundColor: 'white',
    borderRadius: scale(16),
    borderWidth: 2,
    borderColor: '#FECACA',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutText: {
    fontSize: fontScale(16),
    fontWeight: '600',
    color: '#DC2626',
  },

  // معلومات الإصدار
  versionInfo: {
    paddingHorizontal: scale(20),
    marginTop: scale(20),
    marginBottom: scale(20),
    alignItems: 'center',
  },
  versionText: {
    fontSize: fontScale(12),
    color: '#9CA3AF',
  },

  // المكونات العامة
  card: {
    backgroundColor: 'white',
    borderRadius: scale(12),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  badge: {
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(12),
    backgroundColor: '#DC2626',
  },
  badgeText: {
    fontSize: fontScale(12),
    fontWeight: '600',
    color: 'white',
  }, 
  comingSoonItem: {
    opacity: 0.6,
  },
  comingSoonText: {
    color: '#9CA3AF',
  },
  comingSoonBadge: {
    backgroundColor: '#6B7280',
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
  },
});
