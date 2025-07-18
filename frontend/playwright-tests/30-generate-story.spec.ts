import { test } from '@playwright/test';
import dotenv from 'dotenv';
import { loginToSite, readTestUserFromFile, TestUser } from './testutils';

dotenv.config();

const generes = ['Science Fiction', 'Fantasy', 'Romance'];




test.describe('Generate story workflows', () => {
    let testUser: TestUser;

    test.beforeAll(async () => {
        console.log('\nTEST: Generate story workflows');
        const user = await readTestUserFromFile();
        if (user) {
            console.log('Found existing test user, using it for tests');
            testUser = user;
        } else {
            throw new Error('No test user found. Please run the signup test first.');
        }
    });



    test.describe('Story generation flow', () => {
        test('should open the last scenario and generate a story', async ({ page }) => {
            test.setTimeout(600000); // 10 minutes
            console.log('\nTEST: Generate a story from the last scenario');
            await loginToSite(page, testUser);
            await page.locator('a').filter({ hasText: 'View All' }).click();
            await page.locator('.btn.btn-primary.btn-small').first().click();
            await page.getByRole('button', { name: 'LLM Settings' }).click();
            await page.getByTestId('showStoryButton').click();
            console.log('Generating story from the scenario');
            await page.locator('[data-test-id="generateStoryButton"]').click();

            await page.locator('[data-test-id="saveStoryButton"]').click({ timeout: 300000 });
        });
    });


});