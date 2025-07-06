import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
    RiHeartLine,
    RiMagicLine,
    RiSendPlaneLine,
    RiStarLine,
    RiThumbUpLine
} from 'react-icons/ri';
import {
    AiTextBox,
    IconButton,
    ThemeProvider,
    ThemeToggle,
    useTheme
} from '../../../ai-styles/src/index';

// Demo component that showcases the design system
const DesignSystemDemo = () => {
  const [message, setMessage] = useState('');
  const [aiActive, setAiActive] = useState(false);
  const [validationError, setValidationError] = useState('');
  const { resolvedTheme } = useTheme();

  const handleAiClick = (text: string) => {
    if (!text.trim()) {
      setValidationError('Please enter a message first');
      return;
    }
    
    setValidationError('');
    setAiActive(true);
    
    // Simulate AI processing
    setTimeout(() => {
      setAiActive(false);
      setMessage(text + ' ✨ (Enhanced by AI)');
    }, 2000);
  };

  const validation = (value: string) => {
    if (value.length < 3 && value.length > 0) {
      return 'Message must be at least 3 characters';
    }
    return true;
  };

  return (
    <div style={{ 
      maxWidth: '600px', 
      margin: '0 auto',
      padding: '2rem',
      backgroundColor: 'var(--color-background-primary)',
      color: 'var(--color-text-primary)',
      borderRadius: 'var(--radius-xl)',
      border: '1px solid var(--color-border-primary)',
      boxShadow: 'var(--shadow-lg)',
    }}>
      {/* Header with theme toggle */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid var(--color-border-primary)'
      }}>
        <div>
          <h1 style={{ 
            fontSize: 'var(--font-size-2xl)', 
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--color-text-primary)',
            marginBottom: 'var(--spacing-xs)'
          }}>
            Docomo Design System
          </h1>
          <p style={{ 
            color: 'var(--color-text-secondary)',
            fontSize: 'var(--font-size-sm)'
          }}>
            Current theme: <strong>{resolvedTheme}</strong>
          </p>
        </div>
        <ThemeToggle showLabels size="sm" />
      </div>

      {/* Color palette showcase */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ 
          fontSize: 'var(--font-size-lg)',
          fontWeight: 'var(--font-weight-semibold)',
          marginBottom: 'var(--spacing-md)',
          color: 'var(--color-text-primary)'
        }}>
          Color Palette
        </h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: 'var(--spacing-sm)',
          marginBottom: 'var(--spacing-lg)'
        }}>
          {[
            { name: 'Primary', bg: 'var(--color-primary-500)' },
            { name: 'Success', bg: 'var(--color-success-500)' },
            { name: 'Error', bg: 'var(--color-error-500)' },
            { name: 'Warning', bg: 'var(--color-warning-500)' },
            { name: 'Info', bg: 'var(--color-info-500)' },
          ].map((color) => (
            <div key={color.name} style={{
              padding: 'var(--spacing-md)',
              backgroundColor: color.bg,
              borderRadius: 'var(--radius-lg)',
              color: 'white',
              textAlign: 'center',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-medium)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              {color.name}
            </div>
          ))}
        </div>
      </div>

      {/* Typography showcase */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ 
          fontSize: 'var(--font-size-lg)',
          fontWeight: 'var(--font-weight-semibold)',
          marginBottom: 'var(--spacing-md)',
          color: 'var(--color-text-primary)'
        }}>
          Typography
        </h2>
        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-bold)' }}>Heading 1</h1>
          <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-semibold)' }}>Heading 2</h2>
          <h3 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-semibold)' }}>Heading 3</h3>
          <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-text-secondary)' }}>
            Body text with <strong>bold</strong> and <em>italic</em> styling.
          </p>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)' }}>
            Small text for captions and labels.
          </p>
        </div>
      </div>

      {/* Interactive components */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ 
          fontSize: 'var(--font-size-lg)',
          fontWeight: 'var(--font-weight-semibold)',
          marginBottom: 'var(--spacing-md)',
          color: 'var(--color-text-primary)'
        }}>
          Interactive Components
        </h2>
        
        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <AiTextBox
            label="AI-Enhanced Text Input"
            placeholder="Type your message here..."
            value={message}
            onChange={setMessage}
            onAiClick={handleAiClick}
            onClear={() => setMessage('')}
            aiActive={aiActive}
            validation={validation}
            errorMessage={validationError}
            infoMessage={aiActive ? 'AI is processing your message...' : 'Click the AI button to enhance your text'}
          />
        </div>

        <div>
          <h3 style={{ 
            fontSize: 'var(--font-size-base)',
            fontWeight: 'var(--font-weight-medium)',
            marginBottom: 'var(--spacing-sm)',
            color: 'var(--color-text-secondary)'
          }}>
            Icon Buttons
          </h3>
          <div style={{ 
            display: 'flex', 
            gap: 'var(--spacing-sm)',
            flexWrap: 'wrap'
          }}>
            <IconButton icon={<RiHeartLine />} title="Like" />
            <IconButton icon={<RiStarLine />} title="Favorite" active />
            <IconButton icon={<RiThumbUpLine />} title="Approve" />
            <IconButton icon={<RiSendPlaneLine />} title="Send" disabled />
            <IconButton icon={<RiMagicLine />} title="Magic" width="48px" height="48px" />
          </div>
        </div>
      </div>

      {/* Spacing showcase */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ 
          fontSize: 'var(--font-size-lg)',
          fontWeight: 'var(--font-weight-semibold)',
          marginBottom: 'var(--spacing-md)',
          color: 'var(--color-text-primary)'
        }}>
          Spacing Scale
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
          {[
            { name: 'XS (4px)', size: 'var(--spacing-xs)' },
            { name: 'SM (8px)', size: 'var(--spacing-sm)' },
            { name: 'MD (12px)', size: 'var(--spacing-md)' },
            { name: 'LG (16px)', size: 'var(--spacing-lg)' },
            { name: 'XL (20px)', size: 'var(--spacing-xl)' },
          ].map((space) => (
            <div key={space.name} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
              <span style={{ 
                minWidth: '80px', 
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)'
              }}>
                {space.name}
              </span>
              <div style={{
                width: space.size,
                height: '16px',
                backgroundColor: 'var(--color-primary-500)',
                borderRadius: 'var(--radius-sm)'
              }} />
            </div>
          ))}
        </div>
      </div>

      {/* Shadows showcase */}
      <div>
        <h2 style={{ 
          fontSize: 'var(--font-size-lg)',
          fontWeight: 'var(--font-weight-semibold)',
          marginBottom: 'var(--spacing-md)',
          color: 'var(--color-text-primary)'
        }}>
          Elevation (Shadows)
        </h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: 'var(--spacing-lg)'
        }}>
          {[
            { name: 'SM', shadow: 'var(--shadow-sm)' },
            { name: 'MD', shadow: 'var(--shadow-md)' },
            { name: 'LG', shadow: 'var(--shadow-lg)' },
            { name: 'XL', shadow: 'var(--shadow-xl)' },
          ].map((elevation) => (
            <div key={elevation.name} style={{
              padding: 'var(--spacing-lg)',
              backgroundColor: 'var(--color-surface-primary)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: elevation.shadow,
              textAlign: 'center',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--color-text-secondary)'
            }}>
              {elevation.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const meta: Meta = {
  title: 'Design System/Showcase',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A comprehensive showcase of the Docomo Design System components and tokens.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const DesignSystem: Story = {
  render: () => (
    <ThemeProvider defaultTheme="system">
      <DesignSystemDemo />
    </ThemeProvider>
  ),
};

export const LightTheme: Story = {
  render: () => (
    <ThemeProvider defaultTheme="light">
      <DesignSystemDemo />
    </ThemeProvider>
  ),
};

export const DarkTheme: Story = {
  render: () => (
    <ThemeProvider defaultTheme="dark">
      <DesignSystemDemo />
    </ThemeProvider>
  ),
};
