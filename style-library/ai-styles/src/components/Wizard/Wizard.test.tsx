import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '../../providers/ThemeProvider';
import { Wizard, WizardStep } from './Wizard';

const mockSteps: WizardStep[] = [
  {
    title: 'Step 1',
    content: <div>This is step 1 content</div>,
  },
  {
    title: 'Step 2',
    content: <div>This is step 2 content</div>,
  },
  {
    title: 'Step 3',
    content: <div>This is step 3 content</div>,
  },
];

const renderWizard = (props: Partial<Parameters<typeof Wizard>[0]> = {}) => {
  const defaultProps = {
    steps: mockSteps,
    onClose: jest.fn(),
    onComplete: jest.fn(),
    open: true,
  };

  return render(
    <ThemeProvider>
      <Wizard {...defaultProps} {...props} />
    </ThemeProvider>
  );
};

describe('Wizard', () => {
  beforeEach(() => {
    // Create a div element to serve as the portal target
    const portalDiv = document.createElement('div');
    portalDiv.id = 'modal-root';
    document.body.appendChild(portalDiv);
  });

  afterEach(() => {
    // Clean up the portal div
    const portalDiv = document.getElementById('modal-root');
    if (portalDiv) {
      document.body.removeChild(portalDiv);
    }
  });

  it('renders when open is true', () => {
    renderWizard();
    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('This is step 1 content')).toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    renderWizard({ open: false });
    expect(screen.queryByText('Step 1')).not.toBeInTheDocument();
  });

  it('shows correct step progress', () => {
    renderWizard();
    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();
  });

  it('shows Next button on first step', () => {
    renderWizard();
    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.queryByText('Previous')).not.toBeInTheDocument();
  });

  it('navigates to next step when Next is clicked', () => {
    renderWizard();
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    
    expect(screen.getByText('Step 2')).toBeInTheDocument();
    expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();
  });

  it('shows Previous button on non-first steps', () => {
    renderWizard();
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    
    expect(screen.getByText('Previous')).toBeInTheDocument();
  });

  it('navigates to previous step when Previous is clicked', () => {
    renderWizard();
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    
    const previousButton = screen.getByText('Previous');
    fireEvent.click(previousButton);
    
    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();
  });

  it('shows Finish button on last step', () => {
    renderWizard();
    
    // Navigate to last step
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    
    expect(screen.getByText('Finish')).toBeInTheDocument();
    expect(screen.queryByText('Next')).not.toBeInTheDocument();
  });

  it('calls onComplete when Finish is clicked', () => {
    const onComplete = jest.fn();
    renderWizard({ onComplete });
    
    // Navigate to last step
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    
    fireEvent.click(screen.getByText('Finish'));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = jest.fn();
    renderWizard({ onClose });
    
    const closeButton = screen.getByLabelText('Close wizard');
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows Skip to Finish button when allowSkip is true', () => {
    renderWizard({ allowSkip: true });
    
    expect(screen.getByText('Skip to Finish')).toBeInTheDocument();
  });

  it('calls onComplete when Skip to Finish is clicked', () => {
    const onComplete = jest.fn();
    renderWizard({ allowSkip: true, onComplete });
    
    fireEvent.click(screen.getByText('Skip to Finish'));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('does not show Skip to Finish on last step even when allowSkip is true', () => {
    renderWizard({ allowSkip: true });
    
    // Navigate to last step
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    
    expect(screen.queryByText('Skip to Finish')).not.toBeInTheDocument();
    expect(screen.getByText('Finish')).toBeInTheDocument();
  });

  it('handles empty steps array', () => {
    renderWizard({ steps: [] });
    
    expect(screen.queryByText('Step 1')).not.toBeInTheDocument();
  });
});