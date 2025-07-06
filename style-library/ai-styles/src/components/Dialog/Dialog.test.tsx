// ...existing code...
import { fireEvent, render } from '@testing-library/react';
import { Dialog, DialogProps } from './Dialog';

describe('Modal', () => {
  const defaultProps: DialogProps = {
    open: true,
    onOk: jest.fn(),
    children: <div>Test Content</div>,
  };

  it('renders when open', () => {
    const { getByTestId } = render(<Dialog {...defaultProps} />);
    expect(getByTestId('dialog-overlay')).toBeInTheDocument();
  });

  it('does not render when not open', () => {
    const { queryByTestId } = render(<Dialog {...defaultProps} open={false} />);
    expect(queryByTestId('dialog-overlay')).toBeNull();
  });

  it('renders children', () => {
    const { getByText } = render(<Dialog {...defaultProps} />);
    expect(getByText('Test Content')).toBeInTheDocument();
  });

  it('calls onOk when OK button is clicked', () => {
    const onOk = jest.fn();
    const { getByText } = render(<Dialog {...defaultProps} onOk={onOk} />);
    fireEvent.click(getByText('OK'));
    expect(onOk).toHaveBeenCalled();
  });

  it('calls onCancel when Cancel button is clicked', () => {
    const onCancel = jest.fn();
    const { getByText } = render(
      <Dialog {...defaultProps} showCancel onCancel={onCancel} />
    );
    fireEvent.click(getByText('Cancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('renders custom button text', () => {
    const { getByText } = render(
      <Dialog {...defaultProps} okText="Proceed" cancelText="Dismiss" showCancel onCancel={jest.fn()} />
    );
    expect(getByText('Proceed')).toBeInTheDocument();
    expect(getByText('Dismiss')).toBeInTheDocument();
  });

  it('renders title if provided', () => {
    const { getByText } = render(
      <Dialog {...defaultProps} title="My Modal" />
    );
    expect(getByText('My Modal')).toBeInTheDocument();
  });
});
