import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useImagePerformance } from '@/hooks/useImagePerformance';

export default function PerformanceTest() {
  const { getPerformanceReport } = useImagePerformance();
  const [performanceData, setPerformanceData] = useState<any>({});
  const [imageLoadTimes, setImageLoadTimes] = useState<number[]>([]);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    // تحديث بيانات الأداء كل 3 ثواني
    intervalRef.current = setInterval(() => {
      const report = getPerformanceReport();
      setPerformanceData(report);
      
      // تسجيل أوقات التحميل
      if (report.averageLoadTime > 0) {
        setImageLoadTimes(prev => [...prev.slice(-9), report.averageLoadTime]);
      }
    }, 3000);

    return () => {
      // ✅ الإصلاح: التحقق من null قبل clearInterval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [getPerformanceReport]);

  const calculateStats = () => {
    if (imageLoadTimes.length === 0) return null;
    
    const avg = imageLoadTimes.reduce((a, b) => a + b, 0) / imageLoadTimes.length;
    const max = Math.max(...imageLoadTimes);
    const min = Math.min(...imageLoadTimes);
    
    return { avg, max, min };
  };

  const stats = calculateStats();

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' }}>
        ⚡ اختبار الأداء
      </Text>

      <ScrollView style={{ flex: 1 }}>
        {/* إحصائيات الصور */}
        <View style={{ 
          padding: 16, 
          backgroundColor: '#E8F5E8', 
          borderRadius: 8, 
          marginBottom: 16 
        }}>
          <Text style={{ fontWeight: '600', marginBottom: 12, fontSize: 18 }}>
            🖼 أداء الصور
          </Text>
          
          <View style={{ marginBottom: 8 }}>
            <Text>إجمالي الصور: {performanceData.totalImages || 0}</Text>
            <Text>الصور الناجحة: {performanceData.successfulLoads || 0}</Text>
            <Text>الصور الفاشلة: {performanceData.failedLoads || 0}</Text>
            <Text>معدل النجاح: {performanceData.successRate ? `${performanceData.successRate.toFixed(1)}%` : '0%'}</Text>
          </View>

          {stats && (
            <View style={{ marginTop: 8 }}>
              <Text style={{ fontWeight: '600', marginBottom: 4 }}>⏱ أوقات التحميل:</Text>
              <Text>المتوسط: {stats.avg.toFixed(0)}ms</Text>
              <Text>أسرع: {stats.min.toFixed(0)}ms</Text>
              <Text>أبطأ: {stats.max.toFixed(0)}ms</Text>
            </View>
          )}
        </View>

        {/* رسوم بيانية بسيطة */}
        <View style={{ 
          padding: 16, 
          backgroundColor: '#E7F3FF', 
          borderRadius: 8, 
          marginBottom: 16 
        }}>
          <Text style={{ fontWeight: '600', marginBottom: 12, fontSize: 18 }}>
            📈 تتبع الأداء
          </Text>
          
          {imageLoadTimes.length > 0 && (
            <View style={{ height: 100, flexDirection: 'row', alignItems: 'flex-end' }}>
              {imageLoadTimes.map((time, index) => (
                <View
                  key={index}
                  style={{
                    flex: 1,
                    height: `${Math.min(time / 2, 100)}%`,
                    backgroundColor: time < 100 ? '#34C759' : time < 500 ? '#FFCC00' : '#FF3B30',
                    marginHorizontal: 2,
                    borderTopLeftRadius: 3,
                    borderTopRightRadius: 3
                  }}
                />
              ))}
            </View>
          )}
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <Text style={{ fontSize: 10 }}>سريع</Text>
            <Text style={{ fontSize: 10 }}>متوسط</Text>
            <Text style={{ fontSize: 10 }}>بطيء</Text>
          </View>
        </View>

        {/* توصيات الأداء */}
        <View style={{ 
          padding: 16, 
          backgroundColor: '#FFF3CD', 
          borderRadius: 8 
        }}>
          <Text style={{ fontWeight: '600', marginBottom: 8, fontSize: 18 }}>
            💡 توصيات الأداء
          </Text>
          
          {performanceData.averageLoadTime > 500 ? (
            <Text style={{ color: '#856404' }}>
              ⚠️ وقت تحميل الصور مرتفع. فكر في:
              - تقليل جودة الصور أكثر
              - استخدام lazy loading
              - تحسين خادم الصور
            </Text>
          ) : performanceData.averageLoadTime > 200 ? (
            <Text style={{ color: '#856404' }}>
              ℹ️ الأداء مقبول. يمكن التحسين بـ:
              - ضغط الصور بشكل أفضل
              - استخدام CDN
            </Text>
          ) : (
            <Text style={{ color: '#155724' }}>
              ✅ الأداء ممتاز! استمر في المراقبة.
            </Text>
          )}

          {performanceData.successRate < 90 && (
            <Text style={{ color: '#721C24', marginTop: 8 }}>
              ❌ معدل نجاح منخفض. تحقق من:
              - روابط الصور المعطوبة
              - اتصال الشبكة
              - حجم الصور الكبير
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}