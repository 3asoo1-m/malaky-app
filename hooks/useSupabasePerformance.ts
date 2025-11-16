// hooks/useSupabasePerformance.ts
import { useCallback } from 'react';
import { useDataPerformance } from './useDataPerformance';

export function useSupabasePerformance() {
  const { trackQuery } = useDataPerformance();

  const trackSupabaseQuery = useCallback(async <T>(
    queryName: string,
    queryFn: () => Promise<T>
  ): Promise<T> => {
    const startTime = Date.now();
    
    try {
      const result = await queryFn();
      const duration = Date.now() - startTime;
      const dataSize = JSON.stringify(result).length;
      
      trackQuery([queryName], duration, false, true, dataSize);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      trackQuery([queryName], duration, false, false);
      throw error;
    }
  }, [trackQuery]);

  return { trackSupabaseQuery };
}