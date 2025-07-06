import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Button, ErrorDialog, ThemeProvider, ThemeToggle } from '../../../ai-styles/src/index';

const meta: Meta<typeof ErrorDialog> = {
  title: 'Components/ErrorDialog',
  component: ErrorDialog,
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

type Story = StoryObj;

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Show Error Dialog</Button>
        <ErrorDialog
          open={open}
          title="Error Occurred"
          message="Something went wrong. Please try again."
          onConfirm={() => setOpen(false)}
        />
      </>
    );
  },
};
