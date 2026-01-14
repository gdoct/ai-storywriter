import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { RiAddLine, RiEditLine, RiDeleteBinLine, RiSearchLine, RiFilterLine, RiDownloadLine } from 'react-icons/ri';
import { ButtonGroup, Button, IconButton, ThemeProvider, ThemeToggle } from '../../../ai-styles/src/index';

const meta: Meta<typeof ButtonGroup> = {
  title: 'Components/ButtonGroup',
  component: ButtonGroup,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A container component that groups Button and IconButton components together with unified styling and spacing.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ThemeProvider defaultTheme="light">
        <div style={{ padding: '2rem' }}>
          <ThemeToggle />
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
  argTypes: {
    children: {
      description: 'Button or IconButton components to group together',
      control: false,
    },
    className: {
      description: 'Additional CSS class name',
      control: 'text',
    },
    'aria-label': {
      description: 'ARIA label for the toolbar',
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ButtonGroup>;

export const Default: Story = {
  render: () => (
    <ButtonGroup>
      <Button variant="primary">Save</Button>
      <Button variant="secondary">Cancel</Button>
    </ButtonGroup>
  ),
};

export const WithIconButtons: Story = {
  render: () => (
    <ButtonGroup>
      <IconButton icon={<RiEditLine />} />
      <IconButton icon={<RiDeleteBinLine />} />
      <IconButton icon={<RiDownloadLine />} />
    </ButtonGroup>
  ),
};

export const Mixed: Story = {
  render: () => (
    <ButtonGroup>
      <Button variant="primary" icon={<RiAddLine />}>New</Button>
      <IconButton icon={<RiEditLine />} />
      <IconButton icon={<RiDeleteBinLine />} />
    </ButtonGroup>
  ),
};

export const AllButtons: Story = {
  render: () => (
    <ButtonGroup>
      <Button variant="primary">Save</Button>
      <Button variant="secondary">Edit</Button>
      <Button variant="tertiary">Preview</Button>
      <Button variant="danger">Delete</Button>
    </ButtonGroup>
  ),
};

export const ToolbarExample: Story = {
  render: () => (
    <ButtonGroup aria-label="Document toolbar">
      <Button variant="primary" icon={<RiAddLine />}>New</Button>
      <IconButton icon={<RiEditLine />} />
      <IconButton icon={<RiSearchLine />} />
      <IconButton icon={<RiFilterLine />} />
      <Button variant="secondary" icon={<RiDownloadLine />}>Export</Button>
    </ButtonGroup>
  ),
};

export const ActionGroups: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <h4 style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>File Actions</h4>
        <ButtonGroup>
          <Button variant="primary" icon={<RiAddLine />}>New</Button>
          <Button variant="secondary">Save</Button>
          <Button variant="tertiary">Save As</Button>
        </ButtonGroup>
      </div>

      <div>
        <h4 style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>Edit Actions</h4>
        <ButtonGroup>
          <IconButton icon={<RiEditLine />} />
          <IconButton icon={<RiDeleteBinLine />} />
          <Button variant="secondary">Duplicate</Button>
        </ButtonGroup>
      </div>

      <div>
        <h4 style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>View Actions</h4>
        <ButtonGroup>
          <IconButton icon={<RiSearchLine />} />
          <IconButton icon={<RiFilterLine />} />
          <Button variant="ghost">Reset</Button>
        </ButtonGroup>
      </div>
    </div>
  ),
};

export const ButtonStates: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <h4 style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>Default</h4>
        <ButtonGroup>
          <Button variant="primary">Save</Button>
          <Button variant="secondary">Cancel</Button>
          <IconButton icon={<RiEditLine />} />
        </ButtonGroup>
      </div>

      <div>
        <h4 style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>With Active States</h4>
        <ButtonGroup>
          <Button variant="primary">Save</Button>
          <Button variant="secondary">Cancel</Button>
          <IconButton icon={<RiEditLine />} active />
        </ButtonGroup>
      </div>

      <div>
        <h4 style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>With Disabled</h4>
        <ButtonGroup>
          <Button variant="primary">Save</Button>
          <Button variant="secondary" disabled>Cancel</Button>
          <IconButton icon={<RiDeleteBinLine />} disabled />
        </ButtonGroup>
      </div>
    </div>
  ),
};

