# E2E Testing with Playwright

This directory contains end-to-end tests for the @drdata/ai-styles component library using modern Playwright testing framework.

## Technologies Used

- **Playwright** 1.53.1 - Modern browser automation and testing
- **TypeScript** 5.8.3 - Type safety and modern JavaScript features
- **Node.js** types for environment support

## Test Structure

```
tests/
├── src/
│   ├── components/
│   │   ├── AiTextBox.modern.e2e.test.ts    # AiTextBox component tests
│   │   └── IconButton.modern.e2e.test.ts   # IconButton component tests
│   └── setupTests.ts                       # Test setup configuration
├── playwright.config.ts                    # Playwright configuration
└── package.json                           # Dependencies and scripts
```

## Available Scripts

```bash
# Run all tests
npm run test

# Run with browser UI (headed mode)
npm run test:headed

# Run with Playwright UI for debugging
npm run test:ui

# Show test report
npm run test:report

# Run only E2E tests
npm run test:e2e
```

## Running Tests

1. **Start Storybook first** (required for E2E tests):
   ```bash
   cd ../storybook
   npm run storybook
   ```
   Or use the project script:
   ```bash
   cd .. && ./scripts/start-storybook.sh
   ```

2. **Run the tests**:
   ```bash
   # Install dependencies (first time)
   npm install
   
   # Run all tests
   npm run test
   ```

## Test Features

### Modern Playwright API
- Uses `page.locator()` for element selection
- Built-in `expect()` assertions with auto-retry
- `page.fill()` and `page.click()` for interactions
- Better error handling and debugging

### Cross-browser Testing
- Tests run on Chromium, Firefox, and WebKit
- Mobile device emulation support
- Consistent behavior across browsers

### Auto-waiting and Retries
- Automatic waiting for elements to be actionable
- Built-in retry logic for flaky tests
- Intelligent timeout handling

## Writing New Tests

```typescript
import { test, expect, type Page } from '@playwright/test';

test.describe('Component Name', () => {
  test('should do something', async ({ page }: { page: Page }) => {
    await page.goto('/iframe.html?id=component-story');
    
    const element = page.locator('.component-class');
    await expect(element).toBeVisible();
    
    await element.click();
    await expect(element).toHaveClass(/active/);
  });
});
```

## Debugging

- Use `npm run test:headed` to see tests running in browser
- Use `npm run test:ui` for interactive debugging
- Add `await page.pause()` in tests for step-by-step debugging

## Configuration

The `playwright.config.ts` file configures:
- Test directory and file patterns
- Browser projects (Chromium, Firefox, WebKit)
- Web server integration (auto-starts Storybook)
- Reporters and trace collection
