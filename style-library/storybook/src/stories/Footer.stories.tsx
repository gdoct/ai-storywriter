import type { Meta, StoryObj } from '@storybook/react';
import { Footer, ThemeProvider, ThemeToggle } from '../../../ai-styles/src/index';

const meta: Meta<typeof Footer> = {
  title: 'Components/Footer',
  component: Footer,
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

type Story = StoryObj<typeof Footer>;

export const Default: Story = {
  args: {},
};

export const WithContent: Story = {
  args: {
    children: (
      <>
        <span>© 2025 My Company</span>
        <span style={{ marginLeft: 16 }}>All rights reserved.</span>
      </>
    ),
  },
};
