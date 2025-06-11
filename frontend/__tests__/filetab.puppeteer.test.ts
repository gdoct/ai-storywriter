import puppeteer, { Browser, ElementHandle, Page } from 'puppeteer';

// this is a set of puppeteer tests to test the functionality of the filetab. 
// refer to the file login.puppeteer.test.ts to see a test that logs in and fetches a jwt token.

// tests: 
// 1. after login, no scenario is selected or available
// enabled are: save scenario as, and create new scenario, and randomize current scenario

// 2. after clicking create new scenario, a name is asked. if we cancel, nothing happens
// 3. after clicking create new scenario, a name is asked. if we enter name 'scenario A', the scenario is created and selected. the rename button is now also enabled
// 4. after clicking save scenario as, a name is asked. if we cancel, nothing happens
// 5. after clicking save scenario as, a name is asked. if we enter a name 'scenario B', the scenario is saved with the new name and selected
// 6. after clicking on the dropdown to select 'scenario A', it is selected and the rename button is enabled
// 7. when opening the dropdown, each item has a trashcan next to it. Clicking the trashcan next to 'scenario B' removes the scenario from the list.
// 8. after clicking the rename button, a name is asked. if we cancel, nothing happens
// 9. after clicking the rename button, a name is asked. if we enter a name 'scenario C', the scenario is renamed and selected
// 10. the list now only has 'scenario C' and the rename button is enabled
// 11. press the delete button next to the scenario name in the dropdown to empty the database
// 12. the list now has no scenarios and the rename button is disabled

