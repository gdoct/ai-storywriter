import { faker } from '@faker-js/faker';
import dotenv from 'dotenv';
import puppeteer, { Browser, Page } from 'puppeteer';
import { deleteExistingTestUser, expectingToTakeSeconds, getUserProfile, navigateToPage, saveTestUserToFile, TEST_BASE_URL, TEST_DELAY, TestUser, upgradeUserToPremium } from './testutils';
dotenv.config();

// Improved Puppeteer signup test with better click handling and debug output
// Skip the entire test suite
describe('Register, Login and Logout workflows', () => {
  let browser: Browser;
  let page: Page;
  let testUser: TestUser;

  function initializeTestUser() {
    // Initialize test user data
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    // Generate a 16 character random string (UUID-like, no dashes)
    const randomId = faker.string.alphanumeric(16);

    testUser = {
      username: `${firstName} ${lastName}`,
      email: `${firstName}.${lastName}@${faker.internet.domainName()}`.toLowerCase(),
      password: randomId,
      jwt: undefined
    };
  }

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: false,
      slowMo: TEST_DELAY,
      defaultViewport: { width: 1200, height: 1080 }
    });
    page = await browser.newPage();
    await page.setViewport({
      width: 1200,
      height: 1080,
      deviceScaleFactor: 1,
    });
    deleteExistingTestUser();
    initializeTestUser();
  });

  afterAll(async () => {
    await browser.close();
    await browser.disconnect();
  });
 
  // Helper function: Perform user signup
  async function signupUser(user: TestUser): Promise<string> {

    await navigateToPage(page, `${TEST_BASE_URL}/signup`);

    // Wait for signup form to load
    try {
      await page.waitForSelector('form', { visible: true, timeout: 5000 });
      await page.waitForFunction(() => {
        return document.querySelector('form') &&
          document.querySelector('input[name="username"], input#username') &&
          document.querySelector('input[type="email"], input[name="email"]') &&
          document.querySelector('input[type="password"], input[name="password"]');
      }, { timeout: 10000 });
    } catch (e) {
      console.error('Error waiting for signup form:', e);
      await page.screenshot({ path: 'debug-signup-page.png' });
      throw e;
    }

    console.log('Signup form is ready, filling out the form...');
    // Fill out the signup form
    const usernameInput = await page.waitForSelector('input[name="username"], input#username', { visible: true });
    const emailInput = await page.waitForSelector('input[type="email"], input[name="email"]', { visible: true });
    const passwordInputs = await page.$$('input[type="password"]');

    if (!usernameInput || !emailInput) {
      throw new Error('Username or email input not found');
    }

    if (passwordInputs.length < 2) {
      throw new Error('Expected at least 2 password fields (password and confirm password)');
    }

    await usernameInput.type(user.username);
    await emailInput.type(user.email);
    await passwordInputs[0].type(user.password);
    await passwordInputs[1].type(user.password);

    // Accept terms if checkbox exists
    const termsCheckboxLabel = await page.$('span.checkmark');
    if (termsCheckboxLabel) {
      await termsCheckboxLabel.click();
    }

    // Submit the form
    console.log('Submitting signup form...');
    try {
      const signupButton = await page.waitForSelector('button[data-test-id="signupButton"]');
      if (!signupButton) {
        throw new Error('Signup button not found');
      }
      await signupButton.click();
    } catch (e) {
      await page.screenshot({ path: 'debug-signup-form.png' });
      throw e;
    }

    // Wait for successful signup (user avatar appears)
    try {
      console.log('Waiting for user avatar to appear after signup...');
      await page.waitForSelector('.user-button', { visible: true, timeout: 12000 });
      console.log('Signup successful!');
    } catch (e) {
      await page.screenshot({ path: 'debug-signup-after-submit.png' });
      throw new Error('User avatar not found after signup - check screenshot for details');
    }

    // Get JWT token from localStorage
    const jwt = await page.evaluate(() => localStorage.getItem('token'));
    if (!jwt) {
      throw new Error('No JWT token found in localStorage after signup');
    }

    return jwt;
  }
  
  describe('User Registration workflow - Register, Upgrade and Logout', () => {
    it('should successfully register a new user', async () => {
      console.log('Starting user registration...');
      // remove the token from the extra fttp headers
      testUser.jwt = await signupUser(testUser);
      console.log('User registration completed successfully');
      // Verify user avatar is present
      const avatar = await page.$('.user-button');
      expect(avatar).toBeTruthy();
      expect(testUser.jwt).toBeTruthy();
      await saveTestUserToFile(testUser!);
    }, expectingToTakeSeconds(30)); 

    it('should get user profile and upgrade to premium', async () => {
      // Get user profile data
      const userData = await getUserProfile(testUser.jwt!);
      testUser.userId = userData.user_id;

      console.log('User profile data:', userData);
      expect(userData.user_id).toBeTruthy();

      // Upgrade user to premium
      await upgradeUserToPremium(userData.email);

      // Verify upgrade was successful
      const upgradedUserData = await getUserProfile(testUser.jwt!);
      console.log('Upgraded user profile data:', upgradedUserData);
      expect(upgradedUserData.tier).toBe('premium');
    }, expectingToTakeSeconds(10));

    it('should press the logout button', async () => {
      // click on button class=user-button to make menu appear
      const userButton = await page.waitForSelector('.user-button', { visible: true });
      if (!userButton) {
        throw new Error('User button not found');
      }
      await userButton.click();
      console.log('User button clicked, menu should appear');
      // wait for the logout button to appear
      // <button class="dropdown-item logout-item">Logout</button>
      const logoutButton = await page.waitForSelector('.logout-item', { visible: true });
      if (!logoutButton) {
        throw new Error('Logout button not found');
      }
      console.log('Logout button found, clicking it...');
      await logoutButton.click();
      console.log('Logout button clicked, user should be logged out');
      // Verify user is logged out by checking if the signup link is visible
      const signupLink = await page.waitForSelector('a[data-test-id="nav-signup"]', { visible: true });
      if (!signupLink) {
        throw new Error('Signup link not found after logout, user may not be logged out');
      }
      console.log('User successfully logged out, signup link is visible');
      await navigateToPage(page, TEST_BASE_URL + '/');
    }, expectingToTakeSeconds(10));
  });
});

