import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ThemeToggle } from '../../../ai-styles/src';
import { Dialog } from '../../../ai-styles/src/components/Dialog/Dialog';
import { ThemeProvider } from '../../../ai-styles/src/providers/ThemeProvider';

const meta: Meta<typeof Dialog> = {
  title: 'Components/Dialog',
  component: Dialog,
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

type Story = StoryObj<typeof Dialog>;

export const Default: Story = {
  render: (args) => {
    const [open, setOpen] = useState(true);
    return (
      <ThemeProvider>
        <Dialog
          {...args}
          open={open}
          onOk={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        >
          This is a dialog content.
        </Dialog>
      </ThemeProvider>
    );
  },
  args: {
    title: 'Dialog Title',
    showCancel: true,
    okText: 'OK',
    cancelText: 'Cancel',
  },
};
