import puppeteer, { Browser, ElementHandle, Page } from 'puppeteer';

describe('Login Page', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await puppeteer.launch();
    page = await browser.newPage();
    await page.goto('http://localhost:3000');
  });

  afterAll(async () => {
    await browser.close();
  });

  it('should display the login form', async () => {
    // Navigate to login page from marketing homepage
    await page.goto('http://localhost:3000/login');
    
    const loginInput = await page.$('input[type="text"], input[type="email"]');
    const passwordInput = await page.$('input[type="password"]');
    let loginButton: ElementHandle<Element> | null = await page.$('button[type="submit"]');
    if (!loginButton) {
      const buttons : ElementHandle<Element> | null = await page.$("::-p-xpath(//button[contains(translate(., 'LOGIN', 'login'), 'login')])");
      loginButton = (buttons || null);
    }
    expect(loginInput).toBeTruthy();
    expect(passwordInput).toBeTruthy();
    expect(loginButton).toBeTruthy();
  });

  it('should allow login and logout, and update UI and localStorage accordingly', async () => {
    await page.goto('http://localhost:3000/login');

    await page.type('input[type="text"], input[type="email"]', 'test@testusers.org');
    await page.type('input[type="password"]', 'testpassword');

    let loginButton: ElementHandle<Element> | null = await page.$('button[type="submit"]');
    if (!loginButton) {
      // Use Puppeteer XPath selector via ::-p-xpath
      loginButton = await page.$('::-p-xpath(//button[contains(translate(., "LOGIN", "login"), "login")])');
    }
    expect(loginButton).toBeTruthy();
    if (loginButton) await loginButton.click();

    // Wait for navigation or UI update
    if ((page as any).waitForTimeout) {
      await (page as any).waitForTimeout(1000);
    } else {
      await new Promise(res => setTimeout(res, 1000));
    }

    // Check for user icon/avatar in top left (TopBar)
    const avatar = await page.$('.avatar');
    expect(avatar).toBeTruthy();

    // Check JWT token in localStorage (should be 'token' not 'jwt_token')
    const jwt = await page.evaluate(() => localStorage.getItem('token'));
    expect(jwt).toBeTruthy();

    // Open user dropdown
    const userIcon: ElementHandle<Element> | null = await page.$('.user-button');
    expect(userIcon).toBeTruthy();
    if (userIcon) {
      // Click the user icon to open the dropdown
      await userIcon.click();
    }

    // Verify dropdown username is visible
    const dropdownUsername = await page.$('.dropdown-username');
    expect(dropdownUsername).toBeTruthy();

    // Click logout (now visible after dropdown is open)
    const logoutButton = await page.$('.logout-item');
    expect(logoutButton).toBeTruthy();
    if (logoutButton) await logoutButton.click();
    if ((page as any).waitForTimeout) {
      await (page as any).waitForTimeout(500);
    } else {
      await new Promise(res => setTimeout(res, 500));
    }

    // JWT token should be gone
    const jwtAfter = await page.evaluate(() => localStorage.getItem('token'));
    expect(jwtAfter).toBeFalsy();

    // Login form should be visible again
    const loginInput = await page.$('input[type="text"], input[type="email"]');
    const passwordInput = await page.$('input[type="password"]');
    expect(loginInput).toBeTruthy();
    expect(passwordInput).toBeTruthy();
  });
});
