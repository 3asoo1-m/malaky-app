// lib/types.ts

export interface Category {
  id: number;
  created_at: string;
  name: string;
  display_order: number;
}

export interface MenuItem {
  id: number;
  created_at: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category_id: number | null;
  options: any | null; // JSONB can be complex, 'any' is a start
}
