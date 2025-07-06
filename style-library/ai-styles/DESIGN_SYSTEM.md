# Docomo Design System

A modern, accessible, and consistent design system for React applications with built-in light and dark theme support.

## Features

- 🎨 **Comprehensive Design Tokens** - Consistent spacing, colors, typography, and more
- 🌓 **Dark & Light Themes** - Built-in theme switching with system preference detection
- ♿ **Accessibility First** - WCAG compliant with focus management and screen reader support
- 📱 **Responsive Design** - Mobile-first approach with responsive utilities
- 🎯 **TypeScript Support** - Fully typed components and utilities
- ⚡ **Performance Optimized** - CSS custom properties for efficient theme switching
- 🎭 **Animation Aware** - Respects user's reduced motion preferences

## Installation

```bash
npm install @docomo/design-system
```

## Quick Start

### 1. Wrap your app with ThemeProvider

```tsx
import React from 'react';
import { ThemeProvider } from '@docomo/design-system';
import App from './App';

function Root() {
  return (
    <ThemeProvider defaultTheme="system">
      <App />
    </ThemeProvider>
  );
}

export default Root;
```

### 2. Use components

```tsx
import React, { useState } from 'react';
import { AiTextBox, IconButton, useTheme } from '@docomo/design-system';
import { RiSunLine, RiMoonLine } from 'react-icons/ri';

function MyComponent() {
  const [value, setValue] = useState('');
  const { theme, setTheme } = useTheme();

  const handleAiClick = (text: string) => {
    console.log('AI processing:', text);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h1>My App</h1>
        <IconButton
          icon={theme === 'dark' ? <RiSunLine /> : <RiMoonLine />}
          onClick={toggleTheme}
          title="Toggle theme"
        />
      </div>
      
      <AiTextBox
        label="Enter your message"
        value={value}
        onChange={setValue}
        onAiClick={handleAiClick}
        placeholder="Type something..."
      />
    </div>
  );
}
```

## Design Tokens

The design system uses CSS custom properties (variables) for all design tokens, making it easy to customize and extend.

### Colors

```css
/* Primary colors */
--color-primary-500: #3b82f6;
--color-primary-600: #2563eb;

/* Semantic colors */
--color-text-primary: #111827; /* light theme */
--color-text-primary: #f9fafb; /* dark theme */

/* Surface colors */
--color-background-primary: #ffffff; /* light theme */
--color-background-primary: #111827; /* dark theme */
```

### Spacing

```css
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 12px;
--spacing-lg: 16px;
--spacing-xl: 20px;
```

### Typography

```css
--font-size-sm: 14px;
--font-size-base: 16px;
--font-size-lg: 18px;

--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
```

## Theme System

### Theme Options

- `light` - Light theme
- `dark` - Dark theme  
- `system` - Automatically follows system preference

### Theme Provider Props

```tsx
interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme; // Default: 'system'
  storageKey?: string;  // Default: 'docomo-theme'
}
```

### useTheme Hook

```tsx
const { theme, resolvedTheme, setTheme } = useTheme();

// theme: 'light' | 'dark' | 'system'
// resolvedTheme: 'light' | 'dark' (actual resolved theme)
// setTheme: (theme: Theme) => void
```

### Manual Theme Control

```tsx
import { initializeTheme, applyTheme } from '@docomo/design-system';

// Initialize theme on app startup
const currentTheme = initializeTheme('system');

// Manually apply theme
applyTheme('dark');
```

## Components

### AiTextBox

An enhanced text input with AI generation and clear functionality.

```tsx
<AiTextBox
  label="Message"
  value={value}
  onChange={setValue}
  onAiClick={handleAiGeneration}
  onClear={() => setValue('')}
  validation={(text) => text.length > 0 || 'Required'}
  errorMessage="Please enter a message"
  successMessage="Valid input"
  aiActive={isGenerating}
  disabled={false}
/>
```

### IconButton

A versatile button component for icons with various states.

```tsx
<IconButton
  icon={<RiSettings3Line />}
  onClick={handleClick}
  active={isActive}
  disabled={false}
  width="40px"
  height="40px"
  title="Settings"
/>
```

## Customization

### Custom Theme Colors

You can override design tokens by defining custom CSS properties:

```css
:root {
  --color-primary-500: #your-brand-color;
  --color-primary-600: #your-brand-color-darker;
}

[data-theme="dark"] {
  --color-primary-500: #your-brand-color-dark;
  --color-primary-600: #your-brand-color-darker;
}
```

### Component Styling

Components use CSS modules and accept className props for customization:

```tsx
<AiTextBox
  className="my-custom-textbox"
  // ... other props
/>
```

```css
.my-custom-textbox {
  --spacing-lg: 20px; /* Override internal spacing */
}

.my-custom-textbox .ai-textbox__input {
  border-radius: var(--radius-xl);
}
```

## Accessibility

The design system follows WCAG 2.1 AA guidelines:

- **Keyboard Navigation** - All interactive elements are keyboard accessible
- **Focus Management** - Clear focus indicators and logical tab order
- **Screen Readers** - Proper ARIA labels and semantic HTML
- **Color Contrast** - All color combinations meet contrast requirements
- **Reduced Motion** - Respects `prefers-reduced-motion` setting
- **High Contrast** - Enhanced styling for high contrast mode

## Browser Support

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

### Storybook

```bash
npm run storybook
```

## Contributing

1. Follow the existing code style and patterns
2. Add tests for new components
3. Update documentation
4. Ensure accessibility compliance
5. Test in both light and dark themes

## License

MIT License - see LICENSE file for details.
