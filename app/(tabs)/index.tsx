import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, FlatList, SafeAreaView, StyleSheet, ColorValue, Alert } from 'react-native';
import { useMenuData, usePromotions, useMenuTotalCount } from '@/lib/api/queries';
import { Stack } from 'expo-router';
import { Colors } from '@/styles';
import { useIsFocused } from '@react-navigation/native';

import { useQueryClient } from '@tanstack/react-query';
import * as Speech from 'expo-speech';

// --- Components ---
import Header from '@/components/home/Header';
import PromotionsCarousel from '@/components/home/PromotionsCarousel';
import FeaturedDeals from '@/components/home/FeaturedDeals';
import CategoryChips from '@/components/home/CategoryChips';
import MealCard from '@/components/home/MealCard';
import FloatingCartButton from '@/components/home/FloatingCartButton';
import ScrollToTopButton from '@/components/home/ScrollToTopButton';
import CustomBottomNav from '@/components/CustomBottomNav';
import { Category, MenuItem } from '@/lib/types';

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

// ✅ تعريف الأنواع المساعدة
interface CategoryWithItems extends Category {
  menu_items?: MenuItem[];
}

interface CategoryChip {
  id: number;
  name: string;
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
    const [isVoiceSearching, setIsVoiceSearching] = useState(false);
    const isFocused = useIsFocused(); // ✅ الخطوة 1: استدعاء الـ hook
    const queryClient = useQueryClient(); // ✅ الخطوة 1: احصل على الـ client

    // ✅ STATE جديد: تتبع أول تحميل
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    // ✅ STATE للـ Pagination
    const [limit] = useState(10); // 10 وجبات لكل صفحة
    const [offset, setOffset] = useState(0); // الإزاحة الحالية
    const [hasMore, setHasMore] = useState(true); // هل يوجد المزيد من البيانات؟
    const [loadingMore, setLoadingMore] = useState(false); // تحميل المزيد


    useEffect(() => {
        // هذا الكود سيتم تشغيله في كل مرة تتغير فيها isFocused
        
        if (!isFocused) {
            // ✅ إذا لم تعد الشاشة في الواجهة
            console.log('🚫 [CLEANUP] الشاشة ليست في الواجهة، جاري إلغاء الاستعلامات النشطة...');
            
            // قم بإلغاء أي استعلامات نشطة مرتبطة بمفتاح 'menu'
            queryClient.cancelQueries({ queryKey: ['menu'] });
            
            console.log('✅ [CLEANUP] تم إلغاء الاستعلامات بنجاح.');
        }
    }, [isFocused, queryClient]);
    
    // --- Data Fetching مع Pagination حقيقي ---
    const { 
        data: menuData, 
        isLoading: isLoadingMenu, 
        error: menuError,
        refetch: refetchMenu 
    } = useMenuData(limit, offset);
    
    const { 
        data: totalCount 
    } = useMenuTotalCount();
    
    const { 
        data: promotions, 
        isLoading: isLoadingPromotions, 
        error: promotionsError,
        refetch: refetchPromotions 
    } = usePromotions();

    // ✅ حساب إذا في المزيد من البيانات
    useEffect(() => {
        if (totalCount && menuData) {
            const currentItemCount = menuData.flatMap((cat: CategoryWithItems) => cat.menu_items || []).length;
            const hasMoreData = currentItemCount < totalCount;
            setHasMore(hasMoreData);
            
            if (!hasMoreData && currentItemCount > 0) {
                console.log(`🏁 وصلت لنهاية البيانات ${currentItemCount}/${totalCount}`);
            }
        }
    }, [menuData, totalCount]);

    // ✅ تحميل المزيد من البيانات
    const loadMoreData = useCallback(async () => {
        // ✅✅✅  الخطوة الأهم: أضف هذا الشرط في البداية  ✅✅✅
        if (!isFocused || loadingMore || !hasMore || searchQuery.trim() !== '') {
            if (!isFocused) {
                console.log('🚫 [SKIPPED] تحميل المزيد تم تخطيه لأن الشاشة ليست في الواجهة.');
            }
            return;
        }
        
        setLoadingMore(true);
        const newOffset = offset + limit;
        console.log(`📥 [ACTIVE] جاري تحميل المزيد... offset: ${newOffset}`);
        
        setOffset(newOffset);
        setLoadingMore(false);
    }, [isFocused, loadingMore, hasMore, offset, limit, searchQuery]);

    // ✅ إعادة التعيين عند تغيير الفئة أو البحث
    useEffect(() => {
        setOffset(0);
        setHasMore(true);
    }, [selectedCategory, searchQuery]);

    // ✅ تحسين: تأجيل تحميل بعض البيانات حتى يكتمل التحميل الأولي
    useEffect(() => {
        if (!isLoadingMenu && !isLoadingPromotions && !initialLoadComplete) {
            setInitialLoadComplete(true);
            console.log('✅ التحميل الأولي اكتمل - البيانات جاهزة للتقديم');
        }
    }, [isLoadingMenu, isLoadingPromotions, initialLoadComplete]);

