// lib/api/queries.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { CategoryWithItems, Promotion } from '@/lib/types';
import { withQueryTracking } from '@/lib/query-client'; // ✅ استيراد التتبع

// 🔹 استعلامات القائمة مع "التخزين المؤقت القوي"
export const useMenuData = () => {
  return useQuery({
    queryKey: ['menu'],
    queryFn: withQueryTracking(['menu'], async (): Promise<CategoryWithItems[]> => {
      const { data, error } = await supabase.rpc('get_menu');
      if (error) throw new Error(error.message);
      return data || [];
    }),
    staleTime: 1000 * 60 * 60,      // 1 ساعة
    cacheTime: 1000 * 60 * 60 * 2,  // ساعتين
    refetchOnMount: false,          // لن يتم fetch عند mount إذا موجود في الكاش
    refetchOnWindowFocus: false,    // لن يتم fetch عند العودة للشاشة
    refetchOnReconnect: false,
    retry: 1,
  });
};

// 🔹 استعلامات العروض الترويجية
export const usePromotions = () => {
  return useQuery({
    queryKey: ['promotions'],
    queryFn: withQueryTracking(['promotions'], async (): Promise<Promotion[]> => {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      if (error) throw new Error(error.message);
      return data || [];
    }),
    staleTime: 1000 * 60 * 15,       // 15 دقيقة
    cacheTime: 1000 * 60 * 30,       // 30 دقيقة
    refetchOnWindowFocus: false,     // منع fetch عند العودة للشاشة
    retry: 2,
  });
};

// 🔹 استعلامات الإشعارات مع التتبع
export const useNotifications = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['notifications', userId],
    queryFn: withQueryTracking(['notifications', userId], async (): Promise<number> => {
      if (!userId) return 0;
      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);
      if (error) return 0;
      return count || 0;
    }),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,       // 5 دقائق
    cacheTime: 1000 * 60 * 15,      // 15 دقيقة
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};
