import type { Meta, StoryObj } from '@storybook/react';
import { RiFileTextLine, RiSettingsLine, RiShieldCheckLine, RiStarLine, RiUserLine } from 'react-icons/ri';
import { ThemeProvider, ThemeToggle, UserMenu } from '../../../ai-styles/src/index';

const meta: Meta<typeof UserMenu> = {
  title: 'Components/UserMenu',
  component: UserMenu,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A comprehensive user menu component with avatar, user details, badges, and customizable menu items.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ThemeProvider defaultTheme="light">
        <div style={{ padding: '2rem', minHeight: '400px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
            <ThemeToggle />
            <Story />
          </div>
        </div>
      </ThemeProvider>
    ),
  ],
  argTypes: {
    onLogout: { action: 'logout clicked' },
    username: {
      description: 'The username to display in the menu',
      control: 'text',
    },
    email: {
      description: 'The email to display in the menu',
      control: 'text',
    },
    avatarUrl: {
      description: 'User avatar image URL',
      control: 'text',
    },
    tier: {
      description: 'User tier/subscription level',
      control: 'select',
      options: ['free', 'pro', 'premium'],
    },
    roles: {
      description: 'User roles array',
      control: 'object',
    },
    credits: {
      description: 'Credit count to display',
      control: 'number',
    },
    size: {
      description: 'Size variant of the menu button',
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    showUsername: {
      description: 'Whether to show username next to avatar',
      control: 'boolean',
    },
    menuItems: {
      description: 'Array of menu items to display',
      control: 'object',
    },
  },
};

export default meta;
type Story = StoryObj<typeof UserMenu>;

const sampleMenuItems = [
  {
    label: 'Profile',
    icon: <RiUserLine />,
    onClick: () => console.log('Profile clicked'),
  },
  {
    label: 'Settings',
    icon: <RiSettingsLine />,
    onClick: () => console.log('Settings clicked'),
  },
  {
    label: 'My Stories',
    icon: <RiFileTextLine />,
    onClick: () => console.log('My Stories clicked'),
  },
  {
    divider: true,
    label: '',
    onClick: () => {},
  },
  {
    label: 'Upgrade Plan',
    icon: <RiStarLine />,
    onClick: () => console.log('Upgrade Plan clicked'),
  },
];

const adminMenuItems = [
  {
    label: 'Admin Panel',
    icon: <RiShieldCheckLine />,
    onClick: () => console.log('Admin Panel clicked'),
    roles: ['admin'],
  },
  {
    divider: true,
    label: '',
    onClick: () => {},
  },
  ...sampleMenuItems,
];

export const Default: Story = {
  args: {
    username: 'John Doe',
    email: 'john.doe@example.com',
    menuItems: sampleMenuItems,
    onLogout: () => console.log('Logout clicked'),
  },
};

export const WithAvatar: Story = {
  args: {
    username: 'Jane Smith',
    email: 'jane.smith@example.com',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    menuItems: sampleMenuItems,
    onLogout: () => console.log('Logout clicked'),
  },
};

export const WithUsername: Story = {
  args: {
    username: 'Alexander Johnson',
    email: 'alex.johnson@example.com',
    showUsername: true,
    menuItems: sampleMenuItems,
    onLogout: () => console.log('Logout clicked'),
  },
};

export const FreeUser: Story = {
  args: {
    username: 'Free User',
    email: 'free@example.com',
    tier: 'free',
    credits: 10,
    menuItems: sampleMenuItems,
    onLogout: () => console.log('Logout clicked'),
  },
};

export const ProUser: Story = {
  args: {
    username: 'Pro User',
    email: 'pro@example.com',
    tier: 'pro',
    credits: 1000,
    menuItems: sampleMenuItems,
    onLogout: () => console.log('Logout clicked'),
  },
};

export const PremiumUser: Story = {
  args: {
    username: 'Premium User',
    email: 'premium@example.com',
    tier: 'premium',
    credits: 10000,
    menuItems: sampleMenuItems,
    onLogout: () => console.log('Logout clicked'),
  },
};

export const WithRoles: Story = {
  args: {
    username: 'Admin User',
    email: 'admin@example.com',
    tier: 'premium',
    roles: ['admin', 'moderator'],
    credits: 50000,
    menuItems: adminMenuItems,
    onLogout: () => console.log('Logout clicked'),
  },
};

export const SmallSize: Story = {
  args: {
    username: 'Small User',
    email: 'small@example.com',
    size: 'sm',
    menuItems: sampleMenuItems,
    onLogout: () => console.log('Logout clicked'),
  },
};

export const LargeSize: Story = {
  args: {
    username: 'Large User',
    email: 'large@example.com',
    size: 'lg',
    showUsername: true,
    tier: 'pro',
    credits: 2500,
    menuItems: sampleMenuItems,
    onLogout: () => console.log('Logout clicked'),
  },
};

export const LongUsernameAndEmail: Story = {
  args: {
    username: 'This is a very long username that should be truncated',
    email: 'this.is.a.very.long.email.address.that.should.be.truncated@example.com',
    showUsername: true,
    tier: 'premium',
    roles: ['admin'],
    credits: 99999,
    menuItems: sampleMenuItems,
    onLogout: () => console.log('Logout clicked'),
  },
};

export const MinimalMenu: Story = {
  args: {
    username: 'Minimal User',
    menuItems: [
      {
        label: 'Profile',
        icon: <RiUserLine />,
        onClick: () => console.log('Profile clicked'),
      },
    ],
    onLogout: () => console.log('Logout clicked'),
  },
};

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
        <h4>Small</h4>
        <UserMenu
          username="Small User"
          email="small@example.com"
          size="sm"
          menuItems={sampleMenuItems}
          onLogout={() => console.log('Logout clicked')}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
        <h4>Medium</h4>
        <UserMenu
          username="Medium User"
          email="medium@example.com"
          size="md"
          menuItems={sampleMenuItems}
          onLogout={() => console.log('Logout clicked')}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
        <h4>Large</h4>
        <UserMenu
          username="Large User"
          email="large@example.com"
          size="lg"
          menuItems={sampleMenuItems}
          onLogout={() => console.log('Logout clicked')}
        />
      </div>
    </div>
  ),
};

