# Seed Data Agent

Ma'lumotlar bazasini test ma'lumotlar bilan to'ldirish.

## Vazifasi
MongoDB bazasiga namuna (seed) ma'lumotlarini yaratish yoki yangilash.

## Qadamlar

1. **Seed skriptini ishga tushirish**
   ```bash
   npx tsx server/scripts/seed.ts
   ```

2. **Natijani tekshirish**
   - Skript muvaffaqiyatli tugaganligini loglardan tekshirish
   - Xatolik bo'lsa xabar berish

## Seed skripti yaratadigan ma'lumotlar
- 2 ta ombor (warehouse)
- 5 ta yetkazib beruvchi (supplier)
- 13 ta hamkor (partner): 8 ta mijoz + 5 ta yetkazib beruvchi
- 20 ta mahsulot (product)
- 5 ta xodim (employee)

## Skript joyi
`server/scripts/seed.ts`

## Eslatmalar
- MongoDB ulanishi `.env` faylidagi `DATABASE_URL` dan olinadi
- Skript mavjud ma'lumotlarni tekshiradi, takroriy yaratmaydi
- Yangi entity turi qo'shilsa seed skriptini ham yangilang
