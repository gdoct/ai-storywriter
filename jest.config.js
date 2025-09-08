export default {
  // Watch specific directories
  watchPathIgnorePatterns: [
    '<rootDir>/backend/',
    '<rootDir>/style-library/storybook/',
    '<rootDir>/style-library/tests/',
    '<rootDir>/node_modules/',
    '<rootDir>/.git/',
  ],
  
  // Define projects to run tests from multiple locations
  projects: [
    {
      displayName: 'Frontend',
      rootDir: './frontend',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      testMatch: [
        '<rootDir>/__tests__/**/*.test.ts?(x)',
        '!<rootDir>/__tests__/**/*.puppeteer.test.ts?(x)'
      ],
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
      roots: ['<rootDir>/src', '<rootDir>/__tests__'],
      setupFilesAfterEnv: ['<rootDir>/setupTests.ts'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: '<rootDir>/tsconfig.json',
        }],
      },
    },
    {
      displayName: 'AI Styles',
      rootDir: './style-library/ai-styles',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      testMatch: [
        '**/src/**/__tests__/**/*.{ts,tsx}',
        '**/src/**/*.{test,spec}.{ts,tsx}',
      ],
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
      },
      collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
        '!src/index.ts',
        '!src/setupTests.ts',
      ],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: '<rootDir>/tsconfig.json',
        }],
      },
    },
  ],
  
  // Global coverage settings
  collectCoverage: false,
  coverageDirectory: '<rootDir>/coverage',
};