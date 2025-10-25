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
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';
import { Ionicons } from '@expo/vector-icons';

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
      router.back();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('خطأ', 'فشل في تحديث الملف الشخصي');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* الهيدر */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تعديل الملف الشخصي</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* نموذج التعديل */}
        <View style={styles.form}>
          {/* الاسم الأول */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>الاسم الأول *</Text>
            <TextInput
              style={styles.input}
              value={profile.first_name}
              onChangeText={(text) => setProfile({ ...profile, first_name: text })}
              placeholder="أدخل اسمك الأول"
              placeholderTextColor="#999"
            />
          </View>

          {/* اسم العائلة */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>اسم العائلة *</Text>
            <TextInput
              style={styles.input}
              value={profile.last_name}
              onChangeText={(text) => setProfile({ ...profile, last_name: text })}
              placeholder="أدخل اسم العائلة"
              placeholderTextColor="#999"
            />
          </View>

          {/* البريد الإلكتروني (للعرض فقط) */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>البريد الإلكتروني</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={profile.email}
              editable={false}
              placeholderTextColor="#999"
            />
            <Text style={styles.note}>لا يمكن تعديل البريد الإلكتروني</Text>
          </View>

          {/* رقم الهاتف */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>رقم الهاتف</Text>
            <TextInput
              style={styles.input}
              value={profile.phone}
              onChangeText={(text) => setProfile({ ...profile, phone: text })}
              placeholder="أدخل رقم هاتفك"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
            />
          </View>

          {/* زر الحفظ */}
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.disabledButton]}
            onPress={handleUpdateProfile}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>حفظ التغييرات</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'right',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    textAlign: 'right',
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    color: '#666',
  },
  note: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    textAlign: 'right',
  },
  saveButton: {
    backgroundColor: '#C62828',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: '#BDBDBD',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});