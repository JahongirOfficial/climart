# 🛒 Climart Savdo Tizimidan Foydalanish Qo'llanmasi

Ushbu qo'llanma real hayotiy senariy asosida dasturdan qanday foydalanishni tushuntiradi. 

**Senariy:**
1. Omborga yangi tovarlar keldi (Kirim qilish).
2. Do'konga mijoz keldi va tovar sotib oldi (Sotuv).
3. Mijozga va omborchiga chek chiqarish.
4. Va mahsulot tarixini tekshirish.

---

## 1-QADAM: Omborga Tovar Qabul Qilish (Kirim)

**Vaziyat:** Sizga yetkazib beruvchi (Masalan: "Samsung Distributor") 50 ta konditsioner va 100 metr mis quvur olib keldi. Buni tizimga kiritishingiz kerak.

1. **Menyudan tanlang:** Chap tomondagi menyudan **"Ombor"** (Warehouse) -> **"Kirim"** (Receipts) bo'limiga o'ting.
2. **Yangi kirim:** O'ng yuqoridagi **"Yangi qabul"** tugmasini bosing.
3. **Formani to'ldiring:**
   - **Yetkazib beruvchi:** Kimdan tovar kelganini tanlang (yoki yangi qo'shing).
   - **Ombor:** Tovarlar qaysi omborga tushayotganini tanlang (Masalan: "Asosiy Ombor"). *Bu juda muhim, chunki zaxira shu omborga qo'shiladi.*
   - **Sana:** Bugungi sana avtomatik qo'yiladi.
4. **Tovarlarni qo'shing:**
   - Mahsulot nomini tanlang (Masalan: "Konditsioner 12").
   - **Miqdor:** 50 dona.
   - **Tan narx:** Kelish narxini kiriting (sotish narxini emas!).
   - "Qo'shish" tugmasi orqali boshqa tovarlarni ham (mis quvur) kiriting.
5. **Saqlash:** "Saqlash" tugmasini bosing.

✅ **Natija:** "Asosiy Ombor"da konditsionerlar soni 50 taga ko'paydi. Tan narx o'rtacha qiymat (weighted average) bo'yicha yangilandi.

---

## 2-QADAM: Mijozga Sotish (Savdo)

**Vaziyat:** Do'konga "Alijon" ismli mijoz keldi va 2 ta konditsioner sotib olmoqchi.

1. **Menyudan tanlang:** Chap tomondagi menyudan **"Sotuv"** (Sales) -> **"Mijoz hisob-fakturalari"** (Customer Invoices) bo'limiga o'ting.
2. **Yangi sotuv:** **"Yangi hisob-faktura"** tugmasini bosing.
3. **Mijozni tanlang:**
   - **Mijoz:** "Alijon"ni tanlang (yoki + tugmasi bilan yangi qo'shing).
   - **Ombor:** Qaysi ombordan sotayotganingizni tanlang (Masalan: "Asosiy Ombor"). Tizim shu ombordagi qoldiqni tekshiradi.
4. **Tovarlarni savatga qo'shing:**
   - Mahsulotni tanlang: "Konditsioner 12".
   - Tizim sizga **"Mavjud: 50 ta"** deb ko'rsatadi.
   - **Miqdor:** 2 ta yozing.
   - **Narx:** Tizim avtomatik belgilangan sotuv narxini qo'yadi (siz uni o'zgartirishingiz mumkin).
5. **Saqlash:** "Saqlash" tugmasini bosing.

✅ **Natija:**
- "Asosiy Ombor"dan 2 ta konditsioner ayirildi.
- "Alijon"ning qarzi paydo bo'ldi (agar darhol to'lamasa).
- Sizda foyda hisoblandi (Sotuv narxi - Tan narx).

---

## 3-QADAM: Chek Chiqarish va To'lov

**Vaziyat:** Sotuv amalga oshdi. Endi mijozga chek berish kerak va omborchi tovar chiqarishi uchun unga ham hujjat kerak.

1. **Chek chiqarish:**
   - Ro'yxatdagi yangi qo'shilgan invoys qatorida **Printer** belgisini (🖨️) bosing.
   - Tizim ketma-ket **2 xil chek** tayyorlaydi:
     1. **Mijoz cheki:** Narxlar va yakuniy summa bilan (Mijozga beriladi).
     2. **Ombor cheki:** Faqat soni va mahsulot nomi bilan (Omborchiga tovar tayyorlash uchun beriladi).
2. **To'lov qabul qilish:**
   - Mijoz pul to'laganda, ro'yxatdagi **Dollar ($)** belgisini bosing.
   - Summani va to'lov turini (Naqd, Karta) kiritib "Saqlash"ni bosing.
   - Invoys statusi "To'langan" (Paid) ga o'zgaradi.

---

## 4-QADAM: Tarix va Tahlil

**Vaziyat:** Oradan vaqt o'tib, ushbu konditsioner qachon kelgan va qachon sotilganini bilmoqchisiz.

1. **Mahsulotlar ro'yxatiga o'ting:** "Mahsulotlar" -> "Ro'yxat".
2. **Tarixni ko'rish:** Kerakli mahsulot qatoridagi **Soat (Tarix)** belgisini bosing.
3. **Yangi oynada:**
   - Siz barcha harakatlarni ko'rasiz:
   - 🟢 *Kirim: +50 ta (Samsung Distributor)* - Sana: ...
   - 🔴 *Chiqim: -2 ta (Mijoz: Alijon)* - Sana: ...
   - Hozirgi qoldiq va jami aylanmani ko'rishingiz mumkin.

---

## Maslahatlar 💡

- **Tezlik:** Tizimda "Skeleton" yuklash rejimi bor. Ma'lumot ko'p bo'lsa ham dastur qotmaydi.
- **Qidiruv:** Har qanday ro'yxatda (mahsulot, mijoz) yuqoridagi qidiruv maydonidan foydalaning.
- **Kam qolgan tovarlar:** Mahsulotlar ro'yxatida qizil yoki sariq rang bilan belgilangan tovarlarga e'tibor bering, ular tugayapti.
