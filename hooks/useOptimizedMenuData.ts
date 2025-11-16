import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { MenuItem } from '@/lib/types';

export const useOptimizedMenuData = (categoryId?: string) => { // ✅ تغيير النوع إلى string فقط
  const [page, setPage] = useState(0);
  const limit = 20;

  const fetchMenuData = useCallback(async (): Promise<MenuItem[]> => {
    console.log('🔄 جلب البيانات من السيرفر...', { categoryId, page });
    
    if (categoryId && categoryId !== 'all') {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('category_id', parseInt(categoryId)) // ✅ تحويل إلى number
        .range(page * limit, (page + 1) * limit - 1);

      if (error) throw error;
      return data || [];
    }

    // ✅ جلب جميع البيانات مع pagination
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .range(page * limit, (page + 1) * limit - 1);

    if (error) throw error;
    return data || [];
  }, [categoryId, page, limit]);

  const query = useQuery({
    queryKey: ['optimized-menu', categoryId, page],
    queryFn: fetchMenuData,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

  const loadMore = useCallback(() => {
    if (query.data && query.data.length >= limit) {
      setPage(prev => prev + 1);
    }
  }, [query.data, limit]);

  const resetPagination = useCallback(() => {
    setPage(0);
  }, []);

  return useMemo(() => ({
    ...query,
    loadMore,
    resetPagination,
    hasMore: query.data ? query.data.length >= limit : false
  }), [query, loadMore, resetPagination, limit]);
};