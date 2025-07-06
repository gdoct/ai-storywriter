import { render, screen } from '@testing-library/react';
import { CharacterCard } from './CharacterCard';

describe('CharacterCard', () => {
  it('renders character name', () => {
    render(<CharacterCard name="John Doe" />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('renders nickname when provided', () => {
    render(<CharacterCard name="John Doe" nickname="Johnny" />);
    expect(screen.getByText('"Johnny"')).toBeInTheDocument();
  });

  it('renders role when provided', () => {
    render(<CharacterCard name="John Doe" role="Developer" />);
    expect(screen.getByText('Developer')).toBeInTheDocument();
  });

  it('renders backstory when provided', () => {
    render(<CharacterCard name="John Doe" backstory="A skilled developer" />);
    expect(screen.getByText('A skilled developer')).toBeInTheDocument();
  });

  it('renders notes when provided', () => {
    render(<CharacterCard name="John Doe" notes="Important details" />);
    expect(screen.getByText('Important details')).toBeInTheDocument();
  });

  it('renders image when imageUrl is provided', () => {
    render(<CharacterCard name="John Doe" imageUrl="/test.jpg" />);
    const image = screen.getByAltText('John Doe character portrait');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/test.jpg');
  });

  it('renders gender icon when no image is provided', () => {
    render(<CharacterCard name="John Doe" gender="male" />);
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
  });

  it('applies correct size class', () => {
    const { rerender } = render(<CharacterCard name="John Doe" size="sm" />);
    expect(screen.getByRole('generic')).toHaveClass('ai-character-card--sm');

    rerender(<CharacterCard name="John Doe" size="m" />);
    expect(screen.getByRole('generic')).toHaveClass('ai-character-card--m');

    rerender(<CharacterCard name="John Doe" size="l" />);
    expect(screen.getByRole('generic')).toHaveClass('ai-character-card--l');

    rerender(<CharacterCard name="John Doe" size="xl" />);
    expect(screen.getByRole('generic')).toHaveClass('ai-character-card--xl');
  });

  it('defaults to medium size when not specified', () => {
    render(<CharacterCard name="John Doe" />);
    expect(screen.getByRole('generic')).toHaveClass('ai-character-card--m');
  });

  it('becomes clickable when onClick is provided', () => {
    const handleClick = jest.fn();
    render(<CharacterCard name="John Doe" onClick={handleClick} />);
    
    const card = screen.getByRole('button');
    expect(card).toBeInTheDocument();
    expect(card).toHaveAttribute('tabIndex', '0');
  });

  it('applies custom className', () => {
    render(<CharacterCard name="John Doe" className="custom-class" />);
    expect(screen.getByRole('generic')).toHaveClass('custom-class');
  });
});
