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
type PrivacySection = {
  title: string;
  content: string[];
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  iconColor: string;
};

type DataType = {
  type: string;
  purpose: string;
  retention: string;
};

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const [expandedSection, setExpandedSection] = useState<number | null>(0);

  const privacySections: PrivacySection[] = [
    {
      title: 'مقدمة',
      icon: 'document-text-outline',
      color: '#DBEAFE',
      iconColor: '#2563EB',
      content: [
        'نحن في الدجاج الملكي بروست نعتبر خصوصيتك أمراً في غاية الأهمية. تشرح سياسة الخصوصية هذه كيفية جمعنا واستخدامنا وحماية معلوماتك الشخصية.',
        'باستخدامك لتطبيقنا وخدماتنا، فإنك توافق على ممارسات الخصوصية الموضحة في هذه السياسة.'
      ]
    },
    {
      title: 'المعلومات التي نجمعها',
      icon: 'information-circle-outline',
      color: '#FEF3C7',
      iconColor: '#D97706',
      content: [
        'نجمع المعلومات التي تقدمها لنا مباشرة مثل الاسم، رقم الهاتف، العنوان، والبريد الإلكتروني.',
        'نجمع معلومات الطلبات والسجل الشرائي لتقديم خدمة أفضل.',
        'نجمع معلومات الجهاز وتفضيلات الاستخدام لتحسين تجربة التطبيق.'
      ]
    },
    {
      title: 'كيف نستخدم معلوماتك',
      icon: 'shield-checkmark-outline',
      color: '#DCFCE7',
      iconColor: '#16A34A',
      content: [
        'لمعالجة طلباتك وتوصيلها إلى العنوان المحدد.',
        'لتحسين خدماتنا وتجربة المستخدم.',
        'لإرسال عروض ترويجية وتحديثات تهمك.',
        'للاتصال بك تبعا لطلباتك أو استفساراتك.'
      ]
    },
    {
      title: 'حماية المعلومات',
      icon: 'lock-closed-outline',
      color: '#FCE7F3',
      iconColor: '#DB2777',
      content: [
        'نستخدم تقنيات تشفير متقدمة لحماية بياناتك.',
        'نقوم بتخزين المعلومات على خوادم آمنة.',
        'نحدد الوصول إلى معلوماتك الشخصية للموظفين المخولين فقط.',
        'نحافظ على التدابير الأمنية الفيزائية والإلكترونية لحماية بياناتك.'
      ]
    },
    {
      title: 'مشاركة المعلومات',
      icon: 'share-social-outline',
      color: '#F3E8FF',
      iconColor: '#9333EA',
      content: [
        'لا نبيع أو نؤجر معلوماتك الشخصية لأطراف ثالثة.',
        'قد نشارك معلوماتك مع شركاء التوصيل لتلبية طلباتك.',
        'نشارك المعلومات عندما يطلبها القانون أو لحماية حقوقنا.',
        'في حالة الدمج أو الاستحواذ، قد تنقل معلوماتك إلى الكيان الجديد.'
      ]
    },
    {
      title: 'حقوقك',
      icon: 'person-outline',
      color: '#FFEDD5',
      iconColor: '#EA580C',
      content: [
        'حق الوصول إلى معلوماتك الشخصية وتحديثها.',
        'حق طلب حذف معلوماتك الشخصية.',
        'حق الاعتراض على معالجة بياناتك.',
        'حق سحب الموافقة في أي وقت.'
      ]
    }
  ];

  const dataTypes: DataType[] = [
    { type: 'المعلومات الشخصية', purpose: 'إنشاء الحساب ومعالجة الطلبات', retention: '3 سنوات' },
    { type: 'بيانات الطلبات', purpose: 'تحسين الخدمة والتحليلات', retention: '2 سنوات' },
    { type: 'بيانات الموقع', purpose: 'توصيل الطلبات', retention: '6 أشهر' },
    { type: 'بيانات الدفع', purpose: 'معالجة المدفوعات', retention: '7 سنوات لأغراض ضريبية' }
  ];

  const toggleSection = (index: number) => {
    setExpandedSection(expandedSection === index ? null : index);
  };

  const renderPrivacySection = (section: PrivacySection, index: number) => (
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
              <Text style={styles.paragraphText}>{paragraph}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderDataType = (data: DataType, index: number) => (
    <View key={index} style={styles.dataTypeItem}>
      <View style={styles.dataTypeHeader}>
        <Text style={styles.dataTypeTitle}>{data.type}</Text>
        <View style={styles.retentionBadge}>
          <Text style={styles.retentionText}>الاحتفاظ: {data.retention}</Text>
        </View>
      </View>
      <Text style={styles.dataTypePurpose}>{data.purpose}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* الهيدر */}
      <ScreenHeader 
        title="سياسة الخصوصية"
        customButton={
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="shield-checkmark-outline" size={scale(24)} color="#FFF" />
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* المقدمة */}
        <View style={styles.section}>
          <View style={styles.welcomeCard}>
            <View style={styles.welcomeContent}>
              <Text style={styles.welcomeTitle}>حماية خصوصيتك أولوية لدينا 🔒</Text>
              <Text style={styles.welcomeText}>
                نعتبر ثقتك بنا شرفاً كبيراً. تشرح هذه السياسة كيف نحمي معلوماتك 
                ونضمن استخدامها بشكل مسؤول وشفاف.
              </Text>
            </View>
            <View style={styles.welcomeIcon}>
              <Ionicons name="lock-closed" size={scale(24)} color="#2563EB" />
            </View>
          </View>
        </View>

        {/* أقسام السياسة */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>سياسة الخصوصية</Text>
          <View style={styles.sectionsContainer}>
            {privacySections.map(renderPrivacySection)}
          </View>
        </View>

        {/* أنواع البيانات */}
        <View style={styles.section}>
          <View style={styles.dataTypesHeader}>
            <View style={styles.dataTypesBadge}>
              <Text style={styles.dataTypesBadgeText}>{dataTypes.length}</Text>
            </View>
            <Text style={styles.sectionTitle}>أنواع البيانات وفترات الاحتفاظ</Text>
          </View>
          <View style={styles.dataTypesContainer}>
            {dataTypes.map(renderDataType)}
          </View>
        </View>

        {/* جهات الاتصال */}
        <View style={styles.section}>
          <View style={styles.contactCard}>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>للاستفسارات حول الخصوصية</Text>
              <View style={styles.contactDetails}>
                <View style={styles.contactItem}>
                  <Ionicons name="mail-outline" size={scale(16)} color="#2563EB" />
                  <Text style={styles.contactText}>privacy@almalaky.co</Text>
                </View>
                <View style={styles.contactItem}>
                  <Ionicons name="call-outline" size={scale(16)} color="#2563EB" />
                  <Text style={styles.contactText}>9200XXXXX</Text>
                </View>
              </View>
              <Text style={styles.contactNote}>
                نرد على استفسارات الخصوصية خلال 48 ساعة عمل
              </Text>
            </View>
            <View style={styles.contactIcon}>
              <Ionicons name="chatbubble-ellipses" size={scale(20)} color="#FFF" />
            </View>
          </View>
        </View>

        {/* التحديثات */}
        <View style={styles.section}>
          <View style={styles.updateCard}>
            <View style={styles.updateContent}>
              <View style={styles.updateIcon}>
                <Ionicons name="time-outline" size={scale(20)} color="#FFF" />
              </View>
              <View>
                <Text style={styles.updateTitle}>التحديثات المستقبلية</Text>
                <Text style={styles.updateText}>
                  قد نقوم بتحديث هذه السياسة periodically. سنخطرك بأي تغييرات جوهرية 
                  عبر التطبيق أو البريد الإلكتروني.
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
    textAlign: 'right',
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
    textAlign: 'right',
  },
  welcomeText: {
    fontSize: fontScale(14),
    color: '#6B7280',
    lineHeight: scale(20),
    textAlign: 'right',
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
    flexDirection: 'row-reverse',
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
    marginBottom: scale(12),
  },
  paragraphText: {
    fontSize: fontScale(14),
    color: '#6B7280',
    lineHeight: scale(20),
    textAlign: 'right',
  },

  // أنواع البيانات
  dataTypesHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(12),
  },
  dataTypesBadge: {
    backgroundColor: '#2563EB',
    paddingHorizontal: scale(12),
    paddingVertical: scale(2),
    borderRadius: scale(14),
    marginLeft: scale(10),
  },
  dataTypesBadgeText: {
    color: '#FFF',
    fontSize: fontScale(12),
    fontWeight: 'bold',
  },
  dataTypesContainer: {
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
  dataTypeItem: {
    backgroundColor: '#F8FAFC',
    padding: scale(12),
    borderRadius: scale(8),
    marginBottom: scale(8),
  },
  dataTypeHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(4),
  },
  dataTypeTitle: {
    fontSize: fontScale(14),
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'right',
  },
  retentionBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: scale(8),
    paddingVertical: scale(2),
    borderRadius: scale(8),
  },
  retentionText: {
    fontSize: fontScale(10),
    color: '#D97706',
    fontWeight: '500',
  },
  dataTypePurpose: {
    fontSize: fontScale(12),
    color: '#6B7280',
    textAlign: 'right',
    lineHeight: scale(16),
  },

  // بطاقة الاتصال
  contactCard: {
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
  contactIcon: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(10),
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: scale(12),
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: fontScale(16),
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: scale(12),
    textAlign: 'right',
  },
  contactDetails: {
    gap: scale(8),
    marginBottom: scale(12),
  },
  contactItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: scale(8),
  },
  contactText: {
    fontSize: fontScale(14),
    color: '#6B7280',
    textAlign: 'right',
  },
  contactNote: {
    fontSize: fontScale(12),
    color: '#9CA3AF',
    textAlign: 'right',
  },

  // بطاقة التحديثات
  updateCard: {
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
  updateContent: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    padding: scale(20),
    gap: scale(12),
  },
  updateIcon: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  updateTitle: {
    fontSize: fontScale(18),
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: scale(8),
    textAlign: 'right',
  },
  updateText: {
    fontSize: fontScale(14),
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'right',
    lineHeight: scale(20),
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