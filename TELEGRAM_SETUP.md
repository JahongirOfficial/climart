# Telegram Integratsiyasi - Sozlash Qo'llanmasi

## 1. Telegram API Kalitlarini Olish

1. [my.telegram.org](https://my.telegram.org) saytiga kiring
2. Telefon raqamingiz bilan tizimga kiring
3. "API development tools" bo'limiga o'ting
4. Agar ilova yaratmagan bo'lsangiz, yangi ilova yarating:
   - **App title**: Istalgan nom (masalan: "Climart CRM")
   - **Short name**: Qisqa nom (masalan: "climart")
   - **Platform**: Desktop
5. Quyidagi ma'lumotlarni saqlang:
   - **api_id**: Raqam (masalan: 12345678)
   - **api_hash**: Matn (masalan: 0123456789abcdef0123456789abcdef)

## 2. Tizimga Kirish

1. Ilovada Telegram sahifasiga o'ting
2. Quyidagi ma'lumotlarni kiriting:
   - **API ID**: my.telegram.org dan olgan api_id
   - **API Hash**: my.telegram.org dan olgan api_hash
   - **Telefon raqam**: +998901234567 formatida
3. "Kod yuborish" tugmasini bosing
4. Telegram ilovasiga kelgan 5 xonali kodni kiriting
5. Agar 2FA (ikki bosqichli autentifikatsiya) yoqilgan bo'lsa, parolingizni kiriting

## 3. Xususiyatlar

### ✅ Haqiqiy Telegram API
- Haqiqiy chatlar ro'yxati
- Haqiqiy xabarlar
- Xabar yuborish va qabul qilish
- Online holatni ko'rish
- O'qilmagan xabarlar soni

### ✅ Xavfsizlik
- Sessiyalar serverda saqlanadi
- Har bir foydalanuvchi uchun alohida client
- Avtomatik disconnect chiqishda

### ✅ Qo'llab-quvvatlash
- Shaxsiy chatlar
- Guruhlar
- Kanallar
- 2FA qo'llab-quvvatlash

## 4. Muhim Eslatmalar

⚠️ **API kalitlarini hech kimga bermang!**
⚠️ **API kalitlarni .env faylida saqlang (production uchun)**
⚠️ **Sessiyalar xotirada saqlanadi - production uchun database ishlatish kerak**

## 5. Production uchun Tavsiyalar

1. **Sessiyalarni database'da saqlash**
   ```typescript
   // MongoDB yoki boshqa database ishlatish
   const session = await SessionModel.findOne({ userId });
   ```

2. **API kalitlarni .env faylida saqlash**
   ```env
   TELEGRAM_API_ID=12345678
   TELEGRAM_API_HASH=0123456789abcdef0123456789abcdef
   ```

3. **Rate limiting qo'shish**
   ```typescript
   // Telegram API cheklovlarini hisobga olish
   // 30 ta xabar / soniyada
   ```

4. **Xatoliklarni to'g'ri boshqarish**
   ```typescript
   // FloodWaitError, SessionRevokedError va boshqalar
   ```

## 6. Muammolarni Hal Qilish

### Kod kelmayapti
- Telefon raqam to'g'ri formatda ekanligini tekshiring (+998...)
- API ID va API Hash to'g'ri ekanligini tekshiring
- Telegram ilovasida spam filtri yoqilmaganligini tekshiring

### "Session revoked" xatosi
- Qaytadan tizimga kiring
- Eski sessiyalarni tozalang

### "Flood wait" xatosi
- Juda ko'p so'rov yuborilgan
- Bir necha daqiqa kuting

## 7. Qo'shimcha Ma'lumot

- [Telegram API Hujjatlari](https://core.telegram.org/api)
- [GramJS Hujjatlari](https://gram.js.org/)
- [Telegram Bot API](https://core.telegram.org/bots/api)
