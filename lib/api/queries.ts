// lib/api/queries.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { CategoryWithItems, Promotion } from '@/lib/types';

// 🔹 استعلامات القائمة مع معالجة أخطاء محسنة
export const useMenuData = () => {
  return useQuery({
    queryKey: ['menu'],
    queryFn: async (): Promise<CategoryWithItems[]> => {
      try {
        console.log('🔄 جاري تحميل بيانات القائمة...');
        const { data, error } = await supabase.rpc('get_menu');
        
        if (error) {
          console.error('❌ خطأ في تحميل القائمة:', error);
          throw new Error(`فشل تحميل القائمة: ${error.message}`);
        }
        
        console.log('✅ تم تحميل بيانات القائمة بنجاح:', data?.length || 0, 'عنصر');
        return data || [];
      } catch (error) {
        console.error('❌ خطأ غير متوقع في تحميل القائمة:', error);
        throw error;
      }
    },
    retry: 2, // إعادة المحاولة مرتين
    retryDelay: 1000, // انتظر ثانية بين المحاولات
    staleTime: 1000 * 60 * 5, // 5 دقائق قبل اعتبار البيانات قديمة
  });
};

// 🔹 استعلامات الترويجات
export const usePromotions = () => {
  return useQuery({
    queryKey: ['promotions'],
    queryFn: async (): Promise<Promotion[]> => {
      try {
        const { data, error } = await supabase
          .from('promotions')
          .select('*')
          .eq('is_active', true)
          .order('display_order');
        
        if (error) {
          console.error('❌ خطأ في تحميل العروض:', error);
          throw new Error(`فشل تحميل العروض: ${error.message}`);
        }
        
        return data || [];
      } catch (error) {
        console.error('❌ خطأ غير متوقع في تحميل العروض:', error);
        throw error;
      }
    },
    retry: 2,
  });
};

// 🔹 استعلامات الإشعارات
export const useNotifications = (userId: string | undefined) => {
  return useQuery({
    // ✅ تعديل هنا: اجعل queryKey يعتمد على userId
    // إذا كان userId هو undefined، سيكون المفتاح ['notifications', undefined]
    // وهذا يضمن عدم تداخل الكاش بين المستخدمين المختلفين أو حالة عدم تسجيل الدخول
    queryKey: ['notifications', userId],
    queryFn: async (): Promise<number> => {
      // ✅ إضافة شرط: لا تقم بتشغيل الاستعلام إذا لم يكن هناك userId
      if (!userId) {
        return 0;
      }
      
      try {
        const { count, error } = await supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId) // الآن userId هو بالتأكيد string هنا
          .eq('is_read', false);
        
        if (error) {
          console.error('❌ خطأ في تحميل الإشعارات:', error);
          return 0;
        }
        
        return count || 0;
      } catch (error) {
        console.error('❌ خطأ غير متوقع في تحميل الإشعارات:', error);
        return 0;
      }
    },
    // ✅ تعديل هنا: enabled يتحقق الآن من وجود userId
    // سيعمل الاستعلام فقط إذا كان userId قيمة حقيقية (ليس undefined أو null)
    enabled: !!userId,
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