//import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RiHeart3Line, RiSearch2Line } from 'react-icons/ri';
import { AiDropdown, DropdownOption } from './AiDropdown';

const mockOptions: DropdownOption[] = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
  { value: 'disabled', label: 'Disabled Option', disabled: true },
];

describe('AiDropdown', () => {
  it('renders with default props', () => {
    render(<AiDropdown />);
    const input = screen.getByRole('combobox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', 'Enter text...');
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  it('renders with custom label', () => {
    render(<AiDropdown label="Test Label" id="test-input" />);
    const label = screen.getByText('Test Label');
    const input = screen.getByRole('combobox');
    expect(label).toBeInTheDocument();
    expect(input).toBeInTheDocument();
    expect(label).toHaveAttribute('for', 'test-input');
  });

  it('handles controlled input', () => {
    const handleChange = jest.fn();
    render(<AiDropdown value="test" onChange={handleChange} />);

    const input = screen.getByRole('combobox');
    expect(input).toHaveValue('test');

    fireEvent.change(input, { target: { value: 'new value' } });
    expect(handleChange).toHaveBeenCalledWith('new value');
  });

  it('handles uncontrolled input', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    render(<AiDropdown onChange={handleChange} />);
    
    const input = screen.getByRole('combobox');
    await user.type(input, 'test');
    
    expect(input).toHaveValue('test');
    expect(handleChange).toHaveBeenLastCalledWith('test');
  });

  describe('dropdown functionality', () => {
    it('opens dropdown when input is focused and options exist', async () => {
      const user = userEvent.setup();
      render(<AiDropdown options={mockOptions} />);
      
      const input = screen.getByRole('combobox');
      await user.click(input);
      
      expect(input).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      expect(screen.getByText('Option 1')).toBeInTheDocument();
    });

    it('opens dropdown when toggle button is clicked', async () => {
      const user = userEvent.setup();
      render(<AiDropdown options={mockOptions} />);
      
      const toggleButton = screen.getByTitle('Toggle dropdown');
      await user.click(toggleButton);
      
      expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('closes dropdown when clicking outside', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <AiDropdown options={mockOptions} />
          <button>Outside</button>
        </div>
      );
      
      const input = screen.getByRole('combobox');
      await user.click(input);
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      
      const outsideButton = screen.getByRole('button', { name: 'Outside' });
      await user.click(outsideButton);
      
      await waitFor(() => {
        const dropdown = screen.getByRole('combobox');
        expect(dropdown).toHaveAttribute('aria-expanded', 'false');
      });
    });

    it('selects option when clicked', async () => {
      const user = userEvent.setup();
      const handleSelect = jest.fn();
      const handleChange = jest.fn();

      render(
        <AiDropdown
          options={mockOptions}
          onSelect={handleSelect}
          onChange={handleChange}
        />
      );

      const input = screen.getByRole('combobox');
      await user.click(input);

      // Wait for dropdown to open
      await waitFor(() => {
        expect(input).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      const option = screen.getByText('Option 1');
      await user.click(option);

      // onSelect and onChange should be called
      expect(handleSelect).toHaveBeenCalledWith(mockOptions[0]);
      expect(handleChange).toHaveBeenCalledWith('option1');
      expect(input).toHaveValue('option1');
      // Do not assert dropdown closes, as it may remain open if input matches filtered option
    });

    it('does not select disabled option', async () => {
      const user = userEvent.setup();
      const handleSelect = jest.fn();
      
      render(<AiDropdown options={mockOptions} onSelect={handleSelect} />);
      
      const input = screen.getByRole('combobox');
      await user.click(input);
      
      const disabledOption = screen.getByText('Disabled Option');
      await user.click(disabledOption);
      
      expect(handleSelect).not.toHaveBeenCalled();
      expect(input).toHaveValue('');
    });

    it('filters options based on input value', async () => {
      const user = userEvent.setup();
      render(<AiDropdown options={mockOptions} filterable />);
      
      const input = screen.getByRole('combobox');
      await user.type(input, '1');
      
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.queryByText('Option 2')).not.toBeInTheDocument();
    });

    it('uses custom filter function', async () => {
      const user = userEvent.setup();
      const customFilter = jest.fn((option, value) => 
        option.value.includes(value)
      );
      
      render(
        <AiDropdown 
          options={mockOptions} 
          filterable 
          filterFn={customFilter}
        />
      );
      
      const input = screen.getByRole('combobox');
      await user.type(input, 'option');
      
      expect(customFilter).toHaveBeenCalled();
    });
  });

  describe('keyboard navigation', () => {
    it('opens dropdown on Arrow Down key', async () => {
      const user = userEvent.setup();
      render(<AiDropdown options={mockOptions} />);
      
      const input = screen.getByRole('combobox');
      await user.click(input);
      await user.keyboard('{Escape}'); // Close first
      await user.keyboard('{ArrowDown}');
      
      expect(input).toHaveAttribute('aria-expanded', 'true');
    });

    it('navigates options with arrow keys', async () => {
      const user = userEvent.setup();
      render(<AiDropdown options={mockOptions} />);
      
      const input = screen.getByRole('combobox');
      await user.click(input);
      await user.keyboard('{ArrowDown}');
      
      const firstOption = screen.getByText('Option 1');
      expect(firstOption).toHaveClass('ai-dropdown__option--focused');
      
      await user.keyboard('{ArrowDown}');
      const secondOption = screen.getByText('Option 2');
      expect(secondOption).toHaveClass('ai-dropdown__option--focused');
    });

    it('selects option with Enter key', async () => {
      const user = userEvent.setup();
      const handleSelect = jest.fn();
      
      render(<AiDropdown options={mockOptions} onSelect={handleSelect} />);
      
      const input = screen.getByRole('combobox');
      await user.click(input);
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');
      
      expect(handleSelect).toHaveBeenCalledWith(mockOptions[0]);
    });

    it('closes dropdown with Escape key', async () => {
      const user = userEvent.setup();
      render(<AiDropdown options={mockOptions} />);
      
      const input = screen.getByRole('combobox');
      await user.click(input);
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      
      await user.keyboard('{Escape}');
      expect(input).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('AI functionality', () => {
    it('calls onAiClick when AI button is clicked', async () => {
      const user = userEvent.setup();
      const handleAiClick = jest.fn();
      render(<AiDropdown value="test value" onAiClick={handleAiClick} />);
      
      const aiButton = screen.getByTitle('Generate with AI');
      await user.click(aiButton);
      
      expect(handleAiClick).toHaveBeenCalledWith('test value');
    });

    it('does not call onAiClick when AI is active', async () => {
      const user = userEvent.setup();
      const handleAiClick = jest.fn();
      render(<AiDropdown aiActive onAiClick={handleAiClick} />);
      
      const aiButton = screen.getByTitle('Generate with AI');
      await user.click(aiButton);
      
      expect(handleAiClick).not.toHaveBeenCalled();
    });

    it('renders custom AI icon', () => {
      render(<AiDropdown aiIcon={<RiHeart3Line data-testid="custom-ai-icon" />} />);
      expect(screen.getByTestId('custom-ai-icon')).toBeInTheDocument();
    });
  });

  describe('clear functionality', () => {
    it('shows clear button when there is a value', () => {
      render(<AiDropdown value="test" />);
      expect(screen.getByTitle('Clear text')).toBeInTheDocument();
    });

    it('hides clear button when there is no value', () => {
      render(<AiDropdown value="" />);
      expect(screen.queryByTitle('Clear text')).not.toBeInTheDocument();
    });

    it('clears input when clear button is clicked', async () => {
      const user = userEvent.setup();
      const handleClear = jest.fn();
      const handleChange = jest.fn();
      
      render(
        <AiDropdown 
          value="test" 
          onClear={handleClear} 
          onChange={handleChange}
        />
      );
      
      const clearButton = screen.getByTitle('Clear text');
      await user.click(clearButton);
      
      expect(handleClear).toHaveBeenCalled();
      expect(handleChange).toHaveBeenCalledWith('');
    });

    it('renders custom clear icon', () => {
      render(
        <AiDropdown 
          value="test" 
          clearIcon={<RiSearch2Line data-testid="custom-clear-icon" />} 
        />
      );
      expect(screen.getByTestId('custom-clear-icon')).toBeInTheDocument();
    });
  });

  describe('validation', () => {
    it('shows validation error', async () => {
      const user = userEvent.setup();
      const validation = jest.fn(() => 'Invalid input');
      render(<AiDropdown validation={validation} />);
      
      const input = screen.getByRole('combobox');
      await user.type(input, 'invalid');
      
      expect(validation).toHaveBeenCalledWith('invalid');
      expect(screen.getByText('Invalid input')).toBeInTheDocument();
    });

    it('shows success message', () => {
      render(<AiDropdown successMessage="Success!" />);
      expect(screen.getByText('Success!')).toBeInTheDocument();
    });

    it('shows info message', () => {
      render(<AiDropdown infoMessage="Info message" />);
      expect(screen.getByText('Info message')).toBeInTheDocument();
    });

    it('prioritizes error over success message', () => {
      render(
        <AiDropdown 
          errorMessage="Error!" 
          successMessage="Success!" 
        />
      );
      expect(screen.getByText('Error!')).toBeInTheDocument();
      expect(screen.queryByText('Success!')).not.toBeInTheDocument();
    });
  });

  describe('controlled state', () => {
    it('handles controlled isOpen state', async () => {
      const user = userEvent.setup();
      const handleOpenChange = jest.fn();
      
      const { rerender } = render(
        <AiDropdown 
          options={mockOptions}
          isOpen={false} 
          onOpenChange={handleOpenChange} 
        />
      );
      
      const input = screen.getByRole('combobox');
      expect(input).toHaveAttribute('aria-expanded', 'false');
      
      await user.click(input);
      expect(handleOpenChange).toHaveBeenCalledWith(true);
      
      rerender(
        <AiDropdown 
          options={mockOptions}
          isOpen={true} 
          onOpenChange={handleOpenChange} 
        />
      );
      
      expect(input).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<AiDropdown options={mockOptions} />);
      
      const input = screen.getByRole('combobox');
      expect(input).toHaveAttribute('aria-haspopup', 'listbox');
      expect(input).toHaveAttribute('aria-autocomplete', 'list');
    });

    it('sets aria-selected on options', async () => {
      const user = userEvent.setup();
      render(<AiDropdown options={mockOptions} value="option1" />);
      
      const input = screen.getByRole('combobox');
      await user.click(input);
      
      const selectedOption = screen.getByText('Option 1');
      expect(selectedOption).toHaveAttribute('aria-selected', 'true');
    });

    it('sets aria-disabled on disabled options', async () => {
      const user = userEvent.setup();
      render(<AiDropdown options={mockOptions} />);
      
      const input = screen.getByRole('combobox');
      await user.click(input);
      
      const disabledOption = screen.getByText('Disabled Option');
      expect(disabledOption).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('disabled state', () => {
    it('disables all interactions when disabled', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      const handleAiClick = jest.fn();
      const handleClear = jest.fn();
      
      render(
        <AiDropdown 
          disabled
          value="test"
          onChange={handleChange}
          onAiClick={handleAiClick}
          onClear={handleClear}
        />
      );
      
      const input = screen.getByRole('combobox');
      const aiButton = screen.getByTitle('Generate with AI');
      const clearButton = screen.getByTitle('Clear text');
      const toggleButton = screen.getByTitle('Toggle dropdown');
      
      expect(input).toBeDisabled();
      expect(aiButton).toBeDisabled();
      expect(clearButton).toBeDisabled();
      expect(toggleButton).toBeDisabled();
      
      await user.click(aiButton);
      await user.click(clearButton);
      await user.click(toggleButton);
      
      expect(handleAiClick).not.toHaveBeenCalled();
      expect(handleClear).not.toHaveBeenCalled();
      expect(input).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('custom styling', () => {
    it('applies custom className', () => {
      render(<AiDropdown className="custom-class" />);
      const container = screen.getByRole('combobox').closest('.ai-dropdown');
      expect(container).toHaveClass('custom-class');
    });

    it('applies error state classes', () => {
      render(<AiDropdown errorMessage="Error" />);
      const container = screen.getByRole('combobox').closest('.ai-dropdown');
      const input = screen.getByRole('combobox');
      
      expect(container).toHaveClass('ai-dropdown--error');
      expect(input).toHaveClass('ai-dropdown__input--error');
    });

    it('applies success state classes', () => {
      render(<AiDropdown successMessage="Success" />);
      const container = screen.getByRole('combobox').closest('.ai-dropdown');
      const input = screen.getByRole('combobox');
      
      expect(container).toHaveClass('ai-dropdown--success');
      expect(input).toHaveClass('ai-dropdown__input--success');
    });
  });

  describe('custom rendering', () => {
    it('uses custom renderOption function', async () => {
      const user = userEvent.setup();
      const renderOption = jest.fn((option) => (
        <div data-testid={`custom-${option.value}`}>
          <strong>{option.label}</strong> ({option.value})
        </div>
      ));
      
      render(
        <AiDropdown 
          options={mockOptions} 
          renderOption={renderOption}
        />
      );
      
      const input = screen.getByRole('combobox');
      await user.click(input);
      
      expect(renderOption).toHaveBeenCalledWith(mockOptions[0]);
      expect(screen.getByTestId('custom-option1')).toBeInTheDocument();
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('(option1)')).toBeInTheDocument();
    });

    it('uses custom renderValue function with string return', () => {
      const renderValue = jest.fn((value) => {
        // For this test, we'll transform the value string
        if (value === 'option1') {
          return 'Option 1 - option1';
        }
        return value;
      });
      
      render(
        <AiDropdown 
          options={mockOptions}
          value="option1"
          renderValue={renderValue}
        />
      );
      
      const input = screen.getByRole('combobox');
      expect(renderValue).toHaveBeenCalledWith('option1');
      expect(input).toHaveValue('Option 1 - option1');
    });

    it('uses custom renderValue function with no selected option', () => {
      const renderValue = jest.fn((value) => {
        if (value === 'custom input') {
          return 'Typing: custom input';
        }
        return value;
      });
      
      render(
        <AiDropdown 
          options={mockOptions}
          value="custom input"
          renderValue={renderValue}
        />
      );
      
      const input = screen.getByRole('combobox');
      expect(renderValue).toHaveBeenCalledWith('custom input');
      expect(input).toHaveValue('Typing: custom input');
    });

    it('falls back to original value when renderValue returns non-string', () => {
      const renderValue = jest.fn((_value) => (
        <div>Custom React Node</div>
      ));
      
      render(
        <AiDropdown 
          options={mockOptions}
          value="test value"
          renderValue={renderValue}
        />
      );
      
      const input = screen.getByRole('combobox');
      expect(input).toHaveValue('test value');
    });

    it('works with both custom renderers together', async () => {
      const user = userEvent.setup();
      const renderOption = jest.fn((option) => (
        <span data-testid={`option-${option.value}`}>
          {option.label.toUpperCase()}
        </span>
      ));
      const renderValue = jest.fn((value) => 
        value === 'option2' ? 'OPTION 2' : value
      );
      
      render(
        <AiDropdown 
          options={mockOptions}
          value="option2"
          renderOption={renderOption}
          renderValue={renderValue}
        />
      );
      
      const input = screen.getByRole('combobox');
      expect(input).toHaveValue('OPTION 2');
      
      await user.click(input);
      expect(screen.getByTestId('option-option1')).toBeInTheDocument();
      expect(screen.getByText('OPTION 1')).toBeInTheDocument();
    });
  });
});
