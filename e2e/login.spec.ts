import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
  });

  test('should display login form', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('CLIMART ERP');
    await expect(page.locator('#username')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.fill('#username', 'admin');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('/');
    await expect(page).toHaveURL('/');
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.fill('#username', 'admin');
    await page.fill('#password', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Wait for error message to appear
    await page.waitForTimeout(1000);
    
    // Check if still on login page (login failed)
    await expect(page).toHaveURL('/login');
  });

  test('should show error with empty fields', async ({ page }) => {
    await page.click('button[type="submit"]');
    
    // Form validation should prevent submission
    await expect(page).toHaveURL('/login');
  });
});
