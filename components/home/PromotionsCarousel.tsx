import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  Dimensions, 
  ActivityIndicator, 
  TouchableOpacity, 
  ColorValue,
  Linking,
  Alert
} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { Promotion, getActivePromotions } from '@/lib/promotions';
import { LinearGradient } from 'expo-linear-gradient';
import { Gift, Percent, Sparkles, TrendingUp, ExternalLink, ShoppingBag } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';

const { width } = Dimensions.get('window');

// 🔧 إعدادات التخزين المؤقت - تفعيل في Development Build
const DEBUG_CACHE = true;

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

// 🔧 مكون محسن للتخزين المؤقت في Development Build
const CachedPromotionImage = ({ imageUrl, children }: { imageUrl: string; children: React.ReactNode }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [loadStartTime, setLoadStartTime] = useState<number | null>(null);

  const handleLoadStart = () => {
    setLoadStartTime(Date.now());
    if (DEBUG_CACHE) {
      console.log(`🔄 بدء تحميل الصورة: ${imageUrl}`);
    }
  };

  const handleLoad = () => {
    const loadTime = loadStartTime ? Date.now() - loadStartTime : 0;
    setImageLoaded(true);
    
    if (DEBUG_CACHE) {
      const cacheStatus = loadTime < 100 ? '💾 مخبأة' : '🌐 شبكة';
      console.log(`✅ تم تحميل الصورة: ${imageUrl} (${loadTime}ms) - ${cacheStatus}`);
    }
  };

  const handleError = (error: any) => {
    setImageError(true);
    if (DEBUG_CACHE) {
      console.log(`❌ خطأ في تحميل الصورة: ${imageUrl}`, error);
    }
  };

  if (imageError) {
    return (
      <LinearGradient
        colors={['#6B7280', '#9CA3AF']}
        style={{
          height: 150,
          justifyContent: 'center',
          borderRadius: 24,
          padding: 20,
        }}
      >
        {children}
        {DEBUG_CACHE && (
          <Text style={{ color: 'white', fontSize: 10, textAlign: 'center', marginTop: 8 }}>
            ⚠️ فشل التحميل
          </Text>
        )}
      </LinearGradient>
    );
  }

  return (
    <View style={{ position: 'relative', height: 150, borderRadius: 24, overflow: 'hidden' }}>
      {/* ✅ استخدام expo-image مع إعدادات محسنة للـ Development Build */}
      <Image
        source={{ uri: imageUrl }}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
        }}
        contentFit="cover"
        transition={300}
        onLoadStart={handleLoadStart}
        onLoad={handleLoad}
        onError={handleError}
        cachePolicy="memory-disk"
        recyclingKey={imageUrl}
        // 🔧 إعدادات إضافية للتخزين المؤقت
        enableLiveTextInteraction={false}
        autoplay={false}
      />
      
      {/* مؤشر التحميل */}
      {!imageLoaded && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.1)',
          zIndex: 1,
        }}>
          <ActivityIndicator size="small" color="#FFFFFF" />
          {DEBUG_CACHE && (
            <Text style={{ color: 'white', fontSize: 10, marginTop: 8 }}>
              Development Build - جاري التحميل...
            </Text>
          )}
        </View>
      )}
      
      {/* مؤشر التخزين المؤقت */}
      {DEBUG_CACHE && imageLoaded && loadStartTime && (
        <View style={{
          position: 'absolute',
          top: 8,
          left: 8,
          backgroundColor: (Date.now() - loadStartTime) < 100 ? 
            'rgba(34, 197, 94, 0.8)' : 'rgba(59, 130, 246, 0.8)',
          padding: 4,
          borderRadius: 8,
          zIndex: 2,
        }}>
          <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
            {(Date.now() - loadStartTime) < 100 ? '💾 مخبأة' : '🌐 شبكة'}
          </Text>
        </View>
      )}
      
      {/* التدرج اللوني للنص */}
      <LinearGradient
        colors={['rgba(0,0,0,0.2)', 'rgba(0, 0, 0, 0.2)']}
        style={{
          padding: 20,
          height: '100%',
          justifyContent: 'center',
          borderRadius: 24,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {children}
      </LinearGradient>
    </View>
  );
};

const PromotionsCarousel = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadCount, setReloadCount] = useState(0);
  
  const router = useRouter();

  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    try {
      if (DEBUG_CACHE) {
        console.log(`🔄 (Promotions) جلب البيانات - المحاولة ${reloadCount + 1}`);
        console.log(`🏗️ Development Build - التخزين المؤقت مفعل`);
      }
      const data = await getActivePromotions();
      setPromotions(data);
      setReloadCount(prev => prev + 1);
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

    const Content = (
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={{ 
            color: 'white', 
            fontSize: 18, 
            fontWeight: 'bold', 
            textAlign: 'right', 
            marginBottom: 8,
            textShadowColor: 'rgba(0, 0, 0, 0.8)',
            textShadowOffset: { width: 1, height: 1 },
            textShadowRadius: 4,
          }}>
            {item.title}
          </Text>
          <Text style={{ 
            color: 'white', 
            fontSize: 14, 
            textAlign: 'right', 
            lineHeight: 20,
            textShadowColor: 'rgba(0, 0, 0, 0.8)',
            textShadowOffset: { width: 1, height: 1 },
            textShadowRadius: 4,
          }}>
            {item.description}
          </Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <IconComponent color="white" size={48} style={{ opacity: 0.5 }} />
        </View>
      </View>
    );

    if (item.image_url) {
      return (
        <TouchableOpacity
          style={{ padding: 8 }}
          onPress={() => handlePromotionPress(item)}
          activeOpacity={0.8}
        >
          <CachedPromotionImage imageUrl={item.image_url}>
            {Content}
          </CachedPromotionImage>
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
          {Content}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={{ height: 180, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#EF4444" />
        {DEBUG_CACHE && (
          <Text style={{ marginTop: 8, fontSize: 12, color: '#6B7280' }}>
            Development Build - جاري التحميل...
          </Text>
        )}
      </View>
    );
  }

  if (!promotions || promotions.length === 0) {
    return null;
  }

  return (
    <View style={{ height: 180, marginTop: 16 }}>
      {DEBUG_CACHE && (
        <View style={{ paddingHorizontal: 8, marginBottom: 8 }}>
          <Text style={{ fontSize: 12, color: '#6B7280', textAlign: 'center' }}>
            🔍 Development Build - إعادة التحميل: {reloadCount}
          </Text>
        </View>
      )}
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