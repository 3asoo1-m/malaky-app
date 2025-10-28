import React from 'react';
import { View, Text, ViewStyle, StyleProp } from 'react-native';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

export function Badge({ children, style }: BadgeProps) {
  return (
    <View
      style={[
        {
          backgroundColor: '#dc2626',
          borderRadius: 20,
          paddingHorizontal: 16,
          paddingVertical: 6,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 4,
          flexDirection: 'row',
          alignItems: 'center',
          alignSelf: 'center',
        },
        style,
      ]}
    >
      <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>
        {children}
      </Text>
    </View>
  );
}