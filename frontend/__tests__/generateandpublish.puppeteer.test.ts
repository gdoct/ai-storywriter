import { faker } from '@faker-js/faker';
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

  beforeAll(async () => {
    browser = await puppeteer.launch({ 
      headless: false, 
      slowMo: 2, 
      defaultViewport: { width: 1200, height: 1080 } 
    });
    page = await browser.newPage();
    await page.setViewport({
      width: 1200,
      height: 1080,
      deviceScaleFactor: 1,
    });

    // Initialize test user data
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    testUser = {
      username: `${firstName} ${lastName}`,
      email: `${firstName}.${lastName}@${faker.internet.domainName()}`.toLowerCase(),
      password: 'TestPassword123!'
    };
  });

  afterAll(async () => {
    await deleteUser(testUser.email);
    console.log('Test user deleted successfully');
    await browser.close();
  });

  // Helper function: Navigate to page and wait for it to load
  async function navigateToPage(url: string): Promise<void> {
    console.log(`Navigating to ${url}...`);
    await page.goto(url);
  }

  // Helper function: Perform user signup
  async function signupUser(user: TestUser): Promise<string> {
    console.log('Starting user signup process...');
    
    await navigateToPage('http://localhost:3000/signup');

    // Wait for signup form to load
    try {
      await page.waitForSelector('form', { visible: true, timeout: 5000 });
      await page.waitForFunction(() => {
        return document.querySelector('form') &&
          document.querySelector('input[name="username"], input#username') &&
          document.querySelector('input[type="email"], input[name="email"]') &&
          document.querySelector('input[type="password"], input[name="password"]');
      }, { timeout: 10000 });
    } catch (e) {
      console.error('Error waiting for signup form:', e);
      await page.screenshot({ path: 'debug-signup-page.png' });
      throw e;
    }

    // Fill out the signup form
    const usernameInput = await page.waitForSelector('input[name="username"], input#username', { visible: true });
    const emailInput = await page.waitForSelector('input[type="email"], input[name="email"]', { visible: true });
    const passwordInputs = await page.$$('input[type="password"]');

    if (passwordInputs.length < 2) {
      throw new Error('Expected at least 2 password fields (password and confirm password)');
    }

    await usernameInput.type(user.username);
    await emailInput.type(user.email);
    await passwordInputs[0].type(user.password);
    await passwordInputs[1].type(user.password);

    // Accept terms if checkbox exists
    const termsCheckboxLabel = await page.$('span.checkmark');
    if (termsCheckboxLabel) {
      await termsCheckboxLabel.click();
    }

    // Submit the form
    console.log('Submitting signup form...');
    try {
      const signupButton = await page.waitForSelector('button[data-test-id="signupButton"]');
      await signupButton.click();
    } catch (e) {
      await page.screenshot({ path: 'debug-signup-form.png' });
      throw e;
    }

    // Wait for successful signup (user avatar appears)
    try {
      console.log('Waiting for user avatar to appear after signup...');
      await page.waitForSelector('.user-button', { visible: true, timeout: 12000 });
      console.log('Signup successful!');
    } catch (e) {
      await page.screenshot({ path: 'debug-signup-after-submit.png' });
      throw new Error('User avatar not found after signup - check screenshot for details');
    }

    // Get JWT token from localStorage
    const jwt = await page.evaluate(() => localStorage.getItem('token'));
    if (!jwt) {
      throw new Error('No JWT token found in localStorage after signup');
    }

    return jwt;
  }

  // Helper function: Get user profile data
  async function getUserProfile(jwt: string): Promise<any> {
    const userProfile = await fetch('http://localhost:3000/api/me/profile', {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });
    
    if (!userProfile.ok) {
      throw new Error(`Failed to fetch user profile: ${userProfile.status}`);
    }
    
    return await userProfile.json();
  }

  // Helper function: Upgrade user to premium
  async function upgradeUserToPremium(userEmail: string): Promise<void> {
    const authToken = process.env.ADMIN_TOKEN;
    if (!authToken) {
      throw new Error('ADMIN_TOKEN is not set in environment variables');
    }

    console.log('Upgrading user to premium...');
    const upgradeResponse = await fetch(`http://localhost:3000/api/admin/upgrade-user`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: userEmail }),
    });

    if (!upgradeResponse.ok) {
      const errorText = await upgradeResponse.text();
      throw new Error(`Failed to upgrade user: ${upgradeResponse.status} ${errorText}`);
    }

    console.log('User upgraded to premium successfully');
  }

  async function deleteUser(userEmail: string): Promise<void> {
    const authToken = process.env.ADMIN_TOKEN;
    if (!authToken) {
      throw new Error('ADMIN_TOKEN is not set in environment variables');
    }
    // find user by calling /api/admin/users/find/<email>
    const findResponse = await fetch(`http://localhost:3000/api/admin/users/find/${userEmail}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!findResponse.ok) {
      const errorText = await findResponse.text();
      throw new Error(`Failed to find user: ${findResponse.status} ${errorText}`);
    }
    const userData = await findResponse.json();
    if (!userData || !userData.user_id) {
      throw new Error(`User with email ${userEmail} not found`);
    }
    const deleteResponse = await fetch(`http://localhost:3000/api/admin/users/${userData.user_id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!deleteResponse.ok) {
      const errorText = await deleteResponse.text();
      throw new Error(`Failed to delete user: ${deleteResponse.status} ${errorText}`);
    }

    console.log('User deleted successfully');
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
    return JSON.parse(strippedResponse);
  }

  // Helper function: Fill story form and save scenario
  async function fillStoryFormAndSave(storyData: StoryData): Promise<void> {
    // Fill in the title and synopsis fields
    const titleInput = await page.waitForSelector('[placeholder="Enter your story title..."]', { visible: true });
    await titleInput.type(storyData.title);

    const synopsisInput = await page.waitForSelector('[placeholder="Brief description of your story..."]', { visible: true });
    await synopsisInput.type(storyData.synopsis);

    console.log('Story form filled successfully');

    // Click the "Save Scenario" button
    const saveScenarioButton = await page.waitForSelector('.scenario-editor__save-button', { visible: true });
    
    if (!saveScenarioButton) {
      throw new Error('Save Scenario button not found');
    }
    
    await saveScenarioButton.click();
    console.log('Scenario saved successfully');
    // wait 50 ms before continuing
    await new Promise(res => setTimeout(res, 50));
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

  async function gotoDashboardAndPublishStory() : Promise<void> {
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
    const publishModalButton = await page.waitForSelector('div.scenario-group:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(2) > button:nth-child(2)', { visible: true });
    if (!publishModalButton) {
      throw new Error('Publish button in modal not found');
    }
    await publishModalButton.click();

    console.log('Story published successfully');
    // Wait for 20 seconds to ensure the story is published
    await new Promise(resolve => setTimeout(resolve, 20000));
  }

  describe('User Registration and Setup', () => {
    it('should successfully register a new user', async () => {
      testUser.jwt = await signupUser(testUser);
      
      // Verify user avatar is present
      const avatar = await page.$('.user-button');
      expect(avatar).toBeTruthy();
      expect(testUser.jwt).toBeTruthy();
    });

    it('should get user profile and upgrade to premium', async () => {
      // Get user profile data
      const userData = await getUserProfile(testUser.jwt!);
      testUser.userId = userData.user_id;
      
      console.log('User profile data:', userData);
      expect(userData.user_id).toBeTruthy();

      // Upgrade user to premium
      await upgradeUserToPremium(userData.email);

      // Verify upgrade was successful
      const upgradedUserData = await getUserProfile(testUser.jwt!);
      console.log('Upgraded user profile data:', upgradedUserData);
      expect(upgradedUserData.tier).toBe('premium');
    });
  });

  describe('Story Creation Flow', () => {
    it('should navigate to story creation and randomize settings', async () => {
      // Navigate to story creation page
      console.log('Navigating to /app...');
      const linkToWriting = await page.waitForSelector('a[data-testid="start-writing-link"]', { visible: true });
      await linkToWriting.click();

      // Click randomize button
      const randomizeButton = await page.locator('text/Randomize All');
      await randomizeButton.click();
      
      console.log('Navigated to story creation and randomized settings');
    });

    it('should select the characters tab and generate two random characters', async () => {
      // Click on the Characters tab
      const charactersTab = await page.waitForSelector('button[data-testid="characters-tab"]', { visible: true });
      await charactersTab.click();  
      for (let i = 0; i < 2; i++) {
        const generateRandomCharacterButton = await page.waitForSelector('.generate-random-character-btn', { visible: true });
        await generateRandomCharacterButton.click();
        console.log('Clicked Generate Random Character button');

        const finalButton = await page.waitForSelector('.random-character-modal__generate-button', { visible: true });
        await finalButton.click();
        console.log('Generated random character successfully');
      }
    });

    it('should generate story content and fill the form', async () => {
      // Get selected genre
      const genreField = await page.$('.general-tab__style-field');
      const genreInput = genreField ? await genreField.$('.dropdown-field__input') : null;
      const selectedGenre = genreInput ? await page.evaluate((input) => (input as HTMLInputElement).value, genreInput) : 'fantasy';

      // Generate story content using AI
      const storyData = await generateStoryContent(selectedGenre, testUser.jwt!);
      console.log('Generated story data:', storyData);

      // Fill form and save scenario
      await fillStoryFormAndSave(storyData);
      
      expect(storyData.title).toBeTruthy();
      expect(storyData.synopsis).toBeTruthy();
    }, 90000000);
  });

  describe('Story Generation and Publishing', () => {
    it('should open story modal and start generation', async () => {
      await generateStory();
      console.log('Story generation process started');
    });

    it('should wait for story generation to complete and save', async () => {
      await waitForStoryGenerationAndSave();
      console.log('Story generation completed and saved successfully');
    }, 900000); // 15 minutes timeout for story generation

    it ('Should publish from the dashboard page after agreeing terms', async () => {
      await gotoDashboardAndPublishStory();
      console.log('Story published successfully');
    }, 30000);
  });
});
