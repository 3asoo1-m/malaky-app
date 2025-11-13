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
type GuidelineSection = {
  title: string;
  items: string[];
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  iconColor: string;
};

type ProhibitedItem = {
  text: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
};

type PenaltyItem = {
  level: string;
  description: string;
  color: string;
};

export default function CommunityGuidelinesScreen() {
  const router = useRouter();
  const [expandedSection, setExpandedSection] = useState<number | null>(0);

  const guidelineSections: GuidelineSection[] = [
    {
      title: 'قواعد السلوك الأساسية',
      icon: 'people-outline',
      color: '#DBEAFE',
      iconColor: '#2563EB',
      items: [
        'التعامل بلطف واحترام مع جميع أعضاء المجتمع وفريق العمل',
        'استخدام لغة مهذبة ومناسبة في جميع التواصل',
        'احترام الخصوصية وعدم مشاركة معلومات شخصية للآخرين',
        'تقديم ملاحظات بناءة تساعد على تحسين الخدمة'
      ]
    },
    {
      title: 'إرشادات الطلبات والتقييمات',
      icon: 'star-outline',
      color: '#FEF3C7',
      iconColor: '#D97706',
      items: [
        'تأكد من صحة الطلب قبل التأكيد لتجنب الأخطاء',
        'قدم عنوان توصيل دقيق ورقم هاتف صحيح',
        'قيم تجربتك بناءً على الجودة والخدمة الفعلية',
        'شارك تجربتك بصدق لمساعدتنا على التحسين'
      ]
    },
    {
      title: 'استخدام العروض والترقيات',
      icon: 'gift-outline',
      color: '#FCE7F3',
      iconColor: '#DB2777',
      items: [
        'اقرأ شروط الاستخدام لكل عرض أو ترقية',
        'استخدم العروض خلال فتراتها المحددة',
        'لا تحاول إساءة استخدام نظام العروض',
        'احترم قواعد الولاء والمكافآت'
      ]
    }
  ];

  const prohibitedItems: ProhibitedItem[] = [
    { text: 'الإساءة لفريق العمل أو السائقين', icon: 'close-circle', color: '#DC2626' },
    { text: 'الطلبات الوهمية أو الاحتيالية', icon: 'warning', color: '#EA580C' },
    { text: 'إساءة استخدام نظام العروض', icon: 'shield-checkmark', color: '#2563EB' },
    { text: 'انتحال شخصية الآخرين', icon: 'person-remove', color: '#9333EA' },
    { text: 'مشاركة محتوى غير لائق', icon: 'eye-off', color: '#475569' }
  ];

  const penalties: PenaltyItem[] = [
    { level: 'تحذير', description: 'في حالة المخالفات البسيطة', color: '#F59E0B' },
    { level: 'تعليق مؤقت', description: 'في حالة التكرار أو المخالفات المتوسطة', color: '#EA580C' },
    { level: 'حظر دائم', description: 'في المخالفات الخطيرة أو المتكررة', color: '#DC2626' }
  ];

  const toggleSection = (index: number) => {
    setExpandedSection(expandedSection === index ? null : index);
  };

  const renderGuidelineSection = (section: GuidelineSection, index: number) => (
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
          {section.items.map((item, itemIndex) => (
            <View key={itemIndex} style={styles.guidelineItem}>
              <View style={styles.bulletPoint} />
              <Text style={styles.guidelineText}>{item}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderProhibitedItem = (item: ProhibitedItem, index: number) => (
    <View key={index} style={styles.prohibitedItem}>
      <Ionicons name={item.icon} size={scale(18)} color={item.color} />
      <Text style={styles.prohibitedText}>{item.text}</Text>
    </View>
  );

  const renderPenaltyItem = (penalty: PenaltyItem, index: number) => (
    <View key={index} style={styles.penaltyCard}>
      <View style={[styles.penaltyLevel, { backgroundColor: penalty.color }]}>
        <Text style={styles.penaltyLevelText}>{penalty.level}</Text>
      </View>
      <Text style={styles.penaltyDescription}>{penalty.description}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* الهيدر */}
      <ScreenHeader title='إرشادات المجتمع'
      customButton={<TouchableOpacity style={styles.headerIcon}>
          <Ionicons name="people-circle-outline" size={scale(24)} color="#FFF" />
        </TouchableOpacity>}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* المقدمة */}
        <View style={styles.section}>
          <View style={styles.welcomeCard}>
            <View style={styles.welcomeContent}>
              <Text style={styles.welcomeTitle}>مرحباً بك في عائلة الدجاج الملكي بروست 👑</Text>
              <Text style={styles.welcomeText}>
                إرشادات المجتمع تساعدنا في الحفاظ على بيئة آمنة ومحترمة للجميع، 
                وضمان تجربة طعام استثنائية لكل عضو في عائلتنا.
              </Text>
            </View>
            <View style={styles.welcomeIcon}>
              <Ionicons name="restaurant" size={scale(24)} color="#DC2626" />
            </View>
          </View>
        </View>

        {/* الإرشادات الرئيسية */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>إرشادات مجتمعنا</Text>
          <View style={styles.guidelinesContainer}>
            {guidelineSections.map(renderGuidelineSection)}
          </View>
        </View>

        {/* المحظورات */}
        <View style={styles.section}>
          <View style={styles.prohibitedHeader}>
            <View style={styles.prohibitedBadge}>
              <Text style={styles.prohibitedBadgeText}>{prohibitedItems.length}</Text>
            </View>
            <Text style={styles.sectionTitle}>السلوكيات غير المقبولة</Text>
          </View>
          <View style={styles.prohibitedContainer}>
            {prohibitedItems.map(renderProhibitedItem)}
          </View>
        </View>

        {/* العقوبات */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>نظام العقوبات</Text>
          <View style={styles.penaltiesContainer}>
            {penalties.map(renderPenaltyItem)}
          </View>
        </View>

        {/* ساعات الدعم */}
        <View style={styles.section}>
          <View style={styles.supportCard}>
            <View style={styles.supportInfo}>
              <Text style={styles.supportTitle}>ساعات الدعم المجتمعي</Text>
              <View style={styles.supportHours}>
                <View style={styles.hourRow}>
                  <Text style={styles.hourTime}>8:00 ص - 10:00 م</Text>
                  <Text style={styles.hourDay}>الإثنين - الجمعة</Text>
                </View>
                <View style={styles.hourRow}>
                  <Text style={styles.hourTime}>9:00 ص - 9:00 م</Text>
                  <Text style={styles.hourDay}>السبت - الأحد</Text>
                </View>
              </View>
              <Text style={styles.supportContact}>
                للاستفسارات: support@almalaky.co • 9200XXXXX
              </Text>
            </View>
            <View style={styles.supportIcon}>
              <Ionicons name="headset" size={scale(20)} color="#FFF" />
            </View>
          </View>
        </View>

        {/* التعهد */}
        <View style={styles.section}>
          <View style={styles.commitmentCard}>
            <View style={styles.commitmentOverlay} />
            <View style={styles.commitmentContent}>
              <View style={styles.commitmentIcon}>
                <Ionicons name="shield-checkmark" size={scale(20)} color="#FFF" />
              </View>
      <View style={styles.commitmentTextContainer}>
                
                <Text style={styles.commitmentTitle}>تعهدنا لك</Text>
                <Text style={styles.commitmentText}>
                  نلتزم بتقديم أفضل جودة طعام وأسرع خدمة، 
                  ونضمن معاملة كل عميل كعضو في عائلتنا الملكية.
                </Text>
              </View>
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
    flexDirection: 'row-reverse',
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
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: scale(12),
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

  // الإرشادات
  guidelinesContainer: {
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
  guidelineItem: {
    flexDirection: 'row-reverse',
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
  guidelineText: {
    flex: 1,
    fontSize: fontScale(14),
    color: '#6B7280',
    lineHeight: scale(20),
    textAlign: 'left',
  },

  // المحظورات
  prohibitedHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(12),
  },
  prohibitedBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: scale(12),
    paddingVertical: scale(2),
    borderRadius: scale(14),
    marginLeft: scale(10),
  },
  prohibitedBadgeText: {
    color: '#FFF',
    fontSize: fontScale(12),
    fontWeight: 'bold',
  },
  prohibitedContainer: {
    backgroundColor: '#FFF',
    borderRadius: scale(16),
    padding: scale(16),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: scale(8),
    elevation: 4,
  },
  prohibitedItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: scale(8),
  },
  prohibitedText: {
    flex: 1,
    fontSize: fontScale(14),
    color: '#374151',
    textAlign: 'left',
    marginRight: scale(12),
  },

  // العقوبات
  penaltiesContainer: {
    flexDirection: 'row',
    gap: scale(12),
  },
  penaltyCard: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: scale(16),
    borderRadius: scale(16),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: scale(8),
    elevation: 4,
  },
  penaltyLevel: {
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    borderRadius: scale(20),
    marginBottom: scale(8),
  },
  penaltyLevelText: {
    color: '#FFF',
    fontSize: fontScale(12),
    fontWeight: 'bold',
  },
  penaltyDescription: {
    fontSize: fontScale(12),
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: scale(16),
  },

  // بطاقة الدعم
  supportCard: {
    flexDirection: 'row-reverse',
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
  supportIcon: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(10),
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: scale(12),
  },
  supportInfo: {
    flex: 1,
  },
  supportTitle: {
    fontSize: fontScale(16),
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: scale(8),
    textAlign: 'left',
  },
  supportHours: {
    gap: scale(6),
    marginBottom: scale(12),
  },
  hourRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hourDay: {
    fontSize: fontScale(14),
    color: '#6B7280',
    textAlign: 'right',
  },
  hourTime: {
    fontSize: fontScale(14),
    color: '#1F2937',
    fontWeight: '500',
  },
  supportContact: {
    fontSize: fontScale(12),
    color: '#9CA3AF',
    textAlign: 'left',
  },

  // بطاقة التعهد
  commitmentCard: {
    backgroundColor: '#DC2626',
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
  commitmentOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  commitmentContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: scale(20),

  },
  commitmentIcon: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: scale(12), // ✅ إضافة marginLeft لفصل الأيقونة عن النص
    flexShrink: 0,
  },
  commitmentTextContainer: {
    flex: 1, // ✅ أخذ المساحة المتبقية
  },
  commitmentTitle: {
    fontSize: fontScale(18),
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: scale(4),
    textAlign: 'left',
  },
  commitmentText: {
    fontSize: fontScale(14),
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'left',
    lineHeight: scale(20),
    flex: 1, // ✅ إضافة flex: 1 لتمديد النص
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