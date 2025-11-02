// مسار الملف hooks/useGuestAnalytics.ts

import { useEffect } from 'react';
import { 
  trackEvent, 
  trackGuestEvent, 
  getGuestStatus,
  GuestAnalyticsEvents 
} from '@/lib/analytics';

// Hook لتتبع مشاهدات الصفحات
export const useGuestAnalytics = (pageName: string, additionalProps: any = {}) => {
  useEffect(() => {
    const trackPageView = async () => {
      await trackEvent('page_view', {
        page_name: pageName,
        ...additionalProps
      });
    };

    trackPageView();
  }, [pageName, additionalProps]);
};

// Hook لتتبع الأحداث العامة
export const useEventTracker = () => {
  const track = async (eventName: string, eventProperties?: any) => {
    await trackEvent(eventName, eventProperties);
  };

  return { track };
};

// Hook لتتبع أحداث الضيوف بشكل خاص
export const useGuestEventTracker = () => {
  const trackGuest = async (eventName: string, eventProperties?: any) => {
    await trackGuestEvent(eventName, eventProperties);
  };

  return { trackGuest };
};

// Hook للتحقق من حالة الضيف وإجراءات الترقية
export const useGuestStatus = () => {
  const checkGuestStatus = async () => {
    return await getGuestStatus();
  };

  const trackUpgradeAttempt = async (source: string) => {
    await trackGuestEvent(GuestAnalyticsEvents.GUEST_UPGRADE_ATTEMPT, {
      upgrade_source: source,
      timestamp: new Date().toISOString()
    });
  };

  const trackUpgradeDelayed = async (source: string) => {
    await trackGuestEvent(GuestAnalyticsEvents.GUEST_UPGRADE_DELAYED, {
      upgrade_source: source,
      timestamp: new Date().toISOString()
    });
  };

  return { 
    checkGuestStatus, 
    trackUpgradeAttempt, 
    trackUpgradeDelayed 
  };
};