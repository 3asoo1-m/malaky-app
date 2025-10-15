// مسار الملف: lib/useCart.tsx

import { createContext, useContext, useState, ReactNode } from 'react';
import { randomUUID } from 'expo-crypto';

// ✅✅✅ الخطوة 1: استيراد كل الأنواع من مصدر الحقيقة الواحد ✅✅✅
import { MenuItem, OrderType, CartItem, Address, Branch } from './types';

// ❌❌❌ الخطوة 2: تم حذف كل التعريفات المكررة من هنا ❌❌❌


// --- واجهة السياق (Context Interface) ---
// الآن تستخدم الأنواع المستوردة بشكل صحيح
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
  selectedBranch: Branch | null;
  setSelectedBranch: (branch: Branch | null) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [orderType, setOrderTypeState] = useState<OrderType>('pickup');
  const [deliveryPrice, setDeliveryPriceState] = useState(0);
  const [selectedAddress, setSelectedAddressState] = useState<Address | null>(null);
  const [selectedBranch, setSelectedBranchState] = useState<Branch | null>(null);

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
      setSelectedBranchState(null);
    }
    if (type === 'pickup') {
      setSelectedAddressState(null);
      setDeliveryPriceState(0);
    }
    setOrderTypeState(type);
  };

  const clearCart = () => {
    setItems([]);
    setSelectedAddressState(null);
    setSelectedBranchState(null);
    setOrderTypeState('pickup');
  };

  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalPrice = subtotal + deliveryPrice;

  const value = {
    items,
    addToCart,
    updateQuantity,
    removeFromCart,
    orderType,
    setOrderType,
    deliveryPrice,
    setDeliveryPrice,
    subtotal,
    totalPrice,
    selectedAddress,
    setSelectedAddress,
    selectedBranch,
    setSelectedBranch,
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
