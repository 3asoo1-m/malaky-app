// مسار   الملف: app/item/[itemId].tsx

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
import DynamicImage from '@/components/DynamicImage';
import { supabase } from '@/lib/supabase';
import { MenuItem } from '@/lib/types';
import { useCart } from '@/lib/useCart';

const { width: screenWidth } = Dimensions.get('window');

// ✅ أنواع القطع الإضافية
interface AdditionalPieceType {
  id: string;
  name_ar: string;
  price: number;
}

interface AddedPiece {
  type: string;
  quantity: number;
}

// ✅ مكون Pagination المتحسن
const Pagination = ({ data, scrollX, itemWidth }: { data: any[]; scrollX: Animated.Value; itemWidth: number }) => {
  return (
    <View style={styles.paginationContainer}>
      {data.map((_, idx) => {
        const inputRange = [(idx - 1) * itemWidth, idx * itemWidth, (idx + 1) * itemWidth];
        
        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [8, 20, 8],
          extrapolate: 'clamp',
        });

        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.3, 1, 0.3],
          extrapolate: 'clamp',
        });

        const backgroundColor = scrollX.interpolate({
          inputRange,
          outputRange: ['rgba(101, 1, 1, 0.5)', '#C62828', 'rgba(91, 0, 0, 0.5)'],
          extrapolate: 'clamp',
        });

        return (
          <Animated.View
            key={idx.toString()}
            style={[
              styles.dot,
              { 
                width: dotWidth,
                opacity,
                backgroundColor
              }
            ]}
          />
        );
      })}
    </View>
  );
};

