import dotenv from 'dotenv';
import puppeteer, { Browser, Page } from 'puppeteer';
import { TEST_DELAY } from './testsettings';
import { expectingToTakeSeconds, loginToSite, readTestUserFromFile, TestUser } from './testutils';

dotenv.config();

describe('Marketplace publishing workflows', () => {
  let browser: Browser;
  let page: Page;
  let testUser: TestUser;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: false,
      slowMo: TEST_DELAY,
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

    await loginToSite(page, testUser);
  }, expectingToTakeSeconds(10)); // 60 seconds timeout for login

  afterAll(async () => {
    await browser.close();
  });

  async function gotoDashboardAndPublishStory(): Promise<void> {
    try {
      // Navigate to the dashboard
      const dashboardlink = await page.waitForSelector('a.__topbar__dashboardlink', { visible: true, timeout: 10000 });
      if (!dashboardlink) {
        throw new Error('Dashboard link not found');
      }
      await dashboardlink.click();
      console.log('Navigated to dashboard, waiting for all stories button to be visible');
      const storiesLink = await page.waitForSelector('a.btn__stories_all', { visible: true, timeout: 10000 });
      if (!storiesLink) {
        throw new Error('Stories link not found');
      }
      console.log('Stories link found, clicking to navigate to stories page');
      await storiesLink.click();
      console.log('Navigated to stories page');

      // Verify navigation to stories page
      console.log('waiting for publish button to be visible');
      // Wait for the "Publish" button to be visible
      const publishButton = await page.waitForSelector('.btn-marketplace', { visible: true, timeout: 10000 });
      if (!publishButton) {
        throw new Error('Publish button not found');
      }
      console.log('Clicking Publish button');
      await publishButton.click();

      // Publish modal
      console.log('Publish modal opened');
      const selector = '.required > span:nth-child(2)';
      const agreeCheckbox = await page.waitForSelector(selector, { visible: true, timeout: 10000 });
      if (!agreeCheckbox) {
        throw new Error('Agree checkbox not found');
      }
      await agreeCheckbox.click();
      console.log('Agree checkbox clicked');

      // Click the "Publish" button in the modal
      const publishModalButton = await page.waitForSelector('[data-testid="publish-story-button"]', { visible: true, timeout: 10000 });
      if (!publishModalButton) {
        throw new Error('Publish button in modal not found');
      }
      await publishModalButton.click();

      console.log('Story published successfully');

      // Wait for the confirmation modal and click OK
      const confirmationModalOkButton = await page.waitForSelector('button[data-testid="confirm-button"]', { visible: true, timeout: 10000 });
      if (!confirmationModalOkButton) {
        throw new Error('Confirmation modal not found');
      }
      await confirmationModalOkButton.click();
      console.log('Confirmation modal OK button clicked');
    } catch (error) {
      console.error('Error during publishing workflow:', error);
      throw error; // Rethrow to ensure test fails
    }
  }

  async function wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  describe('Story Publishing workflow', () => {
    it('Should publish from the dashboard page after agreeing terms', async () => {
      await gotoDashboardAndPublishStory();
      console.log('Story published successfully');
    }, expectingToTakeSeconds(30));
  });
});
