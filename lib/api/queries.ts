// lib/api/queries.ts
import { useQuery } from '@tanstack/react-query'; // ملاحظة: لا نحتاج useMutation أو useQueryClient هنا
import { supabase } from '@/lib/supabase';
import { CategoryWithItems, Promotion } from '@/lib/types';

// 🔹 استعلامات القائمة مع "التخزين المؤقت القوي"
export const useMenuData = () => {
  return useQuery({
    queryKey: ['menu'],
    queryFn: async (): Promise<CategoryWithItems[]> => {
      try {
        console.log('🔄 (Menu) Fetching data from Supabase...');
        const { data, error } = await supabase.rpc('get_menu');
        
        if (error) {
          console.error('❌ Error fetching menu:', error);
          throw new Error(`Failed to fetch menu: ${error.message}`);
        }
        
        console.log('✅ (Menu) Data fetched successfully:', data?.length || 0, 'items');
        return data || [];
      } catch (error) {
        console.error('❌ Unexpected error fetching menu:', error);
        throw error;
      }
    },
    // --- ✅ التحسينات هنا ---
    staleTime: 1000 * 60 * 60, // 1 ساعة: لا تطلب البيانات مرة أخرى لمدة ساعة كاملة.
    gcTime: 1000 * 60 * 90,    // 90 دقيقة: احتفظ بالبيانات في الكاش لمدة 90 دقيقة حتى لو لم تكن مستخدمة.
    refetchOnWindowFocus: false, // لا تقم بإعادة الجلب عند عودة المستخدم للتطبيق.
    retry: 1, // حاول مرة واحدة فقط في حالة الفشل.
  });
};

// 🔹 استعلامات العروض الترويجية
export const usePromotions = () => {
  return useQuery({
    queryKey: ['promotions'],
    queryFn: async (): Promise<Promotion[]> => {
      try {
        console.log('🔄 (Promotions) Fetching data from Supabase...');
        const { data, error } = await supabase
          .from('promotions')
          .select('*')
          .eq('is_active', true)
          .order('display_order');
        
        if (error) {
          console.error('❌ Error fetching promotions:', error);
          throw new Error(`Failed to fetch promotions: ${error.message}`);
        }
        
        console.log('✅ (Promotions) Data fetched successfully!');
        return data || [];
      } catch (error) {
        console.error('❌ Unexpected error fetching promotions:', error);
        throw error;
      }
    },
    // --- ✅ التحسينات هنا ---
    staleTime: 1000 * 60 * 15, // 15 دقيقة: العروض قد تتغير بشكل أسرع من القائمة.
    refetchOnWindowFocus: true, // من الجيد تحديث العروض عند عودة المستخدم.
    retry: 2,
  });
};

// 🔹 استعلامات الإشعارات (الكود الحالي ممتاز ولا يحتاج تعديل)
export const useNotifications = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['notifications', userId],
    queryFn: async (): Promise<number> => {
      if (!userId) return 0;
      
      try {
        const { count, error } = await supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('is_read', false);
        
        if (error) {
          console.error('❌ Error fetching notifications:', error);
          return 0;
        }
        
        return count || 0;
      } catch (error) {
        console.error('❌ Unexpected error fetching notifications:', error);
        return 0;
      }
    },
    enabled: !!userId,
    // الإشعارات يجب أن تكون محدثة دائمًا، لذلك نترك staleTime الافتراضي (0)
    // وهذا يعني أنه سيتم إعادة جلبها في الخلفية عند الحاجة.
  });
};

// 🔹 دالة مساعدة للتحقق من اتصال الإنترنت
export const checkInternetConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch('https://www.google.com', { 
      method: 'HEAD',
      cache: 'no-cache'
    });
    return response.ok;
  } catch (error) {
    console.log('❌ لا يوجد اتصال بالإنترنت');
    return false;
  }
};