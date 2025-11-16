ماذا يفعل هذا بالزبط ؟
// في hooks/use-category-data.ts
import { useQuery } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { MenuItem } from '@/lib/types';
import { withQueryTracking } from '@/lib/query-client';

// =================================================================
// ✅ دوال التخزين المؤقت
// =================================================================
const CACHE_KEYS = {
  CATEGORY_ITEMS: 'category_items'
};

const CACHE_DURATION = 1000 * 60 * 10; // 10 دقائق

const cacheCategoryItems = async (categoryId: string, data: any) => {
  try {
    const cacheItem = { data, timestamp: Date.now() };
    await AsyncStorage.setItem(`${CACHE_KEYS.CATEGORY_ITEMS}_${categoryId}`, JSON.stringify(cacheItem));
    console.log(`✅ Category ${categoryId} items cached (${data.length} items)`);
  } catch (error) {
    console.error('❌ Error caching category items:', error);
  }
};

const getCachedCategoryItems = async (categoryId: string) => {
  try {
    const cached = await AsyncStorage.getItem(`${CACHE_KEYS.CATEGORY_ITEMS}_${categoryId}`);
    if (!cached) return null;
    
    const cacheItem = JSON.parse(cached);
    const isExpired = Date.now() - cacheItem.timestamp > CACHE_DURATION;
    if (isExpired) {
      await AsyncStorage.removeItem(`${CACHE_KEYS.CATEGORY_ITEMS}_${categoryId}`);
      return null;
    }
    
    console.log(`✅ Using cached items for category: ${categoryId} (${cacheItem.data.length} items)`);
    return cacheItem.data;
  } catch (error) {
    console.error('❌ Error getting cached category items:', error);
    return null;
  }
};

// =================================================================
// ✅ دالة الجلب مع التخزين المؤقت المدمج
// =================================================================
const fetchCategoryItemsWithCache = async (categoryId: string): Promise<MenuItem[]> => {
  try {
    console.log(`🔄 [API] Fetching items for category: ${categoryId}`);
    
    const { data, error } = await supabase.rpc('get_items_by_category', {
      p_category_id: Number(categoryId),
      p_limit: 100,
      p_offset: 0
    });

    if (error) {
      console.error('❌ [API] Error fetching category items:', error);
      throw new Error(error.message);
    }
    
    // تحويل JSON إلى array
    const items = data ? JSON.parse(data) : [];
    console.log(`✅ [API] Fetched ${items.length} items for category: ${categoryId}`);
    
    // ✅ تخزين البيانات في AsyncStorage
    if (items.length > 0) {
      await cacheCategoryItems(categoryId, items);
    } else {
      // ✅ إذا كانت البيانات فارغة، ننظف الكاش القديم
      await AsyncStorage.removeItem(`${CACHE_KEYS.CATEGORY_ITEMS}_${categoryId}`);
    }
    
    return items;
  } catch (error) {
    console.error('❌ [API] Network error:', error);
    throw error;
  }
};

// =================================================================
// ✅ دالة الجلب مع fallback إلى التخزين المؤقت
// =================================================================
const fetchCategoryItemsWithFallback = async (categoryId: string): Promise<MenuItem[]> => {
  try {
    // ✅ محاولة الجلب من API أولاً
    return await fetchCategoryItemsWithCache(categoryId);
  } catch (error) {
    // ✅ إذا فشل API، جرب التخزين المؤقت
    console.log('🔄 [FALLBACK] Trying cached data...');
    const cachedItems = await getCachedCategoryItems(categoryId);
    
    if (cachedItems && cachedItems.length > 0) {
      console.log('✅ [FALLBACK] Using cached data');
      return cachedItems;
    }
    
    // ✅ إذا لا توجد بيانات مخزنة، أعد الخطأ
    console.log('❌ [FALLBACK] No cached data available');
    throw error;
  }
};

// =================================================================
// ✅ الهوك الرئيسي مع التخزين المدمج
// =================================================================
export const useCategoryItems = (categoryId: string | undefined) => {
  return useQuery({
    queryKey: ['category-items', categoryId],
    queryFn: withQueryTracking(['category-items', categoryId], async (): Promise<MenuItem[]> => {
      if (!categoryId) {
        console.log('❌ No category ID provided');
        return [];
      }

      try {
        // ✅ أولاً: تحقق من وجود بيانات في التخزين المؤقت
        const cachedItems = await getCachedCategoryItems(categoryId);
        
        if (cachedItems && cachedItems.length > 0) {
          console.log('💾 [CACHE] Returning cached items immediately');
          
          // ✅ إرجاع البيانات المخزنة فوراً، مع التحديث في الخلفية
          setTimeout(async () => {
            try {
              console.log('🔄 [BACKGROUND] Checking for updates...');
              const freshData = await fetchCategoryItemsWithCache(categoryId);
              
              // ✅ إذا اختلفت البيانات، سيتم تحديثها تلقائياً عبر React Query
              if (JSON.stringify(cachedItems) !== JSON.stringify(freshData)) {
                console.log('🔄 [BACKGROUND] Data updated from server');
              }
            } catch (bgError) {
              console.log('⚠️ [BACKGROUND] Background update failed');
            }
          }, 1000);
          
          return cachedItems;
        }

        // ✅ إذا لا توجد بيانات مخزنة، جلب من API
        console.log('🌐 [API] No cache found, fetching from server...');
        return await fetchCategoryItemsWithCache(categoryId);
        
      } catch (error) {
        console.error('❌ [ERROR] All fetch attempts failed:', error);
        
        // ✅ محاولة أخيرة للـ fallback
        const cachedItems = await getCachedCategoryItems(categoryId);
        if (cachedItems) {
          console.log('🔄 [FINAL FALLBACK] Using cached data as last resort');
          return cachedItems;
        }
        
        throw error;
      }
    }),
    enabled: !!categoryId,
    staleTime: 1000 * 60 * 5,  // 5 دقائق
    gcTime: 1000 * 60 * 30,    // 30 دقيقة
  });
};

// =================================================================
// ✅ هوك للتحديث القسري (بدون استخدام الكاش)
// =================================================================
export const useCategoryItemsForceRefresh = (categoryId: string | undefined) => {
  return useQuery({
    queryKey: ['category-items-force', categoryId],
    queryFn: withQueryTracking(['category-items-force', categoryId], async (): Promise<MenuItem[]> => {
      if (!categoryId) return [];
      
      console.log('🔄 [FORCE] Force refreshing category items...');
      return await fetchCategoryItemsWithCache(categoryId);
    }),
    enabled: !!categoryId,
  });
};