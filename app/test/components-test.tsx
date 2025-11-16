import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { 
  CartItemComponent,
  OrderTypeSelector,
  AddressSection,
  BranchSection,
  EmptyCart,
  CartFooter,
  StepIndicator
} from '@/components/cart';
import { OrderType } from '@/lib/types';
import { 
  createMockCartItem, 
  createMockAddress, 
  createMockBranch 
} from '@/lib/test-data';

// استخدام البيانات الجديدة
const mockCartItem = createMockCartItem();
const mockAddress = createMockAddress();
const mockBranch = createMockBranch();

export default function ComponentsTest() {
  const [orderType, setOrderType] = useState<OrderType>('delivery');
  const [selectedAddress, setSelectedAddress] = useState(mockAddress);
  const [selectedBranch, setSelectedBranch] = useState(mockBranch);
  const [currentStep, setCurrentStep] = useState(1);

  const components = [
    { id: 'cart-item', name: '🛒 عنصر السلة', component: 'cart-item' },
    { id: 'order-type', name: '📦 نوع الطلب', component: 'order-type' },
    { id: 'address-section', name: '🏠 قسم العناوين', component: 'address-section' },
    { id: 'branch-section', name: '🏢 قسم الفروع', component: 'branch-section' },
    { id: 'empty-cart', name: '🛒 سلة فارغة', component: 'empty-cart' },
    { id: 'cart-footer', name: '💰 فوتر السلة', component: 'cart-footer' },
    { id: 'step-indicator', name: '📊 مؤشر الخطوات', component: 'step-indicator' }
  ];

  const [selectedComponent, setSelectedComponent] = useState(components[0]);

  const renderComponent = () => {
    switch (selectedComponent.component) {
      case 'cart-item':
        return (
          <CartItemComponent
            item={mockCartItem}
            onUpdate={() => {}}
            onRemove={() => {}}
            onPress={() => {}}
          />
        );
      
      case 'order-type':
        return (
          <View style={{ padding: 20, backgroundColor: 'white', borderRadius: 12 }}>
            <OrderTypeSelector 
              orderType={orderType}
              onTypeChange={setOrderType}
            />
            <Text style={{ marginTop: 16, textAlign: 'center' }}>
              النوع المحدد: {orderType === 'delivery' ? 'توصيل' : 'استلام'}
            </Text>
          </View>
        );
      
      case 'address-section':
        return (
          <AddressSection
            orderType="delivery"
            loadingAddresses={false}
            availableAddresses={[mockAddress]}
            selectedAddress={selectedAddress}
            onSelectAddress={setSelectedAddress}
            onAddAddress={() => {}}
          />
        );
      
      case 'branch-section':
        return (
          <BranchSection
            orderType="pickup"
            loadingBranches={false}
            availableBranches={[mockBranch]}
            selectedBranch={selectedBranch}
            onSelectBranch={setSelectedBranch}
          />
        );
      
      case 'empty-cart':
        return <EmptyCart />;
      
      case 'cart-footer':
        return (
          <CartFooter
            subtotal={85}
            orderType={orderType}
            selectedAddress={selectedAddress}
            onCheckout={() => {}}
          />
        );
      
      case 'step-indicator':
        return (
          <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 12 }}>
            <StepIndicator 
              currentStep={currentStep}
              orderType={orderType}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 20 }}>
              {[1, 2, 3].map(step => (
                <TouchableOpacity
                  key={step}
                  onPress={() => setCurrentStep(step)}
                  style={{
                    padding: 10,
                    marginHorizontal: 5,
                    backgroundColor: currentStep === step ? '#C62828' : '#f0f0f0',
                    borderRadius: 5
                  }}
                >
                  <Text style={{ color: currentStep === step ? 'white' : 'black' }}>
                    الخطوة {step}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      
      default:
        return null;
    }
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' }}>
        🧩 اختبار المكونات المنفصلة
      </Text>

      {/* قائمة المكونات */}
      <ScrollView horizontal style={{ marginBottom: 20 }}>
        {components.map((component) => (
          <TouchableOpacity
            key={component.id}
            onPress={() => setSelectedComponent(component)}
            style={{
              padding: 12,
              backgroundColor: selectedComponent.id === component.id ? '#C62828' : '#f0f0f0',
              marginRight: 10,
              borderRadius: 8
            }}
          >
            <Text style={{ 
              color: selectedComponent.id === component.id ? 'white' : 'black',
              fontSize: 12
            }}>
              {component.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* عرض المكون المحدد */}
      <View style={{ marginBottom: 10 }}>
        <Text style={{ fontSize: 16, fontWeight: '600' }}>
          {selectedComponent.name}
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }}>
        {renderComponent()}
      </ScrollView>
    </View>
  );
}