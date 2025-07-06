import type { Meta, StoryObj } from '@storybook/react';
import { Label, ThemeProvider, ThemeToggle } from '../../../ai-styles';

const meta: Meta<typeof Label> = {
  title: 'Components/Label',
  component: Label,
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
    size: {
      description: 'Label size',
      control: 'select',
      options: ['sm', 'm', 'l', 'xl'],
    },
  },
};
export default meta;

type Story = StoryObj<typeof Label>;

export const Default: Story = {
  args: {
    children: 'Label text',
  },
};

export const WithHtmlFor: Story = {
  args: {
    children: 'Label for input',
    htmlFor: 'input-id',
  },
};

export const WithClassName: Story = {
  args: {
    children: 'Styled label',
    className: 'custom-label',
  },
};

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Label size="sm">Small Label</Label>
      <Label size="m">Medium Label</Label>
      <Label size="l">Large Label</Label>
      <Label size="xl">Extra Large Label</Label>
    </div>
  ),
};

export const SizeComparison: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '2rem', flexWrap: 'wrap' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: '0.5rem', fontSize: '0.75rem', color: '#666' }}>Small</div>
        <Label size="sm">Form Label</Label>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: '0.5rem', fontSize: '0.75rem', color: '#666' }}>Medium</div>
        <Label size="m">Form Label</Label>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: '0.5rem', fontSize: '0.75rem', color: '#666' }}>Large</div>
        <Label size="l">Form Label</Label>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: '0.5rem', fontSize: '0.75rem', color: '#666' }}>Extra Large</div>
        <Label size="xl">Form Label</Label>
      </div>
    </div>
  ),
};
