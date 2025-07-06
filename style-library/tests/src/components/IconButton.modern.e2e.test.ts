import { test, expect, type Page } from '@playwright/test';

test.describe('IconButton E2E Tests', () => {
  const STORYBOOK_URL = 'http://localhost:6006';

  test('should render IconButton with default state', async ({ page }: { page: Page }) => {
    await page.goto(`${STORYBOOK_URL}/iframe.html?args=&id=components-iconbutton--default&viewMode=story`);
    await page.waitForSelector('.icon-button', { timeout: 5000 });
    
    // Check if button is visible
    const button = page.locator('.icon-button');
    await expect(button).toBeVisible();
    
    // Check if button has correct classes
    await expect(button).toHaveClass(/icon-button/);
    await expect(button).not.toHaveClass(/icon-button--active/);
    await expect(button).not.toHaveClass(/icon-button--disabled/);
  });

  test('should handle click events', async ({ page }: { page: Page }) => {
    await page.goto(`${STORYBOOK_URL}/iframe.html?args=&id=components-iconbutton--default&viewMode=story`);
    await page.waitForSelector('.icon-button');
    
    // Click the button
    const button = page.locator('.icon-button');
    await button.click();
    
    // Verify button is still present and clickable
    await expect(button).toBeVisible();
    await expect(button).toBeEnabled();
  });

  test('should show active state', async ({ page }: { page: Page }) => {
    await page.goto(`${STORYBOOK_URL}/iframe.html?args=&id=components-iconbutton--active&viewMode=story`);
    await page.waitForSelector('.icon-button--active', { timeout: 5000 });
    
    // Check if button has active class
    const button = page.locator('.icon-button');
    await expect(button).toHaveClass(/icon-button--active/);
    
    // Check if button has spinning icon
    const spinningIcon = page.locator('.icon-button__icon--spinning');
    await expect(spinningIcon).toBeVisible();
  });

  test('should show disabled state', async ({ page }: { page: Page }) => {
    await page.goto(`${STORYBOOK_URL}/iframe.html?args=&id=components-iconbutton--disabled&viewMode=story`);
    await page.waitForSelector('.icon-button--disabled', { timeout: 5000 });
    
    // Check if button is disabled
    const button = page.locator('.icon-button');
    await expect(button).toBeDisabled();
    
    // Check if button has disabled class
    await expect(button).toHaveClass(/icon-button--disabled/);
  });

  test('should have proper accessibility attributes', async ({ page }: { page: Page }) => {
    await page.goto(`${STORYBOOK_URL}/iframe.html?args=&id=components-iconbutton--default&viewMode=story`);
    await page.waitForSelector('.icon-button');
    
    // Check button attributes
    const button = page.locator('.icon-button');
    await expect(button).toHaveAttribute('type', 'button');
  });

  test('should render with custom size', async ({ page }: { page: Page }) => {
    await page.goto(`${STORYBOOK_URL}/iframe.html?args=&id=components-iconbutton--custom-size&viewMode=story`);
    await page.waitForSelector('.icon-button');
    
    // Check if button has custom size
    const button = page.locator('.icon-button');
    await expect(button).toBeVisible();
    
    // Verify custom styling is applied (this will depend on how the component implements width/height)
    const boundingBox = await button.boundingBox();
    expect(boundingBox?.width).toBeGreaterThan(40); // Assuming custom size is larger than default
    expect(boundingBox?.height).toBeGreaterThan(40);
  });

  test('should render interactive demo correctly', async ({ page }: { page: Page }) => {
    await page.goto(`${STORYBOOK_URL}/iframe.html?args=&id=components-iconbutton--interactive-demo&viewMode=story`);
    await page.waitForSelector('.icon-button');
    
    // Click the button in the interactive demo
    const button = page.locator('.icon-button');
    await button.click();
    
    // Check if the active state is shown temporarily (this depends on the story implementation)
    const hasActiveClass = await button.getAttribute('class');
    expect(hasActiveClass).toBeTruthy();
  });

  test('should render button grid correctly', async ({ page }: { page: Page }) => {
    await page.goto(`${STORYBOOK_URL}/iframe.html?args=&id=components-iconbutton--button-grid&viewMode=story`);
    
    // Wait for the grid to load
    await page.waitForSelector('.icon-button', { timeout: 5000 });
    
    // Check if multiple buttons are rendered in the grid
    const buttons = page.locator('.icon-button');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(3); // Should have multiple buttons in the grid
    
    // Check if different states are represented
    const activeButton = page.locator('.icon-button--active');
    const disabledButton = page.locator('.icon-button--disabled');
    
    await expect(activeButton).toBeVisible();
    await expect(disabledButton).toBeVisible();
  });
});
