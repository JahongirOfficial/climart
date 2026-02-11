# Ma'lumot Kiritish Qo'llanmasi - Haqiqiy Savdo Jarayoni

## 📋 Maqsad
Ushbu qo'llanma ERP tizimiga haqiqiy savdo ma'lumotlarini to'g'ri ketma-ketlikda kiritish uchun mo'ljallangan.

---

## 🗑️ 1-QADAM: Database ni Tozalash

**Maqsad:** Barcha eski ma'lumotlarni o'chirish va toza holatdan boshlash

### API Endpoint:
```
DELETE /api/clear-all-data
```

**Yoki MongoDB Compass orqali:**
1. MongoDB Compass ni oching
2. `climart` database ni tanlang
3. Barcha collectionlarni tanlang va `Drop Collection` tugmasini bosing

**Yoki kod orqali:**
```javascript
// Barcha collectionlarni tozalash
await Promise.all([
  Partner.deleteMany({}),
  Product.deleteMany({}),
  Service.deleteMany({}),
  Warehouse.deleteMany({}),
  Contract.deleteMany({}),
  PurchaseOrder.deleteMany({}),
  Receipt.deleteMany({}),
  SupplierInvoice.deleteMany({}),
  Payment.deleteMany({}),
  Inventory.deleteMany({}),
  CustomerOrder.deleteMany({}),
  CustomerInvoice.deleteMany({}),
  Shipment.deleteMany({}),
  TaxInvoice.deleteMany({}),
  CustomerReturn.deleteMany({}),
  SupplierReturn.deleteMany({}),
  WarehouseReceipt.deleteMany({}),
  WarehouseTransfer.deleteMany({}),
  WarehouseExpense.deleteMany({}),
  InternalOrder.deleteMany({}),
  Writeoff.deleteMany({}),
  SerialNumber.deleteMany({})
]);
```

---

## 📊 2-QADAM: Asosiy Ma'lumotlar (Master Data)

### 2.1. Omborlar (Warehouses) ⭐ ENG BIRINCHI
**Bo'lim:** Ombor → Omborlar ro'yxati

**Nima uchun birinchi?** Barcha tovar harakatlari ombor bilan bog'liq

**Kiritish tartibi:**
1. **Asosiy ombor** (Markaziy)
   - Nomi: "Asosiy ombor"
   - Kod: "WH-001"
   - Manzil: "Toshkent, Chilonzor tumani"
   - Sig'im: 1000 m²
   - Status: Faol

2. **Chakana savdo ombori**
   - Nomi: "Chakana savdo ombori"
   - Kod: "WH-002"
   - Manzil: "Toshkent, Yunusobod tumani"
   - Sig'im: 500 m²
   - Status: Faol

3. **Ehtiyot ombor**
   - Nomi: "Ehtiyot ombor"
   - Kod: "WH-003"
   - Manzil: "Toshkent, Sergeli tumani"
   - Sig'im: 300 m²
   - Status: Faol

---

### 2.2. Hamkorlar - Yetkazib beruvchilar (Suppliers)
**Bo'lim:** Kontaktlar → Hamkorlar → Yetkazib beruvchi

**Kiritish tartibi:**
1. **Asosiy yetkazib beruvchi**
   - Kod: "SUP-001"
   - Nomi: "TechnoPlus LLC"
   - Turi: Yetkazib beruvchi
   - Telefon: +998901234567
   - Email: technoplus@example.com
   - Status: Faol

2. **Import yetkazib beruvchi**
   - Kod: "SUP-002"
   - Nomi: "Global Import Co"
   - Turi: Yetkazib beruvchi
   - Telefon: +998901234568
   - Status: Faol

3. **Mahalliy yetkazib beruvchi**
   - Kod: "SUP-003"
   - Nomi: "Mahalliy Ishlab Chiqarish"
   - Turi: Yetkazib beruvchi
   - Telefon: +998901234569
   - Status: Faol

---

### 2.3. Hamkorlar - Mijozlar (Customers)
**Bo'lim:** Kontaktlar → Hamkorlar → Mijoz

