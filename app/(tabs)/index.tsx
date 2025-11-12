// app/(tabs)/index.tsx

import React, { useRef, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, FlatList, SafeAreaView, ColorValue } from 'react-native'; // ✅ 1. استيراد ColorValue
import { useMenuData, usePromotions } from '@/lib/api/queries';
import { Stack, useRouter } from 'expo-router';
import { Colors } from '@/styles';
import { useQueryClient } from '@tanstack/react-query';
import CustomBottomNav from '@/components/CustomBottomNav';
// --- Components ---
import Header from '@/components/home/Header';
import PromotionsCarousel from '@/components/home/PromotionsCarousel';
import FeaturedDeals from '@/components/home/FeaturedDeals';
import CategoryList from '@/components/home/CategoryList';
import MealCard from '@/components/home/MealCard';
import FloatingCartButton from '@/components/home/FloatingCartButton';
import ScrollToTopButton from '@/components/home/ScrollToTopButton';

// ✅ 2. تعريف الواجهة محليًا أو استيرادها
interface Deal {
  id: number;
  title: string;
  subtitle: string;
  price: string;
  savings: string;
  image: any;
  gradient: readonly [ColorValue, ColorValue, ...ColorValue[]];
}

// --- Mock Data (to be replaced by API data) ---
// ✅ 3. تطبيق النوع على المتغير
const featuredDealsMock: Deal[] = [
    { id: 1, title: "وجبة + مشروب مجاني", subtitle: "عند طلب أي وجبة عائلية", price: "75", savings: "وفر 15 ريال", image: require('@/assets/images/icon.png'), gradient: ['#EF4444', '#F97316'] },
    { id: 2, title: "عرض منتصف الأسبوع", subtitle: "خصم 25% على جميع الوجبات", price: "من 18", savings: "عروض حصرية", image: require('@/assets/images/icon.png'), gradient: ['#8B5CF6', '#EC4899'] },
];

export default function HomeScreen() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const scrollViewRef = useRef<ScrollView>(null);

    // ... باقي الكود يبقى كما هو

    // --- State Management ---
    const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // --- Data Fetching ---
    const { data: menuData, isLoading: isLoadingMenu, error: menuError } = useMenuData();
    const { data: promotions, isLoading: isLoadingPromotions, error: promotionsError } = usePromotions();

    // --- Handlers ---
    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await queryClient.invalidateQueries({ queryKey: ['menu'] });
        await queryClient.invalidateQueries({ queryKey: ['promotions'] });
        setRefreshing(false);
    }, [queryClient]);

    const handleScroll = (event: any) => {
        setShowScrollTop(event.nativeEvent.contentOffset.y > 400);
    };

    const scrollToTop = () => {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    };

    // --- Render Logic ---
    if (isLoadingMenu || isLoadingPromotions) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={{ marginTop: 10, color: Colors.text }}>جاري تحميل البيانات...</Text>
            </View>
        );
    }

    if (menuError || promotionsError) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                <Text style={{ color: 'red', textAlign: 'center' }}>حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى.</Text>
            </View>
        );
    }

    const categories = menuData?.map(cat => ({ id: cat.id, name: cat.name })) || [];
    const meals = selectedCategory === 'all'
        ? menuData?.flatMap(cat => cat.menu_items || [])
        : menuData?.find(cat => cat.id === selectedCategory)?.menu_items || [];

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
            <Stack.Screen options={{ headerShown: false }} />
            <Header />
            <ScrollView
                ref={scrollViewRef}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
            >
                <PromotionsCarousel promotions={promotions || []} />
                {/* الآن featuredDealsMock متوافق تمامًا */}
                <FeaturedDeals deals={featuredDealsMock} />
                <CategoryList
                    categories={categories}
                    selectedCategory={selectedCategory}
                    onSelectCategory={setSelectedCategory}
                />

                <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: Colors.text, textAlign: 'right', marginBottom: 16 }}>
                        {selectedCategory === 'all' ? 'كل الوجبات' : categories.find(c => c.id === selectedCategory)?.name}
                    </Text>
                    <FlatList
                        data={meals}
                        renderItem={({ item }) => <MealCard meal={item} />}
                        keyExtractor={(item) => item.id.toString()}
                        numColumns={2}
                        columnWrapperStyle={{ justifyContent: 'space-between' }}
                        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
                        scrollEnabled={false} // Important for nested lists
                    />
                </View>
            </ScrollView>

            <FloatingCartButton />
            {showScrollTop && <ScrollToTopButton onPress={scrollToTop} />}
                  <CustomBottomNav />
        </SafeAreaView>
    );
}
