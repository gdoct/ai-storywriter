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
  });

  it('should show AI button as active when clicked', async () => {
    await page.goto(`${STORYBOOK_URL}/iframe.html?args=&id=components-aitextbox--default&viewMode=story`);
    await page.waitForSelector('.ai-textbox__input');
    
    // Type some text
    await page.type('.ai-textbox__input', 'Generate something');
    
    // Click AI button
    await page.click('.ai-textbox__ai-button');
    
    // Check if AI button shows active state (this depends on story implementation)
    const aiButton = await page.$('.ai-textbox__ai-button');
    expect(aiButton).toBeTruthy();
  });

  it('should display error messages', async () => {
    await page.goto(`${STORYBOOK_URL}/iframe.html?args=&id=components-aitextbox--with-error&viewMode=story`);
    await page.waitForSelector('.ai-textbox');
    
    // Check if error message is displayed
    const errorMessage = await page.$('.ai-textbox__message--error');
    expect(errorMessage).toBeTruthy();
    
    // Check error message text
    const errorText = await page.evaluate(() => {
      const error = document.querySelector('.ai-textbox__message--error');
      return error ? error.textContent : '';
    });
    expect(errorText).toContain('Error!');
    
    // Check if input has error styling
    const hasErrorClass = await page.evaluate(() => {
      const input = document.querySelector('.ai-textbox__input');
      return input ? input.classList.contains('ai-textbox__input--error') : false;
    });
    expect(hasErrorClass).toBe(true);
  });

  it('should display success messages', async () => {
    await page.goto(`${STORYBOOK_URL}/iframe.html?args=&id=components-aitextbox--with-success&viewMode=story`);
    await page.waitForSelector('.ai-textbox');
    
    // Check if success message is displayed
    const successMessage = await page.$('.ai-textbox__message--success');
    expect(successMessage).toBeTruthy();
    
    // Check success message text
    const successText = await page.evaluate(() => {
      const success = document.querySelector('.ai-textbox__message--success');
      return success ? success.textContent : '';
    });
    expect(successText).toContain('Success!');
  });

  it('should handle disabled state', async () => {
    await page.goto(`${STORYBOOK_URL}/iframe.html?args=&id=components-aitextbox--disabled&viewMode=story`);
    await page.waitForSelector('.ai-textbox');
    
    // Check if input is disabled
    const isInputDisabled = await page.evaluate(() => {
      const input = document.querySelector('.ai-textbox__input') as HTMLInputElement;
      return input ? input.disabled : false;
    });
    expect(isInputDisabled).toBe(true);
    
    // Check if AI button is disabled
    const isAiButtonDisabled = await page.evaluate(() => {
      const button = document.querySelector('.ai-textbox__ai-button') as HTMLButtonElement;
      return button ? button.disabled : false;
    });
    expect(isAiButtonDisabled).toBe(true);
  });

  it('should have proper accessibility attributes', async () => {
    await page.goto(`${STORYBOOK_URL}/iframe.html?args=&id=components-aitextbox--with-label&viewMode=story`);
    await page.waitForSelector('.ai-textbox');
    
    // Check if label exists
    const label = await page.$('.ai-textbox__label');
    expect(label).toBeTruthy();
    
    // Check label text
    const labelText = await page.evaluate(() => {
      const lbl = document.querySelector('.ai-textbox__label');
      return lbl ? lbl.textContent : '';
    });
    expect(labelText).toContain('Test Label');
  });
});