**Kiritish tartibi:**
1. **Doimiy mijoz**
   - Kod: "CUST-001"
   - Nomi: "Anvar Aliyev"
   - Turi: Mijoz
   - Telefon: +998901111111
   - Status: VIP

2. **Korporativ mijoz**
   - Kod: "CUST-002"
   - Nomi: "Biznes Markaz LLC"
   - Turi: Mijoz
   - Telefon: +998902222222
   - Status: Faol

3. **Yangi mijoz**
   - Kod: "CUST-003"
   - Nomi: "Dilshod Karimov"
   - Turi: Mijoz
   - Telefon: +998903333333
   - Status: Yangi

---

### 2.4. Shartnomalar (Contracts)
**Bo'lim:** Kontaktlar → Shartnomalar

**Kiritish tartibi:**
1. **Yetkazib beruvchi bilan shartnoma**
   - Raqam: "CNT-2026-001"
   - Hamkor: TechnoPlus LLC
   - Boshlanish: 01.01.2026
   - Tugash: 31.12.2026
   - Valyuta: UZS
   - Summa: 100,000,000 so'm
   - Status: Faol

2. **Mijoz bilan shartnoma**
   - Raqam: "CNT-2026-002"
   - Hamkor: Biznes Markaz LLC
   - Boshlanish: 01.02.2026
   - Tugash: 31.12.2026
   - Valyuta: UZS
   - Kredit limit: 50,000,000 so'm
   - Status: Faol

---

### 2.5. Mahsulotlar (Products)
**Bo'lim:** Mahsulotlar → Mahsulotlar ro'yxati

**Kiritish tartibi:**
1. **Elektronika - Noutbuk**
   - Nomi: "Lenovo ThinkPad E15"
   - SKU: "PROD-001"
   - Kategoriya: Elektronika
   - O'lchov: dona
   - Tan narx: 8,000,000 so'm
   - Sotuv narx: 10,000,000 so'm
   - Minimal qoldiq: 5 dona

2. **Elektronika - Telefon**
   - Nomi: "Samsung Galaxy A54"
   - SKU: "PROD-002"
   - Kategoriya: Elektronika
   - O'lchov: dona
   - Tan narx: 3,500,000 so'm
   - Sotuv narx: 4,500,000 so'm
   - Minimal qoldiq: 10 dona

3. **Aksessuarlar - Sichqoncha**
   - Nomi: "Logitech M185"
   - SKU: "PROD-003"
   - Kategoriya: Aksessuarlar
   - O'lchov: dona
   - Tan narx: 50,000 so'm
   - Sotuv narx: 80,000 so'm
   - Minimal qoldiq: 20 dona

4. **Aksessuarlar - Klaviatura**
   - Nomi: "Logitech K120"
   - SKU: "PROD-004"
   - Kategoriya: Aksessuarlar
   - O'lchov: dona
   - Tan narx: 80,000 so'm
   - Sotuv narx: 120,000 so'm
   - Minimal qoldiq: 15 dona

---

### 2.6. Xizmatlar (Services)
**Bo'lim:** Mahsulotlar → Xizmatlar

**Kiritish tartibi:**
1. **Yetkazib berish**
   - Nomi: "Yetkazib berish xizmati"
   - Kod: "SRV-001"
   - Narx: 50,000 so'm
   - Status: Faol

2. **O'rnatish**
   - Nomi: "Dasturiy ta'minot o'rnatish"
   - Kod: "SRV-002"
   - Narx: 200,000 so'm
   - Status: Faol

3. **Kafolat xizmati**
   - Nomi: "1 yillik kafolat"
   - Kod: "SRV-003"
   - Narx: 500,000 so'm
   - Status: Faol

---

## 🛒 3-QADAM: Xarid Jarayoni (Procurement Process)

### 3.1. Xarid Buyurtmasi (Purchase Order)
**Bo'lim:** Xaridlar → Buyurtmalar

**Birinchi buyurtma:**
- Raqam: "PO-2026-001"
- Yetkazib beruvchi: TechnoPlus LLC
- Sana: 05.02.2026
- Mahsulotlar:
  - Lenovo ThinkPad E15 × 10 dona = 80,000,000 so'm
  - Samsung Galaxy A54 × 20 dona = 70,000,000 so'm
  - Logitech M185 × 50 dona = 2,500,000 so'm
