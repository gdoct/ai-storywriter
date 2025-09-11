import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { RiMagicLine, RiSettings2Line, RiUserLine, RiCheckLine } from 'react-icons/ri';
import { Button, Wizard, ThemeProvider, ThemeToggle } from '../../../ai-styles/src/index';
import type { WizardStep } from '../../../ai-styles/src/index';

const meta: Meta<typeof Wizard> = {
  title: 'Components/Wizard',
  component: Wizard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A multi-step wizard component that guides users through complex processes with progress tracking and navigation controls.',
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
    onClose: { action: 'wizard-closed' },
    onComplete: { action: 'wizard-completed' },
    allowSkip: {
      description: 'Whether users can skip steps (shows finish button on all steps)',
      control: 'boolean',
    },
    open: {
      description: 'Whether the wizard is open',
      control: 'boolean',
    },
    showProgress: {
      description: 'Whether to show the progress indicator (step x of y)',
      control: 'boolean',
    },
    steps: {
      description: 'Array of wizard steps with title and content',
      control: false,
    },
  },
};
export default meta;

type Story = StoryObj;

// Sample step content components
const WelcomeStep = () => (
  <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
    <RiMagicLine size={48} style={{ marginBottom: '1rem', color: 'var(--color-primary)' }} />
    <h3>Welcome to the Setup Wizard</h3>
    <p>This wizard will guide you through setting up your account in just a few simple steps.</p>
    <p>Let's get started!</p>
  </div>
);

const ProfileStep = () => (
  <div style={{ padding: '1rem' }}>
    <RiUserLine size={32} style={{ marginBottom: '1rem', color: 'var(--color-primary)' }} />
    <h4>Tell us about yourself</h4>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
      <div>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Full Name</label>
        <input 
          type="text" 
          placeholder="Enter your full name"
          style={{ 
            width: '100%', 
            padding: '0.75rem', 
            borderRadius: '4px', 
            border: '1px solid var(--color-border, #ccc)',
            fontSize: '1rem'
          }}
        />
      </div>
      <div>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Email</label>
        <input 
          type="email" 
          placeholder="Enter your email address"
          style={{ 
            width: '100%', 
            padding: '0.75rem', 
            borderRadius: '4px', 
            border: '1px solid var(--color-border, #ccc)',
            fontSize: '1rem'
          }}
        />
      </div>
    </div>
  </div>
);

const PreferencesStep = () => (
  <div style={{ padding: '1rem' }}>
    <RiSettings2Line size={32} style={{ marginBottom: '1rem', color: 'var(--color-primary)' }} />
    <h4>Set your preferences</h4>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem' }}>
      <div>
        <label style={{ display: 'block', marginBottom: '1rem', fontWeight: 'bold' }}>Theme Preference</label>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="radio" name="theme" value="light" defaultChecked />
            Light
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="radio" name="theme" value="dark" />
            Dark
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="radio" name="theme" value="auto" />
            Auto
          </label>
        </div>
      </div>
      <div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input type="checkbox" />
          Enable email notifications
        </label>
      </div>
      <div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input type="checkbox" />
          Subscribe to newsletter
        </label>
      </div>
    </div>
  </div>
);

const CompletionStep = () => (
  <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
    <RiCheckLine size={48} style={{ marginBottom: '1rem', color: 'var(--color-success, #28a745)' }} />
    <h3>Setup Complete!</h3>
    <p>Your account has been successfully configured.</p>
    <p>You're all set to start using the application.</p>
  </div>
);

const basicSteps: WizardStep[] = [
  {
    title: 'Welcome',
    content: <WelcomeStep />,
  },
  {
    title: 'Profile Information',
    content: <ProfileStep />,
  },
  {
    title: 'Preferences',
    content: <PreferencesStep />,
  },
  {
    title: 'Complete',
    content: <CompletionStep />,
  },
];

const shortSteps: WizardStep[] = [
  {
    title: 'Step 1',
    content: <div style={{ padding: '2rem', textAlign: 'center' }}>This is the first step of a simple two-step wizard.</div>,
  },
  {
    title: 'Step 2',
    content: <div style={{ padding: '2rem', textAlign: 'center' }}>This is the final step. Click finish to complete!</div>,
  },
];

const longSteps: WizardStep[] = [
  ...Array.from({ length: 6 }, (_, i) => ({
    title: `Step ${i + 1}`,
    content: (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h4>Step {i + 1} Content</h4>
        <p>This is step {i + 1} of a longer wizard with multiple steps to demonstrate progression.</p>
        <p>The progress bar and navigation will update as you move through the steps.</p>
      </div>
    ),
  })),
];

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)} icon={<RiMagicLine />}>
          Open Setup Wizard
        </Button>
        <Wizard
          open={open}
          steps={basicSteps}
          onClose={() => setOpen(false)}
          onComplete={() => {
            setOpen(false);
            alert('Wizard completed!');
          }}
        />
      </>
    );
  },
};

