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
  Modal,
} from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import DynamicImage from '@/components/DynamicImage';
import { supabase } from '@/lib/supabase';
import { MenuItem } from '@/lib/types';
import { useCart } from '@/lib/useCart';

const { width: screenWidth } = Dimensions.get('window');

// ✅ أنواع جديدة للقطع الفردية
interface IndividualPiece {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
}

// ✅ نوع للقطعة المختارة مع الكمية
interface SelectedPiece {
  piece: IndividualPiece;
  quantity: number;
}

// ✅ تصنيفات القطع
const CATEGORIES = [
  { id: 'all', name: 'الكل' },
  { id: 'chicken', name: 'دجاج' },
  { id: 'sauces', name: 'صلصات' },
  { id: 'cheese', name: 'جبن' },
  { id: 'fries', name: 'بطاطس' },
  { id: 'drinks', name: 'مشروبات' },
  { id: 'extras', name: 'إضافات' },
];

// ✅ بيانات تجريبية للقطع الفردية
const MOCK_INDIVIDUAL_PIECES: IndividualPiece[] = [
  {
    id: '1',
    name: 'قطعة دجاج',
    price: 8.00,
    category: 'chicken',
    description: 'قطعة دجاج طازجة ومقرمشة'
  },
  {
    id: '2',
    name: 'أجنحة دجاج',
    price: 10.00,
    category: 'chicken',
    description: 'أجنحة دجاج مقرمشة'
  },
  {
    id: '3',
    name: 'صوص باربكيو',
    price: 2.00,
    category: 'sauces',
    description: 'صوص باربكيو حار ولذيذ'
  },
  {
    id: '4',
    name: 'صوص ثوم',
    price: 2.00,
    category: 'sauces',
    description: 'صوص ثوم كريمي'
  },
  {
    id: '5',
    name: 'صوص حار',
    price: 2.00,
    category: 'sauces',
    description: 'صوص حار ومتبل'
  },
  {
    id: '6',
    name: 'جبنة شيدر',
    price: 3.00,
    category: 'cheese',
    description: 'جبنة شيدر ذائبة'
  },
  {
    id: '7',
    name: 'جبنة موزاريلا',
    price: 3.00,
    category: 'cheese',
    description: 'جبنة موزاريلا طازجة'
  },
  {
    id: '8',
    name: 'بطاطس صغيرة',
    price: 5.00,
    category: 'fries',
    description: 'حصة بطاطس مقرمشة'
  },
  {
    id: '9',
    name: 'بطاطس كبيرة',
    price: 8.00,
    category: 'fries',
    description: 'حصة كبيرة من البطاطس'
  },
  {
    id: '10',
    name: 'كولا',
    price: 6.00,
    category: 'drinks',
    description: 'مشروب غازي منعش'
  },
  {
    id: '11',
    name: 'عصير برتقال',
    price: 7.00,
    category: 'drinks',
    description: 'عصير برتقال طازج'
  },
  {
    id: '12',
    name: 'خس',
    price: 1.00,
    category: 'extras',
    description: 'خس طازج'
  },
  {
    id: '13',
    name: 'طماطم',
    price: 1.00,
    category: 'extras',
    description: 'شرائح طماطم'
  },
  {
    id: '14',
    name: 'بصل',
    price: 1.00,
    category: 'extras',
    description: 'حلقات بصل'
  },
];

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

// ✅ مكون منتقي القطع مع البحث والتصنيفات
const PieceSelectorModal = ({ 
  visible, 
  pieces, 
  onPieceSelect, 
  onClose 
}: { 
  visible: boolean;
  pieces: IndividualPiece[];
  onPieceSelect: (piece: IndividualPiece) => void;
  onClose: () => void;
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredPieces = useMemo(() => {
    let filtered = pieces;
    
    // ✅ فلترة حسب التصنيف
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(piece => piece.category === selectedCategory);
    }
    
    // ✅ فلترة حسب البحث
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(piece => 
        piece.name.toLowerCase().includes(query) ||
        piece.description?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [pieces, selectedCategory, searchQuery]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        {/* الهيدر */}
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>اختر القطعة المطلوبة</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {/* شريط البحث */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            placeholder="ابحث عن القطعة..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            textAlign="right"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        {/* التصنيفات */}
        <View style={styles.categoriesContainer}>
          <FlatList
            data={CATEGORIES}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.categoryButton,
                  selectedCategory === item.id && styles.categoryButtonSelected
                ]}
                onPress={() => setSelectedCategory(item.id)}
              >
                <Text style={[
                  styles.categoryText,
                  selectedCategory === item.id && styles.categoryTextSelected
                ]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.categoriesList}
          />
        </View>

        {/* قائمة القطع */}
        <FlatList
          data={filteredPieces}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.pieceOption}
              onPress={() => onPieceSelect(item)}
              activeOpacity={0.7}
            >
              <View style={styles.pieceOptionInfo}>
                <Text style={styles.pieceOptionName}>{item.name}</Text>
                {item.description && (
                  <Text style={styles.pieceOptionDescription}>{item.description}</Text>
                )}
                <Text style={styles.pieceOptionPrice}>+{item.price.toFixed(2)} ₪</Text>
              </View>
              <Ionicons name="add-circle" size={24} color="#007AFF" />
            </TouchableOpacity>
          )}
          style={styles.piecesList}
          contentContainerStyle={styles.piecesListContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>لا توجد قطع تطابق بحثك</Text>
            </View>
          }
        />
      </SafeAreaView>
    </Modal>
  );
};