- Jami: 152,500,000 so'm
- Status: Tasdiqlangan

---

### 3.2. Tovar Qabul (Receipt)
**Bo'lim:** Xaridlar → Qabullar

**Birinchi qabul:**
- Raqam: "RCP-2026-001"
- Xarid buyurtmasi: PO-2026-001
- Ombor: Asosiy ombor
- Qabul sanasi: 10.02.2026
- Mahsulotlar:
  - Lenovo ThinkPad E15 × 10 dona
  - Samsung Galaxy A54 × 20 dona
  - Logitech M185 × 50 dona
- Status: Qabul qilindi

**Natija:** Omborga tovarlar kiritildi, Inventory yaratildi

---

### 3.3. Yetkazib Beruvchi Hisob-fakturasi (Supplier Invoice)
**Bo'lim:** Xaridlar → Qabul qilingan hisob-fakturalar

**Birinchi hisob-faktura:**
- Raqam: "SINV-2026-001"
- Yetkazib beruvchi: TechnoPlus LLC
- Qabul: RCP-2026-001
- Sana: 10.02.2026
- Summa: 152,500,000 so'm
- To'lov muddati: 15.03.2026
- Status: To'lanmagan

---

### 3.4. To'lov - Yetkazib Beruvchiga (Payment - Outgoing)
**Bo'lim:** Moliya → To'lovlar

**Birinchi to'lov:**
- Raqam: "PAY-OUT-001"
- Turi: Chiqim
- Hamkor: TechnoPlus LLC
- Sana: 15.02.2026
- Summa: 100,000,000 so'm (qisman to'lov)
- Hisob: Bank
- To'lov usuli: Bank o'tkazmasi
- Maqsad: SINV-2026-001 uchun to'lov
- Status: Tasdiqlangan

**Qoldiq qarz:** 52,500,000 so'm

---

## 📦 4-QADAM: Ombor Operatsiyalari

### 4.1. Ombor Qabuli (Warehouse Receipt)
**Bo'lim:** Ombor → Qabul

**Avtomatik yaratiladi** Receipt yaratilganda, lekin qo'shimcha qabul:
- Raqam: "WR-2026-001"
- Ombor: Asosiy ombor
- Sana: 10.02.2026
- Mahsulotlar qabul qilindi
- Status: Tasdiqlangan

---

### 4.2. Omborlar O'rtasida Ko'chirish (Warehouse Transfer)
**Bo'lim:** Ombor → Ko'chirish

**Birinchi ko'chirish:**
- Raqam: "WT-2026-001"
- Qayerdan: Asosiy ombor
- Qayerga: Chakana savdo ombori
- Sana: 12.02.2026
- Mahsulotlar:
  - Samsung Galaxy A54 × 10 dona
  - Logitech M185 × 30 dona
- Status: Tasdiqlangan

---

## 💰 5-QADAM: Sotish Jarayoni (Sales Process)

### 5.1. Mijoz Buyurtmasi (Customer Order)
**Bo'lim:** Sotish → Buyurtmalar

**Birinchi buyurtma:**
- Raqam: "CO-2026-001"
- Mijoz: Biznes Markaz LLC
- Sana: 15.02.2026
- Mahsulotlar:
  - Lenovo ThinkPad E15 × 5 dona = 50,000,000 so'm
  - Samsung Galaxy A54 × 10 dona = 45,000,000 so'm
  - Logitech M185 × 20 dona = 1,600,000 so'm
- Jami: 96,600,000 so'm
- Status: Tasdiqlangan

---

### 5.2. Yetkazib Berish (Shipment)
**Bo'lim:** Sotish → Yetkazib berishlar

**Birinchi yetkazib berish:**
- Raqam: "SHP-2026-001"
- Buyurtma: CO-2026-001
- Ombor: Asosiy ombor
- Sana: 16.02.2026
- Mahsulotlar:
  - Lenovo ThinkPad E15 × 5 dona
  - Samsung Galaxy A54 × 10 dona
  - Logitech M185 × 20 dona
