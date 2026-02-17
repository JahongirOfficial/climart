# Test Script Natijalar Ko'rsatmasi

## Skriptni Ishga Tushirish

```bash
# 1. Serverni ishga tushiring (birinchi terminal)
npm run dev

# 2. Skriptni ishga tushiring (ikkinchi terminal)
npm run test:supplier-invoices
```

## Skript Nima Qiladi?

1. **20 ta yangi mahsulot yaratadi**
   - Samsung Galaxy S24 Ultra, iPhone 15 Pro Max, MacBook Pro M3, va boshqalar
   - Har bir mahsulot uchun narx, kategoriya va birlik belgilanadi

2. **55 ta purchase order yaratadi**
   - Tasodifiy taminotchilar bilan
   - Har bir buyurtmada 2-6 ta mahsulot
   - 2024 yil boshidan hozirgi kungacha tasodifiy sanalar

3. **Barcha buyurtmalarni qabul qiladi**
   - Status: pending → received
   - Har bir qabul qilingan buyurtma uchun avtomatik supplier invoice yaratiladi

4. **30 ta to'lov amalga oshiradi**
   - Invoicelarning 30-100% qismiga to'lov
   - Tasodifiy sanalar va to'lov usullari

## "Hisoblar" Tabida Ko'rinadigan Ma'lumotlar

### Jadval Ustunlari:

| Ustun | Ma'lumot | Misol |
|-------|----------|-------|
| **Hisob raqami** | Avtomatik generatsiya qilingan | INV-S-2024-0001 |
| **Yetkazib beruvchi** | Taminotchi nomi | Samsung Electronics |
| **Buyurtma** | Bog'langan buyurtma raqami | ZP-2024-001 |
| **Sana** | Invoice yaratilgan sana | 15.02.2024 |
| **Muddat** | To'lov muddati (30 kun) | 16.03.2024 |
| **Jami summa** | Buyurtmaning umumiy summasi | 45,000,000 so'm |
| **To'langan** | Qancha to'langan | 30,000,000 so'm |
| **Qoldiq** | Qancha qolgan | 15,000,000 so'm |
| **Status** | To'lov holati | Qisman to'langan |
| **Amallar** | Ko'rish va to'lash tugmalari | 👁️ To'lash |

### Status Turlari:

1. **To'lanmagan** (unpaid)
   - Sariq rang
   - Hali to'lov qilinmagan
   - To'lash tugmasi mavjud

2. **Qisman to'langan** (partial)
   - Ko'k rang
   - Qisman to'lov qilingan
   - To'lash tugmasi mavjud (qoldiq uchun)

3. **To'liq to'langan** (paid)
   - Yashil rang
   - To'liq to'langan
   - To'lash tugmasi yo'q

4. **Muddati o'tib ketgan** (overdue)
   - Qizil rang
   - To'lov muddati o'tgan
   - Qancha kun o'tganini ko'rsatadi

### KPI Kartochkalari (Yuqorida):

1. **Jami hisoblar**
   - Barcha invoicelarning umumiy summasi
   - Misol: 2,500,000,000 so'm

2. **To'langan**
   - Amalga oshirilgan to'lovlar summasi
   - Misol: 1,800,000,000 so'm

3. **Qoldiq**
   - To'lash kerak bo'lgan summa
   - Misol: 700,000,000 so'm

4. **Muddati o'tib ketgan**
   - Muddati o'tgan hisoblar soni
   - Misol: 5 ta

## "Buyurtmalar" Tabida Ko'rinadigan Ma'lumotlar

### Jadval Ustunlari:

| Ustun | Ma'lumot | Misol |
|-------|----------|-------|
| **Buyurtma raqami** | Buyurtma raqami | ZP-2024-001 |
| **Yetkazib beruvchi** | Taminotchi nomi | Samsung Electronics |
| **Sana** | Buyurtma sanasi | 10.02.2024 |
| **Tovarlar** | Mahsulotlar soni | 15 dona |
| **Status** | Buyurtma holati | Qabul qilindi |
| **Summa** | Umumiy summa | 45,000,000 so'm |
| **Amallar** | Ko'rish va to'lov tugmalari | 👁️ To'lov |

### Status Turlari:

1. **Kutilmoqda** (pending)
   - Sariq rang
   - Tovar hali kelmagan

2. **Qabul qilindi** (received)
   - Yashil rang
   - Tovar qabul qilingan
   - Avtomatik invoice yaratilgan

3. **Bekor qilindi** (cancelled)
   - Qizil rang
   - Buyurtma bekor qilingan

## To'lov Jarayoni

### Hisoblardan to'lov:

1. "Hisoblar" tabini tanlang
2. Kerakli hisob qatorida "To'lash" tugmasini bosing
3. To'lov modalida:
   - To'lov summasi (maksimal: qoldiq summa)
   - Izoh (ixtiyoriy)