// ✅ مكون القطعة المضافة
const AddedPieceItem = ({ 
  selectedPiece, 
  onQuantityChange,
  onRemove
}: { 
  selectedPiece: SelectedPiece;
  onQuantityChange: (pieceId: string, newQuantity: number) => void;
  onRemove: (pieceId: string) => void;
}) => {
  return (
    <View style={styles.addedPieceItem}>
      <View style={styles.addedPieceInfo}>
        <Text style={styles.addedPieceName}>{selectedPiece.piece.name}</Text>
        <Text style={styles.addedPiecePrice}>+{selectedPiece.piece.price.toFixed(2)} ₪</Text>
      </View>
      
      <View style={styles.addedPieceControls}>
        <View style={styles.quantityControls}>
          <TouchableOpacity 
            style={styles.quantityButtonSmall}
            onPress={() => onQuantityChange(selectedPiece.piece.id, Math.max(0, selectedPiece.quantity - 1))}
          >
            <Ionicons name="remove" size={16} color="#C62828" />
          </TouchableOpacity>
          
          <Text style={styles.quantityTextSmall}>{selectedPiece.quantity}</Text>
          
          <TouchableOpacity 
            style={styles.quantityButtonSmall}
            onPress={() => onQuantityChange(selectedPiece.piece.id, selectedPiece.quantity + 1)}
          >
            <Ionicons name="add" size={16} color="#C62828" />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={styles.removeButton}
          onPress={() => onRemove(selectedPiece.piece.id)}
        >
          <Ionicons name="trash-outline" size={18} color="#FF3B30" />
        </TouchableOpacity>
      </View>
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
  const [individualPieces, setIndividualPieces] = useState<IndividualPiece[]>([]);
  const [selectedPieces, setSelectedPieces] = useState<SelectedPiece[]>([]);
  const [showPieceModal, setShowPieceModal] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const scrollX = useRef(new Animated.Value(0)).current;

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

          setIndividualPieces(MOCK_INDIVIDUAL_PIECES);
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

  const handleAddPiece = (piece: IndividualPiece) => {
    const existingPiece = selectedPieces.find(sp => sp.piece.id === piece.id);
    
    if (existingPiece) {
      setSelectedPieces(prev => 
        prev.map(sp => 
          sp.piece.id === piece.id 
            ? { ...sp, quantity: sp.quantity + 1 }
            : sp
        )
      );
    } else {
      setSelectedPieces(prev => [...prev, { piece, quantity: 1 }]);
    }
    
    setShowPieceModal(false);
  };

  const handlePieceQuantityChange = (pieceId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      setSelectedPieces(prev => prev.filter(sp => sp.piece.id !== pieceId));
    } else {
      setSelectedPieces(prev => 
        prev.map(sp => 
          sp.piece.id === pieceId 
            ? { ...sp, quantity: newQuantity }
            : sp
        )
      );
    }
  };

  const handleRemovePiece = (pieceId: string) => {
    setSelectedPieces(prev => prev.filter(sp => sp.piece.id !== pieceId));
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
    
    const piecesTotal = selectedPieces.reduce((total, selectedPiece) => {
      return total + (selectedPiece.piece.price * selectedPiece.quantity);
    }, 0);

    return (singleItemPrice + piecesTotal) * quantity;
  }, [item, selectedOptions, quantity, selectedPieces]);

  const handleAddToCart = () => {
    if (!item) return;
    
    console.log('🛒 إضافة إلى السلة:', {
      item: item.name,
      quantity,
      selectedPieces: selectedPieces.map(sp => ({
        name: sp.piece.name,
        quantity: sp.quantity,
        price: sp.piece.price
      })),
      totalPrice
    });

    addToCart(item, quantity, selectedOptions, notes);
    
    const piecesText = selectedPieces.length > 0 
      ? ` مع ${selectedPieces.reduce((sum, sp) => sum + sp.quantity, 0)} قطع إضافية` 
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

            {/* ✅ قسم إضافة القطع الخارجية */}
            <View style={styles.piecesSection}>
              <Text style={styles.sectionTitle}>إضافة قطع خارجية</Text>
              <Text style={styles.sectionSubtitle}>
                يمكنك إضافة قطع إضافية للوجبة كما تريد
              </Text>
              
              {/* ✅ القطع المضافة */}
              {selectedPieces.length > 0 && (
                <View style={styles.addedPiecesList}>
                  {selectedPieces.map(selectedPiece => (
                    <AddedPieceItem
                      key={selectedPiece.piece.id}
                      selectedPiece={selectedPiece}
                      onQuantityChange={handlePieceQuantityChange}
                      onRemove={handleRemovePiece}
                    />
                  ))}
                </View>
              )}

              {/* ✅ زر إضافة قطعة جديدة */}
              <TouchableOpacity
                style={styles.addPieceButton}
                onPress={() => setShowPieceModal(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
                <Text style={styles.addPieceButtonText}>إضافة قطعة أخرى</Text>
              </TouchableOpacity>

              <View style={styles.separator} />
            </View>

            {/* --- باقي المحتوى --- */}
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

            <Text style={styles.sectionTitle}>ملاحظات</Text>
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

      {/* ✅ Modal منتقي القطع */}
      <PieceSelectorModal
        visible={showPieceModal}
        pieces={individualPieces}
        onPieceSelect={handleAddPiece}
        onClose={() => setShowPieceModal(false)}
      />

      {/* --- الفوتر مع السعر والكمية --- */}
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
          {selectedPieces.length > 0 && (
            <Text style={styles.piecesCountText}>
              ({selectedPieces.reduce((sum, sp) => sum + sp.quantity, 0)} قطع إضافية)
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
  
  // ✅ تنسيقات قسم القطع الفردية
  piecesSection: {
    marginBottom: 10,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    textAlign: 'left',
    fontFamily: 'Cairo-Regular',
  },
  
  // ✅ زر إضافة قطعة
  addPieceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    marginBottom: 10,
  },
  addPieceButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontFamily: 'Cairo-SemiBold',
    marginStart: 8,
  },
  
  // ✅ Modal منتقي القطع
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Cairo-Bold',
    color: '#1D3557',
  },
  closeButton: {
    padding: 4,
  },
  
  // ✅ شريط البحث
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    margin: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginHorizontal: 8,
    fontFamily: 'Cairo-Regular',
  },
  
  // ✅ التصنيفات
  categoriesContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoriesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginHorizontal: 4,
  },
  categoryButtonSelected: {
    backgroundColor: '#007AFF',
  },
  categoryText: {
    fontSize: 14,
    fontFamily: 'Cairo-SemiBold',
    color: '#666',
  },
  categoryTextSelected: {
    color: '#fff',
  },
  
  // ✅ قائمة القطع في الـ Modal
  piecesList: {
    flex: 1,
  },
  piecesListContent: {
    padding: 16,
  },
  pieceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    marginBottom: 8,
  },
  pieceOptionInfo: {
    flex: 1,
  },
  pieceOptionName: {
    fontSize: 16,
    fontFamily: 'Cairo-SemiBold',
    color: '#1D3557',
    marginBottom: 4,
  },
  pieceOptionDescription: {
    fontSize: 14,
    fontFamily: 'Cairo-Regular',
    color: '#666',
    marginBottom: 4,
  },
  pieceOptionPrice: {
    fontSize: 15,
    fontFamily: 'Cairo-Bold',
    color: '#C62828',
  },
  
  // ✅ حالة عدم وجود نتائج
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Cairo-Regular',
    marginTop: 12,
  },
  
  // ✅ القطع المضافة
  addedPiecesList: {
    gap: 10,
    marginBottom: 15,
  },
  addedPieceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#E7F3FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  addedPieceInfo: {
    flex: 1,
  },
  addedPieceName: {
    fontSize: 15,
    fontFamily: 'Cairo-SemiBold',
    color: '#1D3557',
    marginBottom: 2,
  },
  addedPiecePrice: {
    fontSize: 14,
    fontFamily: 'Cairo-Bold',
    color: '#C62828',
  },
  addedPieceControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 4,
  },
  quantityButtonSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityTextSmall: {
    fontSize: 14,
    fontWeight: 'bold',
    marginHorizontal: 12,
    fontFamily: 'Cairo-Bold',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // تنسيقات الخيارات الأساسية
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