- Yetkazib berish manzili: Biznes Markaz, Toshkent
- Status: Yetkazildi

**Natija:** Ombordan tovarlar chiqarildi, Inventory yangilandi

---

### 5.3. Mijoz Hisob-fakturasi (Customer Invoice)
**Bo'lim:** Sotish → Hisob-fakturalar

**Birinchi hisob-faktura:**
- Raqam: "CINV-2026-001"
- Mijoz: Biznes Markaz LLC
- Yetkazib berish: SHP-2026-001
- Sana: 16.02.2026
- Summa: 96,600,000 so'm
- To'lov muddati: 16.03.2026
- Status: To'lanmagan

---

### 5.4. Soliq Hisob-fakturasi (Tax Invoice)
**Bo'lim:** Sotish → Soliq hisob-fakturalari

**Birinchi soliq hisob-fakturasi:**
- Raqam: "TINV-2026-001"
- Mijoz hisob-fakturasi: CINV-2026-001
- Sana: 16.02.2026
- Asosiy summa: 96,600,000 so'm
- QQS (12%): 11,592,000 so'm
- Jami: 108,192,000 so'm
- Status: Yuborilgan

---

### 5.5. To'lov - Mijozdan (Payment - Incoming)
**Bo'lim:** Moliya → To'lovlar

**Birinchi to'lov:**
- Raqam: "PAY-IN-001"
- Turi: Kirim
- Hamkor: Biznes Markaz LLC
- Sana: 20.02.2026
- Summa: 108,192,000 so'm (to'liq to'lov)
- Hisob: Bank
- To'lov usuli: Bank o'tkazmasi
- Maqsad: CINV-2026-001 uchun to'lov
- Status: Tasdiqlangan

---

## 🔄 6-QADAM: Qaytarish Jarayonlari

### 6.1. Mijozdan Qaytarish (Customer Return)
**Bo'lim:** Sotish → Qaytarishlar

**Birinchi qaytarish:**
- Raqam: "CR-2026-001"
- Mijoz: Biznes Markaz LLC
- Hisob-faktura: CINV-2026-001
- Sana: 25.02.2026
- Sabab: Nuqsonli mahsulot
- Mahsulotlar:
  - Lenovo ThinkPad E15 × 1 dona = 10,000,000 so'm
- Ombor: Asosiy ombor
- Status: Qabul qilindi

**Natija:** Omborga qaytarildi, Mijozga pul qaytarilishi kerak

---

### 6.2. Yetkazib Beruvchiga Qaytarish (Supplier Return)
**Bo'lim:** Xaridlar → Qaytarishlar

**Birinchi qaytarish:**
- Raqam: "SR-2026-001"
- Yetkazib beruvchi: TechnoPlus LLC
- Qabul: RCP-2026-001
- Sana: 26.02.2026
- Sabab: Nuqsonli mahsulot
- Mahsulotlar:
  - Lenovo ThinkPad E15 × 1 dona
- Ombor: Asosiy ombor
- Status: Yuborildi

**Natija:** Ombordan chiqarildi, Yetkazib beruvchidan pul qaytarilishi kerak

---

## 📊 7-QADAM: Ombor Boshqaruvi

### 7.1. Ichki Buyurtma (Internal Order)
**Bo'lim:** Ombor → Ichki buyurtma

**Birinchi ichki buyurtma:**
- Raqam: "IO-2026-001"
- Qayerdan: Asosiy ombor
- Qayerga: Chakana savdo ombori
- Sana: 28.02.2026
- Mahsulotlar:
  - Logitech K120 × 10 dona
- Status: Tasdiqlangan

---

### 7.2. Ombor Chiqimi (Warehouse Expense)
**Bo'lim:** Ombor → Chiqim

**Birinchi chiqim:**
- Raqam: "WE-2026-001"
- Ombor: Asosiy ombor
- Sana: 01.03.2026
- Kategoriya: Namuna
- Mahsulotlar:
  - Logitech M185 × 5 dona
- Sabab: Namuna sifatida tarqatish
- Status: Tasdiqlangan

---

### 7.3. Hisobdan Chiqarish (Writeoff)
**Bo'lim:** Ombor → Hisobdan chiqarish

