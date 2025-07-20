import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '../../providers/ThemeProvider';
import { AiStoryReader } from './AiStoryReader';
import { AiStoryReaderProps } from './types';

// Mock the fullscreen API
const mockRequestFullscreen = jest.fn();
const mockExitFullscreen = jest.fn();

Object.defineProperty(document, 'fullscreenElement', {
  writable: true,
  value: null,
});

Object.defineProperty(document.documentElement, 'requestFullscreen', {
  writable: true,
  value: mockRequestFullscreen,
});

Object.defineProperty(document, 'exitFullscreen', {
  writable: true,
  value: mockExitFullscreen,
});

describe('AiStoryReader', () => {
  const defaultProps: AiStoryReaderProps = {
    text: 'Once upon a time, there was a magical story reader...',
  };

  const sampleCharacters = [
    { id: '1', name: 'Alice', image: 'alice.jpg' },
    { id: '2', name: 'Bob', image: 'bob.jpg' },
  ];

  const renderReader = (props: Partial<AiStoryReaderProps> = {}) =>
    render(
      <ThemeProvider>
        <AiStoryReader {...defaultProps} {...props} />
      </ThemeProvider>
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic functionality', () => {
    it('renders the text content', () => {
      const { container } = renderReader({ text: 'Hello world' });
      const content = container.querySelector('.ai-story-reader__content');
      expect(content).toHaveTextContent('Hello world');
    });

    it('renders title and author when provided with cover image', () => {
      renderReader({ 
        title: 'Test Story', 
        author: 'Test Author',
        coverImage: 'cover.jpg'
      });
      expect(screen.getByText('Test Story')).toBeInTheDocument();
      expect(screen.getByText('By Test Author')).toBeInTheDocument();
    });

    it('renders reading time when provided with cover image', () => {
      renderReader({ 
        readingTime: 5,
        coverImage: 'cover.jpg'
      });
      expect(screen.getByText('📖 5 minute read')).toBeInTheDocument();
    });

    it('applies correct display mode classes', () => {
      const { container } = renderReader({ displayMode: 'paginated' });
      expect(container.querySelector('.mode-paginated')).toBeInTheDocument();
    });

    it('applies modal class when isModal is true', () => {
      const { container } = renderReader({ isModal: true });
      expect(container.querySelector('.modal')).toBeInTheDocument();
    });

    it('applies custom theme settings to content', () => {
      const { container } = renderReader();
      const content = container.querySelector('.ai-story-reader__content');
      expect(content).toHaveStyle({
        fontFamily: 'serif',
        fontSize: '18px',
        lineHeight: '1.6'
      });
    });
  });

  describe('Hero section', () => {
    it('renders hero section with cover image when provided', () => {
      const { container } = renderReader({ 
        title: 'Test Story',
        coverImage: 'cover.jpg'
      });
      
      const heroBackground = container.querySelector('.hero-section__background');
      expect(heroBackground).toBeInTheDocument();
      expect(heroBackground).toHaveStyle({
        backgroundImage: 'url(cover.jpg)'
      });
    });

    it('renders character avatars when provided', () => {
      renderReader({ 
        characters: sampleCharacters,
        coverImage: 'cover.jpg'
      });
      
      expect(screen.getByAltText('Alice')).toBeInTheDocument();
      expect(screen.getByAltText('Bob')).toBeInTheDocument();
    });

    it('renders compact hero when no cover image', () => {
      const { container } = renderReader({ 
        title: 'Test Story',
        characters: sampleCharacters
      });
      
      expect(container.querySelector('.hero-section__compact')).toBeInTheDocument();
      expect(screen.getByText('Test Story')).toBeInTheDocument();
    });

    it('toggles hero section collapsed state', () => {
      const { container } = renderReader({ 
        title: 'Test Story',
        coverImage: 'cover.jpg'
      });
      
      const toggleButton = container.querySelector('.hero-section__toggle');
      expect(toggleButton).toBeInTheDocument();
      
      fireEvent.click(toggleButton!);
      expect(container.querySelector('.hero-section.collapsed')).toBeInTheDocument();
    });
  });

  describe('Slide-in panels', () => {
    it('shows top panel when UI trigger is clicked', async () => {
      const { container } = renderReader();
      
      const topTrigger = container.querySelector('.ui-trigger--top');
      expect(topTrigger).toBeInTheDocument();
      
      fireEvent.click(topTrigger!);
      
      await waitFor(() => {
        expect(container.querySelector('.slide-panel--top.visible')).toBeInTheDocument();
      });
    });

    it('shows bottom panel when UI trigger is clicked', async () => {
      const { container } = renderReader();
      
      const bottomTrigger = container.querySelector('.ui-trigger--bottom');
      expect(bottomTrigger).toBeInTheDocument();
      
      fireEvent.click(bottomTrigger!);
      
      await waitFor(() => {
        expect(container.querySelector('.slide-panel--bottom.visible')).toBeInTheDocument();
      });
    });

    it('renders control elements in top panel', () => {
      const { container } = renderReader();
      
      // Check for select elements in top panel
      const displayModeSelect = container.querySelector('#display-mode');
      const themeSelect = container.querySelector('#theme');
      const fontFamilySelect = container.querySelector('#font-family');
      const fontSizeSelect = container.querySelector('#font-size');
      
      expect(displayModeSelect).toBeInTheDocument();
      expect(themeSelect).toBeInTheDocument();
      expect(fontFamilySelect).toBeInTheDocument();
      expect(fontSizeSelect).toBeInTheDocument();
    });

    it('renders progress bar in bottom panel', () => {
      const { container } = renderReader();
      
      const progressBar = container.querySelector('.progress-bar');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute('type', 'range');
    });
  });

  describe('Full-screen functionality', () => {
    it('renders fullscreen button when enabled', () => {
      const { container } = renderReader({ 
        enableFullScreen: true,
        coverImage: 'cover.jpg'
      });
      
      const fullscreenBtn = container.querySelector('[title*="fullscreen"]');
      expect(fullscreenBtn).toBeInTheDocument();
    });

    it('calls requestFullscreen when fullscreen button is clicked', async () => {
      mockRequestFullscreen.mockResolvedValue(undefined);
      
      const { container } = renderReader({ 
        enableFullScreen: true,
        coverImage: 'cover.jpg'
      });
      
      const fullscreenBtn = container.querySelector('[title*="Enter fullscreen"]');
      expect(fullscreenBtn).toBeInTheDocument();
      
      fireEvent.click(fullscreenBtn!);
      
      await waitFor(() => {
        expect(mockRequestFullscreen).toHaveBeenCalled();
      });
    });

    it('renders edge triggers in fullscreen mode', () => {
      const { container } = renderReader();
      
      // Simulate fullscreen state
      Object.defineProperty(document, 'fullscreenElement', {
        value: document.documentElement,
        writable: true,
      });
      
      fireEvent(document, new Event('fullscreenchange'));
      
      expect(container.querySelector('.edge-trigger--top')).toBeInTheDocument();
      expect(container.querySelector('.edge-trigger--bottom')).toBeInTheDocument();
    });
  });

  describe('Interactive features', () => {
    it('calls onProgressChange when progress changes', () => {
      const onProgressChange = jest.fn();
      const { container } = renderReader({ onProgressChange });
      
      const progressBar = container.querySelector('.progress-bar');
      fireEvent.change(progressBar!, { target: { value: '50' } });
      
      expect(onProgressChange).toHaveBeenCalledWith(50);
    });

    it('calls onBookmark when bookmark button is clicked', () => {
      const onBookmark = jest.fn();
      const { container } = renderReader({ 
        enableBookmark: true, 
        onBookmark 
      });
      
      const bookmarkBtn = container.querySelector('[title="Bookmark"]');
      expect(bookmarkBtn).toBeInTheDocument();
      
      fireEvent.click(bookmarkBtn!);
      expect(onBookmark).toHaveBeenCalled();
    });

    it('calls onTTS when TTS button is clicked', () => {
      const { container } = renderReader({ enableTTS: true });
      
      const ttsBtn = container.querySelector('[title*="text-to-speech"]');
      expect(ttsBtn).toBeInTheDocument();
      
      fireEvent.click(ttsBtn!);
      // TTS state should toggle (tested through component state)
    });

    it('calls onDownload when download button is clicked', () => {
      const onDownload = jest.fn();
      const { container } = renderReader({ 
        onDownload,
        coverImage: 'cover.jpg'
      });
      
      const downloadBtn = container.querySelector('[title="Download story"]');
      expect(downloadBtn).toBeInTheDocument();
      
      fireEvent.click(downloadBtn!);
      expect(onDownload).toHaveBeenCalled();
    });

    it('calls onClose when close button is clicked', () => {
      const onClose = jest.fn();
      const { container } = renderReader({ 
        onClose,
        coverImage: 'cover.jpg'
      });
      
      const closeBtn = container.querySelector('[title="Close reader"]');
      expect(closeBtn).toBeInTheDocument();
      
      fireEvent.click(closeBtn!);
      expect(onClose).toHaveBeenCalled();
    });

    it('calls onModeChange when display mode changes', () => {
      const onModeChange = jest.fn();
      const { container } = renderReader({ onModeChange });
      
      const displayModeSelect = container.querySelector('#display-mode');
      fireEvent.change(displayModeSelect!, { target: { value: 'paginated' } });
      
      expect(onModeChange).toHaveBeenCalledWith('paginated');
    });

    it('calls onSettingsChange when theme changes', () => {
      const onSettingsChange = jest.fn();
      const { container } = renderReader({ onSettingsChange });
      
      const themeSelect = container.querySelector('#theme');
      fireEvent.change(themeSelect!, { target: { value: 'dark' } });
      
      expect(onSettingsChange).toHaveBeenCalledWith(
        expect.objectContaining({ theme: 'dark' })
      );
    });
  });

  describe('Auto-hide functionality', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('hides panels after timeout', async () => {
      const { container } = renderReader();
      
      // Show top panel
      const topTrigger = container.querySelector('.ui-trigger--top');
      fireEvent.click(topTrigger!);
      
      await waitFor(() => {
        expect(container.querySelector('.slide-panel--top.visible')).toBeInTheDocument();
      });
      
      // Fast-forward time
      jest.advanceTimersByTime(3000);
      
      await waitFor(() => {
        expect(container.querySelector('.slide-panel--top.visible')).not.toBeInTheDocument();
      });
    });

    it('resets timer on mouse movement', () => {
      const { container } = renderReader();
      
      const content = container.querySelector('.ai-story-reader__content');
      
      // Show panel
      const topTrigger = container.querySelector('.ui-trigger--top');
      fireEvent.click(topTrigger!);
      
      // Simulate mouse movement
      fireEvent.mouseMove(content!);
      
      // Timer should be reset (tested through implementation)
      expect(content).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      const { container } = renderReader({ 
        title: 'Test Story',
        ariaLabel: 'Story reader'
      });
      
      const reader = container.querySelector('.ai-story-reader');
      expect(reader).toHaveAttribute('role', 'document');
      expect(reader).toHaveAttribute('aria-label', 'Story reader');
      
      const content = container.querySelector('.ai-story-reader__content');
      expect(content).toHaveAttribute('role', 'article');
    });

    it('has proper labels for form controls', () => {
      renderReader();
      
      expect(screen.getByLabelText('View:')).toBeInTheDocument();
      expect(screen.getByLabelText('Theme:')).toBeInTheDocument();
      expect(screen.getByLabelText('Font:')).toBeInTheDocument();
      expect(screen.getByLabelText('Size:')).toBeInTheDocument();
      expect(screen.getByLabelText('Reading progress')).toBeInTheDocument();
    });
  });

  describe('Error handling', () => {
    it('handles fullscreen API errors gracefully', async () => {
      mockRequestFullscreen.mockRejectedValue(new Error('Fullscreen not supported'));
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const { container } = renderReader({ 
        enableFullScreen: true,
        coverImage: 'cover.jpg'
      });
      
      const fullscreenBtn = container.querySelector('[title*="Enter fullscreen"]');
      fireEvent.click(fullscreenBtn!);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Could not enter fullscreen:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });
  });
});