    // ✅ تحسين: استخدام useMemo بشكل أكثر فعالية مع الأنواع الصحيحة
    const filteredMeals = useMemo(() => {
        if (!menuData || !initialLoadComplete) return [];
        
        const allMeals = menuData.flatMap((cat: CategoryWithItems) => cat.menu_items || []);
        
        const mealsByCategory = selectedCategory === 'all'
            ? allMeals
            : menuData.find((cat: CategoryWithItems) => cat.id === selectedCategory)?.menu_items || [];

        if (!searchQuery.trim()) return mealsByCategory;

        return mealsByCategory.filter((meal: MenuItem) =>
            meal.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            meal.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [menuData, selectedCategory, searchQuery, initialLoadComplete]);

    // ✅ تحسين: تقليل إعادة التحميل غير الضرورية مع الأنواع الصحيحة
    const categories = useMemo((): CategoryChip[] => {
        return menuData?.map((cat: Category) => ({ id: cat.id, name: cat.name })) || [];
    }, [menuData]);

    const sectionsWithItems = useMemo(() => {
        return menuData?.filter((cat: CategoryWithItems) => cat.menu_items && cat.menu_items.length > 0).map((cat: { id: any; }) => cat.id) || [];
    }, [menuData]);

    // ✅ تحسين: تجنب إعادة إنشاء الـ listData في كل render مع إضافة قسم التحميل
    const listData = useMemo(() => [
        { type: 'header', id: 'header-section' },
        { type: 'categories', id: 'categories' },
        { type: 'meals', id: 'meals' },
        { type: 'loading', id: 'loading-more' } // ✅ إضافة قسم التحميل
    ], []);

    // --- Voice Search Logic ---
    const startVoiceSearch = async () => {
        try {
            setIsVoiceSearching(true);
            Alert.alert(
                'البحث الصوتي',
                'ميزة البحث الصوتي غير متاحة حالياً. جاري العمل على إضافتها قريباً.',
                [{ text: 'حسناً' }]
            );
            setIsVoiceSearching(false);
        } catch (e) {
            console.error('Failed to start voice search', e);
            setIsVoiceSearching(false);
            Alert.alert('خطأ', 'حدث خطأ في البحث الصوتي');
        }
    };

    // --- Handlers مع تحسينات الأداء ---
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            setOffset(0); // ✅ إعادة التعيين عند التحديث
            setHasMore(true);
            await Promise.all([refetchMenu(), refetchPromotions()]);
        } catch (error) {
            console.error('Error refreshing:', error);
        } finally {
            setRefreshing(false);
        }
    }, [refetchMenu, refetchPromotions]);

    const handleScroll = useCallback((event: any) => {
        setShowScrollTop(event.nativeEvent.contentOffset.y > 400);
    }, []);

    const scrollToTop = useCallback(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, []);

    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);
    }, []);

    const handleClearSearch = useCallback(() => {
        setSearchQuery('');
    }, []);

    // ✅ دالة للسحب لتحميل المزيد (Pull to Refresh)
    const handleEndReached = useCallback(() => {
        if (hasMore && !loadingMore && searchQuery.trim() === '') {
            loadMoreData();
        }
    }, [hasMore, loadingMore, searchQuery, loadMoreData]);

    // ✅ تحسين: تجنب إعادة إنشاء renderItem في كل render مع الأنواع الصحيحة
    const renderItem = useCallback(({ item }: { item: { type: string; id: string } }) => {
        switch (item.type) {
            case 'header':
                return searchQuery.trim() === '' ? (
                    <View>
                        <PromotionsCarousel />
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
                            renderItem={({ item: mealItem }: { item: MenuItem }) => (
                                <MealCard meal={mealItem} />
                            )}
                            keyExtractor={(mealItem: MenuItem) => mealItem.id.toString()}
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
            case 'loading':
                return loadingMore ? (
                    <View style={styles.loadingMoreContainer}>
                        <ActivityIndicator size="small" color={Colors.primary} />
                        <Text style={styles.loadingMoreText}>جاري تحميل المزيد...</Text>
                    </View>
                ) : !hasMore && filteredMeals.length > 0 ? (
                    <View style={styles.endOfListContainer}>
                        <Text style={styles.endOfListText}>🏁 وصلت لنهاية القائمة</Text>
                    </View>
                ) : null;
            default:
                return null;
        }
    }, [searchQuery, filteredMeals, categories, selectedCategory, isLoadingMenu, sectionsWithItems, loadingMore, hasMore]);

    // --- Render Logic مع تحسينات الأداء ---
    if ((isLoadingMenu || isLoadingPromotions) && !initialLoadComplete) {
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

    return (
        <SafeAreaView style={styles.safeArea}>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={styles.topSpacing} />

            <Header
                searchQuery={searchQuery}
                setSearchQuery={handleSearch}
                onClearSearch={handleClearSearch}
                onVoiceSearch={startVoiceSearch}
                isVoiceSearching={isVoiceSearching}
            />
            
            {/* ✅ FlatList مع Pagination */}
            <FlatList
                ref={flatListRef}
                data={listData}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                stickyHeaderIndices={[1]}
                showsVerticalScrollIndicator={false}
                onScroll={handleScroll}
                onEndReached={handleEndReached} // ✅ تحميل المزيد عند الوصول للنهاية
                onEndReachedThreshold={0.3} // ✅ عندما يصل لـ 30% من النهاية
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
                initialNumToRender={3}
                maxToRenderPerBatch={5}
                windowSize={5}
                removeClippedSubviews={true}
            />

            {showScrollTop && <ScrollToTopButton onPress={scrollToTop} />}
            <FloatingCartButton />
            <CustomBottomNav />
        </SafeAreaView>
    );
}

// ✅ إضافة الـ styles الجديدة
const styles = StyleSheet.create({
    safeArea: { 
        flex: 1, 
        backgroundColor: '#FFF',
        paddingTop: 10,
    },
    topSpacing: {
        height: 10,
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
    loadingMoreContainer: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    loadingMoreText: {
        marginLeft: 10,
        color: Colors.textSecondary,
        fontSize: 14,
    },
    endOfListContainer: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    endOfListText: {
        color: Colors.textSecondary,
        fontSize: 14,
        fontStyle: 'italic',
    },
});