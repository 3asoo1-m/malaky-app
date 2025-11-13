// مسار الملف: components/ui/ScreenHeader.tsx
// مكون الهيدر - نسخة طبق الأصل من شاشة الطلبات

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { scale, fontScale } from '@/lib/responsive';

// ============================================================
// ✅ تعريف الأنواع (Types)
// ============================================================

interface ScreenHeaderProps {
  title: string;
  onBackPress?: () => void;
  onRefreshPress?: () => void;
  isRefreshing?: boolean;
}

// ============================================================
// ✅ مكون الهيدر
// ============================================================

const ScreenHeader = React.memo(
  ({
    title,
    onBackPress,
    onRefreshPress,
    isRefreshing = false,
  }: ScreenHeaderProps) => {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    // ✅ معالج زر الرجوع
    const handleBackPress = useCallback(() => {
      if (onBackPress) {
        onBackPress();
      } else {
        router.back();
      }
    }, [onBackPress, router]);

    // ✅ معالج زر التحديث
    const handleRefreshPress = useCallback(() => {
      if (onRefreshPress) {
        onRefreshPress();
      }
    }, [onRefreshPress]);

    return (
      <View style={styles.header}>
        {/* الخلفية الحمراء مع الزوايا المستديرة */}
        <View style={styles.headerBackground} />
        
        {/* محتوى الهيدر */}
        <View style={[styles.headerContent, { paddingTop: insets.top }]}>
          <View style={styles.headerTop}>
            {/* زر الرجوع */}
            <TouchableOpacity 
              onPress={handleBackPress} 
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={scale(24)} color="white" />
            </TouchableOpacity>

            {/* العنوان */}
            <Text style={styles.headerTitle}>{title}</Text>

            {/* زر التحديث */}
            <TouchableOpacity 
              onPress={handleRefreshPress}
              style={styles.refreshButton}
              disabled={isRefreshing}
            >
              <Ionicons 
                name="refresh" 
                size={scale(22)} 
                color={isRefreshing ? "rgba(255,255,255,0.5)" : "white"} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }
);

ScreenHeader.displayName = 'ScreenHeader';

// ============================================================
// ✅ الأنماط (Styles)
// ============================================================

const styles = StyleSheet.create({
  // الهيدر الرئيسي
  header: {
    height: scale(130),
    position: 'relative',
  },

  // الخلفية الحمراء
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#DC2626',
    borderBottomLeftRadius: scale(30),
    borderBottomRightRadius: scale(30),
  },

  // محتوى الهيدر
  headerContent: {
    paddingHorizontal: scale(20),
    flex: 1,
    justifyContent: 'center',
  },

  // الصف العلوي (يحتوي على الأزرار والعنوان)
  headerTop: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // زر الرجوع
  backButton: {
    padding: scale(8),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: scale(20),
  },

  // العنوان
  headerTitle: {
    fontSize: fontScale(24),
    fontWeight: 'bold',
    color: 'white',
  },

  // زر التحديث
  refreshButton: {
    padding: scale(8),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: scale(20),
  },
});

export default ScreenHeader;