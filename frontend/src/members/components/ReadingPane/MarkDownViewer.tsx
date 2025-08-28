// src/components/ReadingPane/MarkdownViewer.tsx

import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import './MarkDownViewer.css'; // We'll create this for the scrollbar styles

// Define the type for the component's props
interface MarkdownViewerProps {
  /** The markdown text content to display */
  content: string;
  /** Whether the content is currently being generated/streaming */
  isGenerating?: boolean;
}

/**
 * A reusable component that displays markdown content within a scrollable container.
 * Includes auto-scroll functionality during content generation.
 */
const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content, isGenerating = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Auto-scroll to bottom when content changes during generation
  useEffect(() => {
    if (autoScroll && isGenerating && containerRef.current) {
      requestAnimationFrame(() => {
        if (containerRef.current && autoScroll) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
      });
    }
  }, [content, isGenerating, autoScroll]);

  // Reset auto-scroll when generation starts
  useEffect(() => {
    if (isGenerating) {
      setAutoScroll(true);
    }
  }, [isGenerating]);

  // Handle user scroll - disable auto-scroll if user scrolls up, enable if at bottom
  const handleScroll = () => {
    // Only manage auto-scroll during generation
    if (!isGenerating) return;
    
    const element = containerRef.current;
    if (!element) return;
    
    const { scrollTop, scrollHeight, clientHeight } = element;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 10; // 10px threshold
    
    setAutoScroll(isAtBottom);
  };

  return (
    // This container is the key. Its CSS class will enable scrolling.
    <div 
      className="markdown-scroll-container"
      ref={containerRef}
      onScroll={handleScroll}
    >
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
};

export default MarkdownViewer;