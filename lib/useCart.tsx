// مسار الملف: lib/useCart.tsx

import { createContext, useContext, useState, ReactNode } from 'react';
import { MenuItem } from './types';
import { randomUUID } from 'expo-crypto';

// 1. تعريف الأنواع الأساسية
export type OrderType = 'delivery' | 'pickup';

export interface CartItem {
  id: string;
  product: MenuItem;
  quantity: number;
  options: Record<string, any>;
  notes?: string;
  totalPrice: number;
}

export interface Address {
  id: number;
  street_address: string;
  notes: string | null;
  created_at: string;
  delivery_zones: {
    city: string;
    area_name: string;
    delivery_price: number;
  } | null;
}

// 2. إضافة واجهة Branch
export interface Branch {
  id: number;
  name: string;
  address: string;
  // يمكنك إضافة حقول أخرى هنا في المستقبل
}

// 3. تحديث واجهة السياق لتشمل الفرع
interface CartContextType {
  items: CartItem[];
  addToCart: (product: MenuItem, quantity: number, options: Record<string, any>, notes?: string) => void;
  updateQuantity: (cartItemId: string, amount: -1 | 1) => void;
  removeFromCart: (cartItemId: string) => void;
  orderType: OrderType;
  setOrderType: (type: OrderType) => void;
  deliveryPrice: number;
  setDeliveryPrice: (price: number) => void;
  subtotal: number;
  totalPrice: number;
  selectedAddress: Address | null;
  setSelectedAddress: (address: Address | null) => void;
  selectedBranch: Branch | null; // <-- جديد
  setSelectedBranch: (branch: Branch | null) => void; // <-- جديد
  clearCart: () => void; // <-- الإضافة الجديدة هنا

}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [orderType, setOrderTypeState] = useState<OrderType>('pickup'); // <-- تم تغيير الاسم
  const [deliveryPrice, setDeliveryPriceState] = useState(0);
  const [selectedAddress, setSelectedAddressState] = useState<Address | null>(null);
  const [selectedBranch, setSelectedBranchState] = useState<Branch | null>(null); // <-- حالة جديدة

  const addToCart = (product: MenuItem, quantity: number, options: Record<string, any>, notes?: string) => {
    setItems(currentItems => {
      const existingItem = currentItems.find(item => item.product.id === product.id && JSON.stringify(item.options) === JSON.stringify(options));
      if (existingItem) {
        return currentItems.map(item =>
          item.id === existingItem.id
            ? { ...item, quantity: item.quantity + quantity, totalPrice: (item.totalPrice / item.quantity) * (item.quantity + quantity) }
            : item
        );
      } else {
        let itemPrice = product.price;
        if (product.options) {
          Object.keys(options).forEach(optionId => {
            const group = product.options?.find(g => g.id === optionId);
            const value = group?.values.find(v => v.value === options[optionId]);
            if (value) { itemPrice += value.priceModifier; }
          });
        }
        const newCartItem: CartItem = { id: randomUUID(), product, quantity, options, notes, totalPrice: itemPrice * quantity };
        return [...currentItems, newCartItem];
      }
    });
  };

  const updateQuantity = (cartItemId: string, amount: -1 | 1) => {
    setItems(currentItems =>
      currentItems.map(item => {
        if (item.id === cartItemId) {
          if (item.quantity === 1 && amount === -1) { return item; }
          const newQuantity = item.quantity + amount;
          const singleItemPrice = item.totalPrice / item.quantity;
          return { ...item, quantity: newQuantity, totalPrice: singleItemPrice * newQuantity };
        }
        return item;
      })
    );
  };

  const removeFromCart = (cartItemId: string) => {
    setItems(currentItems => currentItems.filter(item => item.id !== cartItemId));
  };

  const setDeliveryPrice = (price: number) => {
    setDeliveryPriceState(price >= 0 ? price : 0);
  };

  const setSelectedAddress = (address: Address | null) => {
    setSelectedAddressState(address);
  };

  const setSelectedBranch = (branch: Branch | null) => {
    setSelectedBranchState(branch);
  };

  const setOrderType = (type: OrderType) => {
    if (type === 'delivery') {
      setSelectedBranchState(null); // إذا اختار توصيل، ألغِ اختيار الفرع
    }
    if (type === 'pickup') {
      setSelectedAddressState(null); // إذا اختار استلام، ألغِ اختيار العنوان
      setDeliveryPriceState(0); // سعر التوصيل صفر دائمًا في حالة الاستلام
    }
    setOrderTypeState(type);
  };

  const clearCart = () => {
    setItems([]); // ببساطة، قم بتفريغ مصفوفة المنتجات
    setSelectedAddressState(null);
    setSelectedBranchState(null);
    setOrderTypeState('pickup');
  };

  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalPrice = subtotal + deliveryPrice;

  // 6. تجميع كل القيم في كائن واحد، بما في ذلك الفرع
  const value = {
    items,
    addToCart,
    updateQuantity,
    removeFromCart,
    orderType,
    setOrderType, // <-- تمرير الدالة الذكية الجديدة
    deliveryPrice,
    setDeliveryPrice,
    subtotal,
    totalPrice,
    selectedAddress,
    setSelectedAddress,
    selectedBranch, // <-- تمرير حالة الفرع
    setSelectedBranch, // <-- تمرير دالة تحديث الفرع
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
