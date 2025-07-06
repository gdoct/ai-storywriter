import type { Meta, StoryObj } from '@storybook/react';
import { Button, Hero, ThemeProvider, ThemeToggle } from '../../../ai-styles/src/index';

const meta: Meta<typeof Hero> = {
  title: 'Components/Hero',
  component: Hero,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ThemeProvider defaultTheme="light">
        <div style={{ width: '100%', minHeight: '400px' }}>
          <ThemeToggle />
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
  argTypes: {
    title: {
      control: 'text',
      description: 'Main title text',
    },
    subtitle: {
      control: 'text',
      description: 'Optional subtitle text',
    },
    image: {
      control: 'text',
      description: 'Hero image URL',
    },
    className: {
      control: 'text',
      description: 'Optional className for custom styling',
    },
    children: {
      control: false,
      description: 'Optional custom content below the title/subtitle',
    },
    cta: {
      control: false,
      description: 'Optional call-to-action button',
    },
    buttonBar: {
      control: false,
      description: 'Optional button bar for multiple actions',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Hero>;

export const Default: Story = {
  args: {
    title: 'Welcome to the Hero Section',
    subtitle: 'This is a subtitle for the hero component.',
  },
};

export const WithImage: Story = {
  args: {
    title: 'Hero with Image',
    subtitle: 'A hero section showcasing an image alongside content.',
    image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=500&h=300&fit=crop',
  },
};

export const WithCTA: Story = {
  args: {
    title: 'Hero with Call-to-Action',
    subtitle: 'Add a primary action button to drive user engagement.',
    cta: <Button variant="primary" size="l">Get Started</Button>,
  },
};

export const WithButtonBar: Story = {
  args: {
    title: 'Hero with Button Bar',
    subtitle: 'Multiple action buttons for different user paths.',
    buttonBar: (
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <Button variant="primary">Primary Action</Button>
        <Button variant="secondary">Secondary Action</Button>
        <Button variant="tertiary">Learn More</Button>
      </div>
    ),
  },
};

export const WithCTAAndButtonBar: Story = {
  args: {
    title: 'Hero with CTA and Button Bar',
    subtitle: 'Combine a primary CTA with additional action buttons.',
    cta: <Button variant="primary" size="l">Get Started Now</Button>,
    buttonBar: (
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <Button variant="secondary">Watch Demo</Button>
        <Button variant="tertiary">Learn More</Button>
      </div>
    ),
  },
};

export const WithCustomContent: Story = {
  args: {
    title: 'Hero with Custom Content',
    subtitle: 'Add custom content below the title and subtitle.',
    children: (
      <div style={{ marginTop: '16px' }}>
        <p>This is custom content that appears in the description area. You can add any React components here.</p>
        <ul style={{ marginTop: '12px' }}>
          <li>Feature 1: Amazing functionality</li>
          <li>Feature 2: Great user experience</li>
          <li>Feature 3: Powerful integrations</li>
        </ul>
      </div>
    ),
    cta: <Button variant="primary">Start Free Trial</Button>,
  },
};

export const FullFeatured: Story = {
  args: {
    title: 'Full Featured Hero Section',
    subtitle: 'Showcasing all available props and features of the Hero component.',
    image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=500&h=300&fit=crop',
    children: (
      <div style={{ marginTop: '16px' }}>
        <p>Transform your workflow with our powerful platform. Built for teams who demand excellence and efficiency.</p>
      </div>
    ),
    cta: <Button variant="primary" size="l">Start Your Journey</Button>,
    buttonBar: (
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <Button variant="secondary">View Demo</Button>
        <Button variant="tertiary">Read Documentation</Button>
        <Button variant="ghost">Contact Sales</Button>
      </div>
    ),
  },
};

export const MarketplaceExample: Story = {
  name: 'Marketplace Example',
  args: {
    title: 'Story Marketplace',
    subtitle: 'Discover amazing stories from our community of writers',
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500&h=300&fit=crop',
    children: (
      <div style={{ marginTop: '16px' }}>
        <p>Explore thousands of captivating stories, connect with talented authors, and find your next favorite read.</p>
      </div>
    ),
    cta: <Button variant="primary" size="l">Browse Stories</Button>,
    buttonBar: (
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <Button variant="secondary">Publish Your Story</Button>
        <Button variant="tertiary">Join Community</Button>
      </div>
    ),
  },
};
