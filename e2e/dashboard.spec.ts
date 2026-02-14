import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('#username', 'admin');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('should display dashboard with statistics', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if we're on dashboard
    await expect(page).toHaveURL('/');
    
    // Check KPI cards are visible (with more flexible selectors)
    await expect(page.getByText('Umumiy tushum')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Sof foyda')).toBeVisible();
    await expect(page.getByText('O\'rtacha chek')).toBeVisible();
  });

  test('should switch between time periods', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Click on different period buttons
    const kunButton = page.getByRole('button', { name: 'Kun' });
    const haftaButton = page.getByRole('button', { name: 'Hafta' });
    const oyButton = page.getByRole('button', { name: 'Oy' });
    const yilButton = page.getByRole('button', { name: 'Yil' });
    
    await kunButton.click();
    await page.waitForTimeout(500);
    
    await haftaButton.click();
    await page.waitForTimeout(500);
    
    await oyButton.click();
    await page.waitForTimeout(500);
    
    await yilButton.click();
    await page.waitForTimeout(500);
  });

  test('should display debt information', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Debitorlik qarzi')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Kreditorlik qarzi')).toBeVisible();
  });

  test('should display warehouse information', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Tovar qoldiqlari')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Ombor qiymati')).toBeVisible();
  });

  test('should display top products and suppliers', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Top-5 Mahsulotlar')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Top-5 Yetkazib beruvchilar')).toBeVisible();
  });
});
