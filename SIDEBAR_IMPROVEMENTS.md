# Sidebar Dizayni Yaxshilandi

## O'zgarishlar

### 1. Guruhlar bo'yicha tashkillangan
Sidebar endi mantiqiy guruhlarga bo'lingan:
- **Asosiy** - Ko'rsatkichlar (Dashboard)
- **Savdo** - Xaridlar, Savdo, Chakana, Onlayn
- **Mahsulotlar** - Tovarlar, Ombor, Ishlab chiqarish
- **Boshqaruv** - Kontragentlar, Moliya, Vazifalar, Sozlamalar

### 2. Professional dizayn elementlari

#### Guruh sarlavhalari
- Kichik, uppercase matn
- Och kulrang rang
- Faqat ochiq holatda ko'rinadi
- Tracking-wider bilan

#### Bo'limlar orasida ajratuvchi
- Yig'ilgan holatda guruhlar orasida nozik chiziq
- Vizual ajratish uchun

#### Faol ko'rsatkich
- Chap tomonda vertikal ko'k chiziq
- 8px balandlik
- 3px border-radius
- Smooth ko'rinish

### 3. Hover effektlari

#### Ochiq holat
- Background: #F3F6FA
- Matn rangi o'zgaradi
- Icon rangi o'zgaradi
- 150ms smooth transition

#### Yig'ilgan holat
- Tooltip paydo bo'ladi
- Qora background (#gray-900)
- Oq matn
- Ikki qatorli ma'lumot (nom + subtitle)
- O'q (arrow) bilan
- Smooth fade-in/out

### 4. Spacing va padding
- Har bir element orasida 0.5px gap
- Ichki padding: 2.5 (py-2.5)
- Guruhlar orasida 4 (mb-4)
- Umumiy padding: 4 (py-4)

### 5. Scrollbar
- Nozik (4px)
- Och kulrang
- Hover da quyuqroq
- Smooth ko'rinish

### 6. Toggle tugmasi
- Yuqoriroq joylashgan (top-6)
- Nozik border
- Hover da rang o'zgaradi
- Icon o'lchami: 3.5 (h-3.5 w-3.5)

### 7. Shadow
- Sidebar ga nozik shadow qo'shildi
- Professional ko'rinish

## ERP qoidalariga muvofiqlik

✅ 3px border-radius
✅ Faqat rang o'zgarishi hover da
✅ Hech qanday scale animatsiyasi yo'q
✅ 150ms transition
✅ To'rtburchak shakllar
✅ Professional spacing
✅ Bir-biriga xalal bermaydi
✅ Fixed z-index layering

## Foydalanish

Sidebar avtomatik ravishda:
- Yig'iladi/ochiladi toggle tugmasi orqali
- Tooltip ko'rsatadi yig'ilgan holatda
- Guruhlarni ajratadi
- Faol sahifani ko'rsatadi

## Texnik detallar

- Context API orqali holat boshqaruvi
- Smooth transitions (150ms ease-in-out)
- Responsive dizayn
- Accessibility (aria-label, title)
- TypeScript type safety
