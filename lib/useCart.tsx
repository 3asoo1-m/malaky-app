// مسار الملف: lib/useCart.tsx

import { createContext, useContext, useState, ReactNode } from 'react';
import { MenuItem } from './types';
import { randomUUID } from 'expo-crypto';

// 1. تعريف الأنواع (تبقى كما هي)
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

// 2. تحديث واجهة السياق لإضافة دالة الحذف
interface CartContextType {
  items: CartItem[];
  addToCart: (
    product: MenuItem,
    quantity: number,
    options: Record<string, any>,
    notes?: string
  ) => void;
  updateQuantity: (cartItemId: string, amount: -1 | 1) => void;
  removeFromCart: (cartItemId: string) => void; // <-- الإضافة الجديدة هنا
  orderType: OrderType;
  setOrderType: (type: OrderType) => void;
  deliveryPrice: number;
  setDeliveryPrice: (price: number) => void;
  subtotal: number;
  totalPrice: number;
  selectedAddress: Address | null;
  setSelectedAddress: (address: Address | null) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<OrderType>('pickup');
  const [deliveryPrice, setDeliveryPriceState] = useState(0);
  const [selectedAddress, setSelectedAddressState] = useState<Address | null>(null);

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

  // 3. تعديل دالة updateQuantity لمنع الحذف
  const updateQuantity = (cartItemId: string, amount: -1 | 1) => {
    setItems(currentItems =>
      currentItems.map(item => {
        if (item.id === cartItemId) {
          // إذا كانت الكمية 1 والمستخدم يحاول الإنقاص، لا تفعل شيئًا
          if (item.quantity === 1 && amount === -1) {
            return item;
          }
          const newQuantity = item.quantity + amount;
          const singleItemPrice = item.totalPrice / item.quantity;
          return { ...item, quantity: newQuantity, totalPrice: singleItemPrice * newQuantity };
        }
        return item;
      })
    );
  };

  // 4. إضافة دالة الحذف الصريحة
  const removeFromCart = (cartItemId: string) => {
    setItems(currentItems => currentItems.filter(item => item.id !== cartItemId));
  };

  const setDeliveryPrice = (price: number) => {
    setDeliveryPriceState(price >= 0 ? price : 0);
  };

  const setSelectedAddress = (address: Address | null) => {
    setSelectedAddressState(address);
  };

  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalPrice = subtotal + deliveryPrice;

  // 5. تجميع كل القيم في كائن واحد
  const value = {
    items,
    addToCart,
    updateQuantity,
    removeFromCart, // <-- تمرير الدالة الجديدة
    orderType,
    setOrderType,
    deliveryPrice,
    setDeliveryPrice,
    subtotal,
    totalPrice,
    selectedAddress,
    setSelectedAddress,
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
