// app/(modal)/edit-profile.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { scale, fontScale } from '@/lib/responsive';

export default function EditProfileModal() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
  });

  // جلب بيانات البروفايل
  useEffect(() => {
    fetchUserProfile();
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, phone')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          phone: data.phone || '',
          email: user.email || '',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    if (!profile.first_name.trim() || !profile.last_name.trim()) {
      Alert.alert('خطأ', 'الاسم الأول واسم العائلة مطلوبان');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: profile.first_name.trim(),
          last_name: profile.last_name.trim(),
          full_name: `${profile.first_name.trim()} ${profile.last_name.trim()}`,
          phone: profile.phone.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      Alert.alert('نجاح', 'تم تحديث الملف الشخصي بنجاح');
      router.navigate('/(tabs)/profile');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('خطأ', 'فشل في تحديث الملف الشخصي');
    } finally {
      setLoading(false);
    }
  };

  // الحصول على الأحرف الأولى من الاسم
  const getInitials = () => {
    const first = profile.first_name?.[0] || '';
    const last = profile.last_name?.[0] || '';
    return (first + last).toUpperCase() || 'U';
  };

  return (
    <View style={styles.container}>
      {/* الهيدر مع التدرج اللوني */}
      <LinearGradient
        colors={['#DC2626', '#DC2626', '#B91C1C']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* العناصر الزخرفية */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
        
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => router.navigate('/(tabs)/profile')} 
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={scale(20)} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>تعديل الملف الشخصي</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* قسم صورة البروفايل */}
        <View style={styles.profileSection}>
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={['#EF4444', '#DC2626']}
                style={styles.avatarGradient}
              >
                <Text style={styles.avatarText}>{getInitials()}</Text>
              </LinearGradient>
              <TouchableOpacity style={styles.cameraButton}>
                <Ionicons name="camera" size={scale(16)} color="white" />
              </TouchableOpacity>
            </View>
            <Text style={styles.avatarHint}>انقر لتغيير صورة الملف الشخصي</Text>
          </View>
        </View>

        {/* نموذج المعلومات الشخصية */}
        <View style={styles.formSection}>
          <View style={styles.formCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person" size={scale(18)} color="#DC2626" />
              <Text style={styles.sectionTitle}>المعلومات الشخصية</Text>
            </View>

            <View style={styles.inputsContainer}>
              {/* الاسم الأول */}
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>
                  الاسم الأول <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={scale(18)} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={profile.first_name}
                    onChangeText={(text) => setProfile({ ...profile, first_name: text })}
                    placeholder="أدخل اسمك الأول"
                    placeholderTextColor="#9CA3AF"
                    textAlign="right"
                  />
                </View>
              </View>

              {/* اسم العائلة */}
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>
                  اسم العائلة <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={scale(18)} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={profile.last_name}
                    onChangeText={(text) => setProfile({ ...profile, last_name: text })}
                    placeholder="أدخل اسم العائلة"
                    placeholderTextColor="#9CA3AF"
                    textAlign="right"
                  />
                </View>
              </View>

              {/* البريد الإلكتروني */}
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>
                  البريد الإلكتروني <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={scale(18)} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.disabledInput]}
                    value={profile.email}
                    editable={false}
                    placeholderTextColor="#9CA3AF"
                    textAlign="right"
                  />
                </View>
                <Text style={styles.inputHint}>لا يمكن تعديل البريد الإلكتروني</Text>
              </View>

              {/* رقم الهاتف */}
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>
                  رقم الهاتف <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="call-outline" size={scale(18)} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={profile.phone}
                    onChangeText={(text) => setProfile({ ...profile, phone: text })}
                    placeholder="أدخل رقم هاتفك"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                    textAlign="left"
                  />
                </View>
                <Text style={styles.inputHint}>للتحديثات الخاصة بالطلبات وتنسيق التوصيل</Text>
              </View>
            </View>
          </View>
        </View>

        {/* بطاقة المعلومات */}
        <View style={styles.infoCard}>
          <LinearGradient
            colors={['#EFF6FF', '#F0F9FF']}
            style={styles.infoCardGradient}
          >
            <View style={styles.infoContent}>
              <Ionicons name="information-circle" size={scale(18)} color="#2563EB" />
              <View style={styles.infoTexts}>
                <Text style={styles.infoTitle}>حافظ على معلوماتك محدثة</Text>
                <Text style={styles.infoDescription}>
                  تأكد من دقة معلومات الاتصال الخاصة بك لتلقي تحديثات الطلبات المهمة.
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* أزرار الإجراء */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => router.navigate('/(tabs)/profile')}
          >
            <Text style={styles.cancelButtonText}>إلغاء</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.disabledButton]}
            onPress={handleUpdateProfile}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="save-outline" size={scale(18)} color="white" />
                <Text style={styles.saveButtonText}>حفظ التغييرات</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* مسافة إضافية في الأسفل */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  // الهيدر
  headerGradient: {
    height: scale(160),
    borderBottomLeftRadius: scale(30),
    borderBottomRightRadius: scale(30),
    overflow: 'hidden',
    position: 'relative',
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -scale(80),
    right: -scale(80),
    width: scale(200),
    height: scale(200),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: scale(100),
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -scale(60),
    left: -scale(60),
    width: scale(150),
    height: scale(150),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: scale(75),
  },
  headerContent: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingTop: scale(60),
    paddingBottom: scale(20),
  },
  backButton: {
    padding: scale(8),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: scale(20),
    marginLeft: scale(10),
  },
  headerTitle: {
    fontSize: fontScale(20),
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  // المحتوى
  scrollView: {
    flex: 1,
    marginTop: scale(-40),
  },
  // قسم البروفايل
  profileSection: {
    paddingHorizontal: scale(20),
    marginBottom: scale(16),
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: scale(20),
    padding: scale(20),
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
  avatarContainer: {
    position: 'relative',
    marginBottom: scale(12),
  },
  avatarGradient: {
    width: scale(100),
    height: scale(100),
    borderRadius: scale(50),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarText: {
    fontSize: fontScale(32),
    fontWeight: 'bold',
    color: 'white',
  },
  cameraButton: {
    position: 'absolute',
    bottom: scale(0),
    right: scale(0),
    backgroundColor: '#DC2626',
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  avatarHint: {
    fontSize: fontScale(12),
    color: '#6B7280',
    textAlign: 'center',
  },
  // نموذج المعلومات
  formSection: {
    paddingHorizontal: scale(20),
    marginBottom: scale(16),
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: scale(20),
    padding: scale(20),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(20),
    gap: scale(8),
  },
  sectionTitle: {
    fontSize: fontScale(16),
    fontWeight: '600',
    color: '#1F2937',
  },
  inputsContainer: {
    gap: scale(20),
  },
  inputWrapper: {
    gap: scale(8),
  },
  label: {
    fontSize: fontScale(14),
    fontWeight: '600',
    color: '#374151',
    textAlign: 'left',
  },
  required: {
    color: '#DC2626',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: scale(12),
    paddingHorizontal: scale(16),
  },
  inputIcon: {
    marginLeft: scale(12),
  },
  input: {
    flex: 1,
    paddingVertical: scale(14),
    fontSize: fontScale(16),
    color: '#1F2937',
    textAlign: 'right',
  },
  disabledInput: {
    backgroundColor: '#F9FAFB',
    color: '#6B7280',
  },
  inputHint: {
    fontSize: fontScale(12),
    color: '#6B7280',
    textAlign: 'left',
    marginTop: scale(4),
  },
  // بطاقة المعلومات
  infoCard: {
    paddingHorizontal: scale(20),
    marginBottom: scale(20),
  },
  infoCardGradient: {
    borderRadius: scale(16),
    padding: scale(16),
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: scale(12),
  },
  infoTexts: {
    flex: 1,
  },
  infoTitle: {
    fontSize: fontScale(14),
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: scale(4),
    textAlign: 'left',
  },
  infoDescription: {
    fontSize: fontScale(12),
    color: '#374151',
    lineHeight: scale(18),
    textAlign: 'left',
  },
  // أزرار الإجراء
  actionsContainer: {
    flexDirection: 'row',
    gap: scale(12),
    paddingHorizontal: scale(20),
    marginBottom: scale(20),
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: scale(14),
    paddingVertical: scale(16),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelButtonText: {
    fontSize: fontScale(16),
    fontWeight: '600',
    color: '#374151',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#DC2626',
    borderRadius: scale(14),
    paddingVertical: scale(16),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: scale(8),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    fontSize: fontScale(16),
    fontWeight: '600',
    color: 'white',
  },
  // مسافة إضافية
  bottomSpacing: {
    height: scale(20),
  },
});