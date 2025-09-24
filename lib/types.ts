// مسار الملف: lib/types.ts



export interface OptionValue {
  value: string; // القيمة المخزنة في قاعدة البيانات (e.g., 'spicy')
  label: string; // النص الذي يظهر للمستخدم (e.g., 'حار')
  priceModifier: number; // تغيير السعر (e.g., 2 or -1 or 0)
}

export interface OptionGroup {
  id: string; // معرف فريد للمجموعة (e.g., 'size')
  label: string; // عنوان المجموعة (e.g., 'الحجم')
  type: 'single-select' | 'multi-select'; // نوع الاختيار
  values: OptionValue[];
}

// نوع المنتج
export interface MenuItem {
  id: number;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  options?: OptionGroup[];
}

// نوع الفئة (الصنف)
export interface Category {
  id: number;
  name: string;
}

// نوع الفئة مع المنتجات الخاصة بها (للأقسام)
export interface CategoryWithItems extends Category {
  menu_items: MenuItem[] | null;
}

// نوع الفئة النشطة في الفلتر
export type ActiveCategory = number | 'all';
