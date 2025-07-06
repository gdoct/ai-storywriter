import { act, render, screen } from '@testing-library/react';
import { ThemeProvider, useTheme } from './ThemeProvider';

const getMetaThemeColor = () => document.querySelector('meta[name="theme-color"]');

describe('ThemeProvider', () => {
  const storageKey = 'test-theme';
  const origMatchMedia = window.matchMedia;
  const origSetAttribute = document.documentElement.setAttribute;
  let metaThemeColor: HTMLMetaElement;

  beforeEach(() => {
    // Clean up localStorage and DOM
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

  function TestComponent() {
    const { theme, resolvedTheme, setTheme } = useTheme();
    return (
      <div>
        <span data-testid="theme">{theme}</span>
        <span data-testid="resolvedTheme">{resolvedTheme}</span>
        <button onClick={() => setTheme('light')}>Light</button>
        <button onClick={() => setTheme('dark')}>Dark</button>
        <button onClick={() => setTheme('system')}>System</button>
      </div>
    );
  }

  it('provides default theme and resolvedTheme', () => {
    render(
      <ThemeProvider storageKey={storageKey} defaultTheme="system">
        <TestComponent />
      </ThemeProvider>
    );
    expect(screen.getByTestId('theme').textContent).toBe('system');
    expect(['light', 'dark']).toContain(screen.getByTestId('resolvedTheme').textContent);
  });

  it('initializes theme from localStorage', () => {
    localStorage.setItem(storageKey, 'dark');
    render(
      <ThemeProvider storageKey={storageKey} defaultTheme="light">
        <TestComponent />
      </ThemeProvider>
    );
    expect(screen.getByTestId('theme').textContent).toBe('dark');
  });

  it('setTheme updates theme and localStorage', () => {
    render(
      <ThemeProvider storageKey={storageKey} defaultTheme="light">
        <TestComponent />
      </ThemeProvider>
    );
    act(() => {
      screen.getByText('Dark').click();
    });
    expect(screen.getByTestId('theme').textContent).toBe('dark');
    expect(localStorage.getItem(storageKey)).toBe('dark');
  });

  it('setTheme to system updates resolvedTheme based on matchMedia', () => {
    render(
      <ThemeProvider storageKey={storageKey} defaultTheme="light">
        <TestComponent />
      </ThemeProvider>
    );
    act(() => {
      screen.getByText('System').click();
    });
    expect(screen.getByTestId('theme').textContent).toBe('system');
    expect(['light', 'dark']).toContain(screen.getByTestId('resolvedTheme').textContent);
  });

  it('applies data-theme attribute to document.documentElement', () => {
    render(
      <ThemeProvider storageKey={storageKey} defaultTheme="dark">
        <TestComponent />
      </ThemeProvider>
    );
    expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
  });

  it('updates meta theme-color', () => {
    render(
      <ThemeProvider storageKey={storageKey} defaultTheme="dark">
        <TestComponent />
      </ThemeProvider>
    );
    expect(getMetaThemeColor()?.getAttribute('content')).toBe('#111827');
  });

  it('throws if useTheme is used outside provider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    function BadComponent() {
      useTheme();
      return null;
    }
    expect(() => render(<BadComponent />)).toThrow('useTheme must be used within a ThemeProvider');
    spy.mockRestore();
  });

  it('listens for system theme changes when theme is system', () => {
    const addEventListener = jest.fn();
    window.matchMedia = jest.fn().mockReturnValue({
      matches: true,
      addEventListener,
      removeEventListener: jest.fn(),
    });
    render(
      <ThemeProvider storageKey={storageKey} defaultTheme="system">
        <TestComponent />
      </ThemeProvider>
    );
    expect(addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });
});
