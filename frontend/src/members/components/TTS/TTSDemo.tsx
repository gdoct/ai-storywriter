import React from 'react';
import TTSPlayer from './TTSPlayer';

/**
 * Demo component showing how to use the TTSPlayer
 * This can be removed once integrated into the application
 */
const TTSDemo: React.FC = () => {
  const sampleText = `
# Sample Story for TTS Demo

This is a **sample story** with *markdown formatting* to demonstrate the Text-to-Speech functionality.

## Chapter 1: The Beginning

Once upon a time, in a distant land, there lived a brave knight who embarked on an incredible journey. The knight faced many challenges:

- Fighting dragons
- Crossing treacherous rivers
- Solving ancient riddles

> "Courage is not the absence of fear, but action in spite of it."

The story continues with \`code snippets\` and [links](https://example.com) that will be properly handled by the TTS system.

## Chapter 2: The Adventure

The adventure was long and filled with excitement. The knight discovered magical artifacts and made new friends along the way.

**The End**
  `;

  const handleStatusChange = (status: 'idle' | 'playing' | 'paused' | 'error') => {
    console.log('TTS Status changed:', status);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Text-to-Speech Demo</h1>
      <p>
        This demo shows the TTSPlayer component in action. The component will:
      </p>
      <ul>
        <li>Strip markdown formatting for better speech</li>
        <li>Provide voice selection and speed controls</li>
        <li>Show progress and estimated reading time</li>
        <li>Handle long texts by chunking them properly</li>
      </ul>
      
      <TTSPlayer 
        text={sampleText}
        onStatusChange={handleStatusChange}
      />
      
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
        <h3>Original Text (with markdown):</h3>
        <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>
          {sampleText}
        </pre>
      </div>
    </div>
  );
};

export default TTSDemo;
