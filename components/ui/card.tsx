// components/ui/card.tsx
import React from 'react';
import { View, ViewProps, Text, TextProps } from 'react-native';
import { Colors } from '@/styles';

// 🔹 واجهات الأنواع
interface CardProps extends ViewProps {
  variant?: 'default' | 'outlined' | 'filled';
}

interface CardHeaderProps extends ViewProps {}
interface CardTitleProps extends TextProps {}
interface CardDescriptionProps extends TextProps {}
interface CardContentProps extends ViewProps {}
interface CardFooterProps extends ViewProps {}

// 🔹 المكونات الرئيسية
export const Card: React.FC<CardProps> = ({ 
  children, 
  variant = 'default',
  style,
  ...props 
}) => {
  const getCardStyle = () => {
    const baseStyle = {
      backgroundColor: Colors.background,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: Colors.border,
      padding: 24,
    };

    switch (variant) {
      case 'outlined':
        return { ...baseStyle, borderColor: Colors.border };
      case 'filled':
        return { ...baseStyle, backgroundColor: Colors.surface };
      default:
        return baseStyle;
    }
  };

  return (
    <View style={[getCardStyle(), style]} {...props}>
      {children}
    </View>
  );
};

export const CardHeader: React.FC<CardHeaderProps> = ({ children, style, ...props }) => (
  <View style={[{ marginBottom: 24 }, style]} {...props}>
    {children}
  </View>
);

export const CardTitle: React.FC<CardTitleProps> = ({ children, style, ...props }) => (
  <Text 
    style={[
      { 
        fontSize: 20, 
        fontWeight: '600', 
        color: Colors.text,
        textAlign: 'right',
        marginBottom: 8 
      }, 
      style
    ]} 
    {...props}
  >
    {children}
  </Text>
);

export const CardDescription: React.FC<CardDescriptionProps> = ({ children, style, ...props }) => (
  <Text 
    style={[
      { 
        fontSize: 14, 
        color: Colors.textSecondary,
        textAlign: 'right',
        lineHeight: 20 
      }, 
      style
    ]} 
    {...props}
  >
    {children}
  </Text>
);

export const CardContent: React.FC<CardContentProps> = ({ children, style, ...props }) => (
  <View style={[{ marginBottom: 24 }, style]} {...props}>
    {children}
  </View>
);

export const CardFooter: React.FC<CardFooterProps> = ({ children, style, ...props }) => (
  <View 
    style={[
      { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginTop: 24 
      }, 
      style
    ]} 
    {...props}
  >
    {children}
  </View>
);