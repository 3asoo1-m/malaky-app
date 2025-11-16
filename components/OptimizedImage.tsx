// components/OptimizedImage.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { 
  View, 
  Image, 
  ActivityIndicator, 
  StyleSheet,
  ImageResizeMode,
  Text,
  DimensionValue // ✅ أضف هذا الاستيراد
} from 'react-native';
import { Colors } from '@/styles';
import { getOptimizedImageUrl, ImagePresets, ImageTransformations } from '@/lib/utils';
import { useImagePerformance } from '@/hooks/useImagePerformance';

interface OptimizedImageProps {
  uri: string;
  width?: DimensionValue; // ✅ غير إلى DimensionValue
  height?: DimensionValue; // ✅ غير إلى DimensionValue
  borderRadius?: number;
  resizeMode?: ImageResizeMode;
  priority?: 'high' | 'normal' | 'low';
  style?: any;
  preset?: keyof typeof ImagePresets;
  transformations?: ImageTransformations;
  fallbackUri?: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = React.memo(({
  uri,
  width = '100%',
  height = 200,
  borderRadius = 0,
  resizeMode = 'cover',
  priority = 'normal',
  style,
  preset,
  transformations,
fallbackUri = 'https://dgplcadvneqpohxqlilg.supabase.co/storage/v1/object/public/menu_image/icon.png',}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentUri, setCurrentUri] = useState(uri);
  const [retryCount, setRetryCount] = useState(0);
  
  // ✅ استخدام hook أداء الصور
  const { trackImageLoadStart, trackImageLoadEnd, trackImageError, estimateImageSize } = useImagePerformance();

  const optimizedUri = useMemo(() => {
    if (!currentUri) return fallbackUri;
    
    try {
      const options = preset ? ImagePresets[preset] : transformations;
      return getOptimizedImageUrl(currentUri, options);
    } catch (error) {
      console.warn('Error optimizing image URL:', error);
      return fallbackUri;
    }
  }, [currentUri, preset, transformations, fallbackUri]);

  useEffect(() => {
    if (optimizedUri) {
      trackImageLoadStart(optimizedUri);
      
      // تقدير حجم الصورة
      estimateImageSize(optimizedUri).then(size => {
        // يمكن استخدام حجم الصورة في التحليلات
        console.log(`Estimated image size: ${size} bytes`);
      });
    }
  }, [optimizedUri, trackImageLoadStart, estimateImageSize]);

  const handleLoadStart = () => {
    setIsLoading(true);
    setHasError(false);
  };

  const handleLoadEnd = () => {
    setIsLoading(false);
    trackImageLoadEnd(optimizedUri, true);
  };

const handleError = () => {
  console.warn('Failed to load image:', optimizedUri);
  setIsLoading(false);
  setHasError(true);
  
  const newRetryCount = retryCount + 1;
  setRetryCount(newRetryCount);
  
  trackImageError(optimizedUri, `Load failed - attempt ${newRetryCount}`, newRetryCount);
  trackImageLoadEnd(optimizedUri, false);

  // ✅ التحسين الجديد: تجربة fallback مباشرة
  if (newRetryCount === 1 && fallbackUri && currentUri !== fallbackUri) {
    console.log('🔄 جرب الصورة البديلة...');
    setTimeout(() => {
      setCurrentUri(fallbackUri);
      setIsLoading(true);
      setHasError(false);
    }, 500); // انتظر نصف ثانية فقط
  }
  // ✅ الاحتفاظ بالمنطق القديم كنسخة احتياطية
  else if (currentUri !== uri && uri !== optimizedUri && newRetryCount <= 2) {
    setTimeout(() => {
      setCurrentUri(uri);
      setIsLoading(true);
      setHasError(false);
    }, 1000 * newRetryCount);
  }
};

  // ✅ حل بديل: استخدام StyleSheet.create للأنماط
  const dynamicStyles = useMemo(() => {
    return StyleSheet.create({
      container: {
        width,
        height,
        borderRadius,
        overflow: 'hidden',
        backgroundColor: Colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
      },
      image: {
        width: '100%',
        height: '100%',
      },
    });
  }, [width, height, borderRadius]);

  return (
    <View style={[
      dynamicStyles.container,
      style
    ]}>
      {!hasError ? (
        <>
          <Image
            source={{ 
              uri: optimizedUri,
              ...(priority === 'high' && { cache: 'force-cache' })
            }}
            style={dynamicStyles.image}
            resizeMode={resizeMode}
            onLoadStart={handleLoadStart}
            onLoadEnd={handleLoadEnd}
            onError={handleError}
          />
          
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          )}
        </>
      ) : (
        <View style={styles.errorContainer}>
          <View style={styles.errorIcon}>
            <Text style={styles.errorText}>🍗</Text>
          </View>
          <Text style={styles.errorMessage}>تعذر تحميل الصورة</Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 16,
  },
  errorIcon: {
    marginBottom: 8,
  },
  errorText: {
    fontSize: 32,
  },
  errorMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});