# ERP Tizimi - To'liq Foydalanuvchi Qo'llanmasi

Bu qo'llanma ERP tizimining barcha bo'limlarini oddiy va tushunarli tilda tushuntiradi. Har bir bo'limni qanday ishlatishni bosqichma-bosqich ko'rib chiqamiz.

---

## Mundarija

1. [Hamkorlar (Kontragentlar)](#1-hamkorlar-kontragentlar)
2. [Shartnomalar](#2-shartnomalar)
3. [Omborlar](#3-omborlar)
4. [Ombor Qoldig'i](#4-ombor-qoldigi)
5. [Tovarlar Aylanmasi](#5-tovarlar-aylanmasi)
6. [Kirim Qilish](#6-kirim-qilish)
7. [Hisobdan Chiqarish](#7-hisobdan-chiqarish)
8. [Inventarizatsiya](#8-inventarizatsiya)
9. [O'zaro Hisob-kitoblar](#9-ozaro-hisob-kitoblar)

---

## 1. Hamkorlar (Kontragentlar)

### Nima uchun kerak?
Hamkorlar bo'limi - bu sizning biznesingiz bilan ishlayotgan barcha mijozlar va yetkazib beruvchilarni bir joyda saqlash uchun.

### Qanday ishlatiladi?

#### 1.1. Yangi hamkor qo'shish

**Bosqichlar:**
1. "Hamkorlar" bo'limiga o'ting
2. "Yangi hamkor" tugmasini bosing
3. Quyidagi ma'lumotlarni kiriting:
   - **Nomi**: Hamkorning to'liq nomi (masalan: "Anvar Savdo")
   - **Turi**: Mijoz, Yetkazib beruvchi yoki Ikkala turi
   - **Telefon**: Aloqa uchun telefon raqami
   - **Email**: Elektron pochta manzili
   - **Yuridik manzil**: Rasmiy ro'yxatdan o'tgan manzil
   - **Jismoniy manzil**: Haqiqiy joylashgan joy
   - **STIR**: Soliq to'lovchi identifikatsiya raqami
   - **Bank hisob raqami**: To'lovlar uchun
4. "Saqlash" tugmasini bosing

**Maslahat:** Kod avtomatik yaratiladi (P000001, P000002...), o'zingiz o'zgartirmasangiz ham bo'ladi.

#### 1.2. Hamkorni tahrirlash
1. Hamkorlar ro'yxatidan kerakli hamkorni toping
2. "Tahrirlash" tugmasini bosing
3. Kerakli ma'lumotlarni o'zgartiring
4. "Saqlash" tugmasini bosing

#### 1.3. Hamkorni qidirish
- Yuqoridagi qidiruv maydoniga hamkor nomini yoki telefon raqamini kiriting
- Tizim avtomatik ravishda mos natijalarni ko'rsatadi

#### 1.4. Hamkor statistikasini ko'rish
Har bir hamkor kartochkasida ko'rsatiladi:
- **Balans**: Qancha qarz bor (musbat = sizdan qarz, manfiy = siz qarz)
- **Jami sotuvlar**: Umumiy savdo hajmi
- **O'rtacha chek**: Bir xaridning o'rtacha summasi
- **Oxirgi xarid**: Qachon oxirgi marta xarid qilgan

---

## 2. Shartnomalar

### Nima uchun kerak?
Shartnomalar - bu hamkorlar bilan rasmiy kelishuvlarni saqlash va nazorat qilish uchun.

### Qanday ishlatiladi?

#### 2.1. Yangi shartnoma yaratish

**Bosqichlar:**
1. "Shartnomalar" bo'limiga o'ting
2. "Yangi shartnoma" tugmasini bosing
3. Ma'lumotlarni kiriting:
   - **Shartnoma raqami**: Masalan: SH-2026-0001
   - **Hamkor**: Ro'yxatdan hamkorni tanlang
   - **Tashkilot**: Sizning qaysi firmangiz nomidan
   - **Boshlanish sanasi**: Shartnoma qachondan amal qiladi
   - **Tugash sanasi**: Qachongacha amal qiladi
   - **Valyuta**: So'm, Dollar, Evro yoki Rubl
   - **Kredit limiti**: Maksimal qarz miqdori (ixtiyoriy)
   - **To'lov muddati**: Necha kun ichida to'lash kerak
4. "Saqlash" tugmasini bosing

#### 2.2. Shartnoma muddatini kuzatish
- Tizim avtomatik ravishda muddati tugayotgan shartnomalar haqida ogohlantiradi
- 30 kun qolganda sariq rangda ko'rsatiladi
- Muddati o'tgan shartnomalar qizil rangda

#### 2.3. Asosiy shartnomani belgilash
Agar bir hamkor bilan bir nechta shartnoma bo'lsa:
1. Kerakli shartnomani oching
2. "Asosiy qilish" tugmasini bosing
3. Yangi hujjatlar yaratilganda bu shartnoma avtomatik tanlanadi

---

## 3. Omborlar

### Nima uchun kerak?
Omborlar - bu tovarlaringiz qayerda saqlanayotganini belgilash uchun.

### Qanday ishlatiladi?

#### 3.1. Yangi ombor qo'shish

**Bosqichlar:**
1. "Omborlar" bo'limiga o'ting
2. "Yangi ombor" tugmasini bosing
3. Ma'lumotlarni to'ldiring:
   - **Nomi**: Masalan: "Asosiy ombor" yoki "Chilonzor do'koni"
   - **Kod**: Masalan: WH-001
   - **Manzil**: Omborning joylashgan joyi
   - **Mas'ul shaxs**: Kim javobgar
   - **Telefon**: Aloqa uchun
   - **Sig'im**: Necha kvadrat metr (ixtiyoriy)
4. "Qo'shish" tugmasini bosing

#### 3.2. Omborni tahrirlash
1. Ombor kartochkasida "Tahrirlash" tugmasini bosing
2. Kerakli o'zgarishlarni kiriting
3. "Saqlash" tugmasini bosing

#### 3.3. Omborni o'chirish
**Diqqat:** Agar omborga bog'langan tovarlar yoki hujjatlar bo'lsa, o'chirib bo'lmaydi!

1. Ombor kartochkasida "O'chirish" tugmasini bosing
2. Tasdiqlash oynasida "O'chirish" tugmasini bosing

---

## 4. Ombor Qoldig'i

### Nima uchun kerak?
Bu bo'lim sizga hozir omborda qancha tovar borligini real vaqtda ko'rsatadi.

### Qanday ishlatiladi?

#### 4.1. Qoldiqlarni ko'rish
1. "Ombor qoldig'i" bo'limiga o'ting
2. Ekranda ko'rasiz:
   - **Tannarx qiymati**: Tovarlarning xarid narxidagi umumiy qiymati
   - **Sotuv qiymati**: Tovarlarning sotuv narxidagi qiymati
   - **Potensial foyda**: Agar hammasini sotsangiz, qancha foyda
   - **Kam qolgan**: Qaysi tovarlar tugab qolmoqda

#### 4.2. Jadvalda ko'rsatiladigan ma'lumotlar
- **Qoldiq**: Hozir omborda qancha bor
- **Rezerv**: Buyurtma qilingan, lekin hali jo'natilmagan
- **Mavjud**: Sotish mumkin bo'lgan (Qoldiq - Rezerv)
- **Min**: Kamaymas qoldiq (bundan kam bo'lmasligi kerak)
- **Tannarx qiymati**: Qoldiq × Tannarx
- **Sotuv qiymati**: Qoldiq × Sotuv narxi

#### 4.3. Filtrlar
- **Qidiruv**: Mahsulot nomi yoki SKU bo'yicha
- **Kategoriya**: Ma'lum bir toifa bo'yicha
- **Nol qoldiqlarni yashirish**: Faqat omborda bor tovarlarni ko'rsatish

#### 4.4. Manfiy qoldiq (Minusga sotish)
Agar qoldiq manfiy bo'lsa (masalan: -10):
- Qizil rangda ko'rsatiladi
- Bu degani: 10 ta tovar sotilgan, lekin omborda yo'q edi
- Tezda tovar kiritish kerak!

---

## 5. Tovarlar Aylanmasi

### Nima uchun kerak?
Bu hisobot ma'lum bir davr ichida tovarlar qanday harakat qilganini ko'rsatadi.

### Qanday ishlatiladi?

#### 5.1. Hisobotni ochish
1. "Tovarlar aylanmasi" bo'limiga o'ting
2. Davrni tanlang:
   - **Boshlanish sanasi**: Masalan: 01.01.2026
   - **Tugash sanasi**: Masalan: 31.01.2026
3. Tizim avtomatik hisobotni ko'rsatadi

#### 5.2. Jadvalda nima ko'rsatiladi?

Har bir tovar uchun 4 ta blok:

**1. Boshlang'ich qoldiq** (Ko'k rang)
- Davr boshida qancha tovar bor edi
- Miqdor va summa

**2. Kirim** (Yashil rang)
- Davr ichida qancha tovar keldi
- Xaridlar + Ombor kirimlari

**3. Chiqim** (Qizil rang)
- Davr ichida qancha tovar chiqdi
- Sotuvlar + Hisobdan chiqarishlar

**4. Yakuniy qoldiq** (Binafsha rang)
- Davr oxirida qancha qoldi
- Formula: Boshlang'ich + Kirim - Chiqim

#### 5.3. Filtrlar
- **Kategoriya**: Ma'lum bir toifa bo'yicha
- **Harakatsizlarni ko'rsatish**: Davr ichida harakat bo'lmagan tovarlarni ham ko'rsatish

---

## 6. Kirim Qilish (Oприходование)

### Nima uchun kerak?
Bu tovarlarni ombor qoldig'iga qo'shish uchun ishlatiladi, lekin xarid qilmasdan (tekin kirim).

### Qachon ishlatiladi?
- Inventarizatsiya paytida ortiqcha tovar topilganda
- Ishlab chiqarishdan tayyor mahsulot chiqqanda
- Boshqa sabablarga ko'ra tovar qo'shish kerak bo'lganda

### Qanday ishlatiladi?

#### 6.1. Yangi kirim yaratish

**Bosqichlar:**
1. "Kirim qilish" bo'limiga o'ting
2. "Yangi kirim" tugmasini bosing
3. Asosiy ma'lumotlar:
   - **Ombor**: Qaysi omborga kiritiladi
   - **Tashkilot**: Qaysi firma nomiga
   - **Sana**: Kirim sanasi
   - **Sabab**: Nima uchun kiritilmoqda (inventarizatsiya, ishlab chiqarish, boshqa)
4. Tovarlar qo'shish:
   - "Tovar qo'shish" tugmasini bosing
   - Tovarni tanlang
   - Miqdorni kiriting
   - Tannarxni kiriting (bu narx hisobotlarda ishlatiladi)
5. "Qoralama sifatida saqlash" yoki "Tasdiqlash" tugmasini bosing

#### 6.2. Qoralama va Tasdiqlangan holat

**Qoralama (Draft):**
- Hali ombor qoldig'iga ta'sir qilmaydi
- Tahrirlash mumkin
- O'chirish mumkin

**Tasdiqlangan (Confirmed):**
- Tovarlar ombor qoldig'iga qo'shiladi
- Tahrirlash mumkin emas
- O'chirish mumkin, lekin qoldiq qaytariladi

#### 6.3. Kirimni tasdiqlash
1. Qoralama kirimni oching
2. Barcha ma'lumotlarni tekshiring
3. "Tasdiqlash" tugmasini bosing
4. Tovarlar avtomatik ravishda ombor qoldig'iga qo'shiladi

#### 6.4. Kirimni chop etish
1. Kirimni oching
2. "Chop etish" tugmasini bosing
3. Yangi oynada kirim dalolatnomasi ochiladi
4. Chop etish yoki PDF sifatida saqlash mumkin

---

## 7. Hisobdan Chiqarish (Списание)

### Nima uchun kerak?
Tovarlarni ombor qoldig'idan olib tashlash uchun, lekin sotish orqali emas.

### Qachon ishlatiladi?
- Tovar buzilgan yoki yaroqsiz bo'lgan
- Tovar yo'qolgan
- Shaxsiy ehtiyojlar uchun ishlatilgan
- Inventarizatsiyada kamomad aniqlangan

### Qanday ishlatiladi?

#### 7.1. Yangi hisobdan chiqarish yaratish

**Bosqichlar:**
1. "Hisobdan chiqarish" bo'limiga o'ting
2. "Yangi hisobdan chiqarish" tugmasini bosing
3. Asosiy ma'lumotlar:
   - **Ombor**: Qaysi ombordan chiqariladi
   - **Tashkilot**: Qaysi firma nomiga
   - **Sana**: Chiqarish sanasi
   - **Sabab**: Nima uchun chiqarilmoqda
     - Buzilgan
     - Muddati o'tgan
     - Yo'qolgan
     - Shaxsiy ehtiyoj
     - Inventarizatsiya kamomadi
     - Boshqa
4. Tovarlar qo'shish:
   - "Tovar qo'shish" tugmasini bosing
   - Tovarni tanlang
   - Miqdorni kiriting
   - Tannarx avtomatik to'ldiriladi
5. "Qoralama sifatida saqlash" yoki "Tasdiqlash" tugmasini bosing

#### 7.2. Muhim ogohlantirish!
**Tizim omborda yetarli tovar borligini tekshiradi:**
- Agar omborda 10 ta tovar bo'lsa, 15 ta chiqarib bo'lmaydi
- Xatolik xabari ko'rsatiladi
- Avval tovar kiritish yoki miqdorni kamaytirish kerak

#### 7.3. Hisobdan chiqarishni tasdiqlash
1. Qoralama hisobdan chiqarishni oching
2. Barcha ma'lumotlarni tekshiring
3. "Tasdiqlash" tugmasini bosing
4. Tovarlar avtomatik ravishda ombor qoldig'idan ayriladi
5. Zarar summasi moliyaviy hisobotlarda aks etadi

#### 7.4. Hisobdan chiqarishni chop etish
1. Hisobdan chiqarishni oching
2. "Chop etish" tugmasini bosing
3. Hisobdan chiqarish dalolatnomasi (AKT) ochiladi
4. Chop etish yoki PDF sifatida saqlash

---

## 8. Inventarizatsiya

### Nima uchun kerak?
Ombordagi haqiqiy tovarlar miqdorini tizimda ko'rsatilgan miqdor bilan solishtirish uchun.

### Qanday ishlatiladi?

#### 8.1. Yangi inventarizatsiya boshlash

**Bosqichlar:**
1. "Inventarizatsiya" bo'limiga o'ting
2. "Yangi inventarizatsiya" tugmasini bosing
3. Asosiy ma'lumotlar:
   - **Ombor**: Qaysi omborni tekshiryapsiz
   - **Sana**: Tekshiruv sanasi
   - **Kategoriya**: Faqat ma'lum toifani tekshirish (ixtiyoriy)
4. "Ombordan to'ldirish" tugmasini bosing
   - Tizim avtomatik ravishda ombordagi barcha tovarlarni ro'yxatga oladi
   - Har bir tovar uchun tizim miqdorini ko'rsatadi

#### 8.2. Haqiqiy miqdorni kiritish

**Bosqichlar:**
1. Omborda tovarlarni sanang
2. Har bir tovar uchun "Haqiqiy miqdor" ustuniga sanagan miqdorni kiriting
3. Tizim avtomatik ravishda farqni hisoblaydi:
   - **Ortiqcha**: Agar haqiqiy miqdor ko'p bo'lsa (yashil rang)
   - **Kamomad**: Agar haqiqiy miqdor kam bo'lsa (qizil rang)

#### 8.3. Inventarizatsiyani tasdiqlash
1. Barcha tovarlarni sanab bo'lgach
2. "Tasdiqlash" tugmasini bosing
3. Inventarizatsiya tasdiqlangan holatga o'tadi

#### 8.4. Tuzatish hujjatlarini yaratish

**Agar ortiqcha tovar bo'lsa:**
1. "Kirim yaratish" tugmasini bosing
2. Tizim avtomatik ravishda ortiqcha tovarlar uchun kirim hujjatini yaratadi
3. Kirimni tasdiqlang
4. Tovarlar ombor qoldig'iga qo'shiladi

**Agar kamomad bo'lsa:**
1. "Hisobdan chiqarish yaratish" tugmasini bosing
2. Tizim avtomatik ravishda kamomad tovarlar uchun hisobdan chiqarish yaratadi
3. Hisobdan chiqarishni tasdiqlang
4. Tovarlar ombor qoldig'idan ayriladi

#### 8.5. Muhim eslatma!
- Inventarizatsiyaning o'zi qoldiqni o'zgartirmaydi
- Faqat yaratilgan kirim yoki hisobdan chiqarish hujjatlari qoldiqni o'zgartiradi
- Shuning uchun har doim tuzatish hujjatlarini yaratish va tasdiqlash kerak

---

## 9. O'zaro Hisob-kitoblar

### Nima uchun kerak?
Bu bo'lim sizga hamkorlar bilan qarzlarni nazorat qilish uchun. Kim sizdan qarz va siz kimdan qarz ekanligini ko'rsatadi.

### Qanday ishlatiladi?

#### 9.1. Hisobotni ochish
1. "O'zaro hisob-kitoblar" bo'limiga o'ting
2. Davrni tanlang:
   - **Boshlanish sanasi**: Masalan: 01.01.2026
   - **Tugash sanasi**: Masalan: 31.01.2026
3. Hamkor turini tanlang:
   - **Barchasi**: Barcha hamkorlar
   - **Mijozlar**: Faqat mijozlar
   - **Yetkazib beruvchilar**: Faqat yetkazib beruvchilar

#### 9.2. KPI kartalarni tushunish

**Boshlang'ich qoldiq:**
- Davr boshida umumiy qarz holati
- Yashil = Sizdan qarz
- Qizil = Siz qarz

**Debitorlar (Bizdan qarz):**
- Mijozlar sizdan qancha qarz
- Bu yaxshi, chunki sizga pul to'lashlari kerak

**Kreditorlar (Biz qarz):**
- Siz yetkazib beruvchilarga qancha qarz
- Bu to'lash kerak bo'lgan qarzlar

**Yakuniy qoldiq:**
- Davr oxiridagi umumiy holat
- Yashil = Sizdan qarz
- Qizil = Siz qarz

#### 9.3. Jadvalda nima ko'rsatiladi?

Har bir hamkor uchun:
- **Boshlang'ich**: Davr boshida qancha qarz bor edi
- **Kirim**: Davr ichida qancha qarz oshdi (sotuvlar, xaridlar)
- **Chiqim**: Davr ichida qancha qarz kamaydi (to'lovlar, qaytarishlar)
- **Yakuniy**: Davr oxirida qancha qarz qoldi
- **Holat**: Debitor (sizdan qarz) yoki Kreditor (siz qarz)

#### 9.4. Qarzlarni tushunish

**Musbat raqam (yashil):**
- Hamkor sizdan qarz
- Masalan: +1,000,000 so'm = Mijoz sizga 1 million to'lashi kerak

**Manfiy raqam (qizil):**
- Siz hamkordan qarz
- Masalan: -500,000 so'm = Siz yetkazib beruvchiga 500 ming to'lashingiz kerak

#### 9.5. Qarzlarni kamaytirish

**Mijoz qarzini kamaytirish:**
1. "To'lovlar" bo'limiga o'ting
2. "Kiruvchi to'lov" yarating
3. Mijozni tanlang
4. Summani kiriting
5. Tasdiqlang
6. Qarz avtomatik kamayadi

**Yetkazib beruvchi qarzini kamaytirish:**
1. "To'lovlar" bo'limiga o'ting
2. "Chiquvchi to'lov" yarating
3. Yetkazib beruvchini tanlang
4. Summani kiriting
5. Tasdiqlang
6. Qarz avtomatik kamayadi

---

## Umumiy Maslahatlar

### 1. Qoralama va Tasdiqlangan
- Har doim avval qoralama sifatida saqlang
- Barcha ma'lumotlarni tekshiring
- Keyin tasdiqlang
- Tasdiqlangandan keyin o'zgartirish qiyin!

### 2. Sana va Vaqt
- Har doim to'g'ri sanani kiriting
- Noto'g'ri sana hisobotlarni buzadi
- Agar xato qilsangiz, hujjatni o'chirib, yangisini yarating

### 3. Zaxira Nusxa
- Muhim hujjatlarni chop etib saqlang
- PDF sifatida yuklab oling
- Kompyuterda alohida papkada saqlang

### 4. Muntazam Tekshirish
- Har hafta ombor qoldig'ini tekshiring
- Har oy inventarizatsiya qiling
- Har oy qarzlarni tekshiring

### 5. Yordam Kerak Bo'lsa
- Har bir sahifada "?" belgisi bor
- Bosing va qo'shimcha ma'lumot oling
- Yoki texnik yordam bilan bog'laning

---

## Xatoliklar va Ularni Hal Qilish

### "Yetarli tovar yo'q" xatosi
**Sabab:** Omborda tovar kam
**Yechim:** 
1. Ombor qoldig'ini tekshiring
2. Tovar kiritish yoki miqdorni kamaytirish

### "Shartnoma muddati tugagan" xatosi
**Sabab:** Hamkor bilan shartnoma muddati o'tgan
**Yechim:**
1. Shartnomalar bo'limiga o'ting
2. Yangi shartnoma yarating yoki eskisini uzaytiring

### "Hamkor topilmadi" xatosi
**Sabab:** Hamkor tizimda yo'q
**Yechim:**
1. Hamkorlar bo'limiga o'ting
2. Yangi hamkor qo'shing

### Ma'lumotlar yuklanmayapti
**Sabab:** Internet aloqasi yoki server muammosi
**Yechim:**
1. Internet aloqasini tekshiring
2. Sahifani yangilang (F5)
3. Yana urinib ko'ring

---

## Xulosa

Bu qo'llanma sizga ERP tizimini to'liq ishlatishga yordam beradi. Har bir bo'limni bosqichma-bosqich sinab ko'ring. Agar savollar bo'lsa, texnik yordam bilan bog'laning.

**Muvaffaqiyatlar tilaymiz!** 🎉
