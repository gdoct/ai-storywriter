import { render } from '@testing-library/react';
import { IconButton } from './IconButton';
import { IconButtonGroup } from './IconButtonGroup';

describe('IconButtonGroup', () => {
  it('renders children in a toolbar', () => {
    const { getByRole } = render(
      <IconButtonGroup aria-label="Test Toolbar">
        <IconButton icon={<span>1</span>} />
        <IconButton icon={<span>2</span>} />
      </IconButtonGroup>
    );
    const toolbar = getByRole('toolbar', { name: 'Test Toolbar' });
    expect(toolbar).toBeInTheDocument();
    expect(toolbar.querySelectorAll('.icon-button').length).toBe(2);
  });

  it('applies custom className', () => {
    const { getByRole } = render(
      <IconButtonGroup className="custom-toolbar">
        <IconButton icon={<span>1</span>} />
      </IconButtonGroup>
    );
    expect(getByRole('toolbar')).toHaveClass('custom-toolbar');
  });
});
