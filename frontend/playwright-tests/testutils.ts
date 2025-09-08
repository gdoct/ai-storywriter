import { Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { TEST_BASE_URL, TIMEOUT_MULTIPLIER } from '../__tests__/testsettings';
import { getResponse } from "../src/shared/services/request";

export interface TestUser {
    username: string;
    email: string;
    password: string;
    userId?: string;
    jwt?: string;
}

export function expectingToTakeSeconds(normalseconds: number): number {
    return normalseconds * TIMEOUT_MULTIPLIER * 1000; // Convert to milliseconds
}

export async function navigateToPage(page: Page, url: string): Promise<void> {
    console.log(`Navigating to ${url}`);
    await page.goto(url, { waitUntil: 'networkidle' });
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
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const userFilePath = path.join(__dirname, '.testuser');
    return userFilePath;
}

export async function readTestUserFromFile(): Promise<TestUser | undefined> {
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
    if (!userData || !userData.email) {
        throw new Error(`User email not set`);
    }
//    // /api/admin/users/find/<email>

    const findUserResponse = await getResponse(
        `${TEST_BASE_URL}/api/admin/users/find/${encodeURIComponent(userData.email)}`,
        'GET',
        authToken
    );
    if (!findUserResponse.ok) {
        const errorText = await findUserResponse.text();
        throw new Error(`Failed to find user: ${findUserResponse.status} ${errorText}`);
    }

    const user = await findUserResponse.json();
    if (!user || !user.id) {
        throw new Error(`User not found`);
    }

    const deleteResponse = await getResponse(
        `${TEST_BASE_URL}/api/admin/users/${user.id}`,
        'DELETE',
        authToken
    );

    if (!deleteResponse.ok) {
        const errorText = await deleteResponse.text();
        throw new Error(`Failed to delete user: ${deleteResponse.status} ${errorText}`);
    }

    console.log('User deleted successfully');
}

export async function deleteExistingTestUser(): Promise<void> {
    const userFilePath = getTestUserFilename();
    if (fs.existsSync(userFilePath)) {
        try {
            const data = await fs.promises.readFile(userFilePath, 'utf8');
            const user = JSON.parse(data) as TestUser;
            await deleteUser(user);
            await fs.promises.unlink(userFilePath);
            console.log('Existing testuser file deleted successfully');
        } catch (error) {
            console.error('Error reading testuser from file:', error);
        }
    }
}

export async function isUserLoggedIn(page: Page): Promise<boolean> {
    await page.goto(TEST_BASE_URL + '/', { waitUntil: 'networkidle' });
    // see if we have an element data-testid="start-writing-link"
    const signupLink = await page.locator('a[data-test-id="nav-signup"]').first();
    if (await signupLink.isVisible()) {
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
        await page.goto(`${TEST_BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
        return;
    }
    console.log('Logging in with test user:', testUser.email);
    await page.goto(`${TEST_BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.locator('#email').fill(testUser.email);
    await page.locator('#password').fill(testUser.password);
    console.log('Email and password entered');
    // Click the login button
    await page.locator('button[type="submit"]').click();
    console.log('Login button clicked, waiting for navigation...');
    // wait for .dashboard-header
    await page.waitForSelector('.dashboard-header', { state: 'visible' });
    console.log('Login successful, user is now logged in.');
}

export async function logoutFromSite(page: Page): Promise<void> {
    console.log('Logging out...');
    await page.goto(TEST_BASE_URL + '/', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'User menu' }).click();
    await page.getByRole('button', { name: 'Logout' }).click(); 
    console.log('Logout button clicked, waiting for navigation...');
    // Wait for navigation to the home page
    await page.waitForURL('**/', { waitUntil: 'networkidle' });
    console.log('Logged out successfully');
}

export async function waitForTextInputToSettle(page: Page, selector: string, timeout: number = 2000): Promise<boolean> {
  const delay = 300;
  const input = page.locator(selector);
  if (!input) return false;
  const el = await input.evaluateHandle(el => el as HTMLInputElement);
  if (!el) return false;

  let currentLength = await el.evaluate(el => el.value.length);
  if (await el.evaluate(el => el.value) === 'Untitled Story') { currentLength = 0; }
  let stableCount = 0;
  let lastLength = currentLength;
  const maxTries = Math.floor(timeout / delay);
  
  for (let tries = 0; tries < maxTries; tries++) {
    currentLength = await el.evaluate(el => el.value.length);
    
    if (currentLength > 0 && currentLength === lastLength) {
      stableCount++;
      if (stableCount >= 2) {
        return true;
      }
    } else {
      stableCount = 0;
    }
    
    lastLength = currentLength;
    await new Promise(resolveTimeout => setTimeout(resolveTimeout, delay));
  }
  
  return false;
}

export async function waitForAiTextBoxGeneration(page: Page, startTimeout: number = 10000, completionTimeout: number = 600000): Promise<void> {
  // Wait for the AI generation to start by checking for the generating class
  // Use a more specific selector and shorter polling interval
  try {
    await page.waitForSelector('.ai-textbox__input--generating', { 
      state: 'attached',
      timeout: startTimeout 
    });
    console.log('AI generation started (generating class detected)');
  } catch (error) {
    console.log('No generating class found - AI may have completed instantly or not started');
    return;
  }
  
  // Wait for the AI generation to complete by waiting for the generating class to be removed
  // This uses a more efficient selector-based approach rather than function evaluation
  await page.waitForSelector('.ai-textbox__input--generating', { 
    state: 'detached',
    timeout: completionTimeout 
  });
  console.log('AI generation completed (generating class removed)');
  
  // Additional wait to ensure DOM has settled after generation
  await page.waitForTimeout(500);
}