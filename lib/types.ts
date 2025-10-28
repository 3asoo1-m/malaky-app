// مسار الملف: lib/types.ts

// ===================================================================
// 1. أنواع البيانات الأساسية (من قاعدة البيانات)
// ===================================================================

export interface OptionValue {
  value: string;
  label: string;
  priceModifier: number;
}

export interface OptionGroup {
  id: string;
  label: string;
  type: 'single-select' | 'multi-select';
  values: OptionValue[];
}

export interface MenuItemImage {
  display_order: number;
  id: number;
  image_url: string;
  alt_text?: string | null;
}

export interface MenuItem {
  category_id: any;
  id: number;
  name: string;
  description: string | null;
  price: number;
  options?: OptionGroup[] | null;
  images: MenuItemImage[];
}

export interface CategoryWithItems {
  id: number;
  name: string;
  display_order: number;
  image_url: string | null;
  menu_items: MenuItem[] | null;
}

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

export interface Address {
  id: number;
  street_address: string;
  notes: string | null;
  created_at: string;
  is_default: boolean;
  address_name: string | null;
  delivery_zones: {
    city: string;
    area_name: string;
    delivery_price: number;
  } | null;
}



export interface Branch {
  id: string;
  name: string;
  address: string;
  is_active: boolean;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  order_id: string | null;
}


// ===================================================================
// 2. أنواع مساعدة لواجهة المستخدم (UI Helper Types)
// ===================================================================

export interface Category {
  id: number;
  name: string;
}

export type ActiveCategory = number | 'all';

export type OrderType = 'delivery' | 'pickup';

export interface CartItem {
  id: string;
  product: MenuItem;
  quantity: number;
  options: Record<string, any>;
  notes: string | undefined;
  totalPrice: number;
  additionalPieces: CartAdditionalPiece[];
}


// ===================================================================
// 3. أنواع خاصة بالـ Props للمكونات (Component Props Types)
// ===================================================================

// --- Props لشاشة السلة (CartScreen) ---

export interface AddressItemProps {
  address: Address;
  isSelected: boolean;
  onSelect: () => void;
}

export interface BranchItemProps {
  branch: Branch;
  isSelected: boolean;
  onSelect: () => void;
}

export interface CartItemComponentProps {
  item: CartItem;
  onUpdate: (itemId: string, change: 1 | -1) => void;
  onRemove: (itemId: string) => void;
  onPress: () => void;
}

export interface OrderTypeSelectorProps {
  orderType: OrderType | null;
  onTypeChange: (type: OrderType) => void;
}

export interface AddressSectionProps {
  orderType: OrderType | null;
  loadingAddresses: boolean;
  availableAddresses: Address[];
  selectedAddress: Address | null;
  onSelectAddress: (address: Address) => void;
  onAddAddress: () => void;
}

export interface BranchSectionProps {
  orderType: OrderType | null;
  loadingBranches: boolean;
  availableBranches: Branch[];
  selectedBranch: Branch | null;
  onSelectBranch: (branch: Branch) => void;
}

// --- Props لشاشة تفاصيل المنتج (MenuItemDetailsScreen) ---

export interface ImageCarouselProps {
  images: { id: number | string; source: { uri: string } | number }[];
  activeImageIndex: number;
  onScroll: (event: any) => void;
}

export interface OptionsSectionProps {
  group: OptionGroup;
  selectedOptions: Record<string, any>;
  onOptionSelect: (groupId: string, value: string) => void;
}

export interface QuantitySelectorProps {
  quantity: number;
  onDecrease: () => void;
  onIncrease: () => void;
}

// ✅✅✅ --- Props للشاشة الرئيسية (HomeScreen) --- ✅✅✅

export interface PromotionsCarouselProps {
  promotions: Promotion[];
}

export interface SectionComponentProps {
  section: CategoryWithItems;
  router: any; // يمكنك تحسين هذا النوع لاحقًا إذا أردت
}


export interface CategoryChipsProps {
  categories: Category[];
  activeCategory: ActiveCategory;
  onCategorySelect: (categoryId: ActiveCategory) => void;
  loading: boolean;
  sectionsWithItems?: number[]; // ✅ خاصية اختيارية للتعامل مع الأقسام الفارغة
}




//------------------------------------------

export interface AdditionalPieceType {
  id: string;
  name: string;
  price: number;
}

export interface CartAdditionalPiece {
  type: string;
  name: string;
  quantity: number;
  price: number;
}