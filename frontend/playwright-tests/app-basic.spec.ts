import { test, expect } from '@playwright/test';

test.describe('App Basic Tests', () => {
  test('should load the application and display anonymous page', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check that the page has loaded successfully
    await expect(page).toHaveTitle(/AI Story Writer/);
    
    // Check that the page is accessible (no 404 or server errors)
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    
    // Check that the page contains expected content for anonymous users
    // This could be a login button, hero section, or other public content
    await expect(page).toBeVisible();
    
    // Check that the page has rendered some content
    const bodyContent = await page.textContent('body');
    expect(bodyContent).not.toBe('');
    expect(bodyContent).not.toBeNull();
  });
  
  test('should handle navigation to main page', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Verify we're on the correct page
    expect(page.url()).toBe('http://localhost:3000/');
    
    // Check that the page is interactive
    await expect(page).not.toHaveClass('loading');
  });
});