export const WithSkip: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)} variant="secondary">
          Open Wizard (Skip Enabled)
        </Button>
        <Wizard
          open={open}
          steps={basicSteps}
          allowSkip={true}
          onClose={() => setOpen(false)}
          onComplete={() => {
            setOpen(false);
            alert('Wizard completed (or skipped)!');
          }}
        />
      </>
    );
  },
};

export const SimpleSteps: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)} variant="tertiary">
          Open Simple Wizard
        </Button>
        <Wizard
          open={open}
          steps={shortSteps}
          onClose={() => setOpen(false)}
          onComplete={() => {
            setOpen(false);
            alert('Simple wizard completed!');
          }}
        />
      </>
    );
  },
};

export const LongWizard: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)} variant="success">
          Open Long Wizard (6 Steps)
        </Button>
        <Wizard
          open={open}
          steps={longSteps}
          allowSkip={true}
          onClose={() => setOpen(false)}
          onComplete={() => {
            setOpen(false);
            alert('Long wizard completed!');
          }}
        />
      </>
    );
  },
};

export const FormWizard: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    
    const formSteps: WizardStep[] = [
      {
        title: 'Personal Information',
        content: (
          <div style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>First Name</label>
                <input type="text" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Last Name</label>
                <input type="text" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Date of Birth</label>
                <input type="date" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }} />
              </div>
            </div>
          </div>
        ),
      },
      {
        title: 'Contact Information',
        content: (
          <div style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Email Address</label>
                <input type="email" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Phone Number</label>
                <input type="tel" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Address</label>
                <textarea rows={3} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }} />
              </div>
            </div>
          </div>
        ),
      },
      {
        title: 'Review & Submit',
        content: (
          <div style={{ padding: '1rem' }}>
            <h4>Please review your information</h4>
            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--color-bg-secondary, #f8f9fa)', borderRadius: '4px' }}>
              <p><strong>Name:</strong> [First] [Last]</p>
              <p><strong>Email:</strong> [Email Address]</p>
              <p><strong>Phone:</strong> [Phone Number]</p>
              <p><strong>Address:</strong> [Address]</p>
            </div>
            <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
              By clicking Finish, you agree to submit this information.
            </p>
          </div>
        ),
      },
    ];

    return (
      <>
        <Button onClick={() => setOpen(true)} variant="primary">
          Open Form Wizard
        </Button>
        <Wizard
          open={open}
          steps={formSteps}
          onClose={() => setOpen(false)}
          onComplete={() => {
            setOpen(false);
            alert('Form submitted successfully!');
          }}
        />
      </>
    );
  },
};

export const WithoutProgress: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)} variant="tertiary">
          Open Wizard (No Progress)
        </Button>
        <Wizard
          open={open}
          steps={basicSteps}
          showProgress={false}
          onClose={() => setOpen(false)}
          onComplete={() => {
            setOpen(false);
            alert('Wizard completed!');
          }}
        />
      </>
    );
  },
};

export const InteractiveDemo: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    const [allowSkip, setAllowSkip] = useState(false);
    const [showProgress, setShowProgress] = useState(true);
    const [stepCount, setStepCount] = useState(3);

    const demoSteps = Array.from({ length: stepCount }, (_, i) => ({
      title: `Demo Step ${i + 1}`,
      content: (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h4>Demo Step {i + 1}</h4>
          <p>This is a configurable demo step.</p>
          <p>Skip is {allowSkip ? 'enabled' : 'disabled'} for this wizard.</p>
          <p>Progress is {showProgress ? 'shown' : 'hidden'} for this wizard.</p>
          {i === stepCount - 1 && <p><strong>This is the final step!</strong></p>}
        </div>
      ),
    }));

    return (
      <>
        <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid var(--color-border)', borderRadius: '4px' }}>
          <h4 style={{ marginTop: 0 }}>Configure Demo</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input 
                type="checkbox" 
                checked={allowSkip}
                onChange={(e) => setAllowSkip(e.target.checked)}
              />
              Allow Skip
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input 
                type="checkbox" 
                checked={showProgress}
                onChange={(e) => setShowProgress(e.target.checked)}
              />
              Show Progress
            </label>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Number of Steps: {stepCount}</label>
              <input 
                type="range" 
                min="2" 
                max="8" 
                value={stepCount}
                onChange={(e) => setStepCount(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </div>
        
        <Button onClick={() => setOpen(true)} variant="primary">
          Open Configurable Demo
        </Button>
        
        <Wizard
          open={open}
          steps={demoSteps}
          allowSkip={allowSkip}
          showProgress={showProgress}
          onClose={() => setOpen(false)}
          onComplete={() => {
            setOpen(false);
            alert(`Demo wizard completed with ${stepCount} steps!`);
          }}
        />
      </>
    );
  },
};