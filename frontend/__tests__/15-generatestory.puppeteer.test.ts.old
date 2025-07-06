import dotenv from 'dotenv';
import puppeteer, { Browser, Page } from 'puppeteer';
import { TEST_DELAY, TEST_LLM_MODEL } from './testsettings';
import { clickButtonBySelector, clickGenerateStoryButton, expectingToTakeSeconds, loginToSite, readTestUserFromFile, TestUser, waitForScenarioEditorToLoad, waitForScenariosToLoad } from './testutils';

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


  // Helper function: Generate story content
  async function openStoryModal(): Promise<void> {
    await clickGenerateStoryButton(page, expectingToTakeSeconds(1000));
  }

  async function clickGenerateStoryButtonInModal(): Promise<void> {
    await clickButtonBySelector(page, '.scenario-editor__generate-story-button', expectingToTakeSeconds(1000));
  }

  // Helper function: Wait for story generation and save
  async function waitForStoryGenerationAndSave(): Promise<void> {
    // "/html/body/div/div/div/div/div[3]/div/div[1]/div/button[2]"
    const selector = "button.btn--primary:nth-child(2)";
    console.log('Waiting for story generation to complete...');
    const saveStoryButton = await page.waitForSelector(selector, { visible: true, timeout: expectingToTakeSeconds(6000) }); // wait up to 15 minutes

    if (!saveStoryButton) {
      throw new Error('Save Story button not found after waiting');
    }

    console.log('Saving generated story...');
    await saveStoryButton.click();
    console.log('Story saved successfully!');
  }

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


  describe('Story Generation workflow', () => {
    it('should edit the last saved scenario', async () => {
      // Navigate to story creation page
      console.log('Navigating to /app...');
      await clickButtonBySelector(page, '.btn__scenarios_all');
      
      // Wait for scenarios to be properly loaded from the database
      await waitForScenariosToLoad(page, expectingToTakeSeconds(15));
      
      await clickButtonBySelector(page, 'button.scenarios__btn-edit-scenario', expectingToTakeSeconds(10));
      
      // Wait for the scenario editor to be fully loaded
      await waitForScenarioEditorToLoad(page, expectingToTakeSeconds(10));
    }, expectingToTakeSeconds(30));

    it('should set the model to the preset for tests', async () => {
      await setSelectedModel(TEST_LLM_MODEL);

      await wait(500); // wait for 500 milliseconds to ensure the model is set
    }, expectingToTakeSeconds(1));

    it('should open the story modal', async () => {
      // click generate story button
      await openStoryModal();
    }, expectingToTakeSeconds(1));

    it('should start generation', async () => {
      await clickGenerateStoryButtonInModal();
      console.log('Story generation process started');
    }, expectingToTakeSeconds(90));

    it('should wait for story generation to complete and save', async () => {
      await waitForStoryGenerationAndSave();
      console.log('Story generation completed and saved successfully');
    }, expectingToTakeSeconds(60000));
  });
});
