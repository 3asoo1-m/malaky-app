// مسار الملف: lib/responsive.ts

import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// --- التعديل هنا ---
// عرض شاشة iPhone 13 هو 390 بكسل. هذا هو مرجعنا.
const BASE_WIDTH = 390;
// --- نهاية التعديل ---

export const scale = (size: number): number => {
  return (SCREEN_WIDTH / BASE_WIDTH) * size;
};

export const fontScale = (size: number): number => {
  const newSize = scale(size);
  return newSize;
};
