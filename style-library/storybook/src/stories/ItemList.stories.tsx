import type { Meta, StoryObj } from '@storybook/react';
import { ItemList, ThemeProvider, ThemeToggle } from '../../../ai-styles/src';

const meta: Meta<typeof ItemList> = {
  title: 'Components/ItemList',
  component: ItemList,
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

type Story = StoryObj<typeof ItemList>;

export const Default: Story = {
  args: {
    items: [
      { key: '1', content: 'Item 1' },
      { key: '2', content: 'Item 2' },
      { key: '3', content: 'Item 3' },
    ],
  },
};
