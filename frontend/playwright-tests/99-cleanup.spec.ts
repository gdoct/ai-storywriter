import { test } from '@playwright/test';
import dotenv from 'dotenv';
import { deleteExistingTestUser, deleteTestUserFile } from './testutils';

dotenv.config();

test.describe('Cleanup test user', () => {

    test.describe('Scenario creation flow', () => {
        test('delete the test user from the backend', async ({ page }) => {
            console.log('TEST: Cleanup test user');
            await deleteExistingTestUser();
            await deleteTestUserFile();
            console.log('Test user deleted from the backend and local file');
        });
    });


});