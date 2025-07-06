// Global type declarations for Jest and Puppeteer E2E tests

import puppeteer from 'puppeteer';

declare global {
  var browser: puppeteer.Browser;
  
  // Jest globals
  var describe: jest.Describe;
  var it: jest.It;
  var test: jest.It;
  var beforeAll: jest.Lifecycle;
  var afterAll: jest.Lifecycle;
  var beforeEach: jest.Lifecycle;
  var afterEach: jest.Lifecycle;
  var expect: jest.Expect;
}

export {};