4. "Saqlash" tugmasini bosing
5. To'lov avtomatik:
   - Invoice paidAmount ni yangilaydi
   - Invoice statusini yangilaydi (unpaid → partial → paid)
   - Payment yaratadi

### Buyurtmalardan to'lov:

1. "Buyurtmalar" tabini tanlang
2. Kerakli buyurtma qatorida "To'lov" tugmasini bosing
3. To'lov modalida:
   - Taminotchi avtomatik to'ldirilgan
   - Summa avtomatik to'ldirilgan
   - Maqsad avtomatik to'ldirilgan
4. "Saqlash" tugmasini bosing
5. To'lov avtomatik:
   - Buyurtmaga bog'langan invoice ni topadi
   - Invoice paidAmount ni yangilaydi
   - Payment yaratadi

## Boshqa Sahifalarda Ko'rinadigan Ma'lumotlar

### Moliya → Pul aylanmasi

- Barcha to'lovlar ro'yxati
- Kirim va chiqim to'lovlar
- Naqd va bank hisobi balanslari
- Filtrlash: sana, tur, hisob, kategoriya

### Moliya → O'zaro hisob-kitoblar

- Har bir taminotchi bo'yicha qarz holati
- Jami qarz summasi
- To'langan va qolgan summalar
- Taminotchi bo'yicha batafsil ma'lumot

### Xaridlar → Buyurtmalar

- Barcha purchase orderlar
- Status bo'yicha filtrlash
- To'lov tugmasi (qabul qilingan buyurtmalar uchun)

## Kutilayotgan Natijalar

Skript muvaffaqiyatli bajarilgandan keyin:

```
📊 YAKUNIY STATISTIKA:

📦 Mahsulotlar: 120+ ta
📝 Purchase Orders: 55 ta
💰 Supplier Invoices: 55 ta
   - Tolanmagan: ~15 ta
   - Qisman tolangan: ~30 ta
   - Toliq tolangan: ~10 ta
💳 Tolovlar: 30 ta

💵 Moliyaviy malumotlar:
   - Jami invoice summasi: ~500,000,000 - 1,500,000,000 som
   - Tolangan: ~300,000,000 - 1,000,000,000 som
   - Qoldiq (qarz): ~200,000,000 - 500,000,000 som
```

## Tekshirish Bosqichlari

1. **Hisoblar tabini tekshirish**
   - Xaridlar → Taminotchiga to'lov qilish → Hisoblar
   - 55 ta invoice ko'rinishi kerak
   - Har xil statuslar bo'lishi kerak
   - KPI kartochkalar to'g'ri summalarni ko'rsatishi kerak

2. **Buyurtmalar tabini tekshirish**
   - Xaridlar → Taminotchiga to'lov qilish → Buyurtmalar
   - 55 ta buyurtma ko'rinishi kerak
   - Barcha buyurtmalar "Qabul qilindi" statusida bo'lishi kerak

3. **To'lov qilishni tekshirish**
   - Biror invoicega to'lov qiling
   - To'lov muvaffaqiyatli amalga oshishi kerak
   - Invoice qoldiq summasi kamayishi kerak
   - Status yangilanishi kerak

4. **Pul aylanmasini tekshirish**
   - Moliya → Pul aylanmasi
   - 30 ta to'lov ko'rinishi kerak
   - Balanslar to'g'ri hisoblangan bo'lishi kerak

5. **O'zaro hisob-kitoblarni tekshirish**
   - Moliya → O'zaro hisob-kitoblar
   - Taminotchilar bo'yicha qarzlar ko'rinishi kerak
   - Summalar to'g'ri bo'lishi kerak

## Muammolar va Yechimlar

### Agar hisoblar ko'rinmasa:

1. Serverni qayta ishga tushiring
2. Brauzerda sahifani yangilang (F5)
3. MongoDB ulanganligini tekshiring
4. Console da xatoliklarni tekshiring

### Agar to'lov ishlamasa:

1. Network tabda API so'rovlarni tekshiring
2. Backend loglarni tekshiring
3. MongoDB da to'lovlar yaratilganligini tekshiring

### Agar summalar noto'g'ri bo'lsa:

1. Invoice modelidagi pre-save hook ishlayotganligini tekshiring
2. Payment yaratilganda linkedDocument to'g'ri bog'langanligini tekshiring
3. MongoDB da ma'lumotlarni qo'lda tekshiring

## Qo'shimcha Ma'lumot

- Skript har safar ishga tushirilganda yangi ma'lumotlar qo'shadi
- Eski ma'lumotlar o'chirilmaydi
- Test ma'lumotlarini tozalash uchun MongoDB ni tozalang
- Real ma'lumotlar bilan aralashmasligi uchun test muhitda ishlating
