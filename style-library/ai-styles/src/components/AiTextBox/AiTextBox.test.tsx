//import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RiHeart3Line } from 'react-icons/ri';
import { AiTextBox } from './AiTextBox';

describe('AiTextBox', () => {
  it('renders with default props', () => {
    render(<AiTextBox />);
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', 'Enter text...');
  });

  it('renders with custom label', () => {
    render(<AiTextBox label="Test Label" id="test-input" />);
    const label = screen.getByText('Test Label');
    const input = screen.getByRole('textbox');
    expect(label).toBeInTheDocument();
    expect(input).toBeInTheDocument();
    expect(label).toHaveAttribute('for', 'test-input');
  });
  it('handles controlled input', () => {
    const handleChange = jest.fn();
    render(<AiTextBox value="test" onChange={handleChange} />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('test');

    // Simulate clearing the input by firing a change event directly
    fireEvent.change(input, { target: { value: '' } });
    expect(handleChange).toHaveBeenCalledWith('');

    // Simulate typing new value by firing a change event directly
    fireEvent.change(input, { target: { value: 'new value' } });
    expect(handleChange).toHaveBeenCalledWith('new value');
    
    expect(handleChange).toHaveBeenCalledTimes(2);
  });

  it('handles uncontrolled input', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    render(<AiTextBox onChange={handleChange} />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'test');
    
    expect(input).toHaveValue('test');
    expect(handleChange).toHaveBeenLastCalledWith('test');
  });

  it('shows AI button', () => {
    render(<AiTextBox />);
    const aiButton = screen.getByTitle('Generate with AI');
    expect(aiButton).toBeInTheDocument();
  });

  it('shows clear button when there is text', async () => {
    const user = userEvent.setup();
    render(<AiTextBox />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'test');
    
    const clearButton = screen.getByTitle('Clear text');
    expect(clearButton).toBeInTheDocument();
  });

  it('does not show clear button when input is empty', () => {
    render(<AiTextBox />);
    const clearButton = screen.queryByTitle('Clear text');
    expect(clearButton).not.toBeInTheDocument();
  });

  it('handles AI button click', async () => {
    const user = userEvent.setup();
    const handleAiClick = jest.fn();
    render(<AiTextBox onAiClick={handleAiClick} />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'test input');
    
    const aiButton = screen.getByTitle('Generate with AI');
    await user.click(aiButton);
    
    expect(handleAiClick).toHaveBeenCalledWith('test input');
  });

  it('handles clear button click', async () => {
    const user = userEvent.setup();
    const handleClear = jest.fn();
    const handleChange = jest.fn();
    render(<AiTextBox onClear={handleClear} onChange={handleChange} />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'test');
    
    const clearButton = screen.getByTitle('Clear text');
    await user.click(clearButton);
    
    expect(handleClear).toHaveBeenCalled();
    expect(handleChange).toHaveBeenLastCalledWith('');
    expect(input).toHaveValue('');
  });

  it('shows validation error', async () => {
    const user = userEvent.setup();
    const validation = (value: string) => value.length < 5 ? 'Too short' : true;
    render(<AiTextBox validation={validation} />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'abc');
    
    expect(screen.getByText('Too short')).toBeInTheDocument();
    expect(input).toHaveClass('ai-textbox__input--error');
  });

  it('shows error message prop', () => {
    render(<AiTextBox errorMessage="Custom error" />);
    expect(screen.getByText('Custom error')).toBeInTheDocument();
  });

  it('shows success message', () => {
    render(<AiTextBox successMessage="Success!" />);
    expect(screen.getByText('Success!')).toBeInTheDocument();
  });

  it('shows info message', () => {
    render(<AiTextBox infoMessage="Info text" />);
    expect(screen.getByText('Info text')).toBeInTheDocument();
  });

  it('prioritizes error over success and info messages', () => {
    render(
      <AiTextBox 
        errorMessage="Error" 
        successMessage="Success" 
        infoMessage="Info" 
      />
    );
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.queryByText('Success')).not.toBeInTheDocument();
    expect(screen.queryByText('Info')).not.toBeInTheDocument();
  });

  it('can be disabled', () => {
    const handleAiClick = jest.fn();
    const handleClear = jest.fn();
    render(<AiTextBox disabled onAiClick={handleAiClick} onClear={handleClear} value="test" />);
    
    const input = screen.getByRole('textbox');
    const aiButton = screen.getByTitle('Generate with AI');
    const clearButton = screen.getByTitle('Clear text');
    
    expect(input).toBeDisabled();
    expect(aiButton).toBeDisabled();
    expect(clearButton).toBeDisabled();
    
    fireEvent.click(aiButton);
    fireEvent.click(clearButton);
    
    expect(handleAiClick).not.toHaveBeenCalled();
    expect(handleClear).not.toHaveBeenCalled();
  });

  it('shows AI button in active state', () => {
    render(<AiTextBox aiActive />);
    const aiButton = screen.getByTitle('Generate with AI');
    expect(aiButton).toHaveClass('icon-button--active');
  });

  it('uses custom icons', () => {
    render(
      <AiTextBox 
        aiIcon={<RiHeart3Line data-testid="custom-ai-icon" />}
        clearIcon={<RiHeart3Line data-testid="custom-clear-icon" />}
        value="test"
      />
    );
    
    expect(screen.getByTestId('custom-ai-icon')).toBeInTheDocument();
    expect(screen.getByTestId('custom-clear-icon')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<AiTextBox className="custom-class" />);
    const container = screen.getByRole('textbox').closest('.ai-textbox');
    expect(container).toHaveClass('custom-class');
  });

  it('handles validation returning boolean false', async () => {
    const user = userEvent.setup();
    const validation = () => false;
    render(<AiTextBox validation={validation} />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'test');
    
    expect(screen.getByText('Invalid input')).toBeInTheDocument();
  });

  it('passes through HTML input attributes', () => {
    render(<AiTextBox data-testid="test-input" maxLength={10} />);
    const input = screen.getByTestId('test-input');
    expect(input).toHaveAttribute('maxLength', '10');
  });

  it('applies size class correctly', () => {
    const { rerender } = render(<AiTextBox componentSize="sm" />);
    const container = screen.getByRole('textbox').closest('.ai-textbox');
    expect(container).toHaveClass('ai-textbox--sm');
    expect(screen.getByRole('textbox')).toHaveClass('ai-textbox__input--sm');

    rerender(<AiTextBox componentSize="m" />);
    const containerM = screen.getByRole('textbox').closest('.ai-textbox');
    expect(containerM).toHaveClass('ai-textbox--m');
    expect(screen.getByRole('textbox')).toHaveClass('ai-textbox__input--m');

    rerender(<AiTextBox componentSize="l" />);
    const containerL = screen.getByRole('textbox').closest('.ai-textbox');
    expect(containerL).toHaveClass('ai-textbox--l');
    expect(screen.getByRole('textbox')).toHaveClass('ai-textbox__input--l');

    rerender(<AiTextBox componentSize="xl" />);
    const containerXL = screen.getByRole('textbox').closest('.ai-textbox');
    expect(containerXL).toHaveClass('ai-textbox--xl');
    expect(screen.getByRole('textbox')).toHaveClass('ai-textbox__input--xl');
  });

  it('defaults to medium size when not specified', () => {
    render(<AiTextBox />);
    const container = screen.getByRole('textbox').closest('.ai-textbox');
    expect(container).toHaveClass('ai-textbox--m');
  });
});
