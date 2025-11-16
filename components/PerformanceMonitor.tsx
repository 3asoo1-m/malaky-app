// components/PerformanceMonitor.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet 
} from 'react-native';
import { useQueryClient, Query } from '@tanstack/react-query';

export function PerformanceMonitor() {
  const queryClient = useQueryClient();
  const [isVisible, setIsVisible] = useState(false);
  const [report, setReport] = useState<any>({
    totalQueries: 0,
    cachedQueries: 0,
    failedQueries: 0,
    successRate: 0
  });
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const queries: Query[] = queryClient.getQueryCache().findAll();
      const total = queries.length;
      const cached = queries.filter(q => q.state.status === 'success').length;
      const failed = queries.filter(q => q.state.status === 'error').length;
      const successRate = total > 0 ? ((total - failed) / total) * 100 : 0;

      const newReport = { totalQueries: total, cachedQueries: cached, failedQueries: failed, successRate };

      setReport(newReport);

      // حفظ التاريخ آخر 30 تحديث
      setHistory(prev => [...prev.slice(-29), {
        ...newReport,
        timestamp: new Date().toLocaleTimeString()
      }]);
    }, 1000);

    return () => clearInterval(interval);
  }, [queryClient]);

  const getStatusColor = (successRate: number) => {
    if (successRate >= 90) return '#4CAF50';
    if (successRate >= 70) return '#FF9800';
    return '#F44336';
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.floatingButton, { backgroundColor: getStatusColor(report.successRate) }]}
        onPress={() => setIsVisible(true)}
      >
        <Text style={styles.buttonText}>📊</Text>
        <Text style={styles.smallText}>{Math.round(report.successRate)}%</Text>
      </TouchableOpacity>

      <Modal visible={isVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>📊 مراقبة أداء الاستعلامات</Text>

            <ScrollView style={styles.scrollView}>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📈 الإحصائيات الحالية</Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{report.totalQueries}</Text>
                    <Text style={styles.statLabel}>إجمالي الاستعلامات</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: getStatusColor(report.successRate) }]}>
                      {report.successRate.toFixed(1)}%
                    </Text>
                    <Text style={styles.statLabel}>معدل النجاح</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{report.failedQueries}</Text>
                    <Text style={styles.statLabel}>فاشلة</Text>
                  </View>
                </View>
              </View>

              {history.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>🕒 آخر 30 تحديث</Text>
                  {history.slice().reverse().map((item, index) => (
                    <View key={index} style={styles.historyItem}>
                      <Text style={styles.historyTime}>{item.timestamp}</Text>
                      <Text style={styles.historyData}>
                        {item.successRate.toFixed(1)}% - {item.failedQueries} فاشلة
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>

            <TouchableOpacity style={styles.closeButton} onPress={() => setIsVisible(false)}>
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
    position: 'absolute', bottom: 20, right: 20, backgroundColor: '#007AFF',
    padding: 12, borderRadius: 25, alignItems: 'center', justifyContent: 'center',
    minWidth: 60, minHeight: 60, zIndex: 9999, elevation: 5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4,
  },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  smallText: { color: 'white', fontSize: 10, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%', padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  scrollView: { maxHeight: 400 },
  section: { marginBottom: 20, padding: 15, backgroundColor: '#f8f9fa', borderRadius: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 10, color: '#333' },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#666' },
  historyItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#eee' },
  historyTime: { fontSize: 12, color: '#666' },
  historyData: { fontSize: 12, fontWeight: '500' },
  closeButton: { backgroundColor: '#FF3B30', padding: 15, borderRadius: 10, marginTop: 10 },
  closeButtonText: { color: 'white', textAlign: 'center', fontWeight: '600' },
});

export default PerformanceMonitor;
