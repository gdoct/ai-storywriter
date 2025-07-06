import { render, screen } from '@testing-library/react';
import { Card } from './Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Body</Card>);
    expect(screen.getByText('Body')).toBeInTheDocument();
  });

  it('renders header and footer', () => {
    render(<Card header="Header" footer="Footer">Body</Card>);
    expect(screen.getByText('Header')).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Card className="custom">Body</Card>);
    expect(screen.getByText('Body').closest('.ai-card')).toHaveClass('custom');
  });

  it('renders leftContent when provided', () => {
    render(<Card leftContent={<span data-testid="left">LEFT</span>}>Body</Card>);
    expect(screen.getByTestId('left')).toBeInTheDocument();
  });

  it('renders icon when leftContent is not provided', () => {
    render(<Card icon={<span data-testid="icon">ICON</span>}>Body</Card>);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('renders default icon if neither leftContent nor icon is provided', () => {
    render(<Card>Body</Card>);
    expect(document.querySelector('.ai-card__icon')).toBeInTheDocument();
  });

  it('renders rightContent when provided', () => {
    render(<Card rightContent={<span data-testid="right">RIGHT</span>}>Body</Card>);
    expect(screen.getByTestId('right')).toBeInTheDocument();
  });
});
