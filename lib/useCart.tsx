// مسار الملف: lib/useCart.tsx

import { createContext, useContext, useState, ReactNode } from 'react';
import { randomUUID } from 'expo-crypto';

// ✅ استيراد الأنواع المحدثة
import { MenuItem, OrderType, CartItem, Address, Branch, CartAdditionalPiece } from './types';

// --- واجهة السياق (Context Interface) ---
interface CartContextType {
  items: CartItem[];
  addToCart: (
    product: MenuItem, 
    quantity: number, 
    options: Record<string, any>, 
    notes?: string,
    additionalPieces?: CartAdditionalPiece[] // ✅ أضف هذا المعامل
  ) => void;
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

  // ✅ تحديث دالة addToCart مع دعم القطع الإضافية
  const addToCart = (
    product: MenuItem, 
    quantity: number, 
    options: Record<string, any>, 
    notes?: string,
    additionalPieces: CartAdditionalPiece[] = [] // ✅ معامل جديد
  ) => {
    setItems(currentItems => {
      // ✅ تحديث شرط المقارنة ليشمل القطع الإضافية
      const existingItem = currentItems.find(item => 
        item.product.id === product.id && 
        JSON.stringify(item.options) === JSON.stringify(options) &&
        JSON.stringify(item.additionalPieces) === JSON.stringify(additionalPieces)
      );
      
      if (existingItem) {
        return currentItems.map(item =>
          item.id === existingItem.id
            ? { 
                ...item, 
                quantity: item.quantity + quantity, 
                totalPrice: calculateItemTotal({
                  ...item,
                  quantity: item.quantity + quantity
                })
              }
            : item
        );
      } else {
        const newCartItem: CartItem = { 
          id: randomUUID(), 
          product, 
          quantity, 
          options, 
          notes, 
          additionalPieces, // ✅ إضافة القطع الإضافية
          totalPrice: 0 // سيتم حسابه في السطر التالي
        };
        
        // ✅ حساب السعر الإجمالي
        newCartItem.totalPrice = calculateItemTotal(newCartItem);
        return [...currentItems, newCartItem];
      }
    });
  };

  // ✅ دالة مساعدة لحساب السعر الإجمالي للعنصر
  const calculateItemTotal = (item: CartItem): number => {
    let basePrice = item.product.price;
    
    // حساب سعر الخيارات الأساسية
    if (item.product.options) {
      Object.keys(item.options).forEach(optionId => {
        const group = item.product.options?.find(g => g.id === optionId);
        const value = group?.values.find(v => v.value === item.options[optionId]);
        if (value?.priceModifier) {
          basePrice += value.priceModifier;
        }
      });
    }
    
    // ✅ حساب سعر القطع الإضافية
    const additionalPiecesPrice = item.additionalPieces.reduce(
      (total, piece) => total + (piece.price * piece.quantity), 
      0
    );
    
    return (basePrice * item.quantity) + additionalPiecesPrice;
  };

  const updateQuantity = (cartItemId: string, amount: -1 | 1) => {
    setItems(currentItems =>
      currentItems.map(item => {
        if (item.id === cartItemId) {
          if (item.quantity === 1 && amount === -1) { return item; }
          const newQuantity = item.quantity + amount;
          
          // ✅ استخدام دالة الحساب الجديدة
          const newTotalPrice = calculateItemTotal({
            ...item,
            quantity: newQuantity
          });
          
          return { ...item, quantity: newQuantity, totalPrice: newTotalPrice };
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