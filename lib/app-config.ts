// 📁 lib/app-config.ts
export interface AppConfig {
  id: number;
  is_under_maintenance: boolean;
  maintenance_message: string;
  force_update_version: string | null;
  force_update_message: string | null;
  latest_version: string | null;
  update_message: string | null;
  store_links: {
    android: string;
    ios: string;
  } | null;
  updated_at: string;
}

export const defaultAppConfig: AppConfig = {
  id: 1,
  is_under_maintenance: false,
  maintenance_message: 'التطبيق تحت الصيانة حاليًا. نعتذر عن الإزعاج وسنعود قريبًا.',
  force_update_version: null,
  force_update_message: 'يتوفر تحديث جديد ومهم للتطبيق. يرجى التحديث للاستمرار.',
  latest_version: '1.0.0',
  update_message: 'يتوفر تحديث جديد يحوي ميزات رائعة!',
  store_links: {
    android: 'https://play.google.com/store/apps/details?id=com.royalbroast',
    ios: 'https://apps.apple.com/app/idYOUR_APP_ID'
  },
  updated_at: new Date().toISOString()
};