export default function MenuItemDetailsScreen() {
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const router = useRouter();
  const { addToCart } = useCart();

  const [item, setItem] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, any>>({});
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [addedPieces, setAddedPieces] = useState<AddedPiece[]>([]);
  const [showAddPieceForm, setShowAddPieceForm] = useState(false);
  const [newPieceType, setNewPieceType] = useState('');
  const [newPieceQuantity, setNewPieceQuantity] = useState(1);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollX = useRef(new Animated.Value(0)).current;

  // ✅ تحديث: سحب أنواع القطع من قاعدة البيانات
  const [availablePieceTypes, setAvailablePieceTypes] = useState<AdditionalPieceType[]>([]);
  const [loadingPieces, setLoadingPieces] = useState(false);

  // ✅ جلب أنواع القطع الإضافية من قاعدة البيانات
  useEffect(() => {
    const fetchAdditionalPieces = async () => {
      setLoadingPieces(true);
      try {
        const { data, error } = await supabase
          .from('additional_piece_types')
          .select('*')
          .eq('is_active', true)
          .order('display_order');
        
        if (error) {
          console.error('Error fetching additional pieces:', error);
          // استخدام بيانات افتراضية في حالة الخطأ
          setAvailablePieceTypes([
            { id: 'thigh', name_ar: 'فخذه', price: 9.00,},
            { id: 'thigh2', name_ar: 'ورك', price: 9.00,},
            { id: 'wings', name_ar: 'جناح بروست', price: 9.00,},
            { id: 'breast', name_ar: 'سفينة', price: 12.00,},
            { id: 'crispy', name_ar: 'كرسبي', price: 5.00,},
            { id: 'crunchy', name_ar: 'كرنشي', price: 5.00,},
          ]);
        } else {
          setAvailablePieceTypes(data || []);
        }
      } catch (e) {
        console.error('Error in fetch additional pieces:', e);
      } finally {
        setLoadingPieces(false);
      }
    };

    fetchAdditionalPieces();
  }, []);

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
          console.error('Error fetching item:', error);
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
        console.error('Error in fetch:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchItemDetails();
  }, [itemId]);

  const handleOptionSelect = (optionId: string, value: string) => {
    setSelectedOptions(prev => ({ ...prev, [optionId]: value }));
  };

  const handleAddPiece = () => {
    if (!newPieceType) return;
    
    const pieceExists = addedPieces.find(piece => piece.type === newPieceType);
    if (pieceExists) {
      // إذا القطعة موجودة مسبقاً، نحدث الكمية فقط
      setAddedPieces(prev => 
        prev.map(piece => 
          piece.type === newPieceType 
            ? { ...piece, quantity: piece.quantity + newPieceQuantity }
            : piece
        )
      );
    } else {
      // إذا كانت جديدة، نضيفها للقائمة
      setAddedPieces(prev => [
        ...prev,
        { type: newPieceType, quantity: newPieceQuantity }
      ]);
    }
    
    // إعادة تعيين النموذج
    setNewPieceType('');
    setNewPieceQuantity(1);
    setShowAddPieceForm(false);
  };

  const handleRemovePiece = (pieceType: string) => {
    setAddedPieces(prev => prev.filter(piece => piece.type !== pieceType));
  };

  const handleUpdatePieceQuantity = (pieceType: string, newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemovePiece(pieceType);
      return;
    }
    
    setAddedPieces(prev => 
      prev.map(piece => 
        piece.type === pieceType 
          ? { ...piece, quantity: newQuantity }
          : piece
      )
    );
  };

  const totalPrice = useMemo(() => {
    if (!item) return 0;
    
    let singleItemPrice = item.price;
    
    // حساب سعر الخيارات الأساسية
    if (item.options) {
      Object.keys(selectedOptions).forEach(optionId => {
        const group = item.options?.find(g => g.id === optionId);
        const value = group?.values.find(v => v.value === selectedOptions[optionId]);
        if (value?.priceModifier) {
          singleItemPrice += value.priceModifier;
        }
      });
    }
    
    // حساب سعر القطع الإضافية
    let additionalPiecesPrice = 0;
    addedPieces.forEach(piece => {
      const pieceInfo = availablePieceTypes.find(p => p.id === piece.type);
      if (pieceInfo) {
        additionalPiecesPrice += pieceInfo.price * piece.quantity;
      }
    });
    
    return (singleItemPrice * quantity) + additionalPiecesPrice;
  }, [item, selectedOptions, quantity, addedPieces, availablePieceTypes]);

  const handleAddToCart = () => {
    if (!item) return;
    
    // تجهيز بيانات القطع الإضافية
    const additionalPiecesData = addedPieces.map(piece => {
      const pieceInfo = availablePieceTypes.find(p => p.id === piece.type);
      return {
        type: piece.type,
        name: pieceInfo?.name_ar || piece.type,
        quantity: piece.quantity,
        price: pieceInfo?.price || 0
      };
    });
    
    console.log('🛒 إضافة إلى السلة:', {
      item: item.name,
      quantity,
      additionalPieces: additionalPiecesData,
      totalPrice
    });

    addToCart(
      item, 
      quantity, 
      selectedOptions, 
      notes,
      additionalPiecesData
    );
    
    const piecesText = addedPieces.length > 0 
      ? ` مع ${addedPieces.reduce((sum, piece) => sum + piece.quantity, 0)} قطع إضافية` 
      : '';
    
    alert(`✅ ${item.name} أضيفت إلى السلة!${piecesText}`);
    router.back();
  };

  const defaultImageSource = require('@/assets/images/icon.png');
  const imagesToShow = item?.images && item.images.length > 0 
    ? item.images.map(img => ({ id: img.id, source: { uri: img.image_url } }))
    : [{ id: 0, source: defaultImageSource }];

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#E63946" />
        <Text style={{ marginTop: 10, color: '#666' }}>جاري تحميل بيانات المنتج...</Text>
      </View>
    );
  }

  if (!item) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={{ fontSize: 18, marginBottom: 10 }}>لم يتم العثور على المنتج.</Text>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
        >
          <Text style={{ color: '#C62828', fontSize: 16 }}>العودة</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar barStyle="dark-content" />
      <Stack.Screen options={{ headerShown: false }} />

      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
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
                <DynamicImage
                  source={img.source}
                  style={{ width: screenWidth, height: 300 }}
                />
              )}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                { useNativeDriver: false }
              )}
              scrollEventThrottle={16}
            />
            
            {imagesToShow.length > 1 && (
              <Pagination 
                data={imagesToShow} 
                scrollX={scrollX} 
                itemWidth={screenWidth} 
              />
            )}
          </View>

          {/* --- حاوية التفاصيل --- */}
          <View style={styles.detailsContainer}>
            <Text style={styles.title}>{item.name}</Text>

            {/* --- خيارات المنتج --- */}
            {Array.isArray(item.options) && item.options.length > 0 && item.options.map(group => {
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
                          <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <View style={styles.separator} />
                </View>
              );
            })}

            {/* --- القطع الإضافية --- */}
            <View style={styles.additionalPiecesSection}>
              <Text style={styles.sectionTitle}>قطع إضافية</Text>
              
              {/* عرض القطع المضافة */}
              {addedPieces.map((piece, index) => {
                const pieceInfo = availablePieceTypes.find(p => p.id === piece.type);
                return (
                  <View key={piece.type} style={styles.addedPieceItem}>
                    <View style={styles.pieceInfo}>
                      <Text style={styles.pieceName}>{pieceInfo?.name_ar || piece.type}</Text>
                      <Text style={styles.piecePrice}>
                        {pieceInfo ? `(${pieceInfo.price} ₪ للقطعة)` : ''}
                      </Text>
                    </View>
                    
                    <View style={styles.pieceControls}>
                      <TouchableOpacity 
                        onPress={() => handleUpdatePieceQuantity(piece.type, piece.quantity - 1)}
                        style={styles.pieceQuantityButton}
                      >
                        <Ionicons name="remove" size={16} color="#C62828" />
                      </TouchableOpacity>
                      
                      <Text style={styles.pieceQuantityText}>{piece.quantity}</Text>
                      
                      <TouchableOpacity 
                        onPress={() => handleUpdatePieceQuantity(piece.type, piece.quantity + 1)}
                        style={styles.pieceQuantityButton}
                      >
                        <Ionicons name="add" size={16} color="#C62828" />
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        onPress={() => handleRemovePiece(piece.type)}
                        style={styles.removePieceButton}
                      >
                        <Ionicons name="trash-outline" size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
              
              {/* زر إضافة قطعة جديدة */}
              {!showAddPieceForm ? (
                <TouchableOpacity 
                  style={styles.addPieceButton}
                  onPress={() => setShowAddPieceForm(true)}
                >
                  <Ionicons name="add-circle-outline" size={20} color="#1D3557" />
                  <Text style={styles.addPieceButtonText}>إضافة قطع إضافية</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.addPieceForm}>
                  <Text style={styles.formTitle}>اختر القطعة والكمية:</Text>
                  
                  <View style={styles.formRow}>
                    <View style={styles.pieceTypeContainer}>
                      <Text style={styles.formLabel}>نوع القطعة:</Text>
                      {loadingPieces ? (
                        <ActivityIndicator size="small" color="#C62828" style={{ marginVertical: 10 }} />
                      ) : (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                          <View style={styles.pieceTypesRow}>
                            {availablePieceTypes.map(piece => (
                              <TouchableOpacity
                                key={piece.id}
                                style={[
                                  styles.pieceTypeButton,
                                  newPieceType === piece.id && styles.pieceTypeSelected
                                ]}
                                onPress={() => setNewPieceType(piece.id)}
                              >
                                <Text style={[
                                  styles.pieceTypeText,
                                  newPieceType === piece.id && styles.pieceTypeTextSelected
                                ]}>
                                  {piece.name_ar}
                                </Text>
                                <Text style={styles.piecePriceText}>{piece.price} ₪</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </ScrollView>
                      )}
                    </View>
                  </View>
                  
                  <View style={styles.formRow}>
                    <Text style={styles.formLabel}>الكمية:</Text>
                    <View style={styles.quantityFormControls}>
                      <TouchableOpacity 
                        onPress={() => setNewPieceQuantity(q => Math.max(1, q - 1))}
                        style={styles.quantityFormButton}
                      >
                        <Ionicons name="remove" size={18} color="#C62828" />
                      </TouchableOpacity>
                      
                      <Text style={styles.quantityFormText}>{newPieceQuantity}</Text>
                      
                      <TouchableOpacity 
                        onPress={() => setNewPieceQuantity(q => q + 1)}
                        style={styles.quantityFormButton}
                      >
                        <Ionicons name="add" size={18} color="#C62828" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <View style={styles.formActions}>
                    <TouchableOpacity 
                      style={[styles.formActionButton, styles.cancelButton]}
                      onPress={() => {
                        setShowAddPieceForm(false);
                        setNewPieceType('');
                        setNewPieceQuantity(1);
                      }}
                    >
                      <Text style={styles.cancelButtonText}>إلغاء</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.formActionButton, styles.confirmButton, !newPieceType && styles.disabledButton]}
                      onPress={handleAddPiece}
                      disabled={!newPieceType}
                    >
                      <Text style={styles.confirmButtonText}>إضافة</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.separator} />
            
            <Text style={styles.sectionTitle}>ملاحظات خاصة</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="مثال: بدون بصل، زيادة كاتشاب..."
              style={styles.notesInput}
              multiline
              textAlign="right"
            />

            <View style={styles.separator} />

            <Text style={styles.sectionTitle}>الوصف</Text>
            <Text style={styles.description}>{item.description || 'لا يوجد وصف لهذه الوجبة.'}</Text>
          </View>
        </ScrollView>
      </Animated.View>

      <View style={styles.footer}>
        <View style={styles.quantitySelector}>
          <TouchableOpacity 
            onPress={() => setQuantity(q => Math.max(1, q - 1))} 
            style={styles.quantityButton}
          >
            <Ionicons name="remove" size={24} color="#C62828" />
          </TouchableOpacity>
          <Text style={styles.quantityText}>{quantity}</Text>
          <TouchableOpacity 
            onPress={() => setQuantity(q => q + 1)} 
            style={styles.quantityButton}
          >
            <Ionicons name="add" size={24} color="#C62828" />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={styles.addToCartButton} 
          onPress={handleAddToCart} 
          activeOpacity={0.8}
        >
          <Text style={styles.addToCartButtonText}>
            أضف للسلة | {totalPrice.toFixed(2)} ₪
          </Text>
          {addedPieces.length > 0 && (
            <Text style={styles.piecesCountText}>
              ({addedPieces.reduce((sum, piece) => sum + piece.quantity, 0)} قطع إضافية)
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// --- التنسيقات النهائية المحسنة ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 20 
  },
  scrollContent: { paddingBottom: 120 },
  carouselContainer: {
    backgroundColor: '#f0f0f0',
    height: 250,
    position: 'relative',
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
    backgroundColor: '#C62828',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  detailsContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    marginTop: -10,
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
  title: { 
    fontSize: 28, 
    fontFamily: 'Cairo-Bold', 
    color: '#1D3557', 
    marginBottom: 20, 
    textAlign: 'left' 
  },
  description: { 
    fontSize: 16, 
    fontFamily: 'Cairo-Regular', 
    lineHeight: 24, 
    color: '#444', 
    marginTop: 10, 
    textAlign: 'left' 
  },
  separator: { 
    height: 1, 
    backgroundColor: '#eee', 
    marginVertical: 20 
  },
  optionsSection: { marginTop: 10 },
  sectionTitle: { 
    fontSize: 18, 
    fontFamily: 'Cairo-Bold', 
    color: '#333', 
    marginBottom: 15, 
    textAlign: 'left' 
  },
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
  optionSelected: { 
    backgroundColor: '#1D3557', 
    borderColor: '#1D3557' 
  },
  optionText: { 
    fontSize: 16, 
    fontFamily: 'Cairo-Regular', 
    fontWeight: '600', 
    color: '#333' 
  },
  optionTextSelected: { 
    color: '#fff' 
  },
  notesInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 15,
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 16,
    textAlign: 'right',
    fontFamily: 'Cairo-Regular',
  },
  
  // ✅ تنسيقات القطع الإضافية
  additionalPiecesSection: {
    marginTop: 10,
  },
  addedPieceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  pieceInfo: {
    flex: 1,
  },
  pieceName: {
    fontSize: 16,
    fontFamily: 'Cairo-SemiBold',
    color: '#333',
  },
  piecePrice: {
    fontSize: 12,
    fontFamily: 'Cairo-Regular',
    color: '#666',
    marginTop: 2,
  },
  pieceControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pieceQuantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  pieceQuantityText: {
    fontSize: 16,
    fontFamily: 'Cairo-SemiBold',
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: 'center',
  },
  removePieceButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E53935',
    justifyContent: 'center',
    alignItems: 'center',
    marginStart: 8,
  },
  addPieceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F0F0',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  addPieceButtonText: {
    fontSize: 16,
    fontFamily: 'Cairo-SemiBold',
    color: '#1D3557',
    marginStart: 8,
  },
  addPieceForm: {
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  formTitle: {
    fontSize: 16,
    fontFamily: 'Cairo-Bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  formRow: {
    marginBottom: 15,
  },
  formLabel: {
    fontSize: 14,
    fontFamily: 'Cairo-SemiBold',
    color: '#555',
    marginBottom: 8,
  },
  pieceTypeContainer: {
    marginBottom: 10,
  },
  pieceTypesRow: {
    flexDirection: 'row',
  },
  pieceTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginEnd: 8,
    alignItems: 'center',
    minWidth: 80,
  },
  pieceTypeSelected: {
    backgroundColor: '#1D3557',
    borderColor: '#1D3557',
  },
  pieceTypeText: {
    fontSize: 14,
    fontFamily: 'Cairo-SemiBold',
    color: '#333',
  },
  pieceTypeTextSelected: {
    color: '#fff',
  },
  piecePriceText: {
    fontSize: 12,
    fontFamily: 'Cairo-Regular',
    color: '#666',
    marginTop: 2,
  },
  quantityFormControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityFormButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  quantityFormText: {
    fontSize: 18,
    fontFamily: 'Cairo-SemiBold',
    marginHorizontal: 20,
    minWidth: 30,
    textAlign: 'center',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  formActionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  confirmButton: {
    backgroundColor: '#1D3557',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: 'Cairo-SemiBold',
    color: '#666',
  },
  confirmButtonText: {
    fontSize: 14,
    fontFamily: 'Cairo-SemiBold',
    color: '#fff',
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
    fontFamily: 'Cairo-Bold',
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
  piecesCountText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontFamily: 'Cairo-Regular',
    marginTop: 2,
  },
});