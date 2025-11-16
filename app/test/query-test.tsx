import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAddresses, useBranches, useCreateOrder } from '@/hooks/useCartData';
import { useQueryClient } from '@tanstack/react-query';

export default function QueryTest() {
  const { 
    data: addresses, 
    isLoading: addressesLoading, 
    error: addressesError,
    refetch: refetchAddresses 
  } = useAddresses();

  const { 
    data: branches, 
    isLoading: branchesLoading, 
    error: branchesError,
    refetch: refetchBranches 
  } = useBranches();

  const createOrderMutation = useCreateOrder();
  const queryClient = useQueryClient();
  const [queryStats, setQueryStats] = useState<any>({});
  
  // ✅ الإصلاح: إزالة intervalRef غير المستخدم أو إصلاحه
  // الحل: نستخدم متغير عادي بدلاً من useRef حيث أننا نتعامل معه داخل useEffect فقط

  useEffect(() => {
    // تحديث إحصائيات الكاش
    const updateStats = () => {
      const cache = queryClient.getQueryCache();
      const allQueries = cache.findAll();
      
      setQueryStats({
        totalQueries: allQueries.length,
        addressesQuery: cache.find({ queryKey: ['addresses'] })?.state,
        branchesQuery: cache.find({ queryKey: ['branches'] })?.state,
        cacheSize: JSON.stringify(allQueries).length
      });
    };

    updateStats();
    
    // ✅ الإصلاح: استخدام interval مباشرة بدون ref
    const interval = setInterval(updateStats, 2000);
    
    return () => {
      clearInterval(interval);
    };
  }, [queryClient]);

  const testCreateOrder = async () => {
    try {
      await createOrderMutation.mutateAsync({
        items: [],
        totalPrice: 100,
        subtotal: 90,
        deliveryPrice: 10,
        discount: 0,
        orderType: 'delivery',
        selectedAddress: null,
        selectedBranch: null,
        orderNotes: 'طلب اختبار'
      });
    } catch (error) {
      console.log('❌ فشل إنشاء الطلب (متوقع):', error);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' }}>
        📊 اختبار TanStack Query
      </Text>

      {/* أزرار التحكم */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 }}>
        <TouchableOpacity
          onPress={() => refetchAddresses()}
          style={{ padding: 10, backgroundColor: '#007AFF', borderRadius: 5 }}
        >
          <Text style={{ color: 'white' }}>🔄 جلب العناوين</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => refetchBranches()}
          style={{ padding: 10, backgroundColor: '#34C759', borderRadius: 5 }}
        >
          <Text style={{ color: 'white' }}>🔄 جلب الفروع</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={testCreateOrder}
          style={{ padding: 10, backgroundColor: '#FF3B30', borderRadius: 5 }}
        >
          <Text style={{ color: 'white' }}>📦 طلب تجريبي</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }}>
        {/* حالة العناوين */}
        <View style={{ 
          padding: 16, 
          backgroundColor: addressesLoading ? '#FFF3CD' : '#D4EDDA', 
          borderRadius: 8, 
          marginBottom: 16 
        }}>
          <Text style={{ fontWeight: '600', marginBottom: 8 }}>
            🏠 العناوين {addressesLoading && '⏳'}
          </Text>
          {addressesError ? (
            <Text style={{ color: '#721C24' }}>❌ خطأ: {addressesError.message}</Text>
          ) : (
            <>
              <Text>عدد العناوين: {addresses?.length || 0}</Text>
              <Text>الحالة: {addressesLoading ? 'جاري التحميل...' : 'تم التحميل'}</Text>
            </>
          )}
        </View>

        {/* حالة الفروع */}
        <View style={{ 
          padding: 16, 
          backgroundColor: branchesLoading ? '#FFF3CD' : '#D4EDDA', 
          borderRadius: 8, 
          marginBottom: 16 
        }}>
          <Text style={{ fontWeight: '600', marginBottom: 8 }}>
            🏢 الفروع {branchesLoading && '⏳'}
          </Text>
          {branchesError ? (
            <Text style={{ color: '#721C24' }}>❌ خطأ: {branchesError.message}</Text>
          ) : (
            <>
              <Text>عدد الفروع: {branches?.length || 0}</Text>
              <Text>الحالة: {branchesLoading ? 'جاري التحميل...' : 'تم التحميل'}</Text>
            </>
          )}
        </View>

        {/* إحصائيات الكاش */}
        <View style={{ 
          padding: 16, 
          backgroundColor: '#E7F3FF', 
          borderRadius: 8, 
          marginBottom: 16 
        }}>
          <Text style={{ fontWeight: '600', marginBottom: 8 }}>💾 إحصائيات الكاش</Text>
          <Text>إجمالي الاستعلامات: {queryStats.totalQueries || 0}</Text>
          <Text>حالة استعلام العناوين: {queryStats.addressesQuery?.status}</Text>
          <Text>حالة استعلام الفروع: {queryStats.branchesQuery?.status}</Text>
          <Text>حجم الكاش: {queryStats.cacheSize ? `${queryStats.cacheSize} bytes` : 'جاري الحساب...'}</Text>
        </View>

        {/* حالة إنشاء الطلب */}
        <View style={{ 
          padding: 16, 
          backgroundColor: createOrderMutation.isPending ? '#FFF3CD' : '#D4EDDA', 
          borderRadius: 8 
        }}>
          <Text style={{ fontWeight: '600', marginBottom: 8 }}>
            📦 إنشاء الطلب {createOrderMutation.isPending && '⏳'}
          </Text>
          <Text>الحالة: {createOrderMutation.isPending ? 'جاري المعالجة...' : 'جاهز'}</Text>
          {createOrderMutation.isError && (
            <Text style={{ color: '#721C24' }}>❌ خطأ: {createOrderMutation.error?.message}</Text>
          )}
          {createOrderMutation.isSuccess && (
            <Text style={{ color: '#155724' }}>✅ تم إنشاء الطلب بنجاح</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}