export const AllTiers: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
        <h4>Free</h4>
        <UserMenu
          username="Free User"
          email="free@example.com"
          tier="free"
          credits={10}
          menuItems={sampleMenuItems}
          onLogout={() => console.log('Logout clicked')}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
        <h4>Pro</h4>
        <UserMenu
          username="Pro User"
          email="pro@example.com"
          tier="pro"
          credits={1000}
          menuItems={sampleMenuItems}
          onLogout={() => console.log('Logout clicked')}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
        <h4>Premium</h4>
        <UserMenu
          username="Premium User"
          email="premium@example.com"
          tier="premium"
          credits={10000}
          menuItems={sampleMenuItems}
          onLogout={() => console.log('Logout clicked')}
        />
      </div>
    </div>
  ),
};

export const EmptyMenuItems: Story = {
  args: {
    username: 'Empty Menu User',
    email: 'empty@example.com',
    menuItems: [],
    onLogout: () => console.log('Logout clicked'),
  },
};

export const RoleBasedMenu: Story = {
  args: {
    username: 'Role User',
    email: 'role@example.com',
    roles: ['admin'],
    menuItems: [
      {
        label: 'Public Item',
        icon: <RiUserLine />,
        onClick: () => console.log('Public item clicked'),
      },
      {
        label: 'Admin Only',
        icon: <RiShieldCheckLine />,
        onClick: () => console.log('Admin only clicked'),
        roles: ['admin'],
      },
      {
        label: 'Moderator Only',
        icon: <RiSettingsLine />,
        onClick: () => console.log('Moderator only clicked'),
        roles: ['moderator'],
      },
    ],
    onLogout: () => console.log('Logout clicked'),
  },
};