// app/(tabs)/index.tsx

import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, FlatList, SafeAreaView, StyleSheet, ColorValue } from 'react-native';
import { useMenuData, usePromotions } from '@/lib/api/queries';
import { Stack } from 'expo-router';
import { Colors } from '@/styles';

import { useQueryClient } from '@tanstack/react-query';
//import Voice, { SpeechResultsEvent } from '@react-native-voice/voice';

// --- Components ---
import Header from '@/components/home/Header';
import PromotionsCarousel from '@/components/home/PromotionsCarousel';
import FeaturedDeals from '@/components/home/FeaturedDeals';
import CategoryChips from '@/components/home/CategoryChips';
import MealCard from '@/components/home/MealCard';
import FloatingCartButton from '@/components/home/FloatingCartButton';
import ScrollToTopButton from '@/components/home/ScrollToTopButton';
import CustomBottomNav from '@/components/CustomBottomNav';

// --- واجهة وأنواع البيانات ---
interface Deal {
  id: number;
  title: string;
  subtitle: string;
  price: string;
  savings: string;
  image: any;
  gradient: readonly [ColorValue, ColorValue, ...ColorValue[]];
}

const featuredDealsMock: Deal[] = [
    { id: 1, title: "وجبة + مشروب مجاني", subtitle: "عند طلب أي وجبة عائلية", price: "75", savings: "وفر 15 ₪", image: require('../../assets/images/icon.png'), gradient: ['#EF4444', '#F97316'] },
    { id: 2, title: "عرض منتصف الأسبوع", subtitle: "خصم 25% على جميع الوجبات", price: "من 18", savings: "عروض حصرية", image: require('../../assets/images/icon.png'), gradient: ['#8B5CF6', '#EC4899'] },
];

