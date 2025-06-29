import dotenv from 'dotenv';
import puppeteer, { Browser, Page } from 'puppeteer';
import { StyleSettings } from '../src/types/ScenarioTypes';
import { TEST_DELAY, TEST_LLM_MODEL } from './testsettings';
import { clickButtonBySelector, clickSaveButton, expectingToTakeSeconds, loginToSite, readTestUserFromFile, setDropdownValue, TestUser } from './testutils';

dotenv.config();

interface StoryData {
  title: string;
  synopsis: string;
}

describe('Scenario and Story generation workflows', () => {
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
  }, expectingToTakeSeconds(60));

  afterAll(async () => {
    //await deleteUser(testUser.email);
    //console.log('Test user deleted successfully');
    await browser.close();
  });

  
  async function setSelectedModel(model: string): Promise<void> {
    console.log(`Setting selected model to ${model}...`);

    // open menu
    await clickButtonBySelector(page, '.llm-settings-menu');

    const modelSelector = await page.waitForSelector('#llm-model-select');
    if (!modelSelector) {
      throw new Error('Model selector not found');
    }

    await modelSelector.select(model);

    // close menu
    await clickButtonBySelector(page, '.llm-settings-menu');

    console.log(`Selected model set to ${model}`);
  }

  async function wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function generateRandomCharacter() {
    const generateCharacterButton = await page.waitForSelector('.characters-tab__add-photo-btn', { visible: true });
    if (!generateCharacterButton) {
      throw new Error('Generate character button not found');
    }
    await generateCharacterButton.click();
    console.log('Clicked Generate Character button');

    const finalButton = await page.waitForSelector('button.photo-upload-modal__create-button',
      { visible: true, timeout: expectingToTakeSeconds(60) });
    if (!finalButton) {
      throw new Error('Generate button in modal not found');
    }
    await finalButton.click();
    console.log('Generated random character successfully');
    // wait for the character to appear
    await page.waitForSelector('.character-card__header',
      { visible: true, timeout: expectingToTakeSeconds(900) });
    await wait(1000);
  }

  async function generateCharacter() {
    const generalTab = await page.waitForSelector('button[data-testid="general-tab"]', { visible: true });
    await generalTab.click();
    let charactersTab = page.locator('button[data-testid="characters-tab"]');
    await charactersTab.click();
    const existingCharacterCount = await page.$$eval('.character-card__header', headers => headers.length);
    console.log(`Existing characters count: ${existingCharacterCount}`);
    await generateRandomCharacter();
    const newCharacterCount = await page.$$eval('.character-card__header', headers => headers.length);
    console.log(`New characters count: ${newCharacterCount}`);
    expect(newCharacterCount).toBeGreaterThan(existingCharacterCount);
  }

  describe('Scenario Creation workflow', () => {
    it('should navigate to story creation', async () => {
      // Navigate to story creation page
      console.log('Navigating to /app...');
      const linkToWriting = await page.waitForSelector('a[data-testid="start-writing-link"]', { visible: true });
      if (!linkToWriting) {
        throw new Error('Start writing link not found');
      }
      await linkToWriting.click();
    }, expectingToTakeSeconds(1));

    it('should set the model to the preset for tests', async () => {
      await setSelectedModel(TEST_LLM_MODEL);

      await wait(500); // wait for 500 milliseconds to ensure the model is set
    }, expectingToTakeSeconds(1));


    it('should randomize the genre settings', async () => {
      // first select the romance genre so we have an image
      await setDropdownValue(page, '.genre__dropdown', 'Romance');
      // Wait for the randomize button to be visible
      const randomizeButton = await page.waitForSelector('text/Randomize All', { visible: true });
      if (!randomizeButton) {
        throw new Error('Randomize button not found');
      }
      await randomizeButton.click();

      console.log('Navigated to story creation and randomized settings');
    }, expectingToTakeSeconds(1));


    it('should set the style override if it exists', async () => {
      if (!process.env.STYLE_OVERRIDE || process.env.STYLE_OVERRIDE.length === 0) {
        return;
      }
      const styleOverride: StyleSettings = JSON.parse(process.env.STYLE_OVERRIDE);
      // fill these dropdowns with the values from the styleOverride
      // .writingstyle__dropdown
      // .genre__dropdown
      // .tone__dropdown
      // .communicationStyle__dropdown
      // .theme__dropdown
      if (styleOverride.style) {
        await setDropdownValue(page, '.writingstyle__dropdown', styleOverride.style);
      }
      if (styleOverride.genre) {
        await setDropdownValue(page, '.genre__dropdown', styleOverride.genre);
      }
      if (styleOverride.tone) {
        await setDropdownValue(page, '.tone__dropdown', styleOverride.tone);
      }
      if (styleOverride.communicationStyle) {
        await setDropdownValue(page, '.communicationStyle__dropdown', styleOverride.communicationStyle);
      }
      if (styleOverride.theme) {
        await setDropdownValue(page, '.theme__dropdown', styleOverride.theme);
      }
      console.log('Style override set successfully');
    }, 20000);


    it('should select the characters tab and generate one random character', async () => {
      await generateCharacter();
      //await generateCharacter();

    }, expectingToTakeSeconds(3000));

    it('should generate a story title', async () => {
      // Click on the Characters tab
      const generalTab = await page.waitForSelector('button[data-testid="general-tab"]', { visible: true });
      if (!generalTab) {
        throw new Error('general tab not found');
      }
      await generalTab.click();
      console.log('Clicked General tab to select genre');
      await clickButtonBySelector(page, '.general-tab__title-input .input-field__icon', expectingToTakeSeconds(100));
      console.log('Waiting for title input to be populated');
      await page.waitForFunction(() => {
        const inputSelector = '.general-tab__title-input .input-field__input';
        const titleInput = document.querySelector(inputSelector);
        return titleInput && (titleInput as HTMLInputElement).value.trim().length > 0;
      }, { timeout: expectingToTakeSeconds(29) }); // wait up to 29 seconds

    }, expectingToTakeSeconds(2000));

    it('should generate a story synopsis', async () => {
      // Click on the Characters tab
      const generalTab = await page.waitForSelector('button[data-testid="general-tab"]', { visible: true });
      if (!generalTab) {
        throw new Error('general tab not found');
      }
      await generalTab.click();
      console.log('Clicked General tab to select genre');

      await clickButtonBySelector(page, '.general-tab__synopsis-input .input-field__icon', expectingToTakeSeconds(1000));

      console.log('Waiting for synopsis input to be populated');

      await page.waitForFunction(() => {
        const textAreaSelector = '.general-tab__synopsis-input .input-field__textarea';
        const synopsisInput = document.querySelector(textAreaSelector);
        return synopsisInput && (synopsisInput as HTMLTextAreaElement).value.trim().length > 0;
      }, { timeout: expectingToTakeSeconds(300) });
      console.log('Synopsis generated successfully');
    }, expectingToTakeSeconds(400));

    it('should save the current scenario', async () => {
      // Click the "Save" button directly
      await clickSaveButton(page, expectingToTakeSeconds(1000));
      console.log('Scenario saved successfully');
      // wait 50 ms before continuing
      await new Promise(res => setTimeout(res, 50));

    }, expectingToTakeSeconds(10))
  });
});
