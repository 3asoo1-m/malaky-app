// 📁 components/ForceUpdateScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import { Ionicons } from '@expo/vector-icons';

interface ForceUpdateScreenProps {
  message: string;
  onUpdate: () => void;
}

export const ForceUpdateScreen: React.FC<ForceUpdateScreenProps> = ({ 
  message,
  onUpdate 
}) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* <LottieView
          source={require('@/assets/animations/update.json')}
          autoPlay
          loop
          style={styles.animation}
        /> */}
        
        <View style={styles.iconContainer}>
          <Ionicons name="cloud-download-outline" size={80} color="#fff" />
        </View>

        <Text style={styles.title}>🔄 تحديث مطلوب</Text>
        <Text style={styles.message}>{message}</Text>
        
        <TouchableOpacity style={styles.updateButton} onPress={onUpdate}>
          <Ionicons name="cloud-download" size={24} color="#fff" />
          <Text style={styles.updateButtonText}>تحديث الآن</Text>
        </TouchableOpacity>
        
        <View style={styles.note}>
          <Text style={styles.noteText}>
            لا يمكنك استخدام التطبيق بدون التحديث
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#C62828',
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
    width: 150,
    height: 150,
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
    fontSize: 16,
    fontFamily: 'Cairo-Regular',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  updateButton: {
    flexDirection: 'row',
    backgroundColor: '#1D3557',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 20,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Cairo-Bold',
    marginStart: 10,
  },
  note: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 15,
    borderRadius: 10,
  },
  noteText: {
    fontSize: 14,
    fontFamily: 'Cairo-Regular',
    color: '#fff',
    textAlign: 'center',
  },
});