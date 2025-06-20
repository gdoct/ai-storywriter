module.exports = {
  launch: {
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: 'chromium-browser', // Use the system-installed Chromium
  },
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/__tests__/**/*.puppeteer.test.ts?(x)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  roots: ['<rootDir>/src', '<rootDir>/__tests__'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
  setupFilesAfterEnv: ['<rootDir>/setupTests.ts'],
};
