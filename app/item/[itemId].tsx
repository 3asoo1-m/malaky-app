// مسار الملف: app/item/[itemId].tsx

import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  TextInput, // ✅ استيراد TextInput
} from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons'; // ✅ استيراد Ionicons
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '@/lib/supabase';
import { MenuItem, OptionGroup } from '@/lib/types';
import { useCart } from '@/lib/useCart'; // ✅ استيراد هوك السلة

export default function MenuItemDetailsScreen() {
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const router = useRouter();
  const { addToCart } = useCart(); // ✅ استدعاء هوك السلة

  const [item, setItem] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, any>>({});
  
  // ✅ 1. إضافة حالات جديدة للكمية والملاحظات
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!itemId) return;
    const fetchItemDetails = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from('menu_items').select('*').eq('id', itemId).single<MenuItem>();
        if (error) { router.back(); } 
        else {
          setItem(data);
          if (data?.options) {
            const defaultOptions: Record<string, string> = {};
            data.options.forEach(group => {
              if (group.type === 'single-select' && group.values.length > 0) {
                defaultOptions[group.id] = group.values[0].value;
              }
            });
            setSelectedOptions(defaultOptions);
          }
        }
      } catch (e) { console.error(e); } 
      finally { setLoading(false); }
    };
    fetchItemDetails();
  }, [itemId]);

  const handleOptionSelect = (optionId: string, value: string) => {
    setSelectedOptions(prev => ({ ...prev, [optionId]: value }));
  };

  // ✅ 2. تحديث حساب السعر الإجمالي ليشمل الكمية
  const totalPrice = useMemo(() => {
    if (!item) return 0;
    let singleItemPrice = item.price;
    if (item.options) {
      Object.keys(selectedOptions).forEach(optionId => {
        const group = item.options?.find(g => g.id === optionId);
        const value = group?.values.find(v => v.value === selectedOptions[optionId]);
        if (value) {
          singleItemPrice += value.priceModifier;
        }
      });
    }
    return singleItemPrice * quantity;
  }, [item, selectedOptions, quantity]);

  // ✅ 3. تحديث دالة الإضافة إلى السلة
  const handleAddToCart = () => {
    if (!item) return;
    addToCart(item, quantity, selectedOptions, notes);
    alert(`${item.name} أضيفت إلى السلة!`);
    router.back();
  };

  if (loading || !item) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#E63946" /></View>;
  }

  const defaultImage = 'https://scontent.fjrs27-1.fna.fbcdn.net/v/t39.30808-6/347093685_1264545104456247_8195462777365390832_n.jpg?_nc_cat=101&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=Vurk9k7Yeh4Q7kNvwFMaIvw&_nc_oc=AdnLJ7bhQuIug3NeIMvRJKxx1dpZ4xT5SN5KXbUN9MnJP_foN0PuaRhHK5T5h2_mlKE&_nc_zt=23&_nc_ht=scontent.fjrs27-1.fna&_nc_gid=M1fGk0mVLfA72P9gTCQOJg&oh=00_AfY1CYuswm2dIn4EFLv-89zIfO8z1Y9NccbV_9AQZ-NI3A&oe=68DA50FC';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />
      <Image source={{ uri: item.image_url || defaultImage }} style={styles.backgroundImage} />
      <TouchableOpacity onPress={( ) => router.back()} style={styles.backButton}>
        <FontAwesome name="arrow-right" size={20} color="#1D3557" />
      </TouchableOpacity>

      <ScrollView style={styles.contentContainer} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{item.name}</Text>
        
        {item.options && item.options.map(group => (
          <View key={group.id} style={styles.optionsSection}>
            <Text style={styles.sectionTitle}>{group.label}</Text>
            <View style={styles.optionsContainer}>
              {group.values.map(option => {
                const isSelected = selectedOptions[group.id] === option.value;
                return (
                  <TouchableOpacity key={option.value} style={[styles.optionButton, isSelected && styles.optionSelected]} onPress={() => handleOptionSelect(group.id, option.value)}>
                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{option.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.separator} />
          </View>
        ))}

        {/* ✅ 4. إضافة قسم الملاحظات */}
        <Text style={styles.sectionTitle}>ملاحظات خاصة</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="مثال: بدون بصل، زيادة كاتشاب..."
          style={styles.notesInput}
          multiline
        />
        <View style={styles.separator} />

        <Text style={styles.description}>{item.description || 'لا يوجد وصف لهذه الوجبة.'}</Text>
      </ScrollView>

      {/* ✅ 5. تحديث الشريط السفلي ليشمل الكمية */}
      <View style={styles.footer}>
        <View style={styles.quantitySelector}>
          <TouchableOpacity onPress={() => setQuantity(q => Math.max(1, q - 1))} style={styles.quantityButton}>
            <Ionicons name="remove" size={24} color="#C62828" />
          </TouchableOpacity>
          <Text style={styles.quantityText}>{quantity}</Text>
          <TouchableOpacity onPress={() => setQuantity(q => q + 1)} style={styles.quantityButton}>
            <Ionicons name="add" size={24} color="#C62828" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCart} activeOpacity={0.8}>
          <Text style={styles.addToCartButtonText}>أضف للسلة | {totalPrice.toFixed(2)} ₪</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ✅ 6. تحديث التنسيقات
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backgroundImage: { width: '100%', height: 400, position: 'absolute', top: 0 },
  contentContainer: { flex: 1, marginTop: 300, backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  scrollContent: { padding: 20, paddingBottom: 120 },
  backButton: { position: 'absolute', top: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 60, right: 20, backgroundColor: 'rgba(255, 255, 255, 0.8)', padding: 10, borderRadius: 20, zIndex: 10 },
  title: { fontSize: 28, fontFamily: 'Cairo-Bold', color: '#1D3557', textAlign: 'right', marginBottom: 20 },
  description: { fontSize: 16, fontFamily: 'Cairo-Regular', lineHeight: 24, color: '#444', textAlign: 'right', marginTop: 10 },
  separator: { height: 1, backgroundColor: '#eee', marginVertical: 20 },
  optionsSection: { marginTop: 10 },
  sectionTitle: { fontSize: 18, fontFamily: 'Cairo-Bold', color: '#333', textAlign: 'right', marginBottom: 15 },
  optionsContainer: { flexDirection: 'row-reverse', flexWrap: 'wrap' },
  optionButton: { borderWidth: 1.5, borderColor: '#ddd', borderRadius: 30, paddingVertical: 10, paddingHorizontal: 20, marginEnd: 10, marginBottom: 10 },
  optionSelected: { backgroundColor: '#1D3557', borderColor: '#1D3557' },
  optionText: { fontSize: 16, fontFamily: 'Cairo-Regular', fontWeight: '600', color: '#333' },
  optionTextSelected: { color: '#fff' },
  notesInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 15,
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 16,
    textAlign: 'right',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 30,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  quantitySelector: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 30,
    padding: 4,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  quantityText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 20,
  },
  addToCartButton: {
    flex: 1,
    backgroundColor: '#C62828',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  addToCartButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Cairo-Bold',
  },
});
