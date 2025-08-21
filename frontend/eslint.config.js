import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'

export default [
  {
    ignores: ['dist', 'build', 'node_modules', '**/*.js'],
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // Strict ESLint rules
      '@typescript-eslint/no-unused-vars': 'off',
      'no-unused-vars': 'off', // Turn off base rule as it conflicts with @typescript-eslint version
      '@typescript-eslint/no-empty-function': ['error', {
        allow: ['arrowFunctions', 'methods']
      }],
      'no-empty-function': 'off', // Turn off base rule
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', '__tests__/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.jest,
      },
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      // Strict ESLint rules
      '@typescript-eslint/no-unused-vars': 'off',
      'no-unused-vars': 'off', // Turn off base rule as it conflicts with @typescript-eslint version
      '@typescript-eslint/no-empty-function': ['error', {
        allow: ['arrowFunctions', 'methods']
      }],
      'no-empty-function': 'off', // Turn off base rule
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['playwright-tests/**/*.{ts,tsx}', 'playwright.config.ts'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...js.configs.recommended.rules,
      // Strict ESLint rules
      '@typescript-eslint/no-unused-vars': 'off',
      'no-unused-vars': 'off', // Turn off base rule as it conflicts with @typescript-eslint version
      '@typescript-eslint/no-empty-function': ['error', {
        allow: ['arrowFunctions', 'methods']
      }],
      'no-empty-function': 'off', // Turn off base rule
      '@typescript-eslint/no-explicit-any': 'off',
      'no-async-promise-executor': 'off', // Playwright tests may need this
    },
  },
]