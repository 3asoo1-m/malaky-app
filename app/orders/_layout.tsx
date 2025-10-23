import { Stack } from 'expo-router';

export default function OrdersLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'قائمة الطلبات' }} />
      <Stack.Screen name="[orderId]" options={{ title: 'تفاصيل الطلب' }} />
    </Stack>
  );
}
