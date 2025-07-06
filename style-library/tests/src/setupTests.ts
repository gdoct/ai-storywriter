// Global test setup for Playwright E2E tests
import { chromium, type Browser } from 'playwright';

declare global {
  var browser: Browser;
}

export async function setup() {
  // Setup runs before all tests
  globalThis.browser = await chromium.launch({
    headless: true,
  });
}

export async function teardown() {
  // Teardown runs after all tests
  if (globalThis.browser) {
    await globalThis.browser.close();
  }
}
