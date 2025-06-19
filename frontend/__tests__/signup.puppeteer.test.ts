import dotenv from 'dotenv';
import puppeteer, { Browser, Page } from 'puppeteer';
dotenv.config();
// Improved Puppeteer signup test with better click handling and debug output
// Skip the entire test suite
describe('Signup Page', () => {
  let browser: Browser;
  let page: Page;
  const uniqueId = Date.now();
  const testUsername = `user_${uniqueId}`;
  const testEmail = `user_${uniqueId}@example.com`;
  const testPassword = 'TestPassword123!';

  beforeAll(async () => {
    browser = await puppeteer.launch({ headless: false, slowMo: 10 });
    page = await browser.newPage();
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    });
    await page.goto('http://localhost:3000');
  });

  afterAll(async () => {
    await browser.close();
  });

  it('should display the signup form and allow user registration', async () => {
    // Wait for React to fully render the navigation
    try {
      // print debug info
      console.log('Navigating to signup page...');
      await page.goto('http://localhost:3000/signup');

      // Wait for navigation to signup page and form to load
      await page.waitForSelector('form', { visible: true, timeout: 5000 });

      await page.waitForFunction(() => {
        return document.querySelector('form') &&
          document.querySelector('input[name="username"], input#username') &&
          document.querySelector('input[type="email"], input[name="email"]') &&
          document.querySelector('input[type="password"], input[name="password"]');
      }, { timeout: 10000 });
    } catch (e) {
      console.error('Error navigating to signup page or waiting for form:', e);
      await page.screenshot({ path: 'debug-signup-page.png' });
      const pageContent = await page.content();
      console.log('Page content after error:', pageContent);
      throw e;
    }

    // Fill out the signup form with more specific selectors
    const usernameInput = await page.waitForSelector('input[name="username"], input#username', { visible: true });
    const emailInput = await page.waitForSelector('input[type="email"], input[name="email"]', { visible: true });
    const passwordInputs = await page.$$('input[type="password"]');

    if (passwordInputs.length < 2) {
      throw new Error('Expected at least 2 password fields (password and confirm password)');
    }

    await usernameInput.type(testUsername);
    await emailInput.type(testEmail);
    await passwordInputs[0].type(testPassword); // First password field
    await passwordInputs[1].type(testPassword); // Confirm password field

    // Accept terms if checkbox exists
    const termsCheckboxLabel = await page.$('span.checkmark');
    if (termsCheckboxLabel) {
      await termsCheckboxLabel.click();
    } else {
      console.log('No terms checkbox found, proceeding without it');
    }
    console.log('form filled, trying to submit...');
    // Wait for and click the signup button
    try {
      const signupButton = await page.waitForSelector('button[data-test-id="signupButton"]');
      console.log('Clicking signup button...');
      await signupButton.click();
    } catch (e) {
      await page.screenshot({ path: 'debug-signup-form.png' });
      const pageContent = await page.content();
      console.log('Failed to click signup button. Page content:', pageContent);
      throw e;
    }

    // Wait for avatar/user icon to appear (indicates successful signup)
    try {
      console.log('Waiting for user avatar to appear after signup...');
      await page.waitForSelector('.user-button', { visible: true, timeout: 12000 });
      console.log('Found user avatar - signup successful!');
    } catch (e) {
      console.log('User avatar not found, checking for errors...');
      const errorMsg = await page.$('.error-message, .error-text, .alert-danger, .MuiAlert-message');
      if (errorMsg) {
        const errorText = await page.evaluate(el => el.textContent, errorMsg);
        console.log('Signup error message:', errorText);
      }
      
      // Check current URL
      const currentUrl = page.url();
      console.log('Current URL after signup attempt:', currentUrl);
      
      // Check for any form validation errors
      const formErrors = await page.$$('.error-text');
      if (formErrors.length > 0) {
        console.log('Form validation errors found:');
        for (const error of formErrors) {
          const errorText = await page.evaluate(el => el.textContent, error);
          console.log('-', errorText);
        }
      }
      
      await page.screenshot({ path: 'debug-signup-after-submit.png' });
      throw new Error('User avatar not found after signup - check screenshot for details');
    }
    const avatar = await page.$('.user-button');
    expect(avatar).toBeTruthy();

    // Check JWT token in localStorage
    const jwt = await page.evaluate(() => localStorage.getItem('token'));
    if (!jwt) {
      console.log('No JWT token found in localStorage after signup.');
    }
    expect(jwt).toBeTruthy();
    // use the jwt token to call endpoint /api/me/profile to receive
    const userProfile = await fetch('http://localhost:3000/api/me/profile', {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });
    const userData = await userProfile.json();
    console.log('User profile data:', userData);
   
    // take the userid from that
    const userId = userData.user_id;
    console.log('User ID from profile:', userId);
    const authToken = process.env.ADMIN_TOKEN; 
    if (!authToken) {
      throw new Error('ADMIN_TOKEN is not set in environment variables');
    }
    console.log('Deleting test user with ID:', userId);
    const deleteResponse = await fetch(`http://localhost:3000/api/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });
    if (!deleteResponse.ok) {
      const errorText = await deleteResponse.text();
      console.error('Failed to delete test user:', errorText);
      throw new Error(`Failed to delete test user: ${deleteResponse.status} ${deleteResponse.statusText}`);
    }
    console.log('Test user deleted successfully');

  }, 90000); 

});
