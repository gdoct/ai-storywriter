import dotenv from 'dotenv';
import puppeteer, { Browser, Page } from 'puppeteer';
import { expectingToTakeSeconds, loginToSite, readTestUserFromFile, TEST_DELAY, TEST_LLM_MODEL, TestUser } from './testutils';

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
  async function generateStory(): Promise<void> {
    // Click "View Story" button
    const showStoryButton = await page.waitForSelector(
      '::-p-xpath(//button[contains(concat(" ", normalize-space(@class), " "), " btn--secondary ") and .//span[contains(@class, "btn__text") and normalize-space(text())="View Story"]])',
      { visible: true }
    );

    if (!showStoryButton) {
      throw new Error('View Story button not found');
    }

    await page.locator(
      '::-p-xpath(//button[contains(concat(" ", normalize-space(@class), " "), " btn--secondary ") and .//span[contains(@class, "btn__text") and normalize-space(text())="View Story"]])'
    ).click();

    console.log('Story modal opened');

    // Click "Generate Story" button
    const generateStoryButton = await page.waitForSelector(
      '::-p-xpath(//button[contains(concat(" ", normalize-space(@class), " "), " btn--primary ") and .//span[contains(@class, "btn__text") and normalize-space(text())="Generate Story"]])',
      { visible: true }
    );

    if (!generateStoryButton) {
      throw new Error('Generate Story button not found');
    }

    await generateStoryButton.click();
    console.log('Story generation started...');
  }

  // Helper function: Wait for story generation and save
  async function waitForStoryGenerationAndSave(): Promise<void> {
    // "/html/body/div/div/div/div/div[3]/div/div[1]/div/button[2]"
    const selector = "button.btn--primary:nth-child(2)";
    console.log('Waiting for story generation to complete...');
    const saveStoryButton = await page.waitForSelector(selector, { visible: true, timeout: 900000 }); // wait up to 15 minutes

    if (!saveStoryButton) {
      throw new Error('Save Story button not found after waiting');
    }

    console.log('Saving generated story...');
    await saveStoryButton.click();
    console.log('Story saved successfully!');
  }

  async function setSelectedModel(model: string): Promise<void> {
    console.log(`Setting selected model to ${model}...`);
    const modelSelector = await page.waitForSelector('#model-select');
    if (!modelSelector) {
      throw new Error('Model selector not found');
    }

    await modelSelector.select(model);
    console.log(`Selected model set to ${model}`);
  }

  async function wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  async function getSelectedModel(): Promise<string> {
    /**<select id="model-select" data-testid="model-selector"><option value="omega-darker-gaslight_the-final-forgotten-fever-dream-24b-i1">omega-darker-gaslight_the-final-forgotten-fever-dream-24b-i1</option><option value="google/gemma-3-12b">google/gemma-3-12b</option><option value="gemma-3-12b-it-max-horror-imatrix">gemma-3-12b-it-max-horror-imatrix</option><option value="google/gemma-3-4b">google/gemma-3-4b</option><option value="omega-darker_slush-12b">omega-darker_slush-12b</option><option value="text-embedding-nomic-embed-text-v1.5">text-embedding-nomic-embed-text-v1.5</option></select> */
    console.log('Getting selected model...');
    const selectedModel = await page.$eval('#model-select', (el) => (el as HTMLSelectElement).value);
    console.log(`Selected model is: ${selectedModel}`);
    return selectedModel;
  }

  async function generateRandomCharacter() {
    const generateRandomCharacterButton = await page.waitForSelector('.generate-random-character-btn', { visible: true });
      if (!generateRandomCharacterButton) {
        throw new Error('Generate random character button not found');
      }
      await generateRandomCharacterButton.click();
      console.log('Clicked Generate Random Character button');

      const finalButton = await page.waitForSelector('button.random-character-modal__generate-button', { visible: true });
      if (!finalButton) {
        throw new Error('Generate button in modal not found');
      }
      await finalButton.click();
      console.log('Generated random character successfully');
      // wait for the character to appear
      await page.waitForSelector('.character-card__header', { visible: true });
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
      // Wait for the randomize button to be visible
      const randomizeButton = await page.waitForSelector('text/Randomize All', { visible: true });
      if (!randomizeButton) {
        throw new Error('Randomize button not found');
      }
      await randomizeButton.click();

      console.log('Navigated to story creation and randomized settings');
    }, expectingToTakeSeconds(1));

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

    it('should select the characters tab and generate one random character', async () => {
      await generateCharacter();
      //await generateCharacter();

    }, expectingToTakeSeconds(10));

    it('should generate a story title', async () => {
      // Click on the Characters tab
      const generalTab = await page.waitForSelector('button[data-testid="general-tab"]', { visible: true });
      if (!generalTab) {
        throw new Error('general tab not found');
      }
      await generalTab.click();
      console.log('Clicked General tab to select genre');
      // button with classname general-tab__randomize-title-btn
      const randomizeTitleButton = await page.waitForSelector('.general-tab__randomize-title-btn', { visible: true });
      if (!randomizeTitleButton) {
        throw new Error('Randomize title button not found');
      }
      await randomizeTitleButton.click();
      console.log('Clicked Randomize Title button to generate story title');
    }, expectingToTakeSeconds(10));

    it('should generate a story synopsis', async () => {
      // Click on the Characters tab
      const generalTab = await page.waitForSelector('button[data-testid="general-tab"]', { visible: true });
      if (!generalTab) {
        throw new Error('general tab not found');
      }
      await generalTab.click();
      console.log('Clicked General tab to select genre');
      // button with classname general-tab__randomize-synopsis-btn
      console.log('Waiting for Randomize Synopsis button to be visible');
      const randomizeSynopsisButton = await page.waitForSelector('.general-tab__randomize-synopsis-btn', { visible: true });
      if (!randomizeSynopsisButton) {
        throw new Error('Randomize synopsis button not found');
      }
      console.log('Randomize Synopsis button found, clicking it');
      await randomizeSynopsisButton.click();

      console.log('Waiting for synopsis input to be populated');
      /**
       <div class="input-field general-tab__synopsis-input">
         <label class="input-field__label">Synopsis</label>
         <div class="input-field__wrapper">
             <textarea placeholder="Brief description of your story..." 
                       rows="4" 
                       class="input-field__control input-field__textarea">
              ....
            </textarea>
          </div>
       </div> */
      await page.waitForFunction(() => {
        const textAreaSelector = '.general-tab__synopsis-input .input-field__textarea';
        const synopsisInput = document.querySelector(textAreaSelector);
        return synopsisInput && (synopsisInput as HTMLTextAreaElement).value.trim().length > 0;
      }, { timeout: expectingToTakeSeconds(29) }); // wait up to 29 seconds
      console.log('Synopsis generated successfully');
      // wait for the synopsis to be generated
      console.log('Clicked Randomize Synopsis button to generate story synopsis');
    }, expectingToTakeSeconds(30));
    
    it('should save the current scenario', async () => {
      // Click the "Save Scenario" button
      const saveScenarioButton = await page.waitForSelector('.scenario-editor__save-button', { visible: true });
      if (!saveScenarioButton) {
        throw new Error('Save Scenario button not found');
      }
      await saveScenarioButton.click();
      console.log('Scenario saved successfully');
      // wait 50 ms before continuing
      await new Promise(res => setTimeout(res, 50));

    }, expectingToTakeSeconds(10))
  });

  describe('Story Generation workflow', () => {
    it('should open story modal and start generation', async () => {
      await generateStory();
      console.log('Story generation process started');
    }, expectingToTakeSeconds(10));

    it('should wait for story generation to complete and save', async () => {
      await waitForStoryGenerationAndSave();
      console.log('Story generation completed and saved successfully');
    }, expectingToTakeSeconds(300)); 
  });
});
