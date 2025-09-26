// مسار الملف: lib/useFavorites.tsx

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { useAuth } from './useAuth';

// 1. تعريف شكل البيانات
interface FavoritesContextType {
  favoriteIds: Set<number>; // سنستخدم Set لكفاءة البحث (O(1))
  toggleFavorite: (menuItemId: number) => Promise<void>;
  loading: boolean;
}

// 2. إنشاء السياق
const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

// 3. إنشاء المزود (Provider)
export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  // 4. دالة لجلب المفضلة من Supabase
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) {
        setFavoriteIds(new Set()); // إذا لم يكن هناك مستخدم، أفرغ المفضلة
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from('user_favorites')
        .select('menu_item_id')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching favorites:', error);
      } else {
        // تحويل مصفوفة النتائج إلى Set
        const ids = new Set(data.map(fav => fav.menu_item_id));
        setFavoriteIds(ids);
      }
      setLoading(false);
    };

    fetchFavorites();
  }, [user]); // يتم تشغيلها عند تغيير المستخدم

  // 5. دالة لإضافة/إزالة منتج من المفضلة
  const toggleFavorite = async (menuItemId: number) => {
    if (!user) return;

    const isFavorite = favoriteIds.has(menuItemId);
    
    if (isFavorite) {
      // --- إزالة من المفضلة ---
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .match({ user_id: user.id, menu_item_id: menuItemId });

      if (!error) {
        setFavoriteIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(menuItemId);
          return newSet;
        });
      } else {
        console.error('Error removing favorite:', error);
      }
    } else {
      // --- إضافة إلى المفضلة ---
      const { error } = await supabase
        .from('user_favorites')
        .insert({ user_id: user.id, menu_item_id: menuItemId });

      if (!error) {
        setFavoriteIds(prev => {
          const newSet = new Set(prev);
          newSet.add(menuItemId);
          return newSet;
        });
      } else {
        console.error('Error adding favorite:', error);
      }
    }
  };

  const value = {
    favoriteIds,
    toggleFavorite,
    loading,
  };

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

// 6. إنشاء الهوك المخصص
export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
