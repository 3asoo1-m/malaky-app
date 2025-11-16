import { View, Text, ScrollView } from 'react-native';
import { OptimizedImage } from '@/components/OptimizedImage';

export default function ImagePerformanceTest() {
  // 4 روابط فقط للتأكد من العمل
  const testImages = [
    {
      name: "سلطة سيزر",
      url: "https://dgplcadvneqpohxqlilg.supabase.co/storage/v1/object/public/menu_image/Salads/caesarsalad.jpg"
    },
    {
      name: "بيتزا", 
      url: "https://dgplcadvneqpohxqlilg.supabase.co/storage/v1/object/public/menu_image/Pizza/pizza.png"
    },
    {
      name: "رابط معطوب (اختبار)",
      url: "https://invalid-domain.com/broken-image.jpg"
    }
  ];

  return (
    <ScrollView style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, marginBottom: 20, textAlign: 'center' }}>
        🧪 اختبار الصور
      </Text>
      
      {testImages.map((image, index) => (
        <View key={index} style={{ marginBottom: 25, alignItems: 'center' }}>
          <Text style={{ marginBottom: 10, fontWeight: '600' }}>
            {image.name}
          </Text>
          <OptimizedImage 
            uri={image.url}
            width={200}
            height={150}
            preset="thumbnail"
          />
          <Text style={{ fontSize: 12, color: '#666', marginTop: 5 }}>
            {image.url}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}