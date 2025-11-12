// components/home/Header.tsx
import React from 'react';
import { View, Image, TextInput, TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Bell, Search, Mic, X } from 'lucide-react-native';
import { Colors } from '@/styles';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/useAuth';
import { useNotifications } from '@/lib/api/queries';

// 1. جعل خصائص البحث الصوتي اختيارية
interface HeaderProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    isVoiceSearching?: boolean;
    startVoiceSearch?: () => void;
    onClearSearch: () => void;
    onVoiceSearch?: () => void;
    stopVoiceSearch?: () => void;
}

const Header: React.FC<HeaderProps> = ({
    searchQuery,
    setSearchQuery,
    onClearSearch,
    isVoiceSearching,
    startVoiceSearch,
    onVoiceSearch,
    stopVoiceSearch,
}) => {
    const router = useRouter();
    const { user } = useAuth();
    const { data: unreadCount = 0 } = useNotifications(user?.id);

    const goToNotifications = () => router.push('/notifications');

    // 2. تحديد ما إذا كانت ميزة البحث الصوتي مفعلة (بناءً على وجود الدوال)
    const isVoiceFeatureEnabled = !!startVoiceSearch && !!stopVoiceSearch;

    return (
        <View style={styles.container}>
            <View style={styles.topRow}>
                <Image source={require('../../assets/images/malakylogo.png')} style={styles.logo} />
                <TouchableOpacity style={styles.bellButton} onPress={goToNotifications}>
                    <Bell color={Colors.primary} size={24} />
                    {unreadCount > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{unreadCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
                <TextInput
                    placeholder="ابحث عن وجبات لذيذة..."
                    style={styles.searchInput}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    returnKeyType="search"
                />
                <Search style={styles.searchIcon} color="#9CA3AF" size={20} />

                {/* ✅ 2. ربط دالة onClearSearch */}
                {searchQuery.length > 0 ? (
                    <TouchableOpacity style={styles.clearButton} onPress={onClearSearch}>
                        <X color="white" size={16} />
                    </TouchableOpacity>
                ) : null}

                {isVoiceFeatureEnabled && (
                    <TouchableOpacity style={styles.micButton} onPress={onVoiceSearch}>
                        {isVoiceSearching ? (
                            <ActivityIndicator color={Colors.primary} />
                        ) : (
                            <Mic color="#9CA3AF" size={20} />
                        )}
                    </TouchableOpacity>
                    )}

            </View>
        </View>
    );
};

// ... (الأنماط تبقى كما هي)
const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    logo: {
        height: 48,
        width: 120,
        resizeMode: 'contain',
    },
    bellButton: {
        position: 'relative',
        padding: 8,
        backgroundColor: '#FEE2E2',
        borderRadius: 99,
    },
    badge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: Colors.primary,
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    searchContainer: {
        marginTop: 16,
        position: 'relative',
    },
    searchInput: {
        width: '100%',
        paddingRight: 48,
        paddingLeft: 50, // مساحة لزر الحذف
        paddingVertical: 12,
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
        textAlign: 'right',
        fontSize: 16,
    },
    searchIcon: {
        position: 'absolute',
        right: 16,
        top: 14,
    },
    // زر الحذف الجديد
    clearButton: {
        position: 'absolute',
        left: 8,
        top: 8,
        backgroundColor: Colors.textSecondary,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    micButton: {
        position: 'absolute',
        right: 45, // تم تغيير مكانه قليلاً
        top: 14,
    },
});

export default Header;
