// lib/supabase/promotions.ts
import { supabase } from '@/lib/supabase';

// ✅ استيراد نظام المراقبة
import { useDataPerformance } from '@/hooks/useDataPerformance';

// إنشاء instance للمراقبة
let dataTracker: any = null;

// دالة لتعيين الـ tracker
export const setPromotionsTracker = (tracker: any) => {
  dataTracker = tracker;
};

export interface Promotion {
  id: number;
  created_at: string;
  title: string;
  description: string | null;
  image_url: string;
  action_type: string;
  action_value: string | null;
  is_active: boolean;
  display_order: number;
}

export const getActivePromotions = async (): Promise<Promotion[]> => {
  const startTime = Date.now();
  
  try {
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    const duration = Date.now() - startTime;
    const dataSize = JSON.stringify(data).length;

    // ✅ تتبع الأداء إذا كان الـ tracker متاح
    if (dataTracker) {
      dataTracker.trackQuery(
        ['promotions'],
        duration,
        false, // من السيرفر مباشرة
        !error,
        dataSize
      );
    }

    if (error) {
      console.error('Error fetching promotions:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // ✅ تتبع الخطأ
    if (dataTracker) {
      dataTracker.trackQuery(
        ['promotions'],
        duration,
        false,
        false
      );
    }
    
    console.error('Error fetching promotions:', error);
    return [];
  }
};