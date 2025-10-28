import React from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, style }: CardProps) {
  return (
    <View 
      style={[
        {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: 16,
          padding: 32,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 4,
          },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 8,
          borderWidth: 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}