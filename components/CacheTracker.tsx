// components/CacheTracker.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';

export function CacheTracker() {
  const [isVisible, setIsVisible] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  // دالة لتسجيل أي fetch يحصل من Supabase
  const trackFetch = (message: string) => {
    setLogs(prev => [message, ...prev.slice(0, 49)]); // آخر 50 log
    console.log('📡', message);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setIsVisible(true)}
      >
        <Text style={styles.buttonText}>🛰️</Text>
      </TouchableOpacity>

      <Modal visible={isVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>📡 تتبع Cache / Fetch</Text>
            <View style={styles.logContainer}>
              {logs.length === 0 ? (
                <Text style={styles.noLogs}>لا توجد fetchs حتى الآن</Text>
              ) : (
                logs.map((log, idx) => (
                  <Text key={idx} style={styles.logText}>{log}</Text>
                ))
              )}
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsVisible(false)}
            >
              <Text style={styles.closeButtonText}>إغلاق</Text>
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
  },
  buttonText: { color: 'white', fontSize: 18 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    maxHeight: '70%',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  logContainer: { maxHeight: 300 },
  logText: { fontSize: 12, color: '#333', marginBottom: 2 },
  noLogs: { fontSize: 14, color: '#888', textAlign: 'center' },
  closeButton: {
    marginTop: 10,
    backgroundColor: '#FF3B30',
    padding: 12,
    borderRadius: 10,
  },
  closeButtonText: { color: 'white', textAlign: 'center', fontWeight: '600' },
});

export default CacheTracker;
