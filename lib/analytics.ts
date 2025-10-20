// مسار الملف: lib/analytics.ts
import { supabase } from './supabase';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ تعريف نوع الحدث
interface AnalyticsEvent {
  user_id: string | null;
  event_name: string;
  event_properties: any;
  device_info: string;
  session_id: string;
  backup_timestamp?: number;
}

// ✅ توليد معرف جلسة فريد
const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// ✅ الحصول على معرف الجلسة
const getSessionId = async (): Promise<string> => {
  try {
    let sessionId = await AsyncStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = generateSessionId();
      await AsyncStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  } catch (error) {
    return generateSessionId();
  }
};

// ✅ الأحداث الرئيسية
export const AnalyticsEvents = {
  // 🔥 أحداث المتجر
  APP_OPENED: 'app_opened',
  CATEGORY_SELECTED: 'category_selected',
  CATEGORY_VIEWED: 'category_viewed',
  ITEM_VIEWED: 'item_viewed',
  SEARCH_PERFORMED: 'search_performed',
  SEARCH_RESULTS: 'search_results',
  SEARCH_CACHE_HIT: 'search_cache_hit',
  SEARCH_CLEARED: 'search_cleared',
  
  // 🛒 أحداث الطلب
  CART_VIEWED: 'cart_viewed',
  ORDER_PLACED: 'order_placed',
  
  // 👤 أحداث المستخدم
  USER_SIGNED_IN: 'user_signed_in',
  
  // 📊 أحداث التحليلات والأداء
  DATA_FETCH_STARTED: 'data_fetch_started',
  DATA_FETCH_SUCCESS: 'data_fetch_success',
  CACHE_USED: 'cache_used',
  ERROR_OCCURRED: 'error_occurred',
  MANUAL_REFRESH: 'manual_refresh',
  PULL_TO_REFRESH: 'pull_to_refresh',
  
  // 🎯 أحداث التتبع
  PROMOTION_TAPPED: 'promotion_tapped',
  PROMOTIONS_VIEWED: 'promotions_viewed',
  SECTION_VIEWED: 'section_viewed',
  CATEGORY_CHANGED: 'category_changed',
  SCROLL_DEPTH: 'scroll_depth',
  NOTIFICATIONS_ACCESSED: 'notifications_accessed'
};

// ✅ الدالة الرئيسية لتسجيل الأحداث
export const trackEvent = async (eventName: string, properties: any = {}) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const sessionId = await getSessionId();

    const eventData: AnalyticsEvent = {
      user_id: user?.id || null,
      event_name: eventName,
      event_properties: {
        ...properties,
        platform: Platform.OS,
        timestamp: new Date().toISOString()
      },
      device_info: Platform.OS,
      session_id: sessionId
    };

    // ✅ إدخال البيانات في Supabase
    const { error } = await supabase
      .from('user_analytics')
      .insert(eventData);

    if (error) {
      console.error('❌ Analytics DB Error:', error);
      // ✅ نسخة احتياطية في AsyncStorage
      await saveEventToBackup(eventData);
    } else {
      console.log(`📊 Tracked: ${eventName}`, properties);
    }

  } catch (error) {
    console.error('❌ Analytics Error:', error);
  }
};

// ✅ نسخة احتياطية للأحداث
const saveEventToBackup = async (eventData: AnalyticsEvent) => {
  try {
    const backupEvents = await AsyncStorage.getItem('analytics_backup_events');
    const events: AnalyticsEvent[] = backupEvents ? JSON.parse(backupEvents) : [];
    
    const eventWithBackup: AnalyticsEvent & { backup_timestamp: number } = {
      ...eventData,
      backup_timestamp: Date.now()
    };
    
    events.push(eventWithBackup);
    
    const trimmedEvents = events.slice(-50); // حفظ آخر 50 حدث فقط
    await AsyncStorage.setItem('analytics_backup_events', JSON.stringify(trimmedEvents));
    
    console.log('💾 Event saved to backup');
  } catch (error) {
    console.error('❌ Backup save error:', error);
  }
};

// ✅ محاولة إرسال الأحداث المحفوظة - الإصدار المصحح
export const flushBackupEvents = async (): Promise<void> => {
  try {
    const backupEvents = await AsyncStorage.getItem('analytics_backup_events');
    if (backupEvents) {
      const events: AnalyticsEvent[] = JSON.parse(backupEvents);
      const successfulEvents: AnalyticsEvent[] = []; // ✅ تم تحديد النوع صراحة
      
      for (const event of events) {
        try {
          const { error } = await supabase
            .from('user_analytics')
            .insert(event);
          
          if (!error) {
            successfulEvents.push(event);
          }
        } catch (eventError) {
          console.error('❌ Error flushing single event:', eventError);
        }
      }
      
      // ✅ حذف الأحداث التي تم إرسالها بنجاح - الإصدار المصحح
      const remainingEvents = events.filter(event => 
        !successfulEvents.some(successfulEvent => 
          successfulEvent.session_id === event.session_id && 
          successfulEvent.event_name === event.event_name &&
          successfulEvent.event_properties.timestamp === event.event_properties.timestamp
        )
      );
      
      await AsyncStorage.setItem('analytics_backup_events', JSON.stringify(remainingEvents));
      
      console.log(`✅ Flushed ${successfulEvents.length} backup events, ${remainingEvents.length} remaining`);
    }
  } catch (error) {
    console.error('❌ Flush backup error:', error);
  }
};

// ✅ دالة مساعدة لتنظيف الأحداث القديمة
export const cleanupOldBackupEvents = async (maxAge: number = 1000 * 60 * 60 * 24): Promise<void> => {
  try {
    const backupEvents = await AsyncStorage.getItem('analytics_backup_events');
    if (backupEvents) {
      const events: (AnalyticsEvent & { backup_timestamp: number })[] = JSON.parse(backupEvents);
      const now = Date.now();
      const freshEvents = events.filter(event => 
        now - (event.backup_timestamp || now) < maxAge
      );
      
      if (freshEvents.length < events.length) {
        await AsyncStorage.setItem('analytics_backup_events', JSON.stringify(freshEvents));
        console.log(`🧹 Cleaned up ${events.length - freshEvents.length} old backup events`);
      }
    }
  } catch (error) {
    console.error('❌ Cleanup error:', error);
  }
};