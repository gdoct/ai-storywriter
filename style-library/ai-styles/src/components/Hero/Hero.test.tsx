// ...existing code...
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '../../providers/ThemeProvider';
import { Hero, HeroProps } from './Hero';

// Wrapper component to provide theme context
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider defaultTheme="light">{children}</ThemeProvider>
);

describe('Hero', () => {
  const baseProps: HeroProps = {
    title: 'Welcome to the Hero Section',
    subtitle: 'This is a subtitle',
  };

  it('renders the title and subtitle', () => {
    render(
      <TestWrapper>
        <Hero {...baseProps} />
      </TestWrapper>
    );
    expect(screen.getByText(baseProps.title)).toBeInTheDocument();
    expect(screen.getByText(baseProps.subtitle!)).toBeInTheDocument();
  });

  it('renders children content in description area', () => {
    render(
      <TestWrapper>
        <Hero {...baseProps}>
          <div>Custom Content</div>
        </Hero>
      </TestWrapper>
    );
    expect(screen.getByText('Custom Content')).toBeInTheDocument();
    expect(screen.getByText('Custom Content').closest('.ai-hero__description')).toBeInTheDocument();
  });

  it('renders image when provided', () => {
    const imageUrl = 'https://example.com/hero-image.jpg';
    render(
      <TestWrapper>
        <Hero {...baseProps} image={imageUrl} />
      </TestWrapper>
    );
    const image = screen.getByAltText(baseProps.title);
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', imageUrl);
    expect(image.closest('.ai-hero__image')).toBeInTheDocument();
  });

  it('renders CTA in actions area', () => {
    render(
      <TestWrapper>
        <Hero {...baseProps} cta={<button>Click Me</button>} />
      </TestWrapper>
    );
    expect(screen.getByText('Click Me')).toBeInTheDocument();
    expect(screen.getByText('Click Me').closest('.ai-hero__cta')).toBeInTheDocument();
  });

  it('renders button bar in actions area', () => {
    render(
      <TestWrapper>
        <Hero 
          {...baseProps} 
          buttonBar={
            <div>
              <button>Action 1</button>
              <button>Action 2</button>
            </div>
          } 
        />
      </TestWrapper>
    );
    expect(screen.getByText('Action 1')).toBeInTheDocument();
    expect(screen.getByText('Action 2')).toBeInTheDocument();
    expect(screen.getByText('Action 1').closest('.ai-hero__button-bar')).toBeInTheDocument();
  });

  it('renders both CTA and button bar when provided', () => {
    render(
      <TestWrapper>
        <Hero 
          {...baseProps} 
          cta={<button>Primary CTA</button>}
          buttonBar={<button>Secondary Action</button>}
        />
      </TestWrapper>
    );
    expect(screen.getByText('Primary CTA')).toBeInTheDocument();
    expect(screen.getByText('Secondary Action')).toBeInTheDocument();
    expect(screen.getByText('Primary CTA').closest('.ai-hero__actions')).toBeInTheDocument();
  });

  it('does not render actions area when no CTA or buttonBar provided', () => {
    render(
      <TestWrapper>
        <Hero {...baseProps} />
      </TestWrapper>
    );
    expect(screen.queryByTestId('hero-section')?.querySelector('.ai-hero__actions')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <TestWrapper>
        <Hero {...baseProps} className="custom-hero" />
      </TestWrapper>
    );
    const section = screen.getByTestId('hero-section');
    expect(section).toHaveClass('custom-hero');
  });

  it('applies theme class', () => {
    render(
      <TestWrapper>
        <Hero {...baseProps} />
      </TestWrapper>
    );
    const section = screen.getByTestId('hero-section');
    expect(section).toHaveClass('ai-hero--light');
  });
});
