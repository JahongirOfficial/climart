# 📊 TEZSTAR ERP - NAVIGATSIYA STRUKTURASI

## 🎯 ASOSIY MODULLAR VA SUBDOMAINLAR

### 1️⃣ **Ko'rsatkichlar** (Dashboard)
- 📈 Ko'rsatkichlar - `/dashboard/indicators`
- 📄 Hujjatlar - `/dashboard/documents`
- 🛒 Korzina - `/dashboard/cart`
- 🔍 Audit - `/dashboard/audit`
- 📁 Fayllar - `/dashboard/files`

---

### 2️⃣ **Xaridlar** (Purchases)
- 📝 Ta'minotchiga buyurtma yaratish - `/purchases/orders`
- 💰 Taminotchiga to'lov qilish - `/purchases/suppliers-accounts`
- 📦 Qabul qilish - `/purchases/receipts`
- ↩️ Tovar qaytarish - `/purchases/returns`
- 🧾 Qabul qilingan schot fakturalar - `/purchases/received-invoices`
- 🔄 Zakazlar bilan ishlash - `/purchases/procurement`
- 💳 Mening qarzlarim - `/purchases/my-debts`

---

### 3️⃣ **Savdo** (Sales)
- 🛍️ Mijozlarning buyurtmalari - `/sales/customer-orders`
- 📋 Xaridorlarning to'lov fakturalari - `/sales/customer-invoices`
- 🚚 Yuklab yuborish - `/sales/shipments`
- 📜 Berilgan hisob-fakturalar - `/sales/tax-invoices`
- 💵 Mendan qarzdorlar - `/sales/customer-debts`
- 🔙 Tovarni qaytarib olish - `/sales/returns`
- 📊 Qaytarilgan mahsulot hisboti - `/sales/returns-report`
- 💹 Foydalilik - `/sales/profitability`

---

### 4️⃣ **Tovarlar** (Products)
- 📦 Mahsulotlar - `/products/list`
- 🛠️ Xizmatlar - `/products/services`
- 💲 Narxlar ro'yhati - `/products/price-lists`
- 🔢 Seriya raqamlar - `/products/serial-numbers`

---

### 5️⃣ **Kontragentlar** (Contacts)
- 🤝 Hamkorlar - `/contacts/partners`
- 📑 Shartnomalar - `/contacts/contracts`
- 💬 Telegram - `/contacts/telegram`

---

### 6️⃣ **Ombor** (Warehouse)
- ⬇️ Kirim qilish - `/warehouse/receipt`
- ⬆️ Chiqim qilish - `/warehouse/expense`
- 🔄 Ko'chirish - `/warehouse/transfer`
- ❌ Xatlov - `/warehouse/writeoff`
- 📋 Ichki zakaz - `/warehouse/internal-order`
- 📊 Qoldiq - `/warehouse/balance`
- 🔁 Aylanma - `/warehouse/turnover`
- 🏢 Omborlar - `/warehouse/warehouses`

---

### 7️⃣ **Pul** (Finance)
- 💳 To'lovlar - `/finance/payments`
- 💰 Pul Aylanmasi - `/finance/cashflow`
- 📈 Foyda va zarar - `/finance/profit-loss`
- 🔄 O'zaro hisob kitob - `/finance/mutual-settlements`

---

