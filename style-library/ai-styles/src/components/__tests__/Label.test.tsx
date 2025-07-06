import { render, screen } from '@testing-library/react';
import { Label } from '../Label/Label';

describe('Label', () => {
  it('renders children', () => {
    render(<Label>Test Label</Label>);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  it('sets htmlFor prop', () => {
    render(<Label htmlFor="input-id">Label</Label>);
    expect(screen.getByText('Label')).toHaveAttribute('for', 'input-id');
  });

  it('applies className', () => {
    render(<Label className="custom">Label</Label>);
    expect(screen.getByText('Label')).toHaveClass('custom');
  });
});
