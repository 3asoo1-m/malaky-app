// lib/query-client.ts - الإصدار النهائي
import { QueryClient } from '@tanstack/react-query';

let queryTracker: any = null;
// ✅ استخدام Map عالمي (ليست داخل الدالة)
const queryExecutionMap = new Map();


export const setQueryTracker = (tracker: any) => {
  queryTracker = tracker;
  console.log('✅ تم تسجيل query tracker');
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60,        // 1 ساعة
      cacheTime: 1000 * 60 * 60 * 2,    // ساعتين
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
    } as any, // ✅ استخدم as any لتجاوز TS type error على cacheTime
  },
});



queryClient.setQueryDefaults(['menu'], { cacheTime: 1000 * 60 * 60 * 2 });
queryClient.setQueryDefaults(['promotions'], { cacheTime: 1000 * 60 * 30 });
queryClient.setQueryDefaults(['notifications'], { cacheTime: 1000 * 60 * 15 });



export const withQueryTracking = (queryKey: any[], queryFn: Function) => {
  const keyString = JSON.stringify(queryKey);
  return async () => {
    const startTime = Date.now();
    const previousCount = queryExecutionMap.get(keyString) || 0;
    const newCount = previousCount + 1;
    queryExecutionMap.set(keyString, newCount);
    const isCached = newCount > 1;
    console.log(`🔍 [CACHE DEBUG] ${queryKey[0]} - execution: ${newCount} - cached: ${isCached}`);
    try {
      const result = await queryFn();
      const duration = Date.now() - startTime;
      const dataSize = JSON.stringify(result).length;
      if (queryTracker) {
        queryTracker.trackQuery(queryKey, duration, isCached, true, dataSize);
      }
      console.log(`✅ [TRACKED] ${queryKey[0]} - ${duration}ms - cached: ${isCached} - execution: ${newCount}`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      if (queryTracker) {
        queryTracker.trackQuery(queryKey, duration, isCached, false);
      }
      console.log(`❌ [TRACKED ERROR] ${queryKey[0]} - ${duration}ms - cached: ${isCached}`);
      throw error;
    }
  };
};

export const resetQueryTracking = () => {
  queryExecutionMap.clear();
  console.log('🔄 تم تفريغ إحصائيات تتبع الاستعلامات');
};