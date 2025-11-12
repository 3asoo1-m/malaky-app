import React from 'react';
import { View, Image, TextInput, TouchableOpacity, Text } from 'react-native';
import { Bell, Search, Mic } from 'lucide-react-native';
import { Colors } from '@/styles';

const Header = () => (
    <View style={{ backgroundColor: 'white', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Image source={require('@/assets/images/malakylogo.png')} style={{ height: 48, width: 120, resizeMode: 'contain' }} />
            <TouchableOpacity style={{ position: 'relative', padding: 8, backgroundColor: '#FEE2E2', borderRadius: 99 }}>
                <Bell color={Colors.primary} size={24} />
                <View style={{ position: 'absolute', top: 0, right: 0, backgroundColor: Colors.primary, borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>3</Text>
                </View>
            </TouchableOpacity>
        </View>
        <View style={{ marginTop: 16, position: 'relative' }}>
            <TextInput
                placeholder="ابحث عن وجبات لذيذة..."
                style={{
                    width: '100%',
                    paddingRight: 48,
                    paddingLeft: 90,
                    paddingVertical: 12,
                    backgroundColor: '#F3F4F6',
                    borderRadius: 16,
                    textAlign: 'right',
                    fontSize: 16,
                }}
            />
            <Search style={{ position: 'absolute', right: 16, top: 14 }} color="#9CA3AF" size={20} />
            <TouchableOpacity style={{ position: 'absolute', left: 8, top: 6, backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 }}>
                <Text style={{ color: 'white' }}>بحث</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ position: 'absolute', left: 85, top: 14 }}>
                <Mic color="#9CA3AF" size={20} />
            </TouchableOpacity>
        </View>
    </View>
);

export default Header;
