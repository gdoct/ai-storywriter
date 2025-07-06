export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['./src/setupTests.ts'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/setupTests.ts',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  testMatch: [
    '**/src/**/__tests__/**/*.{ts,tsx}',
    '**/src/**/*.{test,spec}.{ts,tsx}',
  ],
};
