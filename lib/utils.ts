// lib/utils.ts

const SUPABASE_STORAGE_URL = 'https://fltvnabszfuevsxhrlcq.supabase.co/storage/v1/object/public';

export interface ImageTransformations {
  width?: number;
  height?: number;
  quality?: number; // 1-100
  format?: 'webp' | 'avif' | 'jpg' | 'png';
  resize?: 'cover' | 'contain' | 'fill';
  blur?: number; // 0-100
}

/**
 * يقوم بإنشاء عنوان URL محسن للصورة من Supabase Storage.
 */
export function getOptimizedImageUrl(path: string, options: ImageTransformations = {}): string {
  // إذا كان المسار فارغاً أو غير صالح، إرجاع صورة بديلة
  if (!path || path === 'null' || path === 'undefined') {
    return 'https://fltvnabszfuevsxhrlcq.supabase.co/storage/v1/object/public/menu_image/icon.png';
  }

  // إذا لم يكن المسار يبدأ بـ http، افترض أنه مسار داخل Supabase
  if (!path.startsWith('http')) {
    const params = new URLSearchParams();
    
    // إعدادات التحويل الأساسية
    if (options.width) params.append('width', options.width.toString());
    if (options.height) params.append('height', options.height.toString());
    if (options.quality) params.append('quality', Math.min(100, Math.max(1, options.quality)).toString());
    if (options.format) params.append('format', options.format);
    if (options.resize) params.append('resize', options.resize);
    if (options.blur) params.append('blur', Math.min(100, Math.max(0, options.blur)).toString());

    // إضافة cache buster للصور المتغيرة
    if (options.width || options.height) {
      params.append('t', Math.floor(Date.now() / (1000 * 60 * 60)).toString()); // يتغير كل ساعة
    }

    return `${SUPABASE_STORAGE_URL}/${path}?${params.toString()}`;
  }
  
  // إذا كان المسار بالفعل URL كامل، قم بإرجاعه كما هو
  return path;
}

/**
 * إعدادات افتراضية للصور بناءً على نوع الاستخدام
 */
export const ImagePresets = {
  thumbnail: { width: 100, height: 100, quality: 60, format: 'webp' as const },
  cartItem: { width: 140, height: 140, quality: 70, format: 'webp' as const },
  product: { width: 300, height: 300, quality: 80, format: 'webp' as const },
  promotion: { width: 400, height: 200, quality: 85, format: 'webp' as const },
} as const;