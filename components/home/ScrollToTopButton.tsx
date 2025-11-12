// components/home/ScrollToTopButton.tsx
import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowUp } from 'lucide-react-native';
import { Colors } from '@/styles';

interface ScrollToTopButtonProps {
  onPress: () => void;
}

const ScrollToTopButton: React.FC<ScrollToTopButtonProps> = ({ onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <ArrowUp color={Colors.primary} size={24} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 30,
    right: 24,
    backgroundColor: 'white',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
    zIndex: 40,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
});

export default ScrollToTopButton;
