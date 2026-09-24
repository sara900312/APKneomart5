# نشر Backend الخاص بـ NEO AI على مشروع Supabase الحالي

مشروع: `emobathinfpylwjdcfbo`

## 1) إنشاء جدول الطلبات

- افتحي **Supabase Dashboard → SQL Editor → New Query**
- ألصقي محتوى الملف `DEPLOY/orders.sql` واضغطي **Run**
- تحققي من ظهور جدول `orders` في **Table Editor**

## 2) نشر Edge Function باسم `create-order`

### الطريقة الأسهل (من الـ Dashboard)
- **Edge Functions → Create a new function**
- الاسم: `create-order`
- الصقي محتوى `DEPLOY/create-order/index.ts` واضغطي **Deploy**
- تأكدي أن خيار **Verify JWT** مُطفأ (لأن التطبيق يستدعيها بمفتاح anon مباشرة)

### أو عبر CLI
```bash
supabase functions deploy create-order \
  --project-ref emobathinfpylwjdcfbo \
  --no-verify-jwt
```

## 3) إضافة أسرار Telegram

من **Project Settings → Edge Functions → Manage Secrets** أضيفي:

| المفتاح | القيمة |
| --- | --- |
| `TELEGRAM_BOT_TOKEN` | التوكن من BotFather |
| `TELEGRAM_CHAT_ID` | معرّف الشات/القناة اللي يستقبل الإشعارات |

> `SUPABASE_URL` و `SUPABASE_SERVICE_ROLE_KEY` مضبوطان تلقائياً — لا تضيفيهما يدوياً.

## 4) اختبار سريع

```bash
curl -X POST https://emobathinfpylwjdcfbo.supabase.co/functions/v1/create-order \
  -H "Content-Type: application/json" \
  -H "apikey: <ANON_KEY>" \
  -H "Authorization: Bearer <ANON_KEY>" \
  -d '{
    "order_code":"TEST-1","customer_name":"اختبار","customer_phone":"07700000000",
    "governorate":"بغداد","area":"الكرادة","items":[{"product_id":1,"name":"منتج","price":1000,"quantity":1}],
    "subtotal":1000,"shipping":0,"total":1000,"payment_method":"cod"
  }'
```
النتيجة المتوقعة: `{"ok":true,"order":{...}}` مع إشعار Telegram.

## آلية الحماية (Fallback)

الكود على العميل يستدعي `create-order` أولاً. لو الدالة غير موجودة أو ردّت خطأ 4xx/5xx، يتم إدراج الطلب مباشرة في جدول `orders` عبر PostgREST باستخدام المفتاح anon (السياسات مضبوطة لتسمح بذلك). النتيجة: يُنشأ الطلب في كل الأحوال، ويصل إشعار Telegram فقط عند توفر الدالة.
