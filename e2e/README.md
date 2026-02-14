# E2E Tests with Playwright

Bu papkada Playwright yordamida yozilgan end-to-end testlar joylashgan.

## Test Fayllar

- `example.spec.ts` - Oddiy test namunasi (server talab qilmaydi)
- `login.spec.ts` - Login sahifasi testlari
- `dashboard.spec.ts` - Dashboard va ko'rsatkichlar testlari
- `employees.spec.ts` - Xodimlar boshqaruvi testlari
- `navigation.spec.ts` - Navigatsiya va logout testlari
- `auth.setup.ts` - Autentifikatsiya setup fayli

## Testlarni Ishga Tushirish

### 1. Serverni ishga tushiring (alohida terminal)

```bash
npm run dev
```

### 2. Testlarni ishga tushiring (boshqa terminal)

```bash
# Barcha testlarni ishga tushirish
npm run test:e2e

# UI mode bilan ishga tushirish (interaktiv)
npm run test:e2e:ui

# Brauzer ko'rinishida ishga tushirish
npm run test:e2e:headed

# Debug mode
npm run test:e2e:debug

# Bitta test faylini ishga tushirish
npx playwright test login.spec.ts

# Bitta testni ishga tushirish
npx playwright test -g "should login successfully"

# Oddiy test (server kerak emas)
npx playwright test example.spec.ts
```

## Test Hisoboti

Testlar tugagandan keyin HTML hisobot avtomatik ochiladi:

```bash
npx playwright show-report
```

## Yangi Test Yozish

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup code
    await page.goto('/login');
  });

  test('should do something', async ({ page }) => {
    // Test code
    await page.click('button');
    await expect(page.locator('h1')).toContainText('Expected Text');
  });
});
```

## Foydali Komandalar

```bash
# Testlarni qayta yozish (update snapshots)
npx playwright test --update-snapshots

# Faqat bitta brauzerda test
npx playwright test --project=chromium

# Parallel testlar soni
npx playwright test --workers=4

# Trace ko'rish
npx playwright show-trace trace.zip

# Codegen - test yozishda yordam beradi
npx playwright codegen http://localhost:8080
```

## Muhim Eslatmalar

1. **Server ishga tushirish**: Testlarni ishga tushirishdan oldin `npm run dev` bilan serverni ishga tushiring
2. **Admin kredensiyallari**: `admin` / `admin123`
3. **Test URL**: `http://localhost:8080`
4. **Screenshot va videolar**: Faqat xatolik bo'lganda saqlanadi
5. **Playwright UI**: `npm run test:e2e:ui` - eng qulay test yozish va debug qilish usuli

## Playwright Config

`playwright.config.ts` faylida quyidagi sozlamalar mavjud:

- `testDir`: Test fayllari joylashuvi (`./e2e`)
- `baseURL`: Asosiy URL (`http://localhost:8080`)
- `webServer`: Avtomatik server ishga tushirish (ixtiyoriy)
- `projects`: Qaysi brauzerlarda test qilish (chromium, firefox, webkit)

## Playwright Inspector

Debug qilish uchun:

```bash
npm run test:e2e:debug
```

Bu Playwright Inspector'ni ochadi va siz testni qadam-baqadam ko'rishingiz mumkin.
