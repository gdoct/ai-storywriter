import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';
import dotenv from 'dotenv';
import { TEST_BASE_URL } from '../__tests__/testsettings';
import { deleteExistingTestUser, getUserProfile, navigateToPage, saveTestUserToFile, TestUser, upgradeUserToPremium } from './testutils';

dotenv.config();

test.describe('Register, Login and Logout workflows', () => {
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

  test.beforeAll(async () => {
    deleteExistingTestUser();
    initializeTestUser();
  });
 
  // Helper function: Perform user signup
  async function signupUser(page: any, user: TestUser): Promise<string> {
    await navigateToPage(page, `${TEST_BASE_URL}/signup`);

    // Wait for signup form to load
    try {
      await page.locator('form').waitFor({ state: 'visible', timeout: 5000 });
      await expect(page.locator('form')).toBeVisible();
      await expect(page.locator('input[name="username"], input#username')).toBeVisible();
      await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
    } catch (e) {
      console.error('Error waiting for signup form:', e);
      await page.screenshot({ path: 'debug-signup-page.png' });
      throw e;
    }

    console.log('Signup form is ready, filling out the form...');
    
    // Fill out the signup form
    const usernameInput = page.locator('input[name="username"], input#username').first();
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInputs = page.locator('input[type="password"]');

    await expect(usernameInput).toBeVisible();
    await expect(emailInput).toBeVisible();
    await expect(passwordInputs).toHaveCount(2); // password and confirm password

    await usernameInput.fill(user.username);
    await emailInput.fill(user.email);
    await passwordInputs.nth(0).fill(user.password);
    await passwordInputs.nth(1).fill(user.password);

    // Accept terms if checkbox exists
    const termsCheckbox = page.locator('span.checkmark').first();
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.click();
    }

    // Submit the form
    console.log('Submitting signup form...');
    try {
      const signupButton = page.locator('button[data-test-id="signupButton"]');
      await expect(signupButton).toBeVisible();
      await signupButton.click();
    } catch (e) {
      await page.screenshot({ path: 'debug-signup-form.png' });
      throw e;
    }

    // Wait for successful signup (user avatar appears)
    try {
      console.log('Waiting for user avatar to appear after signup...');
      await page.locator('.user-button').waitFor({ state: 'visible', timeout: 12000 });
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
  
  test.describe('User Registration workflow - Register, Upgrade and Logout', () => {
    test('should successfully register a new user', async ({ page }) => {
      console.log('Starting user registration...');
      testUser.jwt = await signupUser(page, testUser);
      console.log('User registration completed successfully');
      
      // Verify user avatar is present
      const avatar = page.locator('.user-button');
      await expect(avatar).toBeVisible();
      expect(testUser.jwt).toBeTruthy();
      await saveTestUserToFile(testUser);
    });

    test('should get user profile and upgrade to premium', async () => {
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
    });

    test('should press the logout button', async ({ page }) => {
      // Navigate to the app with the JWT token
      await page.goto(TEST_BASE_URL, { waitUntil: 'networkidle' });
      
      // Set the JWT token in localStorage
      await page.evaluate((token) => {
        localStorage.setItem('token', token);
      }, testUser.jwt!);
      
      // Refresh the page to apply the authentication
      await page.reload({ waitUntil: 'networkidle' });
      
      // click on button class=user-button to make menu appear
      const userButton = page.locator('.user-button');
      await expect(userButton).toBeVisible();
      await userButton.click();
      console.log('User button clicked, menu should appear');
      
      // wait for the logout button to appear
      // <button class="dropdown-item logout-item">Logout</button>
      const logoutButton = page.locator('.logout-item');
      await expect(logoutButton).toBeVisible();
      console.log('Logout button found, clicking it...');
      await logoutButton.click();
      console.log('Logout button clicked, user should be logged out');
      
      // Verify user is logged out by checking if the signup link is visible
      const signupLink = page.locator('a[data-test-id="nav-signup"]');
      await expect(signupLink).toBeVisible();
      console.log('User successfully logged out, signup link is visible');
      await navigateToPage(page, TEST_BASE_URL + '/');
    });
  });
});