import { expect, test } from '@playwright/test';
import dotenv from 'dotenv';
import { getUserProfile, loginToSite, readTestUserFromFile, TestUser, upgradeUserToPremium } from './testutils';

dotenv.config();

test.describe('Login, Upgrade and Logout workflows', () => {
    let testUser: TestUser;

    test.beforeAll(async () => {
        console.log('\nTEST: User Login, Upgrade and Logout workflows');
        const user = await readTestUserFromFile();
        if (user) {
            console.log('Found existing test user, using it for tests');
            testUser = user;
        } else {
            throw new Error('No test user found. Please run the signup test first.');
        }
    });

    test.describe('User Login workflow - Login from saved identity', () => {
        test('should successfully login with saved user identity', async ({ page }) => {
        console.log('loading user..');
        const user = await readTestUserFromFile() ?? testUser;
        console.log('User loaded:', user);
        await loginToSite(page, user);
        console.log('User login completed successfully');
        });
    });

    test.describe('User Login, Upgrade and Logout', () => {
        test('should get user profile and upgrade to premium', async () => {
            console.log('\nTEST: Get user profile and upgrade to premium');
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

        // test('should press the logout button', async ({ page }) => {
        //     console.log('\nTEST: User Logout');
        //     // Navigate to the app with the JWT token
        //     await page.goto(TEST_BASE_URL, { waitUntil: 'networkidle' });

        //     // Set the JWT token in localStorage
        //     await page.evaluate((token) => {
        //         localStorage.setItem('token', token);
        //     }, testUser.jwt!);

        //     // Refresh the page to apply the authentication
        //     await page.reload({ waitUntil: 'networkidle' });
        //     await page.getByRole('button', { name: 'User menu' }).click();
        //     await page.getByRole('button', { name: 'Logout' }).click(); console.log('Logout button clicked, user should be logged out');

        //     // Verify user is logged out by checking if the signup link is visible
        //     const signupLink = page.locator('a[data-test-id="nav-signup"]');
        //     await expect(signupLink).toBeVisible();
        //     console.log('User successfully logged out, signup link is visible');
        //     await navigateToPage(page, TEST_BASE_URL + '/');
        // });
    });
});