import {
    applyTheme,
    createSystemThemeListener,
    getCSSVariable,
    getStoredTheme,
    getSystemTheme,
    initializeTheme,
    resolveTheme,
    setCSSVariable,
    setStoredTheme,
    themeClasses
} from './theme';

describe('theme utils', () => {
  const storageKey = 'test-theme';
  const origMatchMedia = window.matchMedia;
  const origSetAttribute = document.documentElement.setAttribute;
  let metaThemeColor: HTMLMetaElement;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.setAttribute = jest.fn();
    metaThemeColor = document.createElement('meta');
    metaThemeColor.setAttribute('name', 'theme-color');
    document.head.appendChild(metaThemeColor);
    window.matchMedia = jest.fn().mockImplementation((query) => {
      return {
        matches: query === '(prefers-color-scheme: dark)',
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      };
    });
  });

  afterEach(() => {
    document.head.removeChild(metaThemeColor);
    window.matchMedia = origMatchMedia;
    document.documentElement.setAttribute = origSetAttribute;
    jest.clearAllMocks();
  });

  it('getStoredTheme returns null if not set', () => {
    expect(getStoredTheme(storageKey)).toBeNull();
  });

  it('getStoredTheme returns theme if set', () => {
    localStorage.setItem(storageKey, 'dark');
    expect(getStoredTheme(storageKey)).toBe('dark');
  });

  it('setStoredTheme sets theme in localStorage', () => {
    setStoredTheme('light', storageKey);
    expect(localStorage.getItem(storageKey)).toBe('light');
  });

  it('getSystemTheme returns dark if matchMedia matches', () => {
    window.matchMedia = jest.fn().mockReturnValue({ matches: true });
    expect(getSystemTheme()).toBe('dark');
  });

  it('getSystemTheme returns light if matchMedia does not match', () => {
    window.matchMedia = jest.fn().mockReturnValue({ matches: false });
    expect(getSystemTheme()).toBe('light');
  });

  it('resolveTheme returns theme if not system', () => {
    expect(resolveTheme('dark')).toBe('dark');
    expect(resolveTheme('light')).toBe('light');
  });

  it('resolveTheme returns system theme if system', () => {
    window.matchMedia = jest.fn().mockReturnValue({ matches: true });
    expect(resolveTheme('system')).toBe('dark');
    window.matchMedia = jest.fn().mockReturnValue({ matches: false });
    expect(resolveTheme('system')).toBe('light');
  });

  it('applyTheme sets data-theme and meta theme-color', () => {
    applyTheme('dark');
    expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
    expect(metaThemeColor.getAttribute('content')).toBe('#111827');
    applyTheme('light');
    expect(metaThemeColor.getAttribute('content')).toBe('#ffffff');
  });

  it('initializeTheme applies and returns resolved theme', () => {
    setStoredTheme('dark', storageKey);
    expect(initializeTheme('light', storageKey)).toBe('dark');
    setStoredTheme('system', storageKey);
    window.matchMedia = jest.fn().mockReturnValue({ matches: true });
    expect(initializeTheme('light', storageKey)).toBe('dark');
  });

  it('createSystemThemeListener adds and removes event listener', () => {
    const addEventListener = jest.fn();
    const removeEventListener = jest.fn();
    window.matchMedia = jest.fn().mockReturnValue({
      matches: false,
      addEventListener,
      removeEventListener,
    });
    const cb = jest.fn();
    const cleanup = createSystemThemeListener(cb);
    expect(addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    cleanup();
    expect(removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('themeClasses returns correct class names', () => {
    expect(themeClasses.light).toBe('theme-light');
    expect(themeClasses.dark).toBe('theme-dark');
  });

  it('getCSSVariable and setCSSVariable work on documentElement', () => {
    setCSSVariable('--test-var', '42px');
    expect(getCSSVariable('--test-var')).toBe('42px');
  });

  it('getCSSVariable and setCSSVariable work on custom element', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    setCSSVariable('--foo', 'bar', el);
    expect(getCSSVariable('--foo', el)).toBe('bar');
    document.body.removeChild(el);
  });
});
