import { test as setup, expect } from '@playwright/test';

const authFile = 'e2e/.auth/user.json';

setup('authenticate as admin', async ({ page }) => {
  await page.goto('/login');
  
  await page.fill('input[name="identifier"]', 'admin');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');
  
  await page.waitForURL('/');
  await expect(page.locator('h1')).toContainText('Ko\'rsatkichlar');
  
  await page.context().storageState({ path: authFile });
});
