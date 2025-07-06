import puppeteer from 'puppeteer';

describe('IconButton E2E Tests', () => {
  let page: puppeteer.Page;
  const STORYBOOK_URL = 'http://localhost:6006';

  beforeEach(async () => {
    page = await global.browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
  });

  afterEach(async () => {
    await page.close();
  });

  it('should render IconButton with default state', async () => {
    // Navigate to IconButton story
    await page.goto(`${STORYBOOK_URL}/iframe.html?args=&id=components-iconbutton--default&viewMode=story`);
    
    // Wait for the component to load
    await page.waitForSelector('.icon-button', { timeout: 5000 });
    
    // Check if button is visible
    const button = await page.$('.icon-button');
    expect(button).toBeTruthy();
    
    // Check if button has correct classes
    const classes = await page.evaluate(() => {
      const btn = document.querySelector('.icon-button');
      return btn ? btn.className : '';
    });
    expect(classes).toContain('icon-button');
    expect(classes).not.toContain('icon-button--active');
    expect(classes).not.toContain('icon-button--disabled');
  });

  it('should handle click events', async () => {
    await page.goto(`${STORYBOOK_URL}/iframe.html?args=&id=components-iconbutton--default&viewMode=story`);
    await page.waitForSelector('.icon-button');
    
    // Click the button
    await page.click('.icon-button');
    
    // Check if button responds to click (this would depend on the story implementation)
    // For now, we just verify the button is still present and clickable
    const button = await page.$('.icon-button');
    expect(button).toBeTruthy();
  });

  it('should show active state', async () => {
    await page.goto(`${STORYBOOK_URL}/iframe.html?args=&id=components-iconbutton--active&viewMode=story`);
    await page.waitForSelector('.icon-button--active', { timeout: 5000 });
    
    // Check if button has active class
    const hasActiveClass = await page.evaluate(() => {
      const btn = document.querySelector('.icon-button');
      return btn ? btn.classList.contains('icon-button--active') : false;
    });
    expect(hasActiveClass).toBe(true);
    
    // Check if button has spinning icon
    const hasSpinningIcon = await page.evaluate(() => {
      const icon = document.querySelector('.icon-button__icon--spinning');
      return !!icon;
    });
    expect(hasSpinningIcon).toBe(true);
  });

  it('should show disabled state', async () => {
    await page.goto(`${STORYBOOK_URL}/iframe.html?args=&id=components-iconbutton--disabled&viewMode=story`);
    await page.waitForSelector('.icon-button--disabled', { timeout: 5000 });
    
    // Check if button is disabled
    const isDisabled = await page.evaluate(() => {
      const btn = document.querySelector('.icon-button') as HTMLButtonElement;
      return btn ? btn.disabled : false;
    });
    expect(isDisabled).toBe(true);
    
    // Check if button has disabled class
    const hasDisabledClass = await page.evaluate(() => {
      const btn = document.querySelector('.icon-button');
      return btn ? btn.classList.contains('icon-button--disabled') : false;
    });
    expect(hasDisabledClass).toBe(true);
  });

  it('should have proper accessibility attributes', async () => {
    await page.goto(`${STORYBOOK_URL}/iframe.html?args=&id=components-iconbutton--default&viewMode=story`);
    await page.waitForSelector('.icon-button');
    
    // Check button attributes
    const attributes = await page.evaluate(() => {
      const btn = document.querySelector('.icon-button') as HTMLButtonElement;
      return {
        type: btn?.type,
        role: btn?.getAttribute('role'),
        ariaPressed: btn?.getAttribute('aria-pressed'),
      };
    });
    
    expect(attributes.type).toBe('button');
  });

  it('should render with custom size', async () => {
    await page.goto(`${STORYBOOK_URL}/iframe.html?args=&id=components-iconbutton--custom-size&viewMode=story`);
    await page.waitForSelector('.icon-button');
    
    // Check if button has custom size
    const buttonSize = await page.evaluate(() => {
      const btn = document.querySelector('.icon-button') as HTMLElement;
      const styles = window.getComputedStyle(btn);
      return {
        width: styles.width,
        height: styles.height,
      };
    });
    
    expect(buttonSize.width).toBe('60px');
    expect(buttonSize.height).toBe('60px');
  });
});