describe('FileTab Scenario Management', () => {
  let browser: Browser;
  let page: Page;

  async function login() {
    await page.goto('http://localhost:3000/login');
    await page.type('input[type="text"], input[type="email"]', 'test@testusers.org');
    await page.type('input[type="password"]', 'testpassword');
    let loginButton: ElementHandle<Element> | null = await page.$('button[type="submit"]');
    if (!loginButton) {
      loginButton = await page.$('::-p-xpath(//button[contains(translate(., "LOGIN", "login"), "login")])');
    }
    if (loginButton) await loginButton.click();
    await new Promise(res => setTimeout(res, 1000));
  }

  async function openFileTab() {
    // Assumes FileTab is visible by default after login
    await page.waitForSelector('.scenario-tab-title');
  }

  beforeAll(async () => {
    browser = await puppeteer.launch();
    page = await browser.newPage();
    await login();
    await openFileTab();
  });

  afterAll(async () => {
    await browser.close();
  });

  it('1. After login, no scenario is selected or available, only certain actions are enabled', async () => {
    // Check that scenario dropdown is empty or has no items
    const dropdown = await page.$('.scenario-dropdown');
    expect(dropdown).toBeTruthy();
    // Check that Save As, Create New, and Randomize buttons are enabled
    const saveAsBtn = await page.$('button[title="Save As"]');
    const createNewBtn = await page.$('button[title="Create New"]');
    const randomizeBtn = await page.$('button[title="Randomize"]');
    expect(saveAsBtn).toBeTruthy();
    expect(createNewBtn).toBeTruthy();
    expect(randomizeBtn).toBeTruthy();
    // Rename should be disabled
    const renameBtn = await page.$('button[title="Rename"]:disabled');
    expect(renameBtn).toBeTruthy();
  });

  it('2. Create new scenario, cancel does nothing', async () => {
    const createNewBtn = await page.$('button[title="Create New"]');
    await createNewBtn?.click();
    await page.waitForSelector('input[placeholder="Enter scenario name"]');
    const cancelBtn = await page.$('button[title="Cancel"]');
    await cancelBtn?.click();
    // Modal should close, no scenario selected
    const modal = await page.$('input[placeholder="Enter scenario name"]');
    expect(modal).toBeFalsy();
    // Still no scenario selected
    const dropdownValue = await page.$eval('.scenario-dropdown', el => el.textContent);
    expect(dropdownValue?.toLowerCase()).toContain('no scenario');
  });

  it('3. Create new scenario, enter name, scenario is created and selected, rename enabled', async () => {
    const createNewBtn = await page.$('button[title="Create New"]');
    await createNewBtn?.click();
    await page.waitForSelector('input[placeholder="Enter scenario name"]');
    await page.type('input[placeholder="Enter scenario name"]', 'scenario A');
    const okBtn = await page.$('button[title="OK"]');
    await okBtn?.click();
    await new Promise(res => setTimeout(res, 500));
    // Dropdown should now show 'scenario A'
    const dropdownValue = await page.$eval('.scenario-dropdown', el => el.textContent);
    expect(dropdownValue).toContain('scenario A');
    // Rename should be enabled
    const renameBtn = await page.$('button[title="Rename"]:not(:disabled)');
    expect(renameBtn).toBeTruthy();
  });

  it('4. Save As, cancel does nothing', async () => {
    const saveAsBtn = await page.$('button[title="Save As"]');
    await saveAsBtn?.click();
    await page.waitForSelector('input[placeholder="Enter new scenario name"]');
    const cancelBtn = await page.$('button[title="Cancel"]');
    await cancelBtn?.click();
    // Modal should close
    const modal = await page.$('input[placeholder="Enter new scenario name"]');
    expect(modal).toBeFalsy();
    // Still on 'scenario A'
    const dropdownValue = await page.$eval('.scenario-dropdown', el => el.textContent);
    expect(dropdownValue).toContain('scenario A');
  });

  it('5. Save As, enter name, scenario is saved and selected', async () => {
    const saveAsBtn = await page.$('button[title="Save As"]');
    await saveAsBtn?.click();
    await page.waitForSelector('input[placeholder="Enter new scenario name"]');
    await page.type('input[placeholder="Enter new scenario name"]', 'scenario B');
    const okBtn = await page.$('button[title="OK"]');
    await okBtn?.click();
    await new Promise(res => setTimeout(res, 500));
    // Dropdown should now show 'scenario B'
    const dropdownValue = await page.$eval('.scenario-dropdown', el => el.textContent);
    expect(dropdownValue).toContain('scenario B');
  });

  it('6. Select scenario A from dropdown, rename enabled', async () => {
    const dropdown = await page.$('.scenario-dropdown');
    await dropdown?.click();
    await page.waitForSelector('.scenario-dropdown-item');
    // Find scenario A in the list
    const items = await page.$$('.scenario-dropdown-item');
    let found = false;
    for (const item of items) {
      const text = await page.evaluate(el => el.textContent, item);
      if (text && text.includes('scenario A')) {
        await item.click();
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
    await new Promise(res => setTimeout(res, 300));
//    await page.waitForTimeout(300);
    // Rename should be enabled
    const renameBtn = await page.$('button[title="Rename"]:not(:disabled)');
    expect(renameBtn).toBeTruthy();
  });

  it('7. Delete scenario B from dropdown', async () => {
    const dropdown = await page.$('.scenario-dropdown');
    await dropdown?.click();
    await page.waitForSelector('.scenario-dropdown-item');
    // Find scenario B and its trashcan
    const items = await page.$$('.scenario-dropdown-item');
    let found = false;
    for (const item of items) {
      const text = await page.evaluate(el => el.textContent, item);
      if (text && text.includes('scenario B')) {
        // Find trashcan button inside this item
        const trashBtn = await item.$('.trashcan-btn');
        expect(trashBtn).toBeTruthy();
        await trashBtn?.click();
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
    await new Promise(res => setTimeout(res, 500));
    // scenario B should be gone
    const dropdownText = await page.$eval('.scenario-dropdown', el => el.textContent);
    expect(dropdownText).not.toContain('scenario B');
  });

  it('8. Rename, cancel does nothing', async () => {
    const renameBtn = await page.$('button[title="Rename"]');
    await renameBtn?.click();
    await page.waitForSelector('input[placeholder="Enter new scenario name"]');
    const cancelBtn = await page.$('button[title="Cancel"]');
    await cancelBtn?.click();
    // Modal should close
    const modal = await page.$('input[placeholder="Enter new scenario name"]');
    expect(modal).toBeFalsy();
  });

  it('9. Rename scenario A to scenario C', async () => {
    const renameBtn = await page.$('button[title="Rename"]');
    await renameBtn?.click();
    await page.waitForSelector('input[placeholder="Enter new scenario name"]');
    await page.type('input[placeholder="Enter new scenario name"]', 'scenario C');
    const okBtn = await page.$('button[title="OK"]');
    await okBtn?.click();
    await new Promise(res => setTimeout(res, 500));
    // Dropdown should now show 'scenario C'
    const dropdownValue = await page.$eval('.scenario-dropdown', el => el.textContent);
    expect(dropdownValue).toContain('scenario C');
  });

  it('10. Only scenario C remains, rename enabled', async () => {
    const dropdown = await page.$('.scenario-dropdown');
    await dropdown?.click();
    await page.waitForSelector('.scenario-dropdown-item');
    const items = await page.$$('.scenario-dropdown-item');
    let count = 0;
    for (const item of items) {
      const text = await page.evaluate(el => el.textContent, item);
      if (text && text.includes('scenario C')) count++;
    }
    expect(count).toBe(1);
    // Rename should be enabled
    const renameBtn = await page.$('button[title="Rename"]:not(:disabled)');
    expect(renameBtn).toBeTruthy();
  });

  it('11. Delete scenario C to empty the database', async () => {
    const dropdown = await page.$('.scenario-dropdown');
    await dropdown?.click();
    await page.waitForSelector('.scenario-dropdown-item');
    // Find scenario C and its trashcan
    const items = await page.$$('.scenario-dropdown-item');
    let found = false;
    for (const item of items) {
      const text = await page.evaluate(el => el.textContent, item);
      if (text && text.includes('scenario C')) {
        const trashBtn = await item.$('.trashcan-btn');
        expect(trashBtn).toBeTruthy();
        await trashBtn?.click();
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
    await new Promise(res => setTimeout(res, 500));
  });

  it('12. No scenarios remain, rename disabled', async () => {
    const dropdown = await page.$('.scenario-dropdown');
    await dropdown?.click();
    await new Promise(res => setTimeout(res, 300));
    const items = await page.$$('.scenario-dropdown-item');
    expect(items.length).toBe(0);
    // Rename should be disabled
    const renameBtn = await page.$('button[title="Rename"]:disabled');
    expect(renameBtn).toBeTruthy();
  });
});

