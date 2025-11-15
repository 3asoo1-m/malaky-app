import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  TextInput
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// تعريف الأنواع
type ContactMethod = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  status: string;
  color: string;
  iconColor: string;
};

type QuickHelpItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  iconColor: string;
};

type FAQItem = {
  question: string;
  answer: string;
};

type ResourceItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  iconColor: string;
};

export default function SupportScreen() {
  const router = useRouter();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [searchText, setSearchText] = useState('');

  const contactMethods: ContactMethod[] = [
    { 
      icon: 'chatbubble-ellipses-outline', 
      label: 'المحادثة الفورية', 
      description: 'احصل على مساعدة فورية',
      status: 'متصل الآن',
      color: '#DCFCE7',
      iconColor: '#16A34A'
    },
    { 
      icon: 'call-outline', 
      label: 'اتصل بنا', 
      description: '1700 250 250',
      status: 'متاح',
      color: '#DBEAFE',
      iconColor: '#2563EB'
    },
    { 
      icon: 'mail-outline', 
      label: 'البريد الإلكتروني', 
      description: 'info@almalaky.co',
      status: 'رد خلال 24 ساعة',
      color: '#F3E8FF',
      iconColor: '#9333EA'
    },
  ];

  const quickHelp: QuickHelpItem[] = [
    { icon: 'cube-outline', label: 'تتبع الطلب', color: '#FFEDD5', iconColor: '#EA580C' },
    { icon: 'card-outline', label: 'مشاكل الدفع', color: '#DBEAFE', iconColor: '#2563EB' },
    { icon: 'location-outline', label: 'معلومات التوصيل', color: '#DCFCE7', iconColor: '#16A34A' },
    { icon: 'document-text-outline', label: 'سياسة الاسترجاع', color: '#FCE7F3', iconColor: '#DB2777' },
  ];

  const faqs: FAQItem[] = [
    {
      question: 'كيف يمكنني تتبع طلبي؟',
      answer: 'يمكنك تتبع طلبك في الوقت الفعلي من قسم "طلباتي" في ملفك الشخصي. ستتلقى إشعارات في كل خطوة من عملية التوصيل.'
    },
    {
      question: 'ما هي ساعات التوصيل؟',
      answer: 'نقوم بالتوصيل من الساعة 10:00 صباحاً حتى 11:00 مساءً يومياً. قد تختلف ساعات وأوفات التوصيل في أيام نهاية الأسبوع. تحقق من التطبيق للاطلاع على التوفر في منطقتك.'
    },
    {
      question: 'كيف يمكنني تطبيق كود خصم؟',
      answer: 'أدخل كود الخصم الخاص بك عند الدفع في حقل "كود الخصم" قبل تقديم طلبك. سيتم تطبيق الخصومات تلقائياً.'
    },
    {
      question: 'ما هي سياسة الاسترجاع؟',
      answer: 'نحن نقدم استرجاع كامل للمبالغ للطلبات الملغاة قبل بدء التحضير. لمشاكل الجودة، اتصل بالدعم خلال 30 دقيقة من التوصيل للحصول على استرجاع كامل أو استبدال.'
    },
    {
      question: 'هل يمكنني تعديل طلبي بعد وضعه؟',
      answer: 'يمكن تعديل الطلبات خلال دقيقتين من وضعها. بعد ذلك، يرجى الاتصال بفريق الدعم فوراً للمساعدة.'
    },
  ];

  const resources: ResourceItem[] = [
    { icon: 'document-text-outline', label: 'الشروط والأحكام', color: '#F3F4F6', iconColor: '#6B7280' },
    { icon: 'shield-checkmark-outline', label: 'سياسة الخصوصية', color: '#DBEAFE', iconColor: '#2563EB' },
    { icon: 'people-outline', label: 'إرشادات المجتمع', color: '#F3E8FF', iconColor: '#9333EA' },
    { icon: 'phone-portrait-outline', label: 'سياسة الإستخدام', color: '#ffe6caff', iconColor: '#e78617ff' },

  ];

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const renderContactMethod = (method: ContactMethod, index: number) => (
    <TouchableOpacity key={index} style={styles.contactCard}>
      <View style={[styles.contactIcon, { backgroundColor: method.color }]}>
        <Ionicons name={method.icon} size={22} color={method.iconColor} />
      </View>
      <View style={styles.contactInfo}>
        <View style={styles.contactHeader}>
          <View style={[styles.statusDot, { backgroundColor: method.iconColor }]} />
          <Text style={styles.contactLabel}>{method.label}</Text>
        </View>
        <Text style={styles.contactDescription}>{method.description}</Text>
        <Text style={styles.contactStatus}>{method.status}</Text>
      </View>
      <Ionicons name="chevron-back" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );

  const renderQuickHelpItem = (item: QuickHelpItem, index: number) => (
    <TouchableOpacity key={index} style={styles.quickHelpCard}>
      <View style={[styles.quickHelpIcon, { backgroundColor: item.color }]}>
        <Ionicons name={item.icon} size={20} color={item.iconColor} />
      </View>
      <Text style={styles.quickHelpLabel}>{item.label}</Text>
    </TouchableOpacity>
  );

  const renderFAQItem = (faq: FAQItem, index: number) => (
    <View key={index} style={styles.faqItem}>
      <TouchableOpacity 
        style={styles.faqQuestion}
        onPress={() => toggleFaq(index)}
      >
        <Ionicons 
          name={expandedFaq === index ? "chevron-up" : "chevron-down"} 
          size={20} 
          color="#9CA3AF" 
        />
        <View style={styles.faqContent}>
          <Text style={styles.faqQuestionText}>{faq.question}</Text>
          {expandedFaq === index && (
            <Text style={styles.faqAnswer}>{faq.answer}</Text>
          )}
        </View>
        <View style={styles.faqIcon}>
          <Ionicons name="help-circle-outline" size={16} color="#DC2626" />
        </View>
      </TouchableOpacity>
      {index < faqs.length - 1 && <View style={styles.separator} />}
    </View>
  );

  const renderResourceItem = (resource: ResourceItem, index: number) => (
    <View key={index}>
      <TouchableOpacity style={styles.resourceItem}
      onPress={() => {
        // ✅ إضافة التنقل للشاشات المختلفة حسب النوع
        if (resource.label === 'إرشادات المجتمع') {
          router.push('/(modal)/CommunityGuidelinesScreen');
        } else if (resource.label === 'الشروط والأحكام') {
          router.push('/(modal)/terms-of-service');
        } else if (resource.label === 'سياسة الخصوصية') {
          router.push('/(modal)/privacy-policy');
        }else if (resource.label === 'سياسة الإستخدام') {
          router.push('/(modal)/usage-policy');
        }
      }}>
        <Ionicons name="open-outline" size={18} color="#9CA3AF" />
        <Text style={styles.resourceLabel}>{resource.label}</Text>
        <View style={[styles.resourceIcon, { backgroundColor: resource.color }]}>
          <Ionicons name={resource.icon} size={18} color={resource.iconColor} />
        </View>
      </TouchableOpacity>
      {index < resources.length - 1 && <View style={styles.separator} />}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* الهيدر */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIcon}>
          <Ionicons name="headset-outline" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>مركز المساعدة</Text>
        <TouchableOpacity onPress={() => router.navigate('/(tabs)/profile')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* شريط البحث */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث في المساعدة..."
            placeholderTextColor="#9CA3AF"
            value={searchText}
            onChangeText={setSearchText}
          />
          <Ionicons name="search-outline" size={20} color="#9CA3AF" style={styles.searchIcon} />
        </View>

        {/* طرق التواصل */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>اتصل بنا</Text>
          <View style={styles.contactMethods}>
            {contactMethods.map(renderContactMethod)}
          </View>
        </View>

        {/* ساعات العمل */}
        <View style={styles.section}>
          <View style={styles.hoursCard}>
            <View style={styles.hoursInfo}>
              <Text style={styles.hoursTitle}>ساعات الدعم</Text>
              <View style={styles.hoursList}>
                <View style={styles.hourRow}>
                  <Text style={styles.hourTime}>8:00 ص - 10:00 م</Text>
                  <Text style={styles.hourDay}>الإثنين - الجمعة</Text>
                </View>
                <View style={styles.hourRow}>
                  <Text style={styles.hourTime}>9:00 ص - 9:00 م</Text>
                  <Text style={styles.hourDay}>السبت - الأحد</Text>
                </View>
              </View>
            </View>
            <View style={styles.hoursIcon}>
              <Ionicons name="time-outline" size={20} color="#FFF" />
            </View>
          </View>
        </View>

        {/* المساعدة السريعة */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>مساعدة سريعة</Text>
          <View style={styles.quickHelpGrid}>
            {quickHelp.map(renderQuickHelpItem)}
          </View>
        </View>

        {/* الأسئلة الشائعة */}
        <View style={styles.section}>
          <View style={styles.faqHeader}>
            <View style={styles.faqBadge}>
              <Text style={styles.faqBadgeText}>{faqs.length}</Text>
            </View>
            <Text style={styles.sectionTitle}>الأسئلة الشائعة</Text>
          </View>
          <View style={styles.faqContainer}>
            {faqs.map(renderFAQItem)}
          </View>
        </View>

        {/* الموارد */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>موارد إضافية</Text>
          <View style={styles.resourcesContainer}>
            {resources.map(renderResourceItem)}
          </View>
        </View>

        {/* زر التواصل */}
        <View style={styles.section}>
          <View style={styles.ctaCard}>
            <View style={styles.ctaOverlay} />
            <TouchableOpacity style={styles.ctaContent}>
              <View style={styles.ctaIcon}>
                <Ionicons name="paper-plane-outline" size={20} color="#FFF" />
              </View>
              <View>
                <Text style={styles.ctaTitle}>لا تزال تحتاج مساعدة؟</Text>
                <Text style={styles.ctaDescription}>أرسل لنا رسالة وسنرد عليك قريباً</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* معلومات الإصدار */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>الدجاج الملكي بروست  • الإصدار 1.0.0</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#DC2626',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerIcon: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
    marginTop: 0,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginTop: 20,
    paddingHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchIcon: {
    marginLeft: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1F2937',
    textAlign: 'right',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'left',
  },
  contactMethods: {
    gap: 12,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  contactLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  contactDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'left',
  },
  contactStatus: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'left',
    marginTop: 2,
  },
  hoursCard: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  hoursIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  hoursInfo: {
    flex: 1,
  },
  hoursTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'left',
  },
  hoursList: {
    gap: 6,
  },
  hourRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hourDay: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'right',
  },
  hourTime: {
    fontSize: 14,
    color: '#1F2937',
    
    fontWeight: '500',
  },
  quickHelpGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickHelpCard: {
    width: '48%',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  quickHelpIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickHelpLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    textAlign: 'center',
  },
  faqHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  faqBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 14,
    marginLeft: 10,

  },
  faqBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  faqContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  faqItem: {
    backgroundColor: '#FFF',
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  faqIcon: {
    backgroundColor: '#FEE2E2',
    padding: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  faqContent: {
    flex: 1,
    marginHorizontal: 12,
  },
  faqQuestionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    textAlign: 'left',
    lineHeight: 20,
  },
  faqAnswer: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'left',
    lineHeight: 20,
    marginTop: 8,
  },
  resourcesContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  resourceItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 16,
  },
  resourceIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  resourceLabel: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    textAlign: 'left',
  },
  ctaCard: {
    backgroundColor: '#DC2626',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  ctaContent: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  ctaTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
    textAlign: 'left',
  },
  ctaDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'left',
  },
  ctaIcon: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingBottom: 40,
  },
  versionText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});