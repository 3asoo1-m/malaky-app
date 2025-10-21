// مسار الملف: lib/analytics.ts
import { supabase } from './supabase';
import { Platform, AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ تعريف نوع الحدث
interface AnalyticsEvent {
  user_id: string | null;
  event_name: string;
  event_properties: any;
  device_info: string;
  session_id: string;
  timestamp: string;
  backup_timestamp?: number;
}

// ✅ إعدادات الأداء المحسنة
const ANALYTICS_CONFIG = {
  BATCH_SIZE: 8,
  FLUSH_INTERVAL: 45000,
  MAX_QUEUE_SIZE: 60,
  RETRY_DELAY: 5000,
  MAX_RETRIES: 2,
};

// ✅ أحداث مهمة تستحق الإرسال الفوري
const CRITICAL_EVENTS = [
  'order_placed',
  'payment_success',
  'user_signed_in',
  'error_occurred'
];

// ✅ متغيرات عالمية
let eventQueue: AnalyticsEvent[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null; // ✅ استخدام ReturnType
let isFlushing = false;
let retryCount = 0;

// ✅ حفظ subscription لإزالتها لاحقاً
let appStateSubscription: { remove: () => void } | null = null;

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
  APP_OPENED: 'app_opened',
  CATEGORY_SELECTED: 'category_selected', 
  CATEGORY_VIEWED: 'category_viewed',
  ITEM_VIEWED: 'item_viewed',
  SEARCH_PERFORMED: 'search_performed',
  SEARCH_RESULTS: 'search_results',
  SEARCH_CACHE_HIT: 'search_cache_hit',
  SEARCH_CLEARED: 'search_cleared',
  CART_VIEWED: 'cart_viewed',
  ORDER_PLACED: 'order_placed',
  USER_SIGNED_IN: 'user_signed_in',
  DATA_FETCH_STARTED: 'data_fetch_started',
  DATA_FETCH_SUCCESS: 'data_fetch_success',
  CACHE_USED: 'cache_used',
  ERROR_OCCURRED: 'error_occurred',
  MANUAL_REFRESH: 'manual_refresh',
  PULL_TO_REFRESH: 'pull_to_refresh',
  PROMOTION_TAPPED: 'promotion_tapped',
  PROMOTIONS_VIEWED: 'promotions_viewed',
  SECTION_VIEWED: 'section_viewed',
  CATEGORY_CHANGED: 'category_changed',
  SCROLL_DEPTH: 'scroll_depth',
  NOTIFICATIONS_ACCESSED: 'notifications_accessed'
};

// ✅ التعامل مع تغيير حالة التطبيق
const handleAppStateChange = (nextAppState: AppStateStatus) => {
  if (nextAppState === 'background' && eventQueue.length > 0) {
    console.log('🔄 App background - flushing analytics');
    forceFlush();
  }
};

// ✅ بدء timer الإرسال الدوري - الإصدار المصحح
const startFlushTimer = () => {
  if (flushTimer) {
    clearInterval(flushTimer);
  }
  
  // ✅ استخدام ReturnType<typeof setInterval> بدون تحويل نوع
  flushTimer = setInterval(() => {
    if (eventQueue.length > 0 && !isFlushing) {
      flushEvents();
    }
  }, ANALYTICS_CONFIG.FLUSH_INTERVAL);
};

// ✅ تهيئة نظام التحليلات - الإصدار المصحح
export const initializeAnalytics = async () => {
  try {
    // تحميل الأحداث المحفوظة مسبقاً
    const savedQueue = await AsyncStorage.getItem('analytics_event_queue');
    if (savedQueue) {
      eventQueue = JSON.parse(savedQueue);
      console.log(`📊 Loaded ${eventQueue.length} events from storage`);
    }

    // بدء timer للإرسال الدوري
    startFlushTimer();

    // ✅ استخدام الطريقة الصحيحة لـ AppState في React Native
    appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    await flushBackupEvents();
  } catch (error) {
    console.error('❌ Analytics initialization error:', error);
  }
};

// ✅ الدالة الرئيسية المحسنة لتسجيل الأحداث
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
      session_id: sessionId,
      timestamp: new Date().toISOString()
    };

    // ✅ تحديد إذا كان الحدث مهم ويستحق الإرسال الفوري
    if (CRITICAL_EVENTS.includes(eventName)) {
      await addToQueueAndFlush(eventData);
    } else {
      addToQueue(eventData);
    }

    console.log(`📊 Queued: ${eventName}`);

  } catch (error) {
    console.error('❌ Analytics tracking error:', error);
  }
};

