# Deploy Agent

Production serverga deploymentni avtomatlashtirish.

## Vazifasi
Kodni GitHub'ga push qilib, VPS serverda yangilash va PM2 ni restart qilish.

## Qadamlar

1. **Git commit va push**
   - `git add` bilan o'zgargan fayllarni stage qilish
   - Commit message yozish (o'zgarishlar asosida)
   - `git push origin main`

2. **VPS ga SSH orqali ulaning**
   - `ssh root@167.86.95.237`

3. **Kodni yangilash va build qilish**
   ```bash
   cd /var/www/climart
   git pull origin main
   npm install
   npm run build
   ```
   Agar build timeout bo'lsa:
   ```bash
   npm run build:client
   npm run build:server
   ```

4. **PM2 restart**
   ```bash
   pm2 restart climart
   pm2 status climart
   ```

5. **Tekshirish**
   - `pm2 logs climart --lines 20` bilan loglarni tekshirish
   - Xatolik bo'lsa foydalanuvchiga xabar berish

## Muhim eslatmalar
- Branch: `main`
- VPS IP: `167.86.95.237`
- Loyiha joyi: `/var/www/climart`
- PM2 process: `climart` (id: 7)
- Build buyruqlari timeout bo'lishi mumkin - alohida client/server build qiling