export const ButtonVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <h4 style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>Primary Group</h4>
        <ButtonGroup>
          <Button variant="primary">Primary 1</Button>
          <Button variant="primary">Primary 2</Button>
          <Button variant="primary">Primary 3</Button>
        </ButtonGroup>
      </div>

      <div>
        <h4 style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>Secondary Group</h4>
        <ButtonGroup>
          <Button variant="secondary">Secondary 1</Button>
          <Button variant="secondary">Secondary 2</Button>
          <Button variant="secondary">Secondary 3</Button>
        </ButtonGroup>
      </div>

      <div>
        <h4 style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>Mixed Variants</h4>
        <ButtonGroup>
          <Button variant="primary">Save</Button>
          <Button variant="secondary">Edit</Button>
          <Button variant="tertiary">Preview</Button>
          <Button variant="danger">Delete</Button>
        </ButtonGroup>
      </div>
    </div>
  ),
};

export const ButtonSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
      <div>
        <h4 style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>Small</h4>
        <ButtonGroup>
          <Button size="sm" variant="primary">Save</Button>
          <Button size="sm" variant="secondary">Cancel</Button>
          <IconButton size="sm" icon={<RiEditLine />} />
        </ButtonGroup>
      </div>

      <div>
        <h4 style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>Medium (Default)</h4>
        <ButtonGroup>
          <Button size="m" variant="primary">Save</Button>
          <Button size="m" variant="secondary">Cancel</Button>
          <IconButton size="m" icon={<RiEditLine />} />
        </ButtonGroup>
      </div>

      <div>
        <h4 style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>Large</h4>
        <ButtonGroup>
          <Button size="l" variant="primary">Save</Button>
          <Button size="l" variant="secondary">Cancel</Button>
          <IconButton size="l" icon={<RiEditLine />} />
        </ButtonGroup>
      </div>

      <div>
        <h4 style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>Extra Large</h4>
        <ButtonGroup>
          <Button size="xl" variant="primary">Save</Button>
          <Button size="xl" variant="secondary">Cancel</Button>
          <IconButton size="xl" icon={<RiEditLine />} />
        </ButtonGroup>
      </div>
    </div>
  ),
};

export const InteractiveDemo: Story = {
  render: () => {
    const [activeAction, setActiveAction] = React.useState<string | null>(null);

    const handleAction = (action: string) => {
      setActiveAction(action);
      setTimeout(() => setActiveAction(null), 2000);
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <ButtonGroup aria-label="Interactive toolbar">
          <Button
            variant="primary"
            icon={<RiAddLine />}
            onClick={() => handleAction('new')}
          >
            New
          </Button>
          <IconButton
            icon={<RiEditLine />}
            active={activeAction === 'edit'}
            onClick={() => handleAction('edit')}
          />
          <IconButton
            icon={<RiSearchLine />}
            active={activeAction === 'search'}
            onClick={() => handleAction('search')}
          />
          <Button
            variant="secondary"
            icon={<RiDownloadLine />}
            onClick={() => handleAction('download')}
          >
            Export
          </Button>
        </ButtonGroup>

        {activeAction && (
          <div style={{
            padding: '0.5rem',
            backgroundColor: 'var(--color-surface)',
            borderRadius: '0.25rem',
            fontSize: '0.875rem',
            color: 'var(--color-text-secondary)'
          }}>
            Action triggered: <strong>{activeAction}</strong> (active for 2 seconds)
          </div>
        )}
      </div>
    );
  },
};