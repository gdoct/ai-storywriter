import dotenv from 'dotenv';
import puppeteer, { Browser, Page } from 'puppeteer';

dotenv.config();

interface TestUser {
  username: string;
  email: string;
  password: string;
  userId?: string;
  jwt?: string;
}

interface StoryData {
  title: string;
  synopsis: string;
}

describe('User Flow - Story Generation and Publishing', () => {
  let browser: Browser;
  let page: Page;
  let testUser: TestUser;

  async function loginToSite(testUser: TestUser): Promise<void> {
    console.log('Logging in with test user:', testUser.email);
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
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

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: false,
      slowMo: 50,
      defaultViewport: { width: 1200, height: 1080 }
    });
    page = await browser.newPage();
    await page.setViewport({
      width: 1200,
      height: 1080,
      deviceScaleFactor: 1,
    });

    // Initialize test user data
    testUser = await readTestUserFromFile();
    if (!testUser) {
      throw new Error('Test user not found in file. Please run the signup test first.');
    }

    await loginToSite(testUser);
  }, 60000); // 60 seconds timeout for login

  afterAll(async () => {
    await browser.close();
  });
 
 
  async function readTestUserFromFile(): Promise<TestUser | undefined> {
     const fs = require('fs');
    const path = require('path');
    const tokenFilePath = path.join(__dirname, 'testuser.txt');
    try {
      const data = await fs.promises.readFile(tokenFilePath, 'utf8');
      return JSON.parse(data) as TestUser;
    } catch (error) {
      console.error('Error reading testuser from file:', error);
      return undefined;
    }
  }

  async function gotoDashboardAndPublishStory(): Promise<void> {
    // Navigate to the dashboard
    const dashboardlink = await page.waitForSelector('a.nav-link:nth-child(1)', { visible: true });
    if (!dashboardlink) {
      throw new Error('Dashboard link not found');
    }
    await dashboardlink.click();
    console.log('Navigated to dashboard');

    // find link to the stories page
    // div.recent-stories-section:nth-child(2) > div:nth-child(1) > a:nth-child(2)
    const storiesLink = await page.waitForSelector('div.recent-stories-section:nth-child(2) > div:nth-child(1) > a:nth-child(2)', { visible: true });
    if (!storiesLink) {
      throw new Error('Stories link not found');
    }
    await storiesLink.click();
    console.log('Navigated to stories page');
    // Wait for the "Publish" button to be visible    
    // class is .btn-marketplace
    const publishButton = await page.waitForSelector('.btn-marketplace', { visible: true });
    if (!publishButton) {
      throw new Error('Publish button not found');
    }
    console.log('Clicking Publish button');
    await publishButton.click();

    // this shows the Publish modal
    console.log('Publish modal opened');
    const selector = '.required > span:nth-child(2)';
    const agreeCheckbox = await page.waitForSelector(selector, { visible: true });
    if (!agreeCheckbox) {
      throw new Error('Agree checkbox not found');
    }
    await agreeCheckbox.click();
    console.log('Agree checkbox clicked');

    // Click the "Publish" button in the modal
    const publishModalButton = await page.waitForSelector('[data-testid="publish-story-button"]', { visible: true });
    if (!publishModalButton) {
      throw new Error('Publish button in modal not found');
    }
    await publishModalButton.click();

    console.log('Story published successfully');

    // wait for the confirmation modal and click ok
    /**<button class="btn btn-primary">OK</button> */
    const confirmationModalOkButton = await page.waitForSelector('button[data-testid="confirm-button"]', { visible: true });
    if (!confirmationModalOkButton) {
      throw new Error('Confirmation modal not found');
    }
    confirmationModalOkButton.click();
    console.log('Confirmation modal OK button clicked');
  }

  async function wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  describe('Story Publishing flow', () => {

    it('Should publish from the dashboard page after agreeing terms', async () => {
      await gotoDashboardAndPublishStory();
      console.log('Story published successfully');
    }, 60000);
  });
});
