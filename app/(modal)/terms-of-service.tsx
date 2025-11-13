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
type TermSection = {
  title: string;
  content: string[];
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  iconColor: string;
};

type ResponsibilityItem = {
  user: string;
  company: string;
};

export default function TermsOfServiceScreen() {
  const router = useRouter();
  const [expandedSection, setExpandedSection] = useState<number | null>(0);

  const termSections: TermSection[] = [
    {
      title: 'القبول والشروط',
      icon: 'checkmark-circle-outline',
      color: '#DCFCE7',
      iconColor: '#16A34A',
      content: [
        'باستخدامك تطبيق الدجاج الملكي بروست، فإنك توافق على الالتزام بهذه الشروط والأحكام.',
        'يحق لنا تعديل هذه الشروط في أي وقت، وسيتم إشعارك بالتغييرات عبر التطبيق.',
        'يجب أن تكون بالغاً (18 سنة) أو تستخدم التطبيق بإشراف ولي الأمر.'
      ]
    },
    {
      title: 'إنشاء الحساب',
      icon: 'person-add-outline',
      color: '#DBEAFE',
      iconColor: '#2563EB',
      content: [
        'يجب تقديم معلومات دقيقة وصحيحة عند إنشاء الحساب.',
        'أنت مسؤول عن الحفاظ على سرية معلومات حسابك.',
        'يجب إبلاغنا فوراً عن أي استخدام غير مصرح لحسابك.',
        'يحق لنا تعليق أو إلغاء الحساب في حال المخالفات.'
      ]
    },
    {
      title: 'الطلبات والدفع',
      icon: 'card-outline',
      color: '#FEF3C7',
      iconColor: '#D97706',
      content: [
        'الأسعار المعروضة شاملة الضريبة المضافة.',
        'يجب التأكد من صحة الطلب قبل تأكيده.',
        'نحتفظ بالحق في رفض أو إلغاء أي طلب.',
        'الدفع الإلكتروني يتم عبر بوابات دفع آمنة ومعتمدة.',
        'في حال وجود خطأ في السعر، سنتواصل معك قبل معالجة الطلب.'
      ]
    },
    {
      title: 'التوصيل والاستلام',
      icon: 'car-outline',
      color: '#FFEDD5',
      iconColor: '#EA580C',
      content: [
        'أوقات التوصيل تقديرية وقد تختلف حسب الظروف.',
        'يجب تقديم عنوان دقيق ورقم هاتف صحيح.',
        'أنت مسؤول عن استلام الطلب في العنوان المحدد.',
        'في حال عدم التمكن من التسليم، قد يتم تطبيق رسوم إضافية.',
        'الاستلام من المطعم متاح خلال ساعات العمل الرسمية.'
      ]
    },
    {
      title: 'الإلغاء والاسترجاع',
      icon: 'arrow-undo-outline',
      color: '#FCE7F3',
      iconColor: '#DB2777',
      content: [
        'يمكن إلغاء الطلب خلال 5 دقائق من وضعه.',
        'بعد بدء التحضير، لا يمكن إلغاء الطلب.',
        'في حال وجود مشكلة بالطلب، يرجى الاتصال بنا خلال 30 دقيقة من الاستلام.',
        'نضمن استبدال أو استرجاع المبالغ للطلبات التي بها أخطاء من جهتنا.'
      ]
    },
    {
      title: 'الملكية الفكرية',
      icon: 'business-outline',
      color: '#F3E8FF',
      iconColor: '#9333EA',
      content: [
        'جميع حقوق الملكية الفكرية للتطبيق والمحتوى محفوظة للدجاج الملكي بروست.',
        'لا يسمح بنسخ أو تعديل أو توزيع أي جزء من التطبيق.',
        'الشعارات والعلامات التجارية مملوكة للدجاج الملكي بروست.',
        'المحتوى المقدم من المستخدمين يخضع لترخيص الاستخدام.'
      ]
    },
    {
      title: 'حدود المسؤولية',
      icon: 'warning-outline',
      color: '#FECACA',
      iconColor: '#DC2626',
      content: [
        'لا نتحمل مسؤولية التأخير الناتج عن ظروف خارجة عن إرادتنا.',
        'مسؤوليتنا محدودة بقيمة الطلب في حال وجود أخطاء.',
        'لا نتحمل مسؤولية الأضرار غير المباشرة.',
        'نحن غير مسؤولين عن استخدام التطبيق بشكل غير قانوني.'
      ]
    }
  ];

  const responsibilities: ResponsibilityItem[] = [
    { 
      user: 'تقديم معلومات دقيقة وصحيحة', 
      company: 'تأمين وحماية بيانات المستخدم' 
    },
    { 
      user: 'الالتزام بمواعيد استلام الطلبات', 
      company: 'توصيل الطلبات في الوقت المتفق عليه' 
    },
    { 
      user: 'استخدام التطبيق بشكل قانوني وأخلاقي', 
      company: 'توفير خدمة ذات جودة عالية' 
    },
    { 
      user: 'الإبلاغ عن المشاكل خلال الوقت المحدد', 
      company: 'معالجة الشكاوى خلال 24 ساعة' 
    }
  ];

  const toggleSection = (index: number) => {
    setExpandedSection(expandedSection === index ? null : index);
  };

  const renderTermSection = (section: TermSection, index: number) => (
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

  const renderResponsibility = (item: ResponsibilityItem, index: number) => (
  <View key={index} style={styles.responsibilityItem}>
    <View style={styles.responsibilityColumn}>
      <View style={styles.responsibilityHeader}>
        <Ionicons name="person-outline" size={scale(16)} color="#2563EB" />
        <Text style={[styles.responsibilityTitle, { color: '#2563EB' }]}>مسؤوليتك</Text>
      </View>
      <Text style={styles.responsibilityText}>{item.user}</Text>
    </View>
    <View style={styles.responsibilityDivider} />
    <View style={styles.responsibilityColumn}>
      <View style={styles.responsibilityHeader}>
        <Ionicons name="business-outline" size={scale(16)} color="#DC2626" />
        <Text style={[styles.responsibilityTitle, { color: '#DC2626' }]}>مسؤوليتنا</Text>
      </View>
      <Text style={styles.responsibilityText}>{item.company}</Text>
    </View>
  </View>
);

  return (
    <View style={styles.container}>
      {/* الهيدر */}
      <ScreenHeader 
        title="الشروط والأحكام"
        customButton={
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="document-text-outline" size={scale(24)} color="#FFF" />
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* المقدمة */}
        <View style={styles.section}>
          <View style={styles.welcomeCard}>
            <View style={styles.welcomeContent}>
              <Text style={styles.welcomeTitle}>شروط استخدام تطبيق الدجاج الملكي بروست</Text>
              <Text style={styles.welcomeText}>
                هذه الشروط والأحكام تنظم استخدامك لتطبيقنا وخدماتنا. 
                نرجو قراءتها بعناية قبل استخدام التطبيق.
              </Text>
            </View>
            <View style={styles.welcomeIcon}>
              <Ionicons name="scale-outline" size={scale(24)} color="#2563EB" />
            </View>
          </View>
        </View>

        {/* الأقسام الرئيسية */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>الشروط والأحكام</Text>
          <View style={styles.sectionsContainer}>
            {termSections.map(renderTermSection)}
          </View>
        </View>

        {/* المسؤوليات المتبادلة */}
        <View style={styles.section}>
          <View style={styles.responsibilitiesHeader}>
            <View style={styles.responsibilitiesBadge}>
              <Text style={styles.responsibilitiesBadgeText}>{responsibilities.length}</Text>
            </View>
            <Text style={styles.sectionTitle}>المسؤوليات المتبادلة</Text>
          </View>
          <View style={styles.responsibilitiesContainer}>
            {responsibilities.map(renderResponsibility)}
          </View>
        </View>

        {/* بنود هامة */}
        <View style={styles.section}>
          <View style={styles.importantCard}>
            <View style={styles.importantContent}>
              <View style={styles.importantIcon}>
                <Ionicons name="alert-circle" size={scale(20)} color="#FFF" />
              </View>
              <View>
                <Text style={styles.importantTitle}>بنود هامة</Text>
                <Text style={styles.importantText}>
                  • يحق لنا تحديث هذه الشروط في أي وقت{"\n"}
                  • الاستمرار في استخدام التطبيق يعني الموافقة على التحديثات{"\n"}
                  • للاستفسارات القانونية: legal@almalaky.co
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* سريان الشروط */}
        <View style={styles.section}>
          <View style={styles.effectiveCard}>
            <View style={styles.effectiveInfo}>
              <Text style={styles.effectiveTitle}>سريان الشروط</Text>
              <View style={styles.effectiveDetails}>
                <View style={styles.effectiveItem}>
                  <Ionicons name="calendar-outline" size={scale(16)} color="#16A34A" />
                  <Text style={styles.effectiveText}>تاريخ السريان: {new Date().toLocaleDateString('ar-SA')}</Text>
                </View>
                <View style={styles.effectiveItem}>
                  <Ionicons name="time-outline" size={scale(16)} color="#16A34A" />
                  <Text style={styles.effectiveText}>آخر تحديث: {new Date().toLocaleDateString('ar-SA')}</Text>
                </View>
              </View>
              <Text style={styles.effectiveNote}>
                يتم تطبيق هذه الشروط على جميع المستخدمين دون استثناء
              </Text>
            </View>
            <View style={styles.effectiveIcon}>
              <Ionicons name="ribbon-outline" size={scale(20)} color="#FFF" />
            </View>
          </View>
        </View>

        {/* معلومات الإصدار */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>الدجاج الملكي بروست • الإصدار 1.0.0</Text>
          <Text style={styles.updateDate}>
            آخر تحديث للشروط: {new Date().toLocaleDateString('ar-SA')}
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
    backgroundColor: '#DBEAFE',
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

  // المسؤوليات المتبادلة
  responsibilitiesHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(12),
  },
  responsibilitiesBadge: {
    backgroundColor: '#2563EB',
    paddingHorizontal: scale(12),
    paddingVertical: scale(2),
    borderRadius: scale(14),
    marginLeft: scale(10),
  },
  responsibilitiesBadgeText: {
    color: '#FFF',
    fontSize: fontScale(12),
    fontWeight: 'bold',
  },
  responsibilitiesContainer: {
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
  responsibilityItem: {
    flexDirection: 'row-reverse',
    backgroundColor: '#F8FAFC',
    padding: scale(12),
    borderRadius: scale(8),
    marginBottom: scale(12),
  },
  responsibilityColumn: {
    flex: 1,
  },
  responsibilityDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: scale(12),
  },
  responsibilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
    marginBottom: scale(6),
  },
  userHeader: {
    color: '#2563EB',
  },
  companyHeader: {
    color: '#DC2626',
  },
  responsibilityTitle: {
    fontSize: fontScale(12),
    fontWeight: '600',
    textAlign: 'left',
  },
  responsibilityText: {
    fontSize: fontScale(12),
    color: '#6B7280',
    textAlign: 'left',
    lineHeight: scale(16),
  },

  // بطاقة البنود الهامة
  importantCard: {
    backgroundColor: '#2563EB',
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
  importantContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: scale(20),

  },
  importantIcon: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: scale(12), // ✅ إضافة marginLeft لفصل الأيقونة عن النص
    flexShrink: 0,
  },
  importantTitle: {
    fontSize: fontScale(18),
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: scale(8),
    textAlign: 'left',
  },
  importantText: {
    fontSize: fontScale(14),
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'left',
    lineHeight: scale(20),
  },

  // بطاقة سريان الشروط
  effectiveCard: {
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
  effectiveIcon: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(10),
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(12),
  },
  effectiveInfo: {
    flex: 1,
  },
  effectiveTitle: {
    fontSize: fontScale(16),
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: scale(12),
    textAlign: 'left',
  },
  effectiveDetails: {
    gap: scale(8),
    marginBottom: scale(12),
  },
  effectiveItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  effectiveText: {
    fontSize: fontScale(14),
    color: '#6B7280',
    textAlign: 'left',
  },
  effectiveNote: {
    fontSize: fontScale(12),
    color: '#9CA3AF',
    textAlign: 'left',
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