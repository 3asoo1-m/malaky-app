// مسار الملف: lib/useAuth.ts

import { User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { supabase } from './supabase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // جلب الجلسة الحالية عند بدء التشغيل
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error getting session:", error);
      }
      setUser(data.session?.user ?? null);
      setLoading(false);
    };

    getSession();

    // الاستماع لأي تغييرات في حالة المصادقة (تسجيل دخول/خروج)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    // إلغاء الاستماع عند إغلاق المكون
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}
