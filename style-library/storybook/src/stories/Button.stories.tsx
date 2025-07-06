import type { Meta, StoryObj } from '@storybook/react';
import { RiHeartLine, RiSendPlaneLine, RiStarLine } from 'react-icons/ri';
import { Button, ThemeProvider, ThemeToggle } from '../../../ai-styles/src/index';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A versatile button component with icon support, busy state, and custom sizing options.',
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
    children: {
      description: 'Button label text',
      control: 'text',
    },
    icon: {
      description: 'Optional icon to display left of the text',
      control: false,
    },
    busy: {
      description: 'Show a busy spinner and prevent further clicks',
      control: 'boolean',
    },
    disabled: {
      description: 'Disable the button',
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
    variant: {
      description: 'Button variant style',
      control: 'select',
      options: ['primary', 'secondary', 'tertiary', 'danger', 'ghost', 'success'],
    },
    size: {
      description: 'Button size',
      control: 'select',
      options: ['sm', 'm', 'l', 'xl'],
    },
  },
};
export default meta;

type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: {
    children: 'Primary Button',
    variant: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Secondary Button',
    variant: 'secondary',
  },
};

export const Tertiary: Story = {
  args: {
    children: 'Tertiary Button',
    variant: 'tertiary',
  },
};

export const Danger: Story = {
  args: {
    children: 'Danger Button',
    variant: 'danger',
  },
};

export const Ghost: Story = {
  args: {
    children: 'Ghost Button',
    variant: 'ghost',
  },
};

export const Success: Story = {
  args: {
    children: 'Success Button',
    variant: 'success',
  },
};

export const WithIcon: Story = {
  args: {
    children: 'Send Message',
    icon: <RiSendPlaneLine />,
    variant: 'primary',
  },
};

export const Busy: Story = {
  args: {
    children: 'Processing...',
    busy: true,
  },
};

export const Disabled: Story = {
  args: {
    children: 'Disabled Button',
    disabled: true,
  },
};

export const CustomSize: Story = {
  args: {
    children: 'Large Button',
    width: '200px',
    height: '50px',
  },
};

export const IconOnly: Story = {
  args: {
    children: '',
    icon: <RiHeartLine />,
    width: '48px',
    height: '48px',
  },
};

export const LongText: Story = {
  args: {
    children: 'This is a very long button text to test wrapping',
    icon: <RiStarLine />,
    variant: 'primary',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="tertiary">Tertiary</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="success">Success</Button>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
      <Button size="sm">Small</Button>
      <Button size="m">Medium</Button>
      <Button size="l">Large</Button>
      <Button size="xl">Extra Large</Button>
    </div>
  ),
};

export const SizeComparison: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
      <Button size="sm" variant="primary" icon={<RiSendPlaneLine />}>Small Button</Button>
      <Button size="m" variant="secondary" icon={<RiSendPlaneLine />}>Medium Button</Button>
      <Button size="l" variant="tertiary" icon={<RiSendPlaneLine />}>Large Button</Button>
      <Button size="xl" variant="success" icon={<RiSendPlaneLine />}>Extra Large Button</Button>
    </div>
  ),
};

export const AsLink: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
      <Button as="a" href="#link" variant="primary">
        Link Button
      </Button>
      <Button as="a" href="#link" variant="secondary" icon={<RiSendPlaneLine />}>
        Link with Icon
      </Button>
      <Button as="a" href="#external" target="_blank" rel="noopener" variant="tertiary">
        External Link
      </Button>
    </div>
  ),
};

export const Polymorphic: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <h4 style={{ marginBottom: '0.5rem' }}>As Button (default)</h4>
        <Button variant="primary">Regular Button</Button>
      </div>
      <div>
        <h4 style={{ marginBottom: '0.5rem' }}>As Link</h4>
        <Button as="a" href="#navigation" variant="secondary">
          Navigation Link
        </Button>
      </div>
      <div>
        <h4 style={{ marginBottom: '0.5rem' }}>As Div</h4>
        <Button as="div" variant="tertiary" icon={<RiStarLine />}>
          Clickable Div
        </Button>
      </div>
    </div>
  ),
};
