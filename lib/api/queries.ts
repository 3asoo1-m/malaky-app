import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { CategoryWithItems, Promotion } from '@/lib/types';
import { withQueryTracking } from '@/lib/query-client';

// 🔹 القائمة الكاملة بدون Pagination
export const useMenuData = () => {
  return useQuery({
    queryKey: ['menu'], // ✅ إزالة limit و offset من queryKey
    queryFn: withQueryTracking(['menu'], async (): Promise<CategoryWithItems[]> => {
      try {
        console.log('🔄 (Menu) Fetching all menu data...');
        
        // ✅ إزالة limit و offset من الـ RPC call
        const { data, error } = await supabase.rpc('get_all_menu');

        if (error) {
          console.error('❌ Error fetching menu:', error);
          throw new Error(`Failed to fetch menu: ${error.message}`);
        }
        
        console.log(`✅ (Menu) Fetched ${data?.length || 0} categories with items`);
        return data || [];
      } catch (error) {
        console.error('❌ Unexpected error fetching menu:', error);
        throw error;
      }
    }),
    staleTime: 1000 * 60 * 60, // 1 ساعة
    gcTime: 1000 * 60 * 90,    // 90 دقيقة
  });
};

// 🔹 دالة مساعدة للتحقق من وجود المزيد من البيانات (أصبحت غير ضرورية)
// يمكنك حذفها أو الاحتفاظ بها للمستقبل
export const useMenuTotalCount = () => {
  return useQuery({
    queryKey: ['menu-total-count'],
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from('menu_items')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (error) {
        console.error('❌ Error fetching menu count:', error);
        return 0;
      }
      
      return count || 0;
    },
  });
};

// 🔹 العروض الترويجية (باقي كما هو)
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
      console.log('✅ (Promotions) Data fetched successfully!');
      return data || [];
    }),
    staleTime: 1000 * 60 * 15,
  });
};

// 🔹 الإشعارات (باقي كما هو)
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
  });
};