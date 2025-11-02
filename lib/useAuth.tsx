// مسار الملف: lib/useAuth.ts
import { supabase } from './supabase';
import React, { useState, useEffect, createContext, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { 
  startGuestSession, 
  trackGuestConversion, 
  endGuestSession,
  trackEvent,
  AnalyticsEvents 
} from './analytics';

// 1. تحديث شكل البيانات ليشمل النظام الهجين
interface AuthContextType {
  user: User | null;
  session: Session | null;
  initialLoading: boolean;
  isGuest: boolean;
  guestUser: any | null;
  signInAsGuest: () => Promise<void>;
  convertGuestToUser: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
}

// 2. ✅ إنشاء السياق
const authContext = createContext<AuthContextType | undefined>(undefined);

// 3. إنشاء المزود (Provider) مع النظام الهجين
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [guestUser, setGuestUser] = useState<any>(null);

  // ✅ توليد معرف جلسة فريد
  const generateSessionId = (): string => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // ✅ بدء جلسة ضيف
  const signInAsGuest = async () => {
    try {
      const guestData = {
        id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        session_id: generateSessionId(),
        created_at: new Date().toISOString(),
        device_info: { 
          platform: Platform.OS, 
          version: Platform.Version 
        },
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };
      
      await startGuestSession(guestData);
      setGuestUser(guestData);
      setIsGuest(true);
      
      console.log('🎯 Guest session started:', guestData.id);
    } catch (error) {
      console.error('❌ Error starting guest session:', error);
    }
  };

  // ✅ تحويل ضيف إلى عضو
  const convertGuestToUser = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password 
      });
      
      if (error) throw error;
      
      if (data.user) {
        // ✅ تسجيل تحويل الضيف
        await trackGuestConversion(guestUser?.id, data.user.id, {
          migration_timestamp: new Date().toISOString(),
          guest_session_duration: Date.now() - new Date(guestUser?.created_at).getTime()
        });

        // ✅ تحديث حالة المستخدم
        setUser(data.user);
        setGuestUser(null);
        setIsGuest(false);
        
        // ✅ مسح بيانات الضيف المحلية
        await AsyncStorage.removeItem('guest_user');
        
        console.log('✅ Guest converted to user:', data.user.id);
      }
      
      return data;
    } catch (error) {
      console.error('❌ Error converting guest to user:', error);
      throw error;
    }
  };

  // ✅ تسجيل الخروج
  const signOut = async () => {
    try {
      if (isGuest && guestUser) {
        // ✅ إنهاء جلسة الضيف
        await endGuestSession();
        setGuestUser(null);
        setIsGuest(false);
      } else {
        // ✅ تسجيل خروج المستخدم المسجل
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      }
      
      setUser(null);
      setSession(null);
      
      console.log('✅ Signed out successfully');
    } catch (error) {
      console.error('❌ Error signing out:', error);
      throw error;
    }
  };

  // ✅ تحميل حالة المستخدم عند بدء التطبيق
  const loadUserState = async () => {
    try {
      // 1. التحقق من المستخدم المسجل
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setSession(session);
        setUser(session.user);
        setIsGuest(false);
        setGuestUser(null);
        
        // ✅ مسح أي بيانات ضيف إذا كان فيه مستخدم مسجل
        await AsyncStorage.removeItem('guest_user');
      } else {
        // 2. التحقق من وجود ضيف
        const guestData = await AsyncStorage.getItem('guest_user');
        
        if (guestData) {
          const guest = JSON.parse(guestData);
          setGuestUser(guest);
          setIsGuest(true);
          console.log('📱 Loaded existing guest session:', guest.id);
        } else {
          // 3. إذا مفيش مستخدم ولا ضيف، ننشئ ضيف تلقائياً
          await signInAsGuest();
        }
      }
    } catch (error) {
      console.error('❌ Error loading user state:', error);
      // Fallback: إنشاء ضيف في حالة الخطأ
      await signInAsGuest();
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    loadUserState();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // إذا سجل دخول مستخدم، ننهي جلسة الضيف
          setIsGuest(false);
          setGuestUser(null);
          await AsyncStorage.removeItem('guest_user');
          
          // ✅ تسجيل حدث تسجيل الدخول
          await trackEvent(AnalyticsEvents.USER_SIGNED_IN, {
            user_id: session.user.id,
            login_method: 'email'
          });
        } else if (event === 'SIGNED_OUT') {
          // إذا سجل خروج، ننشئ ضيف تلقائياً
          await signInAsGuest();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value: AuthContextType = {
    session,
    user,
    initialLoading,
    isGuest,
    guestUser,
    signInAsGuest,
    convertGuestToUser,
    signOut
  };

  return <authContext.Provider value={value}>{children}</authContext.Provider>;
}

// 5. إنشاء الهوك المخصص (useAuth)
export const useAuth = () => {
  const context = useContext(authContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};