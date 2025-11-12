import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { MenuItem } from '@/lib/types';
import { Colors } from '@/styles';
import { Heart, Plus, Minus, ShoppingCart } from 'lucide-react-native';

const MealCard = ({ meal }: { meal: MenuItem }) => {
    const [isFavorite, setIsFavorite] = useState(false);
    const [quantity, setQuantity] = useState(0);

    const imageUrl = meal.images?.[0]?.image_url || 'https://via.placeholder.com/150';

    return (
        <View style={styles.card}>
            <View>
                <Image source={{ uri: imageUrl }} style={styles.image} />
                {meal.is_popular && (
                    <View style={[styles.badge, { backgroundColor: Colors.primary }]}>
                        <Text style={styles.badgeText}>الأكثر طلباً</Text>
                    </View>
                 )}
                <TouchableOpacity style={styles.favoriteButton} onPress={() => setIsFavorite(!isFavorite)}>
                    <Heart size={18} color={isFavorite ? Colors.primary : '#333'} fill={isFavorite ? Colors.primary : 'transparent'} />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <Text style={styles.name} numberOfLines={1}>{meal.name}</Text>
                <Text style={styles.description} numberOfLines={1}>{meal.description}</Text>

                <View style={styles.footer}>
                    <View>
                        <Text style={styles.price}>{meal.price.toFixed(2)} ريال</Text>
                    </View>

                    {quantity > 0 ? (
                        <View style={styles.quantityContainer}>
                            <TouchableOpacity onPress={() => setQuantity(q => q + 1)} style={[styles.quantityButton, { backgroundColor: Colors.primary }]}>
                                <Plus size={14} color="white" />
                            </TouchableOpacity>
                            <Text style={styles.quantityText}>{quantity}</Text>
                            <TouchableOpacity onPress={() => setQuantity(q => Math.max(0, q - 1))} style={[styles.quantityButton, { backgroundColor: '#E5E7EB' }]}>
                                <Minus size={14} color="#374151" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.addButton} onPress={() => setQuantity(1)}>
                            <ShoppingCart size={18} color="white" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: { width: '48%', backgroundColor: 'white', borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, overflow: 'hidden' },
    image: { width: '100%', height: 140, resizeMode: 'cover' },
    badge: { position: 'absolute', top: 8, left: 8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    badgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
    favoriteButton: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(255,255,255,0.8)', padding: 6, borderRadius: 99 },
    content: { padding: 12 },
    name: { fontSize: 16, fontWeight: '600', color: Colors.text, textAlign: 'right' },
    description: { fontSize: 12, color: Colors.textSecondary, textAlign: 'right', marginTop: 4 },
    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
    price: { fontSize: 16, fontWeight: 'bold', color: Colors.primary },
    addButton: { backgroundColor: Colors.primary, padding: 8, borderRadius: 99 },
    quantityContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 99 },
    quantityButton: { padding: 6, borderRadius: 99 },
    quantityText: { marginHorizontal: 12, fontSize: 16, fontWeight: '600' },
});

export default MealCard;
