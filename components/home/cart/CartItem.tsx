import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CartItem } from '@/lib/types';

interface CartItemProps {
  item: CartItem;
  onUpdate: (itemId: string, change: 1 | -1) => void;
  onRemove: (itemId: string) => void;
  onPress: (item: CartItem) => void;
}

const AdditionalPieces: React.FC<{ pieces: any[] }> = ({ pieces }) => (
  <View style={styles.additionalPiecesContainer}>
    <View style={styles.additionalPiecesHeader}>
      <Text style={styles.additionalPiecesTitle}>قطع إضافية ✨</Text>
    </View>
    <View>
      {pieces.map((piece, index) => (
        <View key={index} style={styles.pieceRow}>
          <Text style={styles.additionalPieceText} numberOfLines={1}>
            {piece.quantity} x {piece.name}
          </Text>
          <Text style={styles.additionalPiecePrice}>
            +{(piece.price * piece.quantity).toFixed(2)} ₪
          </Text>
        </View>
      ))}
    </View>
  </View>
);

const QuantitySelector: React.FC<{
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
}> = ({ quantity, onIncrease, onDecrease }) => (
  <View style={styles.quantitySelector}>
    <TouchableOpacity 
      onPress={onIncrease} 
      style={[styles.quantityButton, styles.quantityButtonPlus]}
    >
      <Ionicons name="add" size={16} color="#fff" />
    </TouchableOpacity>
    <Text style={styles.quantityText}>{quantity}</Text>
    <TouchableOpacity 
      onPress={onDecrease} 
      style={styles.quantityButton}
      disabled={quantity === 1}
    >
      <Ionicons name="remove" size={16} color={quantity === 1 ? '#9ca3af' : '#C62828'} />
    </TouchableOpacity>
  </View>
);

export const CartItemComponent: React.FC<CartItemProps> = React.memo(({
  item,
  onUpdate,
  onRemove,
  onPress,
}) => {
  const optionLabels = Object.entries(item.options).map(([groupId, value]) => {
    const group = item.product.options?.find(g => g.id === groupId);
    const optionValue = group?.values.find(v => v.value === value);
    return optionValue ? optionValue.label : null;
  }).filter(Boolean).join('، ');

  const imageUrl = item.product.images && item.product.images.length > 0
    ? item.product.images[0].image_url
    : 'https://dgplcadvneqpohxqlilg.supabase.co/storage/v1/object/public/menu_image/icon.png';

  return (
    <View style={styles.cartItemContainer}>
      <TouchableOpacity onPress={() => onRemove(item.id)} style={styles.deleteButton}>
        <Ionicons name="trash-outline" size={20} color="#C62828" />
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => onPress(item)}> 
        <Image source={{ uri: imageUrl }} style={styles.itemImage} />
      </TouchableOpacity>
      
      <View style={styles.itemDetails}>
        <TouchableOpacity onPress={() => onPress(item)}> 
          <Text style={styles.itemName}>{item.product.name}</Text>
        </TouchableOpacity>
        
        {optionLabels.length > 0 && (
          <View style={styles.optionsContainer}>
            {optionLabels.split('، ').map((option, index) => (
              <View key={index} style={styles.optionBadge}>
                <Text style={styles.optionText}>{option}</Text>
              </View>
            ))}
          </View>
        )}
        
        {item.additionalPieces && item.additionalPieces.length > 0 && (
          <AdditionalPieces pieces={item.additionalPieces} />
        )}
        
        {item.notes && (
          <Text style={styles.notesText}>ملاحظات: {item.notes}</Text>
        )}
      </View>
      
      <View style={styles.itemActions}>
        <QuantitySelector 
          quantity={item.quantity}
          onIncrease={() => onUpdate(item.id, 1)}
          onDecrease={() => onUpdate(item.id, -1)}
        />
        <Text style={styles.itemPriceText}>{(item.totalPrice).toFixed(2)} ₪</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  cartItemContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  deleteButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: '#f3f4f6',
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  itemName: {
    fontSize: 15,
    fontFamily: 'Cairo-Bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    gap: 4,
  },
  optionBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
  },
  optionText: {
    fontSize: 12,
    fontFamily: 'Cairo-Regular',
    color: '#6b7280',
  },
  additionalPiecesContainer: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    padding: 12,
    marginTop: 12,
    alignSelf: 'stretch',
  },
  additionalPiecesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  additionalPiecesTitle: {
    fontSize: 12,
    fontFamily: 'Cairo-SemiBold',
    color: '#854d0e',
    marginLeft: 4,
  },
  pieceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  additionalPieceText: {
    marginLeft: 8,
    fontSize: 12,
    textAlign: 'left',
    fontFamily: 'Cairo-Regular',
    color: '#854d0e',
  },
  additionalPiecePrice: {
    fontSize: 12,
    fontFamily: 'Cairo-SemiBold',
    color: '#22c55e',
  },
  notesText: {
    fontSize: 12,
    fontFamily: 'Cairo-Regular',
    color: '#6b7280',
    fontStyle: 'italic',
  },
  itemActions: {
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    paddingRight: 8,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 6,
    paddingVertical: 4,
    alignSelf: 'center',
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonPlus: {
    backgroundColor: '#C62828',
  },
  quantityText: {
    fontSize: 14,
    fontFamily: 'Cairo-Bold',
    color: '#1f2937',
    marginHorizontal: 10,
  },
  itemPriceText: {
    fontSize: 15,
    fontFamily: 'Cairo-Bold',
    color: '#C62828',
    marginTop: 8,
    textAlign: 'center',
  },
});