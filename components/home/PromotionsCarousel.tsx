import React from 'react';
import { View, Text, Image, Dimensions } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { Promotion } from '@/lib/types';
import { LinearGradient } from 'expo-linear-gradient';
import { Gift, Percent, Sparkles, TrendingUp } from 'lucide-react-native';

const width = Dimensions.get('window').width;

const iconMap = {
    Percent: Percent,
    Gift: Gift,
    Sparkles: Sparkles,
    TrendingUp: TrendingUp,
};

const PromotionsCarousel = ({ promotions }: { promotions: Promotion[] }) => {
    if (!promotions || promotions.length === 0) return null;

    const renderItem = ({ item }: { item: Promotion }) => {
        // A simple way to map a string to a component
        const IconComponent = iconMap[item.action_value as keyof typeof iconMap] || Percent;

        return (
            <View style={{ padding: 8 }}>
                <LinearGradient
                    colors={['#EF4444', '#F97316']} // Example gradient
                    style={{ borderRadius: 24, padding: 20, height: 150, justifyContent: 'center' }}
                >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View>
                            <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold', textAlign: 'right' }}>{item.title}</Text>
                            <Text style={{ color: 'white', opacity: 0.9, marginTop: 4, textAlign: 'right' }}>{item.description}</Text>
                        </View>
                        <IconComponent color="white" size={48} style={{ opacity: 0.3 }} />
                    </View>
                </LinearGradient>
            </View>
        );
    };

    return (
        <View style={{ height: 180, marginTop: 16 }}>
            <Carousel
                loop
                width={width}
                height={180}
                autoPlay={true}
                data={promotions}
                scrollAnimationDuration={1000}
                renderItem={renderItem}
                style={{ direction: 'rtl' }}
            />
        </View>
    );
};

export default PromotionsCarousel;
