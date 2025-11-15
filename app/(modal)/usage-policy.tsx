import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { scale, fontScale } from '@/lib/responsive';
import ScreenHeader from '@/components/ui/ScreenHeader';

// تعريف الأنواع
type UsagePolicySection = {
  title: string;
  content: string[];
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  iconColor: string;
};

type FeatureRule = {
  feature: string;
  rules: string[];
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
};

export default function UsagePolicyScreen() {
  const router = useRouter();
  const [expandedSection, setExpandedSection] = useState<number | null>(0);

  const usageSections: UsagePolicySection[] = [
    {
      title: 'استخدام الحساب',
      icon: 'person-circle-outline',
      color: '#DBEAFE',
      iconColor: '#2563EB',
      content: [
        'يجب استخدام الحساب الشخصي فقط ولا يسمح بإنشاء حسابات متعددة.',
        'يحظر مشاركة بيانات الدخول مع أي شخص آخر.',
        'يجب تحديث المعلومات الشخصية في حال تغييرها.',
        'يحق لنا تعليق الحساب في حال الشك في استخدام غير مصرح.'
      ]
    },
    {
      title: 'الطلبات والتوصيل',
      icon: 'fast-food-outline',
      color: '#FEF3C7',
      iconColor: '#D97706',
      content: [
        'يجب التأكد من صحة الطلب قبل التأكيد النهائي.',
        'يجب تقديم عنوان توصيل دقيق ورقم هاتف صحيح.',
        'الطلبات خلال أوقات الذروة قد تستغرق وقتاً إضافياً.',
        'يحق للسائق الاتصال بك لتأكيد العنوان أو تنسيق التسليم.'
      ]
    },
    {
      title: 'العروض والترقيات',
      icon: 'pricetag-outline',
      color: '#DCFCE7',
      iconColor: '#16A34A',
      content: [
        'العروض صالحة للاستخدام الشخصي فقط.',
        'لا يمكن الجمع بين أكثر من عرض في طلب واحد.',
        'لكل عرض شروط استخدام محددة يجب الالتزام بها.',
        'نحتفظ بالحق في إنهاء أو تعديل العروض في أي وقت.'
      ]
    },
    // {
    //   title: 'التقييمات والمراجعات',
    //   icon: 'star-half-outline',
    //   color: '#FCE7F3',
    //   iconColor: '#DB2777',
    //   content: [
    //     'يجب أن تكون التقييمات based على التجربة الفعلية.',
    //     'يُمنع نشر تعليقات مسيئة أو غير لائقة.',
    //     'التقييمات العادلة تساعدنا على تحسين الخدمة.',
    //     'يحق لنا إزالة التقييمات التي تنتهك سياساتنا.'
    //   ]
    // },
    {
      title: 'الإلغاء والاسترجاع',
      icon: 'refresh-circle-outline',
      color: '#FFEDD5',
      iconColor: '#EA580C',
      content: [
        'يمكن إلغاء الطلب خلال 5 دقائق من وضعه.',
        'بعد بدء التحضير، لا يمكن إلغاء الطلب.',
        'في حال وجود مشكلة، يرجى الاتصال بنا خلال 30 دقيقة من الاستلام.',
        'سيتم معالجة طلبات الاسترجاع خلال 3-5 أيام عمل.'
      ]
    },
    {
      title: 'الأمان والخصوصية',
      icon: 'shield-checkmark-outline',
      color: '#F3E8FF',
      iconColor: '#9333EA',
      content: [
        'لا تشارك بيانات الدفع مع أي شخص.',
        'استخدم كلمات مرور قوية لحسابك.',
        'تأكد من تسجيل الخروج من الأجهزة المشتركة.',
        'أبلغنا فوراً عن أي نشاط مشبوه على حسابك.'
      ]
    }
  ];

  const featureRules: FeatureRule[] = [
    {
      feature: 'نظام النقاط والمكافآت',
      icon: 'trophy-outline',
      iconColor: '#D97706',
      rules: [
        'النقاط صالحة لمدة 12 شهراً من تاريخ كسبها',
        'لا يمكن نقل النقاط بين الحسابات',
        'يحق لنا تعديل نظام النقاط مع إشعار مسبق'
      ]
    },
    {
      feature: 'الطلبات المتكررة',
      icon: 'repeat-outline',
      iconColor: '#2563EB',
      rules: [
        'يمكن حفظ الطلبات المفضلة لتكرارها',
        'الأسعار قابلة للتغيير في الطلبات المتكررة',
        'يجب مراجعة الطلب قبل التأكيد النهائي'
      ]
    },
    {
      feature: 'التوصيل السريع',
      icon: 'rocket-outline',
      iconColor: '#DC2626',
      rules: [
        'متاح في المناطق المحددة فقط',
        'قد يختلف الوقت الفعلي حسب الظروف',
        'غير متاح خلال فترات الذروة'
      ]
    }
  ];

  const toggleSection = (index: number) => {
    setExpandedSection(expandedSection === index ? null : index);
  };

  const renderUsageSection = (section: UsagePolicySection, index: number) => (
    <View key={index} style={styles.sectionCard}>
      <TouchableOpacity 
        style={styles.sectionHeader}
        onPress={() => toggleSection(index)}
      >
          <Ionicons 
          name={expandedSection === index ? "chevron-up" : "chevron-down"} 
          size={scale(20)} 
          color="#9CA3AF" 
          />


        <View style={styles.sectionTitleContainer}>

          <View style={[styles.sectionIcon, { backgroundColor: section.color }]}>
            <Ionicons name={section.icon} size={scale(20)} color={section.iconColor} />
          </View>


          <Text style={styles.sectionTitle}>{section.title}</Text>


        </View>


      </TouchableOpacity>
      
      {expandedSection === index && (
        <View style={styles.sectionContent}>
          {section.content.map((paragraph, paragraphIndex) => (
            <View key={paragraphIndex} style={styles.paragraphItem}>
              <View style={styles.bulletPoint} />
              <Text style={styles.paragraphText}>{paragraph}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderFeatureRule = (feature: FeatureRule, index: number) => (
    <View key={index} style={styles.featureCard}>

      <View style={styles.featureHeader}>

        <View style={styles.featureIconContainer}>
          <Ionicons name={feature.icon} size={scale(18)} color={feature.iconColor} />
        </View>

        <Text style={styles.featureTitle}>{feature.feature}</Text>

      </View>

      <View style={styles.rulesContainer}>

        {feature.rules.map((rule, ruleIndex) => (

          <View key={ruleIndex} style={styles.ruleItem}>

            <Ionicons name="ellipse" size={scale(6)} color={feature.iconColor} />

            <Text style={styles.ruleText}>{rule}</Text>

          </View>
        ))}

      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* الهيدر */}
      <ScreenHeader 
        title="سياسة الاستخدام"
        customButton={
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="settings-outline" size={scale(24)} color="#FFF" />
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* المقدمة */}
        <View style={styles.section}>
          <View style={styles.welcomeCard}>
            <View style={styles.welcomeContent}>
              <Text style={styles.welcomeTitle}>دليل استخدام التطبيق</Text>
              <Text style={styles.welcomeText}>
                هذه السياسة توضح كيفية الاستخدام الأمثل للتطبيق وخدماتنا. 
                نرجو الالتزام بهذه الإرشادات لتجربة أفضل.
              </Text>
            </View>
            <View style={styles.welcomeIcon}>
              <Ionicons name="phone-portrait" size={scale(24)} color="#2563EB" />
            </View>
          </View>
        </View>

        {/* الأقسام الرئيسية */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>سياسات الاستخدام</Text>
          <View style={styles.sectionsContainer}>
            {usageSections.map(renderUsageSection)}
          </View>
        </View>

        {/* قواعد الميزات */}
        <View style={styles.section}>
          <View style={styles.featuresHeader}>
            <View style={styles.featuresBadge}>
              <Text style={styles.featuresBadgeText}>{featureRules.length}</Text>
            </View>
            <Text style={styles.sectionTitle}>قواعد الميزات الخاصة</Text>
          </View>
          <View style={styles.featuresContainer}>
            {featureRules.map(renderFeatureRule)}
          </View>
        </View>

        {/* نصائح الاستخدام */}
        <View style={styles.section}>
          <View style={styles.tipsCard}>
            <View style={styles.tipsContent}>
              <View style={styles.tipsIcon}>
                <Ionicons name="bulb-outline" size={scale(20)} color="#FFF" />
              </View>
              <View>
                <Text style={styles.tipsTitle}>نصائح للاستخدام الأمثل</Text>
                <Text style={styles.tipsText}>
                  • تحديث التطبيق دائماً لأحدث الميزات{"\n"}
                  • استخدام العنوان المفصل لتسليم أسرع{"\n"}
                  • مراجعة الطلب قبل التأكيد النهائي{"\n"}
                  • متابعة العروض الخاصة في قسم العروض
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* سياسة المخالفات */}
        <View style={styles.section}>
          <View style={styles.violationCard}>
            <View style={styles.violationInfo}>
              <Text style={styles.violationTitle}>سياسة المخالفات</Text>
              <View style={styles.violationLevels}>
                <View style={styles.violationItem}>
                  <View style={[styles.levelDot, { backgroundColor: '#F59E0B' }]} />
                  <Text style={styles.violationText}>مخالفة بسيطة: تنبيه وإشعار</Text>
                </View>
                <View style={styles.violationItem}>
                  <View style={[styles.levelDot, { backgroundColor: '#EA580C' }]} />
                  <Text style={styles.violationText}>مخالفة متوسطة: تعليق مؤقت</Text>
                </View>
                <View style={styles.violationItem}>
                  <View style={[styles.levelDot, { backgroundColor: '#DC2626' }]} />
                  <Text style={styles.violationText}>مخالفة خطيرة: حظر دائم</Text>
                </View>
              </View>
              <Text style={styles.violationNote}>
                للاستفسارات حول المخالفات: support@almalaky.co
              </Text>
            </View>
            <View style={styles.violationIcon}>
              <Ionicons name="warning-outline" size={scale(20)} color="#FFF" />
            </View>
          </View>
        </View>

        {/* معلومات الإصدار */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>الدجاج الملكي بروست • الإصدار 1.0.0</Text>
          <Text style={styles.updateDate}>
            آخر تحديث: {new Date().toLocaleDateString('ar-SA')}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerIcon: {
    padding: scale(8),
  },
  scrollView: {
    flex: 1,
    marginTop: 0,
  },
  section: {
    paddingHorizontal: scale(20),
    marginTop: scale(24),
  },
  sectionTitle: {
    fontSize: fontScale(18),
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: scale(12),
    textAlign: 'left',
  },

  // بطاقة الترحيب
  welcomeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF',
    padding: scale(16),
    borderRadius: scale(16),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: scale(8),
    elevation: 4,
  },
  welcomeIcon: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(10),
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(12),
  },
  welcomeContent: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: fontScale(16),
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: scale(8),
    textAlign: 'left',
  },
  welcomeText: {
    fontSize: fontScale(14),
    color: '#6B7280',
    lineHeight: scale(20),
    textAlign: 'left',
  },

  // الأقسام
  sectionsContainer: {
    gap: scale(12),
  },
sectionCard: {
    backgroundColor: '#FFF',
    borderRadius: scale(16),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: scale(8),
    elevation: 4,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: scale(16),
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionIcon: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(10),
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: scale(12),
  },
  sectionContent: {
    padding: scale(16),
    paddingTop: 0,
  },
  paragraphItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: scale(12),
  },
  bulletPoint: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
    backgroundColor: '#DC2626',
    marginLeft: scale(12),
    marginTop: scale(8),
  },
  paragraphText: {
    flex: 1,
    fontSize: fontScale(14),
    color: '#6B7280',
    lineHeight: scale(20),
    textAlign: 'left',
  },

  // قواعد الميزات
  featuresHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(12),
  },
  featuresBadge: {
    backgroundColor: '#2563EB',
    paddingHorizontal: scale(12),
    paddingVertical: scale(2),
    borderRadius: scale(14),
    marginLeft: scale(10),
  },
  featuresBadgeText: {
    color: '#FFF',
    fontSize: fontScale(12),
    fontWeight: 'bold',
  },
  featuresContainer: {
    gap: scale(12),
  },
  featureCard: {
    backgroundColor: '#FFF',
    padding: scale(16),
    borderRadius: scale(12),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: scale(8),
    elevation: 4,
  },
  featureHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: scale(12),
    gap: scale(8),
  },
  featureIconContainer: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(8),
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureTitle: {
    fontSize: fontScale(14),
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'left',
    flex: 1,
  },
  rulesContainer: {
    gap: scale(8),
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: scale(8),
  },
  ruleText: {
    fontSize: fontScale(12),
    color: '#6B7280',
    textAlign: 'left',
    lineHeight: scale(16),
    flex: 1,
  },

  // بطاقة النصائح
  tipsCard: {
    backgroundColor: '#16A34A',
    borderRadius: scale(16),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: scale(12),
    elevation: 8,
  },
  tipsContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: scale(20),
    gap: scale(12),
  },
  tipsIcon: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  tipsTitle: {
    fontSize: fontScale(18),
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: scale(8),
    textAlign: 'left',
  },
  tipsText: {
    fontSize: fontScale(14),
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'left',
    lineHeight: scale(20),
  },

  // بطاقة المخالفات
  violationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF',
    padding: scale(16),
    borderRadius: scale(16),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: scale(8),
    elevation: 4,
  },
  violationIcon: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(10),
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: scale(12),
  },
  violationInfo: {
    flex: 1,
  },
  violationTitle: {
    fontSize: fontScale(16),
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: scale(12),
    textAlign: 'left',
  },
  violationLevels: {
    gap: scale(8),
    marginBottom: scale(12),
  },
  violationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  levelDot: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
  },
  violationText: {
    fontSize: fontScale(12),
    color: '#6B7280',
    textAlign: 'left',
  },
  violationNote: {
    fontSize: fontScale(12),
    color: '#9CA3AF',
    textAlign: 'right',
  },

  // معلومات الإصدار
  versionContainer: {
    alignItems: 'center',
    paddingVertical: scale(24),
    paddingBottom: scale(40),
  },
  versionText: {
    fontSize: fontScale(12),
    color: '#9CA3AF',
    marginBottom: scale(4),
  },
  updateDate: {
    fontSize: fontScale(10),
    color: '#D1D5DB',
  },
});