// ✅ إضافة للطابور مع إرسال فوري للأحداث المهمة
const addToQueueAndFlush = async (eventData: AnalyticsEvent) => {
  addToQueue(eventData);
  await forceFlush();
};

// ✅ إضافة الحدث للطابور
const addToQueue = (eventData: AnalyticsEvent) => {
  if (eventQueue.length >= ANALYTICS_CONFIG.MAX_QUEUE_SIZE) {
    eventQueue = eventQueue.slice(-ANALYTICS_CONFIG.MAX_QUEUE_SIZE + 1);
  }

  eventQueue.push(eventData);
  saveQueueToStorage();

  // إرسال إذا وصلنا للحد المطلوب
  if (eventQueue.length >= ANALYTICS_CONFIG.BATCH_SIZE && !isFlushing) {
    flushEvents();
  }
};

// ✅ حفظ الطابور في التخزين المحلي
const saveQueueToStorage = async () => {
  try {
    await AsyncStorage.setItem('analytics_event_queue', JSON.stringify(eventQueue));
  } catch (error) {
    console.error('❌ Error saving event queue:', error);
  }
};

// ✅ إرسال الأحداث المجمعة
const flushEvents = async (): Promise<boolean> => {
  if (isFlushing || eventQueue.length === 0) {
    return false;
  }

  isFlushing = true;
  const eventsToSend = [...eventQueue];

  try {
    const { error } = await supabase
      .from('user_analytics')
      .insert(eventsToSend);

    if (error) {
      console.error('❌ Analytics batch insert error:', error);
      
      if (retryCount < ANALYTICS_CONFIG.MAX_RETRIES) {
        retryCount++;
        setTimeout(() => {
          isFlushing = false;
          flushEvents();
        }, ANALYTICS_CONFIG.RETRY_DELAY * retryCount);
        return false;
      } else {
        await saveEventsToBackup(eventsToSend);
        eventQueue = [];
        await saveQueueToStorage();
      }
    } else {
      console.log(`✅ Sent ${eventsToSend.length} analytics events`);
      eventQueue = eventQueue.slice(eventsToSend.length);
      await saveQueueToStorage();
      retryCount = 0;
    }

    isFlushing = false;
    return true;

  } catch (error) {
    console.error('❌ Flush events error:', error);
    isFlushing = false;
    return false;
  }
};

// ✅ إرسال فوري
export const forceFlush = async (): Promise<boolean> => {
  console.log('🔄 Force flushing analytics...');
  return await flushEvents();
};

// ✅ نسخة احتياطية للأحداث
const saveEventsToBackup = async (events: AnalyticsEvent[]) => {
  try {
    const backupEvents = await AsyncStorage.getItem('analytics_backup_events');
    const existingEvents: AnalyticsEvent[] = backupEvents ? JSON.parse(backupEvents) : [];
    
    const eventsWithBackup = events.map(event => ({
      ...event,
      backup_timestamp: Date.now()
    }));
    
    const allEvents = [...existingEvents, ...eventsWithBackup];
    const trimmedEvents = allEvents.slice(-100);
    await AsyncStorage.setItem('analytics_backup_events', JSON.stringify(trimmedEvents));
    
    console.log(`💾 Saved ${events.length} events to backup`);
  } catch (error) {
    console.error('❌ Backup save error:', error);
  }
};

// ✅ محاولة إرسال الأحداث المحفوظة
export const flushBackupEvents = async (): Promise<void> => {
  try {
    const backupEvents = await AsyncStorage.getItem('analytics_backup_events');
    if (!backupEvents) return;

    const events: AnalyticsEvent[] = JSON.parse(backupEvents);
    if (events.length === 0) return;

    const { error } = await supabase
      .from('user_analytics')
      .insert(events);

    if (!error) {
      await AsyncStorage.removeItem('analytics_backup_events');
      console.log(`✅ Flushed ${events.length} backup events`);
    }
  } catch (error) {
    console.error('❌ Flush backup error:', error);
  }
};

// ✅ تنظيف الموارد - الإصدار المصحح
export const cleanupAnalytics = () => {
  // ✅ تنظيف الـ timer
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
  
  // ✅ إزالة subscription باستخدام الطريقة الصحيحة
  if (appStateSubscription) {
    appStateSubscription.remove();
    appStateSubscription = null;
  }
};

// ✅ تنظيف الأحداث القديمة
export const cleanupOldBackupEvents = async (maxAge: number = 1000 * 60 * 60 * 24 * 7): Promise<void> => {
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