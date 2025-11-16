import { useCallback, useRef } from 'react';

interface ImagePerformanceMetrics {
  url: string;
  loadTime: number;
  success: boolean;
  timestamp: string;
  imageSize?: number;
  cacheStatus?: 'cached' | 'network' | 'revalidated';
}

interface ImageErrorMetrics {
  url: string;
  error: string;
  timestamp: string;
  retryCount?: number;
}

class ImagePerformanceTracker {
  private static instance: ImagePerformanceTracker;
  private metrics: ImagePerformanceMetrics[] = [];
  private errors: ImageErrorMetrics[] = [];
  private readonly MAX_METRICS = 100; // منع تراكم البيانات بشكل كبير

  private constructor() {}

  static getInstance(): ImagePerformanceTracker {
    if (!ImagePerformanceTracker.instance) {
      ImagePerformanceTracker.instance = new ImagePerformanceTracker();
    }
    return ImagePerformanceTracker.instance;
  }

  trackLoad(metrics: Omit<ImagePerformanceMetrics, 'timestamp'>) {
    const fullMetrics: ImagePerformanceMetrics = {
      ...metrics,
      timestamp: new Date().toISOString(),
    };

    this.metrics.push(fullMetrics);
    
    // الحفاظ على الحد الأقصى للسجلات
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }

    // إرسال البيانات لخدمة التحليل (يمكنك تعديل هذا الجزء)
    this.sendToAnalytics(fullMetrics);
  }

  trackError(metrics: Omit<ImageErrorMetrics, 'timestamp'>) {
    const fullMetrics: ImageErrorMetrics = {
      ...metrics,
      timestamp: new Date().toISOString(),
    };

    this.errors.push(fullMetrics);
    
    if (this.errors.length > this.MAX_METRICS) {
      this.errors = this.errors.slice(-this.MAX_METRICS);
    }

    this.sendErrorToAnalytics(fullMetrics);
  }

  getPerformanceReport() {
    const successfulLoads = this.metrics.filter(m => m.success);
    const failedLoads = this.metrics.filter(m => !m.success);
    
    const avgLoadTime = successfulLoads.length > 0 
      ? successfulLoads.reduce((sum, m) => sum + m.loadTime, 0) / successfulLoads.length 
      : 0;

    return {
      totalImages: this.metrics.length,
      successfulLoads: successfulLoads.length,
      failedLoads: failedLoads.length,
      successRate: this.metrics.length > 0 ? (successfulLoads.length / this.metrics.length) * 100 : 0,
      averageLoadTime: avgLoadTime,
      recentErrors: this.errors.slice(-10),
    };
  }

  private sendToAnalytics(metrics: ImagePerformanceMetrics) {
    // هنا يمكنك إرسال البيانات لخدمة مثل Google Analytics, Sentry, إلخ
    if (__DEV__) {
      console.log('📊 Image Performance:', {
        url: this.sanitizeUrl(metrics.url),
        loadTime: `${metrics.loadTime}ms`,
        success: metrics.success ? '✅' : '❌',
        cache: metrics.cacheStatus,
        size: metrics.imageSize ? `${(metrics.imageSize / 1024).toFixed(1)}KB` : 'N/A',
      });
    }

    // مثال لإرسال البيانات لخدمة خارجية
    // if (!__DEV__) {
    //   fetch('/api/analytics/image-performance', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(metrics),
    //   }).catch(() => {/* تجاهل الأخطاء في الإرسال */});
    // }
  }

  private sendErrorToAnalytics(metrics: ImageErrorMetrics) {
    if (__DEV__) {
      console.warn('🚨 Image Error:', {
        url: this.sanitizeUrl(metrics.url),
        error: metrics.error,
        retryCount: metrics.retryCount,
      });
    }

    // إرسال الأخطاء الحرجة لخدمة مراقبة الأخطاء
    // if (!__DEV__ && metrics.retryCount && metrics.retryCount > 2) {
    //   Sentry.captureException(new Error(`Image load failed: ${metrics.error}`), {
    //     extra: { url: this.sanitizeUrl(metrics.url) }
    //   });
    // }
  }

  private sanitizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return `${urlObj.hostname}${urlObj.pathname.substring(0, 50)}`;
    } catch {
      return url.substring(0, 50);
    }
  }
}

export const useImagePerformance = () => {
  const loadTimers = useRef<Map<string, number>>(new Map());
  const tracker = ImagePerformanceTracker.getInstance();

  const trackImageLoadStart = useCallback((url: string) => {
    loadTimers.current.set(url, Date.now());
  }, []);

  const trackImageLoadEnd = useCallback((url: string, success: boolean, imageSize?: number, cacheStatus?: string) => {
    const startTime = loadTimers.current.get(url);
    
    if (startTime) {
      const loadTime = Date.now() - startTime;
      loadTimers.current.delete(url);

      tracker.trackLoad({
        url,
        loadTime,
        success,
        imageSize,
        cacheStatus: cacheStatus as any,
      });
    }
  }, [tracker]);

  const trackImageError = useCallback((url: string, error: string, retryCount: number = 0) => {
    tracker.trackError({
      url,
      error,
      retryCount,
    });
  }, [tracker]);

  const getPerformanceReport = useCallback(() => {
    return tracker.getPerformanceReport();
  }, [tracker]);

  // دالة لقياس حجم الصورة
  const estimateImageSize = useCallback(async (url: string): Promise<number | undefined> => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      const contentLength = response.headers.get('content-length');
      return contentLength ? parseInt(contentLength, 10) : undefined;
    } catch {
      return undefined;
    }
  }, []);

  return {
    trackImageLoadStart,
    trackImageLoadEnd,
    trackImageError,
    getPerformanceReport,
    estimateImageSize,
  };
};

// Hook إضافي لمراقبة أداء جميع الصور في التطبيق
export const useGlobalImagePerformance = () => {
  const { trackImageLoadStart, trackImageLoadEnd, trackImageError, getPerformanceReport } = useImagePerformance();

  // يمكن استخدام هذا في أعلى مستوى في التطبيق لمراقبة جميع الصور
  const setupGlobalImageTracking = useCallback(() => {
    if (typeof Image !== 'undefined') {
      const originalImage = Image;
      
      // Override Image constructor لمراقبة جميع الصور تلقائياً
      (global as any).Image = function(...args: any[]) {
        const img = new originalImage(...args);
        const originalSrc = Object.getOwnPropertyDescriptor(originalImage.prototype, 'src');
        
        if (originalSrc) {
          Object.defineProperty(img, 'src', {
            get: () => originalSrc.get?.call(img),
            set: function(value: string) {
              trackImageLoadStart(value);
              
              img.onload = () => {
                trackImageLoadEnd(value, true);
                img.onload = null;
              };
              
              img.onerror = () => {
                trackImageError(value, 'Failed to load image');
                img.onerror = null;
              };
              
              originalSrc.set?.call(img, value);
            }
          });
        }
        
        return img;
      };
      
      (global as any).Image.prototype = originalImage.prototype;
    }
  }, [trackImageLoadStart, trackImageLoadEnd, trackImageError]);

  return {
    setupGlobalImageTracking,
    getPerformanceReport,
  };
};