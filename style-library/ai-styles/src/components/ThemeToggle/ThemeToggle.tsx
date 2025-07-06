import React from 'react';
import { RiComputerLine, RiMoonLine, RiSunLine } from 'react-icons/ri';
import type { Theme } from '../../providers/ThemeProvider';
import { useTheme } from '../../providers/ThemeProvider';
import { IconButton } from '../IconButton/IconButton';
import './ThemeToggle.css';

export interface ThemeToggleProps {
  /** Show theme labels */
  showLabels?: boolean;
  /** Size of the toggle buttons */
  size?: 'xxs' | 'xs' | 'sm' | 'md' | 'lg';
  /** Additional CSS class name */
  className?: string;
}

const themeConfig = {
  light: {
    icon: <RiSunLine />,
    label: 'Light',
    title: 'Switch to light theme',
  },
  dark: {
    icon: <RiMoonLine />,
    label: 'Dark',
    title: 'Switch to dark theme',
  },
  system: {
    icon: <RiComputerLine />,
    label: 'System',
    title: 'Use system theme',
  },
} as const;

const sizeMap = {
  xxs: '16px',
  xs: '20px',
  sm: '32px',
  md: '40px',
  lg: '48px',
} as const;

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  showLabels = false,
  size = 'md',
  className = '',
}) => {
  const { theme, setTheme } = useTheme();

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  const buttonSize = sizeMap[size];

  const containerClasses = [
    'theme-toggle',
    showLabels ? 'theme-toggle--with-labels' : '',
    `theme-toggle--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClasses}>
      {(Object.keys(themeConfig) as Theme[]).map((themeOption) => {
        const config = themeConfig[themeOption];
        const isActive = theme === themeOption;

        return (
          <div key={themeOption} className="theme-toggle__option">
            <IconButton
              icon={config.icon}
              onClick={() => handleThemeChange(themeOption)}
              active={isActive}
              width={buttonSize}
              height={buttonSize}
              title={config.title}
              className={`theme-toggle__button theme-toggle__button--${themeOption}`}
            />
            {showLabels && (
              <span className={`theme-toggle__label ${isActive ? 'theme-toggle__label--active' : ''}`}>
                {config.label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};
