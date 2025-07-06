//import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IconButton } from './IconButton';
import { RiHeart3Line } from 'react-icons/ri';

describe('IconButton', () => {
  it('renders with default icon', () => {
    render(<IconButton />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('icon-button');
  });

  it('renders with custom icon', () => {
    render(<IconButton icon={<RiHeart3Line data-testid="custom-icon" />} />);
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();
    render(<IconButton onClick={handleClick} />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies custom className', () => {
    render(<IconButton className="custom-class" />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('icon-button', 'custom-class');
  });

  it('applies custom width and height', () => {
    render(<IconButton width="60px" height="60px" />);
    const button = screen.getByRole('button');
    expect(button).toHaveStyle({
      width: '60px',
      height: '60px',
    });
  });

  it('can be disabled', () => {
    const handleClick = jest.fn();
    render(<IconButton disabled onClick={handleClick} />);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('icon-button--disabled');
    
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('shows active state', () => {
    const handleClick = jest.fn();
    render(<IconButton active onClick={handleClick} />);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('icon-button--active');
    expect(button).toHaveAttribute('aria-pressed', 'true');
    
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('shows spinning icon when active', () => {
    render(<IconButton active />);
    const iconElement = screen.getByRole('button').querySelector('.icon-button__icon');
    expect(iconElement).toHaveClass('icon-button__icon--spinning');
  });

  it('does not call onClick when active', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();
    render(<IconButton active onClick={handleClick} />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies custom style', () => {
    render(<IconButton style={{ backgroundColor: 'red' }} />);
    const button = screen.getByRole('button');
    expect(button).toHaveStyle({ backgroundColor: 'red' });
  });

  it('passes through HTML button attributes', () => {
    render(<IconButton data-testid="test-button" title="Test button" />);
    const button = screen.getByTestId('test-button');
    expect(button).toHaveAttribute('title', 'Test button');
  });

  it('has correct accessibility attributes', () => {
    render(<IconButton active />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button).toHaveAttribute('type', 'button');
  });

  it('applies size class correctly', () => {
    const { rerender } = render(<IconButton size="sm" />);
    expect(screen.getByRole('button')).toHaveClass('icon-button--sm');

    rerender(<IconButton size="m" />);
    expect(screen.getByRole('button')).toHaveClass('icon-button--m');

    rerender(<IconButton size="l" />);
    expect(screen.getByRole('button')).toHaveClass('icon-button--l');

    rerender(<IconButton size="xl" />);
    expect(screen.getByRole('button')).toHaveClass('icon-button--xl');
  });

  it('defaults to medium size when not specified', () => {
    render(<IconButton />);
    expect(screen.getByRole('button')).toHaveClass('icon-button--m');
  });

  it('shows busy state', () => {
    render(<IconButton busy />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveClass('icon-button--busy');
    expect(button).toBeDisabled();
  });

  it('does not call onClick when busy', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();
    render(<IconButton busy onClick={handleClick} />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('shows spinner icon when busy', () => {
    render(<IconButton busy />);
    const button = screen.getByRole('button');
    const iconElement = button.querySelector('.icon-button__icon');
    expect(iconElement).toHaveClass('icon-button__icon--spinning');
  });

  it('prioritizes busy state over active state', () => {
    render(<IconButton active busy />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('icon-button--busy');
    expect(button).toHaveClass('icon-button--active');
    expect(button).toHaveAttribute('aria-busy', 'true');
  });
});
