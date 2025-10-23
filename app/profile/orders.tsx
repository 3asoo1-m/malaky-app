import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

export default function ProfileOrdersRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.push('/orders');
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#C62828" />
    </View>
  );
}