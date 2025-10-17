// 📁 hooks/useAppConfig.ts
import { useState, useEffect } from 'react';
import { AppState, Platform, Linking } from 'react-native';
import { supabase } from '@/lib/supabase';
import { AppConfig, defaultAppConfig } from '@/lib/app-config';
import Constants from 'expo-constants';

export const useAppConfig = () => {
  const [appConfig, setAppConfig] = useState<AppConfig>(defaultAppConfig);
  const [loading, setLoading] = useState(true);
  const [showMaintenance, setShowMaintenance] = useState(false);
  const [showForceUpdate, setShowForceUpdate] = useState(false);
  const [showOptionalUpdate, setShowOptionalUpdate] = useState(false);

  const currentVersion = Constants.expoConfig?.version || '1.0.0';

  // دالة لمقارنة الإصدارات
  const compareVersions = (version1: string, version2: string): number => {
    const v1 = version1.split('.').map(Number);
    const v2 = version2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
      const num1 = v1[i] || 0;
      const num2 = v2[i] || 0;
      
      if (num1 > num2) return 1;
      if (num1 < num2) return -1;
    }
    return 0;
  };

  useEffect(() => {
    const fetchAppConfig = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('app_config')
          .select('*')
          .eq('id', 1)
          .single();

        if (!error && data) {
          setAppConfig(data);
          
          // التحقق من وضع الصيانة
          if (data.is_under_maintenance) {
            setShowMaintenance(true);
            return;
          }
          
          // التحقق من التحديث الإجباري
          if (data.force_update_version && compareVersions(currentVersion, data.force_update_version) < 0) {
            setShowForceUpdate(true);
            return;
          }
          
          // التحقق من التحديث الاختياري
          if (data.latest_version && compareVersions(currentVersion, data.latest_version) < 0) {
            setShowOptionalUpdate(true);
          }
        }
      } catch (error) {
        console.error('خطأ في جلب إعدادات التطبيق:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppConfig();

    // الاستماع لتغير حالة التطبيق
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        fetchAppConfig(); // إعادة التحقق عند فتح التطبيق
      }
    });

    return () => subscription.remove();
  }, [currentVersion]);

  const handleUpdate = () => {
    const storeUrl = Platform.OS === 'ios' 
      ? appConfig.store_links?.ios 
      : appConfig.store_links?.android;
    
    if (storeUrl) {
      Linking.openURL(storeUrl);
    }
  };

  const dismissOptionalUpdate = () => {
    setShowOptionalUpdate(false);
  };

  return {
    appConfig,
    loading,
    showMaintenance,
    showForceUpdate,
    showOptionalUpdate,
    handleUpdate,
    dismissOptionalUpdate,
    currentVersion
  };
};