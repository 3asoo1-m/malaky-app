import { MenuItem, CartItem, Address, Branch } from './types';

// بيانات منتج اختبارية متوافقة مع الأنواع
export const createMockProduct = (overrides?: Partial<MenuItem>): MenuItem => ({
  id: 1,
  name: 'برجر لحم مشوي',
  description: 'برجر لحم طازج مع خضار طازجة',
  price: 25,
  category_id: 1,
  image_url: null,
  is_popular: false,
  images: [
    { 
      id: 1, 
      image_url: 'menu-images/burger.jpg',
      display_order: 1,
      alt_text: 'برجر لحم'
    }
  ],
  options: [
    {
      id: 'size',
      label: 'الحجم',
      type: 'single-select',
      values: [
        { value: 'large', label: 'كبير', priceModifier: 5 },
        { value: 'medium', label: 'وسط', priceModifier: 0 }
      ]
    }
  ],
  ...overrides
});

// بيانات عنصر سلة اختبارية
export const createMockCartItem = (overrides?: Partial<CartItem>): CartItem => ({
  id: 'test-item-1',
  product: createMockProduct(),
  quantity: 2,
  options: { size: 'large' },
  notes: 'بدون بصل',
  totalPrice: 60,
  additionalPieces: [],
  ...overrides
});

// بيانات عنوان اختبارية
export const createMockAddress = (overrides?: Partial<Address>): Address => ({
  id: 1,
  street_address: 'شارع الملك فهد - حي الروضة',
  notes: null,
  created_at: new Date().toISOString(),
  is_default: true,
  address_name: 'المنزل',
  delivery_zones: {
    city: 'الرياض',
    area_name: 'حي الروضة',
    delivery_price: 10
  },
  ...overrides
});

// بيانات فرع اختبارية
export const createMockBranch = (overrides?: Partial<Branch>): Branch => ({
  id: 'branch-1',
  name: 'فرع الرياض - الملك فهد',
  address: 'شارع الملك فهد، الرياض',
  is_active: true,
  ...overrides
});