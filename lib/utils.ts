// lib/utils.ts

// عنوان URL الأساسي لـ Supabase Storage الخاص بك
const SUPABASE_STORAGE_URL = 'https://fltvnabszfuevsxhrlcq.supabase.co/storage/v1/object/public';

interface ImageTransformations {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpg';
}

/**
 * يقوم بإنشاء عنوان URL محسن للصورة من Supabase Storage.
 * @param path - مسار الصورة داخل الـ bucket (e.g., 'menu-images/burger.png' ).
 * @param options - خيارات التحويل (العرض، الارتفاع، الجودة).
 * @returns عنوان URL المحسن للصورة.
 */
export function getOptimizedImageUrl(path: string, options: ImageTransformations): string {
  // إذا لم يكن المسار يبدأ بـ http، افترض أنه مسار داخل Supabase
  if (!path.startsWith('http' )) {
    // بناء سلسلة التحويلات
    const params = new URLSearchParams();
    if (options.width) params.append('width', options.width.toString());
    if (options.height) params.append('height', options.height.toString());
    if (options.quality) params.append('quality', options.quality.toString());
    if (options.format) params.append('format', options.format);

    // إرجاع الـ URL الكامل مع التحويلات
    return `${SUPABASE_STORAGE_URL}/${path}?${params.toString()}`;
  }
  
  // إذا كان المسار بالفعل URL كامل (مثل placeholder)، قم بإرجاعه كما هو
  return path;
}
