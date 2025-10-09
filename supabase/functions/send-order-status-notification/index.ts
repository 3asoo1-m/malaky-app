// مسار الملف: supabase/functions/send-order-status-notification/index.ts

// =================== التصحيح النهائي هنا ===================
// استخدام الأسماء المختصرة المعرفة في deno.json
import { serve } from "std/http";
import { createClient } from "@supabase/supabase-js";
import { Expo } from "expo-server-sdk";
// ================= نهاية التصحيح ==================

// تعريف أنواع البيانات التي نتوقعها من الـ Webhook
interface OrderRecord {
  id: number;
  status: string;
  user_id: string;
}

// دالة لترجمة الحالة إلى رسالة باللغة العربية (مع الحالات الجديدة )
function getNotificationMessage(status: string): { title: string; body: string } | null {
  switch (status) {
    case 'new': return {
        title: 'تم إستلام طلبك بنجاح',
        body: 'يمكنك تتبع عملية طلبك في التطبيق.',
      };
    case 'processing':
      return {
        title: 'طلبك قيد التحضير! 👨‍🍳',
        body: 'بدأ فريقنا في تحضير طلبك. سنعلمك بالخطوات القادمة.',
      };
    case 'on_the_way':
      return {
        title: 'طلبك في الطريق إليك! 🛵',
        body: 'سائق التوصيل في طريقه إليك الآن. استعد لاستلام وجبتك الشهية!',
      };
    case 'delivered':
      return {
        title: 'بالهناء والشفاء! ✅',
        body: 'تم توصيل طلبك بنجاح. نأمل أن تستمتع بوجبتك!',
      };
    // لا نرسل إشعاراً عند الإلغاء أو للحالات الأخرى
    case 'canceled':
    default:
      return null;
  }
}

serve(async (req: Request) => {
  try {
    // 1. إنشاء عميل Supabase بصلاحيات كاملة
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 2. استخراج بيانات الطلب المحدث
    const { record: updatedOrder } = await req.json() as { record: OrderRecord };

    // 3. ترجمة الحالة إلى رسالة
    const message = getNotificationMessage(updatedOrder.status);
    if (!message) {
      console.log(`No notification needed for status: ${updatedOrder.status}`);
      return new Response(JSON.stringify({ message: 'No notification needed.' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // 4. البحث عن توكن الإشعارات الخاص بالمستخدم
    console.log(`Searching for push tokens for user: ${updatedOrder.user_id}`);
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from('push_tokens')
      .select('token')
      .eq('user_id', updatedOrder.user_id);

    if (tokenError) throw tokenError;
    if (!tokenData || tokenData.length === 0) {
      throw new Error(`No push tokens for user ${updatedOrder.user_id}`);
    }

    // 5. حفظ الإشعار في قاعدة البيانات قبل إرساله
    console.log('Saving notification to the database...');
    const { error: insertError } = await supabaseClient
      .from('notifications')
      .insert({
        user_id: updatedOrder.user_id,
        title: message.title,
        body: message.body,
        data: { orderId: updatedOrder.id },
      });

    if (insertError) {
      console.error('Failed to save notification to DB:', insertError);
    }

    // 6. إرسال الإشعار باستخدام Expo
    console.log(`Found ${tokenData.length} tokens. Preparing to send notifications.`);
    const expo = new Expo();
    const chunks = expo.chunkPushNotifications(
      tokenData.map((t: { token: string }) => ({
        to: t.token,
        sound: 'default',
        title: message.title,
        body: message.body,
        data: { orderId: updatedOrder.id },
      }))
    );

    for (const chunk of chunks) {
      await expo.sendPushNotificationsAsync(chunk);
    }

    console.log('Successfully sent notifications.');
    // 7. إرجاع رسالة نجاح
    return new Response(JSON.stringify({ message: 'Notification sent!' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Error in function:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
