import { fireEvent, render, screen } from '@testing-library/react';
import { Theme, useTheme } from '../../providers/ThemeProvider';
import { ThemeToggle, ThemeToggleProps } from './ThemeToggle';

// Mock the useTheme hook
jest.mock('../../providers/ThemeProvider', () => {
  const actual = jest.requireActual('../../providers/ThemeProvider');
  return {
    ...actual,
    useTheme: jest.fn(),
  };
});

const mockedUseTheme = useTheme as jest.Mock;

describe('ThemeToggle', () => {
  const setTheme = jest.fn();

  const renderComponent = (props: Partial<ThemeToggleProps> = {}, theme: Theme = 'light') => {
    mockedUseTheme.mockReturnValue({ theme, setTheme });
    return render(<ThemeToggle {...props} />);
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders all theme options', () => {
    renderComponent();
    expect(screen.getByTitle('Switch to light theme')).toBeInTheDocument();
    expect(screen.getByTitle('Switch to dark theme')).toBeInTheDocument();
    expect(screen.getByTitle('Use system theme')).toBeInTheDocument();
  });

  it('calls setTheme when a different theme button is clicked', () => {
    renderComponent({}, 'light');
    fireEvent.click(screen.getByTitle('Switch to dark theme'));
    expect(setTheme).toHaveBeenCalledWith('dark');
    fireEvent.click(screen.getByTitle('Use system theme'));
    expect(setTheme).toHaveBeenCalledWith('system');
    // Clicking the current theme (light) should not call setTheme again
    setTheme.mockClear();
    fireEvent.click(screen.getByTitle('Switch to light theme'));
    expect(setTheme).not.toHaveBeenCalled();
  });

  it('applies the active class to the selected theme', () => {
    renderComponent({}, 'dark');
    const darkLabel = screen.getByTitle('Switch to dark theme');
    expect(darkLabel.parentElement?.querySelector('.theme-toggle__button--dark')).toHaveClass('theme-toggle__button');
  });

  it('shows labels when showLabels is true', () => {
    renderComponent({ showLabels: true });
    expect(screen.getByText('Light')).toBeInTheDocument();
    expect(screen.getByText('Dark')).toBeInTheDocument();
    expect(screen.getByText('System')).toBeInTheDocument();
  });

  it('does not show labels when showLabels is false', () => {
    renderComponent({ showLabels: false });
    expect(screen.queryByText('Light')).not.toBeInTheDocument();
    expect(screen.queryByText('Dark')).not.toBeInTheDocument();
    expect(screen.queryByText('System')).not.toBeInTheDocument();
  });

  it('applies the correct size class for sm', () => {
    renderComponent({ size: 'sm' });
    const buttons = screen.getAllByTitle('Switch to light theme');
    buttons.forEach(btn => {
      expect(btn.parentElement?.parentElement).toHaveClass('theme-toggle--sm');
    });
  });

  it('applies the correct size class for lg', () => {
    renderComponent({ size: 'lg' });
    const buttons = screen.getAllByTitle('Switch to light theme');
    buttons.forEach(btn => {
      expect(btn.parentElement?.parentElement).toHaveClass('theme-toggle--lg');
    });
  });

  it('applies additional className', () => {
    renderComponent({ className: 'custom-class' });
    expect(screen.getByRole('button', { name: /light/i }).closest('.theme-toggle')).toHaveClass('custom-class');
  });

  it('matches snapshot', () => {
    const { container } = renderComponent({ showLabels: true, size: 'lg', className: 'test-class' }, 'system');
    expect(container).toMatchSnapshot();
  });
});
