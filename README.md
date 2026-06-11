# WC 2026 — Do'stlar Chempionati

Do'stlar orasidagi **FIFA World Cup 2026** taxmin o'yini.

- **Admin** (Shohjahon) har bir do'st uchun har o'yin natijasini taxmin qiladi.
- **To'g'ri taxmin** = 1 ochko. Aks holda 0.
- Chempionat oxirida **eng ko'p ochko to'plagan — g'olib**!

## Texnologiyalar

- **Next.js 16** (App Router) + TypeScript
- **Tailwind v4** (mobile-first, emerald yashil aksent)
- **MongoDB** + Mongoose
- **TheSportsDB** (live natijalar, free) + **openfootball/worldcup.json** (jadval, free)
- **Vercel Cron** har 5 daqiqada natijalarni yangilaydi

## Sahifalar

| Yo'l | Tavsif |
|---|---|
| `/` | Bugungi o'yinlar, reyting, ertangi o'yinlar |
| `/matches` | To'liq jadval (80 o'yin) — sanalar bo'yicha guruhlangan |
| `/matches/[id]` | Bitta o'yin + 7 do'stning taxminlari |
| `/users/[id]` | Bitta do'stning butun taxmin tarixi |
| `/admin` | Admin kirish (parol) |
| `/admin/dashboard` | O'yinlar ro'yxati + sync tugmalari |
| `/admin/dashboard/[matchId]` | 7 ta taxminni bir formada kiritish |

## O'rnatish

### 1. Dependency'larni o'rnatish
```bash
npm install
```

### 2. MongoDB tayyorlash
**Tavsiya:** [MongoDB Atlas](https://www.mongodb.com/atlas/database) — free M0 cluster (512MB).
1. Cluster yarating
2. "Database Access" → user + parol qo'shing
3. "Network Access" → `0.0.0.0/0` (Vercel uchun)
4. "Connect" → "Drivers" → connection string'ni ko'chiring

### 3. `.env` faylini sozlash
`.env.example`'ni nusxalang va to'ldiring:

```bash
cp .env.example .env
```

```env
DATABASE_URL="mongodb+srv://USER:PASS@CLUSTER.mongodb.net/wc2026?retryWrites=true&w=majority"
ADMIN_PASSWORD="o'zingiz tanlagan-kuchli-parol"
CRON_SECRET="random-uzun-string"
```

### 4. Do'stlarni DB'ga yuklash
```bash
npm run seed
```
→ 7 ta foydalanuvchi qo'shiladi (Shohjahon = admin).

### 5. O'yinlar jadvalini sync qilish
```bash
npm run sync:matches
```
→ openfootball'dan 80 ta WC2026 o'yini yuklanadi, TheSportsDB'dan natijalar tortiladi.

> Yoki: brauzerda `/admin` → kirish → **"Jadval"** tugmasi.

### 6. Dev server
```bash
npm run dev
```
→ http://localhost:3000

## Vercel'ga deploy

1. GitHub'ga push qiling
2. [vercel.com/new](https://vercel.com/new) → import repo
3. Environment variables qo'shing: `DATABASE_URL`, `ADMIN_PASSWORD`, `CRON_SECRET`
4. Deploy
5. Birinchi marta admin panel'dan **"Jadval"** tugmasini bosing

`vercel.json` allaqachon **cron job**'ni sozlab qo'ygan: har 5 daqiqada `/api/cron/sync` chaqiriladi (faqat live natijalarni yangilaydi, ochkolarni avto-hisoblaydi).

## Kundalik foydalanish

1. **Ertaga o'yinlar bor:** `/admin/dashboard` → har bir o'yinga kirib 7 ta taxminni kiriting → **Saqlash**
2. **O'yin paytida:** Hech narsa qilmaysiz — cron har 5 minutda natija va ochkolarni yangilaydi
3. **O'yin tugagandan keyin:** Bosh sahifa avtomatik yangi reytingni ko'rsatadi

## Mahalliy testing (MongoDB Atlas'siz)

Lokal MongoDB ham ishlaydi:
```bash
brew install mongodb-community
brew services start mongodb-community
# .env: DATABASE_URL="mongodb://localhost:27017/wc2026"
```

## Yo'l xaritasi (keyingi qadamlar)

- Live o'yinda taxminlarni real vaqtda yangilash (Server-Sent Events)
- Push notifications (Telegram bot orqali "Bugun 3 ta o'yin bor!")
- Statistika sahifa: kim eng ko'p favoritga tikadi, kim risk qiladi
- "Buyuk g'olib" mukofoti / yarim final scoringini ko'paytirish
