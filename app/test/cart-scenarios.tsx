import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { CartItemComponent } from '@/components/cart/CartItem';
import { CartItem } from '@/lib/types';
import { createMockCartItem, createMockProduct } from '@/lib/test-data';

// استخدام البيانات الجديدة
const mockCartItem = createMockCartItem();

const cartScenarios = [
  {
    id: 1,
    name: '🛒 سلة فارغة',
    description: 'اختبار حالة السلة الفارغة',
    items: []
  },
  {
    id: 2,
    name: '📦 عنصر واحد',
    description: 'سلة تحتوي على عنصر واحد',
    items: [mockCartItem]
  },
  {
    id: 3,
    name: '🎁 قطع إضافية',
    description: 'عنصر مع قطع إضافية',
    items: [
      createMockCartItem({
        id: 'test-item-2',
        additionalPieces: [
          { type: 'extra', name: 'جبن إضافي', price: 5, quantity: 2 },
          { type: 'extra', name: 'صوص خاص', price: 3, quantity: 1 }
        ]
      })
    ]
  },
  {
    id: 4,
    name: '⚡ كميات كبيرة',
    description: 'عنصر بكمية كبيرة',
    items: [
      createMockCartItem({
        id: 'test-item-3',
        quantity: 10,
        totalPrice: 300
      })
    ]
  },
  {
    id: 5,
    name: '🔧 خيارات متعددة',
    description: 'عنصر مع خيارات متعددة',
    items: [
      createMockCartItem({
        id: 'test-item-4',
        options: {
          size: 'large',
          sauce: 'spicy'
        }
      })
    ]
  }
];

export default function CartScenariosTest() {
  const [currentScenario, setCurrentScenario] = useState(cartScenarios[0]);

  const handleUpdateQuantity = (itemId: string, change: 1 | -1) => {
    Alert.alert('تحديث الكمية', `Item: ${itemId}, Change: ${change}`);
  };

  const handleRemoveItem = (itemId: string) => {
    Alert.alert('حذف العنصر', `Item: ${itemId}`);
  };

  const handlePressItem = (item: CartItem) => {
    Alert.alert('نقر على العنصر', `Product: ${item.product.name}`);
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' }}>
        🧪 اختبار سيناريوهات السلة
      </Text>

      {/* اختيار السيناريو */}
      <ScrollView horizontal style={{ marginBottom: 20 }}>
        {cartScenarios.map((scenario) => (
          <TouchableOpacity
            key={scenario.id}
            onPress={() => setCurrentScenario(scenario)}
            style={{
              padding: 12,
              backgroundColor: currentScenario.id === scenario.id ? '#C62828' : '#f0f0f0',
              marginRight: 10,
              borderRadius: 8,
              minWidth: 120
            }}
          >
            <Text style={{ 
              color: currentScenario.id === scenario.id ? 'white' : 'black',
              textAlign: 'center',
              fontSize: 12
            }}>
              {scenario.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* عرض السيناريو المحدد */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
          {currentScenario.name}
        </Text>
        <Text style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
          {currentScenario.description}
        </Text>
      </View>

      {/* عرض عناصر السلة */}
      <ScrollView style={{ flex: 1 }}>
        {currentScenario.items.length === 0 ? (
          <View style={{ 
            padding: 40, 
            alignItems: 'center',
            backgroundColor: '#f8f9fa',
            borderRadius: 12
          }}>
            <Text style={{ fontSize: 18, color: '#999' }}>
            🛒 السلة فارغة
            </Text>
          </View>
        ) : (
          currentScenario.items.map((item) => (
            <CartItemComponent
              key={item.id}
              item={item}
              onUpdate={handleUpdateQuantity}
              onRemove={handleRemoveItem}
              onPress={handlePressItem}
            />
          ))
        )}
      </ScrollView>

      {/* إحصائيات */}
      <View style={{ 
        marginTop: 20, 
        padding: 16, 
        backgroundColor: '#e8f5e8',
        borderRadius: 8
      }}>
        <Text style={{ fontWeight: '600', marginBottom: 8 }}>📊 إحصائيات:</Text>
        <Text>عدد العناصر: {currentScenario.items.length}</Text>
        <Text>إجمالي الكمية: {currentScenario.items.reduce((sum, item) => sum + item.quantity, 0)}</Text>
        <Text>المجموع الكلي: {currentScenario.items.reduce((sum, item) => sum + item.totalPrice, 0)} ₪</Text>
      </View>
    </View>
  );
}