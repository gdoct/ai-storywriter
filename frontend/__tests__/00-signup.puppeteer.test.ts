import { faker } from '@faker-js/faker';
import dotenv from 'dotenv';
import puppeteer, { Browser, Page } from 'puppeteer';
import { getResponse } from '../src/services/request';
dotenv.config();

interface TestUser {
  username: string;
  email: string;
  password: string;
  userId?: string;
  jwt?: string;
}

 async function deleteUser(userData: TestUser): Promise<void> {
    const authToken = process.env.ADMIN_TOKEN;
    if (!authToken) {
      throw new Error('ADMIN_TOKEN is not set in environment variables');
    }
    if (!userData || !userData.userId) {
      throw new Error(`User with email ${userData.email} not found`);
    }
    const deleteResponse = await getResponse(
      `http://localhost:3000/api/admin/users/${userData.userId}`,
      'DELETE',
      authToken
    );

    if (!deleteResponse.ok) {
      const errorText = await deleteResponse.text();
      throw new Error(`Failed to delete user: ${deleteResponse.status} ${errorText}`);
    }

    console.log('User deleted successfully');
  }

async function deleteExistingTestUser(): Promise<void> {
  const fs = require('fs');
    const path = require('path');
    const userFilePath = path.join(__dirname, 'testuser.txt');
    if (fs.exists(userFilePath, () => {})) {
      try {
        const data = await fs.promises.readFile(userFilePath, 'utf8');
        const user = JSON.parse(data) as TestUser;
        await deleteUser(user);
        fs.remove(userFilePath, (err: any) => {
          if (err) {
            console.error('Error deleting testuser file:', err);
          }
          console.log('Existing testuser file deleted successfully');
        });
      } catch (error) {
        console.error('Error reading testuser from file:', error);
      }
    }
}

async function saveTestUserToFile(user: TestUser): Promise<void> {
  const fs = require('fs');
  const path = require('path');
  const tokenFilePath = path.join(__dirname, 'testuser.txt');

  try {
    await fs.writeFile(tokenFilePath, JSON.stringify(user, null, 2), 'utf8', (err: any) => {
      if (err) {
        console.error('Error writing to file:', err);
      } else {
        console.log(`Token saved to ${tokenFilePath}`);
      }
    });
  } catch (error) {
    console.error('Error saving token to file:', error);
    throw error;
  }
}

// Improved Puppeteer signup test with better click handling and debug output
// Skip the entire test suite
describe('Signup Page', () => {
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
      slowMo: 50,
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
  });
 
  // Helper function: Perform user signup
  async function signupUser(user: TestUser): Promise<string> {

    await navigateToPage('http://localhost:3000/signup');

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


  // Helper function: Upgrade user to premium
  async function upgradeUserToPremium(userEmail: string): Promise<void> {
    const authToken = process.env.ADMIN_TOKEN;
    if (!authToken) {
      throw new Error('ADMIN_TOKEN is not set in environment variables');
    }

    console.log('Upgrading user to premium...');
    const upgradeResponse = await getResponse(
      'http://localhost:3000/api/admin/upgrade-user',
      'POST',
      authToken,
      { email: userEmail }
    );

    if (!upgradeResponse.ok) {
      const errorText = await upgradeResponse.text();
      throw new Error(`Failed to upgrade user: ${upgradeResponse.status} ${errorText}`);
    }

    console.log('User upgraded to premium successfully');
  }

  // Helper function: Navigate to page and wait for it to load
  async function navigateToPage(url: string): Promise<void> {
    console.log(`Navigating to ${url}...`);
    await page.goto(url);
  }

  // Helper function: Get user profile data
  async function getUserProfile(jwt: string): Promise<any> {
    const userProfile = await getResponse('http://localhost:3000/api/me/profile', 'GET', jwt);

    if (!userProfile.ok) {
      throw new Error(`Failed to fetch user profile: ${userProfile.status}`);
    }

    return await userProfile.json();
  }

  describe('User Registration and Setup', () => {
    it('should successfully register a new user', async () => {
      console.log('Starting user registration...');
      // remove the token from the extra fttp headers
      testUser.jwt = await signupUser(testUser);
      console.log('User registration completed successfully');
      // Verify user avatar is present
      const avatar = await page.$('.user-button');
      expect(avatar).toBeTruthy();
      expect(testUser.jwt).toBeTruthy();
      saveTestUserToFile(testUser!);
    }, 60000); // 60 seconds timeout for registration

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
    }, 60000);
  });


});
