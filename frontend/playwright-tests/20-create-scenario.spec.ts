import { test } from '@playwright/test';
import dotenv from 'dotenv';
import { StyleSettings } from '../src/types/ScenarioTypes';
import { loginToSite, readTestUserFromFile, TestUser, waitForTextInputToSettle, waitForAiTextBoxGeneration } from './testutils';
dotenv.config();

test.describe('Generate and edit scenario workflows', () => {
  let testUser: TestUser;

  test.beforeAll("Test initialization", async () => {
    console.log('\nTEST: Generate and edit scenario workflows');
    const user = await readTestUserFromFile();
    if (user) {
      console.log('Found existing test user, using it for tests');
      testUser = user;
    } else {
      throw new Error('No test user found. Please run the signup test first.');
    }
  });


  test('should create a new scenario and save it', async ({ page }) => {
    test.setTimeout(600000); // 10 minutes
    console.log('\nTEST: Create a new scenario and save it');
    const DELAY = 500;
    await loginToSite(page, testUser);
    await page.getByTestId('start-writing-link').click();

    //   await page.getByRole('button', { name: 'LLM Settings' }).click({ delay: DELAY });
    const defaultmodel = process.env.TEST_MODEL || 'google/gemma3-4b';
    console.log('Using model:', defaultmodel);
    await page.getByRole('button', { name: 'LLM Settings' }).click({ delay: DELAY });
    await page.getByLabel('Model:').selectOption('google/gemma-3-4b');
    await page.getByRole('slider', { name: 'Temperature:' }).fill('0.82');
    await page.getByTestId('story-title-input').click(); await page.getByTestId('story-title-input').click();
    // //  await page.getByLabel('Model:').selectOption(defaultmodel);

    //   await page.getByRole('slider', { name: 'Temperature:' }).fill('0.85');
    //   await page.getByRole('button', { name: 'Save', exact: true }).click();

    //   await page.getByRole('button', { name: 'Save', exact: true }).click();
    const genre_selector = '.ai-dropdown.ai-dropdown--m.genre__dropdown > .ai-dropdown__input-container > .ai-dropdown__buttons > .icon-button.icon-button--m.icon-button--primary.ai-dropdown__toggle-button';
    await page.locator(genre_selector).click();

    // select a random genre from the list
    const randomGenreId = [Math.floor(Math.random() * 3)];
    // select option # randomGenre from the dropdown with the selector 
    await page.locator('.ai-dropdown__option').nth(randomGenreId[0]).click();

    if (process.env.STYLE_OVERRIDE) {
      const ovr = JSON.parse(process.env.STYLE_OVERRIDE) as StyleSettings;
      console.log('Overriding style ');
      await page.getByRole('combobox', { name: 'Select or enter writing style' }).click();
      await page.getByRole('combobox', { name: 'Select or enter writing style' }).fill(ovr.style || '');
      await page.getByRole('combobox', { name: 'Select or enter genre...' }).click();
      await page.getByRole('combobox', { name: 'Select or enter genre...' }).fill(ovr.genre || '');
      await page.getByRole('combobox', { name: 'Select or enter tone...' }).click();
      await page.getByRole('combobox', { name: 'Select or enter tone...' }).fill(ovr.tone || '');
      await page.getByRole('combobox', { name: 'Select or enter the type of' }).click();
      await page.getByRole('combobox', { name: 'Select or enter the type of' }).fill(ovr.communicationStyle || '');
      await page.getByRole('combobox', { name: 'Select or enter theme...' }).click();
      await page.getByRole('combobox', { name: 'Select or enter theme...' }).fill(ovr.theme || '');
      await page.getByRole('textbox', { name: 'Any additional style' }).click();
      await page.getByRole('textbox', { name: 'Any additional style' }).fill(ovr.other || '');
    }

    console.log('generating scenario title and synopsis');

    await page.locator('div').filter({ hasText: /^Scenario Title$/ }).getByRole('button').click();
    await waitForAiTextBoxGeneration(page);
   
    await page.getByRole('button', { name: 'Add tab' }).click({ delay: DELAY });

    await page.getByRole('button', { name: 'Characters' }).click({ delay: DELAY });

    console.log('Creating characters for the scenario');
    await page.getByRole('button', { name: 'Generate Character...' }).click({ delay: DELAY });
    await page.locator('div').filter({ hasText: /^Character Name$/ }).getByRole('button').click({ delay: DELAY });
    await page.getByRole('button', { name: 'Create Character' }).click({ delay: DELAY });

    // wait until the ai is done generating. the photouploadmodal will close
    await page.waitForSelector('div[data-testid="photo-upload-modal"]', { state: 'hidden', timeout: 60000 });

    await page.getByRole('button', { name: 'Generate Character...' }).click({ delay: DELAY });
    await page.getByRole('button', { name: 'Get different random photo' }).click({ delay: DELAY });
    await page.getByRole('button', { name: 'Get different random photo' }).click({ delay: DELAY });
    await page.locator('div').filter({ hasText: /^Character Name$/ }).getByRole('button').click({ delay: DELAY });
    await page.getByRole('button', { name: 'Create Character' }).click({ delay: DELAY });

    await page.waitForSelector('div[data-testid="photo-upload-modal"]', { state: 'hidden', timeout: 60000 });

    await page.getByRole('button', { name: 'Save', exact: true }).click({ delay: DELAY });
    await page.getByRole('button', { name: 'Add tab' }).click({ delay: DELAY });
    await page.getByRole('button', { name: 'Backstory' }).click({ delay: DELAY });

    console.log('Generating backstory for the scenario');

    await page.getByRole('button', { name: '✨ Generate Backstory' }).click({ delay: DELAY });
    // ai-textarea__input ai-textarea__input--m ai-textarea__input--light
    await waitForTextInputToSettle(page, 'textarea.ai-textarea__input', 600000);
    await page.getByRole('button', { name: 'Save', exact: true }).click({ delay: DELAY });
    await page.getByRole('link', { name: 'StoryWriter Logo StoryWriter' }).click({ delay: DELAY });

    console.log('Scenario should be created and saved successfully');
  });
});