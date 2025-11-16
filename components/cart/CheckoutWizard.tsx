import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OrderType, Address, Branch } from '@/lib/types';
import { StepIndicator } from './StepIndicator';
import { OrderTypeSelector } from './OrderTypeSelector';
import { AddressSection } from './AddressSection';
import { BranchSection } from './BranchSection';
import { CheckoutReview } from './CheckoutReview';

interface CheckoutWizardProps {
  visible: boolean;
  onClose: () => void;
  checkoutStep: number;
  setCheckoutStep: (step: number) => void;
  orderType: OrderType;
  onOrderTypeChange: (type: OrderType) => void;
  loadingAddresses: boolean;
  availableAddresses: Address[];
  selectedAddress: Address | null;
  onSelectAddress: (address: Address) => void;
  onAddAddress: () => void;
  loadingBranches: boolean;
  availableBranches: Branch[];
  selectedBranch: Branch | null;
  onSelectBranch: (branch: Branch) => void;
  items: any[];
  subtotal: number;
  deliveryPrice: number;
  promoCode: string;
  setPromoCode: (code: string) => void;
  promoApplied: boolean;
  setPromoApplied: (applied: boolean) => void;
  orderNotes: string;
  setOrderNotes: (notes: string) => void;
  isPlacingOrder: boolean;
  onPlaceOrder: () => void;
}

