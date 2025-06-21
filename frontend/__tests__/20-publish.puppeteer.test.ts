import dotenv from 'dotenv';
import puppeteer, { Browser, Page } from 'puppeteer';
import { expectingToTakeSeconds, loginToSite, readTestUserFromFile, TEST_DELAY, TestUser } from './testutils';

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
  describe('Story Publishing workflow', () => {

    it('Should publish from the dashboard page after agreeing terms', async () => {
      await gotoDashboardAndPublishStory();
      console.log('Story published successfully');
    }, expectingToTakeSeconds(10));
  });
});
