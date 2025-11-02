// مسار الملف: lib/analytics.ts
import { supabase } from './supabase';
import { Platform, AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ تعريف نوع الحدث
interface AnalyticsEvent {
  user_id?: string | null;
  event_name: string;
  event_properties?: any;
  device_info?: string;
  session_id?: string;
  timestamp?: string;
  guest_user_id?: string;
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
  'error_occurred',
  'guest_signup',
  'guest_conversion'
];

// ✅ متغيرات عالمية
let eventQueue: AnalyticsEvent[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;
let isFlushing = false;
let retryCount = 0;
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

// ✅ الحصول على حالة الضيف
export const getGuestStatus = async (): Promise<{
  isGuest: boolean;
  guestSessionId: string | null;
  guestUserId: string | null;
}> => {
  try {
    const isGuest = await AsyncStorage.getItem('isGuest');
    const guestSessionId = await AsyncStorage.getItem('guestSessionId');
    const guestUserId = await AsyncStorage.getItem('guestUserId');
    
    return {
      isGuest: isGuest === 'true',
      guestSessionId,
      guestUserId
    };
  } catch (error) {
    console.error('Error getting guest status:', error);
    return { isGuest: false, guestSessionId: null, guestUserId: null };
  }
};

// ✅ الحصول على معلومات المستخدم الحالي - متوافقة مع النظام الهجين
const getCurrentUserInfo = async (): Promise<{
  user_id: string | null;
  is_guest: boolean;
  guest_user_id: string | null;
  guest_session_id: string | null;
}> => {
  try {
    // 1. التحقق من المستخدم المسجل أولاً
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      return {
        user_id: user.id,
        is_guest: false,
        guest_user_id: null,
        guest_session_id: null
      };
    }
    
    // 2. إذا مافي مستخدم، نجيب بيانات الضيف من النظام الهجين
    const guestData = await AsyncStorage.getItem('guest_user');
    
    if (guestData) {
      const guest = JSON.parse(guestData);
      return {
        user_id: null,
        is_guest: true,
        guest_user_id: guest.id, // ✅ آيدي الضيف من النظام الهجين
        guest_session_id: guest.session_id
      };
    }
    
    // 3. إذا مافي ضيف ولا مستخدم
    return {
      user_id: null,
      is_guest: false,
      guest_user_id: null,
      guest_session_id: null
    };
    
  } catch (error) {
    console.error('Error getting user info:', error);
    return { 
      user_id: null, 
      is_guest: false, 
      guest_user_id: null,
      guest_session_id: null
    };
  }
};

// ✅ الحصول على معلومات الجهاز
const getDeviceInfo = (): any => {
  return {
    platform: Platform.OS,
    version: Platform.Version,
  };
};

// ✅ دالة مساعدة لتحويل device_info إلى نص
const getDeviceInfoAsString = (): string => {
  const deviceInfo = getDeviceInfo();
  return JSON.stringify(deviceInfo);
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

// ✅ أحداث خاصة بالضيوف في النظام الهجين
export const GuestAnalyticsEvents = {
  // الأحداث الأساسية
  GUEST_SESSION_START: 'guest_session_start',
  GUEST_SESSION_END: 'guest_session_end',
  GUEST_CONVERSION: 'guest_conversion',
  
  // ✅ أحداث جديدة خاصة بالنظام الهجين
  GUEST_CART_CREATED: 'guest_cart_created',
  GUEST_ORDER_ATTEMPT: 'guest_order_attempt',
  GUEST_UPGRADE_PROMPT: 'guest_upgrade_prompt',
  GUEST_DATA_MIGRATED: 'guest_data_migrated',
  GUEST_UPGRADE_DELAYED: 'guest_upgrade_delayed'
};

// ✅ التعامل مع تغيير حالة التطبيق
const handleAppStateChange = (nextAppState: AppStateStatus) => {
  if (nextAppState === 'background' && eventQueue.length > 0) {
    console.log('🔄 App background - flushing analytics');
    forceFlush();
  }
};

// ✅ بدء timer الإرسال الدوري
const startFlushTimer = () => {
  if (flushTimer) {
    clearInterval(flushTimer);
  }
  
  flushTimer = setInterval(() => {
    if (eventQueue.length > 0 && !isFlushing) {
      flushEvents();
    }
  }, ANALYTICS_CONFIG.FLUSH_INTERVAL);
};

// ✅ تنظيف جلسات الضيوف القديمة
export const cleanupOldGuestSessions = async (maxAge: number = 1000 * 60 * 60 * 24): Promise<void> => {
  try {
    const guestLoginTime = await AsyncStorage.getItem('guestLoginTime');
    
    if (guestLoginTime) {
      const sessionAge = Date.now() - new Date(guestLoginTime).getTime();
      
      if (sessionAge > maxAge) {
        console.log('🧹 Cleaning up old guest session');
        await endGuestSession();
      }
    }
  } catch (error) {
    console.error('❌ Guest session cleanup error:', error);
  }
};

// ✅ تعريف وتصدير fallbackAnalytics
export const fallbackAnalytics = {
  startGuestSession: async (userId: string) => {
    const sessionId = `guest_${userId}_${Date.now()}`;
    await AsyncStorage.setItem('guestSessionId', sessionId);
    return sessionId;
  },
  trackEvent: async (eventName: string, properties: any) => {
    console.log(`[Fallback Analytics] ${eventName}:`, properties);
  }
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

// ✅ الدالة الرئيسية المحسنة للنظام الهجين
export const trackEvent = async (eventName: string, properties: any = {}) => {
  try {
    const userInfo = await getCurrentUserInfo();
    const sessionId = await getSessionId();
    
    const event: AnalyticsEvent = {
      event_name: eventName,
      event_properties: properties,
      session_id: sessionId,
      device_info: getDeviceInfoAsString(),
      timestamp: new Date().toISOString(),
    };

    // ✅ إضافة user_id للمستخدمين المسجلين
    if (userInfo.user_id) {
      event.user_id = userInfo.user_id;
    }

    // ✅ إضافة بيانات الضيف للنظام الهجين
    if (userInfo.is_guest && userInfo.guest_user_id) {
      event.guest_user_id = userInfo.guest_user_id;
      event.event_properties = {
        ...properties,
        guest_session_id: userInfo.guest_session_id,
        is_guest: true,
        guest_system: 'hybrid' // ✅ تمييز أن الضيف من النظام الهجين
      };
    }

    addToQueue(event);

    // ✅ الإرسال الفوري للأحداث المهمة
    if (CRITICAL_EVENTS.includes(eventName)) {
      await forceFlush();
    }

  } catch (error) {
    console.error('❌ Track event error:', error);
  }
};

// ✅ دالة خاصة بتسجيل أحداث الضيوف
export const trackGuestEvent = async (eventName: string, properties: any = {}) => {
  const guestData = await AsyncStorage.getItem('guest_user');
  
  if (!guestData) {
    console.log('⚠️ No guest session found');
    return trackEvent(eventName, properties);
  }

  const guest = JSON.parse(guestData);
  
  return trackEvent(eventName, {
    ...properties,
    guest_specific: true,
    guest_user_id: guest.id,
    guest_session_id: guest.session_id,
    guest_system: 'hybrid'
  });
};

// ✅ دالة خاصة بتسجيل بدء جلسة الضيف
export const trackGuestSessionStart = async (guestData: any) => {
  await trackEvent(GuestAnalyticsEvents.GUEST_SESSION_START, {
    guest_user_id: guestData.id,
    guest_session_id: guestData.session_id,
    system_type: 'hybrid',
    device_info: guestData.device_info,
    session_start_time: guestData.created_at
  });
};

// ✅ دالة خاصة بتسجيل تحويل الضيف (تعريف واحد فقط)
export const trackGuestConversion = async (guestId: string, newUserId: string, migrationData: any = {}) => {
  await trackEvent(GuestAnalyticsEvents.GUEST_CONVERSION, {
    old_guest_user_id: guestId,
    new_user_id: newUserId,
    migration_success: true,
    migrated_data: migrationData,
    conversion_timestamp: new Date().toISOString()
  });

  console.log('🎯 Guest conversion tracked:', newUserId);
};

// ✅ دالة لبدء جلسة ضيف في النظام الهجين
export const startGuestSession = async (guestData: any) => {
  // حفظ بيانات الجلسة
  await AsyncStorage.setItem('guest_user', JSON.stringify(guestData));
  
  // تسجيل بدء الجلسة في التحليلات
  await trackGuestSessionStart(guestData);

  console.log('🎯 Guest session started (Hybrid):', guestData.id);
  return guestData.id;
};

// ✅ دالة لإنهاء جلسة ضيف
export const endGuestSession = async () => {
  const guestData = await AsyncStorage.getItem('guest_user');
  
  if (guestData) {
    const guest = JSON.parse(guestData);
    await trackGuestEvent(GuestAnalyticsEvents.GUEST_SESSION_END, {
      session_duration: Date.now() - new Date(guest.created_at).getTime()
    });

    // تنظيف بيانات الضيف
    await AsyncStorage.removeItem('guest_user');
    console.log('🎯 Guest session ended');
  }
};

// ✅ تهيئة نظام التحليلات
export const initializeAnalytics = async () => {
  try {
    // تحميل الأحداث المحفوظة مسبقاً
    const savedQueue = await AsyncStorage.getItem('analytics_event_queue');
    if (savedQueue) {
      eventQueue = JSON.parse(savedQueue);
      console.log(`📊 Loaded ${eventQueue.length} events from storage`);
    }

    // تنظيف الجلسات القديمة
    await cleanupOldGuestSessions();

    // بدء timer للإرسال الدوري
    startFlushTimer();

    // إعداد listener لحالة التطبيق
    appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    await flushBackupEvents();
  } catch (error) {
    console.error('❌ Analytics initialization error:', error);
  }
};

// ✅ تنظيف الموارد
export const cleanupAnalytics = () => {
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
  
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
      const events: (AnalyticsEvent & { backup_timestamp?: number })[] = JSON.parse(backupEvents);
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