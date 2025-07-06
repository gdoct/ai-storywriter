import type { Meta, StoryObj } from '@storybook/react';
import { HamburgerMenu, ThemeProvider, ThemeToggle } from '../../../ai-styles';

const meta: Meta<typeof HamburgerMenu> = {
  title: 'Components/HamburgerMenu',
  component: HamburgerMenu,
  tags: ['autodocs'],
    decorators: [
      (Story) => (
        <ThemeProvider defaultTheme="light">
          <div style={{ width: '400px', padding: '2rem' }}>
            <ThemeToggle />
            <Story />
          </div>
        </ThemeProvider>
      ),
    ],
};
export default meta;

type Story = StoryObj<typeof HamburgerMenu>;

export const Default: Story = {
  args: {
    children: <div style={{ padding: 16 }}>Menu content here</div>,
  },
};

export const CustomIcon: Story = {
  args: {
    icon: <span style={{ fontSize: 24 }}>🍔</span>,
    children: <div style={{ padding: 16 }}>Custom icon menu</div>,
  },
};

export const CustomContent: Story = {
  args: {
    children: (
      <ul style={{ margin: 0, padding: 16 }}>
        <li>Item 1</li>
        <li>Item 2</li>
        <li>Item 3</li>
      </ul>
    ),
  },
};
