import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  Linking, 
  Platform,
  Image,
  ActivityIndicator
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Animated, { 
  FadeInUp,
  ZoomIn,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  interpolate
} from 'react-native-reanimated';
import { Download, Sparkles, Zap, Shield } from 'lucide-react-native';

export default function ForceUpdateScreen() {
  console.log('✅ شاشة التحديث الجديدة تعمل!');
  const { message, currentVersion = '1.0.0' } = useLocalSearchParams<{ 
    message: string, 
    currentVersion?: string 
  }>();

  const [latestVersion, setLatestVersion] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [storeLinks, setStoreLinks] = useState<{android: string, ios: string} | null>(null);

  const pulse = useSharedValue(0);
  const float1 = useSharedValue(0);
  const float2 = useSharedValue(0);
  const float3 = useSharedValue(0);

  // جلب بيانات التحديث من Supabase
  useEffect(() => {
    const fetchUpdateData = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('app_config')
          .select('latest_version, force_update_version, store_links')
          .eq('id', 1)
          .single();

        if (error) {
          console.error('Error fetching update data:', error);
          return;
        }

        if (data) {
          // استخدام force_update_version إذا موجود، وإلا latest_version
          const version = data.force_update_version || data.latest_version;
          setLatestVersion(version || '');
          setStoreLinks(data.store_links);
        }
      } catch (err) {
        console.error('Failed to fetch update data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUpdateData();
  }, []);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000 }),
        withTiming(0, { duration: 3000 })
      ),
      -1,
      true
    );

    float1.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000 }),
        withTiming(0, { duration: 3000 })
      ),
      -1,
      true
    );

    float2.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 4000 }),
        withTiming(0, { duration: 4000 })
      ),
      -1,
      true
    );

    float3.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 5000 }),
        withTiming(0, { duration: 5000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedBackground = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.3, 0.6]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.1]) }]
  }));

  const particle1Style = useAnimatedStyle(() => ({
    transform: [{ 
      translateY: interpolate(float1.value, [0, 1], [0, -20]) 
    }],
    opacity: interpolate(float1.value, [0, 1], [0.3, 0.6])
  }));

  const particle2Style = useAnimatedStyle(() => ({
    transform: [{ 
      translateY: interpolate(float2.value, [0, 1], [0, -30]) 
    }],
    opacity: interpolate(float2.value, [0, 1], [0.4, 0.7])
  }));

  const particle3Style = useAnimatedStyle(() => ({
    transform: [{ 
      translateY: interpolate(float3.value, [0, 1], [0, -25]) 
    }],
    opacity: interpolate(float3.value, [0, 1], [0.3, 0.5])
  }));

  const handleUpdatePress = async () => {
    try {
      // إذا كان لدينا روابط مخزنة مسبقاً، استخدمها
      if (storeLinks) {
        const link = Platform.OS === 'android' 
          ? storeLinks.android 
          : storeLinks.ios;

        if (link) {
          const supported = await Linking.canOpenURL(link);
          if (supported) {
            await Linking.openURL(link);
          } else {
            alert(`لا يمكن فتح الرابط: ${link}`);
          }
        }
        return;
      }

      // إذا لم تكن الروابط مخزنة، اجلبها من Supabase
      const { data, error } = await supabase
        .from('app_config')
        .select('store_links')
        .eq('id', 1)
        .single();

      if (error || !data?.store_links) {
        throw new Error("Could not fetch store links.");
      }
      
      const link = Platform.OS === 'android' 
        ? data.store_links.android 
        : data.store_links.ios;

      if (link) {
        const supported = await Linking.canOpenURL(link);
        if (supported) {
          await Linking.openURL(link);
        } else {
          alert(`لا يمكن فتح الرابط: ${link}`);
        }
      }
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء محاولة فتح المتجر.');
    }
  };

  const newFeatures = [
    { icon: Zap, text: "تجربة طلب أسرع", color: "#dc2626" },
    { icon: Shield, text: "ميزات أمان محسنة", color: "#dc2626" },
    { icon: Sparkles, text: "واجهة مستخدم محسنة", color: "#dc2626" },
  ];

  // عرض loading أثناء جلب البيانات
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>جاري التحقق من التحديثات...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.backgroundCircle1, animatedBackground]} />
      <Animated.View style={[styles.backgroundCircle2]} />
      <Animated.View style={[styles.backgroundCircle3]} />

      <Animated.View style={[styles.particle1, particle1Style]} />
      <Animated.View style={[styles.particle2, particle2Style]} />
      <Animated.View style={[styles.particle3, particle3Style]} />

      <View style={styles.content}>
        {/* الشعار */}
        <Animated.View 
          entering={ZoomIn.duration(800).springify()}
          style={styles.logoContainer}
        >
          <View style={styles.logoBackground}>
            <Image 
              source={{ uri: 'https://dgplcadvneqpohxqlilg.supabase.co/storage/v1/object/public/menu_image/icon.png' }}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        {/* بطاقة التحديث */}
        <Animated.View 
          entering={FadeInUp.duration(600).delay(400)}
          style={styles.cardWrapper}
        >
          <Card style={styles.card}>
            <Animated.View 
              entering={ZoomIn.duration(600).delay(600)}
              style={styles.badgeContainer}
            >
              <Badge>
                <Sparkles size={14} color="#fff" />
                <Text style={styles.badgeText}> تحديث مطلوب</Text>
              </Badge>
            </Animated.View>

            <Animated.Text 
              entering={FadeInUp.duration(500).delay(700)}
              style={styles.title}
            >
              يتوفر إصدار جديد!
            </Animated.Text>

            <Animated.Text 
              entering={FadeInUp.duration(500).delay(800)}
              style={styles.description}
            >
              {message || 'لقد قمنا ببعض التحسينات المثيرة! يرجى التحديث إلى أحدث إصدار للاستمرار في الاستمتاع بتطبيق ملكي.'}
            </Animated.Text>

            <Animated.View 
              entering={FadeInUp.duration(500).delay(900)}
              style={styles.versionContainer}
            >
              <View style={styles.versionRow}>
                <Text style={styles.versionLabel}>الإصدار الحالي</Text>
                <Text style={styles.versionValue}>{currentVersion}</Text>
              </View>
              <View style={styles.versionRow}>
                <Text style={styles.versionLabel}>أحدث إصدار</Text>
                <Text style={styles.latestVersion}>{latestVersion || '2.0.0'}</Text>
              </View>
            </Animated.View>

            <Animated.View 
              entering={FadeInUp.duration(500).delay(1000)}
              style={styles.featuresContainer}
            >
              <View style={styles.featuresHeader}>
                <Sparkles size={18} color="#dc2626" />
                <View style={{ width: 8 }} />
                <Text style={styles.featuresTitle}>ما الجديد</Text>
              </View>
              
              <View style={styles.featuresList}>
                {newFeatures.map((feature, index) => {
                  const IconComponent = feature.icon;
                  return (
                    <Animated.View
                      key={index}
                      entering={FadeInUp.duration(400).delay(1100 + index * 100)}
                      style={styles.featureItem}
                    >
                      <View style={[styles.featureIcon, { backgroundColor: `${feature.color}20` }]}>
                        <IconComponent size={16} color={feature.color} />
                      </View>
                      <View style={{ width: 12 }} />
                      <Text style={styles.featureText}>{feature.text}</Text>
                    </Animated.View>
                  );
                })}
              </View>
            </Animated.View>

            <Animated.View 
              entering={FadeInUp.duration(500).delay(1400)}
            >
              <TouchableOpacity 
                style={styles.updateButton}
                onPress={handleUpdatePress}
                activeOpacity={0.9}
              >
                <Download size={20} color="#fff" />
                <View style={{ width: 8 }} />
                <Text style={styles.updateButtonText}>تحديث الآن</Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.Text 
              entering={FadeIn.duration(500).delay(1600)}
              style={styles.infoText}
            >
              هذا التحديث مطلوب للاستمرار في استخدام التطبيق
            </Animated.Text>
          </Card>
        </Animated.View>

        {/* شارة الأمان */}
        <Animated.View 
          entering={FadeInUp.duration(500).delay(1800)}
          style={styles.securityContainer}
        >
          <Shield size={16} color="rgba(255,255,255,0.8)" />
          <View style={{ width: 8 }} />
          <Text style={styles.securityText}>تحديث آمن وموثوق</Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#dc2626',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
    fontFamily: 'Cairo-Regular',
  },
  backgroundCircle1: {
    position: 'absolute',
    top: -150,
    right: -150,
    width: 300,
    height: 300,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 150,
  },
  backgroundCircle2: {
    position: 'absolute',
    bottom: -100,
    left: -100,
    width: 200,
    height: 200,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 100,
  },
  backgroundCircle3: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -250,
    marginTop: -250,
    width: 500,
    height: 500,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 250,
  },
  particle1: {
    position: 'absolute',
    top: 60,
    left: 60,
    width: 4,
    height: 4,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  particle2: {
    position: 'absolute',
    top: 120,
    right: 60,
    width: 6,
    height: 6,
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  particle3: {
    position: 'absolute',
    bottom: 80,
    left: 80,
    width: 4,
    height: 4,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoBackground: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  logo: {
    width: 120,
    height: 120,
  },
  cardWrapper: {
    width: '100%',
    maxWidth: 380,
  },
  card: {
    width: '100%',
    padding: 24,
  },
  badgeContainer: {
    marginBottom: 20,
  },
  badgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1f2937',
    marginBottom: 8,
    lineHeight: 32,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 20,
  },
  versionContainer: {
    backgroundColor: 'rgba(220, 38, 38, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.1)',
  },
  versionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  versionLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  versionValue: {
    fontSize: 13,
    color: '#1f2937',
    fontWeight: '600',
  },
  latestVersion: {
    fontSize: 13,
    color: '#dc2626',
    fontWeight: '600',
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featuresHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featuresTitle: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '600',
  },
  featuresList: {},
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureIcon: {
    padding: 6,
    borderRadius: 6,
  },
  featureText: {
    fontSize: 13,
    color: '#374151',
    flex: 1,
  },
  updateButton: {
    backgroundColor: '#dc2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  infoText: {
    fontSize: 11,
    textAlign: 'center',
    color: '#9ca3af',
    marginTop: 16,
  },
  securityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  securityText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
  },
});