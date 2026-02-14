import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('#username', 'admin');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('should display main navigation menu', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Ko\'rsatkichlar').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Xaridlar').first()).toBeVisible();
    await expect(page.getByText('Savdo').first()).toBeVisible();
  });

  test('should navigate to dashboard indicators', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Click on Ko'rsatkichlar in navigation
    await page.getByText('Ko\'rsatkichlar').first().click();
    await page.waitForTimeout(500);
    
    // Click on submenu item
    const indicatorsLink = page.getByRole('link', { name: 'Ko\'rsatkichlar' }).first();
    if (await indicatorsLink.isVisible()) {
      await indicatorsLink.click();
      await page.waitForURL('/dashboard/indicators');
    }
  });

  test('should navigate to employees page', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.getByText('Xodimlar').click();
    await page.waitForURL('/employees');
    await expect(page.locator('h1')).toContainText('Xodimlar');
  });

  test('should display user menu', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    // Look for admin button in header
    await expect(page.getByRole('button').filter({ hasText: 'admin' })).toBeVisible({ timeout: 10000 });
  });

  test('should logout successfully', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Click on user menu button
    const userButton = page.getByRole('button').filter({ hasText: 'admin' });
    await userButton.click();
    
    // Click logout
    await page.getByText('Chiqish').click();
    
    // Should redirect to login page
    await page.waitForURL('/login');
    await expect(page.getByText('CLIMART ERP')).toBeVisible();
  });
});