**Birinchi hisobdan chiqarish:**
- Raqam: "WO-2026-001"
- Ombor: Asosiy ombor
- Sana: 05.03.2026
- Sabab: Shikastlangan
- Mahsulotlar:
  - Samsung Galaxy A54 × 2 dona
- Status: Tasdiqlangan

---

## 📈 8-QADAM: Hisobotlar va Tahlil

### 8.1. Ombor Balansi
**Bo'lim:** Ombor → Balans

**Tekshirish:**
- Asosiy ombor:
  - Lenovo ThinkPad E15: 3 dona (10 - 5 - 1 - 1)
  - Samsung Galaxy A54: 8 dona (20 - 10 - 2)
  - Logitech M185: 15 dona (50 - 30 - 5)
  - Logitech K120: 0 dona

- Chakana savdo ombori:
  - Samsung Galaxy A54: 10 dona
  - Logitech M185: 30 dona

---

### 8.2. Moliyaviy Hisobotlar
**Bo'lim:** Moliya → Hisobotlar

**Tekshirish:**
1. **Pul oqimi (Cash Flow)**
   - Kirim: 108,192,000 so'm
   - Chiqim: 100,000,000 so'm
   - Balans: +8,192,000 so'm

2. **Foyda-Zarar (Profit & Loss)**
   - Daromad: 96,600,000 so'm
   - Xarajat: 152,500,000 so'm
   - Zarar: -55,900,000 so'm (qisman to'lov tufayli)

3. **Qarzdorliklar**
   - Biznes qarzlari: 52,500,000 so'm (TechnoPlus LLC ga)
   - Mijoz qarzlari: 0 so'm

---

## ✅ Yakuniy Tekshirish Ro'yxati

- [ ] Omborlar yaratildi (3 ta)
- [ ] Yetkazib beruvchilar qo'shildi (3 ta)
- [ ] Mijozlar qo'shildi (3 ta)
- [ ] Shartnomalar tuzildi (2 ta)
- [ ] Mahsulotlar qo'shildi (4 ta)
- [ ] Xizmatlar qo'shildi (3 ta)
- [ ] Xarid buyurtmasi yaratildi
- [ ] Tovar qabul qilindi
- [ ] Yetkazib beruvchi hisob-fakturasi yaratildi
- [ ] Yetkazib beruvchiga to'lov qilindi
- [ ] Omborlar o'rtasida ko'chirish amalga oshirildi
- [ ] Mijoz buyurtmasi yaratildi
- [ ] Yetkazib berish amalga oshirildi
- [ ] Mijoz hisob-fakturasi yaratildi
- [ ] Soliq hisob-fakturasi yaratildi
- [ ] Mijozdan to'lov qabul qilindi
- [ ] Mijozdan qaytarish qabul qilindi
- [ ] Yetkazib beruvchiga qaytarish yuborildi
- [ ] Ichki buyurtma yaratildi
- [ ] Ombor chiqimi amalga oshirildi
- [ ] Hisobdan chiqarish amalga oshirildi
- [ ] Hisobotlar tekshirildi

---

## 🎯 Muhim Eslatmalar

1. **Ketma-ketlik muhim!** Har bir qadam oldingi qadamga bog'liq
2. **Omborlar birinchi** - Barcha tovar harakatlari ombor bilan bog'liq
3. **Hamkorlar ikkinchi** - Xarid va sotish uchun zarur
4. **Mahsulotlar uchinchi** - Buyurtmalar uchun zarur
5. **Xarid → Sotish** - Avval tovar sotib oling, keyin soting
6. **To'lovlar** - Har bir hisob-fakturadan keyin to'lov qiling
7. **Inventory avtomatik** - Qabul va yetkazib berishda avtomatik yangilanadi

---

## 📞 Yordam

Agar qiyinchilik yuzaga kelsa:
1. Ketma-ketlikni tekshiring
2. Barcha majburiy maydonlar to'ldirilganligini tekshiring
3. Omborda yetarli tovar borligini tekshiring
4. Hamkor va mahsulot mavjudligini tekshiring

**Muvaffaqiyatli ishlashingizni tilaymiz!** 🚀
