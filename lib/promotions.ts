// lib/supabase/promotions.ts
import { supabase } from '@/lib/supabase';

export interface Promotion {
  id: number;
  created_at: string;
  title: string;
  description: string | null;
  image_url: string;
  action_type: string;
  action_value: string | null;
  is_active: boolean;
  display_order: number;
}

export const getActivePromotions = async (): Promise<Promotion[]> => {
  try {
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching promotions:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching promotions:', error);
    return [];
  }
};