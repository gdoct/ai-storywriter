# AI TextBox Enhanced Usage Guide

The `AiTextBox` and `AiTextArea` components now support enhanced visual busy indicators for AI generation.

## New Props

### `aiGenerating?: boolean`
- Shows a spinning loader icon when `true`
- Adds pulsing animation to indicate active AI generation
- Automatically disables the AI button to prevent multiple concurrent requests
- Changes button title to "Generating..." when active

## Usage Examples

### Basic Usage with Busy State
```tsx
import { AiTextBox } from '@drdata/ai-styles';

function MyComponent() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [value, setValue] = useState('');

  const handleAiGenerate = async (inputValue: string) => {
    setIsGenerating(true);
    try {
      const result = await generateWithAI(inputValue);
      setValue(result);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AiTextBox
      value={value}
      onChange={setValue}
      onAiClick={handleAiGenerate}
      aiGenerating={isGenerating}
      placeholder="Enter your prompt..."
    />
  );
}
```

### AiTextArea Example
```tsx
import { AiTextArea } from '@drdata/ai-styles';

function StoryWriter() {
  const [story, setStory] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const generateStory = async (prompt: string) => {
    setIsGenerating(true);
    try {
      const generated = await aiService.generateStory(prompt);
      setStory(story + generated);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AiTextArea
      value={story}
      onChange={setStory}
      onAiClick={generateStory}
      aiGenerating={isGenerating}
      placeholder="Start writing your story..."
      size="l"
    />
  );
}
```

## Visual Enhancements

When `aiGenerating={true}`:
- 🔄 Spinning loader icon replaces the AI generate icon
- ✨ Subtle pulsing animation with blue glow effect
- ⏳ Button cursor changes to "wait"
- 🚫 Button becomes disabled to prevent multiple requests
- 📝 Tooltip changes to "Generating..."

## Accessibility Features

- `aria-busy="true"` attribute for screen readers
- Respects `prefers-reduced-motion` setting
- High contrast mode support
- Proper focus management