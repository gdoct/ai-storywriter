import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { RiDownloadLine, RiHeart3Line, RiSettings3Line } from 'react-icons/ri';
import { IconButton, ThemeProvider, ThemeToggle } from '../../../ai-styles/src/index';
const buttonVariants = ['primary', 'secondary', 'danger', 'success', 'ghost'] as const;

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
      {buttonVariants.map((variant) => (
        <div key={variant} style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>{variant.charAt(0).toUpperCase() + variant.slice(1)}</div>
          <IconButton variant={variant} icon={<RiHeart3Line />} />
        </div>
      ))}
    </div>
  ),
};
const meta: Meta<typeof IconButton> = {
  title: 'Components/IconButton',
  component: IconButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A customizable icon button component that can be used to trigger actions. Features disabled and active states with appealing visual feedback.',
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
    onClick: { action: 'clicked' },
    icon: {
      description: 'Custom icon to display',
      control: false,
    },
    active: {
      description: 'Whether the button is in an active state',
      control: 'boolean',
    },
    busy: {
      description: 'Show a busy spinner and prevent further clicks',
      control: 'boolean',
    },
    disabled: {
      description: 'Whether the button is disabled',
      control: 'boolean',
    },
    width: {
      description: 'Custom width for the button',
      control: 'text',
    },
    height: {
      description: 'Custom height for the button',
      control: 'text',
    },
    className: {
      description: 'Additional CSS class name',
      control: 'text',
    },
    size: {
      description: 'Button size',
      control: 'select',
      options: ['sm', 'm', 'l', 'xl'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const WithCustomIcon: Story = {
  args: {
    icon: <RiHeart3Line />,
  },
};

export const Active: Story = {
  args: {
    active: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const Busy: Story = {
  args: {
    busy: true,
  },
};

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>Default</div>
        <IconButton icon={<RiHeart3Line />} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>Active</div>
        <IconButton active icon={<RiHeart3Line />} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>Busy</div>
        <IconButton busy icon={<RiHeart3Line />} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>Disabled</div>
        <IconButton disabled icon={<RiHeart3Line />} />
      </div>
    </div>
  ),
};

export const CustomSize: Story = {
  args: {
    width: '60px',
    height: '60px',
  },
};

export const WithDownloadIcon: Story = {
  args: {
    icon: <RiDownloadLine />,
    width: '50px',
    height: '50px',
  },
};

export const InteractiveDemo: Story = {
  render: (args: any) => {
    const [isActive, setIsActive] = React.useState(false);
    
    const handleClick = () => {
      setIsActive(true);
      setTimeout(() => setIsActive(false), 2000);
    };
    
    return (
      <div style={{ display: 'flex', gap: 'var(--spacing-lg)', alignItems: 'center' }}>
        <IconButton 
          {...args}
          active={isActive}
          onClick={handleClick}
        />
        <span style={{ color: 'var(--color-text-secondary)' }}>
          Click the button to see the active state (2 seconds)
        </span>
      </div>
    );
  },
  args: {
    icon: <RiSettings3Line />,
  },
};

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
      <IconButton size="sm" icon={<RiHeart3Line />} />
      <IconButton size="m" icon={<RiHeart3Line />} />
      <IconButton size="l" icon={<RiHeart3Line />} />
      <IconButton size="xl" icon={<RiHeart3Line />} />
    </div>
  ),
};

export const SizeComparison: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>Small</div>
        <IconButton size="sm" icon={<RiSettings3Line />} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>Medium</div>
        <IconButton size="m" icon={<RiSettings3Line />} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>Large</div>
        <IconButton size="l" icon={<RiSettings3Line />} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>Extra Large</div>
        <IconButton size="xl" icon={<RiSettings3Line />} />
      </div>
    </div>
  ),
};

export const ButtonGrid: Story = {
  render: () => (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(3, 1fr)', 
      gap: 'var(--spacing-lg)',
      padding: 'var(--spacing-lg)'
    }}>
      <div>
        <h4 style={{ 
          fontSize: 'var(--font-size-sm)', 
          color: 'var(--color-text-secondary)',
          marginBottom: 'var(--spacing-sm)'
        }}>
          Default
        </h4>
        <IconButton />
      </div>
      <div>
        <h4 style={{ 
          fontSize: 'var(--font-size-sm)', 
          color: 'var(--color-text-secondary)',
          marginBottom: 'var(--spacing-sm)'
        }}>
          Active
        </h4>
        <IconButton active />
      </div>
      <div>
        <h4 style={{ 
          fontSize: 'var(--font-size-sm)', 
          color: 'var(--color-text-secondary)',
          marginBottom: 'var(--spacing-sm)'
        }}>
          Disabled
        </h4>
        <IconButton disabled />
      </div>
      <div>
        <h4 style={{ 
          fontSize: 'var(--font-size-sm)', 
          color: 'var(--color-text-secondary)',
          marginBottom: 'var(--spacing-sm)'
        }}>
          Heart Icon
        </h4>
        <IconButton icon={<RiHeart3Line />} />
      </div>
      <div>
        <h4 style={{ 
          fontSize: 'var(--font-size-sm)', 
          color: 'var(--color-text-secondary)',
          marginBottom: 'var(--spacing-sm)'
        }}>
          Download Icon
        </h4>
        <IconButton icon={<RiDownloadLine />} />
      </div>
      <div>
        <h4 style={{ 
          fontSize: 'var(--font-size-sm)', 
          color: 'var(--color-text-secondary)',
          marginBottom: 'var(--spacing-sm)'
        }}>
          Large Size
        </h4>
        <IconButton size="l" />
      </div>
    </div>
  ),
};
