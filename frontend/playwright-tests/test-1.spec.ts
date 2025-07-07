import { test } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.locator('[data-test-id="nav-signup"]').click();
  await page.getByRole('textbox', { name: 'Username:' }).click();
  await page.getByRole('textbox', { name: 'Username:' }).fill('username');
  await page.getByRole('textbox', { name: 'Username:' }).press('Tab');
  await page.getByRole('textbox', { name: 'Email:' }).fill('username@test.com');
  await page.getByRole('textbox', { name: 'Password:', exact: true }).click();
  await page.getByRole('textbox', { name: 'Password:', exact: true }).fill('secret1');
  await page.getByRole('textbox', { name: 'Password:', exact: true }).press('Tab');
  await page.getByRole('textbox', { name: 'Confirm Password:' }).fill('secret1');
  await page.locator('form span').click();
  await page.locator('[data-test-id="signupButton"]').click();
});