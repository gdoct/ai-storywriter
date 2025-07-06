import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Button, ConfirmDialog, ThemeProvider, ThemeToggle } from '../../../ai-styles/src/index';

const meta: Meta<typeof ConfirmDialog> = {
  title: 'Components/ConfirmDialog',
  component: ConfirmDialog,
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
  argTypes: {
    onConfirm: { action: 'confirmed' },
    onCancel: { action: 'cancelled' },
    variant: {
      description: 'Dialog variant - affects styling and button colors',
      control: 'select',
      options: ['default', 'danger'],
    },
  },
};
export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Confirm Dialog</Button>
        <ConfirmDialog
          open={open}
          title="Confirm Action"
          message="Are you sure you want to proceed?"
          onConfirm={() => { setOpen(false); alert('Confirmed!'); }}
          onCancel={() => setOpen(false)}
          variant="default"
        />
      </>
    );
  },
};

export const Danger: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="danger" onClick={() => setOpen(true)}>Delete Item</Button>
        <ConfirmDialog
          open={open}
          title="Delete Confirmation"
          message="This action cannot be undone. Are you sure you want to delete this item?"
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={() => { setOpen(false); alert('Item deleted!'); }}
          onCancel={() => setOpen(false)}
          variant="danger"
        />
      </>
    );
  },
};

export const VariantComparison: Story = {
  render: () => {
    const [defaultOpen, setDefaultOpen] = useState(false);
    const [dangerOpen, setDangerOpen] = useState(false);
    return (
      <>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <Button onClick={() => setDefaultOpen(true)}>Default Dialog</Button>
          <Button variant="danger" onClick={() => setDangerOpen(true)}>Danger Dialog</Button>
        </div>

        <ConfirmDialog
          open={defaultOpen}
          title="Save Changes"
          message="Do you want to save your changes before continuing?"
          confirmText="Save"
          cancelText="Discard"
          onConfirm={() => { setDefaultOpen(false); alert('Changes saved!'); }}
          onCancel={() => setDefaultOpen(false)}
          variant="default"
        />

        <ConfirmDialog
          open={dangerOpen}
          title="Delete Account"
          message="This will permanently delete your account and all associated data. This action cannot be undone."
          confirmText="Delete Account"
          cancelText="Keep Account"
          onConfirm={() => { setDangerOpen(false); alert('Account deleted!'); }}
          onCancel={() => setDangerOpen(false)}
          variant="danger"
        />
      </>
    );
  },
};

export const CustomText: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Custom Text Dialog</Button>
        <ConfirmDialog
          open={open}
          title="Purchase Premium"
          message="Upgrade to Premium for unlimited access to all features. This will charge $9.99 to your account."
          confirmText="Purchase Now"
          cancelText="Maybe Later"
          onConfirm={() => { setOpen(false); alert('Purchase confirmed!'); }}
          onCancel={() => setOpen(false)}
          variant="default"
        />
      </>
    );
  },
};
