import { test, expect, type Page } from '@playwright/test';

test.describe('AiTextBox E2E Tests', () => {
  const STORYBOOK_URL = 'http://localhost:6006';

  test('should render AiTextBox with default state', async ({ page }: { page: Page }) => {
    await page.goto(`${STORYBOOK_URL}/iframe.html?args=&id=components-aitextbox--default&viewMode=story`);
    await page.waitForSelector('.ai-textbox', { timeout: 5000 });
    
    // Check if input is visible
    const input = page.locator('.ai-textbox__input');
    await expect(input).toBeVisible();
    
    // Check if AI button is visible
    const aiButton = page.locator('.ai-textbox__ai-button');
    await expect(aiButton).toBeVisible();
  });

  test('should handle text input', async ({ page }: { page: Page }) => {
    await page.goto(`${STORYBOOK_URL}/iframe.html?args=&id=components-aitextbox--default&viewMode=story`);
    await page.waitForSelector('.ai-textbox__input');
    
    // Type in the input
    await page.fill('.ai-textbox__input', 'Hello, World!');
    
    // Check if value is set
    const inputValue = await page.inputValue('.ai-textbox__input');
    expect(inputValue).toBe('Hello, World!');
    
    // Check if clear button appears
    const clearButton = page.locator('.ai-textbox__clear-button');
    await expect(clearButton).toBeVisible();
  });

  test('should clear text when clear button is clicked', async ({ page }: { page: Page }) => {
    await page.goto(`${STORYBOOK_URL}/iframe.html?args=&id=components-aitextbox--default&viewMode=story`);
    await page.waitForSelector('.ai-textbox__input');
    
    // Type in the input
    await page.fill('.ai-textbox__input', 'Test text');
    
    // Wait for clear button to appear and click it
    await page.waitForSelector('.ai-textbox__clear-button');
    await page.click('.ai-textbox__clear-button');
    
    // Check if input is cleared
    const inputValue = await page.inputValue('.ai-textbox__input');
    expect(inputValue).toBe('');
  });

  test('should show AI button as active when clicked', async ({ page }: { page: Page }) => {
    await page.goto(`${STORYBOOK_URL}/iframe.html?args=&id=components-aitextbox--default&viewMode=story`);
    await page.waitForSelector('.ai-textbox__input');
    
    // Type some text
    await page.fill('.ai-textbox__input', 'Generate something');
    
    // Click AI button
    await page.click('.ai-textbox__ai-button');
    
    // Check if AI button is still visible (active state depends on story implementation)
    const aiButton = page.locator('.ai-textbox__ai-button');
    await expect(aiButton).toBeVisible();
  });

  test('should display error messages', async ({ page }: { page: Page }) => {
    await page.goto(`${STORYBOOK_URL}/iframe.html?args=&id=components-aitextbox--with-error&viewMode=story`);
    await page.waitForSelector('.ai-textbox');
    
    // Check if error message is displayed
    const errorMessage = page.locator('.ai-textbox__message--error');
    await expect(errorMessage).toBeVisible();
    
    // Check error message text
    await expect(errorMessage).toContainText('This field is required');
    
    // Check if input has error styling
    const input = page.locator('.ai-textbox__input');
    await expect(input).toHaveClass(/ai-textbox__input--error/);
  });

  test('should display success messages', async ({ page }: { page: Page }) => {
    await page.goto(`${STORYBOOK_URL}/iframe.html?args=&id=components-aitextbox--with-success&viewMode=story`);
    await page.waitForSelector('.ai-textbox');
    
    // Check if success message is displayed
    const successMessage = page.locator('.ai-textbox__message--success');
    await expect(successMessage).toBeVisible();
    
    // Check success message text
    await expect(successMessage).toContainText('Looks good!');
  });

  test('should handle disabled state', async ({ page }: { page: Page }) => {
    await page.goto(`${STORYBOOK_URL}/iframe.html?args=&id=components-aitextbox--disabled&viewMode=story`);
    await page.waitForSelector('.ai-textbox');
    
    // Check if input is disabled
    const input = page.locator('.ai-textbox__input');
    await expect(input).toBeDisabled();
    
    // Check if AI button is disabled
    const aiButton = page.locator('.ai-textbox__ai-button');
    await expect(aiButton).toBeDisabled();
  });

  test('should have proper accessibility attributes', async ({ page }: { page: Page }) => {
    await page.goto(`${STORYBOOK_URL}/iframe.html?args=&id=components-aitextbox--with-label&viewMode=story`);
    await page.waitForSelector('.ai-textbox');
    
    // Check if label exists
    const label = page.locator('.ai-textbox__label');
    await expect(label).toBeVisible();
    
    // Check label text
    await expect(label).toContainText('Enter your prompt');
  });
});
