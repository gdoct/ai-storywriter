import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Button, ThemeProvider } from '../../../ai-styles/src/index';

const meta: Meta<typeof ThemeProvider> = {
  title: 'Components/ThemeProvider',
  component: ThemeProvider,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj;

export const ThemeSwitcher: Story = {
  render: () => {
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    return (
      <ThemeProvider defaultTheme={theme}>
        <div style={{ padding: 24, textAlign: 'center' }}>
          <h3>Current theme: {theme}</h3>
          <Button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
            Switch to {theme === 'light' ? 'dark' : 'light'} theme
          </Button>
          <div style={{ marginTop: 24 }}>
            <p>This content is wrapped by ThemeProvider.</p>
          </div>
        </div>
      </ThemeProvider>
    );
  },
};
