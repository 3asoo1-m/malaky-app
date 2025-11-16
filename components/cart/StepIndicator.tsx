import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { OrderType } from '@/lib/types';

interface StepIndicatorProps {
  currentStep: number;
  orderType: OrderType;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ 
  currentStep, 
  orderType 
}) => {
  const steps = [
    { id: 1, label: 'نوع الطلب' },
    { id: 2, label: orderType === 'delivery' ? 'العنوان' : 'الفرع' },
    { id: 3, label: 'الدفع' },
    { id: 4, label: 'التأكيد' }
  ];

  return (
    <View style={styles.stepIndicator}>
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          {/* حاوية الخطوة (الدائرة والنص) */}
          <View style={styles.stepItem}>
            <View style={[
              styles.stepCircle,
              currentStep >= step.id ? styles.stepCircleActive : styles.stepCircleInactive
            ]}>
              {currentStep > step.id ? (
                <MaterialIcons name="check" size={18} color="#fff" />
              ) : (
                <Text style={[
                  styles.stepNumber,
                  currentStep >= step.id ? styles.stepNumberActive : styles.stepNumberInactive
                ]}>
                  {step.id}
                </Text>
              )}
            </View>
            <Text style={[
              styles.stepLabel,
              currentStep >= step.id ? styles.stepLabelActive : styles.stepLabelInactive
            ]}>
              {step.label}
            </Text>
          </View>

          {/* عرض الخط الفاصل بين الخطوات */}
          {index < steps.length - 1 && (
            <View style={[
              styles.stepLine,
              currentStep > index + 1 ? styles.stepLineActive : styles.stepLineInactive
            ]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: '#fff',
  },
  stepItem: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: 8,
  },
  stepCircleActive: {
    backgroundColor: '#C62828',
    borderColor: '#C62828',
  },
  stepCircleInactive: {
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
  },
  stepNumber: {
    fontSize: 16,
    fontFamily: 'Cairo-Bold',
  },
  stepNumberActive: {
    color: '#fff',
  },
  stepNumberInactive: {
    color: '#9ca3af',
  },
  stepLabel: {
    fontSize: 12,
    fontFamily: 'Cairo-SemiBold',
    marginTop: 4,
  },
  stepLabelActive: {
    color: '#1f2937',
  },
  stepLabelInactive: {
    color: '#9ca3af',
  },
  stepLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 8,
    marginTop: -25,
  },
  stepLineActive: {
    backgroundColor: '#C62828',
  },
  stepLineInactive: {
    backgroundColor: '#e5e7eb',
  },
});