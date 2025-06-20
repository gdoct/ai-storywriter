import dotenv from 'dotenv';
import puppeteer, { Browser, Page } from 'puppeteer';
import { chatCompletion, LLMChatOptions } from '../src/services/llmService';
import { llmCompletionRequestMessage } from '../src/types/LLMTypes';

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
    //await deleteUser(testUser.email);
    //console.log('Test user deleted successfully');
    await browser.close();
  });
 
 
  async function readTestUserFromFile(): Promise<TestUser | undefined> {
    const fs = require('fs');
    const path = require('path');
    const userFilePath = path.join(__dirname, 'testuser.txt');
    try {
      const data = await fs.promises.readFile(userFilePath, 'utf8');
      return JSON.parse(data) as TestUser;
    } catch (error) {
      console.error('Error reading testuser from file:', error);
      return undefined;
    }
  }

  // Helper function: Generate story content using AI
  async function generateStoryContent(genre: string, jwt: string): Promise<StoryData> {
    const prompt: llmCompletionRequestMessage = {
      systemMessage: `You are a masterful story designer and writer. Your task is to create engaging and unique story titles and synopses for stories in the genre ${genre}.`,
      userMessage: `Generate a story title and synopsis for a story in the genre ${genre}. The title should be catchy and the synopsis should be engaging.
      The story should be suitable for a young adult audience.
      IMPORTANT: return only in JSON format with the following structure:
      {
        "title": "<title>",
        "synopsis": "<synopsis>"
      }
      Do not include any additional text or explanations.
      The title should be no more than 10 words and the synopsis should be no more than 3-4 sentences.`,
    };

    const options: LLMChatOptions = {
      model: 'google/gemma3-4b',
      temperature: 0.8,
      max_tokens: 1024,
    };

    const storyResponse = await chatCompletion(prompt, options, jwt);
    const strippedResponse = storyResponse.replace(/```json|```/g, '').trim();
    try {
      JSON.parse(strippedResponse);
    } catch (e) {
      console.error('Error parsing JSON response:', e);
      console.error('Response was:', strippedResponse);
      throw new Error('Invalid JSON response from AI');
    }
    console.log('Story content generated successfully:', strippedResponse);
    return JSON.parse(strippedResponse);
  }

  // Helper function: Fill story form and save scenario
  async function fillStory(storyData: StoryData): Promise<void> {
    // Fill in the title and synopsis fields
    const titleInput = await page.waitForSelector('[placeholder="Enter your story title..."]', { visible: true });
    const synopsisInput = await page.waitForSelector('[placeholder="Brief description of your story..."]', { visible: true });

    if (!titleInput || !synopsisInput) {
      throw new Error('Title or synopsis input not found');
    }

    await titleInput.type(storyData.title);
    await synopsisInput.type(storyData.synopsis);

    console.log('Story form filled successfully');
  }

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

  
  describe('Story Creation Flow', () => {
    it('should navigate to story creation', async () => {
      // Navigate to story creation page
      console.log('Navigating to /app...');
      const linkToWriting = await page.waitForSelector('a[data-testid="start-writing-link"]', { visible: true });
      if (!linkToWriting) {
        throw new Error('Start writing link not found');
      }
      await linkToWriting.click();
    }, 60000);

    it('should set the model to google/gemma3-4b', async () => {
      await setSelectedModel('google/gemma3-4b');

      await wait(500); // wait for 500 milliseconds to ensure the model is set
    }, 60000);

    it('should randomize all settings', async () => {
      // Wait for the randomize button to be visible
      const randomizeButton = await page.waitForSelector('text/Randomize All', { visible: true });
      if (!randomizeButton) {
        throw new Error('Randomize button not found');
      }
      await randomizeButton.click();

      console.log('Navigated to story creation and randomized settings');
    }, 60000);

    it('should select the characters tab and generate one random character', async () => {
      // Click on the Characters tab
      const charactersTab = await page.waitForSelector('button[data-testid="characters-tab"]', { visible: true });
      if (!charactersTab) {
        throw new Error('Characters tab not found');
      }
      await charactersTab.click();
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
      await page.waitForSelector('.character-photo__container', { visible: true });
    }, 60000);

    it('should generate story content and fill the form', async () => {
      // Click on the Characters tab
      const generalTab = await page.waitForSelector('button[data-testid="general-tab"]', { visible: true });
      if (!generalTab) {
        throw new Error('general tab not found');
      }
      await generalTab.click();
      console.log('Clicked General tab to select genre');
      // Get selected genre
      const genreField = await page.$('.general-tab__style-field');
      const genreInput = genreField ? await genreField.$('.dropdown-field__input') : null;
      const selectedGenre = genreInput ? await page.evaluate((input) => (input as HTMLInputElement).value, genreInput) : 'fantasy';

      // Generate story content using AI
      const storyData = await generateStoryContent(selectedGenre, testUser.jwt!);
      console.log('Generated story data:', storyData);

      // Fill form and save scenario
      await fillStory(storyData);

      expect(storyData.title).toBeTruthy();
      expect(storyData.synopsis).toBeTruthy();
    }, 600000);

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

    }), 15000; // 15 seconds timeout for saving scenario
  });

  describe('Story Generation and Publishing', () => {
    it('should open story modal and start generation', async () => {
      await generateStory();
      console.log('Story generation process started');
    }, 60000);

    it('should wait for story generation to complete and save', async () => {
      await waitForStoryGenerationAndSave();
      console.log('Story generation completed and saved successfully');
    }, 900000); // 15 minutes timeout for story generation
  });
});