export default function HomeScreen() {
    const flatListRef = useRef<FlatList>(null);
    const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    //const [isVoiceSearching, setIsVoiceSearching] = useState(false);

    // --- Data Fetching ---
    const { 
        data: menuData, 
        isLoading: isLoadingMenu, 
        error: menuError,
        refetch: refetchMenu 
    } = useMenuData();
    
    const { 
        data: promotions, 
        isLoading: isLoadingPromotions, 
        error: promotionsError,
        refetch: refetchPromotions 
    } = usePromotions();

    // --- Voice Search Logic ---
    /*
    useEffect(() => {
        const onSpeechResults = (e: SpeechResultsEvent) => {
            if (e.value && e.value.length > 0) setSearchQuery(e.value[0]);
            setIsVoiceSearching(false);
        };
        const onSpeechError = (e: any) => {
            console.error('Voice search error:', e);
            setIsVoiceSearching(false);
        };
        const onSpeechEnd = () => setIsVoiceSearching(false);

        Voice.onSpeechResults = onSpeechResults;
        Voice.onSpeechError = onSpeechError;
        Voice.onSpeechEnd = onSpeechEnd;

        return () => { Voice.destroy().then(Voice.removeAllListeners); };
    }, []);

    const startVoiceSearch = async () => {
        try {
           // await Voice.requestSpeechRecognitionPermission();
            setSearchQuery('');
            setIsVoiceSearching(true);
            await Voice.start('ar-SA');
        } catch (e) {
            console.error('Failed to start voice search', e);
            setIsVoiceSearching(false);
        }
    };

    const stopVoiceSearch = async () => {
        try { await Voice.stop(); } catch (e) { console.error('Failed to stop voice search', e); }
        finally { setIsVoiceSearching(false); }
    };
    */

    // ✅ فلترة البيانات بناءً على البحث والفئة المختارة
    const filteredMeals = useMemo(() => {
        const allMeals = menuData?.flatMap(cat => cat.menu_items || []) || [];
        
        // الفلترة حسب الفئة أولاً
        const mealsByCategory = selectedCategory === 'all'
            ? allMeals
            : menuData?.find(cat => cat.id === selectedCategory)?.menu_items || [];

        // ثم الفلترة حسب نص البحث
        if (!searchQuery.trim()) {
            return mealsByCategory;
        }
        
        return mealsByCategory.filter(meal =>
            meal.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            meal.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [menuData, selectedCategory, searchQuery]);

    // --- Handlers ---
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await Promise.all([refetchMenu(), refetchPromotions()]);
        } catch (error) {
            console.error('Error refreshing:', error);
        } finally {
            setRefreshing(false);
        }
    }, [refetchMenu, refetchPromotions]);

    const handleScroll = (event: any) => {
        setShowScrollTop(event.nativeEvent.contentOffset.y > 400);
    };

    const scrollToTop = () => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
    };

    const handleClearSearch = () => {
        setSearchQuery('');
    };

    const categories = menuData?.map(cat => ({ id: cat.id, name: cat.name })) || [];
    
    const sectionsWithItems = useMemo(() => {
        return menuData?.filter(cat => cat.menu_items && cat.menu_items.length > 0).map(cat => cat.id) || [];
    }, [menuData]);


    // --- Render Logic ---
    if (isLoadingMenu || isLoadingPromotions) {
        return (
            <SafeAreaView style={styles.centerContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>جاري تحميل البيانات...</Text>
            </SafeAreaView>
        );
    }

    if (menuError || promotionsError) {
        return (
            <SafeAreaView style={styles.centerContainer}>
                <Text style={styles.errorText}>حدث خطأ في تحميل البيانات</Text>
            </SafeAreaView>
        );
    }


    const listData = [
        { type: 'header', id: 'header-section' },      // ✅ استخدام id فريد
        { type: 'categories', id: 'categories' },  // العنصر 1: قائمة الفئات (سيصبح لاصقًا)
        { type: 'meals', id: 'meals' }        // العنصر 2: شبكة الوجبات
    ];

    // ✅ دالة العرض الرئيسية
    const renderItem = ({ item }: { item: { type: string; id: string } }) => {
        switch (item.type) {
            case 'header':
                return searchQuery.trim() === '' ? (
                    <View>
                        <PromotionsCarousel promotions={promotions || []} />
                        <FeaturedDeals deals={featuredDealsMock} />
                    </View>
                ) : (
                    <View style={styles.resultsHeader}>
                        <Text style={styles.resultsText}>
                            تم العثور على {filteredMeals.length} نتيجة لبحثك
                        </Text>
                    </View>
                );
            case 'categories':
                return (
                    <View style={styles.categoriesContainer}>
                        <CategoryChips
                            categories={categories}
                            activeCategory={selectedCategory}
                            onCategorySelect={setSelectedCategory}
                            loading={isLoadingMenu}
                            sectionsWithItems={sectionsWithItems}
                        />
                    </View>
                );
            case 'meals':
                return (
                    <View style={styles.listContainer}>
                        <FlatList
                            data={filteredMeals}
                            renderItem={({ item: mealItem }) => <MealCard meal={mealItem} />}
                            keyExtractor={(mealItem) => mealItem.id.toString()}
                            numColumns={2}
                            columnWrapperStyle={styles.columnWrapper}
                            ItemSeparatorComponent={() => <View style={styles.separator} />}
                            scrollEnabled={false}
                            ListEmptyComponent={() => (
                                <View style={styles.emptyResults}>
                                    <Text style={styles.emptyResultsText}>
                                        {searchQuery.trim() ? 'لا توجد وجبات تطابق بحثك.' : 'لا توجد وجبات متاحة.'}
                                    </Text>
                                </View>
                            )}
                        />
                    </View>
                );
            default:
                return null;
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <Stack.Screen options={{ headerShown: false }} />
            
            <Header
                searchQuery={searchQuery}
                setSearchQuery={handleSearch}
                onClearSearch={handleClearSearch}
                //onVoiceSearch={() => setIsVoiceSearching(true)}
                //isVoiceSearching={isVoiceSearching}
            />
            
            {/* ✅ استخدام FlatList مع الإعدادات الصحيحة */}
            <FlatList
                ref={flatListRef}
                data={listData}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                stickyHeaderIndices={[1]} // استهداف العنصر 'categories'
                showsVerticalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[Colors.primary]}
                        tintColor={Colors.primary}
                    />
                }
                contentContainerStyle={styles.contentContainer}
            />

            {showScrollTop && <ScrollToTopButton onPress={scrollToTop} />}
            <FloatingCartButton />
            <CustomBottomNav />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { 
        flex: 1, 
        backgroundColor: '#FFF' 
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFF',
        
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: Colors.textSecondary,
    },
    errorText: {
        fontSize: 16,
        color: Colors.error,
        textAlign: 'center',
    },
    contentContainer: {
        flexGrow: 1,
        paddingBottom: 80,

    },
    resultsHeader: {
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 10,
        backgroundColor: '#FFF',
    },
    resultsText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.textSecondary,
        textAlign: 'left',
    },
    categoriesContainer: {
        backgroundColor: '#FFF',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    listContainer: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    separator: {
        height: 16,
    },
    emptyResults: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    emptyResultsText: {
        fontSize: 16,
        color: Colors.textSecondary,
        textAlign: 'center',
    },
});