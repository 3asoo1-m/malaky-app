import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

export default function TestSuite() {
  const router = useRouter();

  const testModules = [
    { name: '🖼 اختبار الصور', route: '/test/image-performance' },
    { name: '🛒 اختبار السلة', route: '/test/cart-scenarios' },
    { name: '🧩 اختبار المكونات', route: '/test/components-test' },
    { name: '📊 اختبار البيانات', route: '/test/query-test' },
    { name: '⚡ اختبار الأداء', route: '/test/performance' },
  ];

  return (
    <ScrollView style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20, textAlign: 'center' }}>
        🧪 مجموعة اختبارات التطبيق
      </Text>
      
      {testModules.map((module, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => router.push(module.route as any)}
          style={{
            padding: 15,
            backgroundColor: '#f8f9fa',
            marginBottom: 10,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: '#dee2e6'
          }}
        >
          <Text style={{ fontSize: 16, textAlign: 'center' }}>
            {module.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}