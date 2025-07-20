import { test } from '@playwright/test';
import dotenv from 'dotenv';
import { loginToSite, readTestUserFromFile, TestUser } from './testutils';

dotenv.config();

const generes = ['Science Fiction', 'Fantasy', 'Romance'];

test.describe('Publish story workflows', () => {
    let testUser: TestUser;

    test.beforeAll(async () => {
        console.log('TEST: Publish story workflows');
        const user = await readTestUserFromFile();
        if (user) {
            console.log('Found existing test user, using it for tests');
            testUser = user;
        } else {
            throw new Error('No test user found. Please run the signup test first.');
        }
    });



    test.describe('Scenario creation flow', () => {
        test('should open the last generated story and publish it to the marketplace', async ({ page }) => {
            console.log('TEST: Publish a story to the marketplace');
            await loginToSite(page, testUser);
            const DELAY = 10;

            await page.getByRole('link', { name: 'StoryWriter Logo StoryWriter' }).click( { delay: DELAY });
            await page.locator('button').filter({ hasText: 'View All' }).click( { delay: DELAY });
            await page.getByRole('button', { name: '🏪 Publish' }).first().click( { delay: DELAY });
            await page.locator('label').filter({ hasText: 'I confirm I own the rights to' }).locator('span').click({ delay: DELAY });
            await page.getByTestId('publish-story-button').click({ delay: DELAY });
            await page.waitForTimeout(500);
            await page.getByRole('button', { name: 'OK' }).click({ delay: DELAY });
            await page.getByRole('link', { name: 'StoryWriter Logo StoryWriter' }).click({ delay: DELAY });
            console.log('Story should be published to the marketplace');
        });
    });


});