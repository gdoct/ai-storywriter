import { fireEvent, render, screen } from '@testing-library/react';
import { ErrorDialog, ErrorDialogProps } from './ErrorDialog';

describe('ErrorDialog', () => {
  const defaultProps: ErrorDialogProps = {
    open: true,
    message: 'Something went wrong',
    onConfirm: jest.fn(),
  };

  it('renders when open', () => {
    render(<ErrorDialog {...defaultProps} />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('OK')).toBeInTheDocument();
  });

  it('does not render when not open', () => {
    render(<ErrorDialog {...defaultProps} open={false} />);
    expect(screen.queryByText('Something went wrong')).toBeNull();
  });

  it('calls onConfirm', () => {
    render(<ErrorDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('OK'));
    expect(defaultProps.onConfirm).toHaveBeenCalled();
  });

  it('uses custom button text', () => {
    render(
      <ErrorDialog {...defaultProps} confirmText="Close" />
    );
    expect(screen.getByText('Close')).toBeInTheDocument();
  });
});
