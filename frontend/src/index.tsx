import '@drdata/ai-styles/styles'; // Import docomo library CSS
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import './shared/services/http'; // Initialize HTTP interceptors

const root = createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
