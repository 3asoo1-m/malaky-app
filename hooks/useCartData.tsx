import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Address, Branch } from '@/lib/types';
import { useAuth } from '@/lib/useAuth';

// Hook محسن لجلب العناوين مع retry ذكي
export const useAddresses = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['addresses', user?.id],
    queryFn: async (): Promise<Address[]> => {
      if (!user) return [];

      const { data: rawData, error } = await supabase
        .from('user_addresses')
        .select(`id, street_address, notes, created_at, is_default, address_name, delivery_zones (city, area_name, delivery_price)`)
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw new Error(`فشل تحميل العناوين: ${error.message}`);

      return rawData.map(addr => {
        const deliveryZone = Array.isArray(addr.delivery_zones) ? addr.delivery_zones[0] || null : addr.delivery_zones;
        
        return {
          id: addr.id,
          street_address: addr.street_address,
          notes: addr.notes,
          created_at: addr.created_at,
          is_default: addr.is_default,
          address_name: addr.address_name,
          delivery_zones: deliveryZone ? {
            city: deliveryZone.city,
            area_name: deliveryZone.area_name,
            delivery_price: deliveryZone.delivery_price
          } : null
        };
      });
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000, // 10 دقائق
    gcTime: 30 * 60 * 1000, // 30 دقيقة
    retry: (failureCount, error: any) => {
      // لا تعيد المحاولة لأخطاء الشبكة فقط
      return failureCount < 3 && error.message?.includes('شبكة');
    },
  });
};

// Hook محسن لجلب الفروع مع كاش أطول
export const useBranches = () => {
  return useQuery({
    queryKey: ['branches'],
    queryFn: async (): Promise<Branch[]> => {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw new Error(`فشل تحميل الفروع: ${error.message}`);
      return data;
    },
    staleTime: 60 * 60 * 1000, // ساعة كاملة
    gcTime: 2 * 60 * 60 * 1000, // ساعتين
  });
};

// Hook محسن لإنشاء الطلب مع optimistic updates
export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (orderData: {
      items: any[];
      totalPrice: number;
      subtotal: number;
      deliveryPrice: number;
      discount: number;
      orderType: string;
      selectedAddress: Address | null;
      selectedBranch: Branch | null;
      orderNotes: string;
    }) => {
      if (!user) throw new Error('يجب تسجيل الدخول أولاً');

      const { data: orderDataResult, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_price: orderData.totalPrice,
          subtotal: orderData.subtotal,
          delivery_price: orderData.deliveryPrice,
          discount: orderData.discount,
          order_type: orderData.orderType,
          user_address_id: orderData.orderType === 'delivery' ? orderData.selectedAddress?.id : null,
          branch_id: orderData.orderType === 'pickup' ? orderData.selectedBranch?.id : null,
          notes: orderData.orderNotes,
          status: 'pending',
        })
        .select('id')
        .single();

      if (orderError) throw new Error(`فشل إنشاء الطلب: ${orderError.message}`);

      const orderItems = orderData.items.map(cartItem => ({
        order_id: orderDataResult.id,
        menu_item_id: cartItem.product.id,
        quantity: cartItem.quantity,
        unit_price: cartItem.product.price,
        options: cartItem.options,
        notes: cartItem.notes,
        additional_pieces: cartItem.additionalPieces?.length > 0 ? cartItem.additionalPieces : null,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw new Error(`فشل إضافة العناصر: ${itemsError.message}`);

      return orderDataResult.id;
    },
    onMutate: async (orderData) => {
      // إلغاء أي استعلامات جارية
      await queryClient.cancelQueries({ queryKey: ['orders'] });
      
      // حفظ النسخة السابقة للتراجع إذا فشل
      const previousOrders = queryClient.getQueryData(['orders']);
      
      // Optimistic update - إضافة الطلب فوراً
      queryClient.setQueryData(['orders'], (old: any) => 
        old ? [...old, { ...orderData, id: 'temp', status: 'pending' }] : [orderData]
      );
      
      return { previousOrders };
    },
    onError: (err, variables, context) => {
      // التراجع عن التغيير إذا فشل
      if (context?.previousOrders) {
        queryClient.setQueryData(['orders'], context.previousOrders);
      }
    },
    onSettled: () => {
      // إعادة جلب البيانات للتأكد من المزامنة
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};