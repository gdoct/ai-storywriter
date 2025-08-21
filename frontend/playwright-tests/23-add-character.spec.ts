import { test } from '@playwright/test';
import dotenv from 'dotenv';
import { loginToSite, readTestUserFromFile, TestUser } from './testutils';

dotenv.config();

test.describe('Add character workflows', () => {
    let testUser: TestUser;
    
      test.beforeAll(async () => {
        console.log('\nTEST: Add character workflows');
        const user = await readTestUserFromFile();
        if (user) {
          console.log('Found existing test user, using it for tests');
          testUser = user;
        } else {
          throw new Error('No test user found. Please run the signup test first.');
        }
      });


      test.describe('Character creation flow', () => {
        test('should create a new character and save it', async ({ page }) => {
          test.setTimeout(600000); // 10 minutes
          console.log('\nTEST: Create a new character and save it');
          await loginToSite(page, testUser);
          await page.getByRole('button', { name: 'Edit' }).click();
          await page.getByTestId('characters-tab').click();
          await page.getByRole('button', { name: 'Add Character' }).click();
          await page.getByText('Unnamed CharacterRemove').click();
          await page.getByText('Unnamed CharacterRemove').click();
          await page.getByRole('textbox', { name: 'Character\'s full name' }).click();
          await page.getByRole('textbox', { name: 'Character\'s full name' }).fill('Piet Jansen');
          await page.getByRole('textbox', { name: 'Character\'s full name' }).press('Tab');
          await page.getByRole('textbox', { name: 'Nickname or alias' }).click();
          await page.getByRole('textbox', { name: 'Nickname or alias' }).fill('Someon');
          await page.getByRole('textbox', { name: 'Nickname or alias' }).press('Tab');
          await page.getByRole('textbox', { name: 'e.g., Protagonist, Antagonist' }).click();
          await page.getByRole('textbox', { name: 'e.g., Protagonist, Antagonist' }).fill('Antagonist');
          await page.getByRole('textbox', { name: 'Character\'s gender' }).click();
          await page.getByRole('textbox', { name: 'Character\'s gender' }).fill('Male');
          await page.getByRole('textbox', { name: 'Physical description...' }).click();
          await page.getByRole('textbox', { name: 'Physical description...' }).fill('No special features');
          await page.getByRole('textbox', { name: 'Character\'s background and' }).click();
          await page.getByRole('textbox', { name: 'Character\'s background and' }).fill('No backstory');
          await page.getByRole('textbox', { name: 'Personality traits,' }).click();
          await page.getByRole('textbox', { name: 'Personality traits,' }).fill('extra notes');
          await page.getByRole('button', { name: 'Save', exact: true }).click();

        });
    });
});