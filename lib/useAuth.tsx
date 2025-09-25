// مسار الملف: lib/useAuth.ts

import { supabase } from './supabase';
import React, { useState, useEffect, createContext, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';

// 1. تعريف شكل البيانات (النوع)
interface AuthContextType {
  user: User | null;
  session: Session | null;
  initialLoading: boolean;
}

// 2. ✅ إنشاء السياق (المتغير) باسم يبدأ بحرف صغير
const authContext = createContext<AuthContextType | undefined>(undefined);

// 3. إنشاء المزود (Provider)
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setInitialLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    session,
    user,
    initialLoading,
  };

  // 4. ✅ استخدام المتغير الصحيح هنا
  return <authContext.Provider value={value}>{children}</authContext.Provider>;
}

// 5. إنشاء الهوك المخصص (useAuth)
export const useAuth = () => {
  // 6. ✅ استخدام المتغير الصحيح هنا أيضًا
  const context = useContext(authContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
