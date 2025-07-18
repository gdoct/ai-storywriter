import { faker } from '@faker-js/faker';
import { expect, test } from '@playwright/test';
import dotenv from 'dotenv';
import { TEST_BASE_URL } from '../__tests__/testsettings';
import { deleteExistingTestUser, loginToSite, navigateToPage, readTestUserFromFile, saveTestUserToFile, TestUser } from './testutils';

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
      id: randomId,
      username: `${firstName} ${lastName}`,
      email: `${firstName}.${lastName}@${faker.internet.domainName()}`.toLowerCase(),
      password: randomId,
      jwt: undefined
    };
  }

  test.beforeAll(async () => {
    console.log('\nTEST: User Registration workflow - Register and logout');
    deleteExistingTestUser();
    initializeTestUser();
  });

  // Helper function: Perform user signup
  async function signupUser(page: any, user: TestUser): Promise<string> {
    console.log('Performing user signup with the following data:', user);
    await page.goto('http://localhost:3000/');

    // click on the signup link
    await page.locator('[data-test-id="nav-signup"]').click();

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
    // NEW

    await page.getByRole('textbox', { name: 'Username:' }).click();
    await page.getByRole('textbox', { name: 'Username:' }).fill(user.username, { delay: 100 });
    await page.getByRole('textbox', { name: 'Username:' }).press('Tab');
    await page.getByRole('textbox', { name: 'Email:' }).fill(user.email, { delay: 100 });
    await page.getByRole('textbox', { name: 'Password:', exact: true }).click();
    await page.getByRole('textbox', { name: 'Password:', exact: true }).fill(user.password, { delay: 100 });
    await page.getByRole('textbox', { name: 'Password:', exact: true }).press('Tab');
    await page.getByRole('textbox', { name: 'Confirm Password:' }).fill(user.password, { delay: 100 });

    await page.locator('form span').click();
    await page.locator('[data-test-id="signupButton"]').click();
    // Wait for successful signup (user avatar appears)
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Get JWT token from localStorage
    const jwt = await page.evaluate(() => localStorage.getItem('token'));
    if (!jwt) {
      throw new Error('No JWT token found in localStorage after signup');
    }

    return jwt;
  }

  test.describe('User Registration workflow - Register and logout', () => {
    test('should successfully register a new user', async ({ page }) => {
      console.log('\nStarting user registration...');
      testUser.jwt = await signupUser(page, testUser);
      console.log('User registration completed successfully');

      // Verify user avatar is present
      const avatar = page.locator('[aria-label="User menu"]');
      await expect(avatar).toBeVisible();
      expect(testUser.jwt).toBeTruthy();
      await saveTestUserToFile(testUser);

      await page.getByRole('button', { name: 'User menu' }).click();
      await page.getByRole('button', { name: 'Logout' }).click();

      // Verify user is logged out by checking if the signup link is visible
      const signupLink = page.locator('a[data-test-id="nav-signup"]');
      await expect(signupLink).toBeVisible();
      console.log('User successfully logged out, signup link is visible');
      await navigateToPage(page, TEST_BASE_URL + '/');
    });
  });
});