export const CheckoutWizard: React.FC<CheckoutWizardProps> = ({
  visible,
  onClose,
  checkoutStep,
  setCheckoutStep,
  orderType,
  onOrderTypeChange,
  loadingAddresses,
  availableAddresses,
  selectedAddress,
  onSelectAddress,
  onAddAddress,
  loadingBranches,
  availableBranches,
  selectedBranch,
  onSelectBranch,
  items,
  subtotal,
  deliveryPrice,
  promoCode,
  setPromoCode,
  promoApplied,
  setPromoApplied,
  orderNotes,
  setOrderNotes,
  isPlacingOrder,
  onPlaceOrder,
}) => {
  const handleClose = () => {
    Alert.alert(
      'إلغاء الطلب',
      'هل تريد إلغاء الطلب والخروج؟',
      [
        {
          text: 'متابعة الطلب',
          style: 'cancel',
        },
        {
          text: 'نعم، إلغاء',
          style: 'destructive',
          onPress: onClose,
        },
      ]
    );
  };

  const getModalTitle = () => {
    switch (checkoutStep) {
      case 1: return 'نوع الطلب';
      case 2: return orderType === 'delivery' ? 'عنوان التوصيل' : 'فرع الاستلام';
      case 3: return 'تفاصيل الطلب';
      default: return 'إتمام الطلب';
    }
  };

  const canProceedToNextStep = () => {
    switch (checkoutStep) {
      case 1:
        return !!orderType;
      case 2:
        if (orderType === 'delivery') {
          return !!selectedAddress;
        } else {
          return !!selectedBranch;
        }
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleNextStep = () => {
    if (checkoutStep < 3) {
      setCheckoutStep(checkoutStep + 1);
    } else {
      onPlaceOrder();
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <ModalHeader 
            title={getModalTitle()}
            onClose={handleClose}
          />
          
          {checkoutStep < 4 && (
            <StepIndicator 
              currentStep={checkoutStep}
              orderType={orderType}
            />
          )}

          <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
            {checkoutStep === 1 && (
              <OrderTypeStep 
                orderType={orderType}
                onOrderTypeChange={onOrderTypeChange}
              />
            )}

            {checkoutStep === 2 && (
              <LocationStep 
                orderType={orderType}
                loadingAddresses={loadingAddresses}
                availableAddresses={availableAddresses}
                selectedAddress={selectedAddress}
                onSelectAddress={onSelectAddress}
                onAddAddress={onAddAddress}
                loadingBranches={loadingBranches}
                availableBranches={availableBranches}
                selectedBranch={selectedBranch}
                onSelectBranch={onSelectBranch}
              />
            )}

            {checkoutStep === 3 && (
              <CheckoutReview 
                items={items}
                orderType={orderType}
                selectedAddress={selectedAddress}
                selectedBranch={selectedBranch}
                subtotal={subtotal}
                deliveryPrice={deliveryPrice}
                promoCode={promoCode}
                setPromoCode={setPromoCode}
                promoApplied={promoApplied}
                setPromoApplied={setPromoApplied}
                orderNotes={orderNotes}
                setOrderNotes={setOrderNotes}
              />
            )}
          </ScrollView>

          <ModalActions 
            checkoutStep={checkoutStep}
            onBack={() => setCheckoutStep(checkoutStep - 1)}
            onNext={handleNextStep}
            canProceed={canProceedToNextStep()}
            isPlacingOrder={isPlacingOrder}
          />
        </View>
      </View>
    </Modal>
  );
};

const ModalHeader: React.FC<{ title: string; onClose: () => void }> = ({ 
  title, 
  onClose 
}) => (
  <View style={styles.modalHeader}>
    <View style={styles.modalHeaderContent}>
      <TouchableOpacity 
        style={styles.modalCloseButton}
        onPress={onClose}
      >
        <Ionicons name="close" size={24} color="#6B7280" />
      </TouchableOpacity>
      
      <Text style={styles.modalTitle}>{title}</Text>
      
      <View style={{ width: 40 }} />
    </View>
  </View>
);

const OrderTypeStep: React.FC<{
  orderType: OrderType;
  onOrderTypeChange: (type: OrderType) => void;
}> = ({ orderType, onOrderTypeChange }) => (
  <View style={styles.stepContent}>
    <View style={styles.sectionContainer}>
      <Text style={styles.stepTitle}>اختر نوع الطلب</Text>
      <OrderTypeSelector 
        orderType={orderType} 
        onTypeChange={onOrderTypeChange} 
      />
    </View>
  </View>
);

const LocationStep: React.FC<{
  orderType: OrderType;
  loadingAddresses: boolean;
  availableAddresses: Address[];
  selectedAddress: Address | null;
  onSelectAddress: (address: Address) => void;
  onAddAddress: () => void;
  loadingBranches: boolean;
  availableBranches: Branch[];
  selectedBranch: Branch | null;
  onSelectBranch: (branch: Branch) => void;
}> = ({
  orderType,
  loadingAddresses,
  availableAddresses,
  selectedAddress,
  onSelectAddress,
  onAddAddress,
  loadingBranches,
  availableBranches,
  selectedBranch,
  onSelectBranch,
}) => (
  <View style={styles.stepContent}>
    {orderType === 'delivery' ? (
      <AddressSection
        orderType={orderType}
        loadingAddresses={loadingAddresses}
        availableAddresses={availableAddresses}
        selectedAddress={selectedAddress}
        onSelectAddress={onSelectAddress}
        onAddAddress={onAddAddress}
      />
    ) : (
      <BranchSection
        orderType={orderType}
        loadingBranches={loadingBranches}
        availableBranches={availableBranches}
        selectedBranch={selectedBranch}
        onSelectBranch={onSelectBranch}
      />
    )}
  </View>
);

const ModalActions: React.FC<{
  checkoutStep: number;
  onBack: () => void;
  onNext: () => void;
  canProceed: boolean;
  isPlacingOrder: boolean;
}> = ({ 
  checkoutStep, 
  onBack, 
  onNext, 
  canProceed,
  isPlacingOrder,
}) => (
  <View style={styles.modalActions}>
    <View style={styles.navigationButtons}>
      {checkoutStep > 1 && (
        <TouchableOpacity
          style={styles.backButtonModal}
          onPress={onBack}
        >
          <Text style={styles.backButtonText}>رجوع</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[
          styles.continueButton,
          checkoutStep === 1 && { flex: 1 },
          !canProceed && styles.continueButtonDisabled,
        ]}
        disabled={!canProceed || isPlacingOrder}
        onPress={onNext}
      >
        {checkoutStep === 3 ? (
          isPlacingOrder ? (
            <Text style={styles.continueText}>جاري التأكيد...</Text>
          ) : (
            <View style={styles.placeOrderContent}>
              <Ionicons name="receipt-outline" size={20} color="#fff" />
              <Text style={styles.placeOrderText}>تأكيد الطلب</Text>
            </View>
          )
        ) : (
          <View style={styles.continueContent}>
            <Text style={styles.continueText}>متابعة</Text>
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </View>
        )}
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#f8fafc',
    marginTop: 50,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalScrollView: {
    flex: 1,
  },
  modalHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFF',
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Cairo-Bold',
    color: '#1F2937',
    textAlign: 'center',
  },
  stepContent: {
    paddingVertical: 24,
  },
  sectionContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 0,
  },
  stepTitle: {
    fontSize: 20,
    fontFamily: 'Cairo-Bold',
    color: '#1f2937',
    marginBottom: 20,
  },
  modalActions: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    backgroundColor: '#fff',
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  backButtonModal: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    borderWidth: 0,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: 'Cairo-Bold',
    color: '#4b5563',
  },
  continueButton: {
    flex: 2.5,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#C62828',
    alignItems: 'center',
    shadowColor: '#C62828',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  continueButtonDisabled: {
    backgroundColor: '#d1d5db',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  continueText: {
    fontSize: 17,
    fontFamily: 'Cairo-Bold',
    color: '#fff',
    marginRight: 8,
  },
  placeOrderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  placeOrderText: {
    fontSize: 16,
    fontFamily: 'Cairo-Bold',
    color: '#fff',
    marginLeft: 8,
  },
});