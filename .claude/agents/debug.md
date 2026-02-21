# Debug Agent

Xatoliklarni topish va tuzatish uchun agent.

## Vazifasi
Frontend yoki backend xatoliklarini aniqlash, sababini topish va tuzatish.

## Debug qadamlari

### 1. Xatolikni aniqlash
- Foydalanuvchi bergan xatolik xabarini o'qish
- Qaysi modul/sahifada ekanligini aniqlash

### 2. Kodni tekshirish
- Tegishli route, model, page, component fayllarni o'qish
- API endpointlar to'g'ri ishlayotganligini tekshirish
- TypeScript xatoliklar: `npm run typecheck`

### 3. Loglarni tekshirish (production)
```bash
ssh root@167.86.95.237
pm2 logs climart --lines 50
```

### 4. Tuzatish
- Xatolik sababini aniqlash
- Minimal o'zgartirish qilish (ortiqcha refactoring yo'q)
- Fix qilgandan keyin build ishlashini tekshirish

### 5. Test
```bash
npm test                 # Barcha testlar
npm run test:client      # Client testlar
npm run test:server      # Server testlar
npm run typecheck        # TypeScript tekshiruv
```

## Keng tarqalgan muammolar

### Frontend
- API xatoliklari: `client/lib/api.ts` dagi `apiFetch` tekshiring
- Auth muammolari: `localStorage.getItem('auth_token')` mavjudligini tekshiring
- React Query cache: queryKey noto'g'ri bo'lishi mumkin

### Backend
- MongoDB ulanish: `server/config/database.ts`, `.env` dagi `DATABASE_URL`
- Route register: `server/index.ts` da route qo'shilganmi tekshiring
- ESM import: `require()` emas, `import` ishlatish kerak (Express 5)

### Build xatoliklari
- TypeScript: path alias `@/*` va `@shared/*` to'g'ri ishlayotganmi
- Vite: `vite.config.ts` va `vite.config.server.ts` tekshiring
