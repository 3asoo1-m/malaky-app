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
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '@/lib/supabase';
import { MenuItem, OptionGroup } from '@/lib/types'; // ✅ استيراد الأنواع

// تعريف الأنواع للخيارات

export default function MenuItemDetailsScreen() {
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const router = useRouter();

  const [item, setItem] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. حالة لتخزين اختيارات المستخدم
  const [selectedOptions, setSelectedOptions] = useState<Record<string, any>>({});

  // 2. دالة لتحديث اختيارات المستخدم
  const handleOptionSelect = (optionId: string, value: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [optionId]: value,
    }));
  };

  useEffect(() => {
    if (!itemId) return;
    const fetchItemDetails = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('menu_items')
          .select('*')
          .eq('id', itemId)
          .single<MenuItem>();
        if (error) {
          router.back();
        } else {
          setItem(data);
          // 3. تعيين الاختيارات الافتراضية
          if (data && data.options && Array.isArray(data.options)) {
            const defaultOptions: Record<string, string> = {};
            (data.options as OptionGroup[]).forEach(group => {
              if (group.type === 'single-select' && group.values.length > 0) {
                defaultOptions[group.id] = group.values[0].value;
              }
            });
            setSelectedOptions(defaultOptions);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchItemDetails();
  }, [itemId]);

  // 4. حساب السعر الإجمالي ديناميكياً
  const totalPrice = useMemo(() => {
    if (!item) return 0;
    let total = item.price;
    if (item.options && Array.isArray(item.options)) {
      (item.options as OptionGroup[]).forEach(group => {
        const selectedValue = selectedOptions[group.id];
        if (selectedValue) {
          const selectedValueData = group.values.find(v => v.value === selectedValue);
          if (selectedValueData) {
            total += selectedValueData.priceModifier;
          }
        }
      });
    }
    return total;
  }, [item, selectedOptions]);

  const handleAddToCart = () => {
    if (!item) return;
    console.log('Item to add:', {
      itemId: item.id,
      name: item.name,
      selectedOptions: selectedOptions,
      totalPrice: totalPrice,
    });
    alert(`${item.name} أضيفت إلى السلة بالسعر الإجمالي: ${totalPrice.toFixed(2)} شيكل`);
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#E63946" /></View>;
  }

  if (!item) {
    return <View style={styles.centered}><Text>لم يتم العثور على هذه الوجبة.</Text></View>;
  }

  const defaultImage = 'https://scontent.fjrs27-1.fna.fbcdn.net/v/t39.30808-6/347093685_1264545104456247_8195462777365390832_n.jpg?_nc_cat=101&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=Vurk9k7Yeh4Q7kNvwFMaIvw&_nc_oc=AdnLJ7bhQuIug3NeIMvRJKxx1dpZ4xT5SN5KXbUN9MnJP_foN0PuaRhHK5T5h2_mlKE&_nc_zt=23&_nc_ht=scontent.fjrs27-1.fna&_nc_gid=M1fGk0mVLfA72P9gTCQOJg&oh=00_AfY1CYuswm2dIn4EFLv-89zIfO8z1Y9NccbV_9AQZ-NI3A&oe=68DA50FC';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />

      <Image source={{ uri: item.image_url || defaultImage }} style={styles.backgroundImage} />

      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <FontAwesome name="arrow-right" size={20} color="#1D3557" />
      </TouchableOpacity>

      <ScrollView
        style={styles.contentContainer}
        contentContainerStyle={styles.scrollContent}>

        <Text style={styles.title}>{item.name}</Text>

        {/* --- هذا هو الجزء الذي تم استبداله بالمنطق الديناميكي --- */}
        {item.options && item.options.map(group => (
          <View key={group.id} style={styles.optionsSection}>
            <Text style={styles.sectionTitle}>{group.label}</Text>
            <View style={styles.optionsContainer}>
              {group.values.map(option => {
                const isSelected = selectedOptions[group.id] === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.optionButton, isSelected && styles.optionSelected]}
                    onPress={() => handleOptionSelect(group.id, option.value)}
                  >
                    {/* يمكنك إضافة أيقونات هنا بناءً على القيمة لاحقاً */}
                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{option.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.separator} />
          </View>
        ))}
        {/* ------------------------------------------------------ */}

        <Text style={styles.sectionTitle}>الوصف</Text>
        <Text style={styles.description}>{item.description || 'لا يوجد وصف لهذه الوجبة.'}</Text>
      </ScrollView>

      <View style={styles.footer}>
        <View>
          <Text style={styles.priceLabel}>السعر الإجمالي</Text>
          <Text style={styles.price}>{totalPrice.toFixed(2)} شيكل</Text>
        </View>
        <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCart} activeOpacity={0.8}>
          <FontAwesome name="shopping-basket" size={20} color="#fff" style={{ marginRight: 10 }} />
          <Text style={styles.addToCartButtonText}>أضف إلى السلة</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// قمت بدمج التنسيقات من الكودين معاً وإضافة ما يلزم
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backgroundImage: {
    width: '100%',
    height: 400,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#f0f0f0',
  },
  contentContainer: {
    flex: 1,
    marginTop: 280,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  backButton: {
    position: 'absolute',
    top: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 60,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 10,
    borderRadius: 20,
    zIndex: 10,
  },
  title: { fontSize: 32, fontFamily: 'Cairo-Bold', color: '#1D3557', textAlign: 'right', marginBottom: 20 },
  description: { fontSize: 16, fontFamily: 'Cairo-Regular', lineHeight: 24, color: '#444', textAlign: 'right' },
  separator: { height: 1, backgroundColor: '#eee', marginVertical: 20 },
  optionsSection: { marginTop: 10 },
  sectionTitle: { fontSize: 18, fontFamily: 'Cairo-Bold', color: '#333', textAlign: 'right', marginBottom: 15 },
  optionsContainer: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap', // <-- مهم للسماح بانتقال الأزرار لسطر جديد
  },
  optionButton: {
    flexDirection: 'row-reverse',
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginEnd: 10, // <-- هام للمسافة بين الأزرار
    marginBottom: 10, // <-- هام للمسافة عند الانتقال لسطر جديد
    alignItems: 'center'
  },
  optionSelected: { backgroundColor: '#1D3557', borderColor: '#1D3557' },
  optionText: { fontSize: 16, fontFamily: 'Cairo-Regular', fontWeight: '600', color: '#333' },
  optionTextSelected: { color: '#fff' },
  priceModifierText: { fontSize: 14, fontFamily: 'Cairo-Regular', color: '#888' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 30, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
  priceLabel: { fontSize: 14, fontFamily: 'Cairo-Regular', color: '#888', textAlign: 'right' },
  price: { fontSize: 22, fontFamily: 'Cairo-Bold', color: '#1D3557' },
  addToCartButton: { flexDirection: 'row-reverse', backgroundColor: '#E63946', paddingVertical: 14, paddingHorizontal: 25, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  addToCartButtonText: { color: '#fff', fontSize: 18, fontFamily: 'Cairo-Bold' },
});
