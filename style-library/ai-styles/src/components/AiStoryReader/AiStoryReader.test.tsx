import { fireEvent, render } from '@testing-library/react';
import { ThemeProvider } from '../../providers/ThemeProvider';
import { AiStoryReader, AiStoryReaderProps } from './AiStoryReader';

describe('AiStoryReader', () => {
  const defaultProps: AiStoryReaderProps = {
    text: 'Once upon a time...',
    font: 'serif',
    fontSize: '18px',
    onFontChange: jest.fn(),
    onFontSizeChange: jest.fn(),
  };

  const renderReader = (props: Partial<AiStoryReaderProps> = {}) =>
    render(
      <ThemeProvider>
        <AiStoryReader {...defaultProps} {...props} />
      </ThemeProvider>
    );

  it('renders the text', () => {
    const { getByTestId } = renderReader({ text: 'Hello world' });
    expect(getByTestId('story-textarea')).toHaveValue('Hello world');
  });

  it('renders font and size selectors', () => {
    const { getByTestId } = renderReader();
    expect(getByTestId('font-select')).toBeInTheDocument();
    expect(getByTestId('font-size-select')).toBeInTheDocument();
  });

  it('calls onFontChange when font is changed', () => {
    const onFontChange = jest.fn();
    const { getByTestId } = renderReader({ onFontChange });
    fireEvent.change(getByTestId('font-select'), { target: { value: 'monospace' } });
    expect(onFontChange).toHaveBeenCalledWith('monospace');
  });

  it('calls onFontSizeChange when size is changed', () => {
    const onFontSizeChange = jest.fn();
    const { getByTestId } = renderReader({ onFontSizeChange });
    fireEvent.change(getByTestId('font-size-select'), { target: { value: '24px' } });
    expect(onFontSizeChange).toHaveBeenCalledWith('24px');
  });

  it('is readOnly and updates with new text', () => {
    const { getByTestId, rerender } = renderReader({ text: 'First' });
    expect(getByTestId('story-textarea')).toHaveValue('First');
    rerender(
      <ThemeProvider>
        <AiStoryReader {...defaultProps} text="Second" />
      </ThemeProvider>
    );
    expect(getByTestId('story-textarea')).toHaveValue('Second');
  });

  it('disables controls and textarea when disabled', () => {
    const { getByTestId } = renderReader({ disabled: true });
    expect(getByTestId('font-select')).toBeDisabled();
    expect(getByTestId('font-size-select')).toBeDisabled();
    expect(getByTestId('story-textarea')).toBeDisabled();
  });
});
