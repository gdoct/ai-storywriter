/**
 * Theme utilities and helper functions
 */

export type Theme = 'light' | 'dark' | 'system';

/**
 * Get the current theme from localStorage
 */
export const getStoredTheme = (storageKey = 'docomo-theme'): Theme | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(storageKey) as Theme;
    return stored && ['light', 'dark', 'system'].includes(stored) ? stored : null;
  } catch {
    return null;
  }
};

/**
 * Store theme in localStorage
 */
export const setStoredTheme = (theme: Theme, storageKey = 'docomo-theme'): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(storageKey, theme);
  } catch {
    // Silently fail if localStorage is not available
  }
};

/**
 * Get system theme preference
 */
export const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

/**
 * Resolve theme to actual light/dark value
 */
export const resolveTheme = (theme: Theme): 'light' | 'dark' => {
  return theme === 'system' ? getSystemTheme() : theme;
};

/**
 * Apply theme to document
 */
export const applyTheme = (theme: 'light' | 'dark'): void => {
  if (typeof document === 'undefined') return;
  
  document.documentElement.setAttribute('data-theme', theme);
  
  // Update meta theme-color for mobile browsers
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', theme === 'dark' ? '#111827' : '#ffffff');
  }
};

/**
 * Initialize theme on app startup
 */
export const initializeTheme = (defaultTheme: Theme = 'system', storageKey = 'docomo-theme'): 'light' | 'dark' => {
  const storedTheme = getStoredTheme(storageKey) || defaultTheme;
  const resolvedTheme = resolveTheme(storedTheme);
  applyTheme(resolvedTheme);
  return resolvedTheme;
};

/**
 * Create a media query listener for system theme changes
 */
export const createSystemThemeListener = (callback: (theme: 'light' | 'dark') => void): (() => void) => {
  if (typeof window === 'undefined') return () => {};
  
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handleChange = (e: MediaQueryListEvent) => {
    callback(e.matches ? 'dark' : 'light');
  };
  
  mediaQuery.addEventListener('change', handleChange);
  
  // Return cleanup function
  return () => mediaQuery.removeEventListener('change', handleChange);
};

/**
 * CSS class names for theme-aware styling
 */
export const themeClasses = {
  light: 'theme-light',
  dark: 'theme-dark',
} as const;

/**
 * Get CSS custom property value
 */
export const getCSSVariable = (property: string, element?: HTMLElement): string => {
  if (typeof window === 'undefined') return '';
  
  return getComputedStyle(element || document.documentElement)
    .getPropertyValue(property)
    .trim();
};

/**
 * Set CSS custom property value
 */
export const setCSSVariable = (property: string, value: string, element?: HTMLElement): void => {
  if (typeof document === 'undefined') return;
  
  (element || document.documentElement).style.setProperty(property, value);
};
