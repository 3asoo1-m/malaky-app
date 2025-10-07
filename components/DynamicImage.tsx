// مسار الملف: components/DynamicImage.tsx

import React, { useState, useEffect } from 'react';
import { Image, StyleSheet, View, ActivityIndicator, ImageSourcePropType, ImageURISource } from 'react-native';

interface DynamicImageProps {
  source: ImageSourcePropType;
  style?: object;
}

const DynamicImage: React.FC<DynamicImageProps> = ({ source, style }) => {
  const [aspectRatio, setAspectRatio] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof source === 'object' && 'uri' in source) {
      const uri = (source as ImageURISource).uri;

      // التحقق من أن uri هو string صالح قبل استدعاء getSize
      if (uri) {
        Image.getSize(
          uri,
          (width, height) => {
            setAspectRatio(width / height);
            setLoading(false);
          },
          (error) => {
            console.error(`Failed to get size for image: ${uri}`, error);
            setAspectRatio(1);
            setLoading(false);
          }
        );
      } else {
        // في حال كان الـ uri فارغًا (e.g., { uri: '' })
        setAspectRatio(1);
        setLoading(false);
      }
    } else if (typeof source === 'number') {
      const imageAsset = Image.resolveAssetSource(source);
      if (imageAsset) {
        setAspectRatio(imageAsset.width / imageAsset.height);
      }
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [source]);

  if (loading) {
    return (
      <View style={[styles.placeholder, style]}>
        <ActivityIndicator color="#ccc" />
      </View>
    );
  }

  return <Image source={source} style={[style, { aspectRatio }]} />;
};

const styles = StyleSheet.create({
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
});

export default DynamicImage;
