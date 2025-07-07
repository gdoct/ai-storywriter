import { expect, test } from '@playwright/test';

test.describe('App Basic Tests', () => {
  test('should load the application and display anonymous page', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check that the page has loaded successfully
    await expect(page).toHaveTitle(/StoryWriter/);
    
    // Check that the page is accessible (no 404 or server errors)
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    
    // Check that the page contains expected content for anonymous users
    // This could be a login button, hero section, or other public content
    const loginButton = await page.$('text=Login');
    expect(loginButton).toBeTruthy();    
    // Check that the page has rendered some content
    const bodyContent = await page.textContent('body');
    expect(bodyContent).not.toBe('');
    expect(bodyContent).not.toBeNull();
  });
});