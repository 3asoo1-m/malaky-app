// components/PerformanceMonitor.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  ScrollView,
  StyleSheet 
} from 'react-native';
import { useGlobalImagePerformance } from '@/hooks/useImagePerformance';

export function PerformanceMonitor() {
  const { getPerformanceReport } = useGlobalImagePerformance();
  const [isVisible, setIsVisible] = useState(false);
  const [report, setReport] = useState<any>({});
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newReport = getPerformanceReport();
      setReport(newReport);
      
      // حفظ التاريخ كل 10 ثواني
      setHistory(prev => [...prev.slice(-29), {
        ...newReport,
        timestamp: new Date().toLocaleTimeString()
      }]);
    }, 3000);

    return () => clearInterval(interval);
  }, [getPerformanceReport]);

  const getStatusColor = (successRate: number) => {
    if (successRate >= 90) return '#4CAF50';
    if (successRate >= 70) return '#FF9800';
    return '#F44336';
  };

  const getLoadTimeColor = (loadTime: number) => {
    if (loadTime < 300) return '#4CAF50';
    if (loadTime < 600) return '#FF9800';
    return '#F44336';
  };

  return (
    <>
      {/* زر عائم لفتح المراقبة */}
      <TouchableOpacity
        style={[
          styles.floatingButton,
          { backgroundColor: getStatusColor(report.successRate || 0) }
        ]}
        onPress={() => setIsVisible(true)}
      >
        <Text style={styles.buttonText}>📊</Text>
        <Text style={styles.smallText}>
          {report.successRate ? `${Math.round(report.successRate)}%` : '0%'}
        </Text>
      </TouchableOpacity>

      {/* مودال المراقبة */}
      <Modal 
        visible={isVisible} 
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>📊 مراقبة أداء الصور</Text>
            
            <ScrollView style={styles.scrollView}>
              {/* الإحصائيات الحالية */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📈 الإحصائيات الحالية</Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{report.totalImages || 0}</Text>
                    <Text style={styles.statLabel}>إجمالي الصور</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[
                      styles.statValue, 
                      { color: getStatusColor(report.successRate || 0) }
                    ]}>
                      {report.successRate ? `${report.successRate.toFixed(1)}%` : '0%'}
                    </Text>
                    <Text style={styles.statLabel}>معدل النجاح</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[
                      styles.statValue,
                      { color: getLoadTimeColor(report.averageLoadTime || 0) }
                    ]}>
                      {report.averageLoadTime ? `${report.averageLoadTime.toFixed(0)}ms` : '0ms'}
                    </Text>
                    <Text style={styles.statLabel}>متوسط الوقت</Text>
                  </View>
                </View>
              </View>

              {/* التفاصيل */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📋 التفاصيل</Text>
                <Text>✅ الصور الناجحة: {report.successfulLoads || 0}</Text>
                <Text>❌ الصور الفاشلة: {report.failedLoads || 0}</Text>
                <Text>⚡ أسرع تحميل: {report.fastestLoad || 0}ms</Text>
                <Text>🐢 أبطأ تحميل: {report.slowestLoad || 0}ms</Text>
              </View>

              {/* التاريخ */}
              {history.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>🕒 آخر 30 قياس</Text>
                  {history.slice().reverse().map((item, index) => (
                    <View key={index} style={styles.historyItem}>
                      <Text style={styles.historyTime}>{item.timestamp}</Text>
                      <Text style={styles.historyData}>
                        {item.successRate?.toFixed(1)}% - {item.averageLoadTime?.toFixed(0)}ms
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* الأخطاء الحديثة */}
              {report.recentErrors && report.recentErrors.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>❌ آخر الأخطاء</Text>
                  {report.recentErrors.slice(0, 5).map((error: any, index: number) => (
                    <Text key={index} style={styles.errorText}>
                      {error.url?.substring(0, 50)}...
                    </Text>
                  ))}
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsVisible(false)}
            >
              <Text style={styles.closeButtonText}>إغلاق المراقبة</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
    minHeight: 60,
    zIndex: 9999,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  smallText: {
    color: 'white',
    fontSize: 10,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  scrollView: {
    maxHeight: 400,
  },
  section: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  historyTime: {
    fontSize: 12,
    color: '#666',
  },
  historyData: {
    fontSize: 12,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 11,
    color: '#F44336',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  closeButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  closeButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default PerformanceMonitor;