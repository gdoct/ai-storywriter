// src/components/ReadingPane/MarkdownViewer.tsx

import React from 'react';
import ReactMarkdown from 'react-markdown';
import './MarkDownViewer.css'; // We'll create this for the scrollbar styles

// Define the type for the component's props
interface MarkdownViewerProps {
  /** The markdown text content to display */
  content: string;
}

/**
 * A reusable component that displays markdown content within a scrollable container.
 */
const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content }) => {
  return (
    // This container is the key. Its CSS class will enable scrolling.
    <div className="markdown-scroll-container">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
};

export default MarkdownViewer;