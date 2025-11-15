import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  Image, 
  Dimensions, 
  ActivityIndicator, 
  TouchableOpacity, 
  ColorValue,
  Linking,
  Alert,
  ImageBackground
} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { Promotion, getActivePromotions } from '@/lib/promotions';
import { LinearGradient } from 'expo-linear-gradient';
import { Gift, Percent, Sparkles, TrendingUp, ExternalLink, ShoppingBag } from 'lucide-react-native';
import { useRouter } from 'expo-router'; // ✅ استخدام useRouter من Expo Router

const { width } = Dimensions.get('window');

const iconMap = {
  Percent: Percent,
  Gift: Gift,
  Sparkles: Sparkles,
  TrendingUp: TrendingUp,
};

const getActionIcon = (actionType: string, actionValue: string | null) => {
  switch (actionType) {
    case 'open_url':
      return ExternalLink;
    case 'navigate_to_item':
      return ShoppingBag;
    case 'discount':
      return Percent;
    case 'gift':
      return Gift;
    default:
      return Sparkles;
  }
};

const getGradientColors = (actionType: string): [ColorValue, ColorValue, ...ColorValue[]] => {
  switch (actionType) {
    case 'discount':
      return ['#EF4444', '#F97316'];
    case 'gift':
      return ['#8B5CF6', '#A855F7'];
    case 'trending':
      return ['#059669', '#10B981'];
    case 'special':
      return ['#DC2626', '#EA580C'];
    case 'open_url':
      return ['#7C3AED', '#A855F7'];
    case 'navigate_to_item':
      return ['#059669', '#10B981'];
    default:
      return ['#6B7280', '#9CA3AF'];
  }
};

const PromotionsCarousel = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  
  // ✅ استخدام useRouter من Expo Router بدلاً من useNavigation
  const router = useRouter();

  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    try {
      const data = await getActivePromotions();
      setPromotions(data);
    } catch (error) {
      console.error('Error loading promotions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenURL = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('خطأ', 'لا يمكن فتح هذا الرابط');
      }
    } catch (error) {
      console.error('Error opening URL:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء فتح الرابط');
    }
  };

  const handleNavigateToItem = (itemId: string) => {
    try {
      // ✅ استخدام router.push للانتقال إلى صفحة المنتج
      // هذا سينتقل إلى app/item/[itemId].tsx
      router.push(`/item/${itemId}`);
      console.log('✅ Navigating to item:', itemId);
    } catch (error) {
      console.error('Error navigating to product:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء الانتقال إلى المنتج');
    }
  };

  const handlePromotionPress = async (promotion: Promotion) => {
    console.log('Promotion pressed:', promotion);
    
    try {
      switch (promotion.action_type) {
        case 'open_url':
          if (promotion.action_value) {
            console.log('Opening URL:', promotion.action_value);
            await handleOpenURL(promotion.action_value);
          } else {
            Alert.alert('خطأ', 'لا يوجد رابط متاح');
          }
          break;
          
        case 'navigate_to_item':
          if (promotion.action_value) {
            console.log('Navigating to item:', promotion.action_value);
            handleNavigateToItem(promotion.action_value);
          } else {
            Alert.alert('خطأ', 'لا يوجد منتج محدد');
          }
          break;
          
        case 'discount':
          console.log('Applying discount');
          Alert.alert('خصم', 'تم تطبيق الخصم بنجاح');
          break;
          
        default:
          console.log('Unknown action type:', promotion.action_type);
          Alert.alert('عرض', promotion.title);
      }
    } catch (error) {
      console.error('Error handling promotion action:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء معالجة العرض');
    }
  };

  const renderItem = ({ item }: { item: Promotion }) => {
    const IconComponent = getActionIcon(item.action_type, item.action_value);
    const gradientColors = getGradientColors(item.action_type);


    if (item.image_url) {
      // ⭐️ عرض المكون مع صورة كخلفية
      return (
        <TouchableOpacity
          style={{ padding: 8 }}
          onPress={() => handlePromotionPress(item)}
          activeOpacity={0.8}
        >
          <ImageBackground
            source={{ uri: item.image_url }}
            style={{
              height: 150,
              justifyContent: 'center',
              overflow: 'hidden', // ضروري لتطبيق borderRadius على الصورة
              borderRadius: 24,
            }}
            resizeMode="cover" // لتغطية الصورة للمكون بالكامل
          >
            {/* تدرج لوني فوق الصورة لتحسين قراءة النص */}
            <LinearGradient
              colors={['rgba(0,0,0,0.2)', 'rgba(0, 0, 0, 0.2)']}
              style={{
                padding: 20,
                height: '100%',
                justifyContent: 'center',
                borderRadius: 24,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold', textAlign: 'right', marginBottom: 8 }}>
                    {item.title}
                  </Text>
                  <Text style={{ color: 'white', opacity: 0.9, fontSize: 14, textAlign: 'right', lineHeight: 20 }}>
                    {item.description}
                  </Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <IconComponent color="white" size={48} style={{ opacity: 0.5 }} />
                </View>
              </View>
            </LinearGradient>
          </ImageBackground>
        </TouchableOpacity>
      );
    }
    
    
    return (
      <TouchableOpacity 
        style={{ padding: 8 }}
        onPress={() => handlePromotionPress(item)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={gradientColors}
          style={{ 
            borderRadius: 24, 
            padding: 20, 
            height: 150, 
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flex: 1 
          }}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={{ 
                color: 'white', 
                fontSize: 18, 
                fontWeight: 'bold',
                textAlign: 'right',
                marginBottom: 8
              }}>
                {item.title}
              </Text>
              <Text style={{ 
                color: 'white', 
                opacity: 0.9, 
                fontSize: 14,
                textAlign: 'right',
                lineHeight: 20
              }}>
                {item.description}
              </Text>
            </View>
            
            <View style={{ alignItems: 'center' }}>
              <IconComponent color="white" size={48} style={{ opacity: 0.3 }} />
              {item.image_url && (
                <Image
                  source={{ uri: item.image_url }}
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 12,
                    marginTop: 8,
                  }}
                  resizeMode="cover"
                />
              )}
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={{ height: 180, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#EF4444" />
      </View>
    );
  }

  if (!promotions || promotions.length === 0) {
    return null;
  }

  return (
    <View style={{ height: 180, marginTop: 16 }}>
      <Carousel
        loop
        width={width}
        height={180}
        autoPlay={true}
        data={promotions}
        scrollAnimationDuration={1000}
        autoPlayInterval={4000}
        renderItem={renderItem}
        style={{ direction: 'rtl' }}
      />
    </View>
  );
};

export default PromotionsCarousel;