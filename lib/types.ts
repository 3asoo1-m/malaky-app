// مسار الملف: lib/types.ts

// ===================================================================
// أنواع الخيارات (Options) - تبقى كما هي لأنها مفيدة
// ===================================================================

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


// ===================================================================
// الأنواع الجديدة والمحدثة التي تتوافق مع دالة get_menu
// ===================================================================

/**
 * يمثل صورة واحدة للوجبة، كما تأتي من جدول menu_item_images.
 */
export interface MenuItemImage {
  display_order: number;
  id: number;
  image_url: string;
  alt_text?: string | null;
}

/**
 * يمثل الوجبة الواحدة.
 * التغيير الأهم: يحتوي الآن على مصفوفة 'images' بدلاً من 'image_url' واحد.
 */
export interface MenuItem {
  id: number;
  name: string;
  description: string | null;
  price: number;
  options?: OptionGroup[] | null; // الخيارات المخزنة في jsonb
  images: MenuItemImage[]; // <-- ✅ التغيير هنا: مصفوفة من الصور
}

/**
 * يمثل الصنف الواحد مع مصفوفة الوجبات الخاصة به.
 * هذا هو النوع الرئيسي الذي تمثله كل عنصر في المصفوفة القادمة من دالة get_menu.
 */
export interface CategoryWithItems {
  id: number;
  name: string;
  display_order: number;
  image_url: string | null; // صورة الصنف نفسه
  menu_items: MenuItem[] | null; // الوجبات التي تنتمي لهذا الصنف
}


// ===================================================================
// أنواع مساعدة لواجهة المستخدم (UI Helper Types)
// ===================================================================

/**
 * يمثل الصنف في شريط الفلاتر (CategoryChips).
 * يتم استخلاصه من CategoryWithItems.
 */
export interface Category {
  id: number;
  name: string;
}

/**
 * يمثل الفلتر النشط حاليًا في شريط الفلاتر.
 */
export type ActiveCategory = number | 'all';


export interface Promotion {
  id: number;
  created_at: string;
  title: string;
  description: string | null;
  image_url: string;
  action_type: 'navigate_to_item' | 'open_url' | 'no_action';
  action_value: string | null;
  is_active: boolean;
  display_order: number;
}