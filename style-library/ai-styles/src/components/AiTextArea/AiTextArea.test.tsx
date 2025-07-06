//import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { AiTextArea } from './AiTextArea';

describe('AiTextArea', () => {
  it('renders correctly', () => {
    const { getByPlaceholderText } = render(<AiTextArea placeholder="Enter text..." />);
    expect(getByPlaceholderText('Enter text...')).toBeInTheDocument();
  });

  it('calls onChange when text is entered', () => {
    const handleChange = jest.fn();
    const { getByPlaceholderText } = render(
      <AiTextArea placeholder="Enter text..." onChange={handleChange} />
    );

    const textarea = getByPlaceholderText('Enter text...');
    fireEvent.change(textarea, { target: { value: 'New text' } });
    expect(handleChange).toHaveBeenCalledWith('New text');
  });

  it('calls onAiClick when AI button is clicked', () => {
    const handleAiClick = jest.fn();
    const { getByTitle } = render(
      <AiTextArea placeholder="Enter text..." onAiClick={handleAiClick} />
    );

    const aiButton = getByTitle('Generate with AI');
    fireEvent.click(aiButton);
    expect(handleAiClick).toHaveBeenCalled();
  });

  it('calls onClear when clear button is clicked', () => {
    const handleClear = jest.fn();
    const handleChange = jest.fn();
    const { getByTitle } = render(
      <AiTextArea placeholder="Enter text..." onClear={handleClear} onChange={handleChange} value="Some text" />
    );

    const clearButton = getByTitle('Clear text');
    fireEvent.click(clearButton);
    
    expect(handleClear).toHaveBeenCalled();
    expect(handleChange).toHaveBeenCalledWith('');
  });

  it('displays error message when validation fails', () => {
    const validation = (value: string) => value.length > 5 || 'Too short';
    const { getByText, getByPlaceholderText } = render(
      <AiTextArea placeholder="Enter text..." validation={validation} />
    );

    const textarea = getByPlaceholderText('Enter text...');
    fireEvent.change(textarea, { target: { value: '123' } });
    expect(getByText('Too short')).toBeInTheDocument();
  });

  it('displays success message when provided', () => {
    const { getByText } = render(
      <AiTextArea placeholder="Enter text..." successMessage="Success!" />
    );

    expect(getByText('Success!')).toBeInTheDocument();
  });

  describe('Size variants', () => {
    it('applies small size classes', () => {
      const { container } = render(<AiTextArea size="sm" />);
      expect(container.firstChild).toHaveClass('ai-textarea--sm');
      expect(container.querySelector('.ai-textarea__input')).toHaveClass('ai-textarea__input--sm');
    });

    it('applies medium size classes (default)', () => {
      const { container } = render(<AiTextArea />);
      expect(container.firstChild).toHaveClass('ai-textarea--m');
      expect(container.querySelector('.ai-textarea__input')).toHaveClass('ai-textarea__input--m');
    });

    it('applies large size classes', () => {
      const { container } = render(<AiTextArea size="l" />);
      expect(container.firstChild).toHaveClass('ai-textarea--l');
      expect(container.querySelector('.ai-textarea__input')).toHaveClass('ai-textarea__input--l');
    });

    it('applies extra large size classes', () => {
      const { container } = render(<AiTextArea size="xl" />);
      expect(container.firstChild).toHaveClass('ai-textarea--xl');
      expect(container.querySelector('.ai-textarea__input')).toHaveClass('ai-textarea__input--xl');
    });

    it('passes size prop to IconButton components', () => {
      const { container } = render(<AiTextArea size="l" value="test" />);
      const iconButtons = container.querySelectorAll('.icon-button--l');
      expect(iconButtons).toHaveLength(2); // Clear and AI buttons
    });
  });
});
