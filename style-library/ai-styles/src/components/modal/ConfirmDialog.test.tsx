import { fireEvent, render, screen } from '@testing-library/react';
import { ConfirmDialog, ConfirmDialogProps } from './ConfirmDialog';

describe('ConfirmDialog', () => {
  const defaultProps: ConfirmDialogProps = {
    open: true,
    message: 'Are you sure?',
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
  };

  it('renders when open', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
    expect(screen.getAllByText('Confirm')[0]).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('does not render when not open', () => {
    render(<ConfirmDialog {...defaultProps} open={false} />);
    expect(screen.queryByText('Are you sure?')).toBeNull();
  });

  it('calls onConfirm and onCancel', () => {
    render(<ConfirmDialog {...defaultProps} />);
    const confirmButton = screen.getAllByText('Confirm').find(
      (el) => el.tagName === 'BUTTON'
    );
    expect(confirmButton).toBeDefined();
    if (confirmButton) fireEvent.click(confirmButton);
    expect(defaultProps.onConfirm).toHaveBeenCalled();
    fireEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it('uses custom button texts', () => {
    render(
      <ConfirmDialog {...defaultProps} confirmText="Yes" cancelText="No" />
    );
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
  });

  it('applies default variant classes', () => {
    render(<ConfirmDialog {...defaultProps} variant="default" />);
    const dialog = document.querySelector('.modal-dialog');
    const confirmButton = document.querySelector('.modal-btn-confirm--default');
    
    expect(dialog).toHaveClass('modal-dialog--default');
    expect(confirmButton).toBeInTheDocument();
  });

  it('applies danger variant classes', () => {
    render(<ConfirmDialog {...defaultProps} variant="danger" />);
    const dialog = document.querySelector('.modal-dialog');
    const confirmButton = document.querySelector('.modal-btn-confirm--danger');
    
    expect(dialog).toHaveClass('modal-dialog--danger');
    expect(confirmButton).toBeInTheDocument();
  });

  it('defaults to default variant when not specified', () => {
    render(<ConfirmDialog {...defaultProps} />);
    const dialog = document.querySelector('.modal-dialog');
    const confirmButton = document.querySelector('.modal-btn-confirm--default');
    
    expect(dialog).toHaveClass('modal-dialog--default');
    expect(confirmButton).toBeInTheDocument();
  });

  it('renders custom title', () => {
    render(<ConfirmDialog {...defaultProps} title="Custom Title" />);
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });
});
