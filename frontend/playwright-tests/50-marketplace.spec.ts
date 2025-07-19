import { test } from '@playwright/test';
import dotenv from 'dotenv';
import { loginToSite, readTestUserFromFile, TestUser } from './testutils';

dotenv.config();
test.describe('Marketplace workflows', () => {
  let testUser: TestUser;

  test.beforeAll("Test initialization", async () => {
    console.log('\nTEST: Marketplace workflows');
    const user = await readTestUserFromFile();
    if (user) {
      console.log('Found existing test user, using it for tests');
      testUser = user;
    } else {
      throw new Error('No test user found. Please run the signup test first.');
    }
  });

  test('should browse the marketplace', async ({ page }) => {
    console.log('\nTEST: Browse the marketplace');
    await loginToSite(page, testUser);
    // go to marketplace
    await page.getByRole('button', { name: 'User menu' }).click();
    await page.getByRole('button', { name: 'Marketplace' }).click();

    
  });
});