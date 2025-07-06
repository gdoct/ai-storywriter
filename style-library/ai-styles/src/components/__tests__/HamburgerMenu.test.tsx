import { fireEvent, render, screen } from '@testing-library/react';
import { HamburgerMenu } from '../HamburgerMenu/HamburgerMenu';

describe('HamburgerMenu', () => {
  it('renders the default icon', () => {
    render(<HamburgerMenu>Menu Content</HamburgerMenu>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders a custom icon', () => {
    render(<HamburgerMenu icon={<span data-testid="custom-icon">X</span>}>Menu Content</HamburgerMenu>);
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('shows and hides content on click', () => {
    render(<HamburgerMenu>Menu Content</HamburgerMenu>);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByText('Menu Content')).toBeInTheDocument();
    fireEvent.click(button);
    expect(screen.queryByText('Menu Content')).not.toBeInTheDocument();
  });

  it('applies className', () => {
    render(<HamburgerMenu className="custom">Menu Content</HamburgerMenu>);
    expect(screen.getByRole('button').parentElement).toHaveClass('custom');
  });
});
