# 🛍️ تشيرتوا — دليل الإعداد الكامل

## هيكل الملفات

```
tshirtoua-theme/
├── layout/
│   └── theme.liquid              ← الهيكل الرئيسي + header + footer + cart drawer
├── templates/
│   ├── index.liquid              ← الهوم
│   ├── product.liquid            ← صفحة المنتج
│   ├── collection.liquid         ← صفحة الكوليكشن + فلتر
│   └── customers/
│       ├── login.liquid          ← تسجيل الدخول
│       ├── register.liquid       ← إنشاء حساب
│       └── account.liquid        ← حساب العميل + الطلبات
├── sections/
│   ├── hero.liquid               ← البانر الرئيسي
│   ├── featured-products.liquid  ← المنتجات المميزة
│   └── announcement-bar.liquid   ← الشريط العلوي
├── snippets/
│   └── product-card.liquid       ← كارد المنتج (reusable)
├── assets/
│   ├── tshirtoua.css             ← كل الـ CSS
│   ├── tshirtoua.js              ← كل الـ JS + Cart Drawer + Notifications
│   └── cart-api.js               ← Shopify REST API wrapper
└── config/
    └── settings_schema.json      ← إعدادات الـ Theme Customizer
```

---

## 🚀 خطوات الرفع على Shopify

### الطريقة 1: Theme Editor (يدوي)
1. اذهب لـ **Online Store → Themes → Add theme → Upload zip file**
2. ارفع الـ `tshirtoua-theme/` كـ ZIP

### الطريقة 2: Shopify CLI (أسرع)
```bash
npm install -g @shopify/cli @shopify/theme
shopify theme push --path=tshirtoua-theme/ --store=YOUR-STORE.myshopify.com
```

---

## 📦 إعداد الكوليكشنز

في Shopify Admin، اعمل الكوليكشنز دي بالـ handle ده بالظبط:

| الاسم | الـ Handle |
|-------|-----------|
| صيفي  | `summer`  |
| شتوي  | `winter`  |
| خريفي | `autumn`  |
| كاجوال| `casual`  |

### إزاي تربط المنتجات بالـ Seasons:
لكل منتج، أضف **Tag** بـ: `summer` أو `winter` أو `autumn` أو `casual`
ده هيخلي الفلتر يشتغل تلقائياً.

---

## 💳 منتج تجريبي بـ 0 جنيه (لاختبار الدفع)

1. اعمل منتج جديد في Shopify
2. السعر: **0.00**
3. الـ Handle: `test-order`
4. اتأكد إن **"Require shipping"** شيله لو مش عايز تعبئة
5. ده هيظهر تلقائياً على الهوم كبنر للاختبار

---

## 🔔 نظام الـ Notifications

الـ Toasts بتتنادي كده في أي Liquid أو JS:

```javascript
// نجاح
TshirtouaNotify.success('عنوان', 'رسالة');

// خطأ
TshirtouaNotify.error('عنوان', 'رسالة');

// معلومة
TshirtouaNotify.info('عنوان', 'رسالة');

// إضافة للعربة
TshirtouaNotify.cart('أضفنا للعربة! 🛒', 'اسم المنتج');
```

---

## 🛒 Cart Drawer API

```javascript
// فتح العربة
TshirtouaCart.open();

// إضافة منتج
TshirtouaCart.addToCart(variantId, quantity, 'اسم المنتج');

// إزالة منتج
TshirtouaCart.removeLine(lineIndex);

// تغيير كمية
TshirtouaCart.changeLine(lineIndex, newQty);
```

---

## 🎨 تخصيص التصميم

كل الألوان والمتغيرات في أول ملف `tshirtoua.css`:

```css
:root {
  --accent: #e8ff00;      /* لون الـ Accent الأصفر الفلوري */
  --bg:     #0a0a0a;      /* الخلفية الداكنة */
  --text:   #f0f0f0;      /* لون النص */
  /* ... */
}
```

---

## 📱 Shopify Payments Testing

لاختبار بطاقة Visa بدون خصم حقيقي:

| البيانات | القيمة |
|---------|-------|
| Card Number | `4242 4242 4242 4242` |
| Expiry | أي تاريخ مستقبلي |
| CVV | `123` |
| اسم | أي اسم |

> ⚠️ ده للـ **Bogus Gateway** في وضع الـ Development فقط.

---

## ✅ Checklist قبل الإطلاق

- [ ] رفع الـ Theme على Shopify
- [ ] إنشاء الكوليكشنز بالـ Handles الصح
- [ ] إضافة Tags للمنتجات
- [ ] رفع صور المنتجات
- [ ] إعداد Shopify Payments
- [ ] اختبار منتج بـ 0 جنيه
- [ ] اختبار Cart Drawer
- [ ] اختبار Login و Register
- [ ] تفعيل إشعارات الطلبات للعملاء
- [ ] إضافة بيانات الشحن والمناطق

---

**تشيرتوا © 2025** — Built with ❤️ on Shopify
