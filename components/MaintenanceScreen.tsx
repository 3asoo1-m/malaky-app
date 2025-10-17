// 📁 components/MaintenanceScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import { Ionicons } from '@expo/vector-icons';

interface MaintenanceScreenProps {
  message: string;
}

export const MaintenanceScreen: React.FC<MaintenanceScreenProps> = ({ 
  message 
}) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* <LottieView
          source={require('@/assets/animations/maintenance.json')}
          autoPlay
          loop
          style={styles.animation}
        /> */}
        
        <View style={styles.iconContainer}>
          <Ionicons name="construct-outline" size={80} color="#fff" />
        </View>

        <Text style={styles.title}>⏳ تحت الصيانة</Text>
        <Text style={styles.message}>{message}</Text>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            شكراً لتفهمكم - فريق الدجاج الملكي بروست 👑
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1D3557',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  animation: {
    width: 200,
    height: 200,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Cairo-Bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  message: {
    fontSize: 18,
    fontFamily: 'Cairo-Regular',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 40,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Cairo-Regular',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
});