# 🚀 دليل رفع مشروع RippleIQ على منصة Vercel (Frontend & Backend)

تم تجهيز كافة ملفات التكوين والـ Serverless Entrypoints اللازمة لرفع الواجهة الأمامية (Next.js) والواجهة الخلفية (FastAPI) على منصة **Vercel**.

---

## 📁 الملفات التي تم إعدادها وتجهيزها

1. **`vercel.json` (في المجلد الرئيسي)**:
   - يوجه استدعاءات الـ API (`/api/v1/:path*`) و `/health` و `/docs` مباشرة إلى سيرفر FastAPI Serverless.
   - يترك باقي المسارات للواجهة الأمامية Next.js.
2. **`api/index.py`**:
   - نقطة الدخول (Entrypoint) الرسمية لدالة Python Serverless على Vercel، حيث يقوم باستيراد تطبيق FastAPI من `backend/app/main.py` مع إضافة مسارات الذكاء الاصطناعي `ai/`.
3. **`requirements.txt` (في المجلد الرئيسي)**:
   - متطلبات بيئة بايثون لـ Vercel Serverless Function (FastAPI, SQLAlchemy, psycopg2-binary, Pydantic, etc.).
4. **`frontend/vercel.json`**:
   - إعداد مخصص في حال اخترت رفع مجلد `frontend` كمشروع مستقل.
5. **`frontend/next.config.ts` و `frontend/lib/api.ts`**:
   - يدعم التوجيه النسبي التلقائي على Vercel بدون مشاكل CORS أو تعارض منافذ.

---

## 🛠️ خيارات النشر على Vercel

### الخيار 1: النشر المدمج بالكامل (All-in-One Deployment)
في هذا الخيار، يتم رفع الواجهة والباك إند معاً تحت نطاق واحد في مشروع Vercel واحد.

1. ادخل إلى [Vercel Dashboard](https://vercel.com/dashboard) واضغط **Add New...** -> **Project**.
2. اربط مستودع GitHub الخاص بـ **RippleIQ**.
3. **Root Directory**: اتركه فارغاً أو اضغط Edit واجعله `./` (المجلد الرئيسي للمشروع).
4. تأكد من تفعيل متغيرات البيئة (Environment Variables) الموضحة في الجدول أدناه.
5. اضغط **Deploy**.
6. سيقوم Vercel تلقائياً ببناء Next.js وتجهيز دوال البايثون في مجلد `api/`.

---

### الخيار 2: فصل الواجهة الأمامية (Frontend Only on Vercel) - الأفضل للأداء
إذا كان الباك إند مستضافاً على منصة مثل **Render** أو **Railway** أو **Fly.io** (أفضل لتشغيل مهام الخلفية والـ WebSockets المستمرة):

1. في Vercel Dashboard، اختر مستودع **RippleIQ**.
2. في إعدادات المشروع اضغط **Edit** بجوار **Root Directory** واختر مجلد:
   ```text
   frontend
   ```
3. سيتعرف Vercel فوراً على أنه تطبيق **Next.js**.
4. أضف متغير بيئي:
   - `NEXT_PUBLIC_API_URL` = رابط الباك إند (مثال: `https://api.rippleiq.com` أو رابط Render/Railway).
5. اضغط **Deploy**.

---

## 🔑 متغيرات البيئة المطلوبة (Environment Variables)

في لوحة تحكم Vercel (Settings -> Environment Variables)، أضف المتغيرات التالية:

| المتغير | الوصف | مثال |
| :--- | :--- | :--- |
| `DATABASE_URL` | رابط اتصال قاعدة بيانات PostgreSQL (نوصي بـ Neon أو Supabase) | `postgresql://user:pass@ep-xyz.neon.tech/rippleiq?sslmode=require` |
| `SECRET_KEY` | مفتاح تشفير عشوائي للجلسات والـ JWT | `9f3c7e8a1d2e5b6c...` (64 حرف hex) |
| `ALLOWED_ORIGINS` | النطاقات المسموح لها بالاتصال (CORS) | `https://your-domain.vercel.app` أو `*` |
| `GEMINI_API_KEY_1` | مفتاح Google Gemini API لتشغيل محاكاة القرارات | `AIzaSy...` |
| `NEXT_PUBLIC_API_URL` | رابط الباك إند (اختياري في النشر المدمج، إلزامي في حال الفصل) | `https://your-api.com` أو اتركه فارغاً للنشر المدمج |

---

## ⚡ فحص الاتصال بعد النشر

بمجرد اكتمال الرفع، يمكنك اختبار الروابط التالية عبر المتصفح:
- **الموقع الرئيسي:** `https://your-project.vercel.app/`
- **لوحة التحكم:** `https://your-project.vercel.app/dashboard`
- **فحص صحة السيرفر:** `https://your-project.vercel.app/health`
- **توثيق الـ API:** `https://your-project.vercel.app/docs`
