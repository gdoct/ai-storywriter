import { fireEvent, render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders text label', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('renders icon if provided', () => {
    render(<Button icon={<span data-testid="icon">icon</span>}>With Icon</Button>);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('calls onClick when not busy or disabled', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalled();
  });

  it('does not call onClick when busy', () => {
    const handleClick = jest.fn();
    render(<Button busy onClick={handleClick}>Busy</Button>);
    fireEvent.click(screen.getByText('Busy'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('shows spinner when busy', () => {
    render(<Button busy>Loading</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Loading')).toBeInTheDocument();
  });

  it('is disabled when disabled prop is set', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('applies variant class correctly', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole('button')).toHaveClass('ai-button--primary');

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button')).toHaveClass('ai-button--secondary');

    rerender(<Button variant="tertiary">Tertiary</Button>);
    expect(screen.getByRole('button')).toHaveClass('ai-button--tertiary');

    rerender(<Button variant="danger">Danger</Button>);
    expect(screen.getByRole('button')).toHaveClass('ai-button--danger');

    rerender(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByRole('button')).toHaveClass('ai-button--ghost');

    rerender(<Button variant="success">Success</Button>);
    expect(screen.getByRole('button')).toHaveClass('ai-button--success');
  });

  it('defaults to primary variant when not specified', () => {
    render(<Button>Default</Button>);
    expect(screen.getByRole('button')).toHaveClass('ai-button--primary');
  });

  it('applies size class correctly', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    expect(screen.getByRole('button')).toHaveClass('ai-button--sm');

    rerender(<Button size="m">Medium</Button>);
    expect(screen.getByRole('button')).toHaveClass('ai-button--m');

    rerender(<Button size="l">Large</Button>);
    expect(screen.getByRole('button')).toHaveClass('ai-button--l');

    rerender(<Button size="xl">Extra Large</Button>);
    expect(screen.getByRole('button')).toHaveClass('ai-button--xl');
  });

  it('defaults to medium size when not specified', () => {
    render(<Button>Default</Button>);
    expect(screen.getByRole('button')).toHaveClass('ai-button--m');
  });

  describe('Polymorphic rendering', () => {
    it('renders as button by default', () => {
      render(<Button>Default Button</Button>);
      const element = screen.getByRole('button');
      expect(element.tagName).toBe('BUTTON');
      expect(element).toHaveAttribute('type', 'button');
    });

    it('renders as anchor when as="a"', () => {
      render(
        <Button as="a" href="/test">
          Link Button
        </Button>
      );
      const element = screen.getByRole('button');
      expect(element.tagName).toBe('A');
      expect(element).toHaveAttribute('href', '/test');
      expect(element).not.toHaveAttribute('type');
    });

    it('renders as div when as="div"', () => {
      render(
        <Button as="div" data-testid="div-button">
          Div Button
        </Button>
      );
      const element = screen.getByTestId('div-button');
      expect(element.tagName).toBe('DIV');
      expect(element).toHaveAttribute('role', 'button');
      expect(element).toHaveAttribute('tabIndex', '0');
    });

    it('applies aria-disabled for non-button elements', () => {
      render(
        <Button as="span" disabled data-testid="span-button">
          Disabled Span
        </Button>
      );
      const element = screen.getByTestId('span-button');
      expect(element).toHaveAttribute('aria-disabled', 'true');
      expect(element).toHaveAttribute('tabIndex', '-1');
      expect(element).not.toHaveAttribute('disabled');
    });

    it('handles click events for polymorphic elements', () => {
      const handleClick = jest.fn();
      render(
        <Button as="div" onClick={handleClick} data-testid="clickable-div">
          Clickable Div
        </Button>
      );
      
      fireEvent.click(screen.getByTestId('clickable-div'));
      expect(handleClick).toHaveBeenCalled();
    });

    it('prevents click when busy for polymorphic elements', () => {
      const handleClick = jest.fn();
      render(
        <Button as="span" busy onClick={handleClick} data-testid="busy-span">
          Busy Span
        </Button>
      );
      
      fireEvent.click(screen.getByTestId('busy-span'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('passes through custom props to the rendered element', () => {
      render(
        <Button as="a" href="/custom" target="_blank" rel="noopener">
          Custom Link
        </Button>
      );
      
      const element = screen.getByRole('button');
      expect(element).toHaveAttribute('href', '/custom');
      expect(element).toHaveAttribute('target', '_blank');
      expect(element).toHaveAttribute('rel', 'noopener');
    });
  });
});
