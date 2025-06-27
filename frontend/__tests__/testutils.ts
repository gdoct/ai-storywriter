import { Page } from 'puppeteer';
import { getResponse } from "../src/services/request";
import { TEST_BASE_URL, TIMEOUT_MULTIPLIER } from './testsettings';

export interface TestUser {
    username: string;
    email: string;
    password: string;
    userId?: string;
    jwt?: string;
};

export function expectingToTakeSeconds(normalseconds: number): number {
    return normalseconds * TIMEOUT_MULTIPLIER * 1000; // Convert to milliseconds
}

export async function navigateToPage(page: Page, url: string): Promise<void> {
    console.log(`Navigating to ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2' });
    console.log(`Navigation to ${url} completed`);
}

// Helper function: Get user profile data
export async function getUserProfile(jwt: string): Promise<any> {
    const userProfile = await getResponse(`${TEST_BASE_URL}/api/me/profile`, 'GET', jwt);

    if (!userProfile.ok) {
        throw new Error(`Failed to fetch user profile: ${userProfile.status}`);
    }

    return await userProfile.json();
}

function getTestUserFilename() {
    const path = require('path');
    const userFilePath = path.join(__dirname, '.testuser');
    return userFilePath;
}

export async function readTestUserFromFile(): Promise<TestUser | undefined> {
    const fs = require('fs');
    try {
        if (!fs.existsSync(getTestUserFilename())) {
            console.log('Test user file does not exist');
            return undefined;
        }
        const data = await fs.promises.readFile(getTestUserFilename(), 'utf8');
        return JSON.parse(data) as TestUser;
    } catch (error) {
        console.error('Error reading testuser from file:', error);
        return undefined;
    }
}

export async function saveTestUserToFile(user: TestUser): Promise<void> {
    const fs = require('fs');

    try {
        const filepath = getTestUserFilename();
        await fs.writeFile(filepath, JSON.stringify(user, null, 2), 'utf8', (err: any) => {
            if (err) {
                console.error('Error writing to file:', err);
            } else {
                console.log(`Test user saved to ${filepath}`);
            }
        });
    } catch (error) {
        console.error('Error saving token to file:', error);
        throw error;
    }
}

// Helper function: Upgrade user to premium
export async function upgradeUserToPremium(userEmail: string): Promise<void> {
    const authToken = process.env.ADMIN_TOKEN;
    if (!authToken) {
        throw new Error('ADMIN_TOKEN is not set in environment variables');
    }

    console.log('Upgrading user to premium...');
    const upgradeResponse = await getResponse(
        `${TEST_BASE_URL}/api/admin/upgrade-user`,
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


export async function deleteTestUserFile() {
    const fs = require('fs');

    const userFilePath = getTestUserFilename();

    if (fs.existsSync(userFilePath)) {
        try {
            await fs.promises.unlink(userFilePath);
        } catch (error) {
            console.error('Error deleting testuser file:', error);
        }
        console.log('Testuser file deleted successfully');
    } else {
        console.log('Testuser file does not exist, nothing to delete');
    }
}

export async function deleteUser(userData: TestUser): Promise<void> {
    const authToken = process.env.ADMIN_TOKEN;
    if (!authToken) {
        throw new Error('ADMIN_TOKEN is not set in environment variables');
    }
    if (!userData || !userData.userId) {
        throw new Error(`User with email ${userData.email} not found`);
    }
    const deleteResponse = await getResponse(
        `${TEST_BASE_URL}/api/admin/users/${userData.userId}`,
        'DELETE',
        authToken
    );

    if (!deleteResponse.ok) {
        const errorText = await deleteResponse.text();
        throw new Error(`Failed to delete user: ${deleteResponse.status} ${errorText}`);
    }

    console.log('User deleted successfully');
}

// Helper functions for the new individual action buttons
export async function clickSaveButton(page: Page, timeout: number = 10000): Promise<void> {
    await clickButtonBySelector(page, '[data-action-id="save"]', timeout);
}

// Helper function to wait for scenarios to load on the scenarios page
export async function waitForScenariosToLoad(page: Page, timeout: number = 15000): Promise<void> {
    console.log('Waiting for scenarios to load...');
    try {
        // Wait for either scenarios to appear or a "no scenarios" message
        await page.waitForSelector('button.scenarios__btn-edit-scenario, .scenarios__empty-state, .scenarios__no-scenarios', { 
            visible: true, 
            timeout 
        });
        
        // Add a small additional wait to ensure the page is fully rendered
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('Scenarios page loaded successfully');
    } catch (error) {
        console.error('Timeout waiting for scenarios to load');
        await page.screenshot({ path: 'scenarios-load-timeout.png' });
        throw error;
    }
}

// Helper function to wait for the scenario editor to be ready
export async function waitForScenarioEditorToLoad(page: Page, timeout: number = 10000): Promise<void> {
    console.log('Waiting for scenario editor to load...');
    try {
        // Wait for the scenario editor tabs to be visible
        await page.waitForSelector('button[data-testid="general-tab"]', { 
            visible: true, 
            timeout 
        });
        
        // Wait for the action buttons to be ready
        await page.waitForSelector('[data-action-id="save"]', { 
            visible: true, 
            timeout: 5000 
        });
        
        console.log('Scenario editor loaded successfully');
    } catch (error) {
        console.error('Timeout waiting for scenario editor to load');
        await page.screenshot({ path: 'scenario-editor-load-timeout.png' });
        throw error;
    }
}

export async function clickSaveAsButton(page: Page, timeout: number = 10000): Promise<void> {
    await clickButtonBySelector(page, '[data-action-id="save-as"]', timeout);
}

export async function clickDeleteButton(page: Page, timeout: number = 10000): Promise<void> {
    await clickButtonBySelector(page, '[data-action-id="delete"]', timeout);
}

export async function clickReloadButton(page: Page, timeout: number = 10000): Promise<void> {
    await clickButtonBySelector(page, '[data-action-id="reload"]', timeout);
}

export async function clickGenerateStoryButton(page: Page, timeout: number = 10000): Promise<void> {
    await clickButtonBySelector(page, '[data-action-id="generate-story"]', timeout);
}

export async function clickButtonBySelector(page: Page, selector: string, timeout: number = 10000): Promise<void> {
    console.log(`Clicking button with class: ${selector}`);
    try {
        const button = await page.waitForSelector(selector, { visible: true, timeout });
        if (!button) {
            throw new Error(`button with classname ${selector} not found`);
        }
        await button.click();
    } catch (e) {
        await page.screenshot();
        throw e;
    }
    console.log(`Button with class ${selector} clicked successfully`);
}

export async function setDropdownValue(page: Page, selector: string, value: string): Promise<void> {
    const dropdown = await page.waitForSelector(selector, { visible: true });
    if (!dropdown) {
        throw new Error(`Dropdown with selector ${selector} not found`);
    }
    // set value of the dropdown (it is free-type dropdown)
    await dropdown.click();
    await page.keyboard.down('Control');
    await page.keyboard.press('A');
    await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');
    await page.keyboard.type(value);
    // wait for the dropdown to update
}

export async function deleteExistingTestUser(): Promise<void> {
    const fs = require('fs');
    const userFilePath = getTestUserFilename();
    if (fs.exists(userFilePath, () => { })) {
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

export async function isUserLoggedIn(page: Page): Promise<boolean> {
    await page.goto(TEST_BASE_URL + '/', { waitUntil: 'networkidle2' });
    // see if we have an element data-testid="start-writing-link"
    const signupLink = await page.waitForSelector('a[data-test-id="nav-signup"]');
    if (signupLink) {
        console.log('User is not logged in');
        return false;
    } else {
        console.log('User is logged in');
        return true;
    }
}

export async function loginToSite(page: Page, testUser: TestUser): Promise<void> {
    if (await isUserLoggedIn(page)) {
        console.log('User is already logged in, skipping login');
        return;
    }
    console.log('Logging in with test user:', testUser.email);
    await page.goto(`${TEST_BASE_URL}/login`, { waitUntil: 'networkidle2' });
    const emailInput = await page.waitForSelector('#email', { visible: true });
    const passwordInput = await page.waitForSelector('#password', { visible: true });
    if (!emailInput || !passwordInput) {
        throw new Error('Email or password input not found');
    }
    await emailInput.type(testUser.email);
    await passwordInput.type(testUser.password);
    console.log('Email and password entered');
    // Click the login button
    const loginButton = await page.waitForSelector('button[type="submit"]', { visible: true });
    if (!loginButton) {
        throw new Error('Login button not found');
    }
    await loginButton.click();
    console.log('Login button clicked, waiting for navigation...');
    // Wait for navigation to the dashboard
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log('Logged in successfully, waiting for dashboard to load...');
}

