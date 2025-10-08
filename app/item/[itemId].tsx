// مسار الملف: app/item/[itemId].tsx

import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  TextInput,
  FlatList,
  Dimensions,
  Animated,
} from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import DynamicImage from '@/components/DynamicImage'; // استيراد المكون
import { supabase } from '@/lib/supabase';
import { MenuItem } from '@/lib/types';
import { useCart } from '@/lib/useCart';

const { width: screenWidth } = Dimensions.get('window');

export default function MenuItemDetailsScreen() {
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const router = useRouter();
  const { addToCart } = useCart();

  const [item, setItem] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, any>>({});
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!itemId) return;
    const fetchItemDetails = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('menu_items')
          .select(`*, images:menu_item_images(id, image_url, display_order)`)
          .eq('id', itemId)
          .single<MenuItem>();

        if (error) {
          console.error(error);
          router.back();
        } else {
          if (data?.images) {
            data.images.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
          }
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
          Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchItemDetails();
  }, [itemId]);

  const handleOptionSelect = (optionId: string, value: string) => {
    setSelectedOptions(prev => ({ ...prev, [optionId]: value }));
  };

  const totalPrice = useMemo(() => {
    if (!item) return 0;
    let singleItemPrice = item.price;
    if (item.options) {
      Object.keys(selectedOptions).forEach(optionId => {
        const group = item.options?.find(g => g.id === optionId);
        const value = group?.values.find(v => v.value === selectedOptions[optionId]);
        if (value?.priceModifier) {
          singleItemPrice += value.priceModifier;
        }
      });
    }
    return singleItemPrice * quantity;
  }, [item, selectedOptions, quantity]);

  const handleAddToCart = () => {
    if (!item) return;
    addToCart(item, quantity, selectedOptions, notes);
    alert(`${item.name} أضيفت إلى السلة!`);
    router.back();
  };

  const onScroll = (event: any) => {
    const newIndex = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
    setActiveImageIndex(newIndex);
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#E63946" /></View>;
  }

  if (!item) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text>لم يتم العثور على المنتج.</Text>
        <TouchableOpacity onPress={() => router.back()}><Text style={{ color: '#C62828', marginTop: 10 }}>العودة</Text></TouchableOpacity>
      </SafeAreaView>
    );
  }

   const defaultImageSource = require('@/assets/images/icon.png');
const imagesToShow = item.images && item.images.length > 0 
    ? item.images.map(img => ({ id: img.id, source: { uri: img.image_url } }))
    : [{ id: 0, source: defaultImageSource }];
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar barStyle="dark-content" />
      <Stack.Screen options={{ headerShown: false }} />

      <TouchableOpacity onPress={( ) => router.back()} style={styles.backButton}>
        <FontAwesome name="arrow-left" size={20} color="#1D3557" />
      </TouchableOpacity>

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* --- معرض الصور الديناميكي --- */}
          <View style={styles.carouselContainer}>
            <FlatList
              data={imagesToShow}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(img) => img.id.toString()}
              renderItem={({ item: img }) => (
                // ✅ تمرير 'source' بدلاً من 'uri'
                <DynamicImage
                  source={img.source}
                  style={{ width: screenWidth }}
                />
              )}
              onScroll={onScroll}
              scrollEventThrottle={16}
            />
            <View style={styles.pagination}>
              {imagesToShow.length > 1 && imagesToShow.map((_, index) => (
                <View key={index} style={[styles.dot, index === activeImageIndex && styles.dotActive]} />
              ))}
            </View>
          </View>

          {/* --- حاوية التفاصيل --- */}
          <View style={styles.detailsContainer}>
            <Text style={styles.title}>{item.name}</Text>

            {Array.isArray(item.options) && item.options.map(group => {
              if (!group || !Array.isArray(group.values)) return null;
              return (
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
                          <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{option.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <View style={styles.separator} />
                </View>
              );
            })}

            <Text style={styles.sectionTitle}>ملاحظات خاصة</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="مثال: بدون بصل، زيادة كاتشاب..."
              style={styles.notesInput}
              multiline
            />
            <View style={styles.separator} />

            <Text style={styles.sectionTitle}>الوصف</Text>
            <Text style={styles.description}>{item.description || 'لا يوجد وصف لهذه الوجبة.'}</Text>
          </View>
        </ScrollView>
      </Animated.View>

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

// --- التنسيقات النهائية ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 120 },
  carouselContainer: {
    backgroundColor: '#f0f0f0',
  },
  pagination: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    flexDirection: 'row-reverse',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255, 255, 255, 0.5)', marginHorizontal: 4 },
  dotActive: { backgroundColor: '#fff' },
  detailsContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    zIndex: 1,
  },
  backButton: {
    position: 'absolute',
    top: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 60,
    end: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 10,
    borderRadius: 20,
    zIndex: 10,
  },
  title: { fontSize: 28, fontFamily: 'Cairo-Bold', color: '#1D3557', marginBottom: 20, textAlign: 'left' },
  description: { fontSize: 16, fontFamily: 'Cairo-Regular', lineHeight: 24, color: '#444', marginTop: 10, textAlign: 'left' },
  separator: { height: 1, backgroundColor: '#eee', marginVertical: 20 },
  optionsSection: { marginTop: 10 },
  sectionTitle: { fontSize: 18, fontFamily: 'Cairo-Bold', color: '#333', marginBottom: 15, textAlign: 'left' },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  optionButton: {
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginStart: 10,
    marginBottom: 10,
  },
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
    flexDirection: 'row',
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
    marginStart: 16,
  },
  addToCartButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Cairo-Bold',
  },
});
