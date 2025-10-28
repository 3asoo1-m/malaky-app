import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView,
  Image,
  ScrollView
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
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
import { 
  Wrench, 
  Clock, 
  Phone, 
  Mail, 
  MessageCircle, 
  Settings, 
  Zap,
  CheckCircle2 
} from 'lucide-react-native';

export default function MaintenanceScreen() {
  const { message } = useLocalSearchParams<{ message: string }>();

  const pulse = useSharedValue(0);
  const float1 = useSharedValue(0);
  const float2 = useSharedValue(0);
  const float3 = useSharedValue(0);
  const wrenchRotate = useSharedValue(0);

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
        withTiming(1, { duration: 4000 }),
        withTiming(0, { duration: 4000 })
      ),
      -1,
      true
    );

    float2.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 5000 }),
        withTiming(0, { duration: 5000 })
      ),
      -1,
      true
    );

    float3.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 6000 }),
        withTiming(0, { duration: 6000 })
      ),
      -1,
      true
    );

    wrenchRotate.value = withRepeat(
      withSequence(
        withTiming(15, { duration: 1000 }),
        withTiming(-15, { duration: 1000 }),
        withTiming(0, { duration: 1000 })
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
    transform: [
      { translateY: interpolate(float1.value, [0, 1], [0, -15]) },
      { translateX: interpolate(float1.value, [0, 1], [0, 8]) }
    ],
    opacity: interpolate(float1.value, [0, 1], [0.3, 0.6])
  }));

  const particle2Style = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(float2.value, [0, 1], [0, -20]) },
      { translateX: interpolate(float2.value, [0, 1], [0, -10]) }
    ],
    opacity: interpolate(float2.value, [0, 1], [0.4, 0.7])
  }));

  const particle3Style = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(float3.value, [0, 1], [0, -18]) },
      { translateX: interpolate(float3.value, [0, 1], [0, 9]) }
    ],
    opacity: interpolate(float3.value, [0, 1], [0.3, 0.5])
  }));

  const wrenchStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${wrenchRotate.value}deg` }]
  }));

  const workItems = [
    { icon: Zap, text: "ترقية السيرفرات لأداء أفضل", color: "#dc2626" },
    { icon: Settings, text: "تطوير ميزات جديدة", color: "#dc2626" },
    { icon: CheckCircle2, text: "تحسين استقرار التطبيق", color: "#dc2626" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* الخلفية المتحركة */}
      <Animated.View style={[styles.backgroundCircle1, animatedBackground]} />
      <Animated.View style={[styles.backgroundCircle2]} />
      <Animated.View style={[styles.backgroundCircle3]} />

      {/* الجسيمات الطافية */}
      <Animated.View style={[styles.particle1, particle1Style]} />
      <Animated.View style={[styles.particle2, particle2Style]} />
      <Animated.View style={[styles.particle3, particle3Style]} />

      {/* أيقونة المفتاح المتحركة */}
      <Animated.View style={[styles.wrenchIcon, wrenchStyle]}>
        <Wrench size={60} color="rgba(255,255,255,0.1)" />
      </Animated.View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
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
            {/* الحلقة النابضة */}
            <Animated.View 
              style={[styles.pulsingRing]}
              entering={FadeIn.duration(1000)}
            />
          </View>
        </Animated.View>

        {/* بطاقة الصيانة */}
        <Animated.View 
          entering={FadeInUp.duration(600).delay(400)}
          style={styles.cardWrapper}
        >
          <Card style={styles.card}>
            {/* الشارة */}
            <Animated.View 
              entering={ZoomIn.duration(600).delay(600)}
              style={styles.badgeContainer}
            >
              <Badge style={styles.maintenanceBadge}>
                <Animated.View style={wrenchStyle}>
                  <Wrench size={14} color="#fff" />
                </Animated.View>
                <Text style={styles.badgeText}> تحت الصيانة</Text>
              </Badge>
            </Animated.View>

            {/* العنوان */}
            <Animated.Text 
              entering={FadeInUp.duration(500).delay(700)}
              style={styles.title}
            >
              سنعود قريباً!
            </Animated.Text>

            {/* الوصف */}
            <Animated.Text 
              entering={FadeInUp.duration(500).delay(800)}
              style={styles.description}
            >
              {message || 'نحن نقوم حاليًا بإجراء صيانة مجدولة لتحسين تجربتك. شكرًا لك على صبرك!'}
            </Animated.Text>

            {/* الوقت المتوقع */}
            <Animated.View 
              entering={FadeInUp.duration(500).delay(900)}
              style={styles.timeContainer}
            >
              <View style={styles.timeHeader}>
                <View style={styles.clockIcon}>
                  <Clock size={18} color="#dc2626" />
                </View>
                <View>
                  <Text style={styles.timeLabel}>الوقت المتوقع</Text>
                  <Text style={styles.timeValue}>2-3 ساعات</Text>
                </View>
              </View>
              <View style={styles.expectedTime}>
                <Text style={styles.expectedLabel}>متوقع العودة الساعة:</Text>
                <Text style={styles.expectedValue}>4:00 مساءً</Text>
              </View>
            </Animated.View>

            {/* الأعمال قيد التنفيذ */}
            <Animated.View 
              entering={FadeInUp.duration(500).delay(1000)}
              style={styles.workContainer}
            >
              <View style={styles.workHeader}>
                <Settings size={16} color="#dc2626" />
                <View style={{ width: 6 }} />
                <Text style={styles.workTitle}>ما الذي نعمل عليه</Text>
              </View>
              
              <View style={styles.workList}>
                {workItems.map((item, index) => {
                  const IconComponent = item.icon;
                  return (
                    <Animated.View
                      key={index}
                      entering={FadeInUp.duration(400).delay(1100 + index * 100)}
                      style={styles.workItem}
                    >
                      <View style={[styles.workIcon, { backgroundColor: `${item.color}20` }]}>
                        <IconComponent size={14} color={item.color} />
                      </View>
                      <View style={{ width: 10 }} />
                      <Text style={styles.workText}>{item.text}</Text>
                    </Animated.View>
                  );
                })}
              </View>
            </Animated.View>

            {/* التواصل مع الدعم */}
            <Animated.View 
              entering={FadeInUp.duration(500).delay(1400)}
              style={styles.contactContainer}
            >
              <Text style={styles.contactTitle}>تحتاج مساعدة عاجلة؟</Text>
              <View style={styles.contactButtons}>
                <View style={styles.contactButton}>
                  <Phone size={18} color="#dc2626" />
                  <Text style={styles.contactButtonText}>اتصال</Text>
                </View>
                <View style={styles.contactButton}>
                  <Mail size={18} color="#dc2626" />
                  <Text style={styles.contactButtonText}>بريد</Text>
                </View>
                <View style={styles.contactButton}>
                  <MessageCircle size={18} color="#dc2626" />
                  <Text style={styles.contactButtonText}>محادثة</Text>
                </View>
              </View>
            </Animated.View>

            {/* تحميل متحرك */}
            <Animated.View 
              entering={FadeIn.duration(500).delay(1600)}
              style={styles.loadingContainer}
            >
              <View style={styles.loadingDots}>
                <Animated.View 
                  style={[styles.loadingDot]}
                  entering={FadeInUp.duration(400).delay(1700)}
                />
                <Animated.View 
                  style={[styles.loadingDot]}
                  entering={FadeInUp.duration(400).delay(1800)}
                />
                <Animated.View 
                  style={[styles.loadingDot]}
                  entering={FadeInUp.duration(400).delay(1900)}
                />
              </View>
              <Text style={styles.loadingText}>نعمل بجد لخدمتك بشكل أفضل</Text>
            </Animated.View>
          </Card>
        </Animated.View>

        {/* نص التذييل */}
        <Animated.Text 
          entering={FadeInUp.duration(500).delay(1800)}
          style={styles.footerText}
        >
          تابعنا على وسائل التواصل الاجتماعي للحصول على التحديثات في الوقت الفعلي
        </Animated.Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#dc2626',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    minHeight: '100%',
  },
  backgroundCircle1: {
    position: 'absolute',
    top: -120,
    right: -120,
    width: 240,
    height: 240,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 120,
  },
  backgroundCircle2: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 160,
    height: 160,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 80,
  },
  backgroundCircle3: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -200,
    marginTop: -200,
    width: 400,
    height: 400,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 200,
  },
  particle1: {
    position: 'absolute',
    top: 40,
    left: 40,
    width: 3,
    height: 3,
    backgroundColor: '#fff',
    borderRadius: 1.5,
  },
  particle2: {
    position: 'absolute',
    top: 80,
    right: 40,
    width: 4,
    height: 4,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  particle3: {
    position: 'absolute',
    bottom: 60,
    left: 60,
    width: 3,
    height: 3,
    backgroundColor: '#fff',
    borderRadius: 1.5,
  },
  wrenchIcon: {
    position: 'absolute',
    top: 50,
    right: 50,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoBackground: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  logo: {
    width: 80,
    height: 80,
  },
  pulsingRing: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderWidth: 3,
    borderColor: '#dc2626',
    borderRadius: 23,
    opacity: 0.5,
  },
  cardWrapper: {
    width: '100%',
    maxWidth: 340,
  },
  card: {
    width: '100%',
    padding: 20,
  },
  badgeContainer: {
    marginBottom: 16,
  },
  maintenanceBadge: {
    backgroundColor: '#f97316',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1f2937',
    marginBottom: 6,
    lineHeight: 28,
  },
  description: {
    fontSize: 12,
    textAlign: 'center',
    color: '#6b7280',
    lineHeight: 18,
    marginBottom: 16,
  },
  timeContainer: {
    backgroundColor: 'rgba(220, 38, 38, 0.05)',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.1)',
  },
  timeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  clockIcon: {
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    padding: 6,
    borderRadius: 6,
    marginRight: 10,
  },
  timeLabel: {
    fontSize: 11,
    color: '#6b7280',
  },
  timeValue: {
    fontSize: 13,
    color: '#1f2937',
    fontWeight: '600',
  },
  expectedTime: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expectedLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginRight: 4,
  },
  expectedValue: {
    fontSize: 10,
    color: '#dc2626',
    fontWeight: '600',
  },
  workContainer: {
    marginBottom: 16,
  },
  workHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  workTitle: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
  },
  workList: {},
  workItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  workIcon: {
    padding: 5,
    borderRadius: 5,
  },
  workText: {
    fontSize: 11,
    color: '#374151',
    flex: 1,
  },
  contactContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
    marginBottom: 16,
  },
  contactTitle: {
    fontSize: 11,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 10,
  },
  contactButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  contactButton: {
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    flex: 1,
  },
  contactButtonText: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 4,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 4,
  },
  loadingDot: {
    width: 5,
    height: 5,
    backgroundColor: '#dc2626',
    borderRadius: 2.5,
  },
  loadingText: {
    fontSize: 10,
    color: '#9ca3af',
    textAlign: 'center',
  },
  footerText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
  },
});