### 8️⃣ **Pul aylanmasi** (Cash Flow)
- 💸 Pul aylanmasi - `/cashflow`
*(Submenu yo'q)*

---

### 9️⃣ **Chakana savdo** (Retail)
- 🏪 Savdo kanallari - `/retail/channels`
- 📊 Har bitta kanal statistikasi - `/retail/statistics`

---

### 🔟 **Onlayn savdo** (E-commerce)
- 🌐 Onlayn savdo - `/ecommerce`
*(Submenu yo'q)*

---

### 1️⃣1️⃣ **Ishlab chiqarish** (Production)
- 🏭 Ishlab chiqarish - `/production`
*(Submenu yo'q)*

---

### 1️⃣2️⃣ **Vazifalar** (Tasks)
- ➕ Vazifa qo'shish - `/tasks/add`
- 📝 Mening vazifalarim - `/tasks/my-tasks`

---

### 1️⃣3️⃣ **Yechimlar** (Solutions)
- 👥 Xodimlar qo'shish - `/solutions/add-employee`
- 📊 Xodimlarni o'qish ko'rsatkichlari - `/solutions/employee-performance`
- 🎯 KPI qo'yish imkoniyati - `/solutions/kpi`

---

## �️ BACKEND API ROUTE'LAR

### Dashboard Routes
- `GET /api/dashboard/stats` - Dashboard statistikasi

### Purchase Routes
- `GET /api/purchase-orders` - Xarid buyurtmalari ro'yxati
- `POST /api/purchase-orders` - Yangi xarid buyurtmasi
- `GET /api/receipts` - Qabul qilishlar ro'yxati
- `POST /api/receipts` - Yangi qabul qilish
- `GET /api/supplier-invoices` - Ta'minotchi fakturalari
- `POST /api/supplier-invoices` - Yangi faktura
- `GET /api/supplier-returns` - Qaytarishlar ro'yxati
- `POST /api/supplier-returns` - Yangi qaytarish
- `GET /api/debts` - Qarzlar ro'yxati

### Sales Routes
- `GET /api/customer-orders` - Mijoz buyurtmalari
- `POST /api/customer-orders` - Yangi buyurtma
- `GET /api/customer-invoices` - Mijoz fakturalari
- `POST /api/customer-invoices` - Yangi faktura
- `GET /api/shipments` - Yuborishlar ro'yxati
- `POST /api/shipments` - Yangi yuborish
- `GET /api/tax-invoices` - Soliq fakturalari
- `POST /api/tax-invoices` - Yangi soliq fakturasi
- `GET /api/customer-debts` - Mijoz qarzlari
- `GET /api/customer-returns` - Mijoz qaytarishlari
- `POST /api/customer-returns` - Yangi qaytarish
- `GET /api/returns-report` - Qaytarishlar hisoboti
- `GET /api/profitability` - Foydalilik hisoboti

### Product Routes
- `GET /api/products` - Mahsulotlar ro'yxati
- `POST /api/products` - Yangi mahsulot
- `PUT /api/products/:id` - Mahsulotni yangilash
- `DELETE /api/products/:id` - Mahsulotni o'chirish
- `GET /api/services` - Xizmatlar ro'yxati
- `POST /api/services` - Yangi xizmat

### Partner Routes
- `GET /api/partners` - Hamkorlar ro'yxati
- `POST /api/partners` - Yangi hamkor
- `PUT /api/partners/:id` - Hamkorni yangilash
- `DELETE /api/partners/:id` - Hamkorni o'chirish
- `GET /api/contracts` - Shartnomalar ro'yxati
- `POST /api/contracts` - Yangi shartnoma

### Warehouse Routes
- `GET /api/warehouses` - Omborlar ro'yxati
- `POST /api/warehouses` - Yangi ombor
- `GET /api/warehouse-receipts` - Ombor qabullar
- `POST /api/warehouse-receipts` - Yangi qabul
- `GET /api/writeoffs` - Xatlovlar ro'yxati
- `POST /api/writeoffs` - Yangi xatlov
- `GET /api/inventory` - Inventarizatsiya
- `GET /api/balance` - Qoldiqlar
- `GET /api/turnover` - Aylanma

### Finance Routes
- `GET /api/payments` - To'lovlar ro'yxati
- `POST /api/payments` - Yangi to'lov
- `GET /api/cash-flow` - Pul aylanmasi
- `GET /api/profit-loss` - Foyda-zarar
- `GET /api/mutual-settlements` - O'zaro hisob-kitob

---

## 📊 STATISTIKA

**Jami Asosiy Modullar:** 13 ta
**Jami Subdomain'lar:** 51 ta
**Jami Frontend Route'lar:** 64 ta
**Jami Backend API Route'lar:** 45+ ta

---
