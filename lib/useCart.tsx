// مسار الملف: lib/useCart.tsx

import { createContext, useContext, useState, ReactNode } from 'react';
import { MenuItem } from './types';
import { randomUUID } from 'expo-crypto';

// ✅ 1. تعريف أنواع جديدة
export type OrderType = 'delivery' | 'pickup';

export interface CartItem {
  id: string;
  product: MenuItem;
  quantity: number;
  options: Record<string, any>;
  notes?: string;
  totalPrice: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (
    product: MenuItem,
    quantity: number,
    options: Record<string, any>,
    notes?: string
  ) => void;
  updateQuantity: (cartItemId: string, amount: -1 | 1) => void;
  
  // ✅ 2. إضافة حالات ودوال جديدة
  orderType: OrderType;
  setOrderType: (type: OrderType) => void;
  deliveryPrice: number;
  subtotal: number; // السعر قبل التوصيل
  totalPrice: number; // السعر الإجمالي
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// ✅ 3. سعر توصيل ثابت (يمكنك جلبه من قاعدة البيانات لاحقًا)
const DELIVERY_PRICE = 10.0;

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<OrderType>('pickup'); // ✅ القيمة الافتراضية هي استلام

  // ... (دوال addToCart و updateQuantity تبقى كما هي)
  const addToCart = (
    product: MenuItem,
    quantity: number,
    options: Record<string, any>,
    notes?: string
  ) => {
    let itemPrice = product.price;
    if (product.options) {
      Object.keys(options).forEach(optionId => {
        const group = product.options?.find(g => g.id === optionId);
        const value = group?.values.find(v => v.value === options[optionId]);
        if (value) {
          itemPrice += value.priceModifier;
        }
      });
    }
    const newCartItem: CartItem = {
      id: randomUUID(),
      product,
      quantity,
      options,
      notes,
      totalPrice: itemPrice * quantity,
    };
    setItems(currentItems => [...currentItems, newCartItem]);
  };

  const updateQuantity = (cartItemId: string, amount: -1 | 1) => {
    setItems(currentItems =>
      currentItems
        .map(item => {
          if (item.id === cartItemId) {
            const newQuantity = item.quantity + amount;
            const singleItemPrice = item.totalPrice / item.quantity;
            return { ...item, quantity: newQuantity, totalPrice: singleItemPrice * newQuantity };
          }
          return item;
        })
        .filter(item => item.quantity > 0)
    );
  };


  // ✅ 4. تحديث حسابات الأسعار
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const deliveryPrice = orderType === 'delivery' ? DELIVERY_PRICE : 0;
  const totalPrice = subtotal + deliveryPrice;

  const value = {
    items,
    addToCart,
    updateQuantity,
    orderType,
    setOrderType,
    deliveryPrice,
    subtotal,
    totalPrice,
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
