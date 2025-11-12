// مسار الملف: components/ScreenHeader.tsx

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { scale, fontScale } from '@/lib/responsive';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  leftButton?: {
    icon: React.ComponentProps<typeof Ionicons>['name'];
    onPress: () => void;
    disabled?: boolean;
  };
  rightButton?: {
    icon: React.ComponentProps<typeof Ionicons>['name'];
    onPress: () => void;
    disabled?: boolean;
  };
  children?: React.ReactNode;
  style?: ViewStyle;
}

const ScreenHeader = ({
  title,
  subtitle,
  leftButton,
  rightButton,
  children,
  style,
}: ScreenHeaderProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, style]}>
      <View style={styles.headerBackground} />
      <View style={[styles.headerContent, { paddingTop: insets.top }]}>
        <View style={styles.headerTop}>
          {/* --- الزر الأيسر (على اليمين في RTL) --- */}
          <View style={styles.buttonPlaceholder}>
            {leftButton && (
              <TouchableOpacity
                onPress={leftButton.onPress}
                style={styles.iconButton}
                disabled={leftButton.disabled}
              >
                <Ionicons
                  name={leftButton.icon}
                  size={scale(24)}
                  color={leftButton.disabled ? 'rgba(255,255,255,0.5)' : 'white'}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* --- العنوان الرئيسي والفرعي --- */}
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
            {subtitle && <Text style={styles.headerSubtitle} numberOfLines={1}>{subtitle}</Text>}
          </View>

          {/* --- الزر الأيمن (على اليسار في RTL) --- */}
          <View style={styles.buttonPlaceholder}>
            {rightButton && (
              <TouchableOpacity
                onPress={rightButton.onPress}
                style={styles.iconButton}
                disabled={rightButton.disabled}
              >
                <Ionicons
                  name={rightButton.icon}
                  size={scale(22)}
                  color={rightButton.disabled ? 'rgba(255,255,255,0.5)' : 'white'}
                />
              </TouchableOpacity>
            )}
            {children}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // --- التنسيقات المنسوخة والمكيفة من orders.tsx ---
  header: {
    height: scale(130), // يمكنك تعديل هذه القيمة
    position: 'relative',
  },
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
  headerContent: {
    paddingHorizontal: scale(20),
    // paddingTop سيتم تطبيقه من insets
    flex: 1, // اجعله يملأ المساحة
    justifyContent: 'center', // قم بتوسيط المحتوى (headerTop) عمودياً
  },
  headerTop: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonPlaceholder: {
    width: scale(40), // عرض ثابت للحاوية لضمان التوسيط
    alignItems: 'center',
  },
  iconButton: {
    padding: scale(8),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: scale(20),
  },
  titleContainer: {
    flex: 1, // يأخذ المساحة المتبقية
    alignItems: 'center', // يوسّط المحتوى الداخلي
  },
  headerTitle: {
    fontSize: fontScale(22), // حجم خط مطابق
    fontFamily: 'Cairo-Bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: fontScale(14),
    fontFamily: 'Cairo-Regular',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
});

export default ScreenHeader;
