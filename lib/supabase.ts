// In: lib/supabase.ts

import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto'; // مهم جداً لـ Supabase في React Native

// استدعاء متغيرات البيئة التي عرفناها في ملف .env
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// التحقق من وجود المتغيرات لضمان عدم نسيانها
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and/or Anon Key are missing from .env file.");
}

// تهيئة وتصدير "عميل" Supabase لاستخدامه في جميع أنحاء التطبيق
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Supabase يحتاج إلى طريقة لتخزين معلومات جلسة المستخدم (session) على الجهاز
    // في React Native، نستخدم AsyncStorage. هذه المكتبة لم تعد مدمجة، لذا سنستخدم بديلًا بسيطًا أو نثبتها
    // حاليًا، سنتركها فارغة ونضيفها لاحقًا عند بناء نظام تسجيل الدخول
    storage: undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
