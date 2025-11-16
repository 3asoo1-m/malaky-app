// hooks/useDataPerformance.ts
import { useState, useCallback, useRef } from 'react';

interface QueryMetric {
  queryKey: string[];
  duration: number;
  timestamp: Date;
  dataSize?: number;
  fromCache: boolean;
  success: boolean;
}

interface DataPerformanceReport {
  totalQueries: number;
  cachedQueries: number;
  failedQueries: number;
  averageQueryTime: number;
  totalDataSize: number;
  cacheHitRate: number;
  recentQueries: QueryMetric[];
}

export function useDataPerformance() {
  const [metrics, setMetrics] = useState<QueryMetric[]>([]);
  const metricsRef = useRef<QueryMetric[]>([]);

  const trackQuery = useCallback((
    queryKey: string[], 
    duration: number, 
    fromCache: boolean, 
    success: boolean,
    dataSize?: number
  ) => {
    const metric: QueryMetric = {
      queryKey,
      duration,
      timestamp: new Date(),
      dataSize,
      fromCache,
      success
    };

    metricsRef.current = [...metricsRef.current.slice(-49), metric]; // آخر 50 استعلام
    setMetrics(metricsRef.current);
  }, []);

  const getPerformanceReport = useCallback((): DataPerformanceReport => {
    const recentMetrics = metricsRef.current;
    
    if (recentMetrics.length === 0) {
      return {
        totalQueries: 0,
        cachedQueries: 0,
        failedQueries: 0,
        averageQueryTime: 0,
        totalDataSize: 0,
        cacheHitRate: 0,
        recentQueries: []
      };
    }

    const totalQueries = recentMetrics.length;
    const cachedQueries = recentMetrics.filter(m => m.fromCache).length;
    const failedQueries = recentMetrics.filter(m => !m.success).length;
    const averageQueryTime = recentMetrics.reduce((sum, m) => sum + m.duration, 0) / totalQueries;
    const totalDataSize = recentMetrics.reduce((sum, m) => sum + (m.dataSize || 0), 0);
    const cacheHitRate = (cachedQueries / totalQueries) * 100;

    return {
      totalQueries,
      cachedQueries,
      failedQueries,
      averageQueryTime,
      totalDataSize,
      cacheHitRate,
      recentQueries: recentMetrics.slice(-10)
    };
  }, []);

  return {
    trackQuery,
    getPerformanceReport,
    metrics: metricsRef.current
  };
}