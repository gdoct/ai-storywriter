import { test } from '@playwright/test';
import dotenv from 'dotenv';
import { loginToSite, readTestUserFromFile, TestUser } from './testutils';

dotenv.config();

test.describe('Generate similar scenario workflows', () => {
    let testUser: TestUser;

    test.beforeAll(async () => {
        console.log('\nTEST: Generate similar scenario workflows');
        const user = await readTestUserFromFile();
        if (user) {
            console.log('Found existing test user, using it for tests');
            testUser = user;
        } else {
            throw new Error('No test user found. Please run the signup test first.');
        }
    });

    test.describe('Generate similar scenario flow', () => {
        test('should generate similar scenarios from the most recent scenario', async ({ page }) => {
            test.setTimeout(600000); // 10 minutes
            console.log('\nTEST: Generate similar scenarios from the most recent scenario');
            
            // Login to the site
            await loginToSite(page, testUser);
            
            // TODO: RECORD WITH PLAYWRIGHT - Click the "Generate Similar..." button on the first (most recent) scenario card
            console.log('Looking for Generate Similar button on the most recent scenario');
            await page.getByRole('button', { name: 'Generate Similar...' }).first().click();

            // TODO: RECORD WITH PLAYWRIGHT - Wait for the GenerateSimilarModal to appear
            // div data-testid="generate-similar-modal-outer"

            console.log('Waiting for Generate Similar modal to appear');
            await page.waitForSelector('[data-testid="generate-similar-modal-outer"]', { timeout: 10000 });

            // TODO: RECORD WITH PLAYWRIGHT - Check 'Characters' checkbox in the modal
            console.log('Checking Characters checkbox');
            // checkbox has data-testid="generate-similar-modal-character-checkbox"
            await page.getByTestId('generate-similar-modal-character-checkbox').check();
            // now wait for reach to render find the first checkbox below it with data-testid="generate-similar-modal-character-checkbox"
            // the item to find is
            // <input data-testid="generate-similar-modal-character-item-checkbox" type="checkbox" style="margin-right: var(--spacing-xs);">
            
            await page.getByTestId('generate-similar-modal-character-item-checkbox').first().check();
            await page.getByRole('slider').fill('2');
            // button data-testid="generate-similar-modal-generate-button"
            await page.getByTestId('generate-similar-modal-generate-button').click();

            
            console.log('Waiting for generation to complete (this may take several minutes)');
            // wait while data-testid="generating-modal-spinner" is visible
            await page.waitForSelector('[data-testid="generating-modal-spinner"]', { state: 'hidden', timeout: 60000000 });

            console.log('Similar scenario generation completed successfully');
        });
    });
});