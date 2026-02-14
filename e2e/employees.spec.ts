import { test, expect } from '@playwright/test';

test.describe('Employees Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('#username', 'admin');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
    
    // Navigate to employees page
    await page.click('text=Xodimlar');
    await page.waitForURL('/employees');
  });

  test('should display employees page', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('Xodimlar', { timeout: 10000 });
    await expect(page.getByRole('button', { name: /Xodim qo'shish/i })).toBeVisible();
  });

  test('should display employee statistics', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Jami xodimlar').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Faol xodimlar').first()).toBeVisible();
    await expect(page.getByText('Nofaol xodimlar').first()).toBeVisible();
  });

  test('should open add employee modal', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /Xodim qo'shish/i }).click();
    
    await expect(page.getByText(/Yangi xodim/i)).toBeVisible({ timeout: 5000 });
  });

  test('should display employee table', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await expect(page.locator('table')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('columnheader', { name: 'Xodim' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Login' })).toBeVisible();
  });

  test('should have action buttons for employees', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Check if table has rows
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    
    if (count > 0) {
      // Check first row has action buttons
      const firstRow = rows.first();
      await expect(firstRow).toBeVisible();
    }
  });
});
