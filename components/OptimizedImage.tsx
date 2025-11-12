// components/OptimizedImage.tsx
import React, { useState } from 'react';
import { 
  View, 
  Image, 
  ActivityIndicator, 
  StyleSheet,
  ImageResizeMode,
  Text
} from 'react-native';
import { Colors } from '@/styles';

interface OptimizedImageProps {
  uri: string;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  resizeMode?: ImageResizeMode;
  priority?: 'high' | 'normal' | 'low';
  style?: any;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  uri,
  width = '100%',
  height = 200,
  borderRadius = 0,
  resizeMode = 'cover',
  priority = 'normal',
  style,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoadStart = () => {
    setIsLoading(true);
    setHasError(false);
  };

  const handleLoadEnd = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <View style={[
      styles.container, 
      { width, height, borderRadius },
      style
    ]}>
      {!hasError ? (
        <>
          <Image
            source={{ 
              uri,
              ...(priority === 'high' && { cache: 'force-cache' })
            }}
            style={[
              styles.image,
              { 
                width: '100%', 
                height: '100%',
                borderRadius 
              }
            ]}
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
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    flex: